import React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import { InterviewProvider } from "@/context/InterviewContext";

export const metadata: Metadata = {
    title: "InterviewAI — Ace Your Next Behavioral Interview",
    description:
        "AI-powered mock interview prep. Paste a job URL, practice with tailored behavioral questions, record your answers, and get instant AI feedback.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                {/* Animated background orbs */}
                <div className="bg-orbs" aria-hidden="true">
                    <div className="bg-orb bg-orb-1" />
                    <div className="bg-orb bg-orb-2" />
                    <div className="bg-orb bg-orb-3" />
                </div>
                <InterviewProvider>
                    <div className="page-content">{children}</div>
                </InterviewProvider>
            </body>
        </html>
    );
}
