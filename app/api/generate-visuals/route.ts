import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini-model";

export const maxDuration = 300;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateWithRetry(config: any, maxRetries = 3) {
  const modelQueue = [GEMINI_MODEL];

  let lastError: any = null;
  for (const currentModel of modelQueue) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const activeConfig = { ...config, model: GEMINI_MODEL };
        const response = await ai.models.generateContent(activeConfig) as any;
        
        let text = response.text ? response.text.trim() : '';
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        
        try {
          const parsed = JSON.parse(text);
          return parsed;
        } catch (e) {
          throw new Error("JSON_PARSE_ERROR");
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini request failed (Attempt ${i + 1}/${maxRetries}): ${error.message || error}`);
        const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('JSON_PARSE_ERROR');
        if (isTransient) {
          const delay = (i + 1) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    
  }
  throw lastError || new Error("All models in queue failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { scenes, style, visualStyle, character, topic } = await req.json();

    const prompt = `Ты — профессиональный арт-директор и prompt-инженер для генерации изображений (Midjourney, Stable Diffusion).
Тебе переданы сцены для исторического ролика с уже готовым текстом (voiceover). Твоя задача — придумать для каждой сцены детальное визуальное описание, подходящий AI Prompt и указания для монтажа.

Тема ролика: "${topic || 'Не указана'}"
Общий стиль повествования: "${style || 'Не указан'}"
Визуальный стиль (КРИТИЧЕСКИ ВАЖНО СОБЛЮДАТЬ): "${visualStyle || 'Не указан'}"

Для каждой переданной сцены сформируй:
1. visualDescription (на русском): Что конкретно мы видим в кадре? Какие персонажи, окружение, цвета, освещение, эмоции? Описание должно строго соответствовать тексту voiceover.
2. imagePrompt (на английском): Промпт для генерации изображения. Используй слова-описания камеры, освещения, композиции. Обязательно добавь слова из "Визуальный стиль" в промпт, чтобы он точно генерировал картинку в заданном стиле. Не пиши текст на самом изображении.
3. editingCue (на русском): Указание монтажеру. Какой эффект применить (zoom in, pan left, медленное появление, смена фокуса)?

Ниже представлен массив сцен с их id и текстом:
${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

Верни результат в формате JSON, где на верхнем уровне массив объектов (ровно столько же, сколько на входе). Каждый объект должен содержать:
- id: число (взять из входящих данных)
- visualDescription: строка
- imagePrompt: строка
- editingCue: строка

Никакого форматирования Markdown, только чистый JSON массив.`;

    let updatedVisuals = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // Post-process image prompts
    updatedVisuals = updatedVisuals.map((scene: any) => {
      if (scene.imagePrompt) {
          const suffixParts = [];
          if (character && character !== 'undefined') suffixParts.push(character);
          if (visualStyle && visualStyle !== 'undefined') suffixParts.push(visualStyle);
          
          const suffix = suffixParts.join(', ');
          scene.imagePrompt = `${scene.imagePrompt}${suffix ? `, ${suffix}` : ''}, --ar 16:9`;
      }
      return scene;
    });

    return NextResponse.json({ updatedVisuals });
  } catch (error: any) {
    console.error("Error in generate-visuals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
