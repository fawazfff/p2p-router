import {
  ArrowRight,
  Bank,
  CheckCircle,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Path,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

export function RouteProductPreview() {
  return (
    <div className="app-preview" aria-label="Preview of the P2P Router workspace">
      <aside className="preview-request-card">
        <div className="preview-card-title"><span>Your request</span><i>Example</i></div>
        <div className="preview-trade-toggle"><strong>Buy</strong><span>Sell</span></div>
        <div className="preview-fields">
          <div><span><GlobeHemisphereWest size={12} /> Market</span><strong>Kenya · KES</strong></div>
          <div><span><Path size={12} /> Amount</span><strong>100 USDT</strong></div>
          <div><span><Bank size={12} /> Pay with</span><strong>Bank transfer</strong></div>
        </div>
        <div className="preview-find-button">Find my route <ArrowRight size={13} weight="bold" /></div>
        <small><ShieldCheck size={12} weight="fill" /> Live Binance data</small>
      </aside>

      <section className="preview-workspace">
        <div className="preview-workspace-head"><div><span>Route workspace</span><strong>Building a complete route</strong></div><i><span /> Live check</i></div>
        <div className="preview-activity">
          <div className="preview-activity-head"><MagnifyingGlass size={14} weight="bold" /><strong>Agent activity</strong><span>Checking now</span></div>
          <div className="preview-progress"><i /></div>
          <ol>
            <li className="complete"><CheckCircle size={14} weight="fill" /><span><strong>Request read</strong><small>100 USDT in Kenya</small></span></li>
            <li className="complete"><CheckCircle size={14} weight="fill" /><span><strong>Live ads checked</strong><small>Current Binance listings</small></span></li>
            <li className="current"><span className="preview-search-dot" /><span><strong>Comparing prices</strong><small>Checking full amount coverage</small></span></li>
            <li><span className="preview-wait-dot" /><span><strong>Preparing choices</strong><small>Cheapest, Balanced, Simplest</small></span></li>
          </ol>
        </div>
        <div className="preview-route-choice">
          <div><span>Balanced</span><strong>Full amount covered</strong><small>Price, history and fewer handoffs</small></div>
          <div className="preview-route-map" aria-hidden="true"><i>You</i><b /><i>Merchant</i><b /><i><CheckCircle size={13} weight="fill" /> Done</i></div>
        </div>
      </section>
    </div>
  );
}
