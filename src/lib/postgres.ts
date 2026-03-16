import { neon } from "@neondatabase/serverless";
import type { MealEntry, MealItem, MacroTotals, UserSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";

function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

// ---------- Meals ----------

export async function dbGetMealsByDate(
  userEmail: string,
  date: string
): Promise<MealEntry[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, date, timestamp, query, meal_name, items,
           total_kcal, total_protein, total_carbs, total_fat
    FROM meals
    WHERE user_email = ${userEmail} AND date = ${date}
    ORDER BY timestamp DESC
  `;
  return rows.map(rowToMealEntry);
}

export async function dbAddMeal(
  userEmail: string,
  meal: MealEntry
): Promise<void> {
  const sql = getSQL();
  const itemsJson = JSON.stringify(meal.items);
  await sql`
    INSERT INTO meals (id, user_email, date, timestamp, query, meal_name, items,
                       total_kcal, total_protein, total_carbs, total_fat)
    VALUES (${meal.id}, ${userEmail}, ${meal.date}, ${meal.timestamp},
            ${meal.query}, ${meal.meal_name}, ${itemsJson}::jsonb,
            ${Math.round(meal.total.kcal)}, ${Math.round(meal.total.protein)}, ${Math.round(meal.total.carbs)}, ${Math.round(meal.total.fat)})
  `;
}

export async function dbUpdateMeal(
  userEmail: string,
  meal: MealEntry
): Promise<void> {
  const sql = getSQL();
  const itemsJson = JSON.stringify(meal.items);
  await sql`
    UPDATE meals
    SET meal_name = ${meal.meal_name},
        items = ${itemsJson}::jsonb,
        total_kcal = ${Math.round(meal.total.kcal)},
        total_protein = ${Math.round(meal.total.protein)},
        total_carbs = ${Math.round(meal.total.carbs)},
        total_fat = ${Math.round(meal.total.fat)}
    WHERE id = ${meal.id} AND user_email = ${userEmail}
  `;
}

export async function dbDeleteMeal(
  userEmail: string,
  id: string
): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM meals WHERE id = ${id} AND user_email = ${userEmail}`;
}

export async function dbGetCaloriesForDates(
  userEmail: string,
  dateKeys: string[]
): Promise<Map<string, number>> {
  const sql = getSQL();
  if (dateKeys.length === 0) return new Map();

  const rows = await sql`
    SELECT date, SUM(total_kcal) as total
    FROM meals
    WHERE user_email = ${userEmail} AND date = ANY(${dateKeys})
    GROUP BY date
  `;

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.date as string, Number(row.total));
  }
  return map;
}

// ---------- Settings ----------

export async function dbGetSettings(
  userEmail: string
): Promise<UserSettings> {
  const sql = getSQL();
  const rows = await sql`
    SELECT daily_calorie_goal, protein_goal, carbs_goal, fat_goal,
           language, quick_chips
    FROM user_settings
    WHERE user_email = ${userEmail}
  `;

  if (rows.length === 0) return DEFAULT_SETTINGS;

  const row = rows[0];
  return {
    dailyCalorieGoal: Number(row.daily_calorie_goal),
    proteinGoal: Number(row.protein_goal),
    carbsGoal: Number(row.carbs_goal),
    fatGoal: Number(row.fat_goal),
    language: row.language as "de" | "en",
    quickChips: row.quick_chips as string[],
  };
}

export async function dbSaveSettings(
  userEmail: string,
  settings: UserSettings
): Promise<void> {
  const sql = getSQL();
  const chipsJson = JSON.stringify(settings.quickChips);
  await sql`
    INSERT INTO user_settings (user_email, daily_calorie_goal, protein_goal,
                               carbs_goal, fat_goal, language, quick_chips)
    VALUES (${userEmail}, ${settings.dailyCalorieGoal}, ${settings.proteinGoal},
            ${settings.carbsGoal}, ${settings.fatGoal}, ${settings.language},
            ${chipsJson}::jsonb)
    ON CONFLICT (user_email) DO UPDATE SET
      daily_calorie_goal = EXCLUDED.daily_calorie_goal,
      protein_goal = EXCLUDED.protein_goal,
      carbs_goal = EXCLUDED.carbs_goal,
      fat_goal = EXCLUDED.fat_goal,
      language = EXCLUDED.language,
      quick_chips = EXCLUDED.quick_chips
  `;
}

// ---------- Setup ----------

export async function dbSetup(): Promise<void> {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      query TEXT NOT NULL,
      meal_name TEXT NOT NULL,
      items JSONB NOT NULL,
      total_kcal INTEGER NOT NULL,
      total_protein INTEGER NOT NULL,
      total_carbs INTEGER NOT NULL,
      total_fat INTEGER NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_email, date)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_email TEXT PRIMARY KEY,
      daily_calorie_goal INTEGER NOT NULL DEFAULT 2200,
      protein_goal INTEGER NOT NULL DEFAULT 150,
      carbs_goal INTEGER NOT NULL DEFAULT 250,
      fat_goal INTEGER NOT NULL DEFAULT 70,
      language TEXT NOT NULL DEFAULT 'de',
      quick_chips JSONB NOT NULL DEFAULT '[]'
    )
  `;
}

// ---------- Helpers ----------

function rowToMealEntry(row: Record<string, unknown>): MealEntry {
  return {
    id: row.id as string,
    date: row.date as string,
    timestamp: row.timestamp as string,
    query: row.query as string,
    meal_name: row.meal_name as string,
    items: row.items as MealItem[],
    total: {
      kcal: Number(row.total_kcal),
      protein: Number(row.total_protein),
      carbs: Number(row.total_carbs),
      fat: Number(row.total_fat),
    } as MacroTotals,
  };
}
