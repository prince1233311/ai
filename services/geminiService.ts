
import { GoogleGenAI, Part, Modality, VideoGenerationReferenceType, Tool } from "@google/genai";
import { ChatMode, MessagePart, Message } from "../types";

// Manual base64 decoding helper as required by guidelines
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual base64 encoding helper as required by guidelines
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Manual PCM decoding logic to avoid native AudioContext.decodeAudioData for raw streams
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Initialize AI client using the environmental API key.
 */
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

const transformPart = (part: MessagePart): Part | null => {
  if (part.text) return { text: part.text };
  
  if (part.inlineData && part.inlineData.data) {
    const cleanData = part.inlineData.data.includes(',') 
      ? part.inlineData.data.split(',')[1] 
      : part.inlineData.data;
      
    if (!cleanData) return null;

    return {
      inlineData: {
        mimeType: part.inlineData.mimeType,
        data: cleanData
      }
    };
  }
  return null;
};

const getSystemInstruction = (mode: ChatMode): string => {
  switch (mode) {
    case 'code':
      return "You are a senior staff software engineer. You write robust, clean, and highly performant code. You prefer TypeScript, React, and modern stacks. Always explain your architectural decisions briefly.";
    case 'image':
      return "You are a visual artist assistant. Your primary goal is to help users craft perfect prompts for image generation or explain visual concepts.";
    default:
      return "You are CrocSthepen AI, a helpful, witty, and highly intelligent assistant. You have access to Google Search to provide up-to-date information.";
  }
};

export const generateAIResponseStream = async function* (
  prompt: string, 
  history: Message[], 
  mode: ChatMode,
  userParts?: MessagePart[],
  useProModel: boolean = false
) {
  const ai = getAI();
  const model = useProModel ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  // Add Search Grounding for General mode
  const tools: Tool[] | undefined = mode === 'general' ? [{ googleSearch: {} }] : undefined;

  let contents = history.slice(-15).map(msg => {
    let parts: Part[] = [];
    if (msg.parts && msg.parts.length > 0) {
      msg.parts.forEach(p => {
        const transformed = transformPart(p);
        if (transformed) parts.push(transformed);
      });
    } else {
      parts.push({ text: msg.content });
    }
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts
    };
  });

  if (contents.length === 0 && prompt) {
     contents.push({
         role: 'user',
         parts: [{ text: prompt }]
     });
  }

  const responseStream = await ai.models.generateContentStream({
    model: model,
    contents: contents,
    config: {
      systemInstruction: getSystemInstruction(mode),
      tools: tools
    }
  });

  for await (const chunk of responseStream) {
    yield chunk;
  }
};

export const processImageRequest = async (prompt: string, inputImage?: { base64: string, mimeType: string }): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';

  try {
    const parts: Part[] = [];
    if (inputImage) {
      parts.push({
        inlineData: {
          mimeType: inputImage.mimeType,
          data: inputImage.base64
        }
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const respParts = response.candidates?.[0]?.content?.parts;
    if (respParts) {
      for (const part of respParts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string, 
  aspectRatio: '16:9' | '9:16', 
  refImageBase64?: string, 
  refImageMimeType?: string
): Promise<string> => {
  const ai = getAI();
  const model = refImageBase64 ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
  
  const cleanBase64 = refImageBase64 && refImageBase64.includes(',') 
    ? refImageBase64.split(',')[1] 
    : refImageBase64;

  try {
    let operation;
    if (refImageBase64 && refImageMimeType) {
      operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
          referenceImages: [{
            image: {
              imageBytes: cleanBase64!,
              mimeType: refImageMimeType
            },
            referenceType: VideoGenerationReferenceType.ASSET
          }]
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video URI not found.");
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Generation Failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};

export const generateWebsiteStream = async function* (prompt: string, history: Message[]) {
  const ai = getAI();
  const model = 'gemini-3-pro-preview'; 

  const contents = history.slice(-5).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const responseStream = await ai.models.generateContentStream({
    model: model,
    contents: contents,
    config: {
      systemInstruction: "You are an expert Frontend Engineer. You write single-file HTML/JS/CSS solutions using TailwindCSS and FontAwesome via CDN.",
    }
  });

  for await (const chunk of responseStream) {
    yield chunk;
  }
};

export const connectLiveSession = async (
  onOpen: () => void,
  onMessage: (message: any) => void,
  onError: (e: any) => void,
  onClose: (e: any) => void,
  voiceName: string = 'Zephyr'
) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onerror: onError,
      onclose: onClose
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {prebuiltVoiceConfig: {voiceName: voiceName}},
      },
      systemInstruction: 'You are CrocSthepen AI, a helpful and witty voice assistant.',
    },
  });
};
