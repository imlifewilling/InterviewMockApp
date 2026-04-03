"use client";
import React from "react";
import { JobProfile } from "@/context/InterviewContext";

interface JobCardProps {
    job: JobProfile;
}

const categoryColors: Record<string, string> = {
    company: "var(--accent-primary)",
    skill: "var(--accent-secondary)",
    culture: "rgba(139,92,246,0.6)",
};

export function JobCard({ job }: JobCardProps) {
    return (
        <div className="glass-card" style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "1.4rem",
                            fontWeight: "700",
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {job.role}
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "1rem" }}>
                        {job.company}
                    </p>
                </div>
                <span
                    style={{
                        padding: "4px 14px",
                        borderRadius: "100px",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        letterSpacing: "0.04em",
                        background: "rgba(99,102,241,0.18)",
                        color: "var(--accent-primary)",
                        border: "1px solid rgba(99,102,241,0.3)",
                    }}
                >
                    {job.seniority}
                </span>
            </div>

            {/* Skills */}
            <div style={{ marginTop: "20px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Key Skills
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {job.skills?.map((s) => (
                        <span
                            key={s}
                            style={{
                                padding: "4px 12px",
                                borderRadius: "100px",
                                fontSize: "0.8rem",
                                background: "rgba(34,211,165,0.12)",
                                color: categoryColors.skill,
                                border: "1px solid rgba(34,211,165,0.2)",
                            }}
                        >
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Culture */}
            {job.cultureSignals?.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Culture
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {job.cultureSignals.map((c) => (
                            <span
                                key={c}
                                style={{
                                    padding: "4px 12px",
                                    borderRadius: "100px",
                                    fontSize: "0.8rem",
                                    background: "rgba(139,92,246,0.12)",
                                    color: categoryColors.culture,
                                    border: "1px solid rgba(139,92,246,0.2)",
                                }}
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
