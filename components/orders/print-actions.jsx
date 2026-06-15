"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PrintActions({ backHref, backLabel = "Back" }) {
  return (
    <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 px-4 print:hidden">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-md bg-[#002395] px-3 py-2 text-sm font-medium text-white hover:bg-[#001a73]"
      >
        <Printer className="h-4 w-4" />
        Print / Save as PDF
      </button>
    </div>
  );
}
