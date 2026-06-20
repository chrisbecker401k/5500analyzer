import { FileText, History, UploadCloud } from "lucide-react";

const steps = [
  { label: "Upload Document", icon: UploadCloud, color: "bg-blue-50 text-everhart-blue" },
  { label: "Generate PDF", icon: FileText, color: "bg-orange-50 text-orange-700" },
  { label: "History", icon: History, color: "bg-green-50 text-green-700" }
];

export function WorkflowCard() {
  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold text-slate-900">Workflow</h2>
      <div className="mt-7 grid grid-cols-3 gap-5 text-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="relative">
              {index < steps.length - 1 ? <div className="absolute left-[58%] top-10 h-px w-[84%] border-t-2 border-dotted border-slate-300" /> : null}
              <div className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full ${step.color}`}>
                <Icon className="h-9 w-9" />
              </div>
              <span className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-everhart-blue text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 font-bold text-everhart-blue">{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
