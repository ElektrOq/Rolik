import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini-model";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

async function generateWithRetry(config: any, maxRetries = 3) {
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({ ...config, model: GEMINI_MODEL });
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini request failed (Attempt ${i + 1}/${maxRetries}): ${error.message || error}`);

      const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503');
      if (!isTransient) break;
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
    }
  }

  throw lastError || new Error("Gemini request failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { section, scenes, previousText, topic } = await req.json();

    const prompt = `Ты — профессиональный редактор исторических документальных фильмов и сценарист.
Твоя задача — отредактировать текст диктора (voiceover) для сцен в текущей главе, чтобы ПОЛНОСТЬЮ убрать смысловые повторы с предыдущими главами, убрать "воду", лишнюю философию и улучшить плотность информации.

Тема: "${topic}"
Текущая глава: "${section.title}"

ПРЕДЫДУЩИЙ ТЕКСТ РОЛИКА (уже рассказанная информация):
"""
${previousText || 'Это первая глава, предыдущего текста нет.'}
"""

СЦЕНЫ ТЕКУЩЕЙ ГЛАВЫ (в формате JSON):
${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

ЗАДАЧА:
1. Проанализируй "ПРЕДЫДУЩИЙ ТЕКСТ РОЛИКА".
2. Внимательно прочитай "СЦЕНЫ ТЕКУЩЕЙ ГЛАВЫ".
3. Перепиши voiceover для каждой сцены, удалив ЛЮБЫЕ повторения идей, фактов или вводных фраз, которые уже звучали ранее (в предыдущем тексте или внутри самой этой главы).
4. Оставь только новую информацию, развивающую сюжет. Если сцена полностью дублирует старую мысль, замени её на более глубокий факт о событии этой главы или сократи.
5. Убери избыточную философию и пустые вводные конструкции. Текст должен быть плотным и насыщенным фактами.
6. ВАЖНО: Ты должен вернуть массив с ТЕМ ЖЕ количеством элементов и ТЕМИ ЖЕ id, что и на входе.
7. Верни ТОЛЬКО обновленный JSON массив объектов, где каждый объект имеет "id" (сохраненный) и "voiceover" (исправленный текст). НИЧЕГО КРОМЕ JSON не выводи, не пиши markdown-блоки типа \`\`\`json.

Пример формата ответа:
[
  { "id": 1, "voiceover": "Новый текст..." },
  { "id": 2, "voiceover": "Новый текст..." }
]`;

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
    }) as any;

    let text = response.text ? response.text.trim() : '';
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    let updatedScenes;
    try {
      updatedScenes = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse polished JSON:", text);
      return NextResponse.json({ error: "Failed to parse JSON response from AI." }, { status: 500 });
    }

    return NextResponse.json({ updatedScenes });
  } catch (error: any) {
    console.error("Error in polish-section:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
