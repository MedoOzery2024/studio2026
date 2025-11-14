'use server';
/**
 * @fileOverview A flow for generating video from text or image content.
 *
 * - generateVideo - Handles the video generation process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { MediaPart } from 'genkit';

// Input and Output schemas are now defined inside the function
// to comply with Next.js Server Action conventions.

export type GenerateVideoInput = {
  prompt: string;
  fileDataUri?: string;
  durationSeconds: number;
  aspectRatio: string;
};

export type GenerateVideoOutput = {
  videoUrl: string;
};

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
    const { prompt, fileDataUri, durationSeconds, aspectRatio } = input;
    
    const promptParts: (string | MediaPart)[] = [{text: prompt}];
    let extractedText = '';

    if (fileDataUri) {
      const mimeType = fileDataUri.substring(5, fileDataUri.indexOf(';'));
      if (mimeType.startsWith('image')) {
         promptParts.push({ media: { url: fileDataUri, contentType: mimeType } });
      } else {
        const textResponse = await ai.generate({
          prompt: [
            { text: "Extract all text from the following document. Respond only with the extracted text." },
            { media: { url: fileDataUri } }
          ],
        });
        extractedText = textResponse.text;
        
        const combinedPrompt = `Based on the following text, ${prompt}\n\nText: """${extractedText}"""`;
        promptParts[0] = {text: combinedPrompt};
      }
    }

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: promptParts,
        config: {
          durationSeconds: durationSeconds,
          aspectRatio: aspectRatio,
          personGeneration: 'allow_adult',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation for video generation.');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));
    if (!videoPart || !videoPart.media?.url) {
        throw new Error('Failed to find the generated video in the operation result.');
    }

    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
        `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse || videoDownloadResponse.status !== 200 || !videoDownloadResponse.body) {
        throw new Error('Failed to download the generated video from the temporary URL.');
    }
    
    const buffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    return {
        videoUrl: `data:video/mp4;base64,${base64Video}`,
    };
}
