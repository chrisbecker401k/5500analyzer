import { NextRequest, NextResponse } from "next/server";
import { extractPlanAnalysisFromText } from "@/services/form5500FieldMapper";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const analysis = extractPlanAnalysisFromText(parsed.text, file.name);

  return NextResponse.json(analysis);
}
