import { useTranslation } from "react-i18next";
import { SubNiche } from "@/types/audit";
import { getSubNichesForNiche, SubNicheInfo } from "@/config/subNicheConfig";

interface SubNicheSelectorProps {
  niche: "home_services" | "real_estate";
  selected: SubNiche | null;
  onSelect: (subNiche: SubNiche) => void;
  title: string;
}

export function SubNicheSelector({ niche, selected, onSelect, title }: SubNicheSelectorProps) {
  const { t } = useTranslation('common');
  const subNiches = getSubNichesForNiche(niche);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {subNiches.map((sn: SubNicheInfo) => {
          const isSelected = selected === sn.id;
          return (
            <button
              key={sn.id}
              type="button"
              onClick={() => onSelect(sn.id)}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all text-sm font-medium ${
                isSelected
                  ? "border-[hsl(var(--coral))] bg-[hsl(var(--coral)_/_0.05)] shadow-sm"
                  : "border-border bg-background hover:border-[hsl(var(--coral)_/_0.5)] hover:bg-secondary/50"
              }`}
            >
              <span className="text-2xl">{sn.emoji}</span>
              <span className={isSelected ? "text-foreground font-semibold" : "text-foreground"}>
                {t(sn.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
