"use client";

import { useEffect } from "react";
import { useFuelStore } from "@/lib/store";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";
import { MealInput } from "@/components/MealInput";

export default function Home() {
  const {
    meals,
    totals,
    loading,
    error,
    settings,
    initialized,
    init,
    deleteMeal,
    setError,
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden animate-[fadeIn_0.6s_ease]">
      <div className="mx-auto box-border w-full max-w-[440px] px-5 pb-24 pt-10">
        {/* Header */}
        <div className="mb-9 text-center">
          <div className="mb-1.5 text-[11px] uppercase tracking-[3px] text-white/25">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <h1 className="bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] bg-clip-text text-[28px] font-bold tracking-[-1px] text-transparent">
            Fuel
          </h1>
        </div>

        {/* Ring */}
        <div className="mb-8 flex justify-center">
          <CalorieRing
            consumed={totals.kcal}
            goal={settings.dailyCalorieGoal}
          />
        </div>

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
              Heute · {meals.length} Eintr
              {meals.length === 1 ? "ag" : "äge"}
            </div>
            <div className="flex flex-col gap-2">
              {meals.map((meal, i) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={i}
                  onDelete={deleteMeal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {meals.length === 0 && !loading && (
          <div className="py-12 text-center text-sm text-white/15">
            <div className="mb-3 text-4xl">🍽</div>
            Noch keine Einträge heute.
            <br />
            <span className="text-xs">
              Beschreib einfach was du gegessen hast.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
