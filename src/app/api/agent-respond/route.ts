import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAgentRespondPrompt } from "@/utils/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { phase, transcript, jobProfile, conversationHistory } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = getAgentRespondPrompt(jobProfile, phase, transcript, conversationHistory);

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        
        // Minor cleanup for TTS (remove any accidental markdown, asterisks for bolding, etc)
        text = text.replace(/\\*\\*/g, "").replace(/\\*/g, "").replace(/#/g, "");

        return NextResponse.json({ text });
    } catch (err) {
        console.error("[agent-respond]", err);
        return NextResponse.json({ error: "Failed to generate recruiter response." }, { status: 500 });
    }
}
