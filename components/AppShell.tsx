import { Bell, UserCircle, Upload } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-72">
        <div className="mx-auto max-w-[1500px] px-9 py-7">
          <div className="mb-7 flex justify-end gap-5">
            <div className="relative text-slate-600">
              <Bell className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-everhart-orange text-xs font-bold text-white">
                3
              </span>
            </div>
            <UserCircle className="h-7 w-7 text-slate-600" />
            <Link
              href="/upload"
              className="ml-4 inline-flex items-center gap-2 rounded-lg bg-everhart-blue px-5 py-3 font-bold text-white shadow-soft transition hover:bg-blue-800"
            >
              <Upload className="h-5 w-5" />
              Upload Form 5500
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
