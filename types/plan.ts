export type PlanStatus =
  | "Uploaded"
  | "Processing"
  | "Ready"
  | "Generated"
  | "Archived"
  | "Completed"
  | "Review Needed";

export type ReportFile = {
  id: string;
  planAnalysisId: string;
  type: "pdf" | "docx";
  fileName: string;
  url: string;
  createdAt: string;
};

export type PlanAnalysis = {
  id: string;
  companyName: string;
  planName: string;
  planYear: number;
  ein: string;
  planNumber: string;
  endingAssets: number | null;
  beginningAssets: number | null;
  netAssetChange: number | null;
  participantsWithBalances: number | null;
  activeParticipants: number | null;
  separatedParticipants: number | null;
  totalContributions: number | null;
  employerContributions: number | null;
  participantContributions: number | null;
  rollovers: number | null;
  benefitsPaid: number | null;
  administrativeExpenses: number | null;
  participantLoans: number | null;
  recordkeeper: string | null;
  advisor: string | null;
  auditor: string | null;
  trustee: string | null;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  confidenceScores: Record<string, number>;
  missingFields: string[];
  generatedFiles: ReportFile[];
};

export type CalculatedMetrics = {
  assetGrowthPercent: number | null;
  netCashFlow: number | null;
  contributionPercentOfAssets: number | null;
  benefitsPaidPercentOfAssets: number | null;
  loanPercentOfAssets: number | null;
  adminFeeBps: number | null;
  averageBalance: number | null;
};
