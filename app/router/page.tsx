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
        <div className="router-intro"><p>Live route agent</p><h1>Tell us what you want to buy or sell.</h1><span>The agent checks real Binance ads and shows what can be completed now.</span></div><RouterExperience />
      </section>
    </main>
  );
}
