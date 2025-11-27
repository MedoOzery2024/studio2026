'use server';
/**
 * @fileOverview A general-purpose chat flow with file analysis capabilities and tool integration.
 *
 * - chat - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import { Message, Role, Part} from 'genkit';
import { z } from 'zod';
import { generatePresentation } from './content-to-ppt';
import { analyzeChart } from './chart-analyzer';
import { textToSpeech } from './text-to-speech';
import { generateVideo } from './video-generator';
import { summarizeDocument } from './document-summarizer';

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

// Define tools for the AI model
const createPresentationTool = ai.defineTool(
  {
    name: 'createPresentation',
    description: 'Create a PowerPoint presentation from the content of a document or image. The user must provide a file.',
    inputSchema: z.object({ fileDataUri: z.string() }),
    outputSchema: z.any(),
  },
  async ({ fileDataUri }) => generatePresentation({ fileDataUri })
);

const analyzeChartTool = ai.defineTool(
  {
    name: 'analyzeChart',
    description: 'Analyze a chart or graph from an image or PDF. Extracts title, summary, and data into a table. The user must provide a file.',
    inputSchema: z.object({ fileDataUri: z.string() }),
    outputSchema: z.any(),
  },
  async ({ fileDataUri }) => analyzeChart({ fileDataUri })
);

const convertToSpeechTool = ai.defineTool(
  {
    name: 'convertToSpeech',
    description: 'Convert the text content of a document or image into speech and return the audio file data. The user must provide a file.',
    inputSchema: z.object({ fileDataUri: z.string() }),
    outputSchema: z.any(),
  },
  async ({ fileDataUri }) => textToSpeech({ fileDataUri })
);

const createVideoTool = ai.defineTool(
  {
    name: 'createVideo',
    description: 'Create an educational video from a text prompt and the content of a document or image. The user must provide a file and a text prompt.',
    inputSchema: z.object({ 
      prompt: z.string(),
      fileDataUri: z.string(),
      durationSeconds: z.number().default(5),
      aspectRatio: z.string().default('16:9'),
    }),
    outputSchema: z.any(),
  },
  async (input) => generateVideo(input)
);

const summarizeDocumentTool = ai.defineTool(
    {
        name: 'summarizeDocument',
        description: 'Summarize the content of a document or an image. The user must provide a file.',
        inputSchema: z.object({ fileDataUri: z.string() }),
        outputSchema: z.any(),
    },
    async ({ fileDataUri }) => summarizeDocument({ fileDataUri })
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
    const history = toGenkitMessages(input.history);
    
    // Construct the prompt, including the file if it exists
    const promptParts: Part[] = [{ text: input.prompt }];
    if (input.fileDataUri) {
        promptParts.push({ media: { url: input.fileDataUri } });
    }

    const response = await ai.generate({
      prompt: promptParts,
      history,
      tools: [createPresentationTool, analyzeChartTool, convertToSpeechTool, createVideoTool, summarizeDocumentTool],
      model: 'googleai/gemini-2.5-pro',
      system: `You are Mahmoud.AI, an expert AI assistant with a powerful set of tools.
- You can explain, summarize, create interactive questions, create fixed questions, and create mind maps for scientific and linguistic curricula.
- You can answer any questions in all scientific, linguistic, literary, and programming subjects.
- You can generate and correct code.
- If the user asks you to perform a specific task like creating a presentation, analyzing a chart, converting text to speech, creating a video, or summarizing a document, you MUST use the provided tools.
- When a tool is used, inform the user that the task is complete and provide them with the result (e.g., download link, analysis data). If a tool returns a file (like audio or video), tell the user the file is ready to be downloaded.
- If a file (image or PDF) is provided with a general question, you MUST analyze the content of that file and base your entire response on it. Do not answer from general knowledge if a file is present.`
    });
    
    // Handle tool calls
    const toolResponse = response.toolRequest;
    if (toolResponse) {
        const toolResult = await toolResponse.run();
        // Here you can format the tool result to be more user-friendly
        // For now, we'll just return a confirmation message.
        if(toolResult?.videoUrl || toolResult?.audioDataUri || (toolResult?.title && toolResult?.slides)) {
             return `انتهت المهمة! الملف الناتج جاهز. ${JSON.stringify(toolResult)}`;
        }
        return `انتهت المهمة! هذه هي النتيجة: ${JSON.stringify(toolResult)}`;
    }

    return response.text;
}
