import Image from "next/image";
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

const faqs = [
  ["Does P2P Router place an order for me?", "No. It plans the route and opens selected Binance P2P ads. You review the current terms and complete each order directly on Binance."],
  ["Where does the merchant data come from?", "Every result comes from Binance's public Agent P2P endpoints through the official P2P Skill workflow. Merchant names, prices, limits and history are never invented."],
  ["Why can one route contain several merchants?", "One ad may not cover your full amount. The router checks combinations of up to three eligible ads, then finds complete routes instead of showing an incomplete best price."],
  ["What happens when Binance data is unavailable?", "The app stops and tells you that live data is unavailable. It does not switch to sample ads or cached merchant results."],
  ["How are Balanced routes scored?", "Deterministic code combines effective price, completion rate, positive feedback, recent order count and the number of merchants. OpenAI explains the result but cannot change the route math."],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="#top" aria-label="P2P Router home"><Brand /></Link>
          <nav aria-label="Main navigation"><Link href="#features">Features</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQ</Link><a href="https://github.com/fawazfff/p2p-router" target="_blank" rel="noreferrer">GitHub</a></nav>
          <details className="mobile-menu">
            <summary aria-label="Open navigation"><List size={20} weight="bold" /></summary>
            <div className="mobile-menu-panel"><Link href="#features">Features</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQ</Link><a href="https://github.com/fawazfff/p2p-router" target="_blank" rel="noreferrer">GitHub</a></div>
          </details>
          <Link className="nav-cta" href="/router">Find a route</Link>
        </div>
      </header>

      <section id="top" className="landing-hero">
        <div className="shell hero-center">
          <p className="hero-badge"><Sparkle size={14} weight="fill" /> Google Maps for Binance P2P</p>
          <h1>Find the best route for your <span>whole P2P amount.</span></h1>
          <p>Choose your market and amount. Get complete routes across live Binance P2P merchants.</p>
          <div className="hero-actions"><Link className="primary-cta" href="/router">Find a route <ArrowRight size={18} weight="bold" /></Link><Link className="secondary-cta" href="#how-it-works">See how it works</Link></div>
        </div>
        <div className="hero-visual shell"><Image src="/images/p2p-route-hero.webp" alt="A route connecting one P2P request to several verified merchants" width={1672} height={941} priority sizes="(max-width: 760px) 100vw, 1180px" /></div>
      </section>

      <section className="decision-strip" aria-label="How P2P Router makes decisions"><div className="shell decision-line"><p><strong>AI</strong> understands the request</p><p><strong>Binance</strong> provides live market data</p><p><strong>Code</strong> decides the routes</p></div></section>

      <section id="how-it-works" className="landing-section shell how-section"><div className="section-heading"><h2>One request. A complete route.</h2><p>A low price means nothing if the ad cannot cover what you actually need.</p></div><div className="journey-line" aria-label="How the route is created">
        <article><span><Sparkle size={20} weight="duotone" /></span><h3>Tell the agent</h3><p>Choose Buy or Sell, your country, crypto amount and payment method.</p></article>
        <article><span><Bank size={20} weight="duotone" /></span><h3>Check live ads</h3><p>Binance supplies current prices, limits, availability and merchant history.</p></article>
        <article><span><SlidersHorizontal size={20} weight="duotone" /></span><h3>Filter the market</h3><p>Deterministic checks remove ads that do not fit the full request.</p></article>
        <article><span><Path size={20} weight="duotone" /></span><h3>Choose a route</h3><p>Compare Cheapest, Balanced and Simplest ways to complete the amount.</p></article>
      </div></section>

      <section id="features" className="landing-section feature-stage"><div className="shell feature-layout"><div className="feature-focus"><ShieldCheck size={42} weight="duotone" /><h2>Your full amount comes first.</h2><p>The router can combine several eligible merchants when one ad is not enough.</p><div className="concept-route" aria-hidden="true"><span>You</span><i /><span>Merchant</span><i /><span>Covered</span></div></div><div className="feature-list">
        <article><CheckCircle size={24} weight="fill" /><div><h3>Real market data</h3><p>Prices and merchant information come from Binance at search time.</p></div></article>
        <article><CheckCircle size={24} weight="fill" /><div><h3>Defensible route math</h3><p>Code checks limits, payment compatibility and merchant reliability.</p></div></article>
        <article><CheckCircle size={24} weight="fill" /><div><h3>You approve every order</h3><p>The selected ad opens on Binance. P2P Router never releases funds.</p></div></article>
      </div></div></section>

      <section className="landing-section shell choice-section"><div className="section-heading compact-heading"><h2>Not another list of ads.</h2><p>Every result is a plan for the amount you entered.</p></div><div className="choice-table"><div className="choice-labels" aria-hidden="true"><span>Normal P2P search</span><span>P2P Router</span></div><div><p>Looks for the lowest visible price</p><strong>Plans for the complete amount</strong></div><div><p>You check every limit manually</p><strong>Filters unusable ads automatically</strong></div><div><p>Shows one merchant at a time</p><strong>Can combine up to three merchants</strong></div></div></section>

      <section id="faq" className="landing-section faq-section"><div className="shell faq-layout"><div className="faq-heading"><h2>Questions before you route.</h2><p>The agent finds a path. You stay in control of every order.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="final-cta"><div className="shell final-cta-inner"><h2>Ready to find your route?</h2><p>Start with the live Kenya market or choose another supported country.</p><Link className="primary-cta light-cta" href="/router">Find a route <ArrowRight size={18} weight="bold" /></Link></div></section>

      <footer><div className="shell footer-inner"><div><Brand /><p>Route planning for Binance P2P.</p></div><p className="footer-note">Prices and merchant availability can change. Confirm every term on Binance before placing an order.</p></div></footer>
    </main>
  );
}
