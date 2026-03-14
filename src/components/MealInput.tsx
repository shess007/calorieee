"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useFuelStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { QuickChips } from "./QuickChips";
import type { MealEntry } from "@/lib/types";

type InputMode = "idle" | "write" | "listen";

const SPEECH_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  de: {
    "not-allowed":
      "Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.",
    "no-speech": "Keine Sprache erkannt. Bitte nochmal versuchen.",
    network: "Netzwerkfehler bei der Spracherkennung.",
  },
  en: {
    "not-allowed":
      "Microphone access denied. Please allow in browser settings.",
    "no-speech": "No speech detected. Please try again.",
    network: "Network error during speech recognition.",
  },
};

export function MealInput() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<InputMode>("idle");
  const [interim, setInterim] = useState("");
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
      setInterim("");
      setMode("idle");

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
          id:
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 6),
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
      }
    },
    [input, loading, setLoading, setError, addMeal, selectedDate]
  );

  const {
    isSupported: micSupported,
    isListening,
    error: speechError,
    toggle: toggleMic,
  } = useSpeechRecognition({
    language: settings.language,
    onResult: (transcript) => {
      setInterim("");
      handleSubmit(transcript);
    },
    onInterim: (transcript) => {
      setInterim(transcript);
    },
  });

  // When speech recognition stops without a result, return to idle
  useEffect(() => {
    if (!isListening && mode === "listen") {
      // Small delay so the user sees the final state before resetting
      const t = setTimeout(() => {
        if (!loading) {
          setInterim("");
          setMode("idle");
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isListening, mode, loading]);

  // Surface speech recognition errors
  useEffect(() => {
    if (speechError) {
      const msgs =
        SPEECH_ERROR_MESSAGES[settings.language] || SPEECH_ERROR_MESSAGES.de;
      setError(msgs[speechError] || speechError);
    }
  }, [speechError, settings.language, setError]);

  // Auto-focus input when entering write mode
  useEffect(() => {
    if (mode === "write") {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleMicTap = () => {
    if (mode !== "listen") {
      setMode("listen");
    }
    toggleMic();
  };

  // Loading state
  if (loading) {
    return (
      <div className="mb-3 flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-5">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <svg
            className="h-5 w-5 animate-spin text-[#7cff6b]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-20"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          Analysiere...
        </div>
      </div>
    );
  }

  // Listening state
  if (mode === "listen") {
    return (
      <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleMicTap}
            className="animate-[pulse-recording_1.5s_ease-in-out_infinite] rounded-full border border-red-500/40 bg-red-500/20 p-4 text-red-400 transition-all"
            aria-label="Stop recording"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <span className="text-sm text-white/40">
            {interim || "Sprich jetzt..."}
          </span>
        </div>
      </div>
    );
  }

  // Write mode
  if (mode === "write") {
    return (
      <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Was hast du gegessen?"
            className="min-w-0 flex-1 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#e8e8e8] outline-none placeholder:text-white/20 focus:border-white/15"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className={`rounded-[10px] border-none p-3 transition-all ${
              input.trim()
                ? "cursor-pointer bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] text-[#0a0a0a]"
                : "opacity-30 bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] text-[#0a0a0a]"
            }`}
            aria-label="Send"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
        <QuickChips
          chips={settings.quickChips}
          onSelect={(text) => {
            setInput(text);
            handleSubmit(text);
          }}
        />
        <button
          onClick={() => {
            setMode("idle");
            setInput("");
          }}
          className="mt-2 w-full cursor-pointer text-center text-xs text-white/20 transition-colors hover:text-white/40"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  // Idle state — two buttons
  return (
    <div className="mb-3 flex gap-3">
      {micSupported && (
        <button
          type="button"
          onClick={handleMicTap}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 text-white/40 transition-all hover:border-[#7cff6b]/20 hover:bg-[#7cff6b]/[0.05] hover:text-[#7cff6b]"
          aria-label="Voice input"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <span className="text-sm font-medium">Sprechen</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => setMode("write")}
        className="flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 text-white/40 transition-all hover:border-[#7cff6b]/20 hover:bg-[#7cff6b]/[0.05] hover:text-[#7cff6b]"
        aria-label="Text input"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        <span className="text-sm font-medium">Schreiben</span>
      </button>
    </div>
  );
}
