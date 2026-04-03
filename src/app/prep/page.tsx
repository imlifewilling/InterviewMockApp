"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/context/InterviewContext";
import { JobCard } from "@/components/JobCard";
import { QuestionCard } from "@/components/QuestionCard";
import { LoadingPulse } from "@/components/LoadingPulse";

export default function PrepPage() {
    const router = useRouter();
    const { state, dispatch } = useInterview();
    const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Record<string, { suggestedAnswer: string; starBreakdown: Record<string, string>; keyPoints: string[] }>>({});

    if (!state.jobProfile) {
        return (
            <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>No job analyzed yet.</p>
                    <button className="btn btn-primary" onClick={() => router.push("/")}>← Go back</button>
                </div>
            </main>
        );
    }

    const handleGetSuggestion = async (questionId: string) => {
        if (suggestions[questionId]) return;
        setLoadingSuggestion(questionId);
        try {
            const question = state.questions.find((q) => q.id === questionId);
            let resumeText: string | null = null;

            if (state.resumeDataUrl) {
                resumeText = "Resume attached (binary). Please generate a strong generic STAR answer.";
            }

            const res = await fetch("/api/suggested-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, jobProfile: state.jobProfile, resumeText }),
            });
            const data = await res.json();
            setSuggestions((prev) => ({ ...prev, [questionId]: data }));
        } catch {
            // silently fail
        } finally {
            setLoadingSuggestion(null);
        }
    };

    const handleStartSession = () => {
        // Unlock speech synthesis with actual text to prevent queue from hanging
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Connecting");
            utterance.volume = 0.01; // nearly silent, but Chrome requires > 0 to process naturally
            window.speechSynthesis.speak(utterance);
        }
        dispatch({ type: "SET_QUESTION_INDEX", payload: 0 });
        dispatch({ type: "SET_SESSION_PHASE", payload: "READY" });
        router.push("/session");
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "32px 20px",
                maxWidth: "860px",
                margin: "0 auto",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
                <button
                    className="btn"
                    onClick={() => router.push("/")}
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                    ← Analyze Another Job
                </button>

                <button
                    className="btn btn-primary"
                    onClick={handleStartSession}
                    style={{ padding: "12px 28px", fontSize: "1rem", fontWeight: "700" }}
                >
                    🎬 Start Mock Interview
                </button>
            </div>

            {/* Job Profile */}
            <div style={{ marginBottom: "28px" }}>
                <JobCard job={state.jobProfile} />
            </div>

            {/* Questions Header */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    Your {state.questions.length} Interview Questions
                </h2>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Tailored to the role, sourced from real interview reports. Click a question to see a suggested answer.
                </p>
            </div>

            {/* Question List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {state.questions.map((q, i) => (
                    <div key={q.id}>
                        <QuestionCard
                            question={q}
                            index={i}
                            evaluation={state.evaluations[q.id]}
                        />

                        {/* Suggested Answer */}
                        <div style={{ marginTop: "4px", paddingLeft: "46px" }}>
                            {!suggestions[q.id] ? (
                                <button
                                    className="btn"
                                    onClick={() => handleGetSuggestion(q.id)}
                                    disabled={loadingSuggestion === q.id}
                                    style={{
                                        padding: "6px 14px",
                                        fontSize: "0.8rem",
                                        marginTop: "4px",
                                        background: "rgba(99,102,241,0.1)",
                                        border: "1px solid rgba(99,102,241,0.25)",
                                        color: "var(--accent-primary)",
                                    }}
                                >
                                    {loadingSuggestion === q.id ? "Generating…" : "✨ Get suggested answer"}
                                </button>
                            ) : (
                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "16px 18px",
                                        background: "rgba(99,102,241,0.06)",
                                        border: "1px solid rgba(99,102,241,0.2)",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Suggested STAR Answer
                                    </p>
                                    <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                                        {suggestions[q.id]?.suggestedAnswer}
                                    </p>
                                    {/* STAR breakdown */}
                                    {suggestions[q.id]?.starBreakdown && (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                                            {Object.entries(suggestions[q.id].starBreakdown).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    style={{
                                                        padding: "10px 12px",
                                                        background: "rgba(255,255,255,0.03)",
                                                        borderRadius: "8px",
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-secondary)", fontWeight: "700" }}>
                                                        {key}
                                                    </span>
                                                    <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {state.questions.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <LoadingPulse message="Loading questions…" />
                </div>
            )}

            {/* Bottom CTA */}
            {state.questions.length > 0 && (
                <div style={{ marginTop: "32px", textAlign: "center" }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartSession}
                        style={{ padding: "16px 40px", fontSize: "1.1rem", fontWeight: "700" }}
                    >
                        🎬 Start Mock Interview
                    </button>
                </div>
            )}
        </main>
    );
}
