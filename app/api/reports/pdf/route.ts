import type { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const BLUE = "0.000 0.333 0.588";
const ORANGE = "0.941 0.541 0.361";
const GREEN = "0.776 0.855 0.553";
const LIGHT_BLUE = "0.604 0.784 0.890";
const TEXT = "0.329 0.345 0.373";
const MUTED = "0.420 0.459 0.522";
const BORDER = "0.851 0.871 0.886";
const HEADER_LINE = "0.851 0.871 0.894";
const PANEL = "0.969 0.976 0.984";
const EVERHART_GRAY = "0.620 0.620 0.640";
const ROW_STRIPE = "0.965 0.973 0.984";
const CONTENT_LEFT = 42;
const CONTENT_RIGHT = 568;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

type CommandPage = {
  content: string[];
  links: LinkAnnotation[];
};

type LinkAnnotation = {
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
};

type SvgPath = {
  d: string;
  fill: string;
};

type SvgRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

type SvgLogo = {
  viewBox: [number, number, number, number];
  paths: SvgPath[];
  rects: SvgRect[];
};

const logoCache = new Map<string, SvgLogo | null>();

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
  const absolute = Math.abs(parsed);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard"
  }).format(absolute);
  return parsed < 0 ? formatted.replace("$", "$-") : formatted;
}

function compactMoney(value: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible";
  const absolute = Math.abs(parsed);
  if (absolute >= 1_000_000) {
    const formatted = `$${(absolute / 1_000_000).toFixed(1)}M`;
    return parsed < 0 ? formatted.replace("$", "$-") : formatted;
  }
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: absolute >= 1_000_000 ? 1 : 0,
    notation: "compact"
  }).format(absolute);
  return parsed < 0 ? formatted.replace("$", "$-") : formatted;
}

function moneyFull(value: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return "Not visible";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
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

function rightAlignedText(page: CommandPage, value: string, rightX: number, y: number, size = 10, font = "F1", color = TEXT, widthFactor = 0.55) {
  text(page, value, rightX - value.length * size * widthFactor, y, size, font, color);
}

function addLink(page: CommandPage, x: number, y: number, width: number, height: number, url: string) {
  page.links.push({ x, y, width, height, url });
}

function rect(page: CommandPage, x: number, y: number, width: number, height: number, color: string, stroke = false) {
  page.content.push(`${color} ${stroke ? "RG" : "rg"} ${x} ${y} ${width} ${height} re ${stroke ? "S" : "f"}`);
}

function roundedRect(page: CommandPage, x: number, y: number, width: number, height: number, radius: number, color: string, stroke = false) {
  const c = radius * 0.5522847498;
  const op = stroke ? "S" : "f";
  page.content.push(`${color} ${stroke ? "RG" : "rg"} ${x + radius} ${y} m ${x + width - radius} ${y} l ${x + width - radius + c} ${y} ${x + width} ${y + radius - c} ${x + width} ${y + radius} c ${x + width} ${y + height - radius} l ${x + width} ${y + height - radius + c} ${x + width - radius + c} ${y + height} ${x + width - radius} ${y + height} c ${x + radius} ${y + height} l ${x + radius - c} ${y + height} ${x} ${y + height - radius + c} ${x} ${y + height - radius} c ${x} ${y + radius} l ${x} ${y + radius - c} ${x + radius - c} ${y} ${x + radius} ${y} c h ${op}`);
}

function circle(page: CommandPage, cx: number, cy: number, radius: number, color: string) {
  roundedRect(page, cx - radius, cy - radius, radius * 2, radius * 2, radius, color);
}

function line(page: CommandPage, x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 1) {
  page.content.push(`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function hexToPdfColor(value: string) {
  const normalized = value.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function loadSvgAsset(kind: "color" | "white" | "calendar") {
  if (logoCache.has(kind)) return logoCache.get(kind);

  const fileName =
    kind === "color"
      ? "everhart-advisors-color.svg"
      : kind === "white"
        ? "everhart-advisors-white.svg"
        : "calendar-icon-white-background.svg";
  const filePath = path.join(process.cwd(), "public", "logos", fileName);
  try {
    const svg = fs.readFileSync(filePath, "utf8");
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const pathTags = [...svg.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
    const rectTags = [...svg.matchAll(/<rect\b[^>]*>/g)].map((match) => match[0]);
    if (!viewBoxMatch || (pathTags.length === 0 && rectTags.length === 0)) {
      logoCache.set(kind, null);
      return null;
    }

    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number) as [number, number, number, number];
    const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]+)"`))?.[1];
    const paths = pathTags.flatMap((tag) => {
      const d = attr(tag, "d");
      const fill = attr(tag, "fill");
      return d && fill ? [{ d, fill: hexToPdfColor(fill) }] : [];
    });
    const rects = rectTags.flatMap((tag) => {
      const width = attr(tag, "width");
      const height = attr(tag, "height");
      const fill = attr(tag, "fill");
      return width && height && fill
        ? [{
            x: Number(attr(tag, "x") || 0),
            y: Number(attr(tag, "y") || 0),
            width: Number(width),
            height: Number(height),
            fill: hexToPdfColor(fill)
          }]
        : [];
    });
    if (paths.length === 0 && rects.length === 0) {
      logoCache.set(kind, null);
      return null;
    }
    const parsed = { viewBox, paths, rects };
    logoCache.set(kind, parsed);
    return parsed;
  } catch {
    logoCache.set(kind, null);
    return null;
  }
}

function drawSvgPath(page: CommandPage, svgPath: SvgPath, viewBox: [number, number, number, number], x: number, y: number, width: number) {
  const [, , viewBoxWidth, viewBoxHeight] = viewBox;
  const scale = width / viewBoxWidth;
  const tokens = svgPath.d.match(/[MLHVCSQTAZ]|[-+]?\d*\.?\d+/g) || [];
  const commands: string[] = [];
  let index = 0;
  let command = "";
  let currentX = 0;
  let currentY = 0;
  const px = (value: number) => x + value * scale;
  const py = (value: number) => y + (viewBoxHeight - value) * scale;

  while (index < tokens.length) {
    const token = tokens[index++];
    if (/^[MLHVCSQTAZ]$/.test(token)) {
      command = token;
      if (command === "Z") {
        commands.push("h");
      }
      continue;
    }

    if (command === "M" || command === "L") {
      const xToken = token;
      const yToken = tokens[index++];
      if (!xToken || !yToken) break;
      currentX = Number(xToken);
      currentY = Number(yToken);
      commands.push(`${px(currentX).toFixed(2)} ${py(currentY).toFixed(2)} ${command === "M" ? "m" : "l"}`);
    } else if (command === "H") {
      currentX = Number(token);
      commands.push(`${px(currentX).toFixed(2)} ${py(currentY).toFixed(2)} l`);
    } else if (command === "V") {
      currentY = Number(token);
      commands.push(`${px(currentX).toFixed(2)} ${py(currentY).toFixed(2)} l`);
    } else if (command === "C") {
      const x1 = Number(token);
      const y1 = Number(tokens[index++]);
      const x2 = Number(tokens[index++]);
      const y2 = Number(tokens[index++]);
      const x3 = Number(tokens[index++]);
      const y3 = Number(tokens[index++]);
      currentX = x3;
      currentY = y3;
      commands.push(`${px(x1).toFixed(2)} ${py(y1).toFixed(2)} ${px(x2).toFixed(2)} ${py(y2).toFixed(2)} ${px(x3).toFixed(2)} ${py(y3).toFixed(2)} c`);
    }
  }

  if (commands.length) {
    page.content.push(`${svgPath.fill} rg ${commands.join(" ")} f`);
  }
}

function drawSvgRect(page: CommandPage, svgRect: SvgRect, viewBox: [number, number, number, number], x: number, y: number, width: number) {
  const [, , viewBoxWidth, viewBoxHeight] = viewBox;
  const scale = width / viewBoxWidth;
  rect(
    page,
    x + svgRect.x * scale,
    y + (viewBoxHeight - svgRect.y - svgRect.height) * scale,
    svgRect.width * scale,
    svgRect.height * scale,
    svgRect.fill
  );
}

function svgLogo(page: CommandPage, kind: "color" | "white", x: number, y: number, width: number) {
  const logo = loadSvgAsset(kind);
  if (!logo) {
    everhartLogo(page, x, y + width * 0.22, width / 84, kind === "white" ? "1 1 1" : EVERHART_GRAY);
    return;
  }

  logo.paths.forEach((svgPath) => drawSvgPath(page, svgPath, logo.viewBox, x, y, width));
  logo.rects.forEach((svgRect) => drawSvgRect(page, svgRect, logo.viewBox, x, y, width));
}

function svgIcon(page: CommandPage, kind: "calendar", x: number, y: number, width: number) {
  const icon = loadSvgAsset(kind);
  if (!icon) return;
  icon.rects.filter((svgRect) => svgRect.fill === "1.000 1.000 1.000").forEach((svgRect) => drawSvgRect(page, svgRect, icon.viewBox, x, y, width));
  icon.paths.forEach((svgPath) => drawSvgPath(page, svgPath, icon.viewBox, x, y, width));
  icon.rects.filter((svgRect) => svgRect.fill !== "1.000 1.000 1.000").forEach((svgRect) => drawSvgRect(page, svgRect, icon.viewBox, x, y, width));
}

function calendarIcon(page: CommandPage, x: number, y: number, size: number) {
  roundedRect(page, x, y, size, size, 2.4, BLUE, true);
  line(page, x + 2.2, y + size - 4, x + size - 2.2, y + size - 4, BLUE, 0.75);
  line(page, x + 4.2, y + size - 1.2, x + 4.2, y + size - 3, BLUE, 1);
  line(page, x + size - 4.2, y + size - 1.2, x + size - 4.2, y + size - 3, BLUE, 1);
  [0, 1, 2].forEach((column) => {
    [0, 1].forEach((row) => {
      circle(page, x + 4.2 + column * 3.2, y + 3.8 + row * 3.2, 0.5, BLUE);
    });
  });
}

function everhartLogo(page: CommandPage, x: number, y: number, scale = 1, color = EVERHART_GRAY) {
  text(page, "everhart", x, y, 24 * scale, "F2", color);
  text(page, "A  D  V  I  S  O  R  S", x + 9 * scale, y - 13 * scale, 7 * scale, "F2", BLUE);
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

function paragraph(page: CommandPage, value: string, x: number, y: number, maxChars = 92, size = 9, leading = 13, color = TEXT) {
  wrap(value, maxChars).forEach((row, index) => text(page, row, x, y - index * leading, size, "F1", color));
  return y - wrap(value, maxChars).length * leading;
}

function header(page: CommandPage, title: string, pageNumber: number) {
  svgLogo(page, "color", 42, 734, 74);
  const headerTitle = title.toUpperCase();
  rightAlignedText(page, headerTitle, CONTENT_RIGHT, 750, 8.5, "F2", BLUE, 0.55);
  line(page, 110, 714, CONTENT_RIGHT, 714, HEADER_LINE, 0.7);
  text(page, `401(k) Report | External discussion materials`, 236, 26, 7, "F1", "0.620 0.620 0.620");
  text(page, String(pageNumber), 552, 26, 7, "F1", "0.620 0.620 0.620");
}

function metricCard(page: CommandPage, label: string, value: string, helper: string, x: number, y: number, width = 160, accent = LIGHT_BLUE) {
  const valueSize = value.length > 25 ? 10 : value.length > 19 ? 12 : value.length > 14 ? 14 : 18;
  const helperLines = wrap(helper, Math.max(18, Math.floor(width / 4.2))).slice(0, 2);
  roundedRect(page, x, y, width, 76, 10, "1 1 1");
  roundedRect(page, x, y, width, 76, 10, BORDER, true);
  roundedRect(page, x, y, 4, 76, 2, accent);
  text(page, label.toUpperCase(), x + 14, y + 52, 7, "F2", "0.640 0.650 0.670");
  text(page, value, x + 14, y + 28, valueSize, "F2", TEXT);
  helperLines.forEach((lineText, index) => text(page, lineText, x + 14, y + 12 - index * 9, 7.4, "F1", MUTED));
}

function providerCard(page: CommandPage, label: string, value: string, helper: string, x: number, y: number, width: number, accent: string) {
  roundedRect(page, x, y, width, 86, 10, "1 1 1");
  roundedRect(page, x, y, width, 86, 10, BORDER, true);
  roundedRect(page, x, y, width, 4, 2, accent);
  text(page, label.toUpperCase(), x + 10, y + 62, 7, "F2", "0.640 0.650 0.670");
  const valueLines = wrap(value, Math.max(22, Math.floor((width - 18) / 3.95))).slice(0, 3);
  const valueSize = value.length > 28 ? 7.7 : value.length > 21 ? 8.2 : 9;
  valueLines.forEach((lineText, index) => text(page, lineText, x + 10, y + 42 - index * 9.5, valueSize, "F2", TEXT));
  text(page, helper, x + 10, y + 12, 7.5, "F1", MUTED);
}

function barMetric(page: CommandPage, label: string, value: string, x: number, y: number, width: number, color: string, maxValue: number) {
  const parsed = Math.abs(numberValue(value) ?? 0);
  const barWidth = maxValue > 0 ? Math.max(6, Math.min(width, (parsed / maxValue) * width)) : 6;
  text(page, label, x, y + 16, 7.5, "F2", MUTED);
  text(page, compactMoney(value), x + width - 22, y + 16, 7.5, "F2", TEXT);
  roundedRect(page, x, y, width, 10, 5, "0.965 0.973 0.984");
  roundedRect(page, x, y, barWidth, 10, 5, color);
}

function tableRow(page: CommandPage, columns: string[], x: number, y: number, widths: number[], bold = false, background?: string) {
  const rowHeight = bold ? 22 : 28;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const rowY = bold ? y - 10 : y - 16;
  if (bold) rect(page, x, rowY, totalWidth, rowHeight, BLUE);
  if (!bold && background) rect(page, x, rowY, totalWidth, rowHeight, background);
  columns.forEach((column, index) => {
    const color = bold ? "1 1 1" : TEXT;
    const font = bold ? "F2" : "F1";
    const size = bold ? 7.5 : 6.7;
    const maxChars = Math.max(10, Math.floor(widths[index] / (bold ? 4.2 : 3.05)));
    const lines = bold ? [column] : wrap(column, maxChars).slice(0, 2);
    lines.forEach((lineText, lineIndex) => {
      text(page, lineText, x + 8 + widths.slice(0, index).reduce((sum, width) => sum + width, 0), y - lineIndex * 8, size, font, color);
    });
  });
  rect(page, x, rowY, totalWidth, rowHeight, BORDER, true);
  widths.slice(0, -1).reduce((cursor, width) => {
    const next = cursor + width;
    line(page, next, rowY, next, rowY + rowHeight, BORDER, 0.5);
    return next;
  }, x);
}

function signalTableRow(page: CommandPage, columns: string[], x: number, y: number, widths: number[], bold = false, background?: string) {
  const rowHeight = bold ? 22 : 28;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const rowY = bold ? y - 10 : y - 16;
  if (bold) rect(page, x, rowY, totalWidth, rowHeight, BLUE);
  if (!bold && background) rect(page, x, rowY, totalWidth, rowHeight, background);

  columns.forEach((column, index) => {
    const color = bold ? "1 1 1" : TEXT;
    const font = bold ? "F2" : "F1";
    const size = bold ? 7.2 : 6.35;
    const leading = bold ? 8 : 7.2;
    const maxChars = Math.max(10, Math.floor((widths[index] - 16) / (bold ? 4.2 : 3.35)));
    const lines = bold ? [column] : wrap(column, maxChars).slice(0, 3);
    const columnX = x + 8 + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
    lines.forEach((lineText, lineIndex) => {
      text(page, lineText, columnX, y - lineIndex * leading, size, font, color);
    });
  });

  rect(page, x, rowY, totalWidth, rowHeight, BORDER, true);
  widths.slice(0, -1).reduce((cursor, width) => {
    const next = cursor + width;
    line(page, next, rowY, next, rowY + rowHeight, BORDER, 0.5);
    return next;
  }, x);
}

function topicBullet(page: CommandPage, number: string, title: string, body: string, x: number, y: number) {
  circle(page, x + 8, y + 2, 8, BLUE);
  text(page, number, x + 6.1, y - 0.4, 6.8, "F2", "1 1 1");
  text(page, title, x + 24, y + 1, 8, "F2", TEXT);
  paragraph(page, body, x + 24, y - 10, 128, 7, 9, MUTED);
}

function buildPdf(pages: CommandPage[]) {
  const objects: string[] = [];
  const annotationStartId = 3 + pages.length * 2;
  const annotationCount = pages.reduce((sum, page) => sum + page.links.length, 0);
  const fontStartId = annotationStartId + annotationCount;
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const firstAnnotationId = annotationStartId + pages.slice(0, index).reduce((sum, previousPage) => sum + previousPage.links.length, 0);
    const annotationRefs = page.links.map((_link, linkIndex) => `${firstAnnotationId + linkIndex} 0 R`);
    const content = page.content.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontStartId} 0 R /F2 ${fontStartId + 1} 0 R >> >> /Contents ${contentObjectId} 0 R${annotationRefs.length ? ` /Annots [${annotationRefs.join(" ")}]` : ""} >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
  });

  pages.forEach((page) => {
    page.links.forEach((link) => {
      objects.push(`<< /Type /Annot /Subtype /Link /Rect [${link.x} ${link.y} ${link.x + link.width} ${link.y + link.height}] /Border [0 0 0] /A << /S /URI /URI (${pdfEscape(link.url)}) >> >>`);
    });
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
  const activeParticipants = params.get("activeParticipants");
  const separatedParticipants = params.get("separatedParticipants");
  const auditAdminExpenses = params.get("auditAdministrativeExpenses") || params.get("administrativeExpenses");
  const maxSources = Math.max(
    Math.abs(numberValue(params.get("totalContributions")) ?? 0),
    Math.abs(numberValue(params.get("benefitsPaid")) ?? 0),
    Math.abs(numberValue(params.get("netInvestmentGain")) ?? 0),
    Math.abs(numberValue(auditAdminExpenses) ?? 0),
    1
  );
  const pages: CommandPage[] = Array.from({ length: 6 }, () => ({ content: [], links: [] }));

  rect(pages[0], 0, 0, PAGE_WIDTH, PAGE_HEIGHT, "1 1 1");
  rect(pages[0], 418, 0, 194, PAGE_HEIGHT, BLUE);
  rect(pages[0], 416, 0, 3, PAGE_HEIGHT, ORANGE);
  svgLogo(pages[0], "color", 42, 690, 150);
  roundedRect(pages[0], 42, 614, 178, 30, 15, ORANGE);
  text(pages[0], "FORM 5500 REVIEW", 82, 625, 9, "F2", "1 1 1");
  text(pages[0], "401(k) Report", 42, 526, 27, "F2", TEXT);
  rect(pages[0], 42, 504, 166, 5, ORANGE);
  paragraph(pages[0], "An executive snapshot of plan health, governance considerations, and next-step review opportunities.", 42, 462, 54, 10.5, 16, MUTED);
  roundedRect(pages[0], 42, 170, 338, 122, 14, PANEL);
  roundedRect(pages[0], 42, 170, 338, 122, 14, BORDER, true);
  text(pages[0], "PREPARED FOR", 66, 268, 7.5, "F2", "0.640 0.650 0.670");
  text(pages[0], companyName, 66, 232, 18, "F2", TEXT);
  paragraph(pages[0], planName, 66, 206, 46, 9, 12, MUTED);
  text(pages[0], `Plan year ending December 31, ${planYear}`, 66, 184, 8.5, "F1", MUTED);
  text(pages[0], compactMoney(params.get("endingAssets")), 454, 548, 25, "F2", "1 1 1");
  text(pages[0], "NET ASSETS", 454, 516, 8, "F2", "1 1 1");
  line(pages[0], 454, 486, 576, 486, "0.250 0.560 0.760", 1);
  text(pages[0], numberLabel(params.get("participantsWithBalances")), 454, 430, 24, "F2", "1 1 1");
  text(pages[0], "PARTICIPANTS WITH", 454, 398, 8, "F2", "1 1 1");
  text(pages[0], "BALANCES", 454, 384, 8, "F2", "1 1 1");
  line(pages[0], 454, 354, 576, 354, "0.250 0.560 0.760", 1);
  text(pages[0], bpsLabel(params.get("adminFeeBps")).replace(" bps", ""), 454, 300, 24, "F2", "1 1 1");
  text(pages[0], "DIRECT ADMIN", 454, 268, 8, "F2", "1 1 1");
  text(pages[0], "FEE BPS", 454, 254, 8, "F2", "1 1 1");
  text(pages[0], "Prepared by Everhart Advisors | External discussion materials", 42, 66, 6.8, "F1", "0.620 0.620 0.620");
  text(pages[0], "Source: Publicly available Form 5500 package and attached audited financial statements.", 42, 48, 6.8, "F1", "0.620 0.620 0.620");

  header(pages[1], "Executive Summary", 2);
  text(pages[1], "Executive summary", 42, 680, 20, "F2", TEXT);
  paragraph(pages[1], `This review translates the plan's ${planYear} Form 5500 filing and audited financial statement package into a concise, plan-sponsor-friendly discussion document. It highlights what can be observed from public filings, where the plan appears strong, and which items should be validated with current provider disclosures and plan records.`, 42, 644, 136, 8.5, 12);
  metricCard(pages[1], "Ending Net Assets", compactMoney(params.get("endingAssets")), `${percentLabel(params.get("assetGrowthPercent"))} year-over-year increase`, 42, 532, 160, GREEN);
  metricCard(pages[1], "Participants with Balances", numberLabel(params.get("participantsWithBalances")), `${numberLabel(activeParticipants)} active participants`, 226, 532, 160, LIGHT_BLUE);
  metricCard(pages[1], "Net Asset Change", compactMoney(params.get("netAssetChange")), "Investment and cash-flow activity", 408, 532, 160, ORANGE);
  text(pages[1], "Plan confidence lens", 42, 500, 13, "F2", TEXT);
  tableRow(pages[1], ["Dimension", "Signal", "What the filing suggests"], 42, 480, [110, 82, 334], true);
  [
    ["Plan growth", "Strong", `Assets increased from ${compactMoney(params.get("beginningAssets"))} to ${compactMoney(params.get("endingAssets"))}, supported primarily by positive investment income.`],
    ["Participant engagement", "Review", `The plan has ${numberLabel(params.get("participantsWithBalances"))} participants with account balances and ${numberLabel(separatedParticipants)} separated participants entitled to future benefits.`],
    ["Fee visibility", "Visible", "Schedule C identifies direct advisory and recordkeeping compensation; a complete fee review should still include service agreements and participant fee disclosures."],
    ["Plan design", "Opportunity", "The plan has auto-enrollment and permits pretax and after-tax contributions, but no matching or discretionary employer contributions were made."]
  ].forEach((row, index) => tableRow(pages[1], row, 42, 458 - index * 28, [110, 82, 334], false, index % 2 === 1 ? ROW_STRIPE : undefined));
  roundedRect(pages[1], 42, 118, 528, 202, 12, PANEL);
  roundedRect(pages[1], 42, 118, 528, 202, 12, BORDER, true);
  roundedRect(pages[1], 42, 118, 5, 202, 2.5, ORANGE);
  text(pages[1], "Top 3 items to validate with plan records", 60, 284, 13, "F2", TEXT);
  paragraph(pages[1], "These are not conclusions from the filing. They are high-value discussion points for a plan sponsor or committee.", 60, 262, 130, 7.5, 10, MUTED);
  topicBullet(pages[1], "1", "Fee documentation", "Confirm direct and indirect compensation using 408(b)(2), 404a-5, fund expenses, and service agreements.", 60, 232);
  topicBullet(pages[1], "2", "Participant behavior", "Review terminated balances, loan usage, distribution activity, and education opportunities.", 60, 196);
  topicBullet(pages[1], "3", "Provider accountability", "Clarify which provider owns each part of the annual fiduciary process and how decisions are documented.", 60, 160);

  header(pages[2], "Form 5500 Snapshot", 3);
  text(pages[2], "Plan economics and cash flow", 42, 680, 20, "F2", TEXT);
  paragraph(pages[2], `The ${planYear} filing shows a plan with meaningful retirement plan assets, positive investment results, and modest negative net cash flow from contributions less benefits and expenses. The analysis below should be reconciled with current recordkeeper reporting before decisions are made.`, 42, 644, 136, 8.5, 12);
  roundedRect(pages[2], 42, 374, 252, 226, 12, "1 1 1");
  roundedRect(pages[2], 42, 374, 252, 226, 12, BORDER, true);
  text(pages[2], "Asset bridge", 58, 574, 12, "F2", TEXT);
  [["Beginning assets", params.get("beginningAssets"), BLUE], ["Investment income", params.get("netInvestmentGain"), GREEN], ["Net cash flow", params.get("netCashFlow"), ORANGE], ["Ending net assets", params.get("endingAssets"), TEXT]].forEach((item, index) => {
    const y = 532 - index * 40;
    text(pages[2], item[0]!, 60, y, 7.2, "F2", MUTED);
    roundedRect(pages[2], 158, y - 10, 62, 18, 4, "0.965 0.973 0.984");
    roundedRect(pages[2], 158, y - 10, Math.max(8, Math.min(62, (Math.abs(numberValue(item[1]) ?? 0) / (numberValue(params.get("endingAssets")) || 1)) * 62)), 18, 4, item[2]!);
    text(pages[2], compactMoney(item[1]!), 248, y, 7.2, "F2", TEXT);
  });
  text(pages[2], "Net cash flow = contributions less benefits paid and administrative expenses.", 60, 386, 6.8, "F1", "0.660 0.680 0.700");
  roundedRect(pages[2], 314, 374, 256, 226, 12, "1 1 1");
  roundedRect(pages[2], 314, 374, 256, 226, 12, BORDER, true);
  text(pages[2], `${planYear} sources and uses`, 330, 574, 12, "F2", TEXT);
  barMetric(pages[2], "Total contributions", params.get("totalContributions") || "", 330, 532, 216, GREEN, maxSources);
  barMetric(pages[2], "Benefits paid", params.get("benefitsPaid") || "", 330, 490, 216, LIGHT_BLUE, maxSources);
  barMetric(pages[2], "Investment income", params.get("netInvestmentGain") || "", 330, 448, 216, ORANGE, maxSources);
  barMetric(pages[2], "Administrative expenses", auditAdminExpenses || "", 330, 406, 216, "0.650 0.670 0.700", maxSources);
  text(pages[2], "Key Form 5500 and financial statement metrics", 42, 336, 13, "F2", TEXT);
  tableRow(pages[2], ["Metric", `${planYear} value`, "Plan discussion implication"], 42, 318, [132, 110, 284], true);
  [
    ["Beginning net assets", moneyFull(params.get("beginningAssets")), "Baseline for annual growth and investment results."],
    ["Ending net assets", moneyFull(params.get("endingAssets")), "Current plan scale and basis for fee benchmarking."],
    ["Total contributions", moneyFull(params.get("totalContributions")), `${percentLabel(params.get("contributionPercentOfAssets"))} of ending net assets; participation and savings rates require payroll data.`],
    ["Benefits paid", moneyFull(params.get("benefitsPaid")), `${percentLabel(params.get("benefitsPaidPercentOfAssets"))} of beginning net assets; useful to evaluate distributions and terminated participant strategy.`],
    ["Participant loans", money(params.get("participantLoans")), `${percentLabel(params.get("loanPercentOfAssets"))} of ending assets when visible.`]
  ].forEach((row, index) => tableRow(pages[2], row, 42, 296 - index * 28, [132, 110, 284], false, index % 2 === 1 ? ROW_STRIPE : undefined));

  header(pages[3], "Provider, Fee And Plan Design Signals", 4);
  text(pages[3], "Provider, fee and plan design signals", 42, 680, 20, "F2", TEXT);
  paragraph(pages[3], "This section organizes major service-provider, compensation, and plan-design items visible in the filing. It does not conclude whether fees are reasonable or unreasonable.", 42, 646, 136, 8.5, 12);
  text(pages[3], "Provider accountability map", 42, 596, 13, "F2", TEXT);
  providerCard(pages[3], "Recordkeeper", params.get("recordkeeper") || "Not visible", money(params.get("recordkeepingFees")), 42, 472, 124, LIGHT_BLUE);
  providerCard(pages[3], "Advisor", params.get("advisor") || "Not visible", money(params.get("advisoryFees")), 178, 472, 124, GREEN);
  providerCard(pages[3], "Trustee / Certification", params.get("trustee") || "Not visible", "Certified info", 314, 472, 124, ORANGE);
  providerCard(pages[3], "IQPA Auditor", params.get("auditor") || "Not visible", "ERISA 103(a)(3)(C)", 450, 472, 124, BLUE);
  roundedRect(pages[3], 42, 318, 528, 122, 12, PANEL);
  roundedRect(pages[3], 42, 318, 528, 122, 12, BORDER, true);
  text(pages[3], "Compensation and expense visibility", 60, 416, 13, "F2", TEXT);
  metricCard(pages[3], "Admin Fees", money(params.get("administrativeExpenses")), "", 60, 326, 146, GREEN);
  metricCard(pages[3], "Recordkeeper", money(params.get("recordkeepingFees")), "", 234, 326, 146, LIGHT_BLUE);
  metricCard(pages[3], "Advisor", money(params.get("advisoryFees")), "", 408, 326, 146, ORANGE);
  text(pages[3], "Plan design signals", 42, 282, 13, "F2", TEXT);
  signalTableRow(pages[3], ["Feature", "Observed in filing / audited notes"], 42, 252, [90, 164], true);
  (planDesignSignals.length ? planDesignSignals : ["Eligibility: Requires additional plan records.", "Auto-enrollment: Requires additional plan records.", "Employer contributions: Requires additional plan records.", "Vesting: Requires additional plan records."]).slice(0, 4).forEach((signal, index) => {
    const [feature, ...rest] = signal.split(":");
    signalTableRow(pages[3], [feature || "Feature", rest.join(":").trim() || signal], 42, 230 - index * 28, [90, 164], false, index % 2 === 1 ? ROW_STRIPE : undefined);
  });
  text(pages[3], "Investment menu signals", 314, 282, 13, "F2", TEXT);
  signalTableRow(pages[3], ["Area", "Observed in filing / audited notes"], 314, 252, [90, 164], true);
  (investmentMenuSignals.length ? investmentMenuSignals : ["Menu assets: Requires additional plan records.", "Mutual funds: Requires additional plan records.", "Common collective trusts: Requires additional plan records.", "Participant loans: Requires additional plan records."]).slice(0, 4).forEach((signal, index) => {
    const [area, ...rest] = signal.split(":");
    signalTableRow(pages[3], [area || "Area", rest.join(":").trim() || signal], 314, 230 - index * 28, [90, 164], false, index % 2 === 1 ? ROW_STRIPE : undefined);
  });
  roundedRect(pages[3], 42, 46, 528, 72, 12, "1 1 1");
  roundedRect(pages[3], 42, 46, 528, 72, 12, BORDER, true);
  roundedRect(pages[3], 42, 46, 5, 72, 2.5, BLUE);
  text(pages[3], "High-value topics for committee discussion", 62, 98, 12, "F2", TEXT);
  ["Are direct and indirect fees documented, benchmarked, and tied to service value?", "Does the plan design support recruiting, retention, and participant outcomes?", "Are terminated participant balances, loans, and distribution activity monitored as part of the annual fiduciary process?"].forEach((item, index) => {
    circle(pages[3], 66, 83 - index * 13, 2, GREEN);
    text(pages[3], item, 78, 80 - index * 13, 6.6, "F1", TEXT);
  });

  header(pages[4], "From Insight To Action", 5);
  text(pages[4], "From insight to action", 42, 680, 24, "F2", TEXT);
  paragraph(pages[4], "Public filings are a strong starting point, but they do not show the full fiduciary process. The next step is to compare the Form 5500 snapshot against the plan's actual provider disclosures, plan documents, investment policy, committee records, participant experience, and business objectives.", 42, 640, 132, 9.5, 14);
  [["01", "Confirm", "Validate Form 5500 observations against provider reports, service agreements, fee disclosures, and plan documents."], ["02", "Benchmark", "Evaluate fees, services, investment menu structure, participant behavior, and governance practices against plan size and complexity."], ["03", "Prioritize", "Identify the few actions that matter most and assign accountability across advisor, recordkeeper, auditor, payroll/TPA, and committee."]].forEach((item, index) => {
    const x = 42 + index * 184;
    const boxY = 452;
    const accent = index === 0 ? GREEN : index === 1 ? LIGHT_BLUE : ORANGE;
    roundedRect(pages[4], x, boxY, 160, 124, 12, "1 1 1");
    roundedRect(pages[4], x, boxY, 160, 124, 12, BORDER, true);
    circle(pages[4], x + 23, boxY + 96, 12, accent);
    text(pages[4], item[0], x + 17.8, boxY + 92.4, 8, "F2", "1 1 1");
    text(pages[4], item[1], x + 18, boxY + 68, 15, "F2", TEXT);
    paragraph(pages[4], item[2], x + 18, boxY + 46, 39, 7.4, 9.5, MUTED);
  });
  roundedRect(pages[4], 42, 208, 528, 178, 16, BLUE);
  svgLogo(pages[4], "white", 74, 330, 112);
  text(pages[4], "Recommended next step: Retirement Plan Consultation", 74, 304, 16.5, "F2", "1 1 1");
  paragraph(pages[4], "Everhart Advisors will walk through the three highest-priority observations, identify needed documents, and determine whether deeper fee, provider, or fiduciary process benchmarking is worth pursuing.", 74, 277, 104, 7.6, 9.8, "1 1 1");
  roundedRect(pages[4], 72, 226, 102, 24, 12, "0.180 0.490 0.700");
  text(pages[4], "3 priority observations", 86, 234, 7.1, "F2", "1 1 1");
  roundedRect(pages[4], 184, 226, 108, 24, 12, "0.180 0.490 0.700");
  text(pages[4], "Missing document list", 201, 234, 7.1, "F2", "1 1 1");
  roundedRect(pages[4], 302, 226, 108, 24, 12, "0.180 0.490 0.700");
  text(pages[4], "Benchmarking decision", 317, 234, 7.1, "F2", "1 1 1");
  roundedRect(pages[4], 424, 218, 132, 40, 12, "1 1 1");
  text(pages[4], "Schedule Consultation", 438, 233, 8.8, "F2", BLUE);
  addLink(pages[4], 424, 218, 132, 40, "https://calendly.com/chris_becker/retirement-plan-consultation");
  roundedRect(pages[4], 42, 62, 528, 116, 12, PANEL);
  roundedRect(pages[4], 42, 62, 528, 116, 12, BORDER, true);
  text(pages[4], "Documents that would help validate this review", 62, 144, 12, "F2", TEXT);
  paragraph(pages[4], "408(b)(2) disclosure, 404a-5 participant fee disclosure, investment lineup, service agreements, plan document/adoption agreement, recordkeeper reports, and recent committee materials.", 62, 116, 120, 8.5, 12, MUTED);
  text(pages[4], "Need help finding the disclosures? We've prepared guides on how to find them on 20+ recordkeepers here.", 62, 82, 8, "F2", BLUE);
  line(pages[4], 454, 80, 470, 80, BLUE, 0.5);
  addLink(pages[4], 452, 78, 22, 12, "https://drive.google.com/drive/folders/1tm39-Z3cdXqaH9YXtJgzCBspN_WXMwlM?usp=drive_link");

  header(pages[5], "Appendix And Disclosures", 6);
  text(pages[5], "Appendix: source data and important notes", 42, 680, 20, "F2", TEXT);
  paragraph(pages[5], "The items below summarize the primary source documents used to prepare this review and the limitations of a Form 5500-based analysis.", 42, 644, 128, 8.5, 12);
  tableRow(pages[5], ["Source item", "Where used in this review"], 42, 606, [190, 336], true);
  [
    ["Form 5500 basic plan information", "Plan sponsor, EIN, plan number, plan year, participant counts, plan characteristics, and attached schedules."],
    ["Schedule H and financial statements", "Net assets, investments, contributions, distributions, administrative expenses, participant loans, and annual change in net assets."],
    ["Schedule C", "Reported service providers and direct or indirect compensation items visible in the filing."],
    ["Schedule D and asset schedules", "Common collective trust, stable value, mutual fund, and plan investment information when visible."],
    ["Plan notes", "Eligibility, match, after-tax contributions, loans, hardship withdrawals, and plan operation descriptions when available."]
  ].forEach((row, index) => tableRow(pages[5], row, 42, 584 - index * 28, [190, 336], false, index % 2 === 1 ? ROW_STRIPE : undefined));
  roundedRect(pages[5], 42, 288, 528, 148, 12, PANEL);
  roundedRect(pages[5], 42, 288, 528, 148, 12, BORDER, true);
  text(pages[5], "Important limitations", 62, 410, 13, "F2", TEXT);
  [
    "This review is based on public filing information and audited financial statement disclosures.",
    "It does not replace plan document review, legal advice, tax advice, investment advice, or a complete fiduciary audit.",
    "Form 5500 data may not capture all indirect compensation, investment expense ratios, managed account fees, participant transaction fees, revenue sharing, float, or sponsor-paid expenses.",
    "No conclusion is made regarding whether any fee is reasonable, any investment is prudent, or any fiduciary process is sufficient."
  ].forEach((item, index) => {
    const y = 382 - index * 27;
    circle(pages[5], 66, y + 5, 2, GREEN);
    paragraph(pages[5], item, 76, y + 4, 132, 7.2, 9.2, TEXT);
  });
  text(pages[5], "Selected calculations", 42, 230, 13, "F2", TEXT);
  tableRow(pages[5], ["Calculation", "Formula"], 42, 202, [160, 366], true);
  [
    ["Asset growth", "(Ending net assets - beginning net assets) / beginning net assets"],
    ["Average balance", "Ending net assets / participants with account balances"],
    ["Direct admin fee bps", "Reported administrative fees / ending net assets x 10,000"],
    ["Net cash flow", "Total contributions - benefits paid - administrative fees"]
  ].forEach((row, index) => tableRow(pages[5], row, 42, 180 - index * 28, [160, 366], false, index % 2 === 1 ? ROW_STRIPE : undefined));
  text(pages[5], "Prepared by Everhart Advisors. External discussion materials. Not intended as legal or tax advice.", 42, 48, 6.8, "F1", "0.620 0.620 0.620");

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
