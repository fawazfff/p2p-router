import { listP2PAds, listTradeMethods } from "@/lib/binance-p2p";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, { limit: 60 });
  if (limited) return limited;

  const fiat = new URL(request.url).searchParams.get("fiat")?.toUpperCase();
  const asset = new URL(request.url).searchParams.get("asset")?.toUpperCase() || "USDT";
  const tradeType = new URL(request.url).searchParams.get("tradeType")?.toUpperCase() || "BUY";
  if (!fiat || !/^[A-Z]{3}$/.test(fiat)) {
    return Response.json({ ok: false, message: "Choose a valid fiat currency." }, { status: 400 });
  }
  if (!/^[A-Z0-9]{2,10}$/.test(asset) || (tradeType !== "BUY" && tradeType !== "SELL")) {
    return Response.json({ ok: false, message: "Choose a valid asset and trade direction." }, { status: 400 });
  }

  try {
    const [registeredMethods, ads] = await Promise.all([
      listTradeMethods(fiat),
      listP2PAds({ fiat, asset, tradeType }),
    ]);
    const names = new Map(registeredMethods.map((method) => [method.identifier, method.name]));
    const activeIdentifiers = Array.from(new Set(ads.flatMap((ad) => ad.tradeMethods)));
    const methods = activeIdentifiers.map((identifier) => ({
      identifier,
      name: names.get(identifier) || identifier,
    }));
    return Response.json({
      ok: true,
      methods,
      liveAds: ads.length,
      registeredMethods,
    });
  } catch {
    return Response.json({
      ok: false,
      message: "Live Binance payment methods are unavailable right now.",
    }, { status: 502 });
  }
}
