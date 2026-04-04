"use client";

import { useState, useCallback } from "react";
import { useInterview } from "@/context/InterviewContext";
import type { JobProfile, BehavioralQuestion } from "@/context/InterviewContext";

export function useJobAnalysis() {
    const { state, dispatch } = useInterview();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeJob = useCallback(async (url: string): Promise<JobProfile | null> => {
        setIsAnalyzing(true);
        setError(null);
        dispatch({ type: "SET_LOADING", payload: true });

        try {
            const res = await fetch("/api/analyze-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Failed to analyze job (${res.status})`);
            }

            const profile: JobProfile = await res.json();
            dispatch({ type: "SET_JOB_PROFILE", payload: profile });
            dispatch({ type: "SET_JOB_URL", payload: url });
            return profile;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(msg);
            dispatch({ type: "SET_ERROR", payload: msg });
            return null;
        } finally {
            setIsAnalyzing(false);
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, [dispatch]);

    const parseResume = useCallback(async (): Promise<string | null> => {
        // If resume text is already parsed, return it
        if (state.resumeText) return state.resumeText;
        
        // If no resume uploaded, return null
        if (!state.resumeDataUrl) return null;

        try {
            console.log("[InterviewAI] Parsing resume...");
            const res = await fetch("/api/parse-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeDataUrl: state.resumeDataUrl,
                    fileName: state.resumeFile?.name || "resume",
                }),
            });

            if (!res.ok) {
                console.warn("[InterviewAI] Resume parsing failed:", res.status);
                return null;
            }

            const data = await res.json();
            const resumeText = data.resumeText || null;
            
            if (resumeText) {
                dispatch({ type: "SET_RESUME_TEXT", payload: resumeText });
                console.log("[InterviewAI] Resume parsed successfully:", resumeText.slice(0, 100) + "...");
            }
            
            return resumeText;
        } catch (err) {
            console.warn("[InterviewAI] Resume parsing error:", err);
            return null;
        }
    }, [state.resumeText, state.resumeDataUrl, state.resumeFile, dispatch]);

    const generateQuestions = useCallback(async (profile: JobProfile): Promise<BehavioralQuestion[]> => {
        setIsGenerating(true);
        setError(null);

        try {
            // Parse resume first if available
            let resumeText: string | null = null;
            if (state.resumeDataUrl) {
                resumeText = state.resumeText;
                if (!resumeText) {
                    // Parse resume inline
                    try {
                        const parseRes = await fetch("/api/parse-resume", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                resumeDataUrl: state.resumeDataUrl,
                                fileName: state.resumeFile?.name || "resume",
                            }),
                        });
                        if (parseRes.ok) {
                            const parseData = await parseRes.json();
                            resumeText = parseData.resumeText || null;
                            if (resumeText) {
                                dispatch({ type: "SET_RESUME_TEXT", payload: resumeText });
                            }
                        }
                    } catch {
                        console.warn("[InterviewAI] Resume parsing skipped");
                    }
                }
            }

            const res = await fetch("/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobProfile: profile, resumeText }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Failed to generate questions (${res.status})`);
            }

            const { questions }: { questions: BehavioralQuestion[] } = await res.json();
            dispatch({ type: "SET_QUESTIONS", payload: questions });
            return questions;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(msg);
            return [];
        } finally {
            setIsGenerating(false);
        }
    }, [dispatch, state.resumeDataUrl, state.resumeFile, state.resumeText]);

    return { analyzeJob, generateQuestions, parseResume, isAnalyzing, isGenerating, error };
}
