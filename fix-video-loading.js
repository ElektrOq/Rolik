const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldCode = `        for (let i = 0; i < scenesWithoutVideo.length; i += BATCH_SIZE) {
          const batch = scenesWithoutVideo.slice(i, i + BATCH_SIZE);
          
          try {
            const response = await fetch('/api/generate-video-prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scenes: batch,
                topic,
                style,
                visualStyle,
                character,
                model
              }),
            });
            if (!response.ok) throw new Error('Failed to generate video prompts');
            const data = await response.json();
            
            data.updatedPrompts.forEach((promptUpdate: any) => {
              const sceneIndex = newSectionScenes.findIndex(s => s.id === promptUpdate.id);
              if (sceneIndex !== -1) {
                newSectionScenes[sceneIndex] = { 
                  ...newSectionScenes[sceneIndex], 
                  videoPrompt: promptUpdate.videoPrompt 
                };
              }
            });
            
            setScenes(prev => ({ ...prev, [section.id]: newSectionScenes }));
            
            await new Promise(r => setTimeout(r, 4000));
          } catch (err) {
            console.error(err);
          }
        }`;

const newCode = `        for (let i = 0; i < scenesWithoutVideo.length; i += BATCH_SIZE) {
          const batch = scenesWithoutVideo.slice(i, i + BATCH_SIZE);
          
          batch.forEach(s => {
            setLoadingVideoPrompt(prev => ({ ...prev, [\`\${section.id}-\${s.id}\`]: true }));
          });

          try {
            const response = await fetch('/api/generate-video-prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scenes: batch,
                topic,
                style,
                visualStyle,
                character,
                model
              }),
            });
            if (!response.ok) throw new Error('Failed to generate video prompts');
            const data = await response.json();
            
            data.updatedPrompts.forEach((promptUpdate: any) => {
              const sceneIndex = newSectionScenes.findIndex(s => s.id === promptUpdate.id);
              if (sceneIndex !== -1) {
                newSectionScenes[sceneIndex] = { 
                  ...newSectionScenes[sceneIndex], 
                  videoPrompt: promptUpdate.videoPrompt 
                };
              }
            });
            
            setScenes(prev => ({ ...prev, [section.id]: newSectionScenes }));
            
            await new Promise(r => setTimeout(r, 4000));
          } catch (err) {
            console.error(err);
          } finally {
            batch.forEach(s => {
              setLoadingVideoPrompt(prev => ({ ...prev, [\`\${section.id}-\${s.id}\`]: false }));
            });
          }
        }`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  console.log("Replaced successfully.");
} else {
  console.log("Not found.");
}

fs.writeFileSync('components/ScriptResult.tsx', code);
