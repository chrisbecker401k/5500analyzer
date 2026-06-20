"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, History, LayoutDashboard, Settings, UploadCloud, FileStack, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Filing", href: "/upload", icon: UploadCloud },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "History", href: "/history", icon: History },
  { label: "Templates", href: "/templates", icon: FileStack },
  { label: "Settings", href: "/settings", icon: Settings }
];

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2">
      <div className="flex h-8 items-end gap-1">
        <span className="h-3 w-1.5 rounded-full bg-everhart-orange" />
        <span className="h-5 w-1.5 rounded-full bg-everhart-lightBlue" />
        <span className="h-7 w-1.5 rounded-full bg-everhart-blue" />
      </div>
      <div className="text-2xl font-bold tracking-normal">
        <span className="text-everhart-blue">5500</span> <span className="text-slate-900">Analyzer</span>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col border-r border-slate-200 bg-white px-4 py-8">
      <Wordmark />
      <nav className="mt-9 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-semibold text-slate-600 transition",
                active ? "bg-everhart-blue text-white shadow-soft" : "hover:bg-slate-50 hover:text-everhart-blue"
              )}
            >
              <Icon className="h-6 w-6" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-6">
        <div className="rounded-lg bg-blue-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-everhart-blue">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-everhart-blue">Need help?</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">Visit our Help Center or contact support.</p>
              <p className="mt-4 text-sm font-bold text-everhart-blue">Go to Help Center</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-everhart-blue font-bold text-white">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Jane Doe</p>
              <p className="text-sm text-slate-500">Everhart Advisors</p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
