# P2P Router

P2P Router is a route planner for Binance P2P. A user chooses a country, Buy or Sell, a crypto amount and a payment method. The app searches live Binance P2P ads and finds complete routes that can cover the full amount, including routes split across multiple merchants.

## Product rule

**AI interprets. Binance provides reality. Deterministic code decides the routes.**

The app never substitutes mock merchant data when Binance is unavailable.

## Binance Agent OS integration

P2P Router includes version 2.1.0 of the official Binance Skills Hub P2P Skill and follows its public-market workflow:

- `GET /bapi/c2c/v1/public/c2c/agent/trade-methods`
- `GET /bapi/c2c/v1/public/c2c/agent/ad-list`
- Public market search requires no Binance API key
- Selected ads open on Binance for human review and order placement

The implementation deliberately does not place, cancel or release P2P orders.

## How routing works

1. Fetch up to 20 live ads for the selected market.
2. Filter by requested amount and payment method.
3. Apply basic merchant activity and reliability checks.
4. Evaluate combinations of up to three merchants.
5. Keep only routes that cover the full requested crypto amount.
6. Rank complete routes as Cheapest, Balanced and Simplest.

OpenAI reads natural-language requests and explains the selected route. It does not calculate prices, filter merchants or choose route combinations.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `OPENAI_API_KEY` to `.env.local` to enable natural-language intent parsing and AI explanations. The live deterministic router still works when OpenAI is not configured.

## Quality checks

```bash
npm run lint
npm run build
```

## Important market note

Availability is controlled by Binance and can vary by fiat currency, payment method, location and time. If Binance returns no listings, the app shows a visible live-data error and does not use sample merchants.
