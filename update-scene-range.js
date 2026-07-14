const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const newFunc = `  const generateVideoPromptsForRange = async () => {
    if (!promptRange.trim()) return;
    const rangeStr = promptRange.trim();
    
    // Calculate global scene indices to map them to sectionId and sceneId
    const globalSceneMap: { sectionId: number, sceneId: number, scene: VideoScene, globalIndex: number }[] = [];
    let sceneCounter = 1;
    script.sections.forEach(section => {
      const sScenes = scenes[section.id] || [];
      sScenes.forEach(s => {
        globalSceneMap.push({ sectionId: section.id, sceneId: s.id, scene: s, globalIndex: sceneCounter++ });
      });
    });
    const max = globalSceneMap.length;
    
    const resultIndices = new Set<number>();
    const parts = rangeStr.split(',');
    for (const part of parts) {
      const p = part.trim();
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= max) resultIndices.add(i);
          }
        }
      } else {
        const num = Number(p);
        if (!isNaN(num) && num > 0 && num <= max) resultIndices.add(num);
      }
    }
    
    const targetItems = Array.from(resultIndices).map(idx => globalSceneMap[idx - 1]);
    if (targetItems.length === 0) {
      playNotification('Неверный формат диапазона или сцены не найдены');
      return;
    }
    
    setIsGeneratingRange(true);
    try {
      // Group by section to generate batches correctly per section
      const groupedBySection: Record<number, typeof targetItems> = {};
      targetItems.forEach(item => {
        if (!groupedBySection[item.sectionId]) groupedBySection[item.sectionId] = [];
        groupedBySection[item.sectionId].push(item);
      });
      
      for (const sectionIdStr of Object.keys(groupedBySection)) {
        const sectionId = Number(sectionIdStr);
        const sectionItems = groupedBySection[sectionId];
        const scenesForSection = sectionItems.map(i => i.scene);
        
        const BATCH_SIZE = 5;
        for (let i = 0; i < scenesForSection.length; i += BATCH_SIZE) {
          const batch = scenesForSection.slice(i, i + BATCH_SIZE);
          
          batch.forEach(s => {
            setLoadingVideoPrompt(prev => ({ ...prev, [\`\${sectionId}-\${s.id}\`]: true }));
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
            
            setScenes(prev => {
              const currentSectionScenes = prev[sectionId] ? [...prev[sectionId]] : [];
              data.updatedPrompts.forEach((promptUpdate: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === promptUpdate.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { ...currentSectionScenes[sIdx], videoPrompt: promptUpdate.videoPrompt };
                }
              });
              return { ...prev, [sectionId]: currentSectionScenes };
            });
            await new Promise(r => setTimeout(r, 4000));
          } catch (err) {
            console.error(err);
            playNotification('Ошибка при генерации видео-промптов. Попробуйте еще раз.');
          } finally {
            batch.forEach(s => {
              setLoadingVideoPrompt(prev => ({ ...prev, [\`\${sectionId}-\${s.id}\`]: false }));
            });
          }
        }
      }
      playNotification('Видео-промпты успешно сгенерированы');
    } finally {
      setTimeout(() => setIsGeneratingRange(false), 2000);
    }
  };`;

// Replace generateStructureForRange
code = code.replace(/  const generateStructureForRange = async \(\) => \{[\s\S]*?  const generateAllSections = async \(\) => \{/m, newFunc + '\n\n  const generateAllSections = async () => {');

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Done 1');
