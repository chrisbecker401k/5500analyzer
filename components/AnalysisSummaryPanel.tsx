import { BriefcaseBusiness, FileText, ShieldCheck, UserRound } from "lucide-react";
import type { PlanAnalysis } from "@/types/plan";
import { formatCurrency, formatNumber } from "@/lib/utils";

const fieldIcons = [UserRound, UserRound, FileText, BriefcaseBusiness, UserRound, UserRound, UserRound, UserRound];

export function AnalysisSummaryPanel({ progress = 60, analysis }: { progress?: number; analysis?: PlanAnalysis | null }) {
  const fields = [
    ["Sponsor", analysis?.companyName ?? "Northwind Group", 98],
    ["Plan Name", analysis?.planName ?? "Northwind Retirement Plan", 97],
    ["Plan Year", analysis?.planYear?.toString() ?? "2024", 99],
    ["Ending Net Assets", formatCurrency(analysis?.endingAssets ?? 125430000), 96],
    ["Participants with Balances", formatNumber(analysis?.participantsWithBalances ?? 186), 95],
    ["Recordkeeper", analysis?.recordkeeper ?? "Fidelity Institutional", 82],
    ["Advisor", analysis?.advisor ?? "Everhart Advisors", 78],
    ["Auditor", analysis?.auditor ?? "Johnson & Company, LLP", 80]
  ];

  return (
    <aside className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Analysis Summary</h2>
        <span className="text-sm font-semibold text-slate-700">{progress >= 100 ? "Complete" : "3 of 5 complete"}</span>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold text-slate-900">
          <span>Extraction Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-everhart-blue transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-4 text-sm text-slate-500">{progress >= 100 ? "Analysis ready for report generation." : "Extracting data from documents..."}</p>
      </div>
      <div className="mt-7 border-t border-slate-200 pt-6">
        <h3 className="font-bold text-slate-900">Detected Fields</h3>
        <div className="mt-4 divide-y divide-slate-100">
          {fields.map(([label, value, confidence], index) => {
            const Icon = fieldIcons[index];
            const high = Number(confidence) >= 90;
            return (
              <div key={label.toString()} className="flex items-center gap-3 py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${high ? "bg-blue-50 text-everhart-blue" : "bg-orange-50 text-orange-600"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{label}</p>
                  <p className="truncate text-sm text-slate-500">{value}</p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${high ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                  {high ? "High" : "Medium"} ({confidence}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4" />
        Confidence scores reflect the accuracy of extracted data.
      </p>
    </aside>
  );
}
