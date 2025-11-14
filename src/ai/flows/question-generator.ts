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


export type GeneratedQuestion = z.infer<typeof QuestionSchema>;
const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options.'),
  explanation: z.string().describe('An explanation for why the answer is correct.'),
});


export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;
const GenerateQuestionsInputSchema = z.object({
  fileDataUri: z.string().describe(
    "The content file (image or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  questionType: z.enum(['interactive', 'fixed']).describe('The type of questions to generate.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the questions.'),
});

export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;
const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('The array of generated questions.'),
});


export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const { fileDataUri, numQuestions, difficulty, questionType } = input;
    
    let promptText = `Based on the provided content, generate ${numQuestions} multiple-choice questions.
The difficulty level should be ${difficulty}.
The entire response must be in the same language as the provided document (Arabic or English).`;

    if (questionType === 'fixed') {
        promptText += `\nFor each question, provide:
1. The question text.
2. An array of 4 distinct options. The options should be labeled A, B, C, D if the content is in English, or أ, ب, ج, د if in Arabic.
3. The correct answer.
4. A brief explanation for the correct answer.`;
    } else { // interactive
        promptText += `\nFor each question, provide:
1. The question text.
2. An array of 4 distinct options.
3. The correct answer.
4. A very brief explanation for the correct answer (will be shown after the user answers).`;
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { text: promptText },
        { media: { url: fileDataUri } }
      ],
      output: {
        schema: GenerateQuestionsOutputSchema
      },
      system: "You are an expert in creating educational materials and exam questions from provided content."
    });

    return response.output || { questions: [] };
}
