"use client";
import React, { useState } from "react";
import { BehavioralQuestion, Evaluation } from "@/context/InterviewContext";
import { ScoreRing } from "./ScoreRing";

interface QuestionCardProps {
    question: BehavioralQuestion;
    index: number;
    evaluation?: Evaluation;
    isActive?: boolean;
    onClick?: () => void;
}

const categoryBadgeStyle = (category: string): React.CSSProperties => {
    const colors: Record<string, [string, string]> = {
        Leadership: ["rgba(251,146,60,0.18)", "rgba(251,146,60,0.5)"],
        Conflict: ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.4)"],
        "Problem-Solving": ["rgba(99,102,241,0.18)", "rgba(99,102,241,0.5)"],
        Collaboration: ["rgba(34,211,165,0.15)", "rgba(34,211,165,0.4)"],
        Growth: ["rgba(250,204,21,0.15)", "rgba(250,204,21,0.4)"],
        Technical: ["rgba(56,189,248,0.15)", "rgba(56,189,248,0.4)"],
        Culture: ["rgba(192,132,252,0.15)", "rgba(192,132,252,0.4)"],
        Resilience: ["rgba(244,114,182,0.15)", "rgba(244,114,182,0.4)"],
    };
    const [bg, border] = colors[category] ?? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)"];
    return { background: bg, border: `1px solid ${border}` };
};

export function QuestionCard({ question, index, evaluation, isActive, onClick }: QuestionCardProps) {
    const [showTips, setShowTips] = useState(false);

    return (
        <div
            className={`glass-card ${isActive ? "active" : ""}`}
            onClick={onClick}
            style={{
                padding: "20px 24px",
                cursor: onClick ? "pointer" : "default",
                border: isActive
                    ? "1px solid rgba(99,102,241,0.5)"
                    : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {isActive && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "3px",
                        height: "100%",
                        background: "var(--gradient-primary)",
                    }}
                />
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                {/* Index badge */}
                <div
                    style={{
                        flexShrink: 0,
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive ? "var(--gradient-primary)" : "rgba(255,255,255,0.08)",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: isActive ? "white" : "var(--text-secondary)",
                    }}
                >
                    {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                    {/* Category */}
                    <span
                        style={{
                            ...categoryBadgeStyle(question.category),
                            padding: "3px 10px",
                            borderRadius: "100px",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            letterSpacing: "0.04em",
                            display: "inline-block",
                            marginBottom: "8px",
                            color: "var(--text-primary)",
                        }}
                    >
                        {question.category}
                    </span>

                    <p style={{ margin: 0, fontSize: "1rem", lineHeight: "1.5", color: "var(--text-primary)" }}>
                        {question.text}
                    </p>

                    {question.searchContext && (
                        <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            {question.searchContext}
                        </p>
                    )}

                    {/* Tips toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowTips((v) => !v); }}
                        style={{
                            marginTop: "10px",
                            background: "none",
                            border: "none",
                            color: "var(--accent-secondary)",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        {showTips ? "▲" : "▼"} Interviewer tips
                    </button>

                    {showTips && (
                        <p
                            style={{
                                margin: "8px 0 0",
                                padding: "12px",
                                background: "rgba(34,211,165,0.06)",
                                borderLeft: "3px solid var(--accent-secondary)",
                                borderRadius: "0 8px 8px 0",
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                            }}
                        >
                            {question.tips}
                        </p>
                    )}
                </div>

                {/* Score rings */}
                {evaluation && (
                    <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                        <ScoreRing score={evaluation.overallScore} label="Score" size={72} strokeWidth={6} />
                    </div>
                )}
            </div>
        </div>
    );
}
