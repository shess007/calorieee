export interface MealItem {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntry {
  id: string;
  date: string; // ISO date (2026-03-14)
  timestamp: string; // ISO datetime
  query: string; // original user input
  meal_name: string; // AI-generated name
  items: MealItem[];
  total: MacroTotals;
}

export interface UserSettings {
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  language: "de" | "en";
  quickChips: string[];
}
