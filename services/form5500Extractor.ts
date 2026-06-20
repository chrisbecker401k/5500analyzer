import { mockPlanAnalyses } from "@/data/mockData";
import type { PlanAnalysis } from "@/types/plan";
import { extractPlanAnalysisFromText } from "@/services/form5500FieldMapper";

export async function analyzeForm5500(file: File): Promise<PlanAnalysis> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    return response.json() as Promise<PlanAnalysis>;
  }

  // Replace this mock with a secure extraction API call. Keep outputs limited to values visible
  // in the filing package, and label gaps instead of guessing.
  await new Promise((resolve) => setTimeout(resolve, 900));
  const base = mockPlanAnalyses[0];
  const companyName = file.name
    .replace(/\.pdf$/i, "")
    .replace(/form\s*5500/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sponsor = companyName || "Uploaded Plan Sponsor";

  return {
    ...base,
    id: `analysis-${Date.now()}`,
    companyName: sponsor,
    planName: `${sponsor} 401(k) Plan`,
    status: "Ready",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function parseUploadedPdf(file: File) {
  // TODO: Add real PDF parsing here.
  return `Parsed placeholder text from ${file.name}`;
}

export function detectSchedules(text: string) {
  void text;
  return ["Form 5500", "Schedule H", "Schedule C", "Schedule R"];
}

export function extractPlanIdentity(text: string) {
  const analysis = extractPlanAnalysisFromText(text);
  return { sponsor: analysis.companyName, planName: analysis.planName };
}

export function extractPlanEconomics(text: string) {
  const analysis = extractPlanAnalysisFromText(text);
  return { endingAssets: analysis.endingAssets, beginningAssets: analysis.beginningAssets };
}

export function extractParticipants(text: string) {
  const analysis = extractPlanAnalysisFromText(text);
  return { participantsWithBalances: analysis.participantsWithBalances, activeParticipants: analysis.activeParticipants };
}

export function extractProviders(text: string) {
  const analysis = extractPlanAnalysisFromText(text);
  return { recordkeeper: analysis.recordkeeper, advisor: analysis.advisor };
}

export function extractPlanDesign(text: string) {
  void text;
  return { automaticEnrollment: "Requires additional plan records" };
}

export function extractInvestmentMenu(text: string) {
  void text;
  return { investmentLineup: "Requires additional plan records" };
}
