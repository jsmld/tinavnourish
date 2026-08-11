import { getCollection, type CollectionEntry } from 'astro:content';

import {
  COURSES,
  CATEGORIES,
  DIETS,
  PER_PAGE,
  type Course,
  type Category,
  type Diet,
} from './constants';

export type Recipe = CollectionEntry<'recipes'>;

export type FilterCriteria = {
  course?: Course;
  category?: Category;
  diet?: Diet;
};

/** All recipes, newest first. */
export async function getAllRecipes(): Promise<Recipe[]> {
  const recipes = await getCollection('recipes');
  return recipes.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );
}

/** Recipes flagged `featured: true`; falls back to most recent if none flagged. */
export async function getFeaturedRecipes(limit = 6): Promise<Recipe[]> {
  const all = await getAllRecipes();
  const featured = all.filter((r) => r.data.featured);
  const source = featured.length > 0 ? featured : all;
  return source.slice(0, limit);
}

/** Single-dimension filter (course OR category OR diet), mirrors dish.co.nz UX. */
export async function getFiltered(criteria: FilterCriteria = {}): Promise<Recipe[]> {
  const all = await getAllRecipes();
  const { course, category, diet } = criteria;
  return all.filter((r) => {
    if (course && r.data.course !== course) return false;
    if (category && r.data.category !== category) return false;
    if (diet && !r.data.diet.includes(diet)) return false;
    return true;
  });
}

/** Total number of pages for a list at the default page size. */
export function pageCount(list: Recipe[], perPage: number = PER_PAGE): number {
  return Math.max(1, Math.ceil(list.length / perPage));
}

/** Slice of a list for a given 1-based page number. */
export function paginate(list: Recipe[], page: number, perPage: number = PER_PAGE): Recipe[] {
  const start = (page - 1) * perPage;
  return list.slice(start, start + perPage);
}

/** Build a relative URL for a filter+pagination combo. Always root-relative. */
export function filterPath(params: {
  course?: Course;
  category?: Category;
  diet?: Diet;
  page?: number;
}): string {
  const { course, category, diet, page } = params;
  let path = '/recipes';
  if (course) path += `/course/${course}`;
  else if (category) path += `/category/${category}`;
  else if (diet) path += `/diet/${diet}`;
  if (page && page > 1) path += `/page/${page}`;
  return path;
}

/** Convenience: total recipes per course / category / diet (for pill counts). */
export async function getFacetCounts() {
  const all = await getAllRecipes();
  const count = <T extends string>(values: readonly T[], match: (v: T, r: Recipe) => boolean) => {
    const out: Record<string, number> = {};
    for (const v of values) out[v] = all.filter((r) => match(v, r)).length;
    return out;
  };
  return {
    byCourse: count(COURSES, (v, r) => r.data.course === v),
    byCategory: count(CATEGORIES, (v, r) => r.data.category === v),
    byDiet: count(DIETS, (v, r) => r.data.diet.includes(v as Diet)),
  };
}
