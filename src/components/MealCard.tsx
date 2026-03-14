"use client";

import { useState } from "react";
import type { MealEntry } from "@/lib/types";

interface MealCardProps {
  meal: MealEntry;
  index: number;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, index, onDelete }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-[18px] py-3.5 transition-colors hover:bg-white/[0.06]"
      style={{
        animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 0.05}s both`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-[#e0e0e0]">
            {meal.meal_name}
          </div>
          <div className="mt-0.5 text-[11px] text-white/30">
            {time} · {meal.items.length} item
            {meal.items.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tracking-[-1px] text-[#7cff6b]">
            {meal.total.kcal}
          </div>
          <div className="text-[9px] uppercase tracking-[1px] text-white/30">
            kcal
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          {meal.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between py-1.5 text-[13px]"
            >
              <span className="text-white/60">
                {item.name}
                <span className="text-[11px] text-white/20">
                  {" "}
                  · {item.grams}g
                </span>
              </span>
              <div className="flex gap-3 text-xs text-white/40">
                <span>{item.kcal} kcal</span>
                <span className="text-[#7cff6b]">{item.protein}p</span>
                <span className="text-[#ffd76b]">{item.carbs}c</span>
                <span className="text-[#ff9f6b]">{item.fat}f</span>
              </div>
            </div>
          ))}
          <div className="mt-2.5 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(meal.id);
              }}
              className="cursor-pointer rounded-lg border border-red-400/20 bg-red-400/10 px-3.5 py-1.5 text-xs text-[#ff6b6b] transition-colors hover:bg-red-400/20"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
