const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldVideo = `            data.updatedPrompts.forEach((promptUpdate: any) => {
              const sceneIndex = newSectionScenes.findIndex(s => s.id === promptUpdate.id);
              if (sceneIndex !== -1) {
                newSectionScenes[sceneIndex] = { 
                  ...newSectionScenes[sceneIndex], 
                  videoPrompt: promptUpdate.videoPrompt 
                };
              }
            });
            
            setScenes(prev => ({ ...prev, [section.id]: newSectionScenes }));`;

const newVideo = `            setScenes(prev => {
              const currentSectionScenes = prev[section.id] ? [...prev[section.id]] : [];
              data.updatedPrompts.forEach((promptUpdate: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === promptUpdate.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { 
                    ...currentSectionScenes[sIdx], 
                    videoPrompt: promptUpdate.videoPrompt 
                  };
                }
              });
              return { ...prev, [section.id]: currentSectionScenes };
            });`;

code = code.replace(oldVideo, newVideo);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed video state update');
