// server.js
// Minimal AI Trip Planner backend using Google Gemini
// Run: npm i express cors dotenv @google/generative-ai
// Env: GEMINI_API_KEY=your_key_here

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Basic input guard
function validate(body) {
  const errors = [];
  const required = ['destination', 'startDate', 'endDate'];
  required.forEach((k) => !body[k] && errors.push(`${k} is required`));

  // crude date check
  if (body.startDate && body.endDate) {
    const s = new Date(body.startDate);
    const e = new Date(body.endDate);
    if (isNaN(s) || isNaN(e) || e < s) errors.push('Invalid date range');
  }
  return errors;
}

// Health
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'AI Trip Planner API', time: new Date().toISOString() });
});

// Plan endpoint
app.post('/api/plan', async (req, res) => {
  const errors = validate(req.body || {});
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const {
    destination,
    startDate,
    endDate,
    travelers = 1,
    interests = [],
    budgetLevel = 'medium', // low | medium | high
    pace = 'balanced',      // chill | balanced | packed
    extras = '',
  } = req.body;

  // If no key, return a friendly mock so you can test UI fast.
  if (!process.env.GEMINI_API_KEY) {
    const mock = buildMockPlan({ destination, startDate, endDate, travelers, interests, budgetLevel, pace });
    return res.json({ ok: true, source: 'mock', ...mock });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Ask for clean JSON back (schema helps keep it structured)
    const prompt = `
You are a meticulous travel planner. Create a practical, locally-optimized itinerary.

Constraints:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate}
- Travelers: ${travelers}
- Interests: ${interests.join(', ') || 'general sightseeing'}
- Budget: ${budgetLevel} (low/medium/high)
- Pace: ${pace} (chill/balanced/packed)
- Extras: ${extras || 'none'}

Rules:
- Return ONLY JSON that matches the schema.
- Each day must include: title, summary, morning, afternoon, evening, foodSuggestions (array), tips (array).
- Keep items geographically sensible to reduce backtracking.
- Put approximate times and short reasons for each stop.
`;

    const generationConfig = {
      temperature: 0.6,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
      // Response schema helps Gemini output clean JSON
      responseSchema: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                title: { type: 'string' },
                summary: { type: 'string' },
                morning: { type: 'string' },
                afternoon: { type: 'string' },
                evening: { type: 'string' },
                foodSuggestions: { type: 'array', items: { type: 'string' } },
                tips: { type: 'array', items: { type: 'string' } },
              },
              required: ['date', 'title', 'summary', 'morning', 'afternoon', 'evening', 'foodSuggestions', 'tips'],
            },
          },
          budgetLevel: { type: 'string' },
          pace: { type: 'string' },
        },
        required: ['destination', 'startDate', 'endDate', 'days', 'budgetLevel', 'pace'],
      },
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    // SDK v1 returns .response.text() (string). Parse safely.
    const text = result?.response?.text?.() || '{}';
    const data = safeParseJSON(text);

    if (!data || !Array.isArray(data.days)) {
      // If model returns something unexpected, fall back to mock
      const mock = buildMockPlan({ destination, startDate, endDate, travelers, interests, budgetLevel, pace });
      return res.json({ ok: true, source: 'fallback-mock', ...mock });
    }

    return res.json({ ok: true, source: 'gemini', ...data });
  } catch (err) {
    console.error('AI error:', err?.message || err);
    // graceful fallback
    const mock = buildMockPlan({ destination, startDate, endDate, travelers, interests, budgetLevel, pace });
    return res.json({ ok: true, source: 'error-mock', ...mock });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

// -------- helpers --------
function safeParseJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function buildMockPlan({ destination, startDate, endDate, budgetLevel, pace }) {
  const days = enumerateDates(startDate, endDate).map((d, i) => ({
    date: d,
    title: `Day ${i + 1} in ${destination}`,
    summary: `Highlights of ${destination} tailored to ${budgetLevel} budget and ${pace} pace.`,
    morning: `08:30 – City stroll and landmark visit near central ${destination}.`,
    afternoon: `13:00 – Museum/market in a nearby district; short transfer.`,
    evening: `18:30 – Sunset spot + riverside/old-town walk.`,
    foodSuggestions: [
      `Local breakfast cafe near center`,
      `Lunch at a well-rated casual spot`,
      `Dinner at a popular local kitchen`,
    ],
    tips: [
      'Buy transit pass/card to save time',
      'Prebook tickets for major attractions',
      'Carry cash card/UPI backup',
    ],
  }));

  return {
    destination,
    startDate,
    endDate,
    days,
    budgetLevel,
    pace,
  };
}

function enumerateDates(isoStart, isoEnd) {
  const s = new Date(isoStart);
  const e = new Date(isoEnd);
  const out = [];
  if (isNaN(s) || isNaN(e) || e < s) return out;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
