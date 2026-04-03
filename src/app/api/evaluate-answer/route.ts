import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEvaluateAnswerPrompt } from "@/utils/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { question, transcript, durationSeconds, jobProfile } = await req.json();

        if (!question || !transcript) {
            return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = getEvaluateAnswerPrompt(jobProfile, question.text, question.category, transcript, durationSeconds);

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const evaluation = JSON.parse(jsonStr);

        return NextResponse.json(evaluation);
    } catch (err) {
        console.error("[evaluate-answer]", err);
        return NextResponse.json({ error: "Failed to evaluate answer." }, { status: 500 });
    }
}
