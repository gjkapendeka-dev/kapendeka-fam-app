
'use server';
/**
 * @fileOverview AI Story Studio - Generates a personalized family adventure story.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StoryInputSchema = z.object({
  characters: z.array(z.string()).describe('Names of the family members in the story.'),
  genre: z.string().describe('Genre of the story (e.g., Space, Fantasy, Mystery).'),
  theme: z.string().describe('The core message or theme (e.g., courage, teamwork).'),
});
export type StoryInput = z.infer<typeof StoryInputSchema>;

const StoryOutputSchema = z.object({
  title: z.string().describe('An epic title for the story.'),
  segments: z.array(z.object({
    text: z.string().describe('A segment of the story content.'),
    illustrationPrompt: z.string().describe('A descriptive prompt for an image generator.'),
  })).describe('The story broken into illustrative chapters.'),
  moral: z.string().describe('A quick wrap-up moral for the family.'),
});
export type StoryOutput = z.infer<typeof StoryOutputSchema>;

export async function generateFamilyStory(input: StoryInput): Promise<StoryOutput> {
  return storyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'storyStudioPrompt',
  input: { schema: StoryInputSchema },
  output: { schema: StoryOutputSchema },
  prompt: `You are the Kapendeka Universe Storyteller. Your goal is to write a thrilling adventure for the following family members: {{#each characters}}{{{this}}}, {{/each}}.

Genre: {{{genre}}}
Theme: {{{theme}}}

The story should be 3 chapters long. Each chapter must have high-quality storytelling and a specific illustration prompt that a painter could use to capture the scene.

Make the Kapendeka family feel like superheroes or legendary explorers. Keep it "365 Premium" in tone—elevated and inspiring.`,
});

const storyFlow = ai.defineFlow(
  {
    name: 'storyStudioFlow',
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate story.');
    return output;
  }
);
