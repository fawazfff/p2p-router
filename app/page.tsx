import Link from "next/link";
import { RouterExperience } from "@/components/router-experience";

const faqs = [
  {
    question: "Does P2P Router place an order for me?",
    answer: "No. It plans the route and opens the selected Binance P2P ads. You review the current terms and complete each order directly on Binance.",
  },
  {
    question: "Where does the merchant data come from?",
    answer: "Every result comes from Binance's public Agent P2P endpoints through the official P2P Skill workflow. Merchant names, prices, limits and history are never invented.",
  },
  {
    question: "Why can one route contain several merchants?",
    answer: "One ad may not cover your full amount. The router checks combinations of up to three eligible ads, then finds complete routes instead of showing an incomplete best price.",
  },
  {
    question: "What happens when Binance data is unavailable?",
    answer: "The app stops and tells you that live data is unavailable. It does not quietly switch to sample ads or cached merchant results.",
  },
  {
    question: "How are Balanced routes scored?",
    answer: "Deterministic code combines effective price, completion rate, positive feedback, recent order count and the number of merchants. OpenAI explains the result but cannot change the route math.",
  },
  {
    question: "Do I need a Binance API key or funded wallet?",
    answer: "No. The core route search uses public market data. You only need a Binance account when you choose to open an ad and continue on Binance.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="#top" className="wordmark" aria-label="P2P Router home">
            <span className="route-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>P2P Router</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="#how-it-works">How it works</Link>
            <Link href="#faq">FAQ</Link>
            <a href="https://github.com/fawazfff/p2p-router" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <Link className="nav-cta" href="#router">Find a route</Link>
        </div>
      </header>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">Powered by Binance Agent OS</p>
          <h1>Find a route, not just an ad.</h1>
          <p className="hero-lede">Plan the best way to buy or sell your full crypto amount across real Binance P2P merchants.</p>
        </div>
        <RouterExperience />
      </section>

      <section className="proof-strip" aria-label="How decisions are made">
        <div className="shell proof-grid">
          <div><strong>AI</strong><span>understands your request</span></div>
          <div><strong>Binance</strong><span>provides live market reality</span></div>
          <div><strong>Code</strong><span>decides complete routes</span></div>
        </div>
      </section>

      <section id="how-it-works" className="section shell route-story">
        <div className="story-copy">
          <h2>The cheapest ad can still leave you stranded.</h2>
          <p>A low price is not useful when the merchant cannot cover your amount, accept your payment method, or pass basic reliability checks.</p>
        </div>
        <div className="story-rail" aria-label="P2P Router process">
          <article>
            <span>Understand</span>
            <h3>Your whole request</h3>
            <p>Country, direction, crypto amount and payment method become one clear routing goal.</p>
          </article>
          <article>
            <span>Verify</span>
            <h3>Every usable ad</h3>
            <p>Live listings are checked against limits, available amount and merchant history.</p>
          </article>
          <article>
            <span>Route</span>
            <h3>The complete amount</h3>
            <p>Eligible ads are combined and ranked as Cheapest, Balanced and Simplest.</p>
          </article>
        </div>
      </section>

      <section className="section shell comparison-section">
        <div className="comparison-head">
          <h2>From a list of prices to a usable plan.</h2>
          <p>P2P Router treats every listing like one possible leg of a journey.</p>
        </div>
        <div className="comparison-grid">
          <div className="comparison-old">
            <h3>A normal ad list</h3>
            <p>Sorts by a single price</p>
            <p>Leaves limit checking to you</p>
            <p>Does not solve partial coverage</p>
          </div>
          <div className="comparison-new">
            <h3>P2P Router</h3>
            <p>Plans for your entire amount</p>
            <p>Checks payment and merchant fit</p>
            <p>Explains each route and tradeoff</p>
          </div>
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="shell faq-layout">
          <div className="faq-heading">
            <h2>Questions before you route.</h2>
            <p>The agent finds a path. You stay in control of every order.</p>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<span aria-hidden="true">+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <div>
            <Link href="#top" className="wordmark"><span className="route-mark" aria-hidden="true"><i /><i /><i /></span><span>P2P Router</span></Link>
            <p>Route planning for Binance P2P.</p>
          </div>
          <p className="footer-note">Prices and merchant availability can change. Confirm every term on Binance before placing an order.</p>
        </div>
      </footer>
    </main>
  );
}

