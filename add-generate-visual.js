const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const generateVideoPromptDef = `  const generateVideoPrompt = async (sectionId: number, sceneId: number, scene: VideoScene) => {`;
const generateVisualPromptDef = `  const generateVisualPrompt = async (sectionId: number, sceneId: number, scene: VideoScene) => {
    const key = \`\${sectionId}-\${sceneId}\`;
    setLoadingVisualPrompt(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch('/api/generate-visuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: [scene],
          topic,
          style,
          visualStyle,
          character,
          model
        }),
      });
      if (!response.ok) throw new Error('Failed to generate visual prompt');
      const data = await response.json();
      const updatedVisual = data.updatedVisuals[0];
      
      setScenes(prev => {
        const sectionScenes = prev[sectionId] || [];
        const updatedScenes = sectionScenes.map(s => {
          if (s.id === sceneId) {
            return { 
              ...s, 
              visualDescription: updatedVisual.visualDescription || s.visualDescription,
              imagePrompt: updatedVisual.imagePrompt || s.imagePrompt,
              editingCue: updatedVisual.editingCue || s.editingCue
            };
          }
          return s;
        });
        return { ...prev, [sectionId]: updatedScenes };
      });
    } catch (error) {
      console.error(error);
      playNotification('Ошибка при генерации визуального промпта. Попробуйте еще раз.');
    } finally {
      setLoadingVisualPrompt(prev => ({ ...prev, [key]: false }));
    }
  };

  const generateVideoPrompt = async (sectionId: number, sceneId: number, scene: VideoScene) => {`;

code = code.replace(generateVideoPromptDef, generateVisualPromptDef);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Added generateVisualPrompt');
