const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const newFunc = `  const generateStructureForRange = async () => {
    if (!promptRange.trim()) return;
    const rangeStr = promptRange.trim();
    const max = script.sections.length;
    
    const resultIds = new Set<number>();
    const parts = rangeStr.split(',');
    for (const part of parts) {
      const p = part.trim();
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= max) resultIds.add(script.sections[i - 1].id);
          }
        }
      } else {
        const num = Number(p);
        if (!isNaN(num) && num > 0 && num <= max) resultIds.add(script.sections[num - 1].id);
      }
    }
    
    const filterIds = Array.from(resultIds);
    if (filterIds.length === 0) {
      playNotification('Неверный формат диапазона или главы не найдены');
      return;
    }
    
    setIsGeneratingRange(true);
    try {
      // Parallel execution
      generateAllVisuals(filterIds);
      generateAllVideoPrompts(filterIds);
      translateAll(filterIds);
      
      // Wait for all to finish conceptually by checking states?
      // Since they are independent asyncs that set their own states, we can just await them
      // But they set their own loading states which disable buttons.
      // So we just fire them and let them do their thing.
    } finally {
      setTimeout(() => setIsGeneratingRange(false), 2000); // just to show button state briefly
    }
  };

  const generateAllSections = async () => {`;

code = code.replace(`  const generateAllSections = async () => {`, newFunc);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Added generateStructureForRange!');
