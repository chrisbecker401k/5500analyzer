import { CheckCircle2, ExternalLink, FileText, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";

export default function TemplatesPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-slate-950">Templates</h1>
      <p className="mt-2 text-slate-500">Manage report templates used for generated 401(k) Plan Reviews.</p>
      <section className="mt-8 grid grid-cols-[520px_1fr] gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-everhart-blue">
              <FileText className="h-8 w-8" />
            </span>
            <span className="rounded-md bg-green-50 px-3 py-1 text-sm font-bold text-green-700">Active</span>
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-900">Everhart 401(k) Report Template</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Default plan review template for MVP report generation. Page 5 hyperlinks are intentionally retained in the source template asset for the future DOCX/PDF generator.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-700" />Everhart branding included</p>
            <p className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-everhart-blue" />Page 5 hyperlinks preserved in template asset</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="rounded-lg bg-everhart-blue px-5 py-3 font-bold text-white shadow-soft">Set as Default</button>
            <a href="/templates/everhart-401k-report-template.pdf" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 font-bold text-everhart-blue">
              Preview
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-bold text-slate-900">Template Preview</h2>
          </div>
          <div className="grid min-h-[520px] place-items-center bg-slate-50 p-8">
            <div className="aspect-[8.5/11] w-80 rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
              <Image src="/logos/everhart-logo-color.svg" alt="Everhart Advisors" width={180} height={40} className="h-10 w-auto" />
              <div className="mt-16 h-4 w-48 rounded-full bg-everhart-blue" />
              <div className="mt-4 h-3 w-56 rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-44 rounded-full bg-slate-200" />
              <div className="mt-12 grid grid-cols-2 gap-4">
                <div className="h-24 rounded-lg bg-blue-50" />
                <div className="h-24 rounded-lg bg-orange-50" />
                <div className="h-24 rounded-lg bg-green-50" />
                <div className="h-24 rounded-lg bg-slate-100" />
              </div>
              <div className="mt-12 h-2 w-full rounded-full bg-slate-200" />
              <div className="mt-3 h-2 w-4/5 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
