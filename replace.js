const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

code = code.replace(
  "const ruFolder = zip.folder('RU');\n    const usFolder = zip.folder('US');",
  "zip.folder('IMG');\n    zip.folder('ZIP');\n    const voiceFolder = zip.folder('VOICE');\n    const ruFolder = voiceFolder?.folder('ru');\n    const usFolder = voiceFolder?.folder('en');"
);

code = code.replace(
  "const ruFolder = zip.folder('RU');\n    const usFolder = zip.folder('US');\n    const chaptersRuFolder = zip.folder('chapters_text/RU');\n    const chaptersUsFolder = zip.folder('chapters_text/US');",
  "zip.folder('IMG');\n    zip.folder('ZIP');\n    const voiceFolder = zip.folder('VOICE');\n    const voiceRuFolder = voiceFolder?.folder('ru');\n    const voiceUsFolder = voiceFolder?.folder('en');\n    const projectFolder = zip.folder('PROJECT');\n    const promtFolder = zip.folder('PROMT');"
);

code = code.replace(
  "chaptersRuFolder?.file(`chapter_${index + 1}.txt`, textContentRu);\n        chaptersUsFolder?.file(`chapter_${index + 1}.txt`, textContentUs);",
  "voiceRuFolder?.file(`chapter_${index + 1}.txt`, textContentRu);\n        voiceUsFolder?.file(`chapter_${index + 1}.txt`, textContentUs);"
);

code = code.replace(
  "formattedExportUs += `CHAPTER - ${index + 1}\\n`;",
  "formattedExportUs += `ГЛАВА - ${index + 1}\\n`;"
);

code = code.replace(
  "ruFolder?.file('full_text_ru.txt', fullTextRu.trim());\n    ruFolder?.file('script_export_ru.txt', formattedExportRu.trim());\n    \n    usFolder?.file('full_text_us.txt', fullTextUs.trim());\n    usFolder?.file('script_export_us.txt', formattedExportUs.trim());",
  "const projectRuFolder = projectFolder?.folder('ru');\n    const projectEnFolder = projectFolder?.folder('en');\n\n    projectRuFolder?.file('full_text.txt', fullTextRu.trim());\n    projectRuFolder?.file('script.txt', formattedExportRu.trim());\n    \n    projectEnFolder?.file('full_text.txt', fullTextUs.trim());\n    projectEnFolder?.file('script.txt', formattedExportUs.trim());"
);

code = code.replace(
  "zip.file('all_prompts.txt', allPrompts.trim());\n    if (allVideoPrompts.trim()) {\n      zip.file('all_video_prompts.txt', allVideoPrompts.trim());\n    }",
  "promtFolder?.file('all_image_prompts.txt', allPrompts.trim());\n    if (allVideoPrompts.trim()) {\n      promtFolder?.file('all_video_prompts.txt', allVideoPrompts.trim());\n    }"
);

fs.writeFileSync('components/ScriptResult.tsx', code);
