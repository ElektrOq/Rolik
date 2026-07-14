export const maxDuration = 300;

import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function generateWithRetry(config: any, maxRetries = 3) {
  const modelQueue = [config.model, 'gemini-flash-latest', 'gemini-3.5-flash'].filter((m, idx, self) => m && self.indexOf(m) === idx);

  let lastError: any = null;
  for (const currentModel of modelQueue) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const activeConfig = { ...config, model: currentModel };
        return await ai.models.generateContent(activeConfig);
      } catch (error: any) {
        lastError = error;
        console.warn(`Failed with model ${currentModel} (Attempt ${i + 1}/${maxRetries}): ${error.message || error}`);
        
        const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503');
        if (isTransient) {
          const delay = (i + 1) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    console.log(`Switching to fallback model in queue...`);
  }
  throw lastError || new Error("All models in queue failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { topic, style, visualStyle, character, sceneDuration, section, globalStartTime, videoTitle, model, isLastSection, sectionIndex = 0, allSectionTitles = [], allSections = [] } = await req.json();

    const currentSceneDuration = sceneDuration || 15;
    const targetCharCount = Math.round(currentSceneDuration * 15);
    const expectedScenesCount = Math.round(section.estimatedDuration / currentSceneDuration);
    
    const MAX_SCENES_PER_BATCH = 10; 
    let allData: any[] = [];
    let previousText = "";

    const fullOutlineContext = allSections && allSections.length > 0 
      ? allSections.map((s: any, i: number) => `Глава ${i + 1}: ${s.title}\nОписание: ${s.description}`).join("\n\n")
      : "";

    for (let batchStart = 0; batchStart < expectedScenesCount; batchStart += MAX_SCENES_PER_BATCH) {
      const batchScenesCount = Math.min(MAX_SCENES_PER_BATCH, expectedScenesCount - batchStart);
      const batchStartTime = globalStartTime + (batchStart * currentSceneDuration);
      const isLastBatch = batchStart + batchScenesCount >= expectedScenesCount;
      const isLastSectionOverall = isLastSection && isLastBatch;

      let customChapterInstructions = "";
      if (batchStart === 0) {
        if (sectionIndex === 0) {
          const formattedTitles = allSectionTitles.length > 0
            ? (allSectionTitles as string[]).map((t: string, i: number) => `Глава ${i + 1}: ${t}`).join(", ")
            : "";
          customChapterInstructions = `
ВАЖНОЕ ПРАВИЛО ДЛЯ НАЧАЛА ПЕРВОЙ ГЛАВЫ (КЛИКБЕЙТНЫЙ ХУК):
Поскольку это самое начало ролика (первая сцена первой главы), сделай в первой сцене невероятно кликабельное, вовлекающее и интригующее вступление (хук), используя мощные триггеры темы ролика ("${topic}").
В этом вступлении ОБЯЗАТЕЛЬНО озвучь/упомяни названия или краткую суть ВСЕХ последующих глав ролика: [${formattedTitles}]. Это нужно для того, чтобы ролик не начинался сухо "из контекста", а завлекал зрителя планом всей истории с первых секунд.

1. Первая сцена на русском языке (voiceover) ОБЯЗАТЕЛЬНО должна начинаться сразу с интригующего кликбейтного хука. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО добавлять в озвучку слова "Глава 1" или название первой главы! Текст должен сразу вовлекать.
2. Первая сцена на английском языке (voiceoverEn) ОБЯЗАТЕЛЬНО должна начинаться сразу с английской версии кликбейтного хука. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО добавлять в озвучку "Chapter 1" или название первой главы!
Вся английская версия (voiceoverEn) должна быть СТРОГО и ПОЛНОСТЬЮ на английском языке, включая перевод всех смысловых элементов и названий других глав! Ни одного русского слова или буквы в voiceoverEn не должно быть!
`;
        } else {
          customChapterInstructions = `
ВАЖНОЕ ПРАВИЛО ДЛЯ НАЧАЛА ГЛАВЫ:
Это самое начало главы ${sectionIndex + 1} ("${section.title}"). 
1. В озвучке (как в voiceover, так и в voiceoverEn) КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО произносить или писать технические заголовки вида "Глава ${sectionIndex + 1}" или "Chapter ${sectionIndex + 1}", а также запрещено просто зачитывать название главы вслух в начале сцены.
2. В начале главы КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ любые приветствия, дежурные фразы, клише или раскачка (например, никаких "Приветствую", "В этой части мы разберем", "Давайте продолжим", "Итак, поехали" и т.д.). Диктор должен сразу переходить к фактам, повествованию и сути главы, делая это бесшовно.
`;
        }
      } else {
        customChapterInstructions = `
ВАЖНОЕ ПРАВИЛО СВЯЗНОСТИ: Это продолжение главы ${sectionIndex + 1}. Пиши текст связно, без заголовков, повторений, приветствий или вступлений.
`;
      }

      let textPromptContents = `Ты — профессиональный диктор документальных фильмов. Твоя задача — писать текст, который читается в размеренном темпе 15 символов в секунду. Текст должен быть связным и захватывающим.

Напиши подробный сценарий (только текст диктора) для одной части YouTube ролика.
Название всего ролика: "${videoTitle}"
Тема ролика: "${topic}"
Стиль/Тон: "${style}"

КРИТИЧЕСКОЕ ПРАВИЛО: НЕ ПОВТОРЯЙСЯ!
Ниже приведен полный план всего ролика (все главы). Ознакомься с ним, чтобы понимать общую картину:
${fullOutlineContext}

Текущая часть (ты пишешь текст ТОЛЬКО для этой главы!):
Глава ${sectionIndex + 1}: ${section.title}
Описание: ${section.description}

СТРОГО СОБЛЮДАЙ ГРАНИЦЫ СВОЕЙ ГЛАВЫ. Раскрывай ТОЛЬКО те факты и события, которые указаны в описании твоей главы.
КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО затрагивать темы, события или идеи, которые предназначены для других глав. 
КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО по второму кругу рассказывать то, что уже было или будет рассказано в других главах. Давай НОВУЮ информацию каждые 30-60 секунд. Избегай тавтологии и переливания из пустого в порожнее.

ПРАВИЛО ОДНОГО РАСКРЫТИЯ (ВНУТРИ ГЛАВЫ):
Каждый важный факт или событие внутри главы можно подробно раскрывать только один раз. Не перефразируй одну и ту же идею разными словами. Вместо повторения используй развитие сюжета. Двигай историю вперед.

ПРАВИЛО ПРОГРЕССИИ ИНФОРМАЦИИ:
Каждая следующая сцена обязана выполнять одну из задач:
1. Добавлять новый факт.
2. Показывать новый персонаж.
3. Раскрывать новую причину.
4. Показывать последствия.
5. Переходить к следующему этапу.
Запрещено использовать сцену только для красивого описания атмосферы, повторения уже сказанной мысли или эмоционального усиления без новой информации. Зритель должен постоянно узнавать что-то новое.

ЗАПРЕТ ДВОЙНОГО РАССКАЗА:
После завершения описания исторического события запрещено начинать его заново или пересказывать другими словами.
Плохо: Сцены 1-10: Рассказ о корабле. Сцены 11-20: Снова рассказ о корабле другими словами.
Хорошо: Сцены 1-10: Обнаружение корабля. Сцены 11-20: Расследование. Сцены 21-30: Версии ученых.

БАЛАНС ИСТОРИИ И ФИЛОСОФИИ (80/20):
Не завершай каждый блок философским выводом. Философское осмысление используй ТОЛЬКО в самом конце главы, максимум 2-3 предложения. Основной объем должен занимать фактаж и развитие событий. История важнее морали. Исключи избыточные вступления.

${previousText ? `\nПРЕДЫДУЩИЙ ТЕКСТ (для связности):\n${previousText}\nПРОДОЛЖАЙ повествование плавно с того места, где закончился текст. НЕ ПОВТОРЯЙ то, что только что было сказано!\n` : ''}

\n${!isLastSectionOverall ? `\nВАЖНО: Этот фрагмент НЕ является последним. НЕ делай в конце никаких выводов, прощаний, подведений итогов или завершений мысли всего ролика.` : `\nВАЖНО: Этот фрагмент является ПОСЛЕДНИМ в ролике. Здесь нужно подвести итог и логически завершить повествование.`}

${customChapterInstructions}

КРИТИЧЕСКОЕ ПРАВИЛО ПО ОБЪЕМУ ТЕКСТА И КОЛИЧЕСТВУ СЦЕН:
Этот фрагмент требует сгенерировать РОВНО ${batchScenesCount} сцен.
АНГЛИЙСКИЙ ТЕКСТ (voiceoverEn) — САМОЕ ВАЖНОЕ: Он должен быть СТРОГО ${targetCharCount} символов для каждой сцены (ЭТО МИНИМУМ И МАКСИМУМ, допускается разница не более 5 символов). ПИШИ СНАЧАЛА ЕГО! Считай символы.
${batchStart === 0 ? `Обрати внимание: первая сцена этой главы должна уложиться ровно в ${targetCharCount} символов в voiceoverEn.` : ''}
РУССКИЙ ТЕКСТ (voiceover): Точный перевод английского текста, длина не важна.

Сцены должны идти последовательно, строго ${batchScenesCount} штук. Первая сцена этого фрагмента должна начинаться в ${batchStartTime} секунд.`;

      let textBatchData: any[] = [];
      for (let attempt = 0; attempt < 4; attempt++) {
        const response = await generateWithRetry({
          model: model || "gemini-3.5-flash",
          contents: textPromptContents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER },
                  voiceover: { type: Type.STRING },
                  voiceoverEn: { type: Type.STRING }
                },
                required: ["id", "startTime", "endTime", "duration", "voiceover", "voiceoverEn"]
              }
            }
          }
        });

        textBatchData = JSON.parse(response?.text || "[]");

        let needsRevision = false;
        let feedback = "Были обнаружены следующие ошибки. Пожалуйста, исправь их:\n";

        if (textBatchData.length !== batchScenesCount) {
          needsRevision = true;
          feedback += `- КОЛИЧЕСТВО СЦЕН: Ты сгенерировал ${textBatchData.length} сцен, а ДОЛЖЕН был сгенерировать ровно ${batchScenesCount} сцен. Сгенерируй все ${batchScenesCount} сцен.\n`;
        } else {
          for (const scene of textBatchData) {
            const voiceoverEn = scene.voiceoverEn || "";
            const sceneDur = scene.duration || currentSceneDuration;
            const expectedChars = Math.round(sceneDur * 15);
            
            if (Math.abs(voiceoverEn.length - expectedChars) > 5) {
              needsRevision = true;
              if (voiceoverEn.length < expectedChars) {
                feedback += `- Сцена ${scene.id}: АНГЛИЙСКИЙ текст содержит ${voiceoverEn.length} символов, а должен содержать СТРОГО ${expectedChars}. ДОПИШИ текст!\n`;
              } else {
                feedback += `- Сцена ${scene.id}: АНГЛИЙСКИЙ текст содержит ${voiceoverEn.length} символов, а должен содержать СТРОГО ${expectedChars}. СОКРАТИ текст!\n`;
              }
            }
          }
        }

        if (!needsRevision) {
          break;
        }

        textPromptContents += `\n\nВ предыдущей попытке были следующие ошибки:\n${feedback}\nОбязательно исправь их и сгенерируй ответ заново, строго соблюдая объем!`;
      }
      
      // Step 2: Generate visual details for the approved text batch
      const visualPromptContents = `Тебе дан массив сцен с готовым текстом диктора. Твоя задача — придумать визуальное оформление для каждой сцены, не меняя текст.

${JSON.stringify(textBatchData, null, 2)}

Для каждой сцены добавь:
- imagePrompt: Детальный промпт для нейросети (Midjourney/DALL-E) на АНГЛИЙСКОМ ЯЗЫКЕ. СТРОГОЕ ПРАВИЛО: Ты должен ТОЛЬКО очень детально, кинематографично и атмосферно описать саму сцену на английском (включая освещение, настроение/вайб, композицию, детали окружения). НЕ ДОБАВЛЯЙ сюда описание персонажа, визуальный стиль или пропорции. Пиши ТОЛЬКО описание самой сцены! Формат: "[Детальное атмосферное описание сцены на английском, освещение, композиция]"
- visualDescription: Описание визуального действия на экране (на русском).
- editingCue: Инструкции по монтажу (Editing Cue, на русском).`;

      const visualResponse = await generateWithRetry({
        model: model || "gemini-3.5-flash",
        contents: visualPromptContents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                voiceover: { type: Type.STRING },
                voiceoverEn: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                editingCue: { type: Type.STRING }
              },
              required: ["id", "startTime", "endTime", "duration", "voiceover", "voiceoverEn", "imagePrompt", "visualDescription", "editingCue"]
            }
          }
        }
      });
      
      let batchData = JSON.parse(visualResponse?.text || "[]");
      
      // Post-process image prompts
      batchData = batchData.map((scene: any) => {
        if (scene.imagePrompt) {
            const suffix = `${character ? `${character}, ` : ''}${visualStyle}, --ar 16:9`;
            scene.imagePrompt = `${scene.imagePrompt}, ${suffix}`;
        }
        return scene;
      });

      if (batchData.length > 0) {
        const lastScenes = batchData.slice(-2).map((s: any) => s.voiceover).join(" ");
        previousText = lastScenes;
      }
      
      allData = allData.concat(batchData);
    }
    
    const finalData = allData.map((scene, i) => ({
      ...scene,
      id: Date.now() + i
    }));

    return NextResponse.json(finalData);

  } catch (error: any) {
    console.error(error); import("@/lib/logger").then(m => m.logError("generate-section", error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
