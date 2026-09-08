"use client";

import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsLeftRight,
  Bank,
  CheckCircle,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapPinLine,
  Path,
  PaperPlaneTilt,
  Robot,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ActivityItem, PartialRoute, RouteOption, RouterResponse } from "@/lib/p2p-schema";

const markets = [
  { country: "Kenya", fiat: "KES" },
  { country: "South Africa", fiat: "ZAR" },
  { country: "China", fiat: "CNY" },
  { country: "Argentina", fiat: "ARS" },
  { country: "Colombia", fiat: "COP" },
  { country: "India", fiat: "INR" },
  { country: "Mexico", fiat: "MXN" },
  { country: "Peru", fiat: "PEN" },
  { country: "Turkey", fiat: "TRY" },
  { country: "Vietnam", fiat: "VND" },
];

const unavailableMarkets = new Set(["NIGERIA", "NGN", "BRAZIL", "BRL"]);

function loadingItems(tradeType: "BUY" | "SELL"): ActivityItem[] {
  const people = tradeType === "BUY" ? "sellers" : "buyers";
  return [
    { label: "Reading your request", detail: "Country, amount and payment method", status: "done" },
    { label: "Opening the P2P Skill", detail: "Connecting to Binance public data", status: "done" },
    { label: `Looking for live ${people}`, detail: "Reading the current ad list", status: "done" },
    { label: "Matching payment methods", detail: "Keeping ads you can use", status: "done" },
    { label: "Checking your amount", detail: "Comparing each ad's minimum and limit", status: "done" },
    { label: "Checking merchant history", detail: "Looking at orders and completion rates", status: "done" },
    { label: "Comparing complete routes", detail: "Testing one, two and three merchants", status: "done" },
    { label: "Preparing your choices", detail: "Cheapest, Balanced and Simplest", status: "done" },
  ];
}

type PaymentMethod = { identifier: string; name: string };
type RouteSearchInput = {
  country: string;
  fiat: string;
  asset: string;
  tradeType: "BUY" | "SELL";
  cryptoAmount: number;
  paymentMethod: string;
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickLiveMethod(methods: PaymentMethod[], requested?: string | null) {
  if (!methods.length) return "ANY";
  if (requested) {
    const wanted = normalized(requested);
    const exact = methods.find((method) =>
      normalized(method.identifier) === wanted || normalized(method.name) === wanted,
    );
    if (exact) return exact.identifier;
    if (wanted.includes("bank")) {
      const bank = methods.find((method) => normalized(method.name).includes("bank"));
      if (bank) return bank.identifier;
    }
  }
  return methods.find((method) => method.identifier === "BANK")?.identifier || methods[0].identifier;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function RouteCard({ route, result }: { route: RouteOption; result: Extract<RouterResponse, { ok: true }> }) {
  const primaryLabel = route.labels.join(" + ");
  const orderCount = route.legs.reduce((sum, leg) => sum + leg.monthOrderCount, 0);
  const averageCompletion = route.legs.reduce((sum, leg) => sum + leg.monthFinishRate, 0) / route.legs.length;
  return (
    <article className={`route-card ${route.labels.includes("Balanced") ? "recommended" : ""}`}>
      <div className="route-card-head">
        <div>
          <div className="route-labels">
            {route.labels.map((label) => <span key={label}>{label}</span>)}
          </div>
          <h3>{route.legs.length} {route.legs.length === 1 ? "merchant" : "merchants"}</h3>
        </div>
        {route.labels.includes("Balanced") && <span className="recommendation">Best balance</span>}
      </div>

      <div className="route-total">
        <span>{result.request.tradeType === "BUY" ? "You pay" : "You receive"}</span>
        <strong>{formatNumber(route.fiatTotal)} {result.request.fiat}</strong>
        <small>Average price {formatNumber(route.effectivePrice, 6)} {result.request.fiat}</small>
      </div>

      <div className="route-legs">
        {route.legs.map((leg, index) => (
          <div className="route-leg" key={leg.adNo}>
            <div className="leg-index">{index + 1}</div>
            <div className="leg-main">
              <strong>{leg.merchant}</strong>
              <span>{formatNumber(leg.cryptoAmount, 6)} {result.request.asset} at {formatNumber(leg.price, 6)} {result.request.fiat}</span>
              <small>{leg.monthOrderCount} orders, {formatPercent(leg.monthFinishRate)} completed</small>
            </div>
            <a className="open-ad-button" href={leg.adUrl} target="_blank" rel="noreferrer" aria-label={`Open ${leg.merchant} ad on Binance`}>
              Open on Binance <ArrowSquareOut size={17} weight="bold" />
            </a>
          </div>
        ))}
      </div>

      <details className="route-why">
        <summary>Why this route?<span aria-hidden="true">+</span></summary>
        <ul>
          {route.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          <li>{formatNumber(orderCount, 0)} recent orders across the route, with an average {formatPercent(averageCompletion)} completion rate.</li>
        </ul>
      </details>

      <div className="route-card-foot">
        <span><ShieldCheck size={17} weight="duotone" /> Reliability {route.reliabilityScore}/100</span>
        <span>{primaryLabel} route</span>
      </div>
    </article>
  );
}

function PartialRouteCard({
  route,
  asset,
  fiat,
  requestedAmount,
  tradeType,
  onUseAmount,
}: {
  route: PartialRoute;
  asset: string;
  fiat: string;
  requestedAmount: number;
  tradeType: "BUY" | "SELL";
  onUseAmount: (amount: number) => void;
}) {
  return (
    <section className="partial-route-card">
      <div className="partial-route-head">
        <div><span>Available now</span><h2>{formatNumber(route.coveredAmount, 6)} of {formatNumber(requestedAmount, 6)} {asset}</h2></div>
        <strong>{formatNumber(route.missingAmount, 6)} {asset} still needed</strong>
      </div>
      <p>This route is real, but it only covers part of your request. You can use the covered amount or try again later.</p>
      <div className="route-total partial-total">
        <span>{tradeType === "BUY" ? "You pay for the covered amount" : "You receive for the covered amount"}</span>
        <strong>{formatNumber(route.fiatTotal)} {fiat}</strong>
        <small>Average price {formatNumber(route.effectivePrice, 6)} {fiat}</small>
      </div>
      <div className="route-legs">
        {route.legs.map((leg, index) => (
          <div className="route-leg" key={leg.adNo}>
            <div className="leg-index">{index + 1}</div>
            <div className="leg-main">
              <strong>{leg.merchant}</strong>
              <span>{formatNumber(leg.cryptoAmount, 6)} {asset} at {formatNumber(leg.price, 6)} {fiat}</span>
              <small>{leg.monthOrderCount} orders, {formatPercent(leg.monthFinishRate)} completed</small>
            </div>
            <a className="open-ad-button" href={leg.adUrl} target="_blank" rel="noreferrer" aria-label={`Open ${leg.merchant} ad on Binance`}>
              Open on Binance <ArrowSquareOut size={17} weight="bold" />
            </a>
          </div>
        ))}
      </div>
      <details className="route-why">
        <summary>Why this partial route?<span aria-hidden="true">+</span></summary>
        <ul>{route.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      </details>
      <button className="use-partial-button" type="button" onClick={() => onUseAmount(route.coveredAmount)}>Set amount to {formatNumber(route.coveredAmount, 6)} {asset}</button>
    </section>
  );
}

function ActivityTimeline({ items, loading, progress, tradeType }: { items: ActivityItem[]; loading: boolean; progress: number; tradeType: "BUY" | "SELL" }) {
  const visibleItems = loading
    ? loadingItems(tradeType)
    : items;

  return (
    <div className={`activity-panel ${loading ? "is-searching" : "is-finished"}`} aria-live="polite">
      <div className="activity-title"><Sparkle size={18} weight="fill" /><span>{loading ? "Building your route" : "Route check"}</span>{loading && <i className="activity-live">Live</i>}</div>
      {loading && <div className="activity-progress" aria-hidden="true"><i style={{ width: `${((progress + 1) / visibleItems.length) * 100}%` }} /></div>}
      <ol>
        {visibleItems.map((item, index) => {
          const isDone = !loading || index < progress;
          const isWorking = loading && index === progress;
          return (
            <li key={item.label} className={`${isDone ? "done" : ""} ${isWorking ? "working" : ""} ${item.status === "warning" ? "warn" : ""}`}>
              <span className="activity-icon">
                {item.status === "warning" && !loading
                  ? <WarningCircle size={16} weight="fill" />
                  : isDone ? <CheckCircle size={16} weight="fill" /> : isWorking ? <MagnifyingGlass size={12} weight="bold" /> : <span />}
              </span>
              <div><strong>{item.label}</strong><small>{item.detail}</small></div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RouterExperience() {
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [country, setCountry] = useState("Kenya");
  const [fiat, setFiat] = useState("KES");
  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState("BANK");
  const [methods, setMethods] = useState<PaymentMethod[]>([{ identifier: "BANK", name: "Bank transfer" }]);
  const [methodStatus, setMethodStatus] = useState<"loading" | "available" | "no_ads" | "unavailable" | "error">("loading");
  const [prompt, setPrompt] = useState("I want to buy 100 USDT in Kenya with bank transfer");
  const [intentState, setIntentState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [intentMessage, setIntentMessage] = useState("");
  const [result, setResult] = useState<RouterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/methods?fiat=${encodeURIComponent(fiat)}&asset=${encodeURIComponent(asset)}&tradeType=${tradeType}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok && data.methods.length) {
          setMethods(data.methods as PaymentMethod[]);
          setPaymentMethod((current) => {
            if (data.methods.some((method: PaymentMethod) => method.identifier === current)) return current;
            const bank = data.methods.find((method: PaymentMethod) => method.identifier === "BANK");
            return (bank || data.methods[0]).identifier;
          });
          setMethodStatus("available");
        } else if (data.ok && data.registeredMethods?.length) {
          setMethods(data.registeredMethods as PaymentMethod[]);
          setPaymentMethod(data.registeredMethods[0].identifier);
          setMethodStatus("no_ads");
        } else {
          setMethods([{ identifier: "ANY", name: "Any live payment method" }]);
          setPaymentMethod("ANY");
          setMethodStatus("unavailable");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMethods([{ identifier: "ANY", name: "Any live payment method" }]);
        setPaymentMethod("ANY");
        setMethodStatus("error");
      });
    return () => controller.abort();
  }, [fiat, asset, tradeType]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 1, loadingItems(tradeType).length - 1));
    }, 620);
    return () => window.clearInterval(timer);
  }, [loading, tradeType]);

  async function runRouteSearch(input: RouteSearchInput) {
    setProgress(0);
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json() as RouterResponse;
      setResult(data);
    } catch {
      setResult({
        ok: false,
        code: "UPSTREAM_UNAVAILABLE",
        message: "Binance live data is not responding. No sample sellers were used.",
      });
    } finally {
      setLoading(false);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  async function runAgentInstruction() {
    setIntentState("loading");
    setIntentMessage("");
    try {
      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "I could not read that request.");

      const parsed = data.parsed;
      const requestedMarket = parsed.fiat?.toUpperCase() || parsed.country?.toUpperCase();
      if (requestedMarket && unavailableMarkets.has(requestedMarket)) {
        throw new Error("Binance currently returns no live USDT market for that country. Choose a country shown in the route details.");
      }
      const parsedMarket = markets.find((market) =>
        market.fiat === parsed.fiat?.toUpperCase()
        || market.country.toLowerCase() === parsed.country?.toLowerCase(),
      );
      if ((parsed.fiat || parsed.country) && !parsedMarket) {
        throw new Error("That market is not in the live-checked country list. Choose one of the countries below.");
      }

      const nextCountry = parsedMarket?.country || country;
      const nextFiat = parsedMarket?.fiat || fiat;
      const nextAsset = parsed.asset?.toUpperCase() || asset;
      const nextTradeType = parsed.tradeType || tradeType;
      const nextAmount = parsed.cryptoAmount || Number(amount);
      const methodsResponse = await fetch(`/api/methods?fiat=${encodeURIComponent(nextFiat)}&asset=${encodeURIComponent(nextAsset)}&tradeType=${nextTradeType}`);
      const methodsData = await methodsResponse.json();
      const liveMethods = methodsData.ok ? methodsData.methods as PaymentMethod[] : [];
      const nextPaymentMethod = pickLiveMethod(liveMethods, parsed.paymentMethod);

      setMethodStatus(liveMethods.length ? "available" : "unavailable");
      setMethods(liveMethods.length ? liveMethods : [{ identifier: "ANY", name: "Any live payment method" }]);
      setCountry(nextCountry);
      setFiat(nextFiat);
      setAsset(nextAsset);
      setTradeType(nextTradeType);
      setAmount(String(nextAmount));
      setPaymentMethod(nextPaymentMethod);
      setIntentState("done");
      setIntentMessage(`I read: ${nextTradeType === "BUY" ? "Buy" : "Sell"} ${nextAmount} ${nextAsset} in ${nextCountry}. I am checking Binance now.`);
      await runRouteSearch({
        country: nextCountry,
        fiat: nextFiat,
        asset: nextAsset,
        tradeType: nextTradeType,
        cryptoAmount: nextAmount,
        paymentMethod: nextPaymentMethod,
      });
    } catch (error) {
      setIntentState("error");
      setIntentMessage(error instanceof Error ? error.message : "Use the route details below.");
    }
  }

  async function findRoutes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runRouteSearch({ country, fiat, asset, tradeType, cryptoAmount: Number(amount), paymentMethod });
  }

  function useLiveExample() {
    setMethodStatus("loading");
    setCountry("Kenya");
    setFiat("KES");
    setAsset("USDT");
    setTradeType("BUY");
    setAmount("100");
    setPaymentMethod("BANK");
    setPrompt("I want to buy 100 USDT in Kenya with bank transfer");
    setResult(null);
  }

  function tryPaymentMethod(method: PaymentMethod) {
    setPaymentMethod(method.identifier);
    setResult(null);
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(".find-button")?.focus(), 50);
  }

  function tryAmount(nextAmount: number) {
    setAmount(String(nextAmount));
    setResult(null);
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(".find-button")?.focus(), 50);
  }

  const visualState = loading
    ? "searching"
    : result?.ok
      ? "covered"
      : result?.partialRoute
        ? "partial"
        : result
          ? "unavailable"
          : "idle";

  return (
    <div id="router" className="router-wrap">
      <form className="router-card" onSubmit={findRoutes}>
        <div className="agent-command-layout">
          <div className="agent-command-box">
            <div className="agent-command-head">
              <span><Robot size={20} weight="duotone" /> P2P route agent</span>
              <i className={intentState === "loading" || loading ? "working" : intentState === "done" ? "done" : "ready"}>
                {intentState === "loading" || loading ? "Working" : intentState === "done" ? "Done" : "Ready"}
              </i>
            </div>
            <label htmlFor="route-prompt">Tell the agent what you want to do</label>
            <textarea
              id="route-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: I want to buy 100 USDT in India with UPI"
              rows={4}
            />
            <button className="agent-run-button" type="button" onClick={runAgentInstruction} disabled={intentState === "loading" || loading}>
              {intentState === "loading" || loading ? "Checking live ads" : "Find routes"}<PaperPlaneTilt size={18} weight="fill" />
            </button>
          </div>
          <aside className="agent-goal-card">
            <span>Agent goal</span>
            <h2>Cover your full crypto amount.</h2>
            <p>The agent reads your request, checks live Binance ads, and compares routes you can open.</p>
            <ol>
              <li><CheckCircle size={15} weight="fill" /> Read what you need</li>
              <li><CheckCircle size={15} weight="fill" /> Check price, limits and payment</li>
              <li><CheckCircle size={15} weight="fill" /> Show what can be completed now</li>
            </ol>
          </aside>
        </div>
        {intentMessage && <p className={`intent-message ${intentState}`}>{intentMessage}</p>}

        <div className="manual-heading"><span>Route details</span><small>You can change any detail before searching.</small></div>

        <div className="trade-toggle" aria-label="Trade direction">
          <button type="button" className={tradeType === "BUY" ? "active" : ""} onClick={() => { setMethodStatus("loading"); setTradeType("BUY"); }}>Buy crypto</button>
          <button type="button" className={tradeType === "SELL" ? "active" : ""} onClick={() => { setMethodStatus("loading"); setTradeType("SELL"); }}>Sell crypto</button>
        </div>

        <div className="route-fields">
          <label>
            <span><GlobeHemisphereWest size={17} /> Country</span>
            <select
              value={country}
              onChange={(event) => {
                const nextCountry = event.target.value;
                setCountry(nextCountry);
                const market = markets.find((item) => item.country.toLowerCase() === nextCountry.toLowerCase());
                if (market) {
                  setMethodStatus("loading");
                  setFiat(market.fiat);
                }
              }}
            >
              {markets.map((market) => (
                <option key={market.fiat} value={market.country}>{market.country} ({market.fiat})</option>
              ))}
            </select>
          </label>
          <label>
            <span><MapPinLine size={17} /> Fiat currency</span>
            <input
              value={fiat}
              readOnly
              required
            />
          </label>
          <label>
            <span><ArrowsLeftRight size={17} /> Crypto asset</span>
            <select value={asset} onChange={(event) => { setMethodStatus("loading"); setAsset(event.target.value); }}>
              {["USDT", "BTC", "ETH", "BNB"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span><Path size={17} /> Crypto amount</span>
            <input type="number" inputMode="decimal" min="0.000001" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label className="payment-field">
            <span><Bank size={17} /> Payment method</span>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {methods.map((method) => <option key={method.identifier} value={method.identifier}>{method.name}</option>)}
            </select>
            <small className={`method-note ${methodStatus}`}>
              {methodStatus === "loading" && "Checking live ads and payment methods"}
              {methodStatus === "available" && "Only methods found on current live ads are shown."}
              {methodStatus === "no_ads" && `Binance lists these methods, but has no live ${asset} ${tradeType === "BUY" ? "sell" : "buy"} ads right now.`}
              {methodStatus === "unavailable" && "Binance currently lists no payment methods for this currency."}
              {methodStatus === "error" && "Payment methods could not be refreshed."}
            </small>
          </label>
        </div>

        <div className="form-actions">
          <button className="find-button" type="submit" disabled={loading || !paymentMethod}>
            {loading ? "Building your route" : "Find my route"}<ArrowRight size={19} weight="bold" />
          </button>
          <button className="example-button" type="button" onClick={useLiveExample}>Reset to live Kenya demo</button>
        </div>
        <div className="source-line"><ShieldCheck size={16} weight="duotone" /><span>Live Binance P2P data. No account or API key required.</span></div>
      </form>

      <div className={`route-visual ${visualState}`} aria-hidden="true">
        <div className="visual-origin"><span>You</span></div>
        <div className="visual-path path-one"><i /></div>
        <div className="visual-stop stop-one"><span>{loading ? "Checking" : "Merchant"}</span><strong>Price</strong></div>
        <div className="visual-path path-two"><i /></div>
        <div className="visual-stop stop-two"><span>{loading ? "Checking" : "Merchant"}</span><strong>Limits</strong></div>
        <div className="visual-path path-three"><i /></div>
        <div className="visual-destination">
          {visualState === "unavailable" || visualState === "partial" ? <WarningCircle size={22} weight="fill" /> : <CheckCircle size={22} weight="fill" />}
          <span>
            {visualState === "searching" && "Checking live routes"}
            {visualState === "covered" && "Full amount covered"}
            {visualState === "partial" && "Part of the amount is available"}
            {visualState === "unavailable" && "Change the route details"}
            {visualState === "idle" && "Your route result appears here"}
          </span>
        </div>
      </div>

      {(loading || result) && (
        <div className="results" ref={resultRef}>
          <ActivityTimeline items={result && "activity" in result ? result.activity || [] : []} loading={loading} progress={progress} tradeType={tradeType} />
          {!loading && result?.ok && (
            <div className="route-results">
              <div className="result-heading">
                <div><span>Live result</span><h2>{result.explanation?.headline || "Complete routes found"}</h2></div>
                <p>{result.explanation?.summary}</p>
              </div>
              <div className="result-meta">
                <span><CheckCircle size={17} weight="fill" /> {result.routes.length} distinct routes</span>
                <span>Source: {result.source}</span>
                <span>Checked {new Date(result.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="route-cards">
                {result.routes.map((route) => <RouteCard route={route} result={result} key={route.id} />)}
              </div>
              <div className="watch-note"><WarningCircle size={20} weight="fill" /><p><strong>Before you continue</strong>{result.explanation?.watchFor}</p></div>
            </div>
          )}
          {!loading && result && !result.ok && (
            <div className="failure-results" role="alert">
              {result.partialRoute ? <PartialRouteCard route={result.partialRoute} asset={asset} fiat={fiat} requestedAmount={Number(amount)} tradeType={tradeType} onUseAmount={tryAmount} /> : null}
              <div className={`empty-result ${result.partialRoute ? "compact" : ""}`}>
                <WarningCircle size={28} weight="fill" />
                <div><h2>{result.partialRoute ? "The rest is not covered" : "No complete route yet"}</h2><p>{result.message}</p>
                  {result.suggestedAmount ? <div className="suggested-amount"><button type="button" onClick={() => tryAmount(result.suggestedAmount as number)}>Set amount to {formatNumber(result.suggestedAmount, 6)} {asset}</button><span>This is the smallest eligible amount found now.</span></div> : null}
                  {result.suggestedMethods?.length ? <div className="suggested-methods"><strong>Try a payment method used by live ads</strong><div>{result.suggestedMethods.map((method) => <button type="button" key={method.identifier} onClick={() => tryPaymentMethod(method)}>{method.name}</button>)}</div></div> : null}
                  {!result.partialRoute && !result.suggestedAmount ? <button className="kenya-button" type="button" onClick={useLiveExample}>Switch to the Kenya demo</button> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
