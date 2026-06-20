import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

export function DetectedDocumentCard({ title, icon: Icon, accent }: { title: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Icon className={`h-7 w-7 ${accent}`} />
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Detected
          </p>
        </div>
      </div>
    </div>
  );
}
