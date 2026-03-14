"use client";

import { useState, useRef, useCallback } from "react";
import { useFuelStore } from "@/lib/store";
import { QuickChips } from "./QuickChips";
import type { MealEntry } from "@/lib/types";

export function MealInput() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { loading, settings, setLoading, setError, addMeal, selectedDate } =
    useFuelStore();

  const handleSubmit = useCallback(
    async (text?: string) => {
      const query = text || input;
      if (!query.trim() || loading) return;
      setLoading(true);
      setError(null);
      setInput("");

      try {
        const res = await fetch("/api/parse-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `Request failed with status ${res.status}`
          );
        }

        const parsed = await res.json();

        const meal: MealEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          date: selectedDate,
          timestamp: new Date().toISOString(),
          query,
          meal_name: parsed.meal_name,
          items: parsed.items,
          total: parsed.total,
        };

        await addMeal(meal);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, setLoading, setError, addMeal, selectedDate]
  );

  return (
    <div className="mb-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex gap-2.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Was hast du gegessen?"
          disabled={loading}
          className="min-w-0 flex-1 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#e8e8e8] outline-none placeholder:text-white/20 focus:border-white/15"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !input.trim()}
          className={`whitespace-nowrap rounded-[10px] border-none px-5 text-sm font-bold transition-all ${
            loading
              ? "cursor-wait bg-[#7cff6b]/10 text-[#7cff6b]"
              : "cursor-pointer bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] text-[#0a0a0a]"
          } ${!loading && !input.trim() ? "opacity-30" : "opacity-100"}`}
        >
          {loading ? (
            <span className="animate-pulse">···</span>
          ) : (
            "Log"
          )}
        </button>
      </div>
      <QuickChips
        chips={settings.quickChips}
        onSelect={(text) => {
          setInput(text);
          handleSubmit(text);
        }}
      />
    </div>
  );
}
