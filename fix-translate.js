const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldTranslate = `            data.updatedScenes.forEach((t: any) => {
              const sIdx = newSectionScenes.findIndex(s => s.id === t.id);
              if (sIdx !== -1) {
                newSectionScenes[sIdx] = { 
                  ...newSectionScenes[sIdx], 
                  voiceover: t.voiceoverRu || newSectionScenes[sIdx].voiceover,
                  voiceoverEn: t.voiceoverEn 
                };
              }
            });
            setScenes(prev => ({ ...prev, [section.id]: newSectionScenes }));`;

const newTranslate = `            setScenes(prev => {
              const currentSectionScenes = prev[section.id] ? [...prev[section.id]] : [];
              data.updatedScenes.forEach((t: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === t.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { 
                    ...currentSectionScenes[sIdx], 
                    voiceover: t.voiceoverRu || currentSectionScenes[sIdx].voiceover,
                    voiceoverEn: t.voiceoverEn 
                  };
                }
              });
              return { ...prev, [section.id]: currentSectionScenes };
            });`;

code = code.replace(oldTranslate, newTranslate);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed translate state update');
