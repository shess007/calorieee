"use client";

import { useEffect } from "react";
import { useFuelStore } from "@/lib/store";
import {
  toDateKey,
  getWeekDays,
  shiftByWeeks,
  shortWeekday,
  isToday,
  isFuture,
} from "@/lib/date-utils";

export function DayNavigator() {
  const {
    selectedDate,
    weekOffset,
    dayCalories,
    settings,
    setSelectedDate,
    shiftWeek,
    goToToday,
    loadWeekIndicators,
  } = useFuelStore();

  const anchor = shiftByWeeks(new Date(), weekOffset);
  const weekDays = getWeekDays(anchor);
  const showToday = selectedDate !== toDateKey(new Date());

  // Load dot indicators on mount and when week changes
  useEffect(() => {
    loadWeekIndicators(weekDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {/* Left chevron */}
        <button
          onClick={() => shiftWeek(-1)}
          className="flex h-9 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
          aria-label="Vorherige Woche"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Day tiles */}
        <div className="flex flex-1 justify-between gap-1">
          {weekDays.map((day) => {
            const key = toDateKey(day);
            const selected = key === selectedDate;
            const today = isToday(day);
            const future = isFuture(day);
            const kcal = dayCalories.get(key);
            const hasData = kcal !== undefined;
            const overBudget = hasData && kcal > settings.dailyCalorieGoal;

            let tileClasses: string;
            if (future) {
              tileClasses = "border-white/[0.03] bg-white/[0.02] text-white/15 pointer-events-none";
            } else if (selected && today) {
              tileClasses = "border-[#7cff6b]/30 bg-[#7cff6b]/15 text-[#7cff6b]";
            } else if (selected) {
              tileClasses = "border-white/12 bg-white/[0.06] text-[#e0e0e0]";
            } else {
              tileClasses = "border-white/[0.06] bg-white/[0.04] text-white/25 hover:bg-white/[0.06] hover:text-white/40 cursor-pointer";
            }

            return (
              <button
                key={key}
                onClick={() => !future && setSelectedDate(key)}
                disabled={future}
                className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-[10px] border transition-all ${tileClasses} ${selected ? "font-bold" : ""}`}
                aria-label={day.toLocaleDateString(settings.language === "de" ? "de-DE" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
                aria-current={selected ? "date" : undefined}
                aria-disabled={future || undefined}
                tabIndex={future ? -1 : 0}
              >
                <span className="text-[9px] uppercase leading-none tracking-wider opacity-60">
                  {shortWeekday(day, settings.language)}
                </span>
                <span className="text-[13px] leading-none mt-0.5">
                  {day.getDate()}
                </span>
                {/* Status bar */}
                {hasData && (
                  <span
                    className={`absolute bottom-[3px] h-[2px] w-4 rounded-full ${
                      overBudget ? "bg-[#ff6b6b]" : "bg-[#7cff6b]"
                    } ${selected ? "opacity-60" : "opacity-100"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right chevron — hidden when at current week */}
        {weekOffset < 0 ? (
          <button
            onClick={() => shiftWeek(1)}
            className="flex h-9 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60"
            aria-label="Nächste Woche"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <div className="w-8 shrink-0" />
        )}
      </div>

      {/* "Heute" pill — centered below the strip */}
      {showToday && (
        <div className="mt-2.5 flex justify-center">
          <button
            onClick={goToToday}
            className="cursor-pointer rounded-full border border-[#7cff6b]/20 bg-[#7cff6b]/10 px-3 py-1 text-[11px] font-medium text-[#7cff6b] transition-all hover:bg-[#7cff6b]/20"
          >
            Zurück zu heute
          </button>
        </div>
      )}
    </div>
  );
}
