"use client";

import { CloudUpload, FileText } from "lucide-react";

export function UploadDropzone({ onFile }: { onFile: (file: File) => void }) {
  return (
    <label className="flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/25 px-6 text-center transition hover:bg-blue-50">
      <input
        className="sr-only"
        type="file"
        accept="application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div className="relative">
        <CloudUpload className="h-24 w-24 text-blue-400" />
        <FileText className="absolute -bottom-4 left-9 h-14 w-14 rounded-full bg-blue-50 p-2 text-blue-300" />
      </div>
      <p className="mt-10 text-lg font-bold text-slate-900">
        Drag and drop PDF files or <span className="text-everhart-blue">browse</span> your computer.
      </p>
      <p className="mt-2 text-sm text-slate-500">We&apos;ll automatically detect and organize the required documents.</p>
      <span className="mt-6 rounded-lg bg-everhart-blue px-5 py-3 font-bold text-white shadow-soft">Browse Files</span>
      <p className="mt-4 text-sm text-slate-500">Supports PDF files up to 100MB</p>
    </label>
  );
}
