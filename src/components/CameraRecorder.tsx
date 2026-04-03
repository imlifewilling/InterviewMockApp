"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";

interface CameraRecorderProps {
    questionId: string;
    onRecordingComplete: (blob: Blob, durationSeconds: number, transcript: string) => void;
}

export function CameraRecorder({ questionId, onRecordingComplete }: CameraRecorderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { stream, isRecording, startRecording, stopRecording, error } = useCamera();
    const startTimeRef = useRef<number | null>(null);
    const recognitionRef = useRef<any>(null);
    const [transcript, setTranscript] = useState("");
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Timer for recording duration
    useEffect(() => {
        if (isRecording) {
            setTimer(0);
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const handleStart = async () => {
        setTranscript("");
        startTimeRef.current = Date.now();

        // Web Speech API for live transcription
        if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition: any = new SR();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            let finalTranscript = "";
            recognition.onresult = (event: any) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
                    else interim += event.results[i][0].transcript;
                }
                setTranscript(finalTranscript + interim);
            };
            recognition.start();
            recognitionRef.current = recognition;
        }

        await startRecording();
    };

    const handleStop = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        const blob = await stopRecording();
        if (!blob) return;
        const duration = startTimeRef.current
            ? Math.round((Date.now() - startTimeRef.current) / 1000)
            : 0;
        onRecordingComplete(blob, duration, transcript);
    };

    if (error) {
        return (
            <div style={{ padding: "20px", background: "rgba(239,68,68,0.1)", borderRadius: "12px", color: "#ef4444" }}>
                <strong>Camera Error:</strong> {error}
                <br />
                <small>Please allow camera & microphone access and reload.</small>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Video preview */}
            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Recording indicator */}
                {isRecording && (
                    <div
                        style={{
                            position: "absolute",
                            top: "14px",
                            left: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(0,0,0,0.6)",
                            padding: "6px 12px",
                            borderRadius: "100px",
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        <span
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#ef4444",
                                animation: "blink 1s ease infinite",
                            }}
                        />
                        <span style={{ color: "#fff", fontSize: "0.8rem", fontWeight: "600" }}>
                            REC {formatTime(timer)}
                        </span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "12px" }}>
                {!isRecording ? (
                    <button className="btn btn-primary" onClick={handleStart} style={{ flex: 1 }}>
                        ● Start Recording
                    </button>
                ) : (
                    <button
                        className="btn"
                        onClick={handleStop}
                        style={{
                            flex: 1,
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.4)",
                            color: "#ef4444",
                        }}
                    >
                        ■ Stop & Submit
                    </button>
                )}
            </div>

            {/* Live transcript */}
            {(isRecording || transcript) && (
                <div
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                    }}
                >
                    <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Live Transcript
                    </p>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5, minHeight: "40px" }}>
                        {transcript || <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Listening…</span>}
                    </p>
                </div>
            )}

            <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
        </div>
    );
}
