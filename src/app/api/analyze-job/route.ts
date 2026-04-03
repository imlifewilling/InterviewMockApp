import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAnalyzeJobPrompt } from "@/utils/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = getAnalyzeJobPrompt(pageText);

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Strip markdown code fences if present
        const jsonStr = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
        const jobProfile = JSON.parse(jsonStr);

        return NextResponse.json(jobProfile);
    } catch (err) {
        console.error("[analyze-job]", err);
        return NextResponse.json({ error: "Failed to analyze job posting." }, { status: 500 });
    }
}
