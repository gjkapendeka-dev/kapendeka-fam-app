'use server';
/**
 * @fileOverview This file implements a Genkit flow that generates a categorized grocery shopping
 * list based on a weekly meal plan and associated recipes using AI.
 *
 * - generateShoppingList - A function that triggers the AI-powered shopping list generation.
 * - MealPlanShoppingListInput - The input type for the generateShoppingList function.
 * - MealPlanShoppingListOutput - The return type for the generateShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// 1. Define Input Schemas

/**
 * Represents a single ingredient with its details.
 */
const IngredientSchema = z.object({
  name: z.string().describe('The name of the ingredient (e.g., "chicken", "milk").'),
  quantity: z.number().optional().describe('The quantity of the ingredient.'),
  unit: z.string().optional().describe('The unit of measurement (e.g., "g", "litre", "pieces").'),
  category: z.string().optional().describe('The category of the ingredient (e.g., "meat", "dairy", "produce").'),
});

/**
 * Represents a full recipe, including its ingredients.
 */
const RecipeSchema = z.object({
  id: z.string().describe('The unique ID of the recipe.'),
  title: z.string().describe('The title of the recipe.'),
  ingredients: z.array(IngredientSchema).describe('A list of ingredients for the recipe.'),
});

/**
 * Represents the meals planned for a single day, referencing recipe IDs.
 */
const MealDayEntrySchema = z.object({
  breakfast: z.string().optional().describe('The recipe ID for breakfast, or null if no recipe.'),
  lunch: z.string().optional().describe('The recipe ID for lunch, or null if no recipe.'),
  dinner: z.string().optional().describe('The recipe ID for dinner, or null if no recipe.'),
  snacks: z.array(z.string()).optional().describe('An array of recipe IDs for snacks.'),
});

/**
 * Represents a complete weekly meal plan, mapping days to meal entries.
 */
const MealPlanSchema = z.object({
  weekStart: z.string().describe('The start date of the meal plan week in ISO 8601 format (e.g., "2026-04-06").'),
  days: z.record(z.string(), MealDayEntrySchema).describe('Meal plan entries for each day of the week (e.g., "Monday", "Tuesday").'),
});

/**
 * The input schema for generating a shopping list, including the meal plan and all relevant recipes.
 */
const MealPlanShoppingListInputSchema = z.object({
  mealPlan: MealPlanSchema.describe('The weekly meal plan.'),
  recipes: z.array(RecipeSchema).describe('A list of all recipes referenced in the meal plan, including their ingredients.'),
});
export type MealPlanShoppingListInput = z.infer<typeof MealPlanShoppingListInputSchema>;

// 2. Define Output Schemas

/**
 * Represents a single item on the grocery shopping list.
 */
const ShoppingListItemSchema = z.object({
  name: z.string().describe('The name of the grocery item.'),
  quantity: z.number().optional().describe('The consolidated quantity needed for the item across all recipes.'),
  unit: z.string().optional().describe('The unit of measurement for the item.'),
  category: z.string().describe('The category of the item (e.g., "Produce", "Dairy", "Meat", "Pantry").'),
  notes: z.string().optional().describe('Any specific notes for the item (e.g., "organic", "large pack").'),
});

/**
 * The output schema for the generated categorized grocery shopping list.
 */
const ShoppingListOutputSchema = z.object({
  listName: z.string().describe('A descriptive name for the shopping list (e.g., "Weekly Grocery List - April 8-14").'),
  items: z.array(ShoppingListItemSchema).describe('A categorized list of grocery items with consolidated quantities.'),
});
export type MealPlanShoppingListOutput = z.infer<typeof ShoppingListOutputSchema>;

// 3. Define the Genkit Prompt

const mealPlanShoppingListPrompt = ai.definePrompt({
  name: 'mealPlanShoppingListPrompt',
  input: { schema: MealPlanShoppingListInputSchema },
  output: { schema: ShoppingListOutputSchema },
  prompt: `You are an AI assistant designed to help busy parents generate categorized grocery shopping lists from their weekly meal plans.

Your task is to:
1. Review the provided weekly meal plan and the associated recipes.
2. Extract all ingredients from all meals across the entire week.
3. Consolidate duplicate ingredients: sum up quantities for identical items with compatible units. If units are incompatible (e.g., "1 piece chicken" and "500g chicken"), list them separately or make a reasonable conversion if obvious (e.g., "1 large onion" and "2 onions" could become "3 onions"). Prioritize clear, actionable items for shopping.
4. Categorize each ingredient into common grocery sections (e.g., "Produce", "Dairy", "Meat", "Pantry", "Frozen", "Bakery", "Spices", "Beverages", "Household"). If a recipe ingredient already has a category, use it. Otherwise, infer a suitable category.
5. Create a comprehensive shopping list formatted as a JSON object, as described by the output schema, with a descriptive listName based on the meal plan's week start date (e.g., "Weekly Grocery List - April 8-14").

The goal is to create a list that a parent can easily use in a grocery store, minimizing manual effort.

Meal Plan:
{{{json mealPlan}}}

Recipes:
{{{json recipes}}}

Generate the categorized grocery shopping list:`,
});

// 4. Define the Genkit Flow

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: MealPlanShoppingListInputSchema,
    outputSchema: ShoppingListOutputSchema,
  },
  async (input) => {
    const { output } = await mealPlanShoppingListPrompt(input);
    if (!output) {
      throw new Error('Failed to generate shopping list.');
    }
    return output;
  }
);

// 5. Wrapper Function

/**
 * Generates a categorized grocery shopping list based on a provided weekly meal plan and associated recipes.
 * @param input - The meal plan and related recipes.
 * @returns A promise that resolves to the generated categorized shopping list.
 */
export async function generateShoppingList(
  input: MealPlanShoppingListInput
): Promise<MealPlanShoppingListOutput> {
  return generateShoppingListFlow(input);
}
