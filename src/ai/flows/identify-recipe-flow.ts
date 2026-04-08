'use server';
/**
 * @fileOverview A Genkit flow that identifies a recipe or dish from a photo and extracts structured data.
 *
 * - identifyRecipe - A function that handles the AI recipe identification process.
 * - IdentifyRecipeInput - The input type for the identifyRecipe function.
 * - IdentifyRecipeOutput - The return type for the identifyRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyRecipeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a recipe card, cookbook, or dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyRecipeInput = z.infer<typeof IdentifyRecipeInputSchema>;

const IdentifyRecipeOutputSchema = z.object({
  title: z.string().describe('The identified title of the recipe.'),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).describe('The list of ingredients found in the photo.'),
  instructions: z.string().describe('The step-by-step cooking instructions.'),
  prepTime: z.string().optional().describe('Estimated preparation and cooking time.'),
  tags: z.array(z.string()).optional().describe('Suggested tags like "kid-friendly", "quick", "dinner".'),
});
export type IdentifyRecipeOutput = z.infer<typeof IdentifyRecipeOutputSchema>;

export async function identifyRecipe(input: IdentifyRecipeInput): Promise<IdentifyRecipeOutput> {
  return identifyRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRecipePrompt',
  input: {schema: IdentifyRecipeInputSchema},
  output: {schema: IdentifyRecipeOutputSchema},
  prompt: `You are an expert culinary assistant for the Kapendeka Family Hub.
Your task is to analyze the provided image, which contains either a written recipe card, a page from a cookbook, or a photo of a meal.

1. Extract the dish's name.
2. List all ingredients with their quantities and units if visible.
3. Write clear, step-by-step cooking instructions based on the photo.
4. Estimate prep/cook time if not explicitly stated.
5. Suggest a few helpful tags for categorization.

Photo: {{media url=photoDataUri}}`,
});

const identifyRecipeFlow = ai.defineFlow(
  {
    name: 'identifyRecipeFlow',
    inputSchema: IdentifyRecipeInputSchema,
    outputSchema: IdentifyRecipeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to identify recipe from the image.');
    }
    return output;
  }
);
