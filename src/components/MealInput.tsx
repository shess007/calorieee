"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useFuelStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { QuickChips } from "./QuickChips";
import { BarcodeScanner } from "./BarcodeScanner";
import { BarcodeMealReview } from "./BarcodeMealReview";
import type { MealEntry, BarcodeProduct } from "@/lib/types";

type InputMode = "idle" | "write" | "listen" | "scan" | "review";

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
  const [scannedProduct, setScannedProduct] = useState<BarcodeProduct | null>(
    null
  );
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

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      setMode("idle");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/lookup-barcode?code=${encodeURIComponent(barcode)}`
        );

        if (!res.ok) {
          throw new Error("Barcode-Abfrage fehlgeschlagen");
        }

        const data = await res.json();

        if (data.found && data.product) {
          setScannedProduct(data.product);
          setMode("review");
        } else {
          setError("Produkt nicht gefunden. Beschreib es stattdessen.");
          setMode("write");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        setMode("idle");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const handleBarcodeConfirm = useCallback(
    async (grams: number) => {
      if (!scannedProduct) return;

      const p = scannedProduct;
      const item = {
        name: [p.brand, p.name].filter(Boolean).join(" "),
        grams,
        kcal: Math.round((p.per_100g.kcal * grams) / 100),
        protein: Math.round((p.per_100g.protein * grams) / 100),
        carbs: Math.round((p.per_100g.carbs * grams) / 100),
        fat: Math.round((p.per_100g.fat * grams) / 100),
      };

      const meal: MealEntry = {
        id:
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 6),
        date: selectedDate,
        timestamp: new Date().toISOString(),
        query: `[Scan] ${item.name} ${grams}g`,
        meal_name: item.name,
        items: [item],
        total: {
          kcal: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        },
      };

      await addMeal(meal);
      setScannedProduct(null);
      setMode("idle");
    },
    [scannedProduct, selectedDate, addMeal]
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

  // Review overlay (rendered on top of everything)
  if (mode === "review" && scannedProduct) {
    return (
      <BarcodeMealReview
        product={scannedProduct}
        onConfirm={handleBarcodeConfirm}
        onCancel={() => {
          setScannedProduct(null);
          setMode("idle");
        }}
      />
    );
  }

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

  // Scan mode
  if (mode === "scan") {
    return (
      <BarcodeScanner
        onScan={handleBarcodeScan}
        onCancel={() => setMode("idle")}
      />
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

  // Idle state — three buttons: Schreiben, Scannen, Sprechen
  return (
    <div className="mb-6 flex gap-3">
      <button
        type="button"
        onClick={() => setMode("write")}
        className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl border border-[#7cff6b]/15 bg-[#7cff6b]/[0.07] py-4 text-[#7cff6b]/70 transition-all hover:border-[#7cff6b]/25 hover:bg-[#7cff6b]/[0.12] hover:text-[#7cff6b]"
        aria-label="Text input"
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
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
      {micSupported && (
        <button
          type="button"
          onClick={handleMicTap}
          className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl border border-[#b06bff]/15 bg-[#b06bff]/[0.07] py-4 text-[#b06bff]/70 transition-all hover:border-[#b06bff]/25 hover:bg-[#b06bff]/[0.12] hover:text-[#b06bff]"
          aria-label="Voice input"
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
      )}
      <button
        type="button"
        onClick={() => setMode("scan")}
        className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl border border-[#6bb8ff]/15 bg-[#6bb8ff]/[0.07] py-4 text-[#6bb8ff]/70 transition-all hover:border-[#6bb8ff]/25 hover:bg-[#6bb8ff]/[0.12] hover:text-[#6bb8ff]"
        aria-label="Barcode scanner"
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
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="8" x2="9" y2="8" />
          <line x1="7" y1="16" x2="9" y2="16" />
          <line x1="11" y1="8" x2="11" y2="16" />
          <line x1="14" y1="8" x2="14" y2="16" />
          <line x1="17" y1="8" x2="17" y2="16" />
        </svg>
      </button>
    </div>
  );
}
