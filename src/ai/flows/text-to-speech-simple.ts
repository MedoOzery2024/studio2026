'use server';
/**
 * @fileOverview A simplified flow for converting text to speech.
 * This is used for playing back chat messages.
 *
 * - textToSpeechSimple - A function that handles the text-to-speech conversion.
 * - TextToSpeechSimpleInput - The input type for the function.
 * - TextToSpeechSimpleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const TextToSpeechSimpleInputSchema = z.object({
  text: z.string().describe("The text to convert to speech."),
});
export type TextToSpeechSimpleInput = z.infer<typeof TextToSpeechSimpleInputSchema>;

const TextToSpeechSimpleOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type TextToSpeechSimpleOutput = z.infer<typeof TextToSpeechSimpleOutputSchema>;


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


export async function textToSpeechSimple(input: TextToSpeechSimpleInput): Promise<TextToSpeechSimpleOutput> {
    const { text } = input;
    
    if (!text) {
        throw new Error("Input text cannot be empty.");
    }
    
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const voiceName = isArabic ? 'ar-XA-Standard-A' : 'en-US-Standard-E';

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
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio media returned from TTS model.');
    }
    
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
}
