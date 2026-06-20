import { NextRequest } from "next/server";

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value: string | null) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not visible in filing";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(numberValue);
}

function numberLabel(value: string | null) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not visible in filing";
  return new Intl.NumberFormat("en-US").format(numberValue);
}

function percentLabel(value: string | null) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not visible in filing";
  return `${numberValue.toFixed(1)}%`;
}

function bpsLabel(value: string | null) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not visible in filing";
  return `${numberValue.toFixed(1)} bps`;
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "company";
}

function buildPdf(lines: string[]) {
  const content = lines
    .map((line, index) => {
      const size = index === 0 ? 20 : index === 1 ? 13 : 11;
      const y = 760 - index * 22;
      return `BT /F1 ${size} Tf 72 ${y} Td (${pdfEscape(line)}) Tj ET`;
    })
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const companyName = params.get("companyName") || "Uploaded Plan";
  const planName = params.get("planName") || "401(k) Plan";
  const planYear = params.get("planYear") || "Not visible in filing";
  const fileName = `${safeFileName(companyName)}_401k_plan_review.pdf`;

  const lines = [
    "5500 Analyzer - 401(k) Plan Review",
    `${companyName} | ${planYear}`,
    "",
    `Plan Name: ${planName}`,
    `EIN / Plan Number: ${params.get("ein") || "Not visible in filing"} / ${params.get("planNumber") || "Not visible in filing"}`,
    `Ending Net Assets: ${money(params.get("endingAssets"))}`,
    `Participants with Balances: ${numberLabel(params.get("participantsWithBalances"))}`,
    `Recordkeeper: ${params.get("recordkeeper") || "Not visible in filing"}`,
    `Advisor: ${params.get("advisor") || "Not visible in filing"}`,
    `Auditor: ${params.get("auditor") || "Not visible in filing"}`,
    "",
    "Calculated Metrics",
    `Asset Growth: ${percentLabel(params.get("assetGrowthPercent"))}`,
    `Average Balance: ${money(params.get("averageBalance"))}`,
    `Direct Admin Fee: ${bpsLabel(params.get("adminFeeBps"))}`,
    "",
    "Compliance guardrail: This MVP report only includes values visible in the filing or directly calculated from visible values.",
    "It is not legal, tax, fiduciary, or investment advice."
  ];

  return new Response(buildPdf(lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
