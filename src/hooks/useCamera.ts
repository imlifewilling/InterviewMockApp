"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface UseCameraReturn {
    stream: MediaStream | null;
    isRecording: boolean;
    videoBlob: Blob | null;
    previewUrl: string | null;
    error: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    startRecording: () => void;
    stopRecording: () => Promise<Blob>;
    clearRecording: () => void;
}

export function useCamera(): UseCameraReturn {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const isStartingRef = useRef(false);
    const mountedRef = useRef(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const resolveRef = useRef<((blob: Blob) => void) | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const startCamera = useCallback(async () => {
        if (streamRef.current || isStartingRef.current) return;
        isStartingRef.current = true;
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: true,
            });
            
            if (!mountedRef.current) {
                mediaStream.getTracks().forEach((t) => t.stop());
                return;
            }
            if (streamRef.current) {
                mediaStream.getTracks().forEach((t) => t.stop());
                return;
            }
            
            streamRef.current = mediaStream;
            setStream(mediaStream);
        } catch (err) {
            if (mountedRef.current) {
                const msg = err instanceof Error ? err.message : "Camera access denied";
                setError(msg);
            }
        } finally {
            if (mountedRef.current) {
                isStartingRef.current = false;
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setStream(null);
        isStartingRef.current = false;
    }, []);

    const startRecording = useCallback(() => {
        if (!streamRef.current) {
            console.error("No stream available for recording");
            return;
        }
        chunksRef.current = [];

        const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
            (m) => MediaRecorder.isTypeSupported(m)
        ) ?? "";

        try {
            const recorder = new MediaRecorder(streamRef.current, {
                mimeType: mimeType || undefined,
                videoBitsPerSecond: 500_000,
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
                const url = URL.createObjectURL(blob);
                setVideoBlob(blob);
                setPreviewUrl(url);
                setIsRecording(false);
                if (resolveRef.current) {
                    resolveRef.current(blob);
                    resolveRef.current = null;
                }
            };

            recorder.start(250);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to start MediaRecorder:", err);
            setError("Failed to start recording. Camera might be engaged elsewhere.");
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            if (mediaRecorderRef.current?.state !== "inactive") {
                mediaRecorderRef.current?.stop();
            } else {
                // Return empty blob if already inactive
                resolve(new Blob([], { type: "video/webm" }));
            }
        });
    }, []);

    const clearRecording = useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setVideoBlob(null);
        setPreviewUrl(null);
        chunksRef.current = [];
    }, [previewUrl]);

    return {
        stream,
        isRecording,
        videoBlob,
        previewUrl,
        error,
        startCamera,
        stopCamera,
        startRecording,
        stopRecording,
        clearRecording,
    };
}
