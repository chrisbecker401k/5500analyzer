import { FileText, PieChart, Timer, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuickActionsCard } from "@/components/QuickActionsCard";
import { RecentActivityTable } from "@/components/RecentActivityTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowCard } from "@/components/WorkflowCard";
import { mockPlanAnalyses } from "@/data/mockData";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-950">Dashboard</h1>
      </div>
      <section className="grid grid-cols-4 gap-5">
        <StatCard title="Reports Generated This Month" value="24" helper="Up 26% vs last month" icon={FileText} accent="blue" />
        <StatCard title="Avg. Processing Time" value="6.2 min" helper="Down 18% vs last month" icon={Timer} accent="green" />
        <StatCard title="Plans in History" value="186" helper="Total plans" icon={PieChart} accent="green" />
        <StatCard title="Ready to Generate" value="7" helper="Awaiting review" icon={UploadCloud} accent="orange" />
      </section>
      <section className="mt-5 grid grid-cols-[1fr_420px] gap-5">
        <RecentActivityTable />
        <QuickActionsCard />
      </section>
      <section className="mt-5 grid grid-cols-3 gap-5">
        <WorkflowCard />
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Reports</h2>
            <a href="/reports" className="font-bold text-everhart-blue">View all</a>
          </div>
          <div className="divide-y divide-slate-100">
            {mockPlanAnalyses.slice(0, 4).map((report) => (
              <div key={report.id} className="flex items-center gap-3 py-3">
                <FileText className="h-7 w-7 text-everhart-blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{report.companyName} - {report.planYear} Plan Review</p>
                  <p className="text-sm text-slate-500">Generated May 20, 2024</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-xl font-bold text-slate-900">At a Glance</h2>
          <div className="mt-7 flex items-center gap-7">
            <div className="grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#77bf63_0_67%,#79aee8_67%_84%,#F08A5C_84%_94%,#d5dbe4_94%_100%)]">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                <span className="text-2xl font-bold">186</span>
                <span className="-mt-7 text-sm text-slate-500">Total Plans</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {["Completed 124 (67%)", "Processing 32 (17%)", "Review Needed 18 (10%)", "Uploaded 12 (6%)"].map((label) => (
                <p key={label} className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-everhart-green" />{label}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
