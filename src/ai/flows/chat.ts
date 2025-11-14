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

// Input and Output types are now defined directly
// to comply with Next.js Server Action conventions.

export type ChatInput = {
  history: {
    role: 'user' | 'model';
    content: string;
  }[];
  prompt: string;
  fileDataUri?: string;
};

export type ChatOutput = string;

function toGenkitMessages(history: ChatInput['history']): Message[] {
    return history.map(msg => ({
        role: msg.role as Role,
        content: [{ text: msg.content }],
    }));
}

export async function chat(input: ChatInput): Promise<ChatOutput> {
    const history = toGenkitMessages(input.history);
    
    // Construct the prompt, including the file if it exists
    const promptParts: Part[] = [{ text: input.prompt }];
    if (input.fileDataUri) {
        promptParts.unshift({ text: "Based on the attached file, please answer the following question or perform the requested task. " });
        promptParts.push({ media: { url: input.fileDataUri } });
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-pro',
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
