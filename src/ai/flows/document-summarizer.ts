'use server';
/**
 * @fileOverview A flow for summarizing documents (PDF) or images.
 *
 * - summarizeDocument - A function that handles the document/image summarization process.
 * - SummarizeDocumentInput - The input type for the function.
 * - SummarizeDocumentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export type SummarizeDocumentInput = {
  fileDataUri: string;
};

export type SummarizeDocumentOutput = {
  summary: string;
};

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  const SummarizeDocumentOutputSchema = z.object({
    summary: z.string().describe('A concise summary of the document/image content. The summary must be in the same language as the content (e.g., Arabic or English).'),
  });
  
  const { fileDataUri } = input;
  
  const prompt = `Please provide a concise summary for the following content.
The summary must be in the same language as the content itself.

Content to analyze is attached.`;

  const response = await ai.generate({
    prompt: [
      { text: prompt },
      { media: { url: fileDataUri } }
    ],
    output: {
      schema: SummarizeDocumentOutputSchema
    },
    model: 'googleai/gemini-2.5-pro',
    system: "You are an expert at reading documents and images and providing concise summaries."
  });
  
  const output = response.output;
  if (!output) {
    throw new Error("The AI failed to generate a summary.");
  }
  return output;
}
