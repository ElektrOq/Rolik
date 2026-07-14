const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldLine = "const scenesWithoutVideo = sectionScenes.filter(s => s.imagePrompt && !s.videoPrompt);";
const newLine = "const scenesWithoutVideo = sectionScenes.filter(s => !s.videoPrompt);";

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  console.log("Fixed filter");
} else {
  console.log("Filter not found");
}

fs.writeFileSync('components/ScriptResult.tsx', code);
