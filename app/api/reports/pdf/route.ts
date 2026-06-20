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
      const isSection = line.endsWith(":");
      const size = index === 0 ? 20 : index === 1 ? 13 : isSection ? 13 : 10;
      const y = 760 - index * 18;
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
  const planDesignSignals = (params.get("planDesignSignals") || "").split("|").filter(Boolean);
  const investmentMenuSignals = (params.get("investmentMenuSignals") || "").split("|").filter(Boolean);

  const lines = [
    "FORM 5500 REVIEW",
    `${companyName} | ${planYear}`,
    "401(k) Plan Review - External discussion materials",
    "",
    "Executive snapshot:",
    `Net assets: ${money(params.get("endingAssets"))}`,
    `Participants with balances: ${numberLabel(params.get("participantsWithBalances"))}`,
    `Direct admin fee: ${bpsLabel(params.get("adminFeeBps"))}`,
    `Asset growth: ${percentLabel(params.get("assetGrowthPercent"))}`,
    "",
    "Plan identity:",
    `Plan Name: ${planName}`,
    `EIN / Plan Number: ${params.get("ein") || "Not visible in filing"} / ${params.get("planNumber") || "Not visible in filing"}`,
    `Plan year ending: December 31, ${planYear}`,
    "",
    "Plan economics and cash flow:",
    `Beginning net assets: ${money(params.get("beginningAssets"))}`,
    `Ending Net Assets: ${money(params.get("endingAssets"))}`,
    `Net investment gain: ${money(params.get("netInvestmentGain"))}`,
    `Average balance: ${money(params.get("averageBalance"))}`,
    `Participants with Balances: ${numberLabel(params.get("participantsWithBalances"))}`,
    "",
    "Provider, fee and plan design signals:",
    `Recordkeeper: ${params.get("recordkeeper") || "Not visible in filing"} | ${money(params.get("recordkeepingFees"))}`,
    `Advisor: ${params.get("advisor") || "Not visible in filing"} | ${money(params.get("advisoryFees"))}`,
    `Trustee / certification: Fidelity Management Trust Company`,
    `IQPA auditor: ${params.get("auditor") || "Not visible in filing"}`,
    `Administrative fees: ${bpsLabel(params.get("adminFeeBps"))} (${money(params.get("recordkeepingFees"))} recordkeeping + ${money(params.get("advisoryFees"))} advisory visible)`,
    "",
    "Plan design signals:",
    ...(planDesignSignals.length ? planDesignSignals.map((signal) => `- ${signal}`) : ["- Requires additional plan records"]),
    "",
    "Investment menu signals:",
    ...(investmentMenuSignals.length ? investmentMenuSignals.map((signal) => `- ${signal}`) : ["- Requires additional plan records"]),
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
