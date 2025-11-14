'use server';
/**
 * @fileOverview A flow for transcribing and summarizing audio.
 *
 * - speechToTextAndSummarize - A function that handles audio transcription and summarization.
 * - SpeechToTextAndSummarizeInput - The input type for the function.
 * - SpeechToTextAndSummarizeOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SpeechToTextAndSummarizeInputSchema = z.object({
  audioDataUri: z.string().describe(
    "An audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Can be an empty string if existingText is provided."
  ),
  existingText: z.string().optional().describe('Existing text to summarize directly, bypassing transcription.')
});
export type SpeechToTextAndSummarizeInput = z.infer<typeof SpeechToTextAndSummarizeInputSchema>;

export const SpeechToTextAndSummarizeOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
  summary: z.string().describe('The summary of the transcribed text.'),
});
export type SpeechToTextAndSummarizeOutput = z.infer<typeof SpeechToTextAndSummarizeOutputSchema>;

export async function speechToTextAndSummarize(input: SpeechToTextAndSummarizeInput): Promise<SpeechToTextAndSummarizeOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextAndSummarizeInputSchema,
    outputSchema: SpeechToTextAndSummarizeOutputSchema,
  },
  async (input) => {
    let transcription = input.existingText || '';

    if (input.audioDataUri) {
        const transcribeResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: [
                { text: "Transcribe the following audio recording in Arabic. Provide only the transcribed text, with no additional commentary." },
                { media: { url: input.audioDataUri } }
            ],
        });
        transcription = transcribeResponse.text;
    }
    
    if (!transcription) {
        return { transcription: '', summary: '' };
    }

    const summarizeResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Please provide a concise summary in Arabic for the following text:\n\n${transcription}`,
        system: 'You are an expert summarizer.'
    });
    
    const summary = summarizeResponse.text;

    return { transcription, summary };
  }
);
