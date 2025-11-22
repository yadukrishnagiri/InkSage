import axios from 'axios';
import { Message, NoteFile } from '../types';
import { authService } from './supabaseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get auth headers
const getAuthHeaders = async () => {
  const session = await authService.getSession();
  const headers: Record<string, string> = {};
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  // Also include guest session if no auth
  const guestSessionId = localStorage.getItem('guest_session_id');
  if (guestSessionId && !session) {
    headers['X-Guest-Session-ID'] = guestSessionId;
  }
  
  return headers;
};

export interface ChatResponse {
  text: string;
  citations: string[];
}

export interface FileDuplicateInfo {
  is_duplicate: boolean;
  existing_file_id?: string;
  existing_file_name?: string;
  similarity: number;
}

export interface ChunkDuplicateInfo {
  chunk_index: number;
  existing_file_name: string;
  similarity: number;
  chunk_text_preview: string;
}

export interface DuplicateDetectionResult {
  file_duplicate?: FileDuplicateInfo | null;
  chunk_duplicates: ChunkDuplicateInfo[];
  has_duplicates: boolean;
}

export interface FileUploadResponse {
  file_id: string;
  status: string;
  message: string;
  duplicate_info?: DuplicateDetectionResult | null;
}

export interface MultiFileUploadResponse {
  files: FileUploadResponse[];
  total: number;
  successful: number;
  failed: number;
}

export interface Subject {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
}

export const sendMessageToInkSage = async (
  currentMessage: string,
  subjectId: string,
  chatHistory: Message[]
): Promise<ChatResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.post<ChatResponse>('/api/chat/query', {
      query: currentMessage,
      subject_id: subjectId,
      chat_history: chatHistory.slice(-10), // Last 10 messages
    }, { headers });
    return response.data;
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Check if it's an axios error with a response
    if (error.response?.data?.detail) {
      // Backend returned a specific error message
      return {
        text: error.response.data.detail,
        citations: []
      };
    }
    
    // Generic error message
    return {
      text: "I encountered an error while analyzing your notes. Please check your backend configuration and try again.",
      citations: []
    };
  }
};

export interface StreamingChatCallbacks {
  onChunk: (text: string) => void;
  onCitations: (citations: string[]) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export const sendMessageToInkSageStream = async (
  currentMessage: string,
  subjectId: string,
  chatHistory: Message[],
  callbacks: StreamingChatCallbacks
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const authToken = headers['Authorization'];
    const guestSessionId = headers['X-Guest-Session-ID'];
    
    // Build request body
    const requestBody = {
      query: currentMessage,
      subject_id: subjectId,
      chat_history: chatHistory.slice(-10), // Last 10 messages
    };
    
    // Build headers for SSE
    const sseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      sseHeaders['Authorization'] = authToken;
    }
    if (guestSessionId) {
      sseHeaders['X-Guest-Session-ID'] = guestSessionId;
    }
    
    const response = await fetch(`${API_URL}/api/chat/query-stream`, {
      method: 'POST',
      headers: sseHeaders,
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body reader available');
    }
    
    let buffer = '';
    let citations: string[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'citations') {
              citations = parsed.citations || [];
              callbacks.onCitations(citations);
            } else if (parsed.type === 'chunk') {
              callbacks.onChunk(parsed.text || '');
            } else if (parsed.type === 'error') {
              callbacks.onError(parsed.text || 'Unknown error');
              return;
            } else if (parsed.type === 'done') {
              callbacks.onComplete();
              return;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, data);
          }
        }
      }
    }
    
    callbacks.onComplete();
  } catch (error: any) {
    console.error('Streaming Chat API Error:', error);
    const errorMessage = error.message || "I encountered an error while analyzing your notes. Please check your backend configuration and try again.";
    callbacks.onError(errorMessage);
  }
};

export const uploadFile = async (
  file: File,
  subjectId: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject_id', subjectId);

  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.post<FileUploadResponse>(
      '/api/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  subjectId: string,
  onProgress?: (progress: number) => void
): Promise<MultiFileUploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('subject_id', subjectId);

  try {
    const authHeaders = await getAuthHeaders();
    const response = await api.post<MultiFileUploadResponse>(
      '/api/files/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Multi-file upload error:', error);
    throw error;
  }
};

export const getFileStatus = async (fileId: string): Promise<{ status: string }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.get(`/api/files/${fileId}/status`, { headers });
    return response.data;
  } catch (error) {
    console.error('File status error:', error);
    throw error;
  }
};

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.get<Subject[]>('/api/subjects', { headers });
    return response.data;
  } catch (error) {
    console.error('Get subjects error:', error);
    return [];
  }
};

export const createSubject = async (name: string): Promise<Subject> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.post<Subject>('/api/subjects', { name }, { headers });
    return response.data;
  } catch (error) {
    console.error('Create subject error:', error);
    throw error;
  }
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
  try {
    await api.delete(`/api/subjects/${subjectId}`);
  } catch (error) {
    console.error('Delete subject error:', error);
    throw error;
  }
};

export const createGuestSession = async (): Promise<{ session_id: string; expires_at: string }> => {
  try {
    const response = await api.post('/api/guest/session');
    return response.data;
  } catch (error) {
    console.error('Create guest session error:', error);
    throw error;
  }
};

export const exportChatToPDF = async (
  subjectId: string,
  messages: Message[]
): Promise<Blob> => {
  try {
    const response = await api.post(
      '/api/chat/export-pdf',
      { subject_id: subjectId, messages },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
      console.error('Export PDF error:', error);
      throw error;
  }
};

export const getUserStorage = async (): Promise<{ storage_used: number }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.get<{ storage_used: number }>('/api/user/storage', { headers });
    return response.data;
  } catch (error) {
    console.error('Get user storage error:', error);
    // Return 0 if not logged in or error
    return { storage_used: 0 };
  }
};

