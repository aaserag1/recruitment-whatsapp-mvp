import { BriefcaseBusiness, MessageCircleMore } from "lucide-react";

export function PlatformMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-[#0d4b45] text-white shadow-[0_10px_24px_rgba(13,75,69,0.22)]">
        <BriefcaseBusiness className="size-[19px]" strokeWidth={2.2} />
        <MessageCircleMore className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[#c8a75b] p-0.5 text-[#0d4b45]" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-extrabold tracking-tight text-[#123b38]">وصلة توظيف</p>
          <p className="truncate text-[10px] font-semibold tracking-[0.13em] text-[#708482]">RECRUITMENT HUB</p>
        </div>
      )}
    </div>
  );
}
