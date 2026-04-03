"use client";

import { useRef, useState, useCallback } from "react";

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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const resolveRef = useRef<((blob: Blob) => void) | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: true,
            });
            setStream(mediaStream);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Camera access denied";
            setError(msg);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            setStream(null);
        }
    }, [stream]);

    const startRecording = useCallback(() => {
        if (!stream) return;
        chunksRef.current = [];

        // Pick a supported MIME type
        const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
            (m) => MediaRecorder.isTypeSupported(m)
        ) ?? "";

        const recorder = new MediaRecorder(stream, {
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

        recorder.start(250); // collect in 250ms chunks
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    }, [stream]);

    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            if (mediaRecorderRef.current?.state !== "inactive") {
                mediaRecorderRef.current?.stop();
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
