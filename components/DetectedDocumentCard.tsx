import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDashed } from "lucide-react";

export function DetectedDocumentCard({ title, icon: Icon, accent, detected = false }: { title: string; icon: LucideIcon; accent: string; detected?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Icon className={`h-7 w-7 ${accent}`} />
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          <p className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${detected ? "text-green-700" : "text-slate-500"}`}>
            {detected ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
            {detected ? "Detected" : "Pending"}
          </p>
        </div>
      </div>
    </div>
  );
}
