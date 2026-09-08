import { listP2PAds, listTradeMethods } from "@/lib/binance-p2p";
import { explainRoutes } from "@/lib/openai-agent";
import { routerRequestSchema, type RouterResponse } from "@/lib/p2p-schema";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildRoutes } from "@/lib/route-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, { limit: 20 });
  if (limited) return limited;

  const parsed = routerRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const response: RouterResponse = {
      ok: false,
      code: "INVALID_REQUEST",
      message: "Check the country, currency, amount and payment method, then try again.",
    };
    return Response.json(response, { status: 400 });
  }

  try {
    const methods = await listTradeMethods(parsed.data.fiat);
    const paymentMethodExists = methods.some(
      (method) => method.identifier === parsed.data.paymentMethod,
    );

    if (parsed.data.paymentMethod !== "ANY" && !paymentMethodExists) {
      const response: RouterResponse = {
        ok: false,
        code: "PAYMENT_UNAVAILABLE",
        message: `Binance returned no live ${parsed.data.paymentMethod} payment method for ${parsed.data.fiat}. No substitute identifier was used.`,
        activity: [
          { label: "Goal understood", detail: `${parsed.data.tradeType} ${parsed.data.cryptoAmount} ${parsed.data.asset} with ${parsed.data.fiat}`, status: "done" },
          { label: "P2P Skill invoked", detail: "Binance public Agent P2P endpoint", status: "done" },
          { label: "Payment method check", detail: "Selected method is not available for this fiat", status: "warning" },
        ],
      };
      return Response.json(response, { status: 404 });
    }

    const ads = await listP2PAds({
      fiat: parsed.data.fiat,
      asset: parsed.data.asset,
      tradeType: parsed.data.tradeType,
      paymentMethod: parsed.data.paymentMethod,
    });
    const result = buildRoutes(ads, parsed.data);

    if (!ads.length) {
      const response: RouterResponse = {
        ok: false,
        code: "NO_ADS",
        message: "Binance returned no live ads for this market and payment method. No substitute data was used.",
        activity: result.activity,
      };
      return Response.json(response, { status: 404 });
    }

    if (!result.routes.length) {
      const response: RouterResponse = {
        ok: false,
        code: "NO_ROUTE",
        message: "Live ads were found, but no verified route covers the full requested amount with these filters.",
        activity: result.activity,
      };
      return Response.json(response, { status: 404 });
    }

    let explanation: Awaited<ReturnType<typeof explainRoutes>> = null;
    try {
      explanation = await explainRoutes(parsed.data, result.routes);
    } catch {
      explanation = null;
    }

    const best = result.routes.find((route) => route.labels.includes("Balanced")) || result.routes[0];
    const response: RouterResponse = {
      ok: true,
      request: parsed.data,
      source: "Binance P2P public market data",
      fetchedAt: new Date().toISOString(),
      routes: result.routes,
      activity: result.activity,
      explanation: explanation
        ? { ...explanation, source: "openai" }
        : {
          headline: `${best.legs.length} ${best.legs.length === 1 ? "merchant" : "merchants"} can cover the full amount`,
          summary: best.explanation,
          watchFor: "Open each ad on Binance and confirm the latest terms before placing an order.",
          source: "deterministic",
        },
    };

    return Response.json(response);
  } catch {
    const response: RouterResponse = {
      ok: false,
      code: "UPSTREAM_UNAVAILABLE",
      message: "Live Binance P2P data is unavailable right now. P2P Router did not fall back to mock merchants.",
    };
    return Response.json(response, { status: 502 });
  }
}
