"use client";
import React from "react";

interface ScoreRingProps {
    score: number; // 0-100
    label: string;
    size?: number;
    strokeWidth?: number;
}

export function ScoreRing({ score, label, size = 100, strokeWidth = 8 }: ScoreRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Color based on score
    const color =
        score >= 80 ? "#22d3a5" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
            }}
        >
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease-in-out, stroke 0.3s" }}
                />
                {/* Score text (counter-rotated) */}
                <text
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                        transform: `rotate(90deg)`,
                        transformOrigin: `${size / 2}px ${size / 2}px`,
                        fontSize: size * 0.22,
                        fontWeight: "700",
                        fill: color,
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    {score}
                </text>
            </svg>
            <span
                style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                }}
            >
                {label}
            </span>
        </div>
    );
}
