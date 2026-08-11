# `src/store/`

Reserved home of the future shop (cart, checkout, product display).
Nothing is wired up yet — this directory is a scaffold so the seam is visible.

## Planned pieces

- `CartProvider.tsx` — React context provider holding cart state
  (line items, quantities, totals). Mounted once near the root of the
  Astro layout, exposing state to islands via `useCart()`.
- `useCart.ts` — context hook returning `{ items, add, remove, updateQty, total }`.
- `cart-drawer/` — React island for the slide-out cart drawer, triggered
  by the reserved `<CartIcon />` slot in `components/Header.astro`.
- `checkout/` — thin client wrapper around whichever commerce backend
  is chosen (see `NOTES.md` in the project root).

## Integration seam (already in place)

- `Header.astro` has a reserved cart-icon slot, currently empty.
- `content.config.ts` lives at the root, so a future `products`
  collection (e.g. cookbooks, pantry jars) can sit alongside `recipes`
  without any restructuring.
- `astro.config.mjs` is on `output: 'static'`; switch to `output: 'hybrid'`
  (or `output: 'server'`) when the first `/api/checkout` route lands.
- The Vercel adapter is already installed, so serverless functions under
  `src/pages/api/*` will deploy automatically.

## Choosing a backend

See [`NOTES.md`](../../NOTES.md) in the project root for the recommended
commerce path (Medusa.js for full control, Snipcart for drop-in).
