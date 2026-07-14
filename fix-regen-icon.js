const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

code = code.replace(
  /<PlayCircle className="h-3 w-3" \/>}*.*Генерация/g,
  '<RefreshCw className="h-3 w-3" />}\n                                  <span>{loadingVisualPrompt[`${section.id}-${scene.id}`] ? \'Генерация\' : \'Перегенерировать\'}'
);

code = code.replace(
  /<PlayCircle className="h-3 w-3" \/>}*.*<span>{loadingVideoPrompt\[\`\$\{section.id\}-\$\{scene.id\}\`\] \? 'Генерация...' : 'Сгенерировать'}/g,
  '<RefreshCw className="h-3 w-3" />}\n                                  <span>{loadingVideoPrompt[`${section.id}-${scene.id}`] ? \'Генерация...\' : \'Перегенерировать\'}'
);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed icon');
