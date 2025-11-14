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

export type SpeechToTextAndSummarizeInput = {
  audioDataUri: string;
  existingText?: string;
};

export type SpeechToTextAndSummarizeOutput = {
  transcription: string;
  summary: string;
};

export async function speechToTextAndSummarize(input: SpeechToTextAndSummarizeInput): Promise<SpeechToTextAndSummarizeOutput> {
    let transcription = input.existingText || '';

    if (input.audioDataUri) {
        const transcribeResponse = await ai.generate({
            prompt: [
                { text: "Transcribe the following audio recording in Arabic. Provide only the transcribed text, with no additional commentary." },
                { media: { url: input.audioDataUri } }
            ],
            model: 'googleai/gemini-2.5-pro',
        });
        transcription = transcribeResponse.text;
    }
    
    if (!transcription) {
        return { transcription: '', summary: '' };
    }

    const summarizeResponse = await ai.generate({
        prompt: `Please provide a concise summary in Arabic for the following text:\n\n${transcription}`,
        system: 'You are an expert summarizer.',
        model: 'googleai/gemini-2.5-pro',
    });
    
    const summary = summarizeResponse.text;

    return { transcription, summary };
}
