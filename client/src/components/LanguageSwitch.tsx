import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { isArabic, toggleLanguage, t } = useLanguage();
  return <Button type="button" variant="outline" size={compact ? "icon" : "sm"} className="border-[#cad8d4] bg-white text-[#173f3c] hover:bg-[#eff7f4]" onClick={toggleLanguage} aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
    <Languages className={compact ? "size-4" : "ml-1.5 size-4"} />
    {!compact && <span className="font-bold">{t("language")}</span>}
  </Button>;
}
