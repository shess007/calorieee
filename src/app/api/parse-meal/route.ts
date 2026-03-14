import { NextRequest, NextResponse } from "next/server";
import { parseMealWithAI } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' field" },
      { status: 400 }
    );
  }

  try {
    const result = await parseMealWithAI(query, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("parse-meal error:", message);

    const isApiError = message.includes("API returned");
    return NextResponse.json(
      {
        error: isApiError
          ? `AI service error (${message})`
          : "Couldn't parse that meal. Try being more specific.",
      },
      { status: isApiError ? 502 : 422 }
    );
  }
}
