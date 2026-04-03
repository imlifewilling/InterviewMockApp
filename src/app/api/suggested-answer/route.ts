import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSuggestedAnswerPrompt } from "@/utils/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { question, jobProfile, resumeText } = await req.json();

        if (!question) {
            return NextResponse.json({ error: "Missing question" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = getSuggestedAnswerPrompt(jobProfile, question.text, question.category, question.tips, resumeText);

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const response = JSON.parse(jsonStr);

        return NextResponse.json(response);
    } catch (err) {
        console.error("[suggested-answer]", err);
        return NextResponse.json({ error: "Failed to generate suggested answer." }, { status: 500 });
    }
}
