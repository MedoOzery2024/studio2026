'use server';
/**
 * @fileOverview A flow for converting text from a document to speech.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

// Input and Output types are now defined inside the function
// to comply with Next.js Server Action conventions.

export type TextToSpeechInput = {
  fileDataUri: string;
  voice: 'male' | 'female';
};

export type TextToSpeechOutput = {
  audioDataUri: string;
};


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
        { text: "Extract all text from the following document. Be precise and clean in your output. Respond only with the extracted text, with no additional commentary or formatting. The entire response must be in the same language as the provided document (e.g., Arabic or English)." },
        { media: { url: fileDataUri } }
      ],
    });
    const extractedText = textResponse.text;
    
    if (!extractedText || extractedText.trim().length < 10) { // Check if the extracted text is substantial
        throw new Error("Could not extract sufficient text from the document. Please try a different file.");
    }
    
    // 2. Convert the extracted text to speech
    // Using more natural-sounding voices
    const voiceName = voice === 'male' ? 'puck' : 'gem-sapphire';

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
      throw new Error('No audio media returned from TTS model. The text might be too long or in an unsupported format.');
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
