import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getEvaluateAnswerPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { question, transcript, durationSeconds, jobProfile, resumeText } = await req.json();

        if (!question || !transcript) {
            return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
        }

        const prompt = getEvaluateAnswerPrompt(jobProfile, question.text, question.category, transcript, durationSeconds, resumeText);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        const text = completion.choices[0].message.content?.trim() || "";
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const evaluation = JSON.parse(jsonStr);

        return NextResponse.json(evaluation);
    } catch (err) {
        console.error("[evaluate-answer]", err);
        return NextResponse.json({ error: "Failed to evaluate answer." }, { status: 500 });
    }
}
