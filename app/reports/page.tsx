import { Download, Eye, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { mockPlanAnalyses } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";

const reportStatuses = ["Uploaded", "Processing", "Ready", "Generated", "Archived"] as const;

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Reports</h1>
          <p className="mt-2 text-slate-500">Track report generation status and open generated plan review files.</p>
        </div>
        <button className="rounded-lg bg-everhart-blue px-5 py-3 font-bold text-white shadow-soft">Generate Report</button>
      </div>
      <section className="mt-8 grid grid-cols-5 gap-4">
        {reportStatuses.map((status) => (
          <div key={status} className="card p-5">
            <StatusBadge status={status} />
            <p className="mt-4 text-3xl font-bold text-everhart-blue">{status === "Ready" ? 7 : status === "Generated" ? 24 : 3}</p>
            <p className="text-sm text-slate-500">{status} reports</p>
          </div>
        ))}
      </section>
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-bold text-slate-900">Recent Reports</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {mockPlanAnalyses.map((report) => (
            <div key={report.id} className="grid grid-cols-[1fr_130px_160px_170px_220px] items-center gap-4 px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-everhart-blue">
                  <FileText className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-slate-900">{report.companyName} - {report.planYear} Plan Review</p>
                  <p className="text-sm text-slate-500">{report.planName}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{report.planYear}</span>
              <span className="text-sm">{formatCurrency(report.endingAssets, true)}</span>
              <StatusBadge status={report.status} />
              <div className="flex justify-end gap-2">
                <a href="/mock-reports/company_401k_plan_review.pdf" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-everhart-blue">
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <button className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  <Eye className="h-4 w-4" />
                  Open Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
