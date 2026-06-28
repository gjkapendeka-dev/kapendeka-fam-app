'use server';
/**
 * @fileOverview A Genkit flow that provides personalized meal suggestions based on natural language input.
 *
 * - naturalLanguageMealSuggestion - A function that handles natural language meal suggestion queries.
 * - NaturalLanguageMealSuggestionInput - The input type for the naturalLanguageMealSuggestion function.
 * - NaturalLanguageMealSuggestionOutput - The return type for the naturalLanguageMealSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const NaturalLanguageMealSuggestionInputSchema = z.object({
  query: z.string().describe("Natural language query for meal suggestions, e.g., 'Suggest a healthy dinner with chicken for Tuesday'"),
});
export type NaturalLanguageMealSuggestionInput = z.infer<typeof NaturalLanguageMealSuggestionInputSchema>;

// Recipe Schema (simplified for tool output)
const RecipeOutputSchema = z.object({
  title: z.string().describe('The name of the recipe.'),
  ingredients: z.array(z.string()).describe('A list of ingredients for the recipe.'),
  instructions: z.string().describe('Cooking instructions for the recipe.'),
  tags: z.array(z.string()).optional().describe('Tags associated with the recipe, e.g., "healthy", "kid-friendly".'),
  photoUrl: z.string().optional().describe('URL to a photo of the recipe.'),
});

// Output Schema
const NaturalLanguageMealSuggestionOutputSchema = z.object({
  suggestions: z.array(RecipeOutputSchema).describe('A list of suggested recipes based on the query.'),
  summary: z.string().describe('A summary of the meal suggestions.'),
});
export type NaturalLanguageMealSuggestionOutput = z.infer<typeof NaturalLanguageMealSuggestionOutputSchema>;

// Tool to get recipes
const getRecipesTool = ai.defineTool(
  {
    name: 'getRecipes',
    description: 'Retrieves recipes from the family recipe box based on specified criteria.',
    inputSchema: z.object({
      ingredients: z.array(z.string()).optional().describe('An array of key ingredients to search for (e.g., ["chicken", "rice"]).'),
      mealType: z.string().optional().describe('The type of meal (e.g., "breakfast", "lunch", "dinner", "snack").'),
      healthFocus: z.string().optional().describe('A health focus for the meal (e.g., "healthy", "vegetarian", "vegan", "low-carb").'),
      dayOfWeek: z.string().optional().describe('The day of the week the meal is planned for (e.g., "Monday", "Tuesday").'),
      tags: z.array(z.string()).optional().describe('Additional tags to filter recipes by (e.g., ["quick", "kid-friendly"]).'),
    }),
    outputSchema: z.array(RecipeOutputSchema),
  },
  async (input) => {
    // This is a placeholder implementation. In a real app, this would query Firestore.
    // For now, return mock data based on input for demonstration.
    const mockRecipes = [
      {
        title: "Chicken Stir-Fry",
        ingredients: ["chicken breast", "broccoli", "carrots", "soy sauce", "rice"],
        instructions: "Cook chicken, add vegetables, then soy sauce. Serve with rice.",
        tags: ["healthy", "quick", "dinner"],
        photoUrl: "https://example.com/chicken-stirfry.jpg"
      },
      {
        title: "Lentil Soup",
        ingredients: ["lentils", "carrots", "celery", "onion", "vegetable broth"],
        instructions: "Sauté vegetables, add lentils and broth, simmer until tender.",
        tags: ["vegetarian", "healthy", "lunch", "dinner"],
        photoUrl: "https://example.com/lentil-soup.jpg"
      },
      {
        title: "Taco Tuesday",
        ingredients: ["ground beef", "taco shells", "lettuce", "tomato", "cheese"],
        instructions: "Brown beef, prepare toppings, serve in shells.",
        tags: ["kid-friendly", "dinner", "quick"],
        photoUrl: "https://example.com/taco-tuesday.jpg"
      },
      {
        title: "Roasted Chicken and Vegetables",
        ingredients: ["whole chicken", "potatoes", "carrots", "rosemary", "olive oil"],
        instructions: "Chop vegetables, season chicken and vegetables, roast in oven.",
        tags: ["dinner", "healthy", "sunday-dinner"],
        photoUrl: "https://example.com/roasted-chicken.jpg"
      },
      {
        title: "Quick Pasta with Pesto",
        ingredients: ["pasta", "pesto sauce", "cherry tomatoes", "parmesan"],
        instructions: "Cook pasta, mix with pesto and tomatoes, sprinkle cheese.",
        tags: ["vegetarian", "quick", "dinner"],
        photoUrl: "https://example.com/pesto-pasta.jpg"
      }
    ];

    let filteredRecipes = mockRecipes;

    if (input.ingredients && input.ingredients.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        input.ingredients!.some(ingredient =>
          recipe.ingredients.some(ri => ri.toLowerCase().includes(ingredient.toLowerCase()))
        )
      );
    }
    if (input.mealType) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.tags?.includes(input.mealType!.toLowerCase())
      );
    }
    if (input.healthFocus) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.tags?.includes(input.healthFocus!.toLowerCase())
      );
    }
    if (input.dayOfWeek) {
      // For simplicity, we'll assume 'Tuesday' might match 'taco-tuesday' or a general dinner.
      // A more robust implementation might map days to specific meal plans.
      filteredRecipes = filteredRecipes.filter(recipe =>
        recipe.tags?.some(tag => tag.toLowerCase().includes(input.dayOfWeek!.toLowerCase()))
      );
    }
    if (input.tags && input.tags.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe =>
        input.tags!.every(tag => recipe.tags?.includes(tag.toLowerCase()))
      );
    }

    return filteredRecipes;
  }
);

// Prompt definition
const naturalLanguageMealSuggestionPrompt = ai.definePrompt({
  name: 'naturalLanguageMealSuggestionPrompt',
  input: {schema: NaturalLanguageMealSuggestionInputSchema},
  output: {schema: NaturalLanguageMealSuggestionOutputSchema},
  tools: [getRecipesTool],
  prompt: `You are a helpful family meal planner assistant for the Kapendeka Family app.
The user wants meal suggestions based on their natural language query.
Your goal is to use the 'getRecipes' tool to find suitable recipes from the family's recipe box and then provide a summary of the suggestions.

If the user asks for specific ingredients, meal types (breakfast, lunch, dinner, snack), health focuses (healthy, vegetarian, vegan, low-carb), or days of the week, extract these from the query and use them as parameters for the 'getRecipes' tool.

After calling the tool, summarize the suggested recipes in a friendly and encouraging tone. If no recipes are found, suggest alternative ingredients or meal types.

User query: {{{query}}}`,
});

// Flow definition
const naturalLanguageMealSuggestionFlow = ai.defineFlow(
  {
    name: 'naturalLanguageMealSuggestionFlow',
    inputSchema: NaturalLanguageMealSuggestionInputSchema,
    outputSchema: NaturalLanguageMealSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await naturalLanguageMealSuggestionPrompt(input);
    return output!;
  }
);

// Export wrapper function
export async function naturalLanguageMealSuggestion(input: NaturalLanguageMealSuggestionInput): Promise<NaturalLanguageMealSuggestionOutput> {
  return naturalLanguageMealSuggestionFlow(input);
}
