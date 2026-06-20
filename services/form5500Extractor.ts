import { mockPlanAnalyses } from "@/data/mockData";
import type { PlanAnalysis } from "@/types/plan";

export async function analyzeForm5500(file: File): Promise<PlanAnalysis> {
  // Replace this mock with a secure extraction API call. Keep outputs limited to values visible
  // in the filing package, and label gaps instead of guessing.
  await new Promise((resolve) => setTimeout(resolve, 900));
  const base = mockPlanAnalyses[0];
  return {
    ...base,
    id: `analysis-${Date.now()}`,
    companyName: file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ") || base.companyName,
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
  void text;
  return { sponsor: "Northwind Group", planName: "Northwind Group 401(k) Plan" };
}

export function extractPlanEconomics(text: string) {
  void text;
  return { endingAssets: 125430000, beginningAssets: 116800000 };
}

export function extractParticipants(text: string) {
  void text;
  return { participantsWithBalances: 1245, activeParticipants: 1108 };
}

export function extractProviders(text: string) {
  void text;
  return { recordkeeper: "Fidelity", advisor: "Everhart Advisors" };
}

export function extractPlanDesign(text: string) {
  void text;
  return { automaticEnrollment: "Requires additional plan records" };
}

export function extractInvestmentMenu(text: string) {
  void text;
  return { investmentLineup: "Requires additional plan records" };
}
