const fs = require('fs');
const file = 'app/api/generate-video-prompts/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const ai = new GoogleGenAI({\n  apiKey: process.env.GEMINI_API_KEY,\n});",
  "const ai = new GoogleGenAI({\n  apiKey: process.env.GEMINI_API_KEY,\n  httpOptions: {\n    headers: {\n      'User-Agent': 'aistudio-build',\n    }\n  }\n});"
);

fs.writeFileSync(file, code);
