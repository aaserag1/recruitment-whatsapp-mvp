import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const labelsAr: Record<string, string> = {
  open: "مفتوحة",
  closed: "مغلقة",
  new: "جديد",
  reviewing: "قيد المراجعة",
  matched: "تمت المطابقة",
  contacted: "تم التواصل",
  not_requested: "بانتظار التحليل",
  processing: "قيد التحليل",
  completed: "تم التحليل",
  failed: "تعذر التحليل",
};

const labelsEn: Record<string, string> = {
  open: "Open", closed: "Closed", new: "New", reviewing: "Reviewing", matched: "Matched", contacted: "Contacted",
  not_requested: "Awaiting analysis", processing: "Analyzing", completed: "Analyzed", failed: "Analysis failed",
};

const palette: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  new: "bg-blue-50 text-blue-700 ring-blue-100",
  reviewing: "bg-amber-50 text-amber-700 ring-amber-100",
  matched: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  contacted: "bg-violet-50 text-violet-700 ring-violet-100",
  not_requested: "bg-slate-100 text-slate-600 ring-slate-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-100",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  failed: "bg-rose-50 text-rose-700 ring-rose-100",
};

export function StatusPill({ status }: { status: string }) {
  const { isArabic } = useLanguage();
  const labels = isArabic ? labelsAr : labelsEn;
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1", palette[status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>{labels[status] ?? status}</span>;
}
