import Link from "next/link";
import { ChevronRight, FileStack, History, UploadCloud } from "lucide-react";

const actions = [
  { title: "Upload New Filing", helper: "Upload a new Form 5500", href: "/upload", icon: UploadCloud, color: "bg-blue-50 text-everhart-blue" },
  { title: "View History", helper: "Browse past filings", href: "/history", icon: History, color: "bg-orange-50 text-orange-700" },
  { title: "Open Templates", helper: "Access report templates", href: "/templates", icon: FileStack, color: "bg-green-50 text-green-700" }
];

export function QuickActionsCard() {
  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
      <div className="mt-4 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className={`flex items-center gap-4 rounded-lg p-4 ${action.color}`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Icon className="h-7 w-7" />
              </span>
              <span className="flex-1">
                <span className="block font-bold">{action.title}</span>
                <span className="text-sm text-slate-600">{action.helper}</span>
              </span>
              <ChevronRight className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
