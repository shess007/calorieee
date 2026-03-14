"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  onTap?: () => void;
}

export function CalorieRing({ consumed, goal, size = 220, onTap }: CalorieRingProps) {
  const animatedConsumed = useAnimatedValue(consumed);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(animatedConsumed / goal, 1.15);
  const offset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const overBudget = consumed > goal;

  return (
    <div
      className={`relative ${onTap ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
      onClick={onTap}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={overBudget ? "#ff6b6b" : "url(#ringGrad)"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke] duration-300"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7cff6b" />
            <stop offset="100%" stopColor="#00d4aa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-[42px] font-bold leading-none tracking-[-2px] ${
            overBudget ? "text-[#ff6b6b]" : "text-[#e8e8e8]"
          }`}
        >
          {Math.round(animatedConsumed)}
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-[2px] text-white/35">
          kcal
        </span>
        <span
          className={`mt-1.5 text-[13px] font-medium ${
            overBudget ? "text-[#ff6b6b]" : "text-white/50"
          }`}
        >
          {overBudget ? `+${consumed - goal} over` : `${remaining} left`}
        </span>
      </div>
    </div>
  );
}
