"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/context/InterviewContext";
import { useJobAnalysis } from "@/hooks/useJobAnalysis";
import { LoadingPulse } from "@/components/LoadingPulse";
import { ResumeUpload } from "@/components/ResumeUpload";

export default function HomePage() {
    const router = useRouter();
    const { state, dispatch } = useInterview();
    const { analyzeJob, generateQuestions, isAnalyzing, isGenerating, error } = useJobAnalysis();
    const [url, setUrl] = useState(state.jobUrl || "");

    const isLoading = isAnalyzing || isGenerating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        const profile = await analyzeJob(url.trim());
        if (!profile) return;

        await generateQuestions(profile);
        router.push("/prep");
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Animated orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />

            <div style={{ maxWidth: "640px", width: "100%", position: "relative", zIndex: 1 }}>
                {/* Logo / Brand */}
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "14px",
                                background: "var(--gradient-accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.6rem",
                                boxShadow: "0 0 30px rgba(99,102,241,0.4)",
                            }}
                        >
                            🎯
                        </div>
                        <span
                            style={{
                                fontSize: "1.7rem",
                                fontWeight: "800",
                                background: "var(--gradient-accent)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            InterviewAI
                        </span>
                    </div>

                    <h1
                        style={{
                            margin: "0 0 16px",
                            fontSize: "clamp(2rem, 5vw, 3rem)",
                            fontWeight: "800",
                            lineHeight: 1.15,
                            color: "var(--text-primary)",
                        }}
                    >
                        Ace Your Next
                        <span
                            style={{
                                display: "block",
                                background: "var(--gradient-accent)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Interview
                        </span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", margin: 0 }}>
                        Paste a job link. Get tailored behavioral questions. Practice with AI coaching.
                    </p>
                </div>

                {/* Main Card */}
                <div className="glass-card" style={{ padding: "32px" }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* URL Input */}
                        <div>
                            <label
                                htmlFor="job-url"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "var(--text-secondary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                Job Posting URL
                            </label>
                            <input
                                id="job-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://jobs.company.com/position/12345"
                                required
                                disabled={isLoading}
                                style={{
                                    width: "100%",
                                    padding: "14px 18px",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "var(--text-primary)",
                                    fontSize: "1rem",
                                    outline: "none",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "var(--accent-primary)";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        {/* Resume Upload (optional) */}
                        <div>
                            <p
                                style={{
                                    marginBottom: "8px",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "var(--text-secondary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                Resume <span style={{ fontWeight: "400", color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(optional — for personalized answers)</span>
                            </p>
                            <ResumeUpload />
                        </div>

                        {/* Error */}
                        {error && !isLoading && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    color: "#ef4444",
                                    fontSize: "0.88rem",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !url.trim()}
                            style={{ padding: "16px", fontSize: "1rem", fontWeight: "700" }}
                        >
                            {isLoading ? "" : "Analyze Job & Generate Questions →"}
                        </button>

                        {isLoading && (
                            <LoadingPulse
                                message={isAnalyzing ? "Analyzing job posting…" : "Parsing resume & generating tailored questions…"}
                            />
                        )}
                    </form>
                </div>

                {/* Feature Row */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginTop: "24px",
                    }}
                >
                    {[
                        { icon: "🎯", text: "AI-tailored questions" },
                        { icon: "📹", text: "Record & transcribe" },
                        { icon: "💡", text: "STAR-format coaching" },
                    ].map(({ icon, text }) => (
                        <div
                            key={text}
                            style={{
                                padding: "14px",
                                borderRadius: "12px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                textAlign: "center",
                                fontSize: "0.82rem",
                                color: "var(--text-muted)",
                            }}
                        >
                            <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>{icon}</div>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
