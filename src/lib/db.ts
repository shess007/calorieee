import Dexie, { type EntityTable } from "dexie";
import type { MealEntry, UserSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";

const db = new Dexie("FuelDB") as Dexie & {
  meals: EntityTable<MealEntry, "id">;
  settings: EntityTable<UserSettings & { id: number }, "id">;
};

db.version(1).stores({
  meals: "id, date, timestamp",
  settings: "id",
});

export async function getMealsByDate(date: string): Promise<MealEntry[]> {
  return db.meals.where("date").equals(date).reverse().sortBy("timestamp");
}

export async function addMeal(meal: MealEntry): Promise<void> {
  await db.meals.add(meal);
}

export async function deleteMeal(id: string): Promise<void> {
  await db.meals.delete(id);
}

export async function getSettings(): Promise<UserSettings> {
  const row = await db.settings.get(1);
  if (!row) return DEFAULT_SETTINGS;
  const { ...settings } = row;
  return settings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put({ ...settings, id: 1 });
}

export async function getDatesWithMeals(dateKeys: string[]): Promise<Set<string>> {
  const meals = await db.meals.where("date").anyOf(dateKeys).toArray();
  return new Set(meals.map((m) => m.date));
}

export async function getCaloriesForDates(dateKeys: string[]): Promise<Map<string, number>> {
  const meals = await db.meals.where("date").anyOf(dateKeys).toArray();
  const map = new Map<string, number>();
  for (const m of meals) {
    map.set(m.date, (map.get(m.date) || 0) + m.total.kcal);
  }
  return map;
}

export { db };
