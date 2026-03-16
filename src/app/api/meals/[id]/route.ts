import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbDeleteMeal, dbUpdateMeal } from "@/lib/postgres";
import type { MealEntry } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let meal: MealEntry;
  try {
    meal = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (meal.id !== id) {
    return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
  }

  await dbUpdateMeal(session.user.email, meal);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await dbDeleteMeal(session.user.email, id);
  return NextResponse.json({ ok: true });
}
