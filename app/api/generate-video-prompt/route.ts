export const maxDuration = 300;
import { GoogleGenAI } from "@google/genai";
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
  const modelQueue = [GEMINI_MODEL];

  let lastError: any = null;
  for (const currentModel of modelQueue) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const activeConfig = { ...config, model: GEMINI_MODEL };
        return await ai.models.generateContent(activeConfig);
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini request failed (Attempt ${i + 1}/${maxRetries}): ${error.message || error}`);
        
        const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503');
        if (isTransient) {
          const delay = (i + 1) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // If it's a model not found or other non-transient issue, switch model immediately
          break;
        }
      }
    }
    
  }
  throw lastError || new Error("All models in queue failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { visualDescription, imagePrompt, voiceover, topic, style, visualStyle, character } = await req.json();

    if (!visualDescription && !imagePrompt && !voiceover) {
      return NextResponse.json({ error: "Missing scene data for prompt generation." }, { status: 400 });
    }

    const prompt = `You are an expert AI Video Generation Prompt Engineer (for tools like Runway Gen-2, Gen-3, Luma Dream Machine, Pika Labs, Kling, and Sora).
Your job is to transform a static image description, visual scene context, or narration text into a professional, highly detailed, and dynamic video animation/motion prompt that brings the scene to life.

CRITICAL REQUIREMENT (STRICTLY RESPECT THE SPECIFIED VISUAL STYLE):
The user has specified the following aesthetic visual styles for this project:
- General Genre/Style: "${style || 'Not specified'}"
- Visual Style / Medium: "${visualStyle || 'Not specified'}"

You MUST maintain and honor this specific visual style. If the style is stylized (e.g., anime, cartoon, 3D claymation, oil painting, flat 2D vector illustration, watercolor, sketching, comic, historical, retro, etc.), do NOT add any instructions, keywords, or phrases that force or suggest photorealism or standard modern real-life photography (like "photorealistic", "real life camera", "realistic film grain", "4k resolution photos", etc.). Instead, describe the movement and animation in a way that is highly compatible and seamless with the specified art style/medium of "${visualStyle || 'the scene'}".

Here is the context about the video topic: "${topic || ''}"
Here is the static scene's visual description: "${visualDescription || ''}"
Here is the static image prompt: "${imagePrompt || ''}"
Here is the narration text of the scene (voiceover): "${voiceover || ''}"

CRITICAL NEGATIVE CONSTRAINTS (MANDATORY):
1. ABSOLUTELY NO TEXT on the video (no text overlays, no subtitles, no words, no letters, no logos, no watermarks, no fonts, no UI, completely clean video).
2. ABSOLUTELY NO MUSIC, audio, sound waves, or microphones shown or referenced.
3. Focus purely on the kinetic animation of the physical elements, realistic physics, and beautiful camera motion.

PROMPT DESIGN INSTRUCTIONS:
- Describe natural, fluid, and artistic motion (e.g., subtle wind blowing, embers floating, water rippling, character blinking/breathing/turning heads, slow-motion action, dynamic camera movements like slow push-in, subtle pan, orbit, or tracking shot).
- Use professional cinematography terms that fit the style (e.g., "smooth transition", "fluid camera movement", "dynamic camera motion", "depth of field"). Only use "photorealistic motion" or "photorealistic" if the visual style is explicitly photorealistic or a photographic medium.
- Keep the output prompt entirely in English.
- The output must be concise (around 1-3 sentences), highly visual, and direct. Do not include any preambles like "Here is your prompt:" or quotes. Output ONLY the raw final English prompt itself.`;

    const response = await generateWithRetry({
      model: GEMINI_MODEL,
      contents: prompt,
    }) as any;

    let videoPromptText = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';

    if (videoPromptText) {
      const suffixParts = [];
      if (character && character !== 'undefined') suffixParts.push(character);
      if (visualStyle && visualStyle !== 'undefined') suffixParts.push(visualStyle);
      
      const suffix = suffixParts.join(', ');
      if (suffix) {
        videoPromptText = `${videoPromptText}, ${suffix}`;
      }
    }

    return NextResponse.json({ videoPrompt: videoPromptText });
  } catch (error: any) {
    console.error("Error in generate-video-prompt:", error);
    return NextResponse.json({ error: error.message || "Failed to generate video prompt" }, { status: 500 });
  }
}
