"use client";

import { useState, useEffect } from "react";
import { useFuelStore } from "@/lib/store";
import { parseDateKey, formatDateHeader, isToday } from "@/lib/date-utils";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { MealInput } from "@/components/MealInput";
import { DayNavigator } from "@/components/DayNavigator";
import { GoalEditor } from "@/components/GoalEditor";

export default function Home() {
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);

  const {
    meals,
    totals,
    loading,
    error,
    settings,
    selectedDate,
    initialized,
    init,
    updateMeal,
    deleteMeal,
    setError,
    updateSettings,
  } = useFuelStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-white/30">Loading...</div>
      </div>
    );
  }

  const selectedDateObj = parseDateKey(selectedDate);
  const isTodaySelected = isToday(selectedDateObj);
  const entryCount = meals.length;
  const entryWord = entryCount === 1 ? "Eintrag" : "Einträge";

  const mealSectionLabel = isTodaySelected
    ? `Heute · ${entryCount} ${entryWord}`
    : `${formatDateHeader(selectedDateObj, settings.language)} · ${entryCount} ${entryWord}`;

  return (
    <div className="min-h-screen w-full overflow-x-hidden animate-[fadeIn_0.6s_ease]">
      <div className="mx-auto box-border w-full max-w-[440px] px-5 pb-24 pt-10">
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="mb-1.5 text-[11px] uppercase tracking-[3px] text-white/25">
            {formatDateHeader(selectedDateObj, settings.language)}
          </div>
          <h1 className="bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] bg-clip-text text-[28px] font-bold tracking-[-1px] text-transparent">
            Fuel
          </h1>
        </div>

        {/* Day Navigator */}
        <DayNavigator />

        {/* Ring */}
        <div className="mb-8 flex justify-center">
          <CalorieRing
            consumed={totals.kcal}
            goal={settings.dailyCalorieGoal}
            onTap={() => setGoalEditorOpen(!goalEditorOpen)}
          />
        </div>

        {/* Goal Editor */}
        {goalEditorOpen && (
          <GoalEditor
            settings={settings}
            onSave={(updated) => {
              updateSettings(updated);
              setGoalEditorOpen(false);
            }}
            onClose={() => setGoalEditorOpen(false)}
          />
        )}

        {/* Macros */}
        <div className="mb-9 flex gap-4 px-1">
          <MacroBar
            label="Protein"
            current={totals.protein}
            goal={settings.proteinGoal}
            color="#7cff6b"
          />
          <MacroBar
            label="Carbs"
            current={totals.carbs}
            goal={settings.carbsGoal}
            color="#ffd76b"
          />
          <MacroBar
            label="Fat"
            current={totals.fat}
            goal={settings.fatGoal}
            color="#ff9f6b"
          />
        </div>

        {/* Input */}
        <MealInput />

        {/* Error */}
        {error && (
          <div
            className="mb-3 cursor-pointer rounded-[10px] border border-red-400/15 bg-red-400/[0.08] px-3.5 py-2.5 text-[13px] text-[#ff6b6b]"
            onClick={() => setError(null)}
          >
            {error}
          </div>
        )}

        {/* Meal List */}
        {meals.length > 0 && (
          <div>
            <div className="mt-2 mb-2.5 px-1 text-[11px] uppercase tracking-[2px] text-white/20">
              {mealSectionLabel}
            </div>
            <div className="flex flex-col gap-2">
              {meals.map((meal, i) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={i}
                  onDelete={deleteMeal}
                  onUpdate={updateMeal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {meals.length === 0 && !loading && (
          <div className="py-12 text-center text-sm text-white/15">
            <div className="mb-3 text-4xl">🍽</div>
            {isTodaySelected
              ? "Noch keine Einträge heute."
              : "Keine Einträge für diesen Tag."}
            <br />
            <span className="text-xs">
              Beschreib einfach was du gegessen hast.
            </span>
          </div>
        )}
      </div>

      {/* Bottom fade overlay */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}
