import { useMemo, useState } from 'react';

/**
 * A normalised ingredient line — frontend projection of the mixed-form
 * frontmatter schema. String ingredients arrive as `kind: 'text'`.
 */
export type IngredientLine =
  | { kind: 'text'; item: string }
  | { kind: 'structured'; amount: string; unit: string; item: string };

interface Props {
  originalServings: number;
  ingredients: IngredientLine[];
  /** Clamp range — the plan says 1–12. */
  min?: number;
  max?: number;
}

/** Try to parse a numeric amount. Supports decimals and simple fractions (1/2). */
function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const frac = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  return null;
}

/** Pretty-print a number: trim trailing 0s, keep up to 2 dp, prefer fractions for /3 /4 /8. */
function formatAmount(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(/\.0+$/, '');
}

export default function ServingsAdjuster({
  originalServings,
  ingredients,
  min = 1,
  max = 12,
}: Props) {
  const [servings, setServings] = useState(originalServings);
  const ratio = servings / originalServings;

  const adjusted = useMemo(
    () =>
      ingredients.map((ing) => {
        if (ing.kind === 'text') return { ing, display: ing.item, scaled: false };
        const numeric = parseAmount(ing.amount);
        if (numeric === null) {
          return { ing, display: `${ing.amount} ${ing.unit} ${ing.item}`.trim(), scaled: false };
        }
        const scaled = numeric * ratio;
        return {
          ing,
          display: `${formatAmount(scaled)} ${ing.unit} ${ing.item}`.trim(),
          scaled: Math.abs(ratio - 1) > 1e-6,
        };
      }),
    [ingredients, ratio],
  );

  const dec = () => setServings((s) => Math.max(min, s - 1));
  const inc = () => setServings((s) => Math.min(max, s + 1));

  return (
    <div className="not-prose">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-deep/70 p-4 ring-1 ring-[--color-rule]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[--color-ink-soft]">
            Servings
          </p>
          <p className="font-serif text-3xl text-[--color-ink]" data-testid="servings-value">
            {servings}
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Adjust servings">
          <button
            type="button"
            onClick={dec}
            disabled={servings <= min}
            aria-label="Fewer servings"
            className="h-10 w-10 rounded-full bg-paper text-lg font-semibold text-[--color-ink] ring-1 ring-[--color-rule] transition-colors hover:bg-cream hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={inc}
            disabled={servings >= max}
            aria-label="More servings"
            className="h-10 w-10 rounded-full bg-paper text-lg font-semibold text-[--color-ink] ring-1 ring-[--color-rule] transition-colors hover:bg-cream hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[--color-ink]">
        {adjusted.map((row, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-[--color-rule] pb-2 last:border-b-0"
          >
            <span>{row.display}</span>
            {row.ing.kind === 'structured' && row.scaled && (
              <span className="shrink-0 text-[0.7rem] uppercase tracking-wide text-[--color-ink-soft]">
                scaled
              </span>
            )}
            {row.ing.kind === 'text' && (
              <span className="shrink-0 text-[0.7rem] uppercase tracking-wide text-[--color-ink-soft]">
                as written
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
