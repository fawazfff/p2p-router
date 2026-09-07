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
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ActivityItem, RouteOption, RouterResponse } from "@/lib/p2p-schema";

const markets = [
  { country: "Kenya", fiat: "KES" },
  { country: "Nigeria", fiat: "NGN" },
  { country: "South Africa", fiat: "ZAR" },
  { country: "China", fiat: "CNY" },
  { country: "Argentina", fiat: "ARS" },
  { country: "Brazil", fiat: "BRL" },
  { country: "Colombia", fiat: "COP" },
  { country: "India", fiat: "INR" },
  { country: "Mexico", fiat: "MXN" },
  { country: "Peru", fiat: "PEN" },
  { country: "Turkey", fiat: "TRY" },
  { country: "Vietnam", fiat: "VND" },
];

const loadingLabels = [
  "Goal understood",
  "P2P Skill invoked",
  "Ads discovered",
  "Amount filter",
  "Payment filter",
  "Merchant filter",
  "Route combinations evaluated",
  "Routes found",
];

type PaymentMethod = { identifier: string; name: string };

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function RouteCard({ route, result }: { route: RouteOption; result: Extract<RouterResponse, { ok: true }> }) {
  const primaryLabel = route.labels.join(" + ");
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
            <a href={leg.adUrl} target="_blank" rel="noreferrer" aria-label={`Open ${leg.merchant} ad on Binance`}>
              Open ad <ArrowSquareOut size={16} weight="bold" />
            </a>
          </div>
        ))}
      </div>

      <div className="route-card-foot">
        <span><ShieldCheck size={17} weight="duotone" /> Reliability {route.reliabilityScore}/100</span>
        <span>{primaryLabel} route</span>
      </div>
    </article>
  );
}

function ActivityTimeline({ items, loading, progress }: { items: ActivityItem[]; loading: boolean; progress: number }) {
  const visibleItems = loading
    ? loadingLabels.map((label, index): ActivityItem => ({
      label,
      detail: index < progress ? "Complete" : index === progress ? "Working" : "Waiting",
      status: "done",
    }))
    : items;

  return (
    <div className="activity-panel" aria-live="polite">
      <div className="activity-title"><Sparkle size={18} weight="fill" /><span>Agent activity</span></div>
      <ol>
        {visibleItems.map((item, index) => {
          const isDone = !loading || index < progress;
          const isWorking = loading && index === progress;
          return (
            <li key={item.label} className={`${isDone ? "done" : ""} ${isWorking ? "working" : ""} ${item.status === "warning" ? "warn" : ""}`}>
              <span className="activity-icon">
                {item.status === "warning" && !loading
                  ? <WarningCircle size={16} weight="fill" />
                  : isDone ? <CheckCircle size={16} weight="fill" /> : <span />}
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
  const [methodStatus, setMethodStatus] = useState<"loading" | "available" | "unavailable" | "error">("loading");
  const [prompt, setPrompt] = useState("I want to buy 100 USDT in Kenya with bank transfer");
  const [intentState, setIntentState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [intentMessage, setIntentMessage] = useState("");
  const [result, setResult] = useState<RouterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/methods?fiat=${encodeURIComponent(fiat)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok && data.methods.length) {
          setMethods(data.methods);
          setPaymentMethod((current) => {
            if (data.methods.some((method: PaymentMethod) => method.identifier === current)) return current;
            const bank = data.methods.find((method: PaymentMethod) => method.identifier === "BANK");
            return (bank || data.methods[0]).identifier;
          });
          setMethodStatus("available");
        } else {
          setMethods([{ identifier: "BANK", name: "Bank transfer (requested)" }]);
          setPaymentMethod("BANK");
          setMethodStatus("unavailable");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMethodStatus("error");
      });
    return () => controller.abort();
  }, [fiat]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 1, loadingLabels.length - 1));
    }, 560);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function understandRequest() {
    setIntentState("loading");
    setIntentMessage("");
    try {
      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "The request could not be interpreted.");

      const parsed = data.parsed;
      if (parsed.fiat && markets.some((market) => market.fiat === parsed.fiat.toUpperCase())) {
        setMethodStatus("loading");
        setFiat(parsed.fiat.toUpperCase());
      }
      else if (parsed.country) {
        const market = markets.find((item) => item.country.toLowerCase() === parsed.country.toLowerCase());
        if (market) {
          setMethodStatus("loading");
          setFiat(market.fiat);
        }
      }
      if (parsed.country) setCountry(parsed.country);
      if (parsed.asset) setAsset(parsed.asset.toUpperCase());
      if (parsed.tradeType) setTradeType(parsed.tradeType);
      if (parsed.cryptoAmount) setAmount(String(parsed.cryptoAmount));
      if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod.toUpperCase());
      setIntentState("done");
      setIntentMessage("Request understood. Review the route details below.");
    } catch (error) {
      setIntentState("error");
      setIntentMessage(error instanceof Error ? error.message : "Use the route fields below.");
    }
  }

  async function findRoutes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgress(0);
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          fiat,
          asset,
          tradeType,
          cryptoAmount: Number(amount),
          paymentMethod,
        }),
      });
      const data = await response.json() as RouterResponse;
      setResult(data);
    } catch {
      setResult({
        ok: false,
        code: "UPSTREAM_UNAVAILABLE",
        message: "Live Binance P2P data is unavailable right now. P2P Router did not fall back to mock merchants.",
      });
    } finally {
      setLoading(false);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
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

  return (
    <div id="router" className="router-wrap">
      <form className="router-card" onSubmit={findRoutes}>
        <div className="prompt-row">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
          <label htmlFor="route-prompt" className="sr-only">Describe your P2P route</label>
          <input id="route-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Tell the agent what you need" />
          <button type="button" onClick={understandRequest} disabled={intentState === "loading"}>
            {intentState === "loading" ? "Reading" : "Understand"}
          </button>
        </div>
        {intentMessage && <p className={`intent-message ${intentState}`}>{intentMessage}</p>}

        <div className="trade-toggle" aria-label="Trade direction">
          <button type="button" className={tradeType === "BUY" ? "active" : ""} onClick={() => setTradeType("BUY")}>Buy crypto</button>
          <button type="button" className={tradeType === "SELL" ? "active" : ""} onClick={() => setTradeType("SELL")}>Sell crypto</button>
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
              onChange={(event) => {
                setMethodStatus("loading");
                setFiat(event.target.value.toUpperCase().slice(0, 3));
              }}
              maxLength={3}
              pattern="[A-Z]{3}"
              required
            />
          </label>
          <label>
            <span><ArrowsLeftRight size={17} /> Crypto asset</span>
            <select value={asset} onChange={(event) => setAsset(event.target.value)}>
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
              {methodStatus === "loading" && "Checking Binance payment methods"}
              {methodStatus === "unavailable" && "Binance returned no live payment methods for this fiat."}
              {methodStatus === "error" && "Payment methods could not be refreshed."}
            </small>
          </label>
        </div>

        <div className="form-actions">
          <button className="find-button" type="submit" disabled={loading}>
            {loading ? "Finding complete routes" : "Find my route"}<ArrowRight size={19} weight="bold" />
          </button>
          <button className="example-button" type="button" onClick={useLiveExample}>Reset to live Kenya demo</button>
        </div>
        <div className="source-line"><ShieldCheck size={16} weight="duotone" /><span>Live Binance P2P data. No account or API key required.</span></div>
      </form>

      <div className="route-visual" aria-hidden="true">
        <div className="visual-origin"><span>You</span></div>
        <div className="visual-path path-one"><i /></div>
        <div className="visual-stop stop-one"><span>Merchant</span><strong>Price</strong></div>
        <div className="visual-path path-two"><i /></div>
        <div className="visual-stop stop-two"><span>Merchant</span><strong>Limits</strong></div>
        <div className="visual-path path-three"><i /></div>
        <div className="visual-destination"><CheckCircle size={22} weight="fill" /><span>Full amount covered</span></div>
      </div>

      {(loading || result) && (
        <div className="results" ref={resultRef}>
          <ActivityTimeline items={result && "activity" in result ? result.activity || [] : []} loading={loading} progress={progress} />
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
            <div className="empty-result" role="alert">
              <WarningCircle size={28} weight="fill" />
              <div><h2>No complete live route</h2><p>{result.message}</p><button type="button" onClick={useLiveExample}>Use live Kenya market</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
