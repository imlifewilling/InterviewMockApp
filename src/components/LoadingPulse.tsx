"use client";
import React from "react";

interface LoadingPulseProps {
    message?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingPulse({ message = "Loading…", size = "md" }: LoadingPulseProps) {
    const dotSize = size === "sm" ? "8px" : size === "lg" ? "16px" : "12px";
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            borderRadius: "50%",
                            background: "var(--accent-primary)",
                            display: "inline-block",
                            animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>
            {message && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>{message}</p>
            )}
            <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
