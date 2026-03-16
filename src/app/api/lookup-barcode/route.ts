import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { BarcodeProduct } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "Missing 'code' parameter" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
    {
      headers: { "User-Agent": "Fuel/1.0 (calorie-tracker)" },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ found: false, barcode: code });
  }

  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    return NextResponse.json({ found: false, barcode: code });
  }

  const p = data.product;
  const n = p.nutriments || {};

  // Parse serving size string (e.g. "30g", "1 Stück (25g)") into grams
  let serving_size_g: number | null = null;
  if (p.serving_quantity) {
    serving_size_g = Number(p.serving_quantity);
    if (isNaN(serving_size_g)) serving_size_g = null;
  } else if (p.serving_size) {
    const match = String(p.serving_size).match(/(\d+(?:\.\d+)?)\s*g/i);
    if (match) serving_size_g = Math.round(Number(match[1]));
  }

  const product: BarcodeProduct = {
    name: p.product_name || p.product_name_de || "Unbekanntes Produkt",
    brand: p.brands || "",
    image_url: p.image_url || "",
    serving_size_g,
    per_100g: {
      kcal: Math.round(Number(n["energy-kcal_100g"]) || 0),
      protein: Math.round(Number(n.proteins_100g) || 0),
      carbs: Math.round(Number(n.carbohydrates_100g) || 0),
      fat: Math.round(Number(n.fat_100g) || 0),
    },
  };

  return NextResponse.json({ found: true, product });
}
