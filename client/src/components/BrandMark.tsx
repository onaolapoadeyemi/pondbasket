import { FishSymbol, Waves } from "lucide-react";
import { BRAND } from "@shared/brand";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[13px] bg-[#0b4f4a] shadow-[0_8px_20px_rgba(11,79,74,.22)]">
        <Waves className="absolute -bottom-1 left-0 h-6 w-9 text-[#d6e46b]/45" />
        <FishSymbol className="relative h-5 w-5 text-[#f6f4ec]" />
      </div>
      {!compact && <span className="font-display text-[1.25rem] font-bold tracking-[-0.05em] text-[#092b2a]">{BRAND.name}</span>}
    </div>
  );
}

