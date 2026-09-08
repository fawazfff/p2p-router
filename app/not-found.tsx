import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">P2P Router</p>
      <h1>That route does not exist.</h1>
      <p>Go back to the live route planner and start with a real Binance market.</p>
      <Link className="primary-cta" href="/router">Open route planner</Link>
    </main>
  );
}
