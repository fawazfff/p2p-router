import { listTradeMethods } from "@/lib/binance-p2p";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const fiat = new URL(request.url).searchParams.get("fiat")?.toUpperCase();
  if (!fiat || !/^[A-Z]{3}$/.test(fiat)) {
    return Response.json({ ok: false, message: "Choose a valid fiat currency." }, { status: 400 });
  }

  try {
    const methods = await listTradeMethods(fiat);
    return Response.json({ ok: true, methods });
  } catch {
    return Response.json({
      ok: false,
      message: "Live Binance payment methods are unavailable right now.",
    }, { status: 502 });
  }
}

