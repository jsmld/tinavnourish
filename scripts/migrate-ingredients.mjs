#!/usr/bin/env node
/**
 * One-shot migration: convert every bare-string entry inside `ingredients:`
 * frontmatter arrays to the structured `{ amount: '', unit: '', item: <text> }`
 * form so Decap's list-of-object widget can render all recipes uniformly.
 *
 * Run: `node scripts/migrate-ingredients.mjs`
 *
 * Idempotent — re-running is a no-op on already-converted files.
 * Safe to delete after the migration has shipped.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RECIPES_DIR = new URL('../src/content/recipes/', import.meta.url).pathname;

/** Parse the fenced frontmatter block, rewrite ingredients, return new text. */
function migrateFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const match = /^---\n([\s\S]*?)\n---/m.exec(original);
  if (!match) {
    console.warn(`  ! no frontmatter fence in ${filePath}; skipped`);
    return { changed: false, text: original };
  }
  const fm = match[1];
  const lines = fm.split('\n');

  // Find the `ingredients:` block: starts at `ingredients:`, ends at the next
  // line that's either a top-level key or outdents to column 0.
  const startIdx = lines.findIndex((l) => /^ingredients:\s*$/.test(l));
  if (startIdx === -1) {
    console.warn(`  ! no ingredients: key in ${filePath}; skipped`);
    return { changed: false, text: original };
  }
  let endIdx = startIdx + 1;
  while (
    endIdx < lines.length &&
    // Either `  - ` (list item) or `    ` (sub-key of an object list item).
    (/^  - /.test(lines[endIdx]) || /^    \S/.test(lines[endIdx]))
  ) {
    endIdx++;
  }

  // Walk the block; convert bare-string list items to the three-line form.
  // A bare-string item is a `  - <text>` line whose <text> is NOT `amount:`/`unit:`/`item:`
  // (those mark the start of an object-valued item with sub-keys on following lines).
  const block = lines.slice(startIdx, endIdx);
  const newBlock = [];
  let touched = 0;
  for (const line of block) {
    const m = /^  - (.+)$/.exec(line);
    if (m) {
      const text = m[1].trim();
      const isObjectItem = /^(amount|unit|item):/.test(text);
      if (!isObjectItem && text !== '') {
        newBlock.push("  - amount: ''");
        newBlock.push("    unit: ''");
        newBlock.push(`    item: ${yamlScalar(text)}`);
        touched++;
        continue;
      }
    }
    newBlock.push(line);
  }

  if (touched === 0) {
    return { changed: false, text: original };
  }

  const newFm = [...lines.slice(0, startIdx), ...newBlock, ...lines.slice(endIdx)].join('\n');
  const text = original.slice(0, match.index) + '---\n' + newFm + '\n---' + original.slice(match.index + match[0].length);
  return { changed: true, text, touched };
}

/** Quote a YAML scalar the same way the existing recipe files do (single quotes). */
function yamlScalar(text) {
  // Existing files use single-quoted scalars; escape embedded single quotes by doubling.
  return `'${text.replace(/'/g, "''")}'`;
}

// --- main ---
const files = readdirSync(RECIPES_DIR).filter((f) => f.endsWith('.md'));
let totalTouched = 0;
for (const f of files) {
  const path = join(RECIPES_DIR, f);
  const { changed, text, touched } = migrateFile(path);
  if (changed) {
    writeFileSync(path, text, 'utf8');
    console.log(`✓ ${f}: converted ${touched} ingredient(s)`);
    totalTouched += touched;
  } else {
    console.log(`· ${f}: nothing to convert`);
  }
}
console.log(`\nDone. ${totalTouched} ingredient(s) converted across ${files.length} files.`);
