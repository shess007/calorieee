"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({
  label,
  current,
  goal,
  color,
  unit = "g",
}: MacroBarProps) {
  const animated = useAnimatedValue(current);
  const pct = Math.min((animated / goal) * 100, 100);

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[1.5px] text-white/40">
          {label}
        </span>
        <span className="text-sm font-semibold text-[#e0e0e0]">
          {Math.round(animated)}
          <span className="text-[10px] text-white/30">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-0.5 text-right text-[10px] text-white/25">
        / {goal}
        {unit}
      </div>
    </div>
  );
}
