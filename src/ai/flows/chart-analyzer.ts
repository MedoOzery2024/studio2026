'use server';
/**
 * @fileOverview A flow for analyzing charts and graphs from images or PDFs.
 *
 * - analyzeChart - A function that handles the chart analysis process.
 * - AnalyzeChartInput - The input type for the function.
 * - AnalyzeChartOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input and Output schemas are now defined inside the function
// to comply with Next.js Server Action conventions.

export type AnalyzeChartInput = {
  fileDataUri: string;
};

export type AnalyzeChartOutput = {
  title: string;
  summary: string;
  table: {
    headers: string[];
    rows: string[][];
  };
};

export async function analyzeChart(input: AnalyzeChartInput): Promise<AnalyzeChartOutput> {
  const TableRowSchema = z.array(z.string());

  const AnalyzeChartOutputSchema = z.object({
      title: z.string().describe("The title of the chart."),
      summary: z.string().describe("A detailed summary and interpretation of the chart's data and trends. This must be in the same language as the chart itself (e.g., Arabic or English)."),
      table: z.object({
          headers: z.array(z.string()).describe("The headers for the data table. This must be in the same language as the chart itself (e.g., Arabic or English)."),
          rows: z.array(TableRowSchema).describe("The rows of data from the chart."),
      }).describe("The data extracted from the chart in a tabular format.")
  });

  const { fileDataUri } = input;

  const prompt = `You are an expert data analyst. Analyze the chart provided in the content.
1.  Identify the title of the chart.
2.  Write a detailed summary and interpretation of the chart's data, trends, and key insights.
3.  Extract the data from the chart and structure it as a table with headers and rows.
4.  The entire response (title, summary, headers, rows) must be in the same language as the provided document (e.g., Arabic or English).

Content to analyze is attached.`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.5-pro',
    prompt: [
      { text: prompt },
      { media: { url: fileDataUri } }
    ],
    output: {
      schema: AnalyzeChartOutputSchema
    },
    system: "You are an expert data analyst specializing in extracting structured data from charts and graphs."
  });

  const output = response.output;
  if (!output) {
    throw new Error("The AI failed to analyze the chart.");
  }
  return output;
}
