import { Food, FoodCategory } from "./types";

/**
 * A curated library of sensible first foods, grouped by category.
 * Allergen flags mark the "big" allergens worth introducing one at a
 * time, early, and then keeping in the rotation.
 */
export const FOODS: Food[] = [
  // Vegetables
  { id: "sweet-potato", name: "Sweet potato", category: "vegetables" },
  { id: "carrot", name: "Carrot", category: "vegetables" },
  { id: "butternut-squash", name: "Butternut squash", category: "vegetables" },
  { id: "avocado", name: "Avocado", category: "vegetables" },
  { id: "pea", name: "Pea", category: "vegetables" },
  { id: "broccoli", name: "Broccoli", category: "vegetables" },
  { id: "parsnip", name: "Parsnip", category: "vegetables" },
  { id: "green-bean", name: "Green bean", category: "vegetables" },
  { id: "zucchini", name: "Zucchini", category: "vegetables" },
  { id: "spinach", name: "Spinach", category: "vegetables" },
  { id: "pumpkin", name: "Pumpkin", category: "vegetables" },
  { id: "beetroot", name: "Beetroot", category: "vegetables" },

  // Fruits
  { id: "banana", name: "Banana", category: "fruits" },
  { id: "apple", name: "Apple", category: "fruits" },
  { id: "pear", name: "Pear", category: "fruits" },
  { id: "mango", name: "Mango", category: "fruits" },
  { id: "peach", name: "Peach", category: "fruits" },
  { id: "blueberry", name: "Blueberry", category: "fruits" },
  { id: "prune", name: "Prune", category: "fruits" },
  { id: "apricot", name: "Apricot", category: "fruits" },

  // Grains
  { id: "oats", name: "Oats", category: "grains" },
  { id: "rice-cereal", name: "Rice cereal", category: "grains" },
  { id: "barley", name: "Barley", category: "grains" },
  {
    id: "wheat",
    name: "Wheat",
    category: "grains",
    allergen: true,
    note: "Common allergen — introduce on its own and watch.",
  },

  // Proteins
  {
    id: "egg",
    name: "Egg",
    category: "proteins",
    allergen: true,
    note: "Serve well-cooked. Introduce early and keep in rotation.",
  },
  {
    id: "peanut",
    name: "Peanut",
    category: "proteins",
    allergen: true,
    note: "Smooth peanut butter thinned into food — never whole nuts.",
  },
  {
    id: "sesame",
    name: "Sesame",
    category: "proteins",
    allergen: true,
    note: "Tahini thinned into food works well.",
  },
  { id: "lentil", name: "Lentil", category: "proteins" },
  { id: "chicken", name: "Chicken", category: "proteins" },
  { id: "tofu", name: "Tofu", category: "proteins", allergen: true, note: "Soy — a common allergen." },
  {
    id: "salmon",
    name: "Salmon",
    category: "proteins",
    allergen: true,
    note: "Fish is a common allergen. Check carefully for bones.",
  },
  { id: "chickpea", name: "Chickpea", category: "proteins" },
  {
    id: "almond",
    name: "Almond",
    category: "proteins",
    allergen: true,
    note: "Tree nut — smooth almond butter thinned into food, never whole nuts.",
  },
  {
    id: "shrimp",
    name: "Shrimp",
    category: "proteins",
    allergen: true,
    note: "Shellfish — well-cooked and finely chopped.",
  },

  // Dairy
  {
    id: "yogurt",
    name: "Yogurt",
    category: "dairy",
    allergen: true,
    note: "Full-fat, unsweetened. Dairy is a common allergen.",
  },
  {
    id: "cheese",
    name: "Cheese",
    category: "dairy",
    allergen: true,
    note: "Pasteurised, full-fat. Dairy is a common allergen.",
  },
];

export const CATEGORY_ORDER: FoodCategory[] = [
  "vegetables",
  "fruits",
  "grains",
  "proteins",
  "dairy",
];

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  grains: "Grains",
  proteins: "Proteins",
  dairy: "Dairy",
};

const FOOD_BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): Food | undefined {
  return FOOD_BY_ID.get(id);
}
