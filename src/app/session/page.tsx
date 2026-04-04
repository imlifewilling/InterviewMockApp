"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/context/InterviewContext";
import { useCamera } from "@/hooks/useCamera";
import { CameraRecorder } from "@/components/CameraRecorder";
import { QuestionCard } from "@/components/QuestionCard";
import { LoadingPulse } from "@/components/LoadingPulse";

export default function SessionPage() {
    const router = useRouter();
    const { state, dispatch } = useInterview();
    const { stream, isRecording, startRecording, stopRecording, startCamera, stopCamera, error } = useCamera();
    const [evaluating, setEvaluating] = useState(false);
    const [currentRecording, setCurrentRecording] = useState<{ blob: Blob; duration: number; transcript: string; } | null>(null);

    // Conversational states
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const [timeIsUp, setTimeIsUp] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
    const [conversationHistory, setConversationHistory] = useState<string>("");
    
    // Q&A mode states
    const [qaRecordings, setQaRecordings] = useState<{ transcript: string, duration: number, blob: Blob } | null>(null);

    // Track current audio for cleanup
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const currentQuestion = state.questions[state.currentQuestionIndex];
    const totalQuestions = state.questions.length;
    const isLastQuestion = state.currentQuestionIndex >= totalQuestions - 1;

    // Start camera
    useEffect(() => {
        startCamera();
        return () => { 
            stopCamera(); 
        };
    }, [startCamera, stopCamera]);

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
        };
    }, []);

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setTimeIsUp(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const speak = useCallback(async (text: string, onEnd?: () => void) => {
        // Stop any currently playing audio
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setAgentSpeaking(true);
        console.log("[InterviewAI] Speaking via OpenAI TTS:", text.slice(0, 80) + "...");

        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) {
                throw new Error(`TTS API error: ${res.status}`);
            }

            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                setAgentSpeaking(false);
                console.log("[InterviewAI] TTS playback finished.");
                if (onEnd) onEnd();
            };

            audio.onerror = (e) => {
                console.error("[InterviewAI] Audio playback error:", e);
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                setAgentSpeaking(false);
                if (onEnd) onEnd();
            };

            await audio.play();
            console.log("[InterviewAI] TTS audio playing...");
        } catch (err) {
            console.error("[InterviewAI] TTS failed, falling back to speechSynthesis:", err);
            // Fallback to browser speechSynthesis
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1;
                utterance.onend = () => { setAgentSpeaking(false); if (onEnd) onEnd(); };
                utterance.onerror = () => { setAgentSpeaking(false); if (onEnd) onEnd(); };
                window.speechSynthesis.speak(utterance);
            } else {
                setAgentSpeaking(false);
                if (onEnd) onEnd();
            }
        }
    }, []);

    // End of interview wrap up
    const triggerWrapUp = useCallback(async () => {
        dispatch({ type: "SET_SESSION_PHASE", payload: "WRAP_UP" });
        try {
            const res = await fetch("/api/agent-respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phase: "WRAP_UP", jobProfile: state.jobProfile, resumeText: state.resumeText })
            });
            const data = await res.json();
            speak(data.text || "We are out of time. Thank you for your time today.", () => {
                 dispatch({ type: "SET_SESSION_PHASE", payload: "done" });
                 router.push("/results");
            });
        } catch {
            dispatch({ type: "SET_SESSION_PHASE", payload: "done" });
            router.push("/results");
        }
    }, [dispatch, router, speak, state.jobProfile, state.resumeText]);

    // Tracking for fetching greeting
    const isFetchingGreetingReq = useRef(false);

    // Phase management
    useEffect(() => {
        // Wait until camera is active to begin the conversation, prevents talking while auth prompt is open
        if (!stream) return;

        if (state.sessionPhase === "GREETING") {
            if (isFetchingGreetingReq.current) return;
            isFetchingGreetingReq.current = true;
            const fetchGreeting = async () => {
                try {
                    const res = await fetch("/api/agent-respond", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phase: "GREETING", jobProfile: state.jobProfile, resumeText: state.resumeText })
                    });
                    const data = await res.json();
                    speak(data.text || "Hello, I am the recruiter. Let's begin the interview.", () => {
                        dispatch({ type: "SET_SESSION_PHASE", payload: "INTERVIEW" });
                    });
                } catch {
                    dispatch({ type: "SET_SESSION_PHASE", payload: "INTERVIEW" });
                }
            };
            fetchGreeting();
        } else if (state.sessionPhase === "INTERVIEW") {
            if (currentQuestion) {
                 // Slight delay before speaking the question
                 setTimeout(() => {
                     speak(currentQuestion.text);
                 }, 500);
            }
        }
    }, [state.sessionPhase, state.jobProfile, state.resumeText, currentQuestion, dispatch, speak, stream]);

    const handleRecordingComplete = (blob: Blob, duration: number, transcript: string) => {
        if (state.sessionPhase === "CANDIDATE_QA") {
            setQaRecordings({ blob, duration, transcript });
        } else {
            setCurrentRecording({ blob, duration, transcript });
            if (currentQuestion) {
                dispatch({
                    type: "ADD_RECORDING",
                    payload: { questionId: currentQuestion.id, videoBlob: blob, durationSeconds: duration, transcript },
                });
            }
        }
    };

    const handleQuestionSubmit = useCallback(async () => {
        if (!currentRecording || !currentQuestion) return;
        setEvaluating(true);

        try {
            const res = await fetch("/api/evaluate-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: currentQuestion,
                    transcript: currentRecording.transcript,
                    durationSeconds: currentRecording.duration,
                    jobProfile: state.jobProfile,
                    resumeText: state.resumeText,
                }),
            });

            const evaluation = await res.json();
            dispatch({
                type: "ADD_EVALUATION",
                payload: { questionId: currentQuestion.id, ...evaluation },
            });
        } catch {
            // silently fail evaluation
        } finally {
            setEvaluating(false);
            setCurrentRecording(null);

            if (timeIsUp) {
                triggerWrapUp();
            } else if (isLastQuestion) {
                 // Move to Candidate QA
                 dispatch({ type: "SET_SESSION_PHASE", payload: "CANDIDATE_QA" });
                 speak("Thank you for your answers. We have some time left. Do you have any questions for me about the role or the company?", () => {});
            } else {
                 dispatch({ type: "SET_QUESTION_INDEX", payload: state.currentQuestionIndex + 1 });
                 speak("Thank you. Moving to the next question.");
            }
        }
    }, [currentRecording, currentQuestion, dispatch, isLastQuestion, state.currentQuestionIndex, state.jobProfile, state.resumeText, timeIsUp, triggerWrapUp, speak]);

    const handleQASubmit = useCallback(async () => {
         if (!qaRecordings) return;
         setEvaluating(true);
         try {
             // Add to conversation history
             const updatedHistory = conversationHistory + `\nCandidate: "${qaRecordings.transcript}"`;
             setConversationHistory(updatedHistory);
             
             const res = await fetch("/api/agent-respond", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ 
                    phase: "CANDIDATE_QA", 
                    jobProfile: state.jobProfile,
                    transcript: qaRecordings.transcript,
                    conversationHistory: updatedHistory,
                    resumeText: state.resumeText
                 })
             });
             const data = await res.json();
             
             setConversationHistory(prev => prev + `\nRecruiter: "${data.text}"`);
             
             speak(data.text || "That's a very good question.", () => {
                 setEvaluating(false);
                 setQaRecordings(null);
                 if (timeIsUp) {
                     triggerWrapUp();
                 }
             });
         } catch {
             setEvaluating(false);
             setQaRecordings(null);
         }
    }, [qaRecordings, conversationHistory, state.jobProfile, state.resumeText, speak, timeIsUp, triggerWrapUp]);

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (state.questions.length === 0) {
        return (
            <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>No questions found.</p>
                    <button className="btn btn-primary" onClick={() => router.push("/")}>← Start Over</button>
                </div>
            </main>
        );
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "24px 20px",
                maxWidth: "900px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "auto 1fr",
                gap: "20px",
                alignContent: "start",
            }}
        >
            {/* Extended Progress Header */}
            <div
                style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button className="btn" onClick={() => { if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; } router.push("/prep"); }} style={{ padding: "8px 14px", fontSize: "0.82rem" }}>
                        ← Back
                    </button>
                    {state.sessionPhase === "READY" && (
                         <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                            Ready to Start
                        </h1>
                    )}
                    {state.sessionPhase === "GREETING" && (
                         <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                            Interview Initialization
                        </h1>
                    )}
                    {state.sessionPhase === "INTERVIEW" && (
                         <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                            Question {state.currentQuestionIndex + 1} / {totalQuestions}
                        </h1>
                    )}
                    {state.sessionPhase === "CANDIDATE_QA" && (
                         <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                            Candidate Q&A Phase
                        </h1>
                    )}
                </div>

                {/* Agent Speaking Indicator */}
                {agentSpeaking && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(99,102,241,0.15)", padding: "6px 12px", borderRadius: "100px", border: "1px solid rgba(99,102,241,0.3)" }}>
                        <div className="record-pulse" style={{ background: "var(--color-accent-1)", width: "8px", height: "8px" }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--color-accent-1)", fontWeight: "600" }}>Recruiter Speaking...</span>
                    </div>
                )}

                {/* Global Timer */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <span style={{ fontSize: "0.9rem", color: timeIsUp ? "var(--color-danger)" : "var(--text-primary)", fontWeight: "600" }}>
                         Time Left: {formatTimer(timeLeft)}
                     </span>
                     {(state.sessionPhase === "INTERVIEW" || state.sessionPhase === "CANDIDATE_QA") && (
                         <button className="btn btn-secondary" onClick={triggerWrapUp} style={{ padding: "8px 14px", fontSize: "0.82rem" }}>
                             End Interview
                         </button>
                     )}
                </div>
            </div>

            {/* LEFT: Context + Controls */}
            <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {state.sessionPhase === "READY" && (
                    <div className="glass-card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                        <h2 style={{ fontSize: "1.4rem", margin: 0, color: "var(--text-primary)" }}>Permissions Granted</h2>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            Your camera and microphone are ready. Click below to begin your interview.
                        </p>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                dispatch({ type: "SET_SESSION_PHASE", payload: "GREETING" });
                            }} 
                            style={{ padding: "14px 32px", fontSize: "1.05rem", fontWeight: "bold" }}
                        >
                            🎬 Start Interview Now
                        </button>
                    </div>
                )}
                {state.sessionPhase === "GREETING" && (
                    <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
                        <LoadingPulse message="Recruiter is reviewing your profile and greeting you..." />
                    </div>
                )}
                {state.sessionPhase === "WRAP_UP" && (
                    <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
                        <LoadingPulse message="Wrapping up interview and preparing final results..." />
                    </div>
                )}
                {state.sessionPhase === "INTERVIEW" && currentQuestion && (
                    <>
                        <QuestionCard
                            question={currentQuestion}
                            index={state.currentQuestionIndex}
                            isActive
                        />
                        {/* Recording submitted state */}
                        {currentRecording && !evaluating && (
                            <div
                                style={{
                                    padding: "20px",
                                    background: "rgba(34,211,165,0.06)",
                                    border: "1px solid rgba(34,211,165,0.25)",
                                    borderRadius: "12px",
                                }}
                            >
                                <p style={{ margin: "0 0 8px", fontWeight: "600", color: "var(--color-success)" }}>
                                    ✓ Answer Recorded ({currentRecording.duration}s)
                                </p>
                                {currentRecording.transcript && (
                                    <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                        &ldquo;{currentRecording.transcript.slice(0, 200)}{currentRecording.transcript.length > 200 ? "…" : ""}&rdquo;
                                    </p>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={handleQuestionSubmit}
                                    style={{ width: "100%", padding: "12px" }}
                                >
                                    Submit Answer →
                                </button>
                            </div>
                        )}
                        {evaluating && (
                            <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
                                <LoadingPulse message="Evaluating your answer..." />
                            </div>
                        )}
                    </>
                )}
                {state.sessionPhase === "CANDIDATE_QA" && (
                    <>
                        <div className="glass-card" style={{ padding: "24px", border: "1px solid rgba(99,102,241,0.5)" }}>
                            <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px", color: "var(--text-primary)" }}>Your questions for the recruiter</h2>
                            <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                Feel free to ask about the culture, the role, or next steps. Press "Start Recording" when you're ready to speak.
                            </p>
                        </div>

                         {/* QA Recording submitted state */}
                         {qaRecordings && !evaluating && !agentSpeaking && (
                            <div
                                style={{
                                    padding: "20px",
                                    background: "rgba(99,102,241,0.06)",
                                    border: "1px solid rgba(99,102,241,0.25)",
                                    borderRadius: "12px",
                                }}
                            >
                                <p style={{ margin: "0 0 8px", fontWeight: "600", color: "var(--color-accent-1)" }}>
                                    ✓ Question Recorded ({qaRecordings.duration}s)
                                </p>
                                {qaRecordings.transcript && (
                                    <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                        &ldquo;{qaRecordings.transcript.slice(0, 200)}{qaRecordings.transcript.length > 200 ? "…" : ""}&rdquo;
                                    </p>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={handleQASubmit}
                                    style={{ width: "100%", padding: "12px" }}
                                >
                                    Ask Recruiter →
                                </button>
                            </div>
                        )}
                        
                        {evaluating && (
                            <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
                                <LoadingPulse message="Recruiter is thinking..." />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* RIGHT: Camera */}
            <div>
                 {(state.sessionPhase === "INTERVIEW" || state.sessionPhase === "CANDIDATE_QA" || state.sessionPhase === "READY") ? (
                    <div style={{ opacity: agentSpeaking ? 0.6 : 1, transition: "opacity 0.3s", pointerEvents: agentSpeaking ? "none" : "auto" }}>
                        <CameraRecorder
                            stream={stream}
                            isRecording={isRecording}
                            onStartRecording={startRecording}
                            onStopRecording={stopRecording}
                            error={error}
                            questionId={state.sessionPhase === "CANDIDATE_QA" ? "qa_phase" : currentQuestion?.id || "unknown"}
                            onRecordingComplete={handleRecordingComplete}
                        />
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ borderRadius: "16px", background: "#000", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                         <div className="record-pulse" style={{ background: "rgba(255,255,255,0.2)", width: "20px", height: "20px" }} />
                    </div>
                )}
            </div>
        </main>
    );
}
