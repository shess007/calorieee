"use client";

interface QuickChipsProps {
  chips: string[];
  onSelect: (text: string) => void;
}

export function QuickChips({ chips, onSelect }: QuickChipsProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/50 transition-all hover:border-[#7cff6b]/30 hover:bg-[#7cff6b]/10 hover:text-[#7cff6b]"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
