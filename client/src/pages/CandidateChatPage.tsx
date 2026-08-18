import { AIChatBox, type Message } from "@/components/AIChatBox";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { PlatformMark } from "@/components/PlatformMark";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, FileUp, Loader2, MapPin, Paperclip, ShieldCheck, Sparkles } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type IntakeKey = "fullName" | "preferredLocation" | "currentSalary" | "expectedSalary" | "yearsExperience" | "noticePeriodDays" | "desiredJobTitle";
type IntakeValues = Record<IntakeKey, string>;
const emptyValues: IntakeValues = { fullName: "", preferredLocation: "", currentSalary: "", expectedSalary: "", yearsExperience: "", noticePeriodDays: "", desiredJobTitle: "" };

export default function CandidateChatPage() {
  const [, navigate] = useLocation();
  const { isArabic, direction } = useLanguage();
  const l = (ar: string, en: string) => isArabic ? ar : en;
  const prompts = useMemo<Array<{ key: IntakeKey; question: string; placeholder: string }>>(() => isArabic ? [
    { key: "fullName", question: "أهلًا بك. ما الاسم الكامل الذي تود تسجيله؟", placeholder: "اكتب اسمك الكامل" },
    { key: "preferredLocation", question: "شكرًا. ما الموقع أو المدينة التي تفضل العمل فيها؟", placeholder: "مثال: الرياض أو عن بُعد" },
    { key: "currentSalary", question: "ما الراتب الحالي؟ اكتب الرقم فقط إن أمكن.", placeholder: "مثال: 12000" },
    { key: "expectedSalary", question: "وما الراتب المتوقع؟", placeholder: "مثال: 16000" },
    { key: "yearsExperience", question: "كم سنة من الخبرة المهنية لديك؟", placeholder: "مثال: 5" },
    { key: "noticePeriodDays", question: "ما مدة فترة الإشعار بالأيام؟", placeholder: "مثال: 30" },
    { key: "desiredJobTitle", question: "ما المسمى الوظيفي الذي تبحث عنه؟", placeholder: "مثال: مدير مبيعات" },
  ] : [
    { key: "fullName", question: "Welcome. What is your full name?", placeholder: "Type your full name" },
    { key: "preferredLocation", question: "Thank you. Which city or work location do you prefer?", placeholder: "Example: Dubai or Remote" },
    { key: "currentSalary", question: "What is your current salary? Please enter a number.", placeholder: "Example: 12000" },
    { key: "expectedSalary", question: "What is your expected salary?", placeholder: "Example: 16000" },
    { key: "yearsExperience", question: "How many years of professional experience do you have?", placeholder: "Example: 5" },
    { key: "noticePeriodDays", question: "What is your notice period in days?", placeholder: "Example: 30" },
    { key: "desiredJobTitle", question: "Which job title are you looking for?", placeholder: "Example: Sales Manager" },
  ], [isArabic]);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<IntakeValues>(emptyValues);
  const [file, setFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: prompts[0].question }]);
  useEffect(() => { if (stepIndex === 0 && messages.length === 1) setMessages([{ role: "assistant", content: prompts[0].question }]); }, [messages.length, prompts, stepIndex]);
  const submit = trpc.candidateIntake.submit.useMutation({
    onSuccess: data => {
      const extracted = data.extraction ? l(`\n\nتمت قراءة السيرة الذاتية واستخراج: **${data.extraction.title}**، وخبرة **${data.extraction.experienceYears} سنوات**.`, `\n\nYour CV was read and we found: **${data.extraction.title}**, with **${data.extraction.experienceYears} years** of experience.`) : "";
      const text = data.matches.length ? l(`شكرًا، تم تسجيل بياناتك بنجاح.${extracted}\n\nوجدت الوظائف التالية الأقرب إلى بياناتك. اختر وظيفة لعرض التفاصيل ورابط التقديم:`, `Thank you, your details were registered successfully.${extracted}\n\nThese are the jobs closest to your profile. Select one to view the details and application link:`) : l(`شكرًا، تم تسجيل بياناتك بنجاح.${extracted}\n\nلا توجد وظيفة مطابقة متاحة حاليًا، وسيقوم فريق التوظيف بمراجعة ملفك.`, `Thank you, your details were registered successfully.${extracted}\n\nThere is no suitable open role at the moment. Our recruitment team will review your profile.`);
      setMessages(current => [...current, { role: "assistant", content: text }]);
    },
    onError: error => { toast.error(error.message); setMessages(current => [...current, { role: "assistant", content: l("تعذر إكمال التسجيل حاليًا. يرجى المحاولة مرة أخرى.", "We could not complete your registration right now. Please try again.") }]); },
  });
  const answer = (content: string) => {
    if (submit.isPending || selectedJobId !== null) return;
    const prompt = prompts[stepIndex];
    if (!prompt || !content.trim()) return;
    setValues(current => ({ ...current, [prompt.key]: content.trim() }));
    const next = stepIndex + 1;
    const uploadPrompt = l("ممتاز. الآن أرفق سيرتك الذاتية بصيغة PDF أو Word لنكمل المطابقة.", "Great. Now attach your CV as a PDF or Word document so we can complete the match.");
    setMessages(current => [...current, { role: "user", content: content.trim() }, ...(next < prompts.length ? [{ role: "assistant" as const, content: prompts[next].question }] : [{ role: "assistant" as const, content: uploadPrompt }])]);
    setStepIndex(next);
  };
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(nextFile.type)) { toast.error(l("ارفع ملف PDF أو Word بصيغة DOCX فقط.", "Upload a PDF or DOCX file only.")); return; }
    if (nextFile.size > 10 * 1024 * 1024) { toast.error(l("الحد الأقصى لحجم السيرة الذاتية هو 10 ميغابايت.", "The maximum CV size is 10 MB.")); return; }
    setFile(nextFile);
    const dataBase64 = await readBase64(nextFile);
    setMessages(current => [...current, { role: "user", content: l(`تم إرفاق الملف: ${nextFile.name}`, `File attached: ${nextFile.name}`) }, { role: "assistant", content: l("جارٍ حفظ السيرة الذاتية وتحليلها ومطابقتها مع الوظائف المتاحة…", "Saving, analyzing, and matching your CV with open jobs…") }]);
    submit.mutate({ ...values, language: isArabic ? "ar" : "en", currentSalary: Number(values.currentSalary), expectedSalary: Number(values.expectedSalary), yearsExperience: Number(values.yearsExperience), noticePeriodDays: Number(values.noticePeriodDays), cvFile: { fileName: nextFile.name, mimeType: nextFile.type as "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document", dataBase64 } });
  };
  const matches = submit.data?.matches ?? [];
  const currentPrompt = prompts[stepIndex];
  const selectJob = (match: typeof matches[number]) => { setSelectedJobId(match.job.id); setMessages(current => [...current, { role: "user", content: l(`أرغب في وظيفة: ${match.job.title}`, `I am interested in: ${match.job.title}`) }, { role: "assistant", content: `**${match.job.title}**\n\n${match.job.description}\n\n${l("الموقع", "Location")}: ${match.job.location}\n${l("نطاق الراتب", "Salary range")}: ${match.job.salaryMin.toLocaleString()} — ${match.job.salaryMax.toLocaleString()}\n\n[${l("فتح رابط التقديم", "Open application link")}](${match.job.applicationUrl})` }]); };
  const benefits = isArabic ? ["بيانات محفوظة وآمنة", "تحليل منظم للسيرة الذاتية", "اقتراح وظائف حسب الملاءمة"] : ["Securely stored details", "Structured CV analysis", "Jobs proposed by fit"];
  return <div className="min-h-screen bg-[#f4f8f6]" dir={direction}><header className="border-b border-[#dce6e3] bg-white/90 px-4 py-4 backdrop-blur sm:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><PlatformMark /><div className="flex items-center gap-2"><LanguageSwitch /><Button variant="outline" className="border-[#cad8d4] bg-white" onClick={() => navigate("/")}><ArrowRight className="ml-2 size-4" />{l("لوحة الإدارة", "Admin dashboard")}</Button></div></div></header>
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-12"><section className="order-2 rounded-3xl bg-[#0d4b45] p-7 text-white shadow-[0_24px_55px_rgba(13,75,69,0.17)] lg:order-1 lg:p-9"><p className="text-xs font-extrabold tracking-[0.14em] text-[#e1c47c]">CANDIDATE EXPERIENCE</p><h1 className="mt-4 text-3xl font-extrabold leading-tight">{l("المسار الأسرع نحو فرصتك المهنية التالية.", "The quickest path to your next career opportunity.")}</h1><p className="mt-5 text-sm leading-7 text-[#d3e3df]">{l("أجب عن الأسئلة المختصرة، وأرفق سيرتك الذاتية. سيقترح عليك النظام الوظائف الأقرب إلى تفضيلاتك وخبرتك.", "Answer a few concise questions and attach your CV. The system will suggest roles closest to your preferences and experience.")}</p><div className="mt-9 space-y-4">{benefits.map((item, index) => <div className="flex items-center gap-3" key={item}><div className="grid size-7 place-items-center rounded-full bg-white/10 text-[#e1c47c]"><CheckCircle2 className="size-4" /></div><span className="text-sm font-bold text-[#edf6f3]">{item}</span>{index < 2 && <div className="h-px flex-1 bg-white/10" />}</div>)}</div><div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4"><p className="flex items-center gap-2 text-xs font-bold text-[#e1c47c]"><ShieldCheck className="size-4" />{l("خصوصية المرشح", "Candidate privacy")}</p><p className="mt-2 text-xs leading-5 text-[#c2d9d3]">{l("تُستخدم البيانات والسيرة الذاتية لأغراض المطابقة والتواصل الوظيفي داخل المنصة.", "Your details and CV are used within the platform for matching and recruitment communication.")}</p></div></section>
      <section className="order-1 overflow-hidden rounded-3xl border border-[#dce6e3] bg-white shadow-[0_24px_55px_rgba(20,69,63,0.10)] lg:order-2"><div className="flex items-center justify-between border-b border-[#e5eeeb] bg-white px-5 py-4"><div className="flex items-center gap-3"><div className="relative"><div className="grid size-10 place-items-center rounded-full bg-[#e7f4ee] font-extrabold text-[#0d665e]">{isArabic ? "و" : "H"}</div><span className="absolute bottom-0 left-0 size-3 rounded-full border-2 border-white bg-emerald-500" /></div><div><p className="text-sm font-extrabold text-[#173f3c]">{l("مساعد التوظيف", "Recruitment assistant")}</p><p className="mt-0.5 text-[11px] font-bold text-emerald-600">{l("متصل الآن", "Online now")}</p></div></div><div className="rounded-full bg-[#eff7f4] px-3 py-1 text-[11px] font-extrabold text-[#287166]">{l("محاكاة واتساب", "WhatsApp simulation")}</div></div><AIChatBox messages={messages} onSendMessage={answer} isLoading={submit.isPending} placeholder={currentPrompt?.placeholder ?? l("تم إكمال البيانات", "Details completed")} height="490px" className="rounded-none border-0 shadow-none" />
        {stepIndex >= prompts.length && !submit.data && <div className="border-t border-[#e5eeeb] bg-[#fbfdfc] p-5"><label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#b9d2ca] bg-[#f6fbf8] px-5 py-6 text-center transition-colors hover:bg-[#eef8f4]"><input type="file" className="sr-only" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFile} disabled={submit.isPending} /><div className="grid size-11 place-items-center rounded-2xl bg-white text-[#0d665e] shadow-sm">{submit.isPending ? <Loader2 className="size-5 animate-spin" /> : <FileUp className="size-5" />}</div><p className="mt-3 text-sm font-extrabold text-[#173f3c]">{file ? file.name : l("إرفاق السيرة الذاتية", "Attach your CV")}</p><p className="mt-1 text-xs text-[#708482]">PDF or DOCX · {l("حتى", "up to")} 10 MB</p></label></div>}
        {matches.length > 0 && selectedJobId === null && <div className="border-t border-[#e5eeeb] bg-[#fbfdfc] p-5"><p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#173f3c]"><Sparkles className="size-4 text-[#b08c3e]" />{l("وظائف مقترحة لك", "Jobs suggested for you")}</p><div className="grid gap-2">{matches.map(match => <button key={match.job.id} className="flex items-center justify-between rounded-xl border border-[#dce8e4] bg-white p-3 text-start transition-all hover:-translate-y-0.5 hover:border-[#8ebeb2] hover:shadow-sm" onClick={() => selectJob(match)}><div><p className="text-sm font-extrabold text-[#173f3c]">{match.job.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#708482]"><MapPin className="size-3" />{match.job.location}</p></div><span className="rounded-lg bg-[#0d4b45] px-2.5 py-1.5 text-xs font-extrabold text-white">{match.score}%</span></button>)}</div></div>}
        {selectedJobId !== null && <div className="flex items-center gap-2 border-t border-[#e5eeeb] bg-[#f2faf6] px-5 py-4 text-sm font-bold text-[#287166]"><Paperclip className="size-4" />{l("أُرسلت تفاصيل الوظيفة ورابط التقديم داخل المحادثة.", "The job details and application link were sent in the conversation.")}</div>}</section></main></div>;
}

function readBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Unable to read file.")); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.readAsDataURL(file); }); }
