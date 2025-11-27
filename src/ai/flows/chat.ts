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
    inputSchema: z.object({}), // Input is now implicit from the context
    outputSchema: z.any(),
  },
  async () => {
      // The implementation will receive the fileDataUri from the main chat function
      return {tool: 'createPresentation'};
  }
);

const analyzeChartTool = ai.defineTool(
  {
    name: 'analyzeChart',
    description: 'Analyze a chart or graph from an image or PDF. Extracts title, summary, and data into a table. The user must provide a file.',
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  async () => {
    return {tool: 'analyzeChart'};
  }
);

const convertToSpeechTool = ai.defineTool(
  {
    name: 'convertToSpeech',
    description: 'Convert the text content of a document or image into speech and return the audio file data. The user must provide a file.',
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  async () => {
    return {tool: 'convertToSpeech'};
  }
);

const createVideoTool = ai.defineTool(
  {
    name: 'createVideo',
    description: 'Create an educational video from a text prompt and the content of a document or image. The user must provide a file and a text prompt.',
    inputSchema: z.object({ 
      prompt: z.string().describe("The user's creative direction for the video."),
      durationSeconds: z.number().default(5),
      aspectRatio: z.string().default('16:9'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    // We pass the input along to be combined with the file URI later.
    return {tool: 'createVideo', ...input};
  }
);

const summarizeDocumentTool = ai.defineTool(
    {
        name: 'summarizeDocument',
        description: 'Summarize the content of a document or an image. The user must provide a file for summarization.',
        inputSchema: z.object({}),
        outputSchema: z.any(),
    },
    async () => {
      return {tool: 'summarizeDocument'};
    }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
    const { history: messageHistory, prompt, fileDataUri } = input;
    const history = toGenkitMessages(messageHistory);
    
    // Construct the prompt, including the file if it exists
    const promptParts: Part[] = [{ text: prompt }];
    if (fileDataUri) {
        promptParts.push({ media: { url: fileDataUri } });
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
- If the user provides a file and asks for a summary, you MUST use the summarizeDocumentTool.
- When a tool is used, inform the user that the task is complete and provide them with the result (e.g., download link, analysis data). If a tool returns a file (like audio or video), tell the user the file is ready to be downloaded.
- If a file (image or PDF) is provided with a general question, you MUST analyze the content of that file and base your entire response on it. Do not answer from general knowledge if a file is present.`
    });
    
    const toolRequest = response.toolRequest;
    if (toolRequest) {
      const toolResponse = await toolRequest.run();
      let finalResult;
      
      // We check if a file was provided, as most tools require it.
      if (!fileDataUri) {
          return "Please provide a file to use this feature.";
      }

      if (toolResponse.tool === 'createPresentation') {
        finalResult = await generatePresentation({ fileDataUri });
      } else if (toolResponse.tool === 'analyzeChart') {
        finalResult = await analyzeChart({ fileDataUri });
      } else if (toolResponse.tool === 'convertToSpeech') {
        finalResult = await textToSpeech({ fileDataUri });
      } else if (toolResponse.tool === 'summarizeDocument') {
        finalResult = await summarizeDocument({ fileDataUri });
      } else if (toolResponse.tool === 'createVideo') {
        finalResult = await generateVideo({ 
            prompt: toolResponse.prompt, 
            fileDataUri,
            durationSeconds: toolResponse.durationSeconds,
            aspectRatio: toolResponse.aspectRatio,
        });
      }

      if (finalResult) {
         if(finalResult?.videoUrl || finalResult?.audioDataUri || (finalResult?.title && finalResult?.slides)) {
             return `انتهت المهمة! الملف الناتج جاهز. ${JSON.stringify(finalResult)}`;
        }
        return `انتهت المهمة! هذه هي النتيجة: ${JSON.stringify(finalResult)}`;
      }
    }

    return response.text;
}
