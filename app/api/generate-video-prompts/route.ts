import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini-model";

export const maxDuration = 300;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
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
    const { scenes, topic, style, visualStyle, character } = await req.json();

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "No scenes provided." }, { status: 400 });
    }

    const prompt = `You are an expert AI Video Generation Prompt Engineer (for tools like Runway Gen-2, Gen-3, Luma Dream Machine, Pika Labs, Kling, and Sora).
Your job is to transform static image descriptions, visual scene contexts, or narration texts into a professional, highly detailed, and dynamic video animation/motion prompts that brings each scene to life.

CRITICAL REQUIREMENT (STRICTLY RESPECT THE SPECIFIED VISUAL STYLE):
The user has specified the following aesthetic visual styles for this project:
- General Genre/Style: "${style || 'Not specified'}"
- Visual Style / Medium: "${visualStyle || 'Not specified'}"

You MUST maintain and honor this specific visual style. If the style is stylized (e.g., anime, cartoon, 3D claymation, oil painting, flat 2D vector illustration, watercolor, sketching, comic, historical, retro, etc.), do NOT add any instructions, keywords, or phrases that force or suggest photorealism or standard modern real-life photography (like "photorealistic", "real life camera", "realistic film grain", "4k resolution photos", etc.). Instead, describe the movement and animation in a way that is highly compatible and seamless with the specified art style/medium of "${visualStyle || 'the scene'}".

Here is the context about the video topic: "${topic || ''}"

Below is an array of scenes, each with an 'id', 'visualDescription', 'imagePrompt', and 'voiceover':
${JSON.stringify(scenes.map((s: any) => ({ id: s.id, visualDescription: s.visualDescription, imagePrompt: s.imagePrompt, voiceover: s.voiceover })), null, 2)}

CRITICAL NEGATIVE CONSTRAINTS (MANDATORY):
1. ABSOLUTELY NO TEXT on the video (no text overlays, no subtitles, no words, no letters, no logos, no watermarks, no fonts, no UI, completely clean video).
2. ABSOLUTELY NO MUSIC, audio, sound waves, or microphones shown or referenced.
3. Focus purely on the kinetic animation of the physical elements, realistic physics, and beautiful camera motion.

PROMPT DESIGN INSTRUCTIONS:
- Describe natural, fluid, and artistic motion (e.g., subtle wind blowing, embers floating, water rippling, character blinking/breathing/turning heads, slow-motion action, dynamic camera movements like slow push-in, subtle pan, orbit, or tracking shot).
- Use professional cinematography terms that fit the style.
- Keep the output prompt entirely in English.
- The output must be concise (around 1-3 sentences), highly visual, and direct.

Return the result STRICTLY as a JSON array where each object has the following structure:
- id: number (must match the input scene id)
- videoPrompt: string (the generated video prompt in English)

Do not include any markdown formatting, just the raw JSON array.`;

    let updatedPrompts = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    updatedPrompts = updatedPrompts.map((scene: any) => {
      let videoPromptText = scene.videoPrompt ? scene.videoPrompt.trim().replace(/^["']|["']$/g, '') : '';
      if (videoPromptText) {
        const suffixParts = [];
        if (character && character !== 'undefined') suffixParts.push(character);
        if (visualStyle && visualStyle !== 'undefined') suffixParts.push(visualStyle);
        
        const suffix = suffixParts.join(', ');
        if (suffix) {
          videoPromptText = `${videoPromptText}, ${suffix}`;
        }
        scene.videoPrompt = videoPromptText;
      }
      return scene;
    });

    return NextResponse.json({ updatedPrompts });
  } catch (error: any) {
    console.error("Error in generate-video-prompts:", error);
    return NextResponse.json({ error: error.message || "Failed to generate video prompts" }, { status: 500 });
  }
}
