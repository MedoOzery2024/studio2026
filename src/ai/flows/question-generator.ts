'use server';
/**
 * @fileOverview A flow for generating questions from an image or PDF content.
 *
 * - generateQuestions - A function that handles the question generation process.
 * - GenerateQuestionsInput - The input type for the function.
 * - GenerateQuestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options.'),
  explanation: z.string().describe('An explanation for why the answer is correct.'),
});

export const GenerateQuestionsInputSchema = z.object({
  fileDataUri: z.string().describe(
    "The content file (image or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  questionType: z.enum(['interactive', 'fixed']).describe('The type of questions to generate.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the questions.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

export const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('The array of generated questions.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;
export type GeneratedQuestion = z.infer<typeof QuestionSchema>;


export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const { fileDataUri, numQuestions, difficulty, questionType } = input;
    
    const prompt = `Based on the provided content, generate ${numQuestions} multiple-choice questions.
The difficulty level should be ${difficulty}.
The question type is '${questionType}'.
For each question, provide:
1. The question text.
2. An array of 4 distinct options. The options should be labeled A, B, C, D if the content is in English, or أ, ب, ج, د if in Arabic.
3. The correct answer.
4. A brief explanation for the correct answer.

The entire response must be in the same language as the provided document (Arabic or English).

Content to analyze:
{{media url=fileDataUri}}`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [ {text: prompt.replace('{{media url=fileDataUri}}', '')}, {media: {url: fileDataUri}}],
      output: {
        schema: GenerateQuestionsOutputSchema
      },
      system: "You are an expert in creating educational materials and exam questions from provided content."
    });

    return response.output || { questions: [] };
  }
);
