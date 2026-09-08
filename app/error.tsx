"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <p className="eyebrow">P2P Router</p>
      <h1>Something interrupted this route.</h1>
      <p>Your order was not placed. Try loading the page again.</p>
      <button className="primary-cta" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
