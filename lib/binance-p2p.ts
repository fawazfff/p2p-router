import type { BinanceAd } from "@/lib/p2p-schema";

const BINANCE_MGS_BASE = "https://www.binance.com";
const REQUEST_TIMEOUT_MS = 12_000;

type BinanceEnvelope<T> = {
  code?: string;
  message?: string | null;
  success?: boolean;
  data?: T;
};

type RawAd = {
  adNo?: string;
  price?: number | string;
  fiat?: string;
  fiatSymbol?: string;
  asset?: string;
  minTransAmount?: number | string;
  maxTransAmount?: number | string;
  tradableAmount?: number | string;
  payTimeLimit?: number | string;
  tradeMethods?: string[];
  advertiser?: {
    nickName?: string;
    userType?: string;
    monthOrderCount?: number | string;
    monthFinishRate?: number | string;
    positiveRate?: number | string;
    merchantGroupMember?: boolean;
  };
};

type AdListPayload = { items?: RawAd[] };

type RawTradeMethod = {
  identifier?: string;
  tradeMethodName?: string;
};

function asNumber(value: number | string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function binanceFetch<T>(path: string, params: URLSearchParams): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BINANCE_MGS_BASE}${path}?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "binance-wallet/1.0.0 (Skill)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Binance returned HTTP ${response.status}`);
    }

    const body = (await response.json()) as BinanceEnvelope<T>;
    if (body.success === false || (body.code && body.code !== "000000")) {
      throw new Error(body.message || "Binance returned an unsuccessful response");
    }

    if (body.data === undefined) {
      throw new Error("Binance returned no data field");
    }

    return body.data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listP2PAds(input: {
  fiat: string;
  asset: string;
  tradeType: "BUY" | "SELL";
  paymentMethod?: string;
}): Promise<BinanceAd[]> {
  const params = new URLSearchParams({
    fiat: input.fiat,
    asset: input.asset,
    tradeType: input.tradeType,
    limit: "20",
  });

  if (input.paymentMethod && input.paymentMethod !== "ANY") {
    params.append("tradeMethodIdentifiers", input.paymentMethod);
  }

  const data = await binanceFetch<AdListPayload>(
    "/bapi/c2c/v1/public/c2c/agent/ad-list",
    params,
  );

  return (data.items ?? [])
    .map((item): BinanceAd | null => {
      if (!item.adNo || !item.fiat || !item.asset || !item.advertiser?.nickName) {
        return null;
      }

      const price = asNumber(item.price);
      const tradableAmount = asNumber(item.tradableAmount);
      if (price <= 0 || tradableAmount <= 0) return null;

      return {
        adNo: item.adNo,
        price,
        fiat: item.fiat,
        fiatSymbol: item.fiatSymbol || item.fiat,
        asset: item.asset,
        minTransAmount: asNumber(item.minTransAmount),
        maxTransAmount: asNumber(item.maxTransAmount),
        tradableAmount,
        payTimeLimit: asNumber(item.payTimeLimit),
        tradeMethods: Array.from(new Set(item.tradeMethods ?? [])),
        advertiser: {
          nickName: item.advertiser.nickName,
          userType: item.advertiser.userType || "user",
          monthOrderCount: asNumber(item.advertiser.monthOrderCount),
          monthFinishRate: asNumber(item.advertiser.monthFinishRate),
          positiveRate: asNumber(item.advertiser.positiveRate),
          merchantGroupMember: Boolean(item.advertiser.merchantGroupMember),
        },
      };
    })
    .filter((item): item is BinanceAd => item !== null);
}

export async function listTradeMethods(fiat: string) {
  const data = await binanceFetch<RawTradeMethod[]>(
    "/bapi/c2c/v1/public/c2c/agent/trade-methods",
    new URLSearchParams({ fiat }),
  );

  const methods = (data ?? [])
    .filter((item) => item.identifier)
    .map((item) => ({
      identifier: item.identifier as string,
      name: item.tradeMethodName || (item.identifier as string),
    }));

  return Array.from(
    new Map(methods.map((method) => [method.identifier, method])).values(),
  );
}
