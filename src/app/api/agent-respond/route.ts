import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAgentRespondPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { phase, transcript, jobProfile, conversationHistory, resumeText } = await req.json();

        const prompt = getAgentRespondPrompt(jobProfile, phase, transcript, conversationHistory, resumeText);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        let text = completion.choices[0].message.content?.trim() || "";
        
        // Cleanup for TTS (remove any accidental markdown, asterisks, etc)
        text = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "").replace(/---/g, "");

        return NextResponse.json({ text });
    } catch (err) {
        console.error("[agent-respond]", err);
        return NextResponse.json({ error: "Failed to generate recruiter response." }, { status: 500 });
    }
}
