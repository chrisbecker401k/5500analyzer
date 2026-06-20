import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extractPlanAnalysisFromText } from "@/services/form5500FieldMapper";

export const runtime = "nodejs";

class ServerDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[]) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
    }
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }

  translateSelf(x = 0, y = 0) {
    this.e += Number(x) || 0;
    this.f += Number(y) || 0;
    return this;
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= Number(scaleX) || 1;
    this.d *= Number(scaleY) || 1;
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    return this;
  }
}

function installPdfServerPolyfills() {
  const globalScope = globalThis as Record<string, unknown>;

  globalScope.DOMMatrix ??= ServerDOMMatrix;
  globalScope.ImageData ??= class ServerImageData {};
  globalScope.Path2D ??= class ServerPath2D {};
}

async function extractPdfText(buffer: Buffer) {
  installPdfServerPolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).toString();
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: true
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ")
    );
  }

  await document.cleanup();
  return pages.join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);
    const analysis = extractPlanAnalysisFromText(text, file.name);

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF extraction error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
