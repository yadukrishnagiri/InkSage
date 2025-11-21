export interface NoteFile {
  id: string;
  name: string;
  content: string; // For this demo, we extract text on client side
  type: 'pdf' | 'doc' | 'txt';
  timestamp: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  files: NoteFile[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  citations?: string[]; // Names of files used
}

export interface ChatSession {
  subjectId: string;
  messages: Message[];
}

export type ViewState = 'landing' | 'app';