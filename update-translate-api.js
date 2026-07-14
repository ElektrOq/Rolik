const fs = require('fs');
let code = fs.readFileSync('app/api/translate-project/route.ts', 'utf8');

const oldPrompt = `    const prompt = \`Translate the following Russian voiceover text to English.
Make it sound engaging and natural. Keep the character length as close as possible to the original Russian version.

Here are the scenes:
\${JSON.stringify(scenes.map((s: any) => ({ id: s.id, voiceover: s.voiceover })), null, 2)}

Return a JSON array of objects, strictly in this format:
[
  {
    "id": number,
    "voiceoverEn": "translated text"
  }
]
No extra markdown or explanations.\`;`;

const newPrompt = `    const prompt = \`You are an expert translator. The following voiceover texts may be in English, Russian, or another language.
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

code = code.replace(oldPrompt, newPrompt);
fs.writeFileSync('app/api/translate-project/route.ts', code);
console.log('Updated API route');
