import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGetSettings, dbSaveSettings } from "@/lib/postgres";
import type { UserSettings } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await dbGetSettings(session.user.email);
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings: UserSettings;
  try {
    settings = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await dbSaveSettings(session.user.email, settings);
  return NextResponse.json({ ok: true });
}
