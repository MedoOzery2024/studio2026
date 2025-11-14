'use server';
/**
 * @fileOverview A flow for generating video from text or image content.
 *
 * - generateVideo - Handles the video generation process.
 * - GenerateVideoInput - The input type for the function.
 * - GenerateVideoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { MediaPart } from 'genkit';


export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;
const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe("A text description of the desired video content."),
  fileDataUri: z.string().optional().describe(
    "An optional content file (image, PDF, or text) to base the video on, as a data URI."
  ),
  durationSeconds: z.number().default(5).describe("The duration of the video in seconds."),
  aspectRatio: z.string().default('16:9').describe("The aspect ratio of the video."),
});

export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;
const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe("The data URI of the generated video."),
});


export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
    const { prompt, fileDataUri, durationSeconds, aspectRatio } = input;
    
    // Determine the prompt parts
    const promptParts: (string | MediaPart)[] = [{text: prompt}];
    let extractedText = '';

    if (fileDataUri) {
      const mimeType = fileDataUri.substring(5, fileDataUri.indexOf(';'));
      if (mimeType.startsWith('image')) {
         promptParts.push({ media: { url: fileDataUri, contentType: mimeType } });
      } else {
        // If it's a PDF or text file, first extract text
        const textResponse = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt: [
            { text: "Extract all text from the following document. Respond only with the extracted text." },
            { media: { url: fileDataUri } }
          ],
        });
        extractedText = textResponse.text;
        
        // Add the extracted text to the main prompt
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
        // Wait for 5 seconds before checking the status again.
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

    // The URL returned is temporary and requires the API key for access.
    // We will fetch it server-side and return it as a data URI.
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
