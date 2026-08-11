/**
 * Catalog of filterable facets for recipes.
 *
 * The string values are slug-stable: they appear in URLs
 * (e.g. /recipes/course/dessert, /recipes/diet/vegan) and as frontmatter
 * values in src/content/recipes/*.md. Renaming a value is a breaking change.
 */

export const COURSES = [
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'baking',
  'sides',
  'starter',
  'bites',
] as const;
export type Course = (typeof COURSES)[number];

export const COURSE_LABELS: Record<Course, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  baking: 'Baking',
  sides: 'Sides',
  starter: 'Starter',
  bites: 'Bites',
};

export const CATEGORIES = [
  'baking',
  'mains',
  'salads',
  'soups',
  'pasta-grains',
  'fish-seafood',
  'meat',
  'poultry',
  'vegetables',
  'fruit',
  'drinks',
  'eggs-dairy',
  'sweets',
  'condiments',
  'breads-pastry',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  baking: 'Baking',
  mains: 'Mains',
  salads: 'Salads',
  soups: 'Soups',
  'pasta-grains': 'Pasta & Grains',
  'fish-seafood': 'Fish & Seafood',
  meat: 'Meat',
  poultry: 'Poultry',
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  drinks: 'Drinks',
  'eggs-dairy': 'Eggs & Dairy',
  sweets: 'Sweets',
  condiments: 'Condiments',
  'breads-pastry': 'Breads & Pastry',
};

export const DIETS = ['gluten-free', 'dairy-free', 'vegetarian', 'vegan'] as const;
export type Diet = (typeof DIETS)[number];

export const DIET_LABELS: Record<Diet, string> = {
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
};

/** Short codes used on diet pills in RecipeCard / DietBadge. */
export const DIET_BADGES: Record<Diet, string> = {
  'gluten-free': 'GF',
  'dairy-free': 'DF',
  vegetarian: 'V',
  vegan: 'VG',
};

/** Recipes per page on listing/filter routes. */
export const PER_PAGE = 12;
