
import { GoogleGenAI, Type } from "@google/genai";
import { EntryType, ProcessingResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are an intelligent voice routing agent for Voice Suite.
Your goal is to classify user voice input into one of five categories and extract structured data.

INTENT CATEGORIES:
1. REMINDER: Time-based or future-oriented intentions.
2. FORM: Intent to collect specific data points or create a data structure.
3. LIST: Task-oriented speech, items to do, or shopping lists.
4. JOURNAL: Reflective, emotional, or personal check-in speech.
5. IDEA: General thoughts, brainstorming, or capture of information (Default fallback).

SCORING: If multiple intents are present, choose the most relevant one.

FOR REMINDERS: Parse dates and times. If time is missing, set "requiresTimeClarification" to true.
FOR FORMS: Generate form fields: label and type (text, email, number, rating, longtext).
FOR LISTS: Split items into discrete lines.
FOR JOURNALS: Extract emotional tone.
FOR IDEAS: Provide a summary, core idea, and tags.

IMPORTANT: If the user has already selected a specific tool (passed in context), prioritize that classification.

OUTPUT FORMAT: JSON only.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description: "One of REMINDER, FORM, LIST, JOURNAL, IDEA",
    },
    structuredData: {
      type: Type.OBJECT,
      properties: {
        transcript: { type: Type.STRING },
        summary: { type: Type.STRING },
        coreIdea: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        title: { type: Type.STRING },
        items: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { text: { type: Type.STRING } } 
          } 
        },
        fields: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              type: { type: Type.STRING },
            }
          }
        },
        text: { type: Type.STRING },
        triggerTime: { type: Type.STRING },
        emotionalTone: { type: Type.STRING },
      }
    }
  },
  required: ["type", "structuredData"]
};

export const processVoiceInput = async (
  base64Audio: string, 
  mimeType: string, 
  preferredType?: EntryType
): Promise<ProcessingResult> => {
  const contextMessage = preferredType 
    ? `The user is specifically using the ${preferredType} tool. Try to structure the output as that type unless it clearly makes no sense.`
    : "Analyze this audio and route it to the correct suite tool.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: contextMessage },
            { inlineData: { data: base64Audio, mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      }
    });

    const result = JSON.parse(response.text);
    return result as ProcessingResult;
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw error;
  }
};
