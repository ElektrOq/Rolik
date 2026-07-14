const fs = require('fs');
let code = fs.readFileSync('app/api/translate-project/route.ts', 'utf8');

const oldPrompt = `    const prompt = \`You are an expert translator. The following voiceover texts may be in English, Russian, or another language.
Your task is to identify the language and provide BOTH a Russian version and an English version for each scene.

- If the original is in Russian, improve it slightly if needed for the Russian version, and provide a high-quality English translation.
- If the original is in English, use it (improving if needed) for the English version, and provide a high-quality Russian translation.
- Ensure both versions match in tone, emotion, and rough length.

Here are the scenes:
\${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

Return a JSON array of objects, strictly in this format:
[
  {
    "id": number,
    "voiceoverRu": "Russian text here",
    "voiceoverEn": "English text here"
  }
]
No extra markdown or explanations.\`;`;

const newPrompt = `    const prompt = \`You are a professional translator. You are given a set of voiceover texts. Your task is to provide BOTH a Russian version and an English version for each text, regardless of the original language.

- DO NOT translate to any other languages! Only Russian and English.
- If the original text is in English, translate it to Russian for 'voiceoverRu' and keep it (or slightly polish it) for 'voiceoverEn'.
- If the original text is in Russian, translate it to English for 'voiceoverEn' and keep it (or slightly polish it) for 'voiceoverRu'.
- Ensure both versions match in tone and emotion.

Here are the scenes:
\${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

Return a JSON array of objects, strictly in this format:
[
  {
    "id": number,
    "voiceoverRu": "Russian text here",
    "voiceoverEn": "English text here"
  }
]
No extra markdown or explanations.\`;`;

code = code.replace(oldPrompt, newPrompt);
fs.writeFileSync('app/api/translate-project/route.ts', code);
console.log('Fixed translate api');
