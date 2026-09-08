import { z } from "zod";

export const tradeTypeSchema = z.enum(["BUY", "SELL"]);

export const routerRequestSchema = z.object({
  country: z.string().trim().min(2).max(80),
  fiat: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  asset: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/),
  tradeType: tradeTypeSchema,
  cryptoAmount: z.coerce.number().positive().max(10_000_000),
  paymentMethod: z.string().trim().min(1).max(80),
});

export type RouterRequest = z.infer<typeof routerRequestSchema>;

export type BinanceAdvertiser = {
  nickName: string;
  userType: string;
  monthOrderCount: number;
  monthFinishRate: number;
  positiveRate: number;
  merchantGroupMember: boolean;
};

export type BinanceAd = {
  adNo: string;
  price: number;
  fiat: string;
  fiatSymbol: string;
  asset: string;
  minTransAmount: number;
  maxTransAmount: number;
  tradableAmount: number;
  payTimeLimit: number;
  tradeMethods: string[];
  advertiser: BinanceAdvertiser;
};

export type RouteLeg = {
  adNo: string;
  merchant: string;
  cryptoAmount: number;
  fiatAmount: number;
  price: number;
  paymentMethods: string[];
  monthOrderCount: number;
  monthFinishRate: number;
  positiveRate: number;
  payTimeLimit: number;
  adUrl: string;
};

export type RouteLabel = "Cheapest" | "Balanced" | "Simplest";

export type RouteOption = {
  id: string;
  labels: RouteLabel[];
  legs: RouteLeg[];
  effectivePrice: number;
  fiatTotal: number;
  reliabilityScore: number;
  routeScore: number;
  explanation: string;
  reasons: string[];
};

export type RouteDiagnostics = {
  adsFound: number;
  amountEligible: number;
  paymentEligible: number;
  merchantEligible: number;
  combinationsEvaluated: number;
};

export type SuggestedPaymentMethod = {
  identifier: string;
  name: string;
};

export type ActivityItem = {
  label: string;
  detail: string;
  status: "done" | "warning";
};

export type RouterSuccess = {
  ok: true;
  request: RouterRequest;
  source: "Binance P2P public market data";
  fetchedAt: string;
  routes: RouteOption[];
  activity: ActivityItem[];
  explanation?: {
    headline: string;
    summary: string;
    watchFor: string;
    source: "openai" | "deterministic";
  };
};

export type RouterFailure = {
  ok: false;
  code: "NO_ADS" | "NO_ROUTE" | "PAYMENT_UNAVAILABLE" | "UPSTREAM_UNAVAILABLE" | "INVALID_REQUEST";
  message: string;
  activity?: ActivityItem[];
  diagnostics?: RouteDiagnostics;
  suggestedMethods?: SuggestedPaymentMethod[];
};

export type RouterResponse = RouterSuccess | RouterFailure;
