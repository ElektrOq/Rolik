const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldVisuals = `            data.updatedVisuals.forEach((visualUpdate: any) => {
              const sceneIndex = newSectionScenes.findIndex(s => s.id === visualUpdate.id);
              if (sceneIndex !== -1) {
                newSectionScenes[sceneIndex] = { 
                  ...newSectionScenes[sceneIndex], 
                  visualDescription: visualUpdate.visualDescription,
                  imagePrompt: visualUpdate.imagePrompt,
                  editingCue: visualUpdate.editingCue
                };
              }
            });

            setScenes(prev => ({ ...prev, [section.id]: newSectionScenes }));`;

const newVisuals = `            setScenes(prev => {
              const currentSectionScenes = prev[section.id] ? [...prev[section.id]] : [];
              data.updatedVisuals.forEach((visualUpdate: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === visualUpdate.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { 
                    ...currentSectionScenes[sIdx], 
                    visualDescription: visualUpdate.visualDescription,
                    imagePrompt: visualUpdate.imagePrompt,
                    editingCue: visualUpdate.editingCue
                  };
                }
              });
              return { ...prev, [section.id]: currentSectionScenes };
            });`;

code = code.replace(oldVisuals, newVisuals);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed visuals state update');
