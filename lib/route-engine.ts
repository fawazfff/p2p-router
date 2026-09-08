import type {
  ActivityItem,
  BinanceAd,
  RouteLabel,
  RouteLeg,
  RouteOption,
  RouteDiagnostics,
  RouterRequest,
} from "@/lib/p2p-schema";

const MAX_ROUTE_LEGS = 3;
const MAX_CANDIDATE_ADS = 20;
const AMOUNT_PRECISION = 12;

function roundAmount(value: number) {
  return Number(value.toFixed(AMOUNT_PRECISION));
}

type EngineResult = {
  routes: RouteOption[];
  activity: ActivityItem[];
  diagnostics: RouteDiagnostics;
  failureReason?: "NO_ADS" | "AMOUNT" | "PAYMENT" | "MERCHANT" | "CAPACITY";
};

type CandidateRoute = Omit<RouteOption, "labels" | "explanation" | "reasons">;

function cryptoMinimum(ad: BinanceAd) {
  return ad.minTransAmount > 0 ? ad.minTransAmount / ad.price : 0;
}

function cryptoCapacity(ad: BinanceAd) {
  const orderMaximum = ad.maxTransAmount > 0
    ? ad.maxTransAmount / ad.price
    : ad.tradableAmount;
  return Math.min(ad.tradableAmount, orderMaximum);
}

function merchantReliability(ad: BinanceAd) {
  const completion = Math.max(0, Math.min(1, ad.advertiser.monthFinishRate));
  const positive = Math.max(0, Math.min(1, ad.advertiser.positiveRate));
  const experience = Math.min(1, Math.log10(ad.advertiser.monthOrderCount + 1) / 3);
  return completion * 0.48 + positive * 0.34 + experience * 0.18;
}

function combinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, chosen: T[]) {
    if (chosen.length === size) {
      result.push([...chosen]);
      return;
    }
    for (let index = start; index <= items.length - (size - chosen.length); index += 1) {
      chosen.push(items[index]);
      visit(index + 1, chosen);
      chosen.pop();
    }
  }
  visit(0, []);
  return result;
}

function buildCandidate(
  ads: BinanceAd[],
  request: RouterRequest,
): CandidateRoute | null {
  const minimumRequired = ads.reduce((sum, ad) => sum + cryptoMinimum(ad), 0);
  const maximumAvailable = ads.reduce((sum, ad) => sum + cryptoCapacity(ad), 0);

  if (request.cryptoAmount + 1e-9 < minimumRequired) return null;
  if (request.cryptoAmount - 1e-9 > maximumAvailable) return null;

  const allocations = ads.map((ad) => ({ ad, amount: cryptoMinimum(ad) }));
  let remaining = request.cryptoAmount - minimumRequired;

  allocations
    .sort((left, right) =>
      request.tradeType === "BUY"
        ? left.ad.price - right.ad.price
        : right.ad.price - left.ad.price,
    )
    .forEach((allocation) => {
      if (remaining <= 0) return;
      const extraCapacity = cryptoCapacity(allocation.ad) - allocation.amount;
      const extra = Math.min(extraCapacity, remaining);
      allocation.amount += extra;
      remaining -= extra;
    });

  if (remaining > 1e-7) return null;

  const fundedAllocations = allocations.filter((allocation) => allocation.amount > 1e-8);
  fundedAllocations.forEach((allocation) => {
    allocation.amount = roundAmount(allocation.amount);
  });

  const roundedTotal = fundedAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const roundingDelta = roundAmount(request.cryptoAmount - roundedTotal);
  const finalAllocation = fundedAllocations.at(-1);
  if (finalAllocation) {
    finalAllocation.amount = roundAmount(finalAllocation.amount + roundingDelta);
    if (
      finalAllocation.amount + 1e-9 < cryptoMinimum(finalAllocation.ad)
      || finalAllocation.amount - 1e-9 > cryptoCapacity(finalAllocation.ad)
    ) return null;
  }

  const legs: RouteLeg[] = fundedAllocations
    .map(({ ad, amount }) => ({
      adNo: ad.adNo,
      merchant: ad.advertiser.nickName,
      cryptoAmount: amount,
      fiatAmount: amount * ad.price,
      price: ad.price,
      paymentMethods: ad.tradeMethods,
      monthOrderCount: ad.advertiser.monthOrderCount,
      monthFinishRate: ad.advertiser.monthFinishRate,
      positiveRate: ad.advertiser.positiveRate,
      payTimeLimit: ad.payTimeLimit,
      adUrl: `https://c2c.binance.com/en/adv?code=${encodeURIComponent(ad.adNo)}`,
    }));

  const fiatTotal = legs.reduce((sum, leg) => sum + leg.fiatAmount, 0);
  const reliabilityScore = allocations.reduce(
    (sum, allocation) => sum + merchantReliability(allocation.ad) * (allocation.amount / request.cryptoAmount),
    0,
  );

  return {
    id: legs.map((leg) => leg.adNo).sort().join("-"),
    legs,
    effectivePrice: fiatTotal / request.cryptoAmount,
    fiatTotal,
    reliabilityScore,
    routeScore: 0,
  };
}

function pickByPrice(routes: CandidateRoute[], tradeType: "BUY" | "SELL") {
  return [...routes].sort((left, right) =>
    tradeType === "BUY"
      ? left.fiatTotal - right.fiatTotal
      : right.fiatTotal - left.fiatTotal,
  )[0];
}

function addLabel(
  selections: Map<string, RouteOption>,
  route: CandidateRoute,
  label: RouteLabel,
  explanation: string,
) {
  const existing = selections.get(route.id);
  if (existing) {
    existing.labels.push(label);
    if (!existing.explanation.includes(explanation)) {
      existing.explanation = `${existing.explanation} ${explanation}`;
    }
    return;
  }
  selections.set(route.id, { ...route, labels: [label], explanation, reasons: [] });
}

export function buildRoutes(ads: BinanceAd[], request: RouterRequest): EngineResult {
  const activity: ActivityItem[] = [
    { label: "Request read", detail: `${request.tradeType} ${request.cryptoAmount} ${request.asset} with ${request.fiat}`, status: "done" },
    { label: "P2P Skill opened", detail: "Connected to Binance public market data", status: "done" },
    { label: "Live ads checked", detail: `${ads.length} ads returned by Binance`, status: ads.length ? "done" : "warning" },
  ];

  const diagnostics: RouteDiagnostics = {
    adsFound: ads.length,
    amountEligible: 0,
    paymentEligible: 0,
    merchantEligible: 0,
    combinationsEvaluated: 0,
  };

  if (!ads.length) return { routes: [], activity, diagnostics, failureReason: "NO_ADS" };

  const amountEligible = ads.filter((ad) => cryptoCapacity(ad) > 0 && cryptoMinimum(ad) <= request.cryptoAmount);
  diagnostics.amountEligible = amountEligible.length;
  activity.push({
    label: "Amount checked",
    detail: `${amountEligible.length} ads fit part or all of your amount`,
    status: amountEligible.length ? "done" : "warning",
  });

  const normalizedPayment = request.paymentMethod.toUpperCase();
  const paymentEligible = normalizedPayment === "ANY"
    ? amountEligible
    : amountEligible.filter((ad) =>
      ad.tradeMethods.some((method) => method.toUpperCase() === normalizedPayment),
    );
  diagnostics.paymentEligible = paymentEligible.length;
  activity.push({
    label: "Payment matched",
    detail: `${paymentEligible.length} ads use the selected method`,
    status: paymentEligible.length ? "done" : "warning",
  });

  const merchantEligible = paymentEligible.filter((ad) =>
    ad.advertiser.monthOrderCount >= 5
    && ad.advertiser.monthFinishRate >= 0.8
    && ad.advertiser.positiveRate >= 0.8,
  );
  diagnostics.merchantEligible = merchantEligible.length;
  activity.push({
    label: "Merchant history checked",
    detail: `${merchantEligible.length} ads passed the order and completion checks`,
    status: merchantEligible.length ? "done" : "warning",
  });

  const sortedCandidates = [...merchantEligible]
    .sort((left, right) =>
      request.tradeType === "BUY" ? left.price - right.price : right.price - left.price,
    )
    .slice(0, MAX_CANDIDATE_ADS);

  const candidates: CandidateRoute[] = [];
  let evaluated = 0;
  for (let size = 1; size <= Math.min(MAX_ROUTE_LEGS, sortedCandidates.length); size += 1) {
    for (const group of combinations(sortedCandidates, size)) {
      if (new Set(group.map((ad) => ad.advertiser.nickName)).size !== group.length) continue;
      evaluated += 1;
      const candidate = buildCandidate(group, request);
      if (candidate) candidates.push(candidate);
    }
  }
  diagnostics.combinationsEvaluated = evaluated;

  activity.push({
    label: "Complete routes compared",
    detail: `${evaluated} combinations checked, using up to ${MAX_ROUTE_LEGS} merchants`,
    status: evaluated ? "done" : "warning",
  });

  if (!candidates.length) {
    activity.push({ label: "Full amount checked", detail: "No route covers the full amount", status: "warning" });
    const failureReason = amountEligible.length === 0
      ? "AMOUNT"
      : paymentEligible.length === 0
        ? "PAYMENT"
        : merchantEligible.length === 0
          ? "MERCHANT"
          : "CAPACITY";
    return { routes: [], activity, diagnostics, failureReason };
  }

  const prices = candidates.map((route) => route.effectivePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpread = Math.max(maxPrice - minPrice, 1e-9);

  candidates.forEach((route) => {
    const costScore = request.tradeType === "BUY"
      ? 1 - (route.effectivePrice - minPrice) / priceSpread
      : (route.effectivePrice - minPrice) / priceSpread;
    const simplicityScore = 1 - (route.legs.length - 1) / MAX_ROUTE_LEGS;
    route.routeScore = costScore * 0.46 + route.reliabilityScore * 0.39 + simplicityScore * 0.15;
  });

  const cheapest = pickByPrice(candidates, request.tradeType);
  const simplest = [...candidates].sort((left, right) => {
    if (left.legs.length !== right.legs.length) return left.legs.length - right.legs.length;
    return request.tradeType === "BUY"
      ? left.fiatTotal - right.fiatTotal
      : right.fiatTotal - left.fiatTotal;
  })[0];
  const balanced = [...candidates].sort((left, right) => right.routeScore - left.routeScore)[0];

  const selections = new Map<string, RouteOption>();
  addLabel(selections, cheapest, "Cheapest", "Has the lowest total for the full amount.");
  addLabel(selections, balanced, "Balanced", "Combines price, merchant history and fewer handoffs.");
  addLabel(selections, simplest, "Simplest", "Uses the fewest merchants that can cover the full amount.");

  const routes = [...selections.values()]
    .map((route) => ({
      ...route,
      reliabilityScore: Math.floor(route.reliabilityScore * 100),
      routeScore: Math.round(route.routeScore * 100),
      reasons: [
        route.explanation,
        `${route.legs.length === 1 ? "One merchant covers" : `${route.legs.length} merchants cover`} all ${request.cryptoAmount} ${request.asset}.`,
        `The route passed price, amount, payment and merchant checks.`,
      ],
    }))
    .sort((left, right) => {
      const order: RouteLabel[] = ["Balanced", "Cheapest", "Simplest"];
      return order.indexOf(left.labels[0]) - order.indexOf(right.labels[0]);
    });

  activity.push({
    label: "Full routes found",
    detail: `${routes.length} distinct routes cover the full amount`,
    status: "done",
  });

  return { routes, activity, diagnostics };
}
