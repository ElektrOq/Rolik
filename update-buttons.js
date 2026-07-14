const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

code = code.replace(
  "{isGeneratingVisuals ? 'ГЕНЕРАЦИЯ...' : 'СОЗДАТЬ ВИЗУАЛ'}",
  "{isGeneratingVisuals ? 'ГЕНЕРАЦИЯ...' : 'IMG ПРОМТЫ'}"
);

code = code.replace(
  "{isGeneratingVideoPrompts ? 'АНИМАЦИЯ...' : 'АНИМИРОВАТЬ ВСЕ'}",
  "{isGeneratingVideoPrompts ? 'АНИМАЦИЯ...' : 'ВИДЕО ПРОМТЫ'}"
);

fs.writeFileSync('components/ScriptResult.tsx', code);
