import { NextRequest, NextResponse } from "next/server";
import { dbSetup } from "@/lib/postgres";

export async function POST(request: NextRequest) {
  // Protect with AUTH_SECRET so it can be called without a session
  const { secret } = await request.json().catch(() => ({ secret: "" }));
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbSetup();
    return NextResponse.json({ ok: true, message: "Tables created" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
