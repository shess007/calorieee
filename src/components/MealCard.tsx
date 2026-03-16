"use client";

import { useState, useRef } from "react";
import type { MealEntry, MealItem } from "@/lib/types";

interface MealCardProps {
  meal: MealEntry;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (meal: MealEntry) => Promise<void>;
}

function scaleItem(item: MealItem, newGrams: number): MealItem {
  if (item.grams === 0) return { ...item, grams: newGrams };
  const ratio = newGrams / item.grams;
  return {
    name: item.name,
    grams: Math.round(newGrams),
    kcal: Math.round(item.kcal * ratio),
    protein: Math.round(item.protein * ratio),
    carbs: Math.round(item.carbs * ratio),
    fat: Math.round(item.fat * ratio),
  };
}

function computeTotal(items: MealItem[]) {
  return items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function MealCard({ meal, index, onDelete, onUpdate }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<MealItem[]>([]);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const time = new Date(meal.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditItems(meal.items.map((item) => ({ ...item })));
    setEditing(true);
    if (!expanded) setExpanded(true);
  }

  function cancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(false);
    setEditItems([]);
  }

  async function saveEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setSaving(true);
    const updatedMeal: MealEntry = {
      ...meal,
      items: editItems,
      total: computeTotal(editItems),
    };
    try {
      await onUpdate(updatedMeal);
      setEditing(false);
      setEditItems([]);
    } finally {
      setSaving(false);
    }
  }

  function updateItemGrams(idx: number, newGrams: number) {
    setEditItems((prev) =>
      prev.map((item, i) =>
        i === idx ? scaleItem(meal.items[idx], newGrams) : item
      )
    );
  }

  function applyMultiplier(idx: number, multiplier: number) {
    const current = editItems[idx];
    const newGrams = Math.round(current.grams * multiplier);
    updateItemGrams(idx, Math.max(1, newGrams));
    // Update the input field value
    const input = inputRefs.current.get(idx);
    if (input) input.value = String(Math.max(1, newGrams));
  }

  function removeItem(idx: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const displayItems = editing ? editItems : meal.items;
  const displayTotal = editing ? computeTotal(editItems) : meal.total;

  return (
    <div
      onClick={() => !editing && setExpanded(!expanded)}
      className={`rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-[18px] py-3.5 transition-colors ${
        editing ? "" : "cursor-pointer hover:bg-white/[0.06]"
      }`}
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
            {time} · {displayItems.length} item
            {displayItems.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tracking-[-1px] text-[#7cff6b]">
            {displayTotal.kcal}
          </div>
          <div className="text-[9px] uppercase tracking-[1px] text-white/30">
            kcal
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          {displayItems.map((item, i) => (
            <div key={i} className="py-1.5">
              {editing ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-white/60">
                      {item.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(i);
                      }}
                      className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] text-[#ff6b6b]/60 transition-colors hover:bg-red-400/10 hover:text-[#ff6b6b]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyMultiplier(i, 0.5);
                      }}
                      className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                    >
                      ½
                    </button>
                    <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1">
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(i, el);
                        }}
                        type="number"
                        defaultValue={item.grams}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0)
                            updateItemGrams(i, val);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-14 bg-transparent text-center text-[13px] text-white/80 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-[11px] text-white/30">g</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyMultiplier(i, 2);
                      }}
                      className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                    >
                      ×2
                    </button>
                    <div className="ml-auto flex gap-3 text-xs text-white/30">
                      <span>{item.kcal}</span>
                      <span className="text-[#7cff6b]/50">{item.protein}p</span>
                      <span className="text-[#ffd76b]/50">{item.carbs}c</span>
                      <span className="text-[#ff9f6b]/50">{item.fat}f</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/60">
                    {item.name}
                    <span className="text-[11px] text-white/20">
                      {" "}· {item.grams}g
                    </span>
                  </span>
                  <div className="flex gap-3 text-xs text-white/40">
                    <span>{item.kcal} kcal</span>
                    <span className="text-[#7cff6b]">{item.protein}p</span>
                    <span className="text-[#ffd76b]">{item.carbs}c</span>
                    <span className="text-[#ff9f6b]">{item.fat}f</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Action buttons */}
          <div className="mt-2.5 flex justify-end gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || editItems.length === 0}
                  className="cursor-pointer rounded-lg border border-[#7cff6b]/20 bg-[#7cff6b]/10 px-3.5 py-1.5 text-xs text-[#7cff6b] transition-colors hover:bg-[#7cff6b]/20 disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meal.id);
                  }}
                  className="cursor-pointer rounded-lg border border-red-400/20 bg-red-400/10 px-3.5 py-1.5 text-xs text-[#ff6b6b] transition-colors hover:bg-red-400/20"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
