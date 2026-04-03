import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAnalyzeJobPrompt } from "@/utils/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
        }

        // Fetch the job page content
        let pageText = "";
        try {
            const res = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                },
                signal: AbortSignal.timeout(15000),
            });
            const html = await res.text();
            // Strip HTML tags to get plain text
            pageText = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s{2,}/g, " ")
                .trim()
                .slice(0, 12000); // limit context
        } catch {
            return NextResponse.json(
                { error: "Failed to fetch the job URL. Make sure it is publicly accessible." },
                { status: 422 }
            );
        }

        const prompt = getAnalyzeJobPrompt(pageText);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        const text = completion.choices[0].message.content?.trim() || "";

        // Strip markdown code fences if present
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const jobProfile = JSON.parse(jsonStr);

        return NextResponse.json(jobProfile);
    } catch (err) {
        console.error("[analyze-job]", err);
        return NextResponse.json({ error: "Failed to analyze job posting." }, { status: 500 });
    }
}
