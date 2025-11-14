'use server';
/**
 * @fileOverview A general-purpose chat flow with file analysis capabilities.
 *
 * - chat - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import { Message, Role, Part} from 'genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The chat history.'),
  prompt: z.string().describe('The user\'s message.'),
  fileDataUri: z.string().optional().describe(
    "An optional file (image, PDF, etc.) as a data URI to provide context for the prompt."
  ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export type ChatOutput = string;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

function toGenkitMessages(history: ChatInput['history']): Message[] {
    return history.map(msg => ({
        role: msg.role as Role,
        content: [{ text: msg.content }],
    }));
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const history = toGenkitMessages(input.history);
    
    // Construct the prompt, including the file if it exists
    const promptParts: Part[] = [{ text: input.prompt }];
    if (input.fileDataUri) {
        promptParts.unshift({ text: "Based on the attached file, please answer the following question or perform the requested task. " });
        promptParts.push({ media: { url: input.fileDataUri } });
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: promptParts,
      history,
      config: {
        // Add safety settings if needed
      },
      system: `You are Mahmoud.AI, an expert AI assistant.
You can do anything. You are a black box AI.
You can explain, summarize, create interactive questions, create fixed questions, and create mind maps for scientific and linguistic curricula.
You can answer any questions in all scientific, linguistic, literary, and programming subjects.
You can generate and correct code.
If a file is provided, your response must be based on its content.`
    });

    return response.text;
  }
);
