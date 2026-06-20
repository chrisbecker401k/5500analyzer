import { NextRequest } from "next/server";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const BLUE = "0.000 0.333 0.588";
const ORANGE = "0.941 0.541 0.361";
const GREEN = "0.447 0.706 0.353";
const LIGHT_BLUE = "0.604 0.784 0.890";
const TEXT = "0.251 0.251 0.251";
const MUTED = "0.420 0.459 0.522";
const BORDER = "0.878 0.906 0.941";

type CommandPage = {
  content: string[];
};

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "company";
}

function numberValue(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: string | null, compact = false) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible in filing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard"
  }).format(parsed);
}

function numberLabel(value: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible in filing";
  return new Intl.NumberFormat("en-US").format(parsed);
}

function percentLabel(value: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible in filing";
  return `${parsed.toFixed(1)}%`;
}

function bpsLabel(value: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible in filing";
  return `${parsed.toFixed(1)} bps`;
}

function splitSignals(value: string | null) {
  return (value || "").split("|").filter(Boolean);
}

function text(page: CommandPage, value: string, x: number, y: number, size = 10, font = "F1", color = TEXT) {
  page.content.push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${pdfEscape(value)}) Tj ET`);
}

function rect(page: CommandPage, x: number, y: number, width: number, height: number, color: string, stroke = false) {
  page.content.push(`${color} ${stroke ? "RG" : "rg"} ${x} ${y} ${width} ${height} re ${stroke ? "S" : "f"}`);
}

function line(page: CommandPage, x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 1) {
  page.content.push(`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function wrap(value: string, maxChars = 92) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function paragraph(page: CommandPage, value: string, x: number, y: number, maxChars = 92, size = 9, leading = 13, color = MUTED) {
  wrap(value, maxChars).forEach((row, index) => text(page, row, x, y - index * leading, size, "F1", color));
  return y - wrap(value, maxChars).length * leading;
}

function header(page: CommandPage, title: string, pageNumber: number) {
  text(page, "5500 Analyzer", 42, 744, 11, "F2", BLUE);
  text(page, "401(k) Report", 446, 744, 9, "F2", BLUE);
  text(page, title.toUpperCase(), 42, 706, 16, "F2", BLUE);
  line(page, 42, 690, 570, 690);
  text(page, `External discussion materials ${pageNumber}`, 420, 38, 8, "F1", MUTED);
}

function metricCard(page: CommandPage, label: string, value: string, helper: string, x: number, y: number, width = 160) {
  rect(page, x, y, width, 76, "0.965 0.980 0.992");
  rect(page, x, y, width, 76, BORDER, true);
  text(page, label.toUpperCase(), x + 14, y + 52, 7, "F2", MUTED);
  text(page, value, x + 14, y + 28, 18, "F2", BLUE);
  text(page, helper, x + 14, y + 12, 8, "F1", MUTED);
}

function tableRow(page: CommandPage, columns: string[], x: number, y: number, widths: number[], bold = false) {
  columns.forEach((column, index) => text(page, column, x + widths.slice(0, index).reduce((sum, width) => sum + width, 0), y, 8.5, bold ? "F2" : "F1", bold ? BLUE : TEXT));
  line(page, x, y - 8, x + widths.reduce((sum, width) => sum + width, 0), y - 8, "0.914 0.929 0.953", 0.6);
}

function buildPdf(pages: CommandPage[]) {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const content = page.content.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

function makeReport(params: URLSearchParams) {
  const companyName = params.get("companyName") || "Uploaded Plan";
  const planName = params.get("planName") || "Retirement Plan";
  const planYear = params.get("planYear") || "Not visible in filing";
  const planDesignSignals = splitSignals(params.get("planDesignSignals"));
  const investmentMenuSignals = splitSignals(params.get("investmentMenuSignals"));
  const pages: CommandPage[] = Array.from({ length: 6 }, () => ({ content: [] }));

  rect(pages[0], 0, 0, PAGE_WIDTH, PAGE_HEIGHT, "1 1 1");
  rect(pages[0], 0, 0, 612, 142, BLUE);
  text(pages[0], "FORM 5500 REVIEW", 42, 704, 25, "F2", BLUE);
  paragraph(pages[0], "An executive snapshot of plan health, governance considerations, and next-step review opportunities.", 42, 674, 70, 10, 14);
  metricCard(pages[0], "Net Assets", money(params.get("endingAssets"), true), "Ending net assets", 42, 500);
  metricCard(pages[0], "Participants", numberLabel(params.get("participantsWithBalances")), "With account balances", 226, 500);
  metricCard(pages[0], "Direct Admin Fee", bpsLabel(params.get("adminFeeBps")), "Reported admin expenses", 410, 500);
  text(pages[0], "PREPARED FOR", 42, 402, 8, "F2", MUTED);
  text(pages[0], companyName, 42, 374, 22, "F2", TEXT);
  text(pages[0], planName, 42, 350, 12, "F1", MUTED);
  text(pages[0], `Plan year ending December 31, ${planYear}`, 42, 326, 10, "F1", MUTED);
  text(pages[0], "Prepared by Everhart Advisors", 42, 104, 10, "F2", "1 1 1");
  text(pages[0], "External discussion materials", 42, 82, 9, "F1", "1 1 1");
  text(pages[0], "Source: Publicly available Form 5500 package and attached audited financial statements.", 42, 60, 8, "F1", "1 1 1");

  header(pages[1], "Executive Summary", 2);
  paragraph(pages[1], `This report translates the ${planYear} Form 5500 filing package for ${companyName} into a concise, plan-sponsor-friendly discussion document. It highlights what can be observed from public filings and which items should be validated with provider disclosures and plan records.`, 42, 660);
  metricCard(pages[1], "Ending Net Assets", money(params.get("endingAssets"), true), percentLabel(params.get("assetGrowthPercent")), 42, 548);
  metricCard(pages[1], "Participants", numberLabel(params.get("participantsWithBalances")), "with balances", 226, 548);
  metricCard(pages[1], "Net Asset Change", money(params.get("netAssetChange"), true), "includes market and cash flow", 410, 548);
  text(pages[1], "Plan confidence lens", 42, 480, 13, "F2", BLUE);
  tableRow(pages[1], ["Dimension", "Signal", "What the filing suggests"], 42, 452, [110, 90, 326], true);
  tableRow(pages[1], ["Plan growth", "Observed", `Assets changed ${percentLabel(params.get("assetGrowthPercent"))} year over year.`], 42, 426, [110, 90, 326]);
  tableRow(pages[1], ["Engagement", "Visible", `${numberLabel(params.get("participantsWithBalances"))} participants had account balances.`], 42, 400, [110, 90, 326]);
  tableRow(pages[1], ["Fee visibility", "Partial", "Schedule C/H values are visible; validate with 408(b)(2), 404a-5, and service agreements."], 42, 374, [110, 90, 326]);
  text(pages[1], "Top 3 items to validate with plan records", 42, 316, 13, "F2", BLUE);
  ["Confirm direct and indirect compensation using fee disclosures and service agreements.", "Review participant loans, terminated balances, distribution activity, and education needs.", "Clarify provider accountability for the annual fiduciary review process."].forEach((item, index) => {
    text(pages[1], `${index + 1}`, 50, 278 - index * 44, 17, "F2", ORANGE);
    paragraph(pages[1], item, 86, 284 - index * 44, 78, 9, 12, TEXT);
  });

  header(pages[2], "Form 5500 Snapshot", 3);
  paragraph(pages[2], "The filing shows plan scale, contribution inflows, benefit payments, investment activity, and administrative expenses. These values should be reconciled with recordkeeper reporting before decisions are made.", 42, 660);
  text(pages[2], "Asset bridge", 42, 600, 13, "F2", BLUE);
  metricCard(pages[2], "Beginning assets", money(params.get("beginningAssets"), true), "start of year", 42, 500);
  metricCard(pages[2], "Contributions", money(params.get("totalContributions"), true), percentLabel(params.get("contributionPercentOfAssets")), 226, 500);
  metricCard(pages[2], "Benefits paid", money(params.get("benefitsPaid"), true), percentLabel(params.get("benefitsPaidPercentOfAssets")), 410, 500);
  metricCard(pages[2], "Net cash flow", money(params.get("netCashFlow"), true), "contributions less benefits", 42, 398);
  metricCard(pages[2], "Investment gain", money(params.get("netInvestmentGain"), true), "visible filing value", 226, 398);
  metricCard(pages[2], "Ending assets", money(params.get("endingAssets"), true), "end of year", 410, 398);
  text(pages[2], "Key Form 5500 and financial statement metrics", 42, 326, 13, "F2", BLUE);
  tableRow(pages[2], ["Metric", `${planYear} value`, "Plan discussion implication"], 42, 298, [160, 120, 246], true);
  [
    ["Beginning net assets", money(params.get("beginningAssets")), "Baseline for annual growth and investment results."],
    ["Ending net assets", money(params.get("endingAssets")), "Plan scale and governance cadence discussion point."],
    ["Total contributions", money(params.get("totalContributions")), "Annual funding activity visible in Schedule H."],
    ["Benefits paid", money(params.get("benefitsPaid")), "Useful to evaluate distribution behavior."],
    ["Participant loans", money(params.get("participantLoans")), `${percentLabel(params.get("loanPercentOfAssets"))} of ending assets when visible.`]
  ].forEach((row, index) => tableRow(pages[2], row, 42, 272 - index * 28, [160, 120, 246]));

  header(pages[3], "Provider, Fee And Plan Design Signals", 4);
  paragraph(pages[3], "This section organizes major service-provider, compensation, and plan-design items visible in the filing. It does not conclude whether fees are reasonable or unreasonable.", 42, 660);
  text(pages[3], "Provider accountability map", 42, 604, 13, "F2", BLUE);
  metricCard(pages[3], "Recordkeeper", params.get("recordkeeper") || "Not visible", money(params.get("recordkeepingFees")), 42, 504);
  metricCard(pages[3], "Advisor", params.get("advisor") || "Not visible", money(params.get("advisoryFees")), 226, 504);
  metricCard(pages[3], "Auditor", params.get("auditor") || "Not visible", "IQPA / audit support", 410, 504);
  text(pages[3], "Compensation and expense visibility", 42, 436, 13, "F2", BLUE);
  metricCard(pages[3], "Admin Fees", money(params.get("administrativeExpenses")), bpsLabel(params.get("adminFeeBps")), 42, 336);
  metricCard(pages[3], "Recordkeeper", money(params.get("recordkeepingFees")), "Schedule C/H visible", 226, 336);
  metricCard(pages[3], "Advisor", money(params.get("advisoryFees")), "Schedule C/H visible", 410, 336);
  text(pages[3], "Plan design signals", 42, 270, 12, "F2", BLUE);
  (planDesignSignals.length ? planDesignSignals : ["Requires additional plan records."]).slice(0, 4).forEach((signal, index) => paragraph(pages[3], `- ${signal}`, 42, 246 - index * 28, 65, 8.5, 11, TEXT));
  text(pages[3], "Investment menu signals", 326, 270, 12, "F2", BLUE);
  (investmentMenuSignals.length ? investmentMenuSignals : ["Requires additional plan records."]).slice(0, 4).forEach((signal, index) => paragraph(pages[3], `- ${signal}`, 326, 246 - index * 28, 52, 8.5, 11, TEXT));

  header(pages[4], "From Insight To Action", 5);
  paragraph(pages[4], "Public filings are a strong starting point, but they do not show the full fiduciary process. The next step is to compare this snapshot against provider disclosures, plan documents, investment policy, committee records, participant experience, and business objectives.", 42, 660);
  [["01", "Confirm", "Validate Form 5500 observations against provider reports, service agreements, fee disclosures, and plan documents."], ["02", "Benchmark", "Evaluate fees, services, investment menu structure, participant behavior, and governance practices against plan size and complexity."], ["03", "Prioritize", "Identify the few actions that matter most and assign accountability across advisor, recordkeeper, auditor, payroll/TPA, and committee."]].forEach((item, index) => {
    const x = 42 + index * 184;
    rect(pages[4], x, 476, 158, 120, "0.980 0.984 0.988");
    rect(pages[4], x, 476, 158, 120, BORDER, true);
    text(pages[4], item[0], x + 14, 560, 18, "F2", ORANGE);
    text(pages[4], item[1], x + 14, 532, 13, "F2", BLUE);
    paragraph(pages[4], item[2], x + 14, 510, 26, 8, 10, TEXT);
  });
  text(pages[4], "Recommended next step: Retirement Plan Consultation", 42, 414, 13, "F2", BLUE);
  paragraph(pages[4], "In that conversation, Everhart Advisors can walk through the highest-priority observations from this report, identify which documents are needed to validate the findings, and determine whether deeper fee, provider, or fiduciary process benchmarking is worth pursuing.", 42, 388);
  metricCard(pages[4], "Priority observations", "3", "discussion points", 42, 252);
  metricCard(pages[4], "Missing documents", "List", "408(b)(2), 404a-5, lineup", 226, 252);
  metricCard(pages[4], "Booking Link", "Everhart", "Insert default scheduling URL", 410, 252);
  paragraph(pages[4], "Documents that would help validate this review: 408(b)(2) disclosure, 404a-5 participant fee disclosure, investment lineup, service agreements, plan document/adoption agreement, recordkeeper reports, and recent committee materials.", 42, 192, 92, 8.5, 12, TEXT);

  header(pages[5], "Appendix And Disclosures", 6);
  paragraph(pages[5], "The items below summarize the primary source documents used to prepare this review and the limitations of a Form 5500-based analysis.", 42, 660);
  tableRow(pages[5], ["Source item", "Where used in this review"], 42, 620, [190, 336], true);
  [
    ["Form 5500 basic plan information", "Plan sponsor, EIN, plan number, plan year, participant counts, plan characteristics, and attached schedules."],
    ["Schedule H and financial statements", "Net assets, investments, contributions, distributions, administrative expenses, participant loans, and annual change in net assets."],
    ["Schedule C", "Reported service providers and direct or indirect compensation items visible in the filing."],
    ["Schedule D and asset schedules", "Common collective trust, stable value, mutual fund, and plan investment information when visible."],
    ["Plan notes", "Eligibility, match, after-tax contributions, loans, hardship withdrawals, and plan operation descriptions when available."]
  ].forEach((row, index) => tableRow(pages[5], row, 42, 594 - index * 36, [190, 336]));
  text(pages[5], "Important limitations", 42, 374, 13, "F2", BLUE);
  [
    "This review is based on public filing information and audited financial statement disclosures.",
    "It does not replace plan document review, legal advice, tax advice, investment advice, or a complete fiduciary audit.",
    "Form 5500 data may not capture all indirect compensation, investment expense ratios, managed account fees, participant transaction fees, revenue sharing, float, or sponsor-paid expenses.",
    "No conclusion is made regarding whether any fee is reasonable, any investment is prudent, or any fiduciary process is sufficient."
  ].forEach((item, index) => paragraph(pages[5], `- ${item}`, 42, 344 - index * 34, 91, 8.5, 11, TEXT));
  text(pages[5], "Selected calculations", 42, 182, 13, "F2", BLUE);
  tableRow(pages[5], ["Calculation", "Formula"], 42, 154, [160, 366], true);
  tableRow(pages[5], ["Asset growth", "(Ending net assets - beginning net assets) / beginning net assets"], 42, 130, [160, 366]);
  tableRow(pages[5], ["Average balance", "Ending net assets / participants with account balances"], 42, 106, [160, 366]);
  tableRow(pages[5], ["Direct admin fee bps", "Reported administrative fees / ending net assets x 10,000"], 42, 82, [160, 366]);

  return pages;
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const companyName = params.get("companyName") || "Uploaded Plan";
  const fileName = `${safeFileName(companyName)}_401k_plan_review.pdf`;

  return new Response(buildPdf(makeReport(params)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
