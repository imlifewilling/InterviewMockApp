import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSuggestedAnswerPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { question, jobProfile, resumeText } = await req.json();

        if (!question) {
            return NextResponse.json({ error: "Missing question" }, { status: 400 });
        }

        const prompt = getSuggestedAnswerPrompt(jobProfile, question.text, question.category, question.tips, resumeText);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        const text = completion.choices[0].message.content?.trim() || "";
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const response = JSON.parse(jsonStr);

        return NextResponse.json(response);
    } catch (err) {
        console.error("[suggested-answer]", err);
        return NextResponse.json({ error: "Failed to generate suggested answer." }, { status: 500 });
    }
}
