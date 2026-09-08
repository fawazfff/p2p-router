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
    const [methods, ads] = await Promise.all([
      listTradeMethods(parsed.data.fiat),
      listP2PAds({
        fiat: parsed.data.fiat,
        asset: parsed.data.asset,
        tradeType: parsed.data.tradeType,
        paymentMethod: parsed.data.paymentMethod,
      }),
    ]);
    const paymentMethodExists = methods.some(
      (method) => method.identifier === parsed.data.paymentMethod,
    );

    if (parsed.data.paymentMethod !== "ANY" && !paymentMethodExists) {
      const liveAds = await listP2PAds({
        fiat: parsed.data.fiat,
        asset: parsed.data.asset,
        tradeType: parsed.data.tradeType,
      });
      const methodNames = new Map(methods.map((method) => [method.identifier, method.name]));
      const suggestedMethods = Array.from(new Set(liveAds.flatMap((ad) => ad.tradeMethods)))
        .slice(0, 4)
        .map((identifier) => ({ identifier, name: methodNames.get(identifier) || identifier }));
      const response: RouterResponse = {
        ok: false,
        code: "PAYMENT_UNAVAILABLE",
        message: methods.length
          ? `Binance does not list ${parsed.data.paymentMethod} for ${parsed.data.fiat}. Choose one of the live methods below.`
          : `Binance currently lists no payment methods for ${parsed.data.fiat}.`,
        suggestedMethods,
        activity: [
          { label: "Request read", detail: `${parsed.data.tradeType} ${parsed.data.cryptoAmount} ${parsed.data.asset} with ${parsed.data.fiat}`, status: "done" },
          { label: "Live ads checked", detail: `${liveAds.length} ads returned by Binance`, status: liveAds.length ? "done" : "warning" },
          { label: "Payment checked", detail: "The selected method is not listed for this currency", status: "warning" },
        ],
      };
      return Response.json(response, { status: 404 });
    }
    const result = buildRoutes(ads, parsed.data);

    if (!ads.length) {
      const liveAds = parsed.data.paymentMethod === "ANY"
        ? ads
        : await listP2PAds({
          fiat: parsed.data.fiat,
          asset: parsed.data.asset,
          tradeType: parsed.data.tradeType,
        });
      const methodNames = new Map(methods.map((method) => [method.identifier, method.name]));
      const suggestedMethods = Array.from(new Set(liveAds.flatMap((ad) => ad.tradeMethods)))
        .filter((identifier) => identifier !== parsed.data.paymentMethod)
        .slice(0, 4)
        .map((identifier) => ({ identifier, name: methodNames.get(identifier) || identifier }));
      const response: RouterResponse = {
        ok: false,
        code: "NO_ADS",
        message: liveAds.length
          ? `Binance has live ${parsed.data.fiat} ads, but none use this payment method. Try a live method below.`
          : `Binance returned no live ${parsed.data.asset} ads for this currency and trade direction. P2P Router did not use sample sellers.`,
        activity: result.activity,
        diagnostics: result.diagnostics,
        suggestedMethods,
      };
      return Response.json(response, { status: 404 });
    }

    if (!result.routes.length) {
      const reason = result.failureReason === "AMOUNT"
        ? `Binance returned ${result.diagnostics.adsFound} live ads, but this amount is outside their order limits. Try a different amount.`
        : result.failureReason === "PAYMENT"
          ? "Live ads were found, but none accept the selected payment method."
          : result.failureReason === "MERCHANT"
            ? "Live ads were found, but none passed the basic order-history and completion checks."
            : "The eligible ads cannot cover the full amount, even when combined.";
      const response: RouterResponse = {
        ok: false,
        code: "NO_ROUTE",
        message: reason,
        activity: result.activity,
        diagnostics: result.diagnostics,
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
