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
    const ads = await listP2PAds({
      fiat: parsed.data.fiat,
      asset: parsed.data.asset,
      tradeType: parsed.data.tradeType,
      paymentMethod: parsed.data.paymentMethod,
    });

    if (!ads.length) {
      const [methods, liveAds] = await Promise.all([
        listTradeMethods(parsed.data.fiat),
        parsed.data.paymentMethod === "ANY"
          ? Promise.resolve(ads)
          : listP2PAds({
            fiat: parsed.data.fiat,
            asset: parsed.data.asset,
            tradeType: parsed.data.tradeType,
          }),
      ]);
      const methodNames = new Map(methods.map((method) => [method.identifier, method.name]));
      const suggestedMethods = Array.from(new Set(liveAds.flatMap((ad) => ad.tradeMethods)))
        .filter((identifier) => identifier !== parsed.data.paymentMethod)
        .slice(0, 4)
        .map((identifier) => ({ identifier, name: methodNames.get(identifier) || identifier }));
      const paymentMethodExists = parsed.data.paymentMethod === "ANY" || methods.some(
        (method) => method.identifier === parsed.data.paymentMethod,
      );

      const response: RouterResponse = {
        ok: false,
        code: paymentMethodExists ? "NO_ADS" : "PAYMENT_UNAVAILABLE",
        message: !paymentMethodExists
          ? methods.length
            ? `Binance does not list ${parsed.data.paymentMethod} for ${parsed.data.fiat}. Choose one of the live methods below.`
            : `Binance currently lists no payment methods for ${parsed.data.fiat}.`
          : liveAds.length
            ? `Binance has live ${parsed.data.fiat} ads, but none use this payment method. Try a live method below.`
            : `Binance returned no live ${parsed.data.asset} ads for this currency and trade direction. P2P Router did not use sample sellers.`,
        activity: [
          { label: "Request read", detail: `${parsed.data.tradeType} ${parsed.data.cryptoAmount} ${parsed.data.asset} with ${parsed.data.fiat}`, status: "done" },
          { label: "Live ads checked", detail: `${liveAds.length} ads returned by Binance`, status: liveAds.length ? "done" : "warning" },
          { label: "Payment checked", detail: paymentMethodExists ? "No current ad uses the selected method" : "The selected method is not listed for this currency", status: "warning" },
        ],
        suggestedMethods,
      };
      return Response.json(response, { status: 404 });
    }

    const result = buildRoutes(ads, parsed.data);

    if (!result.routes.length) {
      const reason = result.failureReason === "AMOUNT"
        ? result.suggestedAmount
          ? `The current minimum is ${Number((result.diagnostics.minimumOrderAmount || result.suggestedAmount).toFixed(6))} ${parsed.data.asset}. Try ${Number(result.suggestedAmount.toFixed(6))} ${parsed.data.asset} to allow for a small market change.`
          : `Binance returned ${result.diagnostics.adsFound} live ads, but this amount is outside their order limits.`
        : result.failureReason === "PAYMENT"
          ? "Live ads were found, but none accept the selected payment method."
          : result.failureReason === "MERCHANT"
            ? "Live ads were found, but none passed the basic order-history and completion checks."
            : result.partialRoute
              ? `A full route is not available. The best current route can cover ${Number(result.partialRoute.coveredAmount.toFixed(6))} of ${parsed.data.cryptoAmount} ${parsed.data.asset}.`
              : "The current eligible ads cannot cover the full amount.";
      const response: RouterResponse = {
        ok: false,
        code: "NO_ROUTE",
        message: reason,
        activity: result.activity,
        diagnostics: result.diagnostics,
        suggestedAmount: result.suggestedAmount,
        partialRoute: result.partialRoute,
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
