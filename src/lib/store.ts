import { create } from "zustand";
import type { MealEntry, MacroTotals, UserSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import { toDateKey, getWeekDays, shiftByWeeks, isFuture } from "./date-utils";
import {
  getMealsByDate,
  addMeal as dbAddMeal,
  deleteMeal as dbDeleteMeal,
  getSettings,
  saveSettings,
  getCaloriesForDates,
} from "./db";

function todayKey(): string {
  return toDateKey(new Date());
}

interface FuelStore {
  // UI state
  selectedDate: string;
  meals: MealEntry[];
  loading: boolean;
  error: string | null;
  settings: UserSettings;
  initialized: boolean;

  // Day navigation
  weekOffset: number;
  dayCalories: Map<string, number>;

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

  // Week navigation
  shiftWeek: (direction: -1 | 1) => void;
  goToToday: () => void;
  loadWeekIndicators: (weekDays: Date[]) => Promise<void>;
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
  weekOffset: 0,
  dayCalories: new Map<string, number>(),
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
    // Refresh week indicators since a new meal was added
    const anchor = shiftByWeeks(new Date(), get().weekOffset);
    const weekDays = getWeekDays(anchor);
    get().loadWeekIndicators(weekDays);
  },

  deleteMeal: async (id: string) => {
    await dbDeleteMeal(id);
    const meals = get().meals.filter((m) => m.id !== id);
    set({ meals, totals: computeTotals(meals) });
    // Refresh week indicators since a meal was removed
    const anchor = shiftByWeeks(new Date(), get().weekOffset);
    const weekDays = getWeekDays(anchor);
    get().loadWeekIndicators(weekDays);
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  updateSettings: async (partial: Partial<UserSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    await saveSettings(updated);
    set({ settings: updated });
  },

  shiftWeek: (direction: -1 | 1) => {
    const newOffset = get().weekOffset + direction;
    // Can't go into the future
    if (newOffset > 0) return;

    set({ weekOffset: newOffset });

    // Select the same weekday position in the new week, clamped to today
    const currentSelected = get().selectedDate;
    const currentDow = new Date(
      currentSelected + "T12:00:00"
    ).getDay();

    const newAnchor = shiftByWeeks(new Date(), newOffset);
    const newWeekDays = getWeekDays(newAnchor);

    // Find the matching weekday in the new week
    const target = newWeekDays.find((d) => d.getDay() === currentDow);
    const candidate = target || newWeekDays[0];

    // Clamp: if candidate is in the future, select today instead
    const dateToSelect = isFuture(candidate) ? todayKey() : toDateKey(candidate);

    get().setSelectedDate(dateToSelect);
    get().loadWeekIndicators(newWeekDays);
  },

  goToToday: () => {
    set({ weekOffset: 0 });
    get().setSelectedDate(todayKey());
    const weekDays = getWeekDays(new Date());
    get().loadWeekIndicators(weekDays);
  },

  loadWeekIndicators: async (weekDays: Date[]) => {
    const dateKeys = weekDays.map(toDateKey);
    const dayCalories = await getCaloriesForDates(dateKeys);
    set({ dayCalories });
  },
}));
