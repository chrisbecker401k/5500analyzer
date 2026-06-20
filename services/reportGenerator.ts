import { canCalculateMetric } from "@/services/compliance";
import type { CalculatedMetrics, PlanAnalysis, ReportFile } from "@/types/plan";

function reportQuery(planAnalysis: PlanAnalysis, calculatedMetrics: CalculatedMetrics) {
  const params = new URLSearchParams({
    companyName: planAnalysis.companyName,
    planName: planAnalysis.planName,
    planYear: String(planAnalysis.planYear),
    ein: planAnalysis.ein,
    planNumber: planAnalysis.planNumber,
    beginningAssets: String(planAnalysis.beginningAssets ?? ""),
    endingAssets: String(planAnalysis.endingAssets ?? ""),
    participantsWithBalances: String(planAnalysis.participantsWithBalances ?? ""),
    recordkeeper: planAnalysis.recordkeeper ?? "Not visible in filing",
    advisor: planAnalysis.advisor ?? "Not visible in filing",
    auditor: planAnalysis.auditor ?? "Not visible in filing",
    assetGrowthPercent: String(calculatedMetrics.assetGrowthPercent ?? ""),
    averageBalance: String(calculatedMetrics.averageBalance ?? ""),
    adminFeeBps: String(calculatedMetrics.adminFeeBps ?? ""),
    netCashFlow: String(calculatedMetrics.netCashFlow ?? ""),
    contributionPercentOfAssets: String(calculatedMetrics.contributionPercentOfAssets ?? ""),
    benefitsPaidPercentOfAssets: String(calculatedMetrics.benefitsPaidPercentOfAssets ?? ""),
    loanPercentOfAssets: String(calculatedMetrics.loanPercentOfAssets ?? ""),
    totalContributions: String(planAnalysis.totalContributions ?? ""),
    benefitsPaid: String(planAnalysis.benefitsPaid ?? ""),
    administrativeExpenses: String(planAnalysis.administrativeExpenses ?? ""),
    participantLoans: String(planAnalysis.participantLoans ?? ""),
    netAssetChange: String(planAnalysis.netAssetChange ?? "")
  });
  if (planAnalysis.recordkeepingFees !== undefined && planAnalysis.recordkeepingFees !== null) {
    params.set("recordkeepingFees", String(planAnalysis.recordkeepingFees));
  }
  if (planAnalysis.advisoryFees !== undefined && planAnalysis.advisoryFees !== null) {
    params.set("advisoryFees", String(planAnalysis.advisoryFees));
  }
  if (planAnalysis.netInvestmentGain !== undefined && planAnalysis.netInvestmentGain !== null) {
    params.set("netInvestmentGain", String(planAnalysis.netInvestmentGain));
  }
  if (planAnalysis.mutualFundAssets !== undefined && planAnalysis.mutualFundAssets !== null) {
    params.set("mutualFundAssets", String(planAnalysis.mutualFundAssets));
  }
  if (planAnalysis.stableValueAssets !== undefined && planAnalysis.stableValueAssets !== null) {
    params.set("stableValueAssets", String(planAnalysis.stableValueAssets));
  }
  if (planAnalysis.planDesignSignals?.length) {
    params.set("planDesignSignals", planAnalysis.planDesignSignals.join("|"));
  }
  if (planAnalysis.investmentMenuSignals?.length) {
    params.set("investmentMenuSignals", planAnalysis.investmentMenuSignals.join("|"));
  }

  return params.toString();
}

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
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `docx-${planAnalysis.id}`,
    planAnalysisId: planAnalysis.id,
    type: "docx",
    fileName: `${planAnalysis.companyName.toLowerCase().replace(/\W+/g, "_")}_401k_plan_review.docx`,
    url: `/api/reports/docx?${reportQuery(planAnalysis, calculatedMetrics)}`,
    createdAt: new Date().toISOString()
  };
}

export async function generatePdfReport(
  planAnalysis: PlanAnalysis,
  calculatedMetrics: CalculatedMetrics
): Promise<ReportFile> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `pdf-${planAnalysis.id}`,
    planAnalysisId: planAnalysis.id,
    type: "pdf",
    fileName: `${planAnalysis.companyName.toLowerCase().replace(/\W+/g, "_")}_401k_plan_review.pdf`,
    url: `/api/reports/pdf?${reportQuery(planAnalysis, calculatedMetrics)}`,
    createdAt: new Date().toISOString()
  };
}

export function validateReportOutput(report: ReportFile) {
  // Real validation should verify the generated file exists, opens, includes required sections,
  // preserves template hyperlinks, and avoids unsupported advice.
  return Boolean(report.id && report.planAnalysisId && report.url);
}
