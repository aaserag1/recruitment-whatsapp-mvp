import { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#dce6e3] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-extrabold tracking-[0.14em] text-[#b08c3e]">{eyebrow}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#123b38] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647775]">{description}</p>
      </div>
      {action}
    </div>
  );
}
