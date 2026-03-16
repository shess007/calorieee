"use client";

import { useState } from "react";
import type { BarcodeProduct } from "@/lib/types";
import { PortionInput } from "./PortionInput";

interface BarcodeMealReviewProps {
  product: BarcodeProduct;
  onConfirm: (grams: number) => void;
  onCancel: () => void;
}

export function BarcodeMealReview({
  product,
  onConfirm,
  onCancel,
}: BarcodeMealReviewProps) {
  const defaultGrams = product.serving_size_g || 100;
  const [grams, setGrams] = useState(defaultGrams);

  const scaled = {
    kcal: Math.round((product.per_100g.kcal * grams) / 100),
    protein: Math.round((product.per_100g.protein * grams) / 100),
    carbs: Math.round((product.per_100g.carbs * grams) / 100),
    fat: Math.round((product.per_100g.fat * grams) / 100),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
      onClick={onCancel}
    >
      <div
        className="mx-auto w-full max-w-[440px] rounded-t-[20px] border border-white/[0.06] bg-[#0a0a0a] px-5 pb-8 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product info */}
        <div className="mb-5 flex items-start gap-3.5">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-16 w-16 rounded-xl border border-white/[0.06] bg-white/[0.03] object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-2xl">
              📦
            </div>
          )}
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-[#e0e0e0]">
              {product.name}
            </div>
            {product.brand && (
              <div className="mt-0.5 text-[12px] text-white/30">
                {product.brand}
              </div>
            )}
            <div className="mt-1 text-[11px] text-white/20">
              pro 100g: {product.per_100g.kcal} kcal · {product.per_100g.protein}p · {product.per_100g.carbs}c · {product.per_100g.fat}f
            </div>
          </div>
        </div>

        {/* Portion input */}
        <div className="mb-5">
          <div className="mb-2 text-[11px] uppercase tracking-[2px] text-white/20">
            Menge
          </div>
          <PortionInput
            value={grams}
            onChange={setGrams}
            servingSizeG={product.serving_size_g}
          />
        </div>

        {/* Computed macros */}
        <div className="mb-5 rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/50">Gesamt</span>
            <span className="text-xl font-bold tracking-[-1px] text-[#7cff6b]">
              {scaled.kcal} kcal
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-[#7cff6b]">{scaled.protein}g Protein</span>
            <span className="text-[#ffd76b]">{scaled.carbs}g Carbs</span>
            <span className="text-[#ff9f6b]">{scaled.fat}g Fett</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white/50 transition-colors hover:bg-white/[0.08]"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onConfirm(grams)}
            className="flex-1 cursor-pointer rounded-xl border-none bg-gradient-to-br from-[#7cff6b] to-[#00d4aa] py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
