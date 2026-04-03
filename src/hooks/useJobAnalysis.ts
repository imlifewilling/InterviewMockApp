"use client";

import { useState, useCallback } from "react";
import { useInterview } from "@/context/InterviewContext";
import type { JobProfile, BehavioralQuestion } from "@/context/InterviewContext";

export function useJobAnalysis() {
    const { dispatch } = useInterview();
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

    const generateQuestions = useCallback(async (profile: JobProfile): Promise<BehavioralQuestion[]> => {
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobProfile: profile }),
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
    }, [dispatch]);

    return { analyzeJob, generateQuestions, isAnalyzing, isGenerating, error };
}
