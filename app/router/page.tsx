import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { RouterExperience } from "@/components/router-experience";

export const metadata: Metadata = {
  title: "Find a route | P2P Router",
  description: "Find complete Buy or Sell routes across live Binance P2P merchants.",
  alternates: { canonical: "/router" },
};

export default function RouterPage() {
  return (
    <main className="router-page">
      <header className="product-header"><div className="shell product-header-inner"><Link href="/" className="wordmark" aria-label="P2P Router home"><span className="route-mark" aria-hidden="true"><i /><i /><i /></span><span>P2P Router</span></Link><Link href="/" className="back-link"><ArrowLeft size={17} weight="bold" /> Home</Link></div></header>
      <section className="router-page-main shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Route planner</span></nav>
        <div className="router-intro"><p>Live route planner</p><h1>Plan your complete P2P route.</h1><span>Start with Kenya or choose another market. Binance availability is checked live.</span></div><RouterExperience />
      </section>
    </main>
  );
}
