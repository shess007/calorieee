"use client";

import { useState, useEffect, useRef } from "react";
import type { UserSettings } from "@/lib/types";

interface GoalEditorProps {
  settings: UserSettings;
  onSave: (updated: Partial<UserSettings>) => void;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Full stepper with −/+ buttons — used for kcal */
function StepperField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-white/[0.06] px-4 py-3">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step, min, max))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/60"
        >
          −
        </button>
        <span className="w-14 text-center text-sm font-semibold text-[#e0e0e0]">
          {value.toLocaleString("de-DE")}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + step, min, max))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/60"
        >
          +
        </button>
        <span className="text-[10px] text-white/25">{unit}</span>
      </div>
    </div>
  );
}

/** Compact tap-to-edit field — used for macros */
function CompactField({
  label,
  value,
  onChange,
  color,
  unit,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  unit: string;
  min: number;
  max: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
    } else {
      setDraft(String(value));
    }
    setEditing(false);
  };

  return (
    <div className="min-w-0 flex-1">
      <div
        className="flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3"
        style={{ borderColor: `${color}20` }}
      >
        <span className="text-[10px] uppercase tracking-[1px] text-white/40">
          {label}
        </span>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-full bg-transparent text-center text-lg font-semibold outline-none"
            style={{ color }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setTimeout(() => inputRef.current?.select(), 0);
            }}
            className="w-full cursor-pointer bg-transparent text-center text-lg font-semibold"
            style={{ color }}
          >
            {value}
          </button>
        )}
        <span className="text-[10px] text-white/25">{unit}</span>
      </div>
    </div>
  );
}

export function GoalEditor({ settings, onSave, onClose }: GoalEditorProps) {
  const [kcal, setKcal] = useState(settings.dailyCalorieGoal);
  const [protein, setProtein] = useState(settings.proteinGoal);
  const [carbs, setCarbs] = useState(settings.carbsGoal);
  const [fat, setFat] = useState(settings.fatGoal);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-save on close (click outside)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onSave({
          dailyCalorieGoal: kcal,
          proteinGoal: protein,
          carbsGoal: carbs,
          fatGoal: fat,
        });
        onClose();
      }
    }

    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [kcal, protein, carbs, fat, onSave, onClose]);

  return (
    <div
      ref={panelRef}
      className="mb-6 rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-[18px] py-4 animate-[fadeIn_0.2s_ease]"
    >
      <div className="mb-3 text-[10px] uppercase tracking-[1.5px] text-white/25">
        Tagesziel
      </div>

      {/* Calorie goal — stepper */}
      <StepperField
        label="Kalorien"
        value={kcal}
        onChange={setKcal}
        unit="kcal"
        min={800}
        max={5000}
        step={50}
      />

      {/* Macro goals — compact tap-to-edit */}
      <div className="mt-3 flex gap-2">
        <CompactField
          label="Protein"
          value={protein}
          onChange={setProtein}
          color="#7cff6b"
          unit="g"
          min={0}
          max={500}
        />
        <CompactField
          label="Carbs"
          value={carbs}
          onChange={setCarbs}
          color="#ffd76b"
          unit="g"
          min={0}
          max={500}
        />
        <CompactField
          label="Fat"
          value={fat}
          onChange={setFat}
          color="#ff9f6b"
          unit="g"
          min={0}
          max={500}
        />
      </div>
    </div>
  );
}
