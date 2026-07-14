const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldLogic = `  const sectionStartTimes = script.sections.reduce((acc, section, index) => {
    if (index === 0) {
      acc.push(0);
    } else {
      acc.push(acc[index - 1] + script.sections[index - 1].estimatedDuration);
    }
    return acc;
  }, [] as number[]);

  return (`;

const newLogic = `  const sectionStartTimes = script.sections.reduce((acc, section, index) => {
    if (index === 0) {
      acc.push(0);
    } else {
      acc.push(acc[index - 1] + script.sections[index - 1].estimatedDuration);
    }
    return acc;
  }, [] as number[]);

  const globalSceneIndices: Record<string, number> = {};
  let sceneCounterRender = 1;
  script.sections.forEach(section => {
    const sScenes = scenes[section.id] || [];
    sScenes.forEach(s => {
      globalSceneIndices[\`\${section.id}-\${s.id}\`] = sceneCounterRender++;
    });
  });

  return (`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Added global scene indices computation');
