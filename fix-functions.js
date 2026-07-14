const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

// Generate All Visuals
code = code.replace(
  `const generateAllVisuals = async () => {
    setIsGeneratingVisuals(true);
    try {
      for (const section of script.sections) {`,
  `const generateAllVisuals = async (filterIds?: number[]) => {
    setIsGeneratingVisuals(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`
);

// Generate All Video Prompts
code = code.replace(
  `const generateAllVideoPrompts = async () => {
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {`,
  `const generateAllVideoPrompts = async (filterIds?: number[]) => {
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`
);

// Translate All
code = code.replace(
  `const translateAll = async () => {
    setIsTranslating(true);
    try {
      for (const section of script.sections) {`,
  `const translateAll = async (filterIds?: number[]) => {
    setIsTranslating(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`
);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed generate functions!');
