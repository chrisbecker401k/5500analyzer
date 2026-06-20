import { canCalculateMetric } from "@/services/compliance";
import type { CalculatedMetrics, PlanAnalysis, ReportFile } from "@/types/plan";

export function calculateMetrics(planAnalysis: PlanAnalysis): CalculatedMetrics {
  const {
    beginningAssets,
    endingAssets,
    totalContributions,
    benefitsPaid,
    participantLoans,
    administrativeExpenses,
    participantsWithBalances
  } = planAnalysis;

  return {
    assetGrowthPercent: canCalculateMetric(endingAssets, beginningAssets) && beginningAssets !== 0
      ? ((endingAssets! - beginningAssets!) / beginningAssets!) * 100
      : null,
    netCashFlow: canCalculateMetric(totalContributions, benefitsPaid)
      ? totalContributions! - benefitsPaid!
      : null,
    contributionPercentOfAssets: canCalculateMetric(totalContributions, endingAssets) && endingAssets !== 0
      ? (totalContributions! / endingAssets!) * 100
      : null,
    benefitsPaidPercentOfAssets: canCalculateMetric(benefitsPaid, endingAssets) && endingAssets !== 0
      ? (benefitsPaid! / endingAssets!) * 100
      : null,
    loanPercentOfAssets: canCalculateMetric(participantLoans, endingAssets) && endingAssets !== 0
      ? (participantLoans! / endingAssets!) * 100
      : null,
    adminFeeBps: canCalculateMetric(administrativeExpenses, endingAssets) && endingAssets !== 0
      ? (administrativeExpenses! / endingAssets!) * 10000
      : null,
    averageBalance: canCalculateMetric(endingAssets, participantsWithBalances) && participantsWithBalances !== 0
      ? endingAssets! / participantsWithBalances!
      : null
  };
}

export async function generateDocxReport(
  planAnalysis: PlanAnalysis,
  calculatedMetrics: CalculatedMetrics
): Promise<ReportFile> {
  void calculatedMetrics;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `docx-${planAnalysis.id}`,
    planAnalysisId: planAnalysis.id,
    type: "docx",
    fileName: `${planAnalysis.companyName.toLowerCase().replace(/\W+/g, "_")}_401k_plan_review.docx`,
    url: "/mock-reports/company_401k_plan_review.docx",
    createdAt: new Date().toISOString()
  };
}

export async function generatePdfReport(
  planAnalysis: PlanAnalysis,
  calculatedMetrics: CalculatedMetrics
): Promise<ReportFile> {
  void calculatedMetrics;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `pdf-${planAnalysis.id}`,
    planAnalysisId: planAnalysis.id,
    type: "pdf",
    fileName: `${planAnalysis.companyName.toLowerCase().replace(/\W+/g, "_")}_401k_plan_review.pdf`,
    url: "/mock-reports/company_401k_plan_review.pdf",
    createdAt: new Date().toISOString()
  };
}

export function validateReportOutput(report: ReportFile) {
  // Real validation should verify the generated file exists, opens, includes required sections,
  // preserves template hyperlinks, and avoids unsupported advice.
  return Boolean(report.id && report.planAnalysisId && report.url);
}
