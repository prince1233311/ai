
export type ChatMode = 'general' | 'image' | 'code';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Added for auth management
  avatar: string;
  credits: number;
  lastDailyClaim?: number;
  tasksCompleted?: string[];
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
  videoUrl?: string;
  imageUrl?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
  timestamp: number;
  isGenerating?: boolean;
  groundingMetadata?: {
    groundingChunks: GroundingChunk[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  mode: ChatMode;
  messages: Message[];
  updatedAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
