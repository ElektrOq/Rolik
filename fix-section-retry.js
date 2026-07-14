const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldGen = `  const generateSectionScript = async (section: VideoSection, globalStartTime: number, isLastSection: boolean) => {
    const sectionIndex = script.sections.findIndex(s => s.id === section.id);
    const allSectionTitles = script.sections.map(s => s.title);
    setLoadingSection(prev => ({ ...prev, [section.id]: true }));
    try {
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          style,
          visualStyle,
          character,
          sceneDuration,
          videoTitle: script.title,
          section,
          model,
          globalStartTime,
          isLastSection,
          sectionIndex,
          allSectionTitles,
          allSections: script.sections
        }),
      });

      if (!response.ok) throw new Error('Failed to generate section');
      const data: VideoScene[] = await response.json();
      
      setScenes(prev => ({ ...prev, [section.id]: data }));
    } catch (error) {
      console.error(error);
      alert('Ошибка при генерации сценария. Попробуйте еще раз.');
    } finally {
      setLoadingSection(prev => ({ ...prev, [section.id]: false }));
    }
  };`;

const newGen = `  const generateSectionScript = async (section: VideoSection, globalStartTime: number, isLastSection: boolean) => {
    const sectionIndex = script.sections.findIndex(s => s.id === section.id);
    const allSectionTitles = script.sections.map(s => s.title);
    setLoadingSection(prev => ({ ...prev, [section.id]: true }));
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    
    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        const response = await fetch('/api/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            style,
            visualStyle,
            character,
            sceneDuration,
            videoTitle: script.title,
            section,
            model,
            globalStartTime,
            isLastSection,
            sectionIndex,
            allSectionTitles,
            allSections: script.sections
          }),
        });

        if (!response.ok) throw new Error('Failed to generate section');
        const data: VideoScene[] = await response.json();
        
        if (data && data.length > 0) {
          setScenes(prev => ({ ...prev, [section.id]: data }));
          success = true;
        } else {
          console.warn(\`Section \${section.id} returned empty array, retrying...\`);
          if (attempts >= maxAttempts) {
            playNotification('Генерация главы вернула пустой результат. Попробуйте сгенерировать снова.');
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error(\`Attempt \${attempts} failed:\`, error);
        if (attempts >= maxAttempts) {
          playNotification('Ошибка при генерации сценария. Попробуйте еще раз.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    setLoadingSection(prev => ({ ...prev, [section.id]: false }));
  };`;

code = code.replace(oldGen, newGen);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed generateSectionScript');
