import { create } from "zustand";
import type { MealEntry, MacroTotals, UserSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import {
  getMealsByDate,
  addMeal as dbAddMeal,
  deleteMeal as dbDeleteMeal,
  getSettings,
  saveSettings,
} from "./db";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FuelStore {
  // UI state
  selectedDate: string;
  meals: MealEntry[];
  loading: boolean;
  error: string | null;
  settings: UserSettings;
  initialized: boolean;

  // Computed
  totals: MacroTotals;

  // Actions
  init: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  loadMeals: (date?: string) => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

function computeTotals(meals: MealEntry[]): MacroTotals {
  return meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.total.kcal,
      protein: acc.protein + m.total.protein,
      carbs: acc.carbs + m.total.carbs,
      fat: acc.fat + m.total.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const useFuelStore = create<FuelStore>((set, get) => ({
  selectedDate: todayKey(),
  meals: [],
  loading: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  initialized: false,
  totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },

  init: async () => {
    const settings = await getSettings();
    const date = todayKey();
    const meals = await getMealsByDate(date);
    set({
      settings,
      meals,
      selectedDate: date,
      totals: computeTotals(meals),
      initialized: true,
    });
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().loadMeals(date);
  },

  loadMeals: async (date?: string) => {
    const d = date || get().selectedDate;
    const meals = await getMealsByDate(d);
    set({ meals, totals: computeTotals(meals) });
  },

  addMeal: async (meal: MealEntry) => {
    await dbAddMeal(meal);
    const meals = [meal, ...get().meals];
    set({ meals, totals: computeTotals(meals) });
  },

  deleteMeal: async (id: string) => {
    await dbDeleteMeal(id);
    const meals = get().meals.filter((m) => m.id !== id);
    set({ meals, totals: computeTotals(meals) });
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  updateSettings: async (partial: Partial<UserSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    await saveSettings(updated);
    set({ settings: updated });
  },
}));
