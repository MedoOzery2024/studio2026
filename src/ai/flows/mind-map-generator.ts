'use server';
/**
 * @fileOverview A flow for generating mind maps from an image or PDF content.
 *
 * - generateMindMap - A function that handles the mind map generation process.
 * - GenerateMindMapInput - The input type for the function.
 * - MindMapNode - The return type for the function, representing the mind map structure.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input and Output schemas are now defined inside the function
// to comply with Next.js Server Action conventions.

export type GenerateMindMapInput = {
  fileDataUri: string;
};

export type MindMapNode = {
  title: string;
  details: string;
  subIdeas?: MindMapNode[];
};

export async function generateMindMap(input: GenerateMindMapInput): Promise<MindMapNode> {
    // We define a recursive schema for the mind map nodes
    const MindMapNodeSchema: z.ZodType<MindMapNode> = z.object({
        title: z.string().describe('The main idea or title of this node.'),
        details: z.string().describe('Detailed information or explanation for this node.'),
        subIdeas: z.array(z.lazy(() => MindMapNodeSchema)).optional().describe('An array of nested sub-ideas.'),
    });

    const GenerateMindMapOutputSchema = MindMapNodeSchema;
    
    const { fileDataUri } = input;
    
    const prompt = `Analyze the provided content and generate a hierarchical mind map structure.
The root object should represent the central theme.
Each node in the mind map must have a 'title' (the core concept), 'details' (a comprehensive explanation of the concept), and an optional 'subIdeas' array for branching out.
Ensure that the mind map is detailed and not just limited to main and sub-ideas without explanations.
The entire response must be in the same language as the provided document (e.g., Arabic or English).

Content to analyze is attached.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-pro',
      prompt: [
        { text: prompt },
        { media: { url: fileDataUri } }
      ],
      output: {
        schema: GenerateMindMapOutputSchema
      },
      system: "You are an expert in creating detailed and structured mind maps from various content formats."
    });

    const output = response.output;
    if (!output) {
      throw new Error("The AI failed to generate a mind map structure.");
    }
    return output;
}
