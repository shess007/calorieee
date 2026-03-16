"use client";

import { useRef } from "react";

interface PortionInputProps {
  value: number;
  onChange: (grams: number) => void;
  servingSizeG: number | null;
}

export function PortionInput({
  value,
  onChange,
  servingSizeG,
}: PortionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function applyMultiplier(multiplier: number) {
    const newVal = Math.max(1, Math.round(value * multiplier));
    onChange(newVal);
    if (inputRef.current) inputRef.current.value = String(newVal);
  }

  function setGrams(grams: number) {
    onChange(grams);
    if (inputRef.current) inputRef.current.value = String(grams);
  }

  // Build preset chips
  const presets: { label: string; grams: number }[] = [];
  if (servingSizeG && servingSizeG !== 100) {
    presets.push({ label: `1 Portion (${servingSizeG}g)`, grams: servingSizeG });
  }
  presets.push({ label: "100g", grams: 100 });
  for (const g of [150, 200, 250]) {
    presets.push({ label: `${g}g`, grams: g });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Gram input with multiplier buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => applyMultiplier(0.5)}
          className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
        >
          ½
        </button>
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5">
          <input
            ref={inputRef}
            type="number"
            defaultValue={value}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val > 0) onChange(val);
            }}
            className="w-16 bg-transparent text-center text-[15px] font-medium text-white/80 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-[12px] text-white/30">g</span>
        </div>
        <button
          onClick={() => applyMultiplier(2)}
          className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
        >
          ×2
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setGrams(p.grams)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] transition-colors ${
              value === p.grams
                ? "border-[#7cff6b]/30 bg-[#7cff6b]/10 text-[#7cff6b]"
                : "border-white/[0.08] bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
