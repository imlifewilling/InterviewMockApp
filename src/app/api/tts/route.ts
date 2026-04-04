import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        // Truncate to OpenAI TTS limit (4096 chars)
        const truncated = text.slice(0, 4096);

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "nova",      // Professional female voice
            input: truncated,
            response_format: "mp3",
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": buffer.length.toString(),
            },
        });
    } catch (err) {
        console.error("[tts]", err);
        return NextResponse.json({ error: "TTS generation failed." }, { status: 500 });
    }
}
