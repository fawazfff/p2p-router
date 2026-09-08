import Link from "next/link";
import {
  ArrowRight,
  Bank,
  CheckCircle,
  List,
  Path,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { LandingMotion } from "@/components/landing-motion";
import { RouteProductPreview } from "@/components/route-product-preview";

const faqs = [
  ["Does P2P Router place an order for me?", "No. It plans the route and opens selected Binance P2P ads. You review the current terms and complete each order directly on Binance."],
  ["Where does the merchant data come from?", "Every result comes from Binance's public P2P market data. The app never makes up merchant names, prices, limits or order history."],
  ["Why can one route contain several merchants?", "One ad may not cover your full amount. The router checks combinations of up to three eligible ads, then finds complete routes instead of showing an incomplete best price."],
  ["What happens when Binance data is unavailable?", "The app stops and tells you that live data is unavailable. It does not switch to sample ads or cached merchant results."],
  ["How does the Balanced choice work?", "Fixed code rules weigh price, completed orders, positive feedback and the number of merchants. AI explains the result, but it cannot change the choice."],
  ["Do I need a Binance API key or funded wallet?", "No. The core route search uses public market data. You only need a Binance account when you open an ad and continue on Binance."],
];

function Brand() {
  return <span className="wordmark"><span className="route-mark" aria-hidden="true"><i /><i /><i /></span><span>P2P Router</span></span>;
}

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "P2P Router",
    applicationCategory: "FinanceApplication",
    description: "Find complete routes across live Binance P2P merchants.",
    operatingSystem: "Web",
    url: "/",
  };
  return (
    <main className="landing-page">
      <LandingMotion />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="hero-canvas">
        <div className="landing-window">
          <header className="site-header">
            <div className="shell header-inner">
              <Link href="#top" aria-label="P2P Router home"><Brand /></Link>
              <nav aria-label="Main navigation"><Link className="active" href="#top">Home</Link><Link href="#features">Features</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQ</Link></nav>
              <details className="mobile-menu">
                <summary aria-label="Open navigation"><List size={20} weight="bold" /></summary>
                <div className="mobile-menu-panel"><Link href="#top">Home</Link><Link href="#features">Features</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQ</Link><a href="https://github.com/fawazfff/p2p-router" target="_blank" rel="noreferrer">GitHub</a></div>
              </details>
              <Link className="nav-cta" href="/router">Find a route</Link>
            </div>
          </header>

          <section id="top" className="landing-hero">
            <div className="shell hero-center">
              <p className="hero-badge"><Sparkle size={14} weight="fill" /> Google Maps for Binance P2P</p>
              <h1>Find the best route for your whole P2P amount.</h1>
              <p>Choose a market and amount. Get a complete route across live Binance merchants.</p>
              <div className="hero-actions"><Link className="primary-cta" href="/router">Find a route <ArrowRight size={18} weight="bold" /></Link><Link className="secondary-cta" href="#how-it-works">How it works</Link></div>
            </div>
            <div className="hero-product shell">
              <div className="product-preview preview-back" aria-hidden="true"><div className="preview-back-grid"><i /><i /><i /><i /></div></div>
              <div className="product-preview preview-front"><div className="preview-chrome"><Brand /><span>Product preview</span></div><RouteProductPreview /></div>
            </div>
          </section>
        </div>
      </div>

      <section className="decision-strip" aria-label="How P2P Router makes decisions"><div className="shell decision-line" data-reveal><p><strong>AI</strong> reads what you need</p><p><strong>Binance</strong> supplies live ads</p><p><strong>Code</strong> checks every route</p></div></section>

      <section id="how-it-works" className="landing-section shell how-section"><div className="section-heading" data-reveal><h2>One request. A complete route.</h2><p>A low price does not help when the ad cannot cover your full amount.</p></div><div className="journey-line" data-reveal aria-label="How the route is created">
        <article><span><Sparkle size={20} weight="duotone" /></span><h3>Tell the agent</h3><p>Choose Buy or Sell, your country, crypto amount and payment method.</p></article>
        <article><span><Bank size={20} weight="duotone" /></span><h3>Check live ads</h3><p>Binance supplies current prices, limits, availability and merchant history.</p></article>
        <article><span><SlidersHorizontal size={20} weight="duotone" /></span><h3>Remove bad fits</h3><p>Fixed rules remove ads that do not fit your amount or payment method.</p></article>
        <article><span><Path size={20} weight="duotone" /></span><h3>Choose a route</h3><p>Compare Cheapest, Balanced and Simplest ways to complete the amount.</p></article>
      </div></section>

      <section id="features" className="landing-section feature-stage"><div className="shell feature-layout" data-reveal><div className="feature-focus"><ShieldCheck size={42} weight="duotone" /><h2>Cover the amount you asked for.</h2><p>If one eligible ad is too small, the router can combine up to three merchants.</p><div className="concept-route" aria-hidden="true"><span>You</span><i /><span>Merchant</span><i /><span>Covered</span></div></div><div className="feature-list">
        <article><CheckCircle size={24} weight="fill" /><div><h3>Real market data</h3><p>Prices and merchant information come from Binance at search time.</p></div></article>
        <article><CheckCircle size={24} weight="fill" /><div><h3>Rules you can check</h3><p>Code checks limits, payment methods and merchant history.</p></div></article>
        <article><CheckCircle size={24} weight="fill" /><div><h3>You approve every order</h3><p>The selected ad opens on Binance. P2P Router never releases funds.</p></div></article>
      </div></div></section>

      <section className="landing-section shell choice-section"><div className="section-heading compact-heading" data-reveal><h2>Quick match or complete route?</h2><p>Express is useful when one match is enough. P2P Router checks whether the route covers everything you asked for.</p></div><div className="choice-table" data-reveal><div className="choice-labels" aria-hidden="true"><span>Binance P2P / Express</span><span>P2P Router</span></div><div><p>Shows one available match</p><strong>Plans for your full amount</strong></div><div><p>Leaves you to compare ad limits</p><strong>Checks limits before showing a route</strong></div><div><p>Works with one ad at a time</p><strong>Can combine up to three eligible merchants</strong></div><div><p>Useful for a simple order</p><strong>Useful when one ad may not be enough</strong></div></div><p className="comparison-note" data-reveal>P2P Router plans the route. You still review and complete every order on Binance.</p></section>

      <section id="faq" className="landing-section faq-section"><div className="shell faq-layout"><div className="faq-heading" data-reveal><h2>Questions before you start.</h2><p>The router compares the ads. You choose what to open.</p></div><div className="faq-list" data-reveal>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="final-cta"><div className="shell final-cta-inner" data-reveal><h2>Check the whole route before you trade.</h2><p>Tell the agent what you need. It checks the live market for you.</p><Link className="primary-cta light-cta" href="/router">Find a route <ArrowRight size={18} weight="bold" /></Link></div></section>

      <footer><div className="shell footer-inner"><div><Brand /><p>Route planning for Binance P2P.</p></div><p className="footer-note">Prices and merchant availability can change. Confirm every term on Binance before placing an order.</p></div></footer>
    </main>
  );
}
