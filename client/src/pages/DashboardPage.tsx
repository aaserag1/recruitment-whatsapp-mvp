import { PlatformMark } from "@/components/PlatformMark";
import { SectionHeading } from "@/components/SectionHeading";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BriefcaseBusiness, MessageCircleMore, Sparkles, UserRoundPlus, Users } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { isArabic, direction } = useLanguage();
  const { data: jobs, error: jobsError } = trpc.jobs.list.useQuery();
  const { data: candidates, error: candidatesError } = trpc.candidates.list.useQuery();
  const metrics = useMemo(() => ({
    jobs: jobs?.length ?? 0,
    open: jobs?.filter(job => job.status === "open").length ?? 0,
    candidates: candidates?.length ?? 0,
    matched: candidates?.filter(candidate => candidate.status === "matched").length ?? 0,
  }), [jobs, candidates]);
  const copy = isArabic ? {
    eyebrow: "مركز العمليات", title: "نظرة عامة", description: "تابع دورة التوظيف من استقبال المرشح وحتى تقديم الوظيفة المناسبة، من لوحة واحدة.",
    chat: "فتح تجربة المحادثة", allJobs: "كل الوظائف", openJobs: "وظائف مفتوحة", allCandidates: "كل المرشحين", matched: "مطابقات ناجحة",
    recent: "آخر المرشحين", recentDescription: "المرشحون المسجلون حديثًا داخل المنصة.", manage: "إدارة المرشحين", emptyTitle: "لا توجد بيانات مرشحين بعد", emptyDescription: "شغّل تجربة المحادثة لبدء استقبال بيانات المرشحين.",
    ready: "ابدأ تجربة التسجيل من منظور المرشح.", readyDescription: "تحاكي الواجهة محادثة واتساب، وتربط السيرة الذاتية بالبيانات، ثم تعرض الوظائف الأكثر ملاءمة.", launch: "فتح محاكاة المحادثة",
  } : {
    eyebrow: "OPERATIONS CENTER", title: "Overview", description: "Monitor the hiring journey from candidate intake to the right job recommendation in one workspace.",
    chat: "Open chat experience", allJobs: "All jobs", openJobs: "Open jobs", allCandidates: "All candidates", matched: "Successful matches",
    recent: "Recent candidates", recentDescription: "Candidates most recently registered in the platform.", manage: "Manage candidates", emptyTitle: "No candidate records yet", emptyDescription: "Launch the chat experience to start collecting candidate information.",
    ready: "Start the intake journey from the candidate's view.", readyDescription: "The experience simulates WhatsApp, connects the CV to candidate data, then presents the most suitable jobs.", launch: "Open chat simulation",
  };

  return <div className="mx-auto max-w-7xl space-y-8" dir={direction}>
    <SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<Button className="bg-[#0d4b45] hover:bg-[#083e39]" onClick={() => navigate("/candidate-chat")}><MessageCircleMore className="ml-2 size-4" />{copy.chat}</Button>} />
    {(jobsError || candidatesError) && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{isArabic ? "تعذر تحميل بعض بيانات لوحة التحكم. أعد المحاولة." : "Some dashboard data could not be loaded. Please try again."}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<BriefcaseBusiness />} label={copy.allJobs} value={metrics.jobs} tint="bg-[#e7f4ee] text-[#0d665e]" />
      <Metric icon={<Sparkles />} label={copy.openJobs} value={metrics.open} tint="bg-[#f8f2e5] text-[#987831]" />
      <Metric icon={<Users />} label={copy.allCandidates} value={metrics.candidates} tint="bg-[#eef3fc] text-[#416bc0]" />
      <Metric icon={<UserRoundPlus />} label={copy.matched} value={metrics.matched} tint="bg-[#f1ecfb] text-[#7959af]" />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-[#dce6e3] bg-white p-6 shadow-[0_8px_30px_rgba(24,73,67,0.04)]">
        <div className="flex items-center justify-between gap-3"><div><p className="font-extrabold text-[#173f3c]">{copy.recent}</p><p className="mt-1 text-sm text-[#708482]">{copy.recentDescription}</p></div><Button variant="ghost" className="text-[#0d665e]" onClick={() => navigate("/candidates")}>{copy.manage}<ArrowLeft className="mr-2 size-4" /></Button></div>
        {candidates?.length ? <div className="mt-5 divide-y divide-[#eef3f1]">{candidates.slice(0, 5).map(candidate => <button className="flex w-full items-center justify-between py-4 text-start" onClick={() => navigate(`/candidates/${candidate.id}`)} key={candidate.id}><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-[#eff6f3] text-sm font-extrabold text-[#0d665e]">{candidate.fullName.slice(0, 1)}</div><div><p className="text-sm font-extrabold text-[#173f3c]">{candidate.fullName}</p><p className="mt-1 text-xs text-[#708482]">{candidate.desiredJobTitle} · {candidate.preferredLocation}</p></div></div><StatusPill status={candidate.status} /></button>)}</div> : <Empty title={copy.emptyTitle} description={copy.emptyDescription} action={copy.chat} onClick={() => navigate("/candidate-chat")} />}
      </section>
      <section className="rounded-2xl border border-[#dce6e3] bg-[#103f3b] p-6 text-white shadow-[0_8px_30px_rgba(24,73,67,0.10)]"><PlatformMark /><p className="mt-10 text-xs font-extrabold tracking-[0.15em] text-[#e1c47c]">READY FOR CANDIDATES</p><h2 className="mt-3 text-2xl font-extrabold leading-tight">{copy.ready}</h2><p className="mt-3 text-sm leading-6 text-[#c7ded8]">{copy.readyDescription}</p><Button className="mt-7 w-full bg-white text-[#0d4b45] hover:bg-[#edf7f3]" onClick={() => navigate("/candidate-chat")}>{copy.launch}<ArrowLeft className="mr-2 size-4" /></Button></section>
    </div>
  </div>;
}

function Metric({ icon, label, value, tint }: { icon: ReactNode; label: string; value: number; tint: string }) { return <div className="rounded-2xl border border-[#dce6e3] bg-white p-5 shadow-[0_8px_30px_rgba(24,73,67,0.04)]"><div className={`grid size-10 place-items-center rounded-xl ${tint}`}>{icon}</div><p className="mt-5 text-xs font-bold text-[#708482]">{label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-[#173f3c]">{value}</p></div>; }
function Empty({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) { return <div className="mt-6 rounded-xl bg-[#f7fbf9] p-7 text-center"><p className="font-extrabold text-[#173f3c]">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#708482]">{description}</p><Button variant="outline" className="mt-4 border-[#bfd8d0] bg-white" onClick={onClick}>{action}</Button></div>; }
