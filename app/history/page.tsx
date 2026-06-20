import { Calendar, FileText, RotateCcw, Search, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReportHistoryTable } from "@/components/ReportHistoryTable";

const summaryStats: Array<[string, string, LucideIcon]> = [
  ["Total Reports", "87", FileText],
  ["This Month", "24", Calendar],
  ["Avg. Assets", "$54.8M", FileText]
];

export default function HistoryPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-slate-950">History</h1>
      <div className="mt-8 grid grid-cols-[1fr_280px_280px_320px_160px] gap-4">
        <div className="card flex items-center gap-3 px-4 py-4">
          <Search className="h-5 w-5 text-slate-500" />
          <input className="w-full outline-none" placeholder="Search by company name..." />
        </div>
        {["Plan Year", "Status", "Date Range"].map((label) => (
          <label key={label} className="card px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <select className="mt-1 w-full bg-transparent text-sm outline-none">
              <option>{label === "Date Range" ? "Apr 20, 2024 - May 20, 2024" : label === "Status" ? "All Statuses" : "All Years"}</option>
            </select>
          </label>
        ))}
        <button className="card inline-flex items-center justify-center gap-2 font-bold text-slate-600">
          <RotateCcw className="h-5 w-5" />
          Reset Filters
        </button>
      </div>
      <div className="mt-6 grid grid-cols-[1fr_300px] gap-5">
        <ReportHistoryTable />
        <aside className="card p-5">
          <div className="space-y-5 divide-y divide-slate-100">
            {summaryStats.map(([label, value, Icon]) => (
              <div key={label} className="flex items-center gap-4 pt-5 first:pt-0">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-everhart-blue">
                  <Icon className="h-7 w-7" />
                </span>
                <span>
                  <span className="block text-sm text-slate-600">{label}</span>
                  <span className="text-2xl font-bold text-slate-950">{value}</span>
                </span>
              </div>
            ))}
          </div>
          <h2 className="mt-7 font-bold text-slate-900">Status Distribution</h2>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#3b82f6_0_39%,#77bf63_39%_75%,#b7c0cc_75%_100%)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                <span className="text-2xl font-bold">87</span>
                <span className="-mt-7 text-sm text-slate-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>Generated <span className="float-right">34 (39%)</span></p>
            <p>Ready <span className="float-right">31 (36%)</span></p>
            <p>Archived <span className="float-right">22 (25%)</span></p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
