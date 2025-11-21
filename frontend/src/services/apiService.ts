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

