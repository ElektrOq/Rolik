const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

code = code.replace(
  "    ruFolder?.file('full_text_ru.txt', fullTextRu.trim());\n    ruFolder?.file('script_export_ru.txt', formattedExportRu.trim());\n    \n    usFolder?.file('full_text_us.txt', fullTextUs.trim());\n    usFolder?.file('script_export_us.txt', formattedExportUs.trim());",
  "    const projectRuFolder = projectFolder?.folder('ru');\n    const projectEnFolder = projectFolder?.folder('en');\n\n    projectRuFolder?.file('full_text.txt', fullTextRu.trim());\n    projectRuFolder?.file('script.txt', formattedExportRu.trim());\n    \n    projectEnFolder?.file('full_text.txt', fullTextUs.trim());\n    projectEnFolder?.file('script.txt', formattedExportUs.trim());"
);

fs.writeFileSync('components/ScriptResult.tsx', code);
