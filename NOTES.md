# Commerce — recommended path & integration seam

tinavnourish ships as a recipe blog, not a shop. The shop is a deliberate
follow-up. This note captures the recommended path and exactly where the
plugs go in, so a future maintainer doesn't have to rediscover the seam.

## Recommended path

Two reasonable options, depending on appetite:

1. **Medusa.js (headless)** — full control over products, variants, pricing,
   promotions, fulfilment and tax. Self-hosted or via Medusa Cloud. Best when
   the shop eventually needs physical + digital goods, subscriptions, or
   non-trivial checkout logic. Heavier to build and operate.
2. **Snipcart or Stripe Checkout (drop-in)** — products stay as markdown
   entries in a `products` collection; cart and checkout live entirely in a
   hosted JS snippet injected into the page. Best when the catalog is small
   (a cookbook, a few pantry items) and launch speed matters more than
   bespoke UX.

The default recommendation for tinavnourish is **Snipcart**, upgraded to
**Medusa.js** when the catalog grows past ~20 SKUs or when subscription /
digital products enter the picture.

## Where it plugs in

The scaffold already has the seams:

- **Header cart slot** — `components/Header.astro` ships a `{/* <CartIcon /> */}`
  comment-reserved slot. Un-comment and import the cart island when ready.
- **Content collections** — add a `products` collection to `content.config.ts`
  alongside `recipes`. Markdown files live in `src/content/products/`.
- **Routes** — add `src/pages/shop/` (index, `[slug]`) for the storefront, and
  `src/pages/api/` for any server-side cart/checkout endpoints.
- **Adapter** — `astro.config.mjs` is on `output: 'static'`. Flip to
  `output: 'hybrid'` and prerender-mark the content pages so `/api/checkout`
  can run as a Vercel serverless function while the rest stays static.
- **Cart state** — `src/store/` is reserved for the React cart context
  (`CartProvider`, `useCart`). See `src/store/README.md`.

## Out of scope for v1

- No real checkout. No payment provider. No shipping or tax logic.
- The newsletter form in `components/NewsletterForm.astro` is also a
  placeholder; commerce and email are intentionally independent launches.
