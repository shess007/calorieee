import { useState, useEffect, useRef, useCallback } from "react";

// ─── Persistent Storage Helper ───
const db = {
  async load(key, fallback) {
    try {
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : fallback;
    } catch {
      return fallback;
    }
  },
  async save(key, value) {
    try {
      await window.storage.set(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage error:", e);
    }
  },
};

// ─── Constants ───
const DAILY_GOAL = 2200;
const MACRO_GOALS = { protein: 150, carbs: 250, fat: 70 };

const todayKey = () => new Date().toISOString().slice(0, 10);

const SYSTEM_PROMPT = `You are a nutrition assistant. The user describes what they ate. Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "meal_name": "Short descriptive name",
  "items": [
    { "name": "Item name", "grams": 150, "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
  ],
  "total": { "kcal": 250, "protein": 20, "carbs": 30, "fat": 8 }
}
Estimate reasonable portions if not specified. Be accurate with calorie counts based on standard nutritional data. Always respond with the JSON object only.`;

// ─── Easing & Animation ───
function useAnimatedValue(target, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef({ start: 0, startTime: 0, target: 0 });

  useEffect(() => {
    const r = ref.current;
    r.start = value;
    r.target = target;
    r.startTime = performance.now();

    let frameId;
    const animate = (now) => {
      const elapsed = now - r.startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(r.start + (r.target - r.start) * eased);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return value;
}

// ─── Ring Chart ───
function CalorieRing({ consumed, goal, size = 220 }) {
  const animatedConsumed = useAnimatedValue(consumed);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(animatedConsumed / goal, 1.15);
  const offset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const overBudget = consumed > goal;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={overBudget ? "#ff6b6b" : "url(#ringGrad)"}
          strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.3s" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7cff6b" />
            <stop offset="100%" stopColor="#00d4aa" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif", fontSize: 42, fontWeight: 700,
          color: overBudget ? "#ff6b6b" : "#e8e8e8", letterSpacing: "-2px",
          lineHeight: 1,
        }}>
          {Math.round(animatedConsumed)}
        </span>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif", fontSize: 11,
          color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
          letterSpacing: "2px", marginTop: 4,
        }}>
          kcal
        </span>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif", fontSize: 13,
          color: overBudget ? "#ff6b6b" : "rgba(255,255,255,0.5)",
          marginTop: 6, fontWeight: 500,
        }}>
          {overBudget ? `+${consumed - goal} over` : `${remaining} left`}
        </span>
      </div>
    </div>
  );
}

// ─── Macro Bar ───
function MacroBar({ label, current, goal, color, unit = "g" }) {
  const animated = useAnimatedValue(current);
  const pct = Math.min((animated / goal) * 100, 100);
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
          letterSpacing: "1.5px", fontFamily: "'Instrument Sans', sans-serif",
        }}>{label}</span>
        <span style={{
          fontSize: 14, color: "#e0e0e0", fontWeight: 600,
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          {Math.round(animated)}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{unit}</span>
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 3, background: color,
          width: `${pct}%`, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
      <div style={{
        fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3, textAlign: "right",
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        / {goal}{unit}
      </div>
    </div>
  );
}

// ─── Meal Card ───
function MealCard({ meal, index, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: "14px 18px", cursor: "pointer",
        animation: `slideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 0.05}s both`,
        transition: "background 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Instrument Sans', sans-serif", fontSize: 15,
            fontWeight: 600, color: "#e0e0e0",
          }}>
            {meal.meal_name}
          </div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2,
            fontFamily: "'Instrument Sans', sans-serif",
          }}>
            {time} · {meal.items.length} item{meal.items.length > 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "'Instrument Sans', sans-serif", fontSize: 20,
            fontWeight: 700, color: "#7cff6b", letterSpacing: "-1px",
          }}>
            {meal.total.kcal}
          </div>
          <div style={{
            fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
            letterSpacing: "1px",
          }}>kcal</div>
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {meal.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", fontSize: 13,
              fontFamily: "'Instrument Sans', sans-serif",
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                {item.name}
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}> · {item.grams}g</span>
              </span>
              <div style={{ display: "flex", gap: 12, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                <span>{item.kcal} kcal</span>
                <span style={{ color: "#7cff6b" }}>{item.protein}p</span>
                <span style={{ color: "#ffd76b" }}>{item.carbs}c</span>
                <span style={{ color: "#ff9f6b" }}>{item.fat}f</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(meal.id); }}
              style={{
                background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)",
                color: "#ff6b6b", borderRadius: 8, padding: "6px 14px", fontSize: 12,
                cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quick Add Chips ───
function QuickChips({ onSelect }) {
  const suggestions = [
    "Müsli mit Milch", "Kaffee mit Milch",
    "Brot mit Käse", "Apfel",
    "Reis mit Hähnchen", "Salat mit Dressing",
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {suggestions.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)", borderRadius: 20,
            padding: "5px 12px", fontSize: 12, cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(124,255,107,0.1)";
            e.currentTarget.style.borderColor = "rgba(124,255,107,0.3)";
            e.currentTarget.style.color = "#7cff6b";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ───
export default function CalorieTracker() {
  const [meals, setMeals] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const inputRef = useRef(null);

  // Load from persistent storage
  useEffect(() => {
    (async () => {
      const saved = await db.load(`meals-${todayKey()}`, []);
      setMeals(saved);
      setInitialLoad(false);
    })();
  }, []);

  // Save on change
  useEffect(() => {
    if (!initialLoad) {
      db.save(`meals-${todayKey()}`, meals);
    }
  }, [meals, initialLoad]);

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.total.kcal,
      protein: acc.protein + m.total.protein,
      carbs: acc.carbs + m.total.carbs,
      fat: acc.fat + m.total.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSubmit = useCallback(async (text) => {
    const query = text || input;
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setInput("");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const content = data.content?.find(b => b.type === "text")?.text;
      if (!content) throw new Error("No text in response");

      // Strip markdown fences if present
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        // Try to extract JSON from the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw parseErr;
        }
      }

      // Validate structure
      if (!parsed.total?.kcal && parsed.items?.length) {
        parsed.total = parsed.items.reduce((acc, item) => ({
          kcal: acc.kcal + (item.kcal || 0),
          protein: acc.protein + (item.protein || 0),
          carbs: acc.carbs + (item.carbs || 0),
          fat: acc.fat + (item.fat || 0),
        }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      }

      const meal = {
        meal_name: parsed.meal_name || query,
        items: parsed.items || [],
        total: parsed.total || { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        query,
      };

      setMeals(prev => [meal, ...prev]);
    } catch (err) {
      console.error("Full error:", err);
      setError(
        err.message?.includes("API returned")
          ? `API error (${err.message}). The service might be temporarily unavailable.`
          : "Couldn't parse that meal. Try being more specific, e.g. '200g Hähnchenbrust mit Reis'."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const deleteMeal = (id) => setMeals(prev => prev.filter(m => m.id !== id));

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e8e8e8",
      fontFamily: "'Instrument Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{
        maxWidth: 440, margin: "0 auto", padding: "40px 20px 100px",
        animation: "fadeIn 0.6s ease",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontSize: 11, textTransform: "uppercase", letterSpacing: "3px",
            color: "rgba(255,255,255,0.25)", marginBottom: 6,
          }}>
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "-1px",
            background: "linear-gradient(135deg, #7cff6b, #00d4aa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Fuel
          </h1>
        </div>

        {/* Ring */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <CalorieRing consumed={totals.kcal} goal={DAILY_GOAL} />
        </div>

        {/* Macros */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36, padding: "0 4px" }}>
          <MacroBar label="Protein" current={totals.protein} goal={MACRO_GOALS.protein} color="#7cff6b" />
          <MacroBar label="Carbs" current={totals.carbs} goal={MACRO_GOALS.carbs} color="#ffd76b" />
          <MacroBar label="Fat" current={totals.fat} goal={MACRO_GOALS.fat} color="#ff9f6b" />
        </div>

        {/* Input */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Was hast du gegessen?"
              disabled={loading}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "12px 16px", fontSize: 14,
                color: "#e8e8e8", outline: "none",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !input.trim()}
              style={{
                background: loading ? "rgba(124,255,107,0.1)" : "linear-gradient(135deg, #7cff6b, #00d4aa)",
                border: "none", borderRadius: 10, padding: "0 20px",
                color: loading ? "#7cff6b" : "#0a0a0a",
                fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                opacity: (!loading && !input.trim()) ? 0.3 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <span style={{ animation: "pulse 1.2s infinite" }}>···</span>
              ) : (
                "Log"
              )}
            </button>
          </div>
          <QuickChips onSelect={(text) => { setInput(text); handleSubmit(text); }} />
        </div>

        {error && (
          <div style={{
            background: "rgba(255,100,100,0.08)",
            border: "1px solid rgba(255,100,100,0.15)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12,
            fontSize: 13, color: "#ff6b6b",
          }}>
            {error}
          </div>
        )}

        {/* Meals */}
        {meals.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, textTransform: "uppercase", letterSpacing: "2px",
              color: "rgba(255,255,255,0.2)", marginBottom: 10, marginTop: 8,
              padding: "0 4px",
            }}>
              Heute · {meals.length} Eintr{meals.length === 1 ? "ag" : "äge"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meals.map((meal, i) => (
                <MealCard key={meal.id} meal={meal} index={i} onDelete={deleteMeal} />
              ))}
            </div>
          </div>
        )}

        {meals.length === 0 && !loading && (
          <div style={{
            textAlign: "center", padding: "48px 0",
            color: "rgba(255,255,255,0.15)", fontSize: 14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍽</div>
            Noch keine Einträge heute.
            <br />
            <span style={{ fontSize: 12 }}>Beschreib einfach was du gegessen hast.</span>
          </div>
        )}
      </div>
    </div>
  );
}
