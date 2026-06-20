import { NextRequest } from "next/server";

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "company";
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const companyName = params.get("companyName") || "Uploaded Plan";
  const planYear = params.get("planYear") || "Not visible in filing";
  const fileName = `${safeFileName(companyName)}_401k_plan_review.docx`;
  const body = [
    "5500 Analyzer - 401(k) Plan Review",
    `${companyName} | ${planYear}`,
    "",
    "DOCX generation is a placeholder in this MVP.",
    "The real DOCX generator will map extracted plan data into the Everhart template."
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
