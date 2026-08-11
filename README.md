# tinavnourish

A warm-editorial recipe journal built with Astro. Markdown-driven content,
pre-rendered filter and pagination pages, a no-JS-friendly listing, and an
interactive React island on each recipe for scaling servings. Store-ready
scaffold (cart seam + notes) included but not wired.

## Stack

- **Astro 7** (static output, Vercel adapter pre-wired)
- **React 19** islands (`client:load`) for the servings adjuster
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (configured in CSS via `@theme`)
- **Content Layer API** with a `glob()` loader for markdown recipes
- **pnpm** for package management
- **TypeScript** (strict), ESLint flat config, Prettier with Astro + Tailwind plugins

> Note: the original plan called for Astro 5 + `@astrojs/tailwind` (Tailwind 3.4).
> The project was upgraded to Astro 7 + Tailwind v4 (the current `@latest` combo)
> during scaffolding. Tailwind v4 deprecates `@astrojs/tailwind` in favour of
> the Vite plugin, and theme tokens now live in `src/styles/global.css` under
> `@theme`. There is no `tailwind.config.mjs` — that's intentional, not missing.

## Getting started

Requirements: Node 22+ and pnpm 10+.

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

Other scripts:

```bash
pnpm build      # static build → dist/
pnpm preview    # preview the built site
pnpm check      # astro check (TypeScript + .astro diagnostics)
pnpm lint       # eslint .
pnpm format     # prettier --write .
```

## Folder map

```
tinavnourish/
├─ astro.config.mjs        # integrations + Vite (Tailwind) + image domains
├─ content.config.ts       # recipes collection: glob loader + Zod schema
├─ eslint.config.js        # flat ESLint config
├─ NOTES.md                # commerce path + integration seam
├─ src/
│  ├─ components/
│  │  ├─ BaseHead.astro         # <head>: SEO, OG, Google Fonts, favicon
│  │  ├─ Header.astro           # logo + nav + reserved cart slot
│  │  ├─ Footer.astro           # newsletter + nav + copyright
│  │  ├─ RecipeCard.astro       # listing card
│  │  ├─ DietBadge.astro        # GF / DF / V / VG pills
│  │  ├─ FilterBar.astro        # course / category / diet pills (active state)
│  │  ├─ Pagination.astro       # URL-based prev/next + numbers
│  │  ├─ NewsletterForm.astro   # placeholder (inline script, no endpoint)
│  │  └─ ServingsAdjuster.tsx   # React island — scales ingredient amounts
│  ├─ content/
│  │  └─ recipes/*.md           # one markdown file per recipe (slug = filename)
│  ├─ layouts/BaseLayout.astro
│  ├─ lib/
│  │  ├─ constants.ts           # course / category / diet enums + label maps
│  │  └─ recipes.ts             # getAllRecipes, getFiltered, paginate, etc.
│  ├─ pages/
│  │  ├─ index.astro            # homepage (hero + featured + browse-by-course)
│  │  ├─ about.astro
│  │  ├─ contact.astro
│  │  └─ recipes/
│  │     ├─ index.astro         # /recipes (page 1 of all)
│  │     ├─ [...filter].astro   # course/X, category/X, diet/X, page/N
│  │     └─ [slug].astro        # recipe detail
│  ├─ store/                    # reserved — future cart/checkout seam
│  └─ styles/global.css         # Tailwind import + @theme + base typography
└─ tsconfig.json
```

## How to add a recipe

1. Create a new markdown file at `src/content/recipes/<your-slug>.md`. The
   filename (without extension) becomes the URL: `/recipes/<your-slug>`.
2. Add the required frontmatter. The Zod schema in `content.config.ts`
   validates on every `pnpm build` / `pnpm dev`, so a missing field or a typo
   surfaces immediately.

Minimal example:

```md
---
title: Slow-Roasted Tomatoes
description: Sweet, jammy, intensely tomatoey.
heroImage: https://picsum.photos/seed/my-recipe/1200/800
author:
  name: Your Name
course: sides
category: vegetables
diet:
  - vegan
  - gluten-free
prepTime: 10
cookTime: 90
servings: 4
ingredients:
  - amount: '600'
    unit: g
    item: cherry tomatoes
  - amount: '3'
    unit: tbsp
    item: olive oil
  - flaky sea salt
steps:
  - Heat the oven to 150°C (300°F).
  - Toss the tomatoes in olive oil and salt and spread on a tray.
  - Roast for 90 minutes until collapsed and jammy.
publishDate: 2025-10-01
featured: false
---

Optional body prose goes here.
```

### Frontmatter reference

| Field         | Type                                                           | Notes |
|---------------|----------------------------------------------------------------|-------|
| `title`       | string                                                         | |
| `description` | string                                                         | Used as the meta description and the listing sub-line. |
| `heroImage`   | URL string                                                     | Remote URL — `picsum.photos` is allowlisted for demos. |
| `author`      | `{ name, bio?, avatar? }`                                      | |
| `course`      | enum                                                           | One of the values in `src/lib/constants.ts` (`COURSES`). |
| `category`    | enum                                                           | One of `CATEGORIES`. |
| `diet`        | enum[] (default `[]`)                                          | Any of `DIETS`. Drives the badge pills on cards. |
| `prepTime`    | positive int                                                   | Minutes. |
| `cookTime`    | non-negative int                                               | Minutes. |
| `servings`    | positive int                                                   | Default serving size for the adjuster. |
| `ingredients` | array of string **or** `{ amount, unit, item }`                | Mixed forms allowed. Structured entries scale; strings don't. |
| `steps`       | string[]                                                       | Ordered method. |
| `publishDate` | date (coerced)                                                 | e.g. `2025-10-01`. |
| `tags`        | string[] (default `[]`)                                        | |
| `featured`    | boolean (default `false`)                                      | `true` surfaces it on the homepage. |

## Routing & pagination

Listing/filter routes are all pre-rendered HTML — no client JS needed to browse.

- `/recipes` — all recipes, page 1
- `/recipes/page/2`, `/recipes/page/3`, … — pagination of all recipes
- `/recipes/course/<course>` and `/recipes/course/<course>/page/<n>`
- `/recipes/category/<cat>` and `/recipes/category/<cat>/page/<n>`
- `/recipes/diet/<diet>` and `/recipes/diet/<diet>/page/<n>`
- `/recipes/<slug>` — recipe detail page

All three facets are emitted by a single `getStaticPaths` in
`src/pages/recipes/[...filter].astro`. Single-dimension filtering (course OR
category OR diet) mirrors the reference UX. Combined multi-dimension filters
(e.g. `?course=dinner&diet=vegan`) are intentionally out of scope for v1.

## Deployment

The project is pre-wired for **Vercel** via `@astrojs/vercel`.

- `output: 'static'` — every page is pre-rendered at build time.
- Push to a Vercel-connected git repo and the preview/production deploys
  happen automatically. No build command overrides needed; `pnpm build` is it.
- For non-Vercel hosting, swap the adapter in `astro.config.mjs` (or drop it
  entirely — static output is portable to any static host: Netlify, Cloudflare
  Pages, GitHub Pages, S3 + CloudFront, etc.).

To switch to hybrid output (required when the shop's checkout API lands):

```js
// astro.config.mjs
export default defineConfig({
  output: 'hybrid',
  // ...rest stays the same
});
```

## Commerce (future)

See [`NOTES.md`](./NOTES.md). The seam is in place: a reserved cart-icon slot
in `Header.astro`, a `src/store/` directory for the cart context, and a clear
upgrade path from Snipcart (drop-in) to Medusa.js (headless) as the catalog
grows.

## Newsletter (future)

`components/NewsletterForm.astro` is a placeholder UI with an inline submit
handler that simply shows a "thanks" toast. The comment marks where a real
endpoint (e.g. `/api/newsletter` → Buttondown, ConvertKit, or Mailchimp) plugs
in.

## Credits

Built with [Astro](https://astro.build). Imagery via
[picsum.photos](https://picsum.photos) (placeholder). Fonts: Fraunces + Inter
via Google Fonts.
