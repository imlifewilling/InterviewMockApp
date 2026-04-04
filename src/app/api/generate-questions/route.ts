import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getGenerateQuestionsPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { jobProfile, resumeText } = await req.json();
        if (!jobProfile) {
            return NextResponse.json({ error: "Missing jobProfile" }, { status: 400 });
        }

        const { company, role, seniority, skills, cultureSignals } = jobProfile;
        const prompt = getGenerateQuestionsPrompt(company, role, seniority, skills, cultureSignals);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        const text = completion.choices[0].message.content?.trim() || "";

        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const questions = JSON.parse(jsonStr);

        return NextResponse.json({ questions });
    } catch (err) {
        console.error("[generate-questions]", err);
        return NextResponse.json({ error: "Failed to generate questions." }, { status: 500 });
    }
}
