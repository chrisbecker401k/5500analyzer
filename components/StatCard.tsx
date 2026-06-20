import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon?: LucideIcon;
  accent?: "blue" | "green" | "orange" | "gray";
  children?: React.ReactNode;
};

const accentMap = {
  blue: "text-everhart-blue bg-blue-50",
  green: "text-green-700 bg-green-50",
  orange: "text-orange-700 bg-orange-50",
  gray: "text-slate-600 bg-slate-50"
};

export function StatCard({ title, value, helper, icon: Icon, accent = "blue", children }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-3 text-4xl font-bold text-everhart-blue">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        {Icon ? (
          <div className={cn("rounded-full p-3", accentMap[accent])}>
            <Icon className="h-6 w-6" />
          </div>
        ) : children}
      </div>
    </div>
  );
}
