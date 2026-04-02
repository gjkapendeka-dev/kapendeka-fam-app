'use server';
/**
 * @fileOverview A Genkit flow that generates a daily family briefing.
 *
 * - generateDailyBrief - A function that synthesizes family data into a cohesive summary.
 * - FamilyBriefInput - The input type containing events, chores, and news.
 * - FamilyBriefOutput - The structured return type for the brief.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FamilyBriefInputSchema = z.object({
  userName: z.string().describe('The name of the user viewing the brief.'),
  events: z.array(z.object({
    title: z.string(),
    startTime: z.string(),
    type: z.string()
  })).describe('Upcoming calendar events for the next 24 hours.'),
  chores: z.array(z.object({
    title: z.string(),
    assignedTo: z.string(),
    points: z.number()
  })).describe('Pending tasks for the family.'),
  recentNews: z.array(z.object({
    title: z.string(),
    authorName: z.string()
  })).describe('Recent family announcements or achievements.')
});
export type FamilyBriefInput = z.infer<typeof FamilyBriefInputSchema>;

const FamilyBriefOutputSchema = z.object({
  greeting: z.string().describe('A warm, personalized greeting.'),
  summary: z.string().describe('A 2-3 sentence overview of the day ahead.'),
  highlight: z.string().describe('One specific thing to look forward to or prioritize.'),
  encouragement: z.string().describe('A short motivational quote or family-centric advice.')
});
export type FamilyBriefOutput = z.infer<typeof FamilyBriefOutputSchema>;

const briefPrompt = ai.definePrompt({
  name: 'familyDailyBriefPrompt',
  input: { schema: FamilyBriefInputSchema },
  output: { schema: FamilyBriefOutputSchema },
  prompt: `You are the Kapendeka Universe AI Assistant. Your goal is to provide a helpful, warm, and concise daily brief for {{{userName}}}.

Use the following family data:
- Events: {{#each events}}{{{title}}} at {{{startTime}}}, {{/each}}
- Chores: {{#each chores}}{{{title}}} (assigned to {{{assignedTo}}}), {{/each}}
- News: {{#each recentNews}}'{{{title}}}' by {{{authorName}}}, {{/each}}

Create a briefing that:
1. Greets them warmly.
2. Summarizes the key activities for today.
3. Highlights a specific event or achievement.
4. Ends with a motivating thought tailored to a busy, loving family.

Keep the tone "Universe-themed", sophisticated but accessible.`,
});

const generateDailyBriefFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefFlow',
    inputSchema: FamilyBriefInputSchema,
    outputSchema: FamilyBriefOutputSchema,
  },
  async (input) => {
    const { output } = await briefPrompt(input);
    if (!output) throw new Error('Failed to generate brief.');
    return output;
  }
);

export async function generateDailyBrief(input: FamilyBriefInput): Promise<FamilyBriefOutput> {
  return generateDailyBriefFlow(input);
}
