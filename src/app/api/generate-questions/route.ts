import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGenerateQuestionsPrompt } from "@/utils/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { jobProfile } = await req.json();
        if (!jobProfile) {
            return NextResponse.json({ error: "Missing jobProfile" }, { status: 400 });
        }

        // Use gemini-1.5-flash with Google Search grounding to find company-specific questions
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            // @ts-ignore tools typing
            tools: [{ googleSearch: {} }],
        });

        const { company, role, seniority, skills, cultureSignals } = jobProfile;

        const prompt = getGenerateQuestionsPrompt(company, role, seniority, skills, cultureSignals);

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const questions = JSON.parse(jsonStr);

        return NextResponse.json({ questions });
    } catch (err) {
        console.error("[generate-questions]", err);
        return NextResponse.json({ error: "Failed to generate questions." }, { status: 500 });
    }
}
