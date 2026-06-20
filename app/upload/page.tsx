"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Download, FileText, Save, ScrollText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AnalysisSummaryPanel } from "@/components/AnalysisSummaryPanel";
import { DetectedDocumentCard } from "@/components/DetectedDocumentCard";
import { UploadDropzone } from "@/components/UploadDropzone";
import { StatusBadge } from "@/components/StatusBadge";
import { analyzeForm5500 } from "@/services/form5500Extractor";
import { calculateMetrics, generateDocxReport, generatePdfReport } from "@/services/reportGenerator";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { PlanAnalysis, ReportFile } from "@/types/plan";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<ReportFile[]>([]);
  const metrics = useMemo(() => (analysis ? calculateMetrics(analysis) : null), [analysis]);

  async function runAnalysis() {
    if (!file) return;
    setRunning(true);
    setFiles([]);
    setProgress(35);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setProgress(72);
    const result = await analyzeForm5500(file);
    setProgress(100);
    setAnalysis(result);
    setRunning(false);
  }

  async function generateReport() {
    if (!analysis || !metrics) return;
    setGenerating(true);
    const generated = await Promise.all([generatePdfReport(analysis, metrics), generateDocxReport(analysis, metrics)]);
    setFiles(generated);
    setGenerating(false);
  }

  function handleFileSelection(selectedFile: File) {
    setFile(selectedFile);
    setAnalysis(null);
    setFiles([]);
    setProgress(15);
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-slate-950">Upload Filing</h1>
      <p className="mt-2 text-slate-500">Upload your Form 5500 package and we&apos;ll extract and analyze the data.</p>
      <div className="mt-7 grid grid-cols-[1fr_460px] gap-5 pb-24">
        <section className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">Upload Form 5500 Package</h2>
          <div className="mt-5">
            <UploadDropzone onFile={handleFileSelection} />
          </div>
          {file ? <p className="mt-4 text-sm font-semibold text-everhart-blue">Selected: {file.name}</p> : null}
          <h2 className="mt-8 text-xl font-bold text-slate-900">Detected Documents</h2>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {[
              ["Form 5500", FileText, "text-everhart-blue"],
              ["Schedule H", ScrollText, "text-orange-600"],
              ["Schedule C", ScrollText, "text-green-700"],
              ["Schedule R", ScrollText, "text-violet-700"],
              ["Audited Financial Statements", FileText, "text-cyan-700"]
            ].map(([title, Icon, accent]) => (
              <DetectedDocumentCard key={title as string} title={title as string} icon={Icon as typeof FileText} accent={accent as string} />
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
            <CheckCircle2 className="mr-2 inline h-4 w-4 text-everhart-blue" />
            5 of 5 required documents detected. You can add more files if needed.
          </div>
          {analysis ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Extracted Data Preview</h3>
                <StatusBadge status="Ready" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <p><span className="block text-slate-500">Sponsor</span><strong>{analysis.companyName}</strong></p>
                <p><span className="block text-slate-500">Plan Year</span><strong>{analysis.planYear}</strong></p>
                <p><span className="block text-slate-500">Assets</span><strong>{formatCurrency(analysis.endingAssets)}</strong></p>
                <p><span className="block text-slate-500">Participants</span><strong>{formatNumber(analysis.participantsWithBalances)}</strong></p>
                <p><span className="block text-slate-500">Admin Fee</span><strong>{metrics?.adminFeeBps?.toFixed(1)} bps</strong></p>
                <p><span className="block text-slate-500">Average Balance</span><strong>{formatCurrency(metrics?.averageBalance ?? null)}</strong></p>
              </div>
              {files.length ? (
                <div className="mt-4 flex gap-3">
                  {files.map((generated) => (
                    <a
                      key={generated.id}
                      href={generated.url}
                      download={generated.fileName}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-everhart-blue"
                    >
                      <Download className="h-4 w-4" />
                      Download {generated.type.toUpperCase()}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
        <AnalysisSummaryPanel progress={progress} analysis={analysis} />
      </div>
      <div className="fixed bottom-0 left-72 right-0 z-20 border-t border-slate-200 bg-white/95 px-9 py-4 shadow-soft backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] justify-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-8 py-3 font-bold text-everhart-blue">
            <Save className="h-5 w-5" />
            Save Draft
          </button>
          {analysis ? (
            <button onClick={generateReport} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-everhart-orange px-8 py-3 font-bold text-white shadow-soft disabled:opacity-70">
              {generating ? "Generating..." : files.length ? "Regenerate Report" : "Generate Report"}
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={runAnalysis} disabled={running || !file} className="inline-flex items-center gap-2 rounded-lg bg-everhart-blue px-8 py-3 font-bold text-white shadow-soft disabled:opacity-50">
              {running ? "Running..." : file ? "Run Analysis" : "Select a PDF to Analyze"}
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
