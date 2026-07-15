'use server';
/**
 * @fileOverview A Genkit flow for interpreting natural language commands to quickly add shopping list items or create tasks.
 *
 * - naturalLanguageQuickAdd - A function that processes a natural language command and categorizes it as a shopping list item or a task.
 * - NaturalLanguageQuickAddInput - The input type for the naturalLanguageQuickAdd function.
 * - NaturalLanguageQuickAddOutput - The return type for the naturalLanguageQuickAdd function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageQuickAddInputSchema = z.object({
  command: z.string().describe("The natural language command to process, e.g., 'Add milk to groceries' or 'Remind John to take out the trash tomorrow'."),
  familyId: z.string().describe("The ID of the family making the request."),
  userId: z.string().describe("The ID of the user making the request."),
  familyMembers: z.array(z.object({
    userId: z.string(),
    displayName: z.string(),
  })).optional().describe("Optional list of family members (userId and displayName) to help resolve assignedTo names.")
});
export type NaturalLanguageQuickAddInput = z.infer<typeof NaturalLanguageQuickAddInputSchema>;

const NaturalLanguageQuickAddOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("shoppingList"),
    listName: z.string().describe("The name of the shopping list, e.g., 'Groceries', 'Hardware', 'Toiletries'. Default to 'Groceries' if not specified in the command."),
    itemName: z.string().describe("The item to add to the shopping list."),
    quantity: z.number().optional().describe("The consolidated quantity of the item."),
    unit: z.string().optional().describe("The unit of measurement for the quantity, e.g., 'litres', 'kg', 'packs'. Optional."),
    category: z.string().optional().describe("The category of the item, e.g., 'Dairy', 'Produce', 'Cleaning'. Optional.")
  }),
  z.object({
    type: z.literal("todo"),
    title: z.string().describe("The title of the task."),
    assignedTo: z.string().optional().describe("The user ID of the person assigned to the task. If a specific family member's display name is mentioned (e.g., 'John'), find their 'userId' from the 'familyMembers' list provided in the input. If the command is generic (e.g., 'take out trash'), default to the user making the request ({{{userId}}}). If the task is explicitly for 'everyone' or 'family', set this to 'all'. If a specific name is mentioned but no matching 'userId' is found, return the mentioned display name as a string."),
    dueDate: z.string().optional().describe("The due date for the task in ISO 8601 format (YYYY-MM-DD). Use today's date if 'today' is mentioned. Use tomorrow's date if 'tomorrow' is mentioned. Be smart about relative dates like 'next week' or 'next month'."),
    isShared: z.boolean().default(true).describe("Whether the task is shared with the family (true) or private (false). Default to true if not specified."),
    priority: z.enum(["high", "medium", "low"]).default("medium").optional().describe("The priority of the task. Default to 'medium' if not specified.")
  })
]);
export type NaturalLanguageQuickAddOutput = z.infer<typeof NaturalLanguageQuickAddOutputSchema>;

export async function naturalLanguageQuickAdd(input: NaturalLanguageQuickAddInput): Promise<NaturalLanguageQuickAddOutput> {
  return naturalLanguageQuickAddFlow(input);
}

const quickAddPrompt = ai.definePrompt({
  name: 'naturalLanguageQuickAddPrompt',
  input: {schema: NaturalLanguageQuickAddInputSchema},
  output: {schema: NaturalLanguageQuickAddOutputSchema},
  prompt: `You are an intelligent assistant for the Kapendeka Family Hub application. Your task is to interpret a natural language command and categorize it as either adding an item to a 'shoppingList' or creating a 'todo' task. Then, extract the relevant details in a structured JSON format according to the provided schema.

If the command implies adding something to a list (e.g., 'add milk', 'buy bread', 'get dog food'), categorize it as 'shoppingList'.
If the command implies an action to be done (e.g., 'remind John', 'take out the trash', 'clean the room'), categorize it as 'todo'.

You must output a JSON object that strictly adheres to one of the following schemas based on the command type:

**For 'shoppingList' commands:**
json
{
  "type": "shoppingList",
  "listName": "string", // The name of the shopping list, e.g., 'Groceries', 'Hardware', 'Toiletries'. Default to 'Groceries' if not specified in the command.
  "itemName": "string", // The item to add to the shopping list.
  "quantity": "number", // Optional. The quantity of the item, if specified. Default to 1 if not specified.
  "unit": "string", // Optional. The unit of measurement for the quantity, e.g., 'litres', 'kg', 'packs'.
  "category": "string" // Optional. The category of the item, e.g., 'Dairy', 'Produce', 'Cleaning'.
}

**For 'todo' commands:**
json
{
  "type": "todo",
  "title": "string", // The title of the task.
  "assignedTo": "string", // Optional. The user ID of the person assigned to the task. If a specific family member's display name is mentioned (e.g., 'John'), find their 'userId' from the 'familyMembers' list provided in the input. If the command is generic (e.g., 'take out trash'), default to the user making the request ({{{userId}}}). If the task is explicitly for 'everyone' or 'family', set this to 'all'. If a specific name is mentioned but no matching 'userId' is found, return the mentioned display name as a string.
  "dueDate": "string", // Optional. The due date for the task in ISO 8601 format (YYYY-MM-DD). Use today's date if 'today' is mentioned. Use tomorrow's date if 'tomorrow' is mentioned. Be smart about relative dates like 'next week' or 'next month'.
  "isShared": "boolean", // Whether the task is shared with the family (true) or private (false). Default to true if not specified.
  "priority": "string" // Optional. The priority of the task: 'high', 'medium', 'low'. Default to 'medium' if not specified.
}

Current User ID: {{{userId}}}
Family ID: {{{familyId}}}
Family Members:
{{#each familyMembers}}
- Display Name: "{{{this.displayName}}}", User ID: "{{{this.userId}}}"
{{/each}}

Command: "{{{command}}}"

Ensure the output is valid JSON and contains only the JSON object. Do not include any additional text or formatting outside the JSON.`
});

const naturalLanguageQuickAddFlow = ai.defineFlow(
  {
    name: 'naturalLanguageQuickAddFlow',
    inputSchema: NaturalLanguageQuickAddInputSchema,
    outputSchema: NaturalLanguageQuickAddOutputSchema,
  },
  async input => {
    const {output} = await quickAddPrompt(input);
    return output!;
  }
);
