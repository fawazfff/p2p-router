import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { RouteOption, RouterRequest } from "@/lib/p2p-schema";

const intentSchema = z.object({
  country: z.string().nullable(),
  fiat: z.string().nullable(),
  asset: z.string().nullable(),
  tradeType: z.enum(["BUY", "SELL"]).nullable(),
  cryptoAmount: z.number().positive().nullable(),
  paymentMethod: z.string().nullable(),
});

const explanationSchema = z.object({
  headline: z.string().max(90),
  summary: z.string().max(260),
  watchFor: z.string().max(220),
});

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey, timeout: 8_000, maxRetries: 0 }) : null;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

function cleanCopy(value: string, maximumLength: number) {
  return value
    .replace(/[—–]/g, ",")
    .replace(/\s+/g, " ")
    .replace(/^(In (today's|the) .+?,\s*)/i, "")
    .trim()
    .slice(0, maximumLength);
}

export async function interpretIntent(prompt: string) {
  const openai = client();
  if (!openai) {
    return { parsed: null, source: "unavailable" as const };
  }

  const response = await openai.responses.parse({
    model: MODEL,
    input: [
      {
        role: "developer",
        content: "Extract a Binance P2P search request. BUY means the user pays fiat and receives crypto. SELL means the user sends crypto and receives fiat. Return null for anything not stated. Payment methods should be concise identifiers when obvious, such as BANK for bank transfer. Do not calculate routes or invent facts.",
      },
      { role: "user", content: prompt.slice(0, 500) },
    ],
    text: { format: zodTextFormat(intentSchema, "p2p_intent") },
  });

  return { parsed: response.output_parsed, source: "openai" as const };
}

export async function explainRoutes(request: RouterRequest, routes: RouteOption[]) {
  const openai = client();
  if (!openai || !routes.length) return null;

  const evidence = routes.map((route) => ({
    labels: route.labels,
    merchants: route.legs.length,
    effectivePrice: route.effectivePrice,
    fiatTotal: route.fiatTotal,
    reliabilityScore: route.reliabilityScore,
    legs: route.legs.map((leg) => ({
      merchant: leg.merchant,
      cryptoAmount: leg.cryptoAmount,
      price: leg.price,
      completionRate: leg.monthFinishRate,
      orders: leg.monthOrderCount,
    })),
  }));

  const response = await openai.responses.parse({
    model: MODEL,
    input: [
      {
        role: "developer",
        content: "Explain a deterministic Binance P2P route in words a 10-year-old can follow. Use only the supplied evidence. Write short, natural sentences. Say what was chosen and why. Never promise speed, safety, profit or successful settlement. Avoid hype, corporate language, metaphors, repeated points, em dashes, 'not X but Y' phrasing and generic openings. Do not use markdown.",
      },
      {
        role: "user",
        content: JSON.stringify({ request, evidence }),
      },
    ],
    text: { format: zodTextFormat(explanationSchema, "route_explanation") },
  });

  const parsed = response.output_parsed;
  if (!parsed) return null;
  return {
    headline: cleanCopy(parsed.headline, 90),
    summary: cleanCopy(parsed.summary, 260),
    watchFor: cleanCopy(parsed.watchFor, 220),
  };
}
