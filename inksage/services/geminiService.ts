import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, NoteFile } from "../types";

// Initialize the client
// NOTE: In a real production app, you would proxy this through a backend.
// For this demo, we use the key from process.env directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const sendMessageToInkSage = async (
  currentMessage: string,
  files: NoteFile[],
  chatHistory: Message[]
): Promise<{ text: string; citations: string[] }> => {
  if (!process.env.API_KEY) {
    return {
      text: "Error: API Key is missing. Please configure process.env.API_KEY.",
      citations: []
    };
  }

  // Construct context from files
  // In a real RAG system, this would be a vector search.
  // Here, we fit what we can into the context window (Gemini 2.5 Flash has a huge window).
  let contextStr = "Here are the user's uploaded notes:\n\n";
  files.forEach(file => {
    contextStr += `--- START FILE: ${file.name} ---\n`;
    contextStr += file.content.substring(0, 50000); // Safety truncation for demo
    contextStr += `\n--- END FILE: ${file.name} ---\n\n`;
  });

  const systemInstruction = `
    You are InkSage, a private AI study tutor. 
    
    RULES:
    1. You must answer ONLY based on the content provided in the "uploaded notes". 
    2. If the answer is not in the notes, you must state: "I couldn't find that information in your uploaded notes."
    3. Do not use external knowledge (internet, general facts) unless it strictly clarifies a concept found in the notes.
    4. Be academic, encouraging, and precise.
    5. When you answer, explicitly mention which file the information came from if possible.
    
    CONTEXT:
    ${contextStr}
  `;

  try {
    const model = 'gemini-2.5-flash';
    
    // Convert history to Gemini format
    // We limit history to last 10 turns to keep focus tight
    const recentHistory = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Low temperature for factual accuracy based on notes
      },
      history: recentHistory
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: currentMessage
    });

    const responseText = result.text || "I'm having trouble reading your notes right now.";
    
    // Simple heuristic to find "citations" mentioned in the text for the UI
    const foundCitations: string[] = [];
    files.forEach(f => {
      if (responseText.includes(f.name)) {
        foundCitations.push(f.name);
      }
    });

    return {
      text: responseText,
      citations: foundCitations
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I encountered an error while analyzing your notes. Please try again.",
      citations: []
    };
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file); 
    // Note: For a full production app, we'd use pdf.js for PDFs. 
    // For this demo, we assume text-based files or users uploading .txt/.md/csv
  });
};