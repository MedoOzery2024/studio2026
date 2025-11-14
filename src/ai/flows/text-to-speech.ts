'use server';
/**
 * @fileOverview A flow for converting text from a document to speech.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the function.
 * - TextToSpeechOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  fileDataUri: z.string().describe(
    "The content file (image or PDF) as a data URI that must include a MIME type and use Base64 encoding."
  ),
  voice: z.enum(['male', 'female']).describe('The desired voice for the speech output.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    // 1. Extract text from the document
    const { fileDataUri, voice } = input;
    const textResponse = await ai.generate({
      model: 'googleai/gemini-2.5-pro',
      prompt: [
        { text: "Extract all text from the following document. Respond only with the extracted text, no additional commentary. The entire response must be in the same language as the provided document (e.g., Arabic or English)." },
        { media: { url: fileDataUri } }
      ],
    });
    const extractedText = textResponse.text;
    
    if (!extractedText) {
        throw new Error("Could not extract text from the document.");
    }
    
    // 2. Convert the extracted text to speech
    const isArabic = /[\u0600-\u06FF]/.test(extractedText);
    const voiceName = isArabic 
        ? (voice === 'male' ? 'ar-XA-Standard-B' : 'ar-XA-Standard-A')
        : (voice === 'male' ? 'en-US-Standard-D' : 'en-US-Standard-E');


    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
      prompt: extractedText,
    });

    if (!media) {
      throw new Error('No audio media returned from TTS model.');
    }
    
    // Convert PCM to WAV
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
}
