"use client";
import React, { useRef, useState } from "react";
import { useInterview } from "@/context/InterviewContext";

export function ResumeUpload() {
    const { state, dispatch } = useInterview();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = async (file: File) => {
        if (!file) return;
        // Read as data URL for Gemini vision later
        const reader = new FileReader();
        reader.onload = () => {
            dispatch({
                type: "SET_RESUME",
                payload: { file, dataUrl: reader.result as string },
            });
        };
        reader.readAsDataURL(file);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }}
                onChange={onInputChange}
            />
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? "var(--accent-primary)" : state.resumeFile ? "var(--accent-secondary)" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: "12px",
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragging ? "rgba(99,102,241,0.06)" : "transparent",
                    transition: "all 0.2s ease",
                }}
            >
                {state.resumeFile ? (
                    <>
                        <div style={{ fontSize: "2rem" }}>📄</div>
                        <p style={{ margin: "8px 0 0", color: "var(--accent-secondary)", fontWeight: "600" }}>
                            {state.resumeFile.name}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Click to replace
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: "2rem" }}>📎</div>
                        <p style={{ margin: "8px 0 4px", color: "var(--text-primary)", fontWeight: "500" }}>
                            Upload your resume
                        </p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            PDF, DOC, DOCX, TXT — drag & drop or click
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
