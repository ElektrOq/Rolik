export const maxDuration = 300;
import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini-model";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
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
    const { topic, durationMinutes, style } = await req.json();

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: `Создай подробный план (аутлайн) для YouTube ролика на тему: "${topic}".
Желаемая длительность: ${durationMinutes} минут.
Стиль/Тон: ${style}.

Разбей ролик на логические части (секции/главы). Каждая секция должна иметь название, краткое описание того, о чем там пойдет речь, и точную длительность.
ВАЖНЫЕ ПРАВИЛА:
1. Каждая секция (глава) должна длиться ровно 5 минут (300 секунд).
2. Если общая желаемая длительность ролика (${durationMinutes} минут) не делится на 5 ровно, то сделай все начальные секции по 5 минут, а последнюю секцию — оставшейся длительностью (например, для 12-минутного ролика секции будут: 5 минут, 5 минут и 2 минуты; для 18-минутного: 5, 5, 5 и 3 минуты). Если общая длительность меньше 5 минут, то единственная секция должна быть равна этой длительности (например, 3 минуты).
3. Сумма длительностей всех секций в минутах должна СТРОГО равняться общей желаемой длительности (${durationMinutes} минут). Ни больше, ни меньше!
4. В ответе параметр estimatedDuration должен быть указан В СЕКУНДАХ. То есть ты должен умножить длительность в минутах на 60 (например, 5 минут = 300 секунд).
5. estimatedDuration должно быть строго кратно 60.
6. Для каждой секции укажи estimatedCharacters, рассчитанное по формуле: estimatedDuration * 15 (скорость чтения в символах в секунду).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Кликабельное название для YouTube ролика" },
            description: { type: Type.STRING, description: "Краткое описание концепции ролика" },
            targetDuration: { type: Type.NUMBER, description: "Общая длительность в минутах" },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING, description: "Название секции" },
                  description: { type: Type.STRING, description: "О чем пойдет речь в этой секции" },
                  estimatedDuration: { type: Type.NUMBER, description: "Точная длительность секции в секундах (строго кратно 60)" },
                  estimatedCharacters: { type: Type.NUMBER, description: "Ожидаемое количество символов текста в секции" }
                },
                required: ["id", "title", "description", "estimatedDuration", "estimatedCharacters"]
              }
            }
          },
          required: ["title", "description", "targetDuration", "sections"]
        }
      }
    });

    const data = JSON.parse(response?.text || "{}");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error); import("@/lib/logger").then(m => m.logError("generate-outline", error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
