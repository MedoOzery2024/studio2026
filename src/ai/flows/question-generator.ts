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

export type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type GenerateQuestionsInput = {
  fileDataUri: string;
  questionType: 'interactive' | 'fixed';
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type GenerateQuestionsOutput = {
  questions: GeneratedQuestion[];
};

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
    const QuestionSchema = z.object({
      question: z.string().describe('The question text.'),
      options: z.array(z.string()).describe('An array of 4 possible answers.'),
      correctAnswer: z.string().describe('The correct answer from the options.'),
      explanation: z.string().describe('An explanation for why the answer is correct.'),
    });

    const GenerateQuestionsOutputSchema = z.object({
      questions: z.array(QuestionSchema).describe('The array of generated questions.'),
    });

    const { fileDataUri, numQuestions, difficulty } = input;
    
    let promptText = `Based on the provided content, generate ${numQuestions} multiple-choice questions.
The difficulty level should be ${difficulty}.
The entire response must be in the same language as the provided document (Arabic or English).

For each question, provide:
1. The question text.
2. An array of 4 distinct options.
3. The correct answer from the options.
4. A brief explanation for the correct answer.
If the content is in English, options should be labeled A, B, C, D. If in Arabic, use أ, ب, ج, د.`;

    const response = await ai.generate({
      prompt: [
        { text: promptText },
        { media: { url: fileDataUri } }
      ],
      output: {
        schema: GenerateQuestionsOutputSchema
      },
      model: 'googleai/gemini-2.5-pro',
      system: "You are an expert in creating educational materials and exam questions from provided content."
    });

    return response.output || { questions: [] };
}
