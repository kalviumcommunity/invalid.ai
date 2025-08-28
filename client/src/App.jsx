import { useMemo, useState } from "react";
import { motion } from "framer-motion"; // Dont mind the error it is a react issue

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

export default function App() {
  const [form, setForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    interests: [],
    budgetLevel: "medium",
    pace: "balanced",
    extras: "",
  });

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const dayCount = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    const ms = e - s;
    return ms >= 0 ? Math.floor(ms / (1000 * 60 * 60 * 24)) + 1 : 0;
  }, [form.startDate, form.endDate]);

  const interestOptions = [
    "history",
    "museums",
    "nature",
    "food",
    "adventure",
    "beaches",
    "nightlife",
    "shopping",
    "culture",
    "photography",
  ];

  function toggleInterest(tag) {
    setForm((f) => {
      const has = f.interests.includes(tag);
      return {
        ...f,
        interests: has
          ? f.interests.filter((i) => i !== tag)
          : [...f.interests, tag],
      };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch(`${API_BASE}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok)
        throw new Error(
          (data.errors && data.errors.join(", ")) || "Failed to plan"
        );
      setPlan(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadJSON() {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-${plan.destination}-${plan.startDate}_to_${plan.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-72 h-72 bg-blue-500/30 blur-3xl rounded-full top-20 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 blur-3xl rounded-full bottom-20 right-10 animate-spin-slow"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-extrabold text-white bg-clip-text pb-10"
        >
          🧭 AI Trip Planner
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-300 mb-8"
        >
          Plan smarter, futuristic itineraries with AI ✨
        </motion.p>

        {/* Form */}
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/70 p-8 rounded-2xl shadow-xl space-y-6 mb-10"
        >
          {/* Destination & Travelers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Destination
              </label>
              <input
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                placeholder="e.g., Tokyo"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Travelers
              </label>
              <input
                type="number"
                min={1}
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
                value={form.travelers}
                onChange={(e) =>
                  setForm({ ...form, travelers: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Budget & Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Budget</label>
              <select
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
                value={form.budgetLevel}
                onChange={(e) =>
                  setForm({ ...form, budgetLevel: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pace</label>
              <select
                className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
                value={form.pace}
                onChange={(e) => setForm({ ...form, pace: e.target.value })}
              >
                <option value="chill">Chill</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Packed</option>
              </select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((tag) => {
                const active = form.interests.includes(tag);
                return (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      active
                        ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-500/30"
                        : "bg-slate-900/60 border-slate-700 text-slate-300 hover:border-pink-500 hover:text-pink-300"
                    }`}
                  >
                    {tag}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Extras (optional)
            </label>
            <textarea
              className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg"
              placeholder="dietary needs, mobility, must-see places, etc."
              value={form.extras}
              onChange={(e) => setForm({ ...form, extras: e.target.value })}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-400 hover:to-blue-500 px-6 py-2 rounded-lg font-semibold shadow-lg shadow-pink-500/30"
            >
              {loading ? "Planning…" : "🚀 Generate Itinerary"}
            </motion.button>
            <span className="text-slate-400 text-sm">
              {dayCount > 0 ? `${dayCount} day(s)` : "Select dates"}
            </span>
          </div>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/40 border border-red-700 text-red-200 px-4 py-2 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Plan Output */}
        {plan && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">
                  {plan.destination} • {plan.startDate} → {plan.endDate}
                </h2>
                <p className="text-slate-400 text-sm">
                  Budget: {plan.budgetLevel} • Pace: {plan.pace} • Source:{" "}
                  {plan.source || "gemini"}
                </p>
              </div>
              <button
                onClick={downloadJSON}
                className="border border-slate-600 px-3 py-1 rounded-lg text-sm hover:bg-slate-800/80"
              >
                Download JSON
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {plan.days?.map((d, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-pink-500/20 backdrop-blur-xl"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-slate-700/60 px-2 py-0.5 rounded-full">
                      {d.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{d.title}</h3>
                  <p className="text-slate-300 text-sm mb-4">{d.summary}</p>

                  <div className="space-y-2">
                    <p>
                      <span className="text-pink-400 font-medium">🌅 Morning:</span>{" "}
                      {d.morning}
                    </p>
                    <p>
                      <span className="text-blue-400 font-medium">☀️ Afternoon:</span>{" "}
                      {d.afternoon}
                    </p>
                    <p>
                      <span className="text-indigo-400 font-medium">🌙 Evening:</span>{" "}
                      {d.evening}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-slate-400 text-sm font-semibold mb-1">
                      🍜 Food Suggestions
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {d.foodSuggestions?.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-slate-400 text-sm font-semibold mb-1">
                      💡 Tips
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {d.tips?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
