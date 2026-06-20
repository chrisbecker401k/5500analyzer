import type { PlanAnalysis } from "@/types/plan";
import { extractPlanAnalysisFromText } from "@/services/form5500FieldMapper";

export async function analyzeForm5500(file: File): Promise<PlanAnalysis> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const fallbackName = file.name
      .replace(/\.pdf$/i, "")
      .replace(/form\s*5500/gi, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Uploaded Plan Sponsor";

    return {
      id: `analysis-${Date.now()}`,
      companyName: fallbackName,
      planName: "Not visible in filing",
      planYear: new Date().getFullYear(),
      ein: "Not visible in filing",
      planNumber: "Not visible",
      endingAssets: null,
      beginningAssets: null,
      netAssetChange: null,
      participantsWithBalances: null,
      activeParticipants: null,
      separatedParticipants: null,
      totalContributions: null,
      employerContributions: null,
      participantContributions: null,
      rollovers: null,
      benefitsPaid: null,
      administrativeExpenses: null,
      participantLoans: null,
      recordkeeper: null,
      advisor: null,
      auditor: null,
      trustee: null,
      status: "Review Needed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidenceScores: {},
      missingFields: ["PDF text extraction failed", "Requires additional plan records"],
      generatedFiles: [],
      extractionWarnings: ["PDF text extraction failed. No unsupported values were guessed."],
      sourceFields: {
        planIdentity: "Not visible in filing",
        participantCounts: "Not visible in filing",
        planEconomics: "Not visible in filing",
        providers: "Not visible in filing"
      }
    };
  }

  return response.json() as Promise<PlanAnalysis>;
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
