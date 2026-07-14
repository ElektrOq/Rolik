const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

// Generate All Visuals
code = code.replace(
  `const generateAllVisuals = async (filterIds?: number[]) => {
    setIsGeneratingVisuals(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`,
  `const generateAllVisuals = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsGeneratingVisuals(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;`
);

// Generate All Video Prompts
code = code.replace(
  `const generateAllVideoPrompts = async (filterIds?: number[]) => {
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`,
  `const generateAllVideoPrompts = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;`
);

// Translate All
code = code.replace(
  `const translateAll = async (filterIds?: number[]) => {
    setIsTranslating(true);
    try {
      for (const section of script.sections) {
        if (filterIds && !filterIds.includes(section.id)) continue;`,
  `const translateAll = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsTranslating(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;`
);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed event handlers!');
