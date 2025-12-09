export interface AIRequest {
  model_name: string;
  prompt: string;
}

export interface AIResponse {
  response: string;
}

export const MODELS = {
  TRANSLATE: "Qwen/Qwen3-VL-30B-A3B-Instruct",
  CRITIQUE: "claude-sonnet-4-5-20250929"
};

export const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Spanish", label: "Spanish" },
  { value: "Russian", label: "Russian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Japanese", label: "Japanese" }
];

export async function callLLM(
  model_name: string, 
  prompt: string, 
  apiKey: string
): Promise<string> {
  // Check if API key is provided
  if (!apiKey) {
    throw new Error("API Key is missing. Please enter your MentorPiece API Key.");
  }

  try {
    const response = await fetch("https://api.mentorpiece.org/v1/process-ai-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model_name,
        prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data: AIResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error("LLM Call Failed:", error);
    throw error;
  }
}

// Helper to construct the translation prompt
export function getTranslationPrompt(text: string, targetLanguage: string): string {
  return `Translate the following text into ${targetLanguage}. Provide ONLY the translation, no introductory or concluding remarks.\n\nText to translate:\n${text}`;
}

// Helper to construct the critique prompt
export function getCritiquePrompt(original: string, translation: string): string {
  return `Original Text: "${original}"\n\nTranslated Text: "${translation}"\n\nEvaluate the quality of this translation on a scale from 1 to 10. Analyze grammar, tone, and accuracy. Point out any errors or improvements. Provide a constructive critique.`;
}
