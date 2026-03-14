import type { MealItem, MacroTotals } from "./types";
import { SYSTEM_PROMPT } from "./constants";

interface ParsedMeal {
  meal_name: string;
  items: MealItem[];
  total: MacroTotals;
}

export async function parseMealWithAI(
  query: string,
  apiKey: string
): Promise<ParsedMeal> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("API error:", res.status, errBody);
    throw new Error(`API returned ${res.status}`);
  }

  const data = await res.json();
  const content = data.content?.find(
    (b: { type: string }) => b.type === "text"
  )?.text;
  if (!content) throw new Error("No text in response");

  // Strip markdown fences if present
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: ParsedMeal;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not parse AI response as JSON");
    }
  }

  // Validate and compute totals if missing
  if (!parsed.total?.kcal && parsed.items?.length) {
    parsed.total = parsed.items.reduce(
      (acc: MacroTotals, item: MealItem) => ({
        kcal: acc.kcal + (item.kcal || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  return {
    meal_name: parsed.meal_name || "Mahlzeit",
    items: parsed.items || [],
    total: parsed.total || { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  };
}
