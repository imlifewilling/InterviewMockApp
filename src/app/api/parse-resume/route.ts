import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { resumeDataUrl, fileName } = await req.json();

        if (!resumeDataUrl) {
            return NextResponse.json({ error: "Missing resume data" }, { status: 400 });
        }

        // Use GPT-4o-mini vision to extract text from the resume
        // Works with PDF rendered as images, doc screenshots, etc.
        const prompt = `Extract ALL text content from this resume document. Return the complete text exactly as it appears, preserving the structure (sections, bullet points, dates, etc.). Include everything: name, contact info, summary, experience, education, skills, certifications, projects — every single detail.

If the document is not readable or not a resume, return "UNREADABLE".

Return ONLY the extracted text, no commentary.`;

        // Determine MIME type from data URL
        const mimeMatch = resumeDataUrl.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";

        // For text-based files, we can extract directly
        if (mimeType === "text/plain") {
            const base64 = resumeDataUrl.split(",")[1];
            const text = Buffer.from(base64, "base64").toString("utf-8");
            return NextResponse.json({ resumeText: text });
        }

        // For PDFs and docs, use GPT-4o vision to extract text
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: resumeDataUrl,
                                detail: "high",
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4000,
        });

        const resumeText = completion.choices[0].message.content?.trim() || "";

        if (resumeText === "UNREADABLE" || resumeText.length < 50) {
            // Fallback: just send the filename as minimal context
            return NextResponse.json({ 
                resumeText: `Resume uploaded: ${fileName || "resume"}. Could not extract full text content.`,
                partial: true 
            });
        }

        return NextResponse.json({ resumeText });
    } catch (err) {
        console.error("[parse-resume]", err);
        return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
    }
}
