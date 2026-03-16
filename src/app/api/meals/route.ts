import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGetMealsByDate, dbAddMeal, dbGetCaloriesForDates } from "@/lib/postgres";
import type { MealEntry } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  // GET /api/meals?calories=2026-03-10,2026-03-11,...
  const caloriesDates = searchParams.get("calories");
  if (caloriesDates) {
    const dateKeys = caloriesDates.split(",").filter(Boolean);
    const map = await dbGetCaloriesForDates(session.user.email, dateKeys);
    // Convert Map to plain object for JSON
    const obj: Record<string, number> = {};
    for (const [k, v] of map) obj[k] = v;
    return NextResponse.json(obj);
  }

  // GET /api/meals?date=2026-03-14
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Missing 'date' parameter" }, { status: 400 });
  }

  const meals = await dbGetMealsByDate(session.user.email, date);
  return NextResponse.json(meals);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let meal: MealEntry;
  try {
    meal = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await dbAddMeal(session.user.email, meal);
  return NextResponse.json({ ok: true });
}
