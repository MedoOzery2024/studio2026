'use server';
/**
 * @fileOverview A flow for generating a PowerPoint presentation from image or PDF content.
 *
 * - generatePresentation - Handles the presentation generation process.
 * - GeneratePresentationInput - The input type for the function.
 * - GeneratePresentationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export type GeneratePresentationInput = z.infer<typeof GeneratePresentationInputSchema>;
const GeneratePresentationInputSchema = z.object({
  fileDataUri: z.string().describe(
    "The content file (image or PDF) as a data URI."
  ),
});

const SlideSchema = z.object({
  title: z.string().describe('The title for this slide.'),
  points: z.array(z.string()).describe('An array of bullet points for the slide body.'),
});

export type GeneratePresentationOutput = z.infer<typeof GeneratePresentationOutputSchema>;
const GeneratePresentationOutputSchema = z.object({
  title: z.string().describe('The main title for the entire presentation.'),
  slides: z.array(SlideSchema).describe('An array of slides.'),
});

export async function generatePresentation(input: GeneratePresentationInput): Promise<GeneratePresentationOutput> {
    const { fileDataUri } = input;
    
    const prompt = `Analyze the provided content and generate a structured presentation.
1.  Create a main title for the entire presentation.
2.  Create a series of slides. Each slide must have a 'title' and a 'points' array for bullet points.
3.  Break down the content logically into different slides. Each slide should cover a specific topic or sub-topic.
4.  The bullet points should be concise and summarize the key information.
5.  The entire response must be in the same language as the provided document (e.g., Arabic or English).

Content to analyze is attached.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { text: prompt },
        { media: { url: fileDataUri } }
      ],
      output: {
        schema: GeneratePresentationOutputSchema
      },
      system: "You are an expert in summarizing documents and creating structured PowerPoint presentations."
    });

    const output = response.output;
    if (!output) {
      throw new Error("The AI failed to generate a presentation structure.");
    }
    return output;
}
