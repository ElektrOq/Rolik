const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldLine = "if (sIdx !== -1) newSectionScenes[sIdx] = { ...newSectionScenes[sIdx], voiceoverEn: t.voiceoverEn };";
const newLine = `if (sIdx !== -1) {
                newSectionScenes[sIdx] = { 
                  ...newSectionScenes[sIdx], 
                  voiceover: t.voiceoverRu || newSectionScenes[sIdx].voiceover,
                  voiceoverEn: t.voiceoverEn 
                };
              }`;

code = code.replace(oldLine, newLine);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Updated client UI');
