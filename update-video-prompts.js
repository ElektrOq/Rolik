const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldFunc = `const generateAllVideoPrompts = async () => {
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        const sectionScenes = scenes[section.id] || [];
        const scenesWithoutVideo = sectionScenes.filter(s => s.imagePrompt && !s.videoPrompt);
        
        if (scenesWithoutVideo.length === 0) continue;

        for (const scene of scenesWithoutVideo) {
          const key = \`\${section.id}-\${scene.id}\`;
          setLoadingVideoPrompt(prev => ({ ...prev, [key]: true }));
          try {
            const response = await fetch('/api/generate-video-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                visualDescription: scene.visualDescription || '',
                imagePrompt: scene.imagePrompt || '',
                model,
                style,
                visualStyle,
                character,
              }),
            });
            if (!response.ok) throw new Error('Failed to generate video prompt');
            const data = await response.json();
            
            setScenes(prev => {
              const updatedScenes = [...(prev[section.id] || [])];
              const sIndex = updatedScenes.findIndex(s => s.id === scene.id);
              if (sIndex !== -1) updatedScenes[sIndex] = { ...updatedScenes[sIndex], videoPrompt: data.videoPrompt };
              return { ...prev, [section.id]: updatedScenes };
            });
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) { console.error(err); }
          finally { setLoadingVideoPrompt(prev => ({ ...prev, [key]: false })); }
        }
      }
      playNotification('Генерация видео-промптов успешно завершена');
    } finally { setIsGeneratingVideoPrompts(false); }
  };`;

const newFunc = `const generateAllVideoPrompts = async () => {
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        const sectionScenes = scenes[section.id] || [];
        const scenesWithoutVideo = sectionScenes.filter(s => s.imagePrompt && !s.videoPrompt);
        
        if (scenesWithoutVideo.length === 0) continue;

        const BATCH_SIZE = 5;
        let newSectionScenes = [...sectionScenes];

        for (let i = 0; i < scenesWithoutVideo.length; i += BATCH_SIZE) {
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
        }
      }
      playNotification('Генерация видео-промптов успешно завершена');
    } finally { 
      setIsGeneratingVideoPrompts(false); 
    }
  };`;

if (code.includes(oldFunc)) {
  code = code.replace(oldFunc, newFunc);
  console.log('Successfully updated generateAllVideoPrompts');
} else {
  console.log('generateAllVideoPrompts not found! Check formatting.');
}

fs.writeFileSync('components/ScriptResult.tsx', code);
