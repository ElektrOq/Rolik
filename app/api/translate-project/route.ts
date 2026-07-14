import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini-model";

export const maxDuration = 300;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function translateWithRetry(prompt: string, maxRetries = 3) {
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      }) as any;

      let text = response.text ? response.text.trim() : '';
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      return JSON.parse(text);
    } catch (error: any) {
      lastError = error;
      console.warn(`Translation failed (Attempt ${i + 1}/${maxRetries}): ${error.message || error}`);
      const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503');
      if (!isTransient) break;
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
    }
  }

  throw lastError || new Error("Translation failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { scenes } = await req.json();

    const prompt = `You are a professional translator. You are given a set of voiceover texts. Your task is to provide BOTH a Russian version and an English version for each text, regardless of the original language.

- DO NOT translate to any other languages! Only Russian and English.
- If the original text is in English, translate it to Russian for 'voiceoverRu' and keep it (or slightly polish it) for 'voiceoverEn'.
- If the original text is in Russian, translate it to English for 'voiceoverEn' and keep it (or slightly polish it) for 'voiceoverRu'.
- Ensure both versions match in tone and emotion.

Here are the scenes:
${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

Return a JSON array of objects, strictly in this format:
[
  {
    "id": number,
    "voiceoverRu": "Russian text here",
    "voiceoverEn": "English text here"
  }
]
No extra markdown or explanations.`;

    const result = await translateWithRetry(prompt);

    return NextResponse.json({ updatedScenes: result });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
