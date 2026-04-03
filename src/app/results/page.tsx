"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/context/InterviewContext";
import { ScoreRing } from "@/components/ScoreRing";
import { QuestionCard } from "@/components/QuestionCard";

export default function ResultsPage() {
    const router = useRouter();
    const { state, dispatch } = useInterview();
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    const evaluations = Object.values(state.evaluations);
    const hasEvaluations = evaluations.length > 0;

    const avgContent = hasEvaluations
        ? Math.round(evaluations.reduce((s, e) => s + e.contentScore, 0) / evaluations.length)
        : 0;
    const avgDelivery = hasEvaluations
        ? Math.round(evaluations.reduce((s, e) => s + e.deliveryScore, 0) / evaluations.length)
        : 0;
    const avgOverall = hasEvaluations
        ? Math.round(evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length)
        : 0;

    const gradeLabel = avgOverall >= 80 ? "Excellent" : avgOverall >= 65 ? "Good" : avgOverall >= 50 ? "Fair" : "Needs Work";
    const gradeColor = avgOverall >= 80 ? "#22d3a5" : avgOverall >= 65 ? "#f59e0b" : avgOverall >= 50 ? "#f97316" : "#ef4444";

    const handleReset = () => {
        dispatch({ type: "RESET" });
        router.push("/");
    };

    if (!hasEvaluations) {
        return (
            <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>No evaluations yet. Complete the interview session first.</p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button className="btn" onClick={() => router.push("/session")}>← Go to Session</button>
                        <button className="btn btn-primary" onClick={() => router.push("/")}>Start Over</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ minHeight: "100vh", padding: "32px 20px", maxWidth: "900px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ margin: "0 0 4px", fontSize: "1.8rem", fontWeight: "800", color: "var(--text-primary)" }}>
                        Interview Results
                    </h1>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        {state.jobProfile?.role} at {state.jobProfile?.company}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn" onClick={() => router.push("/prep")} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                        ← Back to Prep
                    </button>
                    <button className="btn btn-primary" onClick={handleReset} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                        New Session
                    </button>
                </div>
            </div>

            {/* Score Summary Card */}
            <div
                className="glass-card"
                style={{
                    padding: "32px",
                    marginBottom: "28px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,165,0.08) 100%)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                    {/* Overall score big ring */}
                    <div style={{ textAlign: "center" }}>
                        <ScoreRing score={avgOverall} label="Overall" size={140} strokeWidth={12} />
                        <div
                            style={{
                                marginTop: "8px",
                                padding: "4px 16px",
                                borderRadius: "100px",
                                display: "inline-block",
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                color: gradeColor,
                                background: `${gradeColor}20`,
                                border: `1px solid ${gradeColor}40`,
                            }}
                        >
                            {gradeLabel}
                        </div>
                    </div>

                    {/* Sub scores */}
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                        <ScoreRing score={avgContent} label="Content" size={100} strokeWidth={9} />
                        <ScoreRing score={avgDelivery} label="Delivery" size={100} strokeWidth={9} />
                    </div>

                    {/* Summary text */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                            {evaluations.length} question{evaluations.length !== 1 ? "s" : ""} evaluated
                        </h3>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                            {avgOverall >= 75
                                ? "Strong performance! You're showing great preparation."
                                : avgOverall >= 55
                                    ? "Solid foundation with room to sharpen your STAR structure and specificity."
                                    : "Keep practising — focus on concrete examples with measurable results."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Per-Question Breakdown */}
            <h2 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
                Question-by-Question Breakdown
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {state.questions.map((q, i) => {
                    const ev = state.evaluations[q.id];
                    if (!ev) return null;
                    const isOpen = expandedQuestion === q.id;

                    return (
                        <div key={q.id}>
                            <QuestionCard
                                question={q}
                                index={i}
                                evaluation={ev}
                                onClick={() => setExpandedQuestion(isOpen ? null : q.id)}
                            />

                            {isOpen && (
                                <div
                                    style={{
                                        marginTop: "4px",
                                        padding: "20px 24px",
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: "12px",
                                        marginLeft: "46px",
                                    }}
                                >
                                    {/* Score chips */}
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                                        {[
                                            ["Content", ev.contentScore],
                                            ["Delivery", ev.deliveryScore],
                                            ["Overall", ev.overallScore],
                                        ].map(([label, score]) => (
                                            <span
                                                key={label}
                                                style={{
                                                    padding: "4px 12px",
                                                    borderRadius: "100px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600",
                                                    background: "rgba(255,255,255,0.06)",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {label}: <strong style={{ color: "var(--text-primary)" }}>{score}</strong>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Feedback */}
                                    <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                        {ev.feedback}
                                    </p>

                                    {/* Strengths & Improvements */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <p style={{ margin: "0 0 8px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#22d3a5", fontWeight: "700" }}>
                                                Strengths
                                            </p>
                                            <ul style={{ margin: 0, paddingLeft: "16px" }}>
                                                {ev.strengths.map((s) => (
                                                    <li key={s} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px", lineHeight: 1.4 }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p style={{ margin: "0 0 8px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#f97316", fontWeight: "700" }}>
                                                Improvements
                                            </p>
                                            <ul style={{ margin: 0, paddingLeft: "16px" }}>
                                                {ev.improvements.map((s) => (
                                                    <li key={s} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px", lineHeight: 1.4 }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Suggested answer */}
                                    {ev.suggestedAnswer && (
                                        <div
                                            style={{
                                                marginTop: "16px",
                                                padding: "14px",
                                                background: "rgba(99,102,241,0.07)",
                                                border: "1px solid rgba(99,102,241,0.2)",
                                                borderRadius: "10px",
                                            }}
                                        >
                                            <p style={{ margin: "0 0 6px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)", fontWeight: "700" }}>
                                                Ideal Answer
                                            </p>
                                            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                                {ev.suggestedAnswer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer CTA */}
            <div style={{ marginTop: "40px", textAlign: "center" }}>
                <button className="btn btn-primary" onClick={() => router.push("/session")} style={{ padding: "14px 32px", fontSize: "1rem", marginRight: "12px" }}>
                    Practice Again
                </button>
                <button className="btn" onClick={handleReset} style={{ padding: "14px 32px", fontSize: "1rem" }}>
                    Analyze a New Job
                </button>
            </div>
        </main>
    );
}
