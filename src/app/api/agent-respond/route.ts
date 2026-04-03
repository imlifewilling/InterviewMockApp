import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAgentRespondPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { phase, transcript, jobProfile, conversationHistory } = await req.json();

        const prompt = getAgentRespondPrompt(jobProfile, phase, transcript, conversationHistory);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        let text = completion.choices[0].message.content?.trim() || "";
        
        // Minor cleanup for TTS (remove any accidental markdown, asterisks for bolding, etc)
        text = text.replace(/\\*\\*/g, "").replace(/\\*/g, "").replace(/#/g, "");

        return NextResponse.json({ text });
    } catch (err) {
        console.error("[agent-respond]", err);
        return NextResponse.json({ error: "Failed to generate recruiter response." }, { status: 500 });
    }
}
