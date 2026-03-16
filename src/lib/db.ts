import type { MealEntry, UserSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";

// Client-side DB layer — calls server API routes backed by Postgres.
// Exports match the original Dexie interface so the store is unchanged.

export async function getMealsByDate(date: string): Promise<MealEntry[]> {
  const res = await fetch(`/api/meals?date=${encodeURIComponent(date)}`);
  if (res.status === 401) return []; // not logged in yet, middleware will redirect
  if (!res.ok) throw new Error("Failed to load meals");
  return res.json();
}

export async function addMeal(meal: MealEntry): Promise<void> {
  const res = await fetch("/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meal),
  });
  if (!res.ok) throw new Error("Failed to save meal");
}

export async function deleteMeal(id: string): Promise<void> {
  const res = await fetch(`/api/meals/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete meal");
}

export async function getSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) return DEFAULT_SETTINGS; // includes 401 — returns defaults gracefully
  return res.json();
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings");
}

export async function getCaloriesForDates(
  dateKeys: string[]
): Promise<Map<string, number>> {
  if (dateKeys.length === 0) return new Map();
  const res = await fetch(
    `/api/meals?calories=${encodeURIComponent(dateKeys.join(","))}`
  );
  if (!res.ok) return new Map();
  const obj: Record<string, number> = await res.json();
  return new Map(Object.entries(obj));
}
