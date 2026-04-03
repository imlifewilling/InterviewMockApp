"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

/* ============================================================
   TYPES
   ============================================================ */
export interface JobProfile {
    company: string;
    role: string;
    seniority: string;
    skills: string[];
    cultureSignals: string[];
    rawDescription: string;
}

export interface BehavioralQuestion {
    id: string;
    text: string;
    category: string;
    tips: string;
    searchContext?: string;   // "Often reported at [Company]"
}

export interface Recording {
    questionId: string;
    videoBlob?: Blob;
    transcript?: string;
    durationSeconds: number;
}

export interface Evaluation {
    questionId: string;
    contentScore: number;       // 0–100
    deliveryScore: number;      // 0–100
    overallScore: number;       // 0–100
    feedback: string;
    strengths: string[];
    improvements: string[];
    suggestedAnswer?: string;
}

export type SessionPhase = "idle" | "READY" | "GREETING" | "INTERVIEW" | "CANDIDATE_QA" | "WRAP_UP" | "done";

export interface InterviewState {
    jobUrl: string;
    jobProfile: JobProfile | null;
    questions: BehavioralQuestion[];
    resumeFile: File | null;
    resumeDataUrl: string | null;
    recordings: Record<string, Recording>;
    evaluations: Record<string, Evaluation>;
    sessionPhase: SessionPhase;
    currentQuestionIndex: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: InterviewState = {
    jobUrl: "",
    jobProfile: null,
    questions: [],
    resumeFile: null,
    resumeDataUrl: null,
    recordings: {},
    evaluations: {},
    sessionPhase: "idle",
    currentQuestionIndex: 0,
    isLoading: false,
    error: null,
};

/* ============================================================
   ACTIONS
   ============================================================ */
type Action =
    | { type: "SET_JOB_URL"; payload: string }
    | { type: "SET_JOB_PROFILE"; payload: JobProfile }
    | { type: "SET_QUESTIONS"; payload: BehavioralQuestion[] }
    | { type: "SET_RESUME"; payload: { file: File; dataUrl: string } }
    | { type: "ADD_RECORDING"; payload: Recording }
    | { type: "ADD_EVALUATION"; payload: Evaluation }
    | { type: "SET_SESSION_PHASE"; payload: SessionPhase }
    | { type: "SET_QUESTION_INDEX"; payload: number }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "RESET" };

function reducer(state: InterviewState, action: Action): InterviewState {
    switch (action.type) {
        case "SET_JOB_URL":
            return { ...state, jobUrl: action.payload };
        case "SET_JOB_PROFILE":
            return { ...state, jobProfile: action.payload };
        case "SET_QUESTIONS":
            return { ...state, questions: action.payload };
        case "SET_RESUME":
            return { ...state, resumeFile: action.payload.file, resumeDataUrl: action.payload.dataUrl };
        case "ADD_RECORDING":
            return {
                ...state,
                recordings: { ...state.recordings, [action.payload.questionId]: action.payload },
            };
        case "ADD_EVALUATION":
            return {
                ...state,
                evaluations: { ...state.evaluations, [action.payload.questionId]: action.payload },
            };
        case "SET_SESSION_PHASE":
            return { ...state, sessionPhase: action.payload };
        case "SET_QUESTION_INDEX":
            return { ...state, currentQuestionIndex: action.payload };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload, error: null };
        case "SET_ERROR":
            return { ...state, error: action.payload, isLoading: false };
        case "RESET":
            return initialState;
        default:
            return state;
    }
}

/* ============================================================
   CONTEXT
   ============================================================ */
interface InterviewContextValue {
    state: InterviewState;
    dispatch: React.Dispatch<Action>;
}

const InterviewContext = createContext<InterviewContextValue | undefined>(undefined);

const SESSION_KEY = "interview_session_state";

export function InterviewProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState, () => {
        if (typeof window !== "undefined") {
            try {
                const saved = sessionStorage.getItem(SESSION_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Don't restore blobs (non-serializable); restore everything else
                    return {
                        ...initialState,
                        ...parsed,
                        recordings: {},      // blobs can't be serialized
                        resumeFile: null,    // File can't be serialized
                    };
                }
            } catch { }
        }
        return initialState;
    });

    // Persist to sessionStorage on state change (skip non-serializable items)
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const persisted = {
                    ...state,
                    recordings: {},
                    resumeFile: null,
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(persisted));
            } catch { }
        }
    }, [state]);

    return (
        <InterviewContext.Provider value={{ state, dispatch }}>
            {children}
        </InterviewContext.Provider>
    );
}

export function useInterview(): InterviewContextValue {
    const ctx = useContext(InterviewContext);
    if (!ctx) throw new Error("useInterview must be used within <InterviewProvider>");
    return ctx;
}
