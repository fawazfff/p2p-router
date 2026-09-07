import type {
  ActivityItem,
  BinanceAd,
  RouteLabel,
  RouteLeg,
  RouteOption,
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
};

type CandidateRoute = Omit<RouteOption, "labels" | "explanation">;

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
  selections.set(route.id, { ...route, labels: [label], explanation });
}

export function buildRoutes(ads: BinanceAd[], request: RouterRequest): EngineResult {
  const activity: ActivityItem[] = [
    { label: "Goal understood", detail: `${request.tradeType} ${request.cryptoAmount} ${request.asset} with ${request.fiat}`, status: "done" },
    { label: "P2P Skill invoked", detail: "Binance public Agent P2P endpoint", status: "done" },
    { label: "Ads discovered", detail: `${ads.length} live ads returned`, status: ads.length ? "done" : "warning" },
  ];

  if (!ads.length) return { routes: [], activity };

  const amountEligible = ads.filter((ad) => cryptoCapacity(ad) > 0 && cryptoMinimum(ad) <= request.cryptoAmount);
  activity.push({
    label: "Amount filter",
    detail: `${amountEligible.length} ads can accept part or all of this amount`,
    status: amountEligible.length ? "done" : "warning",
  });

  const normalizedPayment = request.paymentMethod.toUpperCase();
  const paymentEligible = normalizedPayment === "ANY"
    ? amountEligible
    : amountEligible.filter((ad) =>
      ad.tradeMethods.some((method) => method.toUpperCase() === normalizedPayment),
    );
  activity.push({
    label: "Payment filter",
    detail: `${paymentEligible.length} ads support the selected method`,
    status: paymentEligible.length ? "done" : "warning",
  });

  const merchantEligible = paymentEligible.filter((ad) =>
    ad.advertiser.monthOrderCount >= 5
    && ad.advertiser.monthFinishRate >= 0.8
    && ad.advertiser.positiveRate >= 0.8,
  );
  activity.push({
    label: "Merchant filter",
    detail: `${merchantEligible.length} ads passed activity and reliability checks`,
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
      evaluated += 1;
      const candidate = buildCandidate(group, request);
      if (candidate) candidates.push(candidate);
    }
  }

  activity.push({
    label: "Route combinations evaluated",
    detail: `${evaluated} combinations checked, up to ${MAX_ROUTE_LEGS} merchants each`,
    status: evaluated ? "done" : "warning",
  });

  if (!candidates.length) {
    activity.push({ label: "Routes found", detail: "No route covers the full amount", status: "warning" });
    return { routes: [], activity };
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
  addLabel(selections, cheapest, "Cheapest", "Uses the strongest available price across the full requested amount.");
  addLabel(selections, balanced, "Balanced", "Balances price, merchant history, completion rate and route simplicity.");
  addLabel(selections, simplest, "Simplest", "Uses the fewest merchants while still covering the full amount.");

  const routes = [...selections.values()]
    .map((route) => ({
      ...route,
      reliabilityScore: Math.floor(route.reliabilityScore * 100),
      routeScore: Math.round(route.routeScore * 100),
    }))
    .sort((left, right) => {
      const order: RouteLabel[] = ["Balanced", "Cheapest", "Simplest"];
      return order.indexOf(left.labels[0]) - order.indexOf(right.labels[0]);
    });

  activity.push({
    label: "Routes found",
    detail: `${routes.length} distinct routes cover the full amount`,
    status: "done",
  });

  return { routes, activity };
}
