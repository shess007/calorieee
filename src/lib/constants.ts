import type { UserSettings } from "./types";

export const DEFAULT_SETTINGS: UserSettings = {
  dailyCalorieGoal: 2200,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 70,
  language: "de",
  quickChips: [
    "Müsli mit Milch",
    "Kaffee mit Milch",
    "Brot mit Käse",
    "Apfel",
    "Reis mit Hähnchen",
    "Salat mit Dressing",
  ],
};

export const SYSTEM_PROMPT = `You are a nutrition assistant. The user describes what they ate. Return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact format:
{
  "meal_name": "Short descriptive name",
  "items": [
    { "name": "Item name", "grams": 150, "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
  ],
  "total": { "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
}
Rules:
- NEVER ask questions. NEVER add text outside the JSON.
- Even if the input is a single word like "Butter" or "Apfel", return the JSON with a reasonable default portion.
- If grams are specified (e.g. "30g Leberwurst"), use that exact amount.
- If no amount is given, estimate a typical serving size.
- Be accurate with calorie counts based on standard nutritional data.
- The meal_name should be in the same language as the user input.`;

export const COLORS = {
  background: "#0a0a0a",
  text: "#e8e8e8",
  green: "#7cff6b",
  greenEnd: "#00d4aa",
  yellow: "#ffd76b",
  orange: "#ff9f6b",
  red: "#ff6b6b",
} as const;
