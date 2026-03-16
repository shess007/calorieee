import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbDeleteMeal } from "@/lib/postgres";

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
