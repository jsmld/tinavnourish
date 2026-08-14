import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

import { COURSES, CATEGORIES, DIETS } from './lib/constants';

/**
 * Recipe collection — markdown files under src/content/recipes/.
 *
 * The filename (minus extension) is the slug, e.g.
 *   src/content/recipes/dark-fudge-brownies.md  →  /recipes/dark-fudge-brownies
 */
const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Decap uploads land in public/uploads/ and are served at /uploads/...;
    // those relative paths aren't valid URLs, so accept any non-empty string here.
    heroImage: z.string(),
    author: z.object({
      name: z.string(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
    }),
    course: z.enum(COURSES),
    category: z.enum(CATEGORIES),
    diet: z.array(z.enum(DIETS)).default([]),
    prepTime: z.number().int().positive(),
    cookTime: z.number().int().nonnegative(),
    servings: z.number().int().positive(),
    /** Mixed form: authors may use plain strings or {amount,unit,item}. */
    ingredients: z
      .array(
        z.union([
          z.string(),
          z.object({
            amount: z.string(),
            unit: z.string(),
            item: z.string(),
          }),
        ]),
      )
      .min(1),
    steps: z.array(z.string()).min(1),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { recipes };
