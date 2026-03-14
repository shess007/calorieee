# Fuel — AI-Powered Calorie Tracker

## Project Overview

**Fuel** is a mobile-first web app for daily calorie and macro tracking. The core differentiator is **natural language meal logging powered by AI** — instead of searching databases and manually entering grams, the user describes what they ate in plain text (German or English) and the AI returns a structured nutritional breakdown.

### Target Stack

- **Framework:** Next.js (App Router)
- **State Management:** Zustand
- **Persistence:** Dexie.js (IndexedDB)
- **Styling:** Tailwind CSS
- **AI Backend:** Anthropic Claude API (Sonnet) — can be swapped for Grok later
- **Deployment:** Vercel

### Design Direction

- Dark theme, minimal, mobile-first (max-width ~440px centered)
- Font: Instrument Sans (Google Fonts)
- Color palette: dark background (#0a0a0a), green accent gradient (#7cff6b → #00d4aa), yellow for carbs (#ffd76b), orange for fat (#ff9f6b), red for over-budget (#ff6b6b)
- Animated ring chart for daily calorie progress
- Smooth animated transitions (cubic-bezier easing on all value changes)

---

## What Is Already Implemented (Prototype)

The prototype is a single React component (`calorie-tracker.jsx`) built as a Claude.ai artifact. It demonstrates the core concept and UI but is **not** a proper Next.js project yet.
   - HTTP status error detection with distinct messaging
   - JSON parse failure recovery
   - User-facing error banners

### UI/UX Details Already Designed

- German locale for date display (Samstag, 14. März)
- German placeholder text ("Was hast du gegessen?")
- German section labels ("Heute · 3 Einträge")
- Hover states on meal cards and quick-add chips
- Empty state with plate emoji and instruction text
- Loading state with pulsing dots on the Log button
- slideUp animation on meal cards with staggered delay
- fadeIn animation on page load
- Custom scrollbar styling

---

## What Needs to Be Built

### Phase 1: Project Scaffolding

Convert the prototype into a proper Next.js project.

- [ ] Initialize Next.js project with App Router, TypeScript, Tailwind
- [ ] Set up project structure:
  ```
  src/
    app/
      layout.tsx
      page.tsx          ← main dashboard (today view)
      history/
        page.tsx        ← past days
      settings/
        page.tsx        ← goals, preferences
    components/
      CalorieRing.tsx
      MacroBar.tsx
      MealCard.tsx
      MealInput.tsx
      QuickChips.tsx
      DayNavigator.tsx
      WeeklySummary.tsx
    lib/
      ai.ts             ← AI API call + parsing logic
      db.ts             ← Dexie.js schema + queries
      store.ts          ← Zustand store
      types.ts          ← TypeScript interfaces
      constants.ts      ← goals, colors, prompts
    hooks/
      useAnimatedValue.ts
      useDailyTotals.ts
      useMeals.ts
  ```
- [ ] Move inline styles to Tailwind classes
- [ ] Extract the AI system prompt and parsing logic into `lib/ai.ts`
- [ ] Set up environment variable for API key (`NEXT_PUBLIC_ANTHROPIC_API_KEY` or server-side route)

### Phase 2: Data Layer (Dexie.js + Zustand)

Replace the artifact `window.storage` with a proper persistence layer.

- [ ] **Dexie.js schema:**
  ```typescript
  interface MealEntry {
    id: string;              // auto-generated
    date: string;            // ISO date (2026-03-14) — index
    timestamp: string;       // ISO datetime
    query: string;           // original user input
    meal_name: string;       // AI-generated name
    items: MealItem[];       // breakdown
    total: MacroTotals;      // { kcal, protein, carbs, fat }
  }

  interface MealItem {
    name: string;
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }

  interface UserSettings {
    dailyCalorieGoal: number;   // default 2200
    proteinGoal: number;        // default 150
    carbsGoal: number;          // default 250
    fatGoal: number;            // default 70
    language: 'de' | 'en';     // default 'de'
    quickChips: string[];       // customizable quick-add items
  }
  ```
- [ ] Index `MealEntry` by `date` for fast day-based queries
- [ ] **Zustand store** for UI state: selected date, loading state, error state, settings
- [ ] Hydrate Zustand from Dexie on app load

### Phase 3: Core Feature Completion

#### 3a. Settings Page
- [ ] Editable daily goals (kcal, protein, carbs, fat)
- [ ] Language toggle (de/en) — affects UI labels and AI prompt language
- [ ] Manage quick-add chips (add/remove/reorder)
- [ ] Data export (JSON download of all entries)
- [ ] Data reset / clear all

#### 3b. Day Navigation & History
- [ ] Day navigator component (← Today →) on the main dashboard
- [ ] Swipe or arrow keys to move between days
- [ ] History page with a calendar or scrollable list of past days
- [ ] Each past day shows: total kcal, macro summary, meal count
- [ ] Tap a day to see full meal log

#### 3c. Weekly/Monthly Summary
- [ ] Bar chart or area chart showing daily kcal over the past 7/30 days
- [ ] Average kcal, average macros
- [ ] Streak tracking (consecutive days logged)
- [ ] Best/worst day highlights

#### 3d. Meal Editing
- [ ] Edit a logged meal (re-run AI with modified query, or manual adjust)
- [ ] Duplicate / "log again" for recurring meals
- [ ] Adjust portion size (multiplier on all values)

#### 3e. Favorites / Frequent Meals
- [ ] Star/save a meal as a favorite
- [ ] "Frequent" section derived from logged history (auto-detected)
- [ ] Quick-add chips should update dynamically based on most-logged meals
- [ ] One-tap re-log from favorites

### Phase 4: AI Enhancements

#### 4a. Server-Side API Route
- [ ] Move AI call to a Next.js API route (`/api/parse-meal`) to protect API key
- [ ] Add rate limiting (e.g., 50 requests/day per user)
- [ ] Cache identical queries (same input → same output, skip API call)

#### 4b. Smarter Prompting
- [ ] Include user's recent meals in the prompt context for better portion estimation
- [ ] Support multi-meal input ("Zum Frühstück Müsli, mittags Döner, abends Pizza")
- [ ] Handle corrections ("Eigentlich waren es 300g, nicht 200g")
- [ ] Support vague inputs with follow-up ("Was für ein Salat? Mit Dressing?")

#### 4c. Barcode Scanning (Optional)
- [ ] Camera input component using `react-zxing` or `html5-qrcode`
- [ ] Look up barcode via Open Food Facts API (`https://world.openfoodfacts.org/api/v2/product/{barcode}`)
- [ ] Fall back to AI estimation if barcode not found
- [ ] Map OFF response to the MealItem schema

### Phase 5: Polish & PWA

- [ ] Add a bottom tab bar navigation (Today, History, Settings)
- [ ] PWA manifest + service worker for installability
- [ ] Offline support — log meals offline, parse with AI when back online (or use cached responses)
- [ ] Push notification reminders ("Du hast heute noch nichts geloggt")
- [ ] Haptic feedback on mobile (navigator.vibrate)
- [ ] Page transitions / route animations
- [ ] Onboarding flow (set goals on first launch)
- [ ] Dark/light theme toggle (currently dark-only)

### Phase 6: Nice-to-Haves (Future)

- [ ] Photo-based meal logging (snap a photo → AI describes + estimates)
- [ ] Voice input (speech-to-text → AI parse)
- [ ] Water intake tracking
- [ ] Weight tracking + trend line
- [ ] Integration with health APIs (Apple Health, Google Fit)
- [ ] Multi-user / auth (Supabase or similar)
- [ ] Sharing / social (share daily summary as image)

---

## Technical Notes

### AI Prompt (Current)

```
You are a nutrition assistant. The user describes what they ate.
Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "meal_name": "Short descriptive name",
  "items": [
    { "name": "Item name", "grams": 150, "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
  ],
  "total": { "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
}
Estimate reasonable portions if not specified.
Be accurate with calorie counts based on standard nutritional data.
Always respond with the JSON object only.
```

### JSON Parsing Strategy (Current)

1. Check HTTP status, throw on non-2xx
2. Extract text block from API response
3. Strip markdown fences (```json ... ```)
4. Try `JSON.parse` on cleaned string
5. If parse fails, regex-extract first `{...}` block and re-parse
6. Validate structure: if `total` is missing but `items` exist, compute totals from items
7. Apply fallback defaults for any missing fields

### Key Design Decisions to Make

1. **API key handling:** Server-side route (secure) vs. client-side with NEXT_PUBLIC env var (simpler for dev). Recommendation: server-side route for production.
2. **AI provider:** Currently Claude Sonnet. Could switch to Grok for cost. The prompt and parsing logic are provider-agnostic — just swap the endpoint and model string.
3. **Offline strategy:** Queue meals locally, show "pending" badge, parse when reconnected. Or skip AI offline and allow manual entry as fallback.
4. **i18n approach:** Simple key-value object for de/en, no heavy framework needed for 2 languages.

---

## Priority Order for Implementation

1. **Project scaffolding** — get Next.js running with the current UI ported over
2. **Dexie.js + Zustand** — proper persistence replacing window.storage
3. **Server-side API route** — secure the API key
4. **Settings page** — configurable goals
5. **Day navigation** — view past days
6. **Favorites / frequent meals** — reduce friction for repeat meals
7. **Weekly summary charts** — motivation and tracking
8. **Meal editing** — corrections and adjustments
9. **PWA + offline** — installability
10. **Barcode scanning** — bonus feature for packaged foods
