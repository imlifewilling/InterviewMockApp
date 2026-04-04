import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Missing resume file" }, { status: 400 });
        }

        const fileName = file.name;
        const mimeType = file.type || "application/octet-stream";

        console.log(`[parse-resume] Processing file: ${fileName}, MIME: ${mimeType}, Size: ${file.size} bytes`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let resumeText = "";

        // Handle different file types
        if (mimeType === "text/plain") {
            resumeText = buffer.toString("utf-8");
        } else if (mimeType === "application/pdf") {
            try {
                // @ts-ignore
                const pdfParser = new PDFParser(null, 1);
                resumeText = await new Promise<string>((resolve, reject) => {
                    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                    pdfParser.on("pdfParser_dataReady", () => {
                        resolve(pdfParser.getRawTextContent());
                    });
                    pdfParser.parseBuffer(buffer);
                });
                console.log(`[parse-resume] Extracted ${resumeText.length} chars from PDF`);
            } catch (pdfErr) {
                console.error("[parse-resume] PDF parsing failed:", pdfErr);
                return NextResponse.json({
                    resumeText: `Resume uploaded: ${fileName}. PDF text extraction failed — please try a .txt version.`,
                    partial: true,
                });
            }
        } else if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword"
        ) {
            return NextResponse.json({
                resumeText: `Resume uploaded: ${fileName}. For best results, please upload a PDF or TXT version.`,
                partial: true,
            });
        } else {
            return NextResponse.json({
                resumeText: `Resume uploaded: ${fileName}. Format (${mimeType}) not fully supported — please use PDF or TXT.`,
                partial: true,
            });
        }

        // Clean up extracted text
        resumeText = resumeText
            .replace(/----------------Page \(\d+\) Break----------------/g, "")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " ")
            .trim();

        if (resumeText.length < 50) {
            return NextResponse.json({
                resumeText: `Resume uploaded: ${fileName}. Could not extract enough text — the PDF may be image-based. Try a text-based PDF.`,
                partial: true,
            });
        }

        // Truncate to reasonable length for LLM context
        if (resumeText.length > 6000) {
            resumeText = resumeText.slice(0, 6000);
        }

        console.log(`[parse-resume] Success — ${resumeText.length} chars extracted from ${fileName}`);
        return NextResponse.json({ resumeText });
    } catch (err) {
        console.error("[parse-resume]", err);
        return NextResponse.json({ error: "Failed to parse resume." }, { status: 500 });
    }
}
