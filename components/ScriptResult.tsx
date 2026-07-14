'use client';

import { VideoScript, VideoSection, VideoScene } from '@/types/script';
import { RefreshCw, Clock, Image as ImageIcon, Video, Scissors, FileText, CheckCircle2, PlayCircle, Loader2, Copy, Languages, Download, Archive, ChevronDown, ChevronUp, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import * as motion from "motion/react-client";
import { useState } from 'react';
import JSZip from 'jszip';

export default function ScriptResult({ script, setScript, topic, style, visualStyle, character, sceneDuration, scenes, setScenes }: { script: VideoScript; setScript: React.Dispatch<React.SetStateAction<VideoScript | null>>; topic: string; style: string; visualStyle: string; character?: string; sceneDuration?: number; scenes: Record<number, VideoScene[]>; setScenes: React.Dispatch<React.SetStateAction<Record<number, VideoScene[]>>> }) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [loadingSection, setLoadingSection] = useState<Record<number, boolean>>({});
  const [loadingVideoPrompt, setLoadingVideoPrompt] = useState<Record<string, boolean>>({});
  const [loadingVisualPrompt, setLoadingVisualPrompt] = useState<Record<string, boolean>>({});
  const [promptRange, setPromptRange] = useState("");
  const [isGeneratingRange, setIsGeneratingRange] = useState(false);
  const [langEn, setLangEn] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [isGeneratingVideoPrompts, setIsGeneratingVideoPrompts] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFeedCollapsed, setIsFeedCollapsed] = useState(false);
  const [isPolishingSection, setIsPolishingSection] = useState<Record<number, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllPrompts = () => {
    const allPrompts = Object.values(scenes).flat().map(scene => scene.imagePrompt).join('\n');
    if (allPrompts) {
      copyToClipboard(allPrompts, 'all-prompts');
    }
  };

  const copyAllText = () => {
    const allText = Object.values(scenes).flat().map(scene => langEn && scene.voiceoverEn ? scene.voiceoverEn : scene.voiceover).join('\n\n');
    if (allText) {
      copyToClipboard(allText, 'all-text');
    }
  };

  const downloadFormattedScript = () => {
    let output = '';
    let globalImageCounter = 1;

    script.sections.forEach((section, index) => {
      output += `ГЛАВА - ${index + 1}\n`;
      const sectionScenes = scenes[section.id];
      if (sectionScenes) {
        sectionScenes.forEach(scene => {
          output += `[${globalImageCounter}.jpg]\n`;
          output += `${langEn && scene.voiceoverEn ? scene.voiceoverEn : scene.voiceover}\n`;
          globalImageCounter++;
        });
      }
    });

    if (output) {
      const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `script_export_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setCopiedIndex('download-formatted');
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const downloadSectionText = (sectionId: number, sectionIndex: number) => {
    const sectionScenes = scenes[sectionId];
    if (!sectionScenes || sectionScenes.length === 0) return;

    const textContent = sectionScenes
      .map(scene => langEn && scene.voiceoverEn ? scene.voiceoverEn : scene.voiceover)
      .join(' ');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chapter_${sectionIndex + 1}_text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCopiedIndex(`download-section-${sectionId}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadAllSectionsZip = async () => {
    if (Object.keys(scenes).length === 0) return;
    const zip = new JSZip();

    zip.folder('IMG');
    zip.folder('ZIP');
    const voiceFolder = zip.folder('VOICE');
    const ruFolder = voiceFolder?.folder('ru');
    const usFolder = voiceFolder?.folder('en');

    script.sections.forEach((section, index) => {
      const sectionScenes = scenes[section.id];
      if (sectionScenes && sectionScenes.length > 0) {
        const textContentRu = sectionScenes.map(scene => scene.voiceover).join(' ');
        const textContentUs = sectionScenes.map(scene => scene.voiceoverEn || scene.voiceover).join(' ');

        ruFolder?.file(`chapter_${index + 1}.txt`, textContentRu);
        usFolder?.file(`chapter_${index + 1}.txt`, textContentUs);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `script_chapters_text_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCopiedIndex('download-zip');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadEntireProjectZip = async () => {
    if (Object.keys(scenes).length === 0) return;
    const zip = new JSZip();

    zip.folder('IMG');
    zip.folder('ZIP');
    const voiceFolder = zip.folder('VOICE');
    const voiceRuFolder = voiceFolder?.folder('ru');
    const voiceUsFolder = voiceFolder?.folder('en');
    const projectFolder = zip.folder('PROJECT');
    const promtFolder = zip.folder('PROMT');

    let fullTextRu = '';
    let fullTextUs = '';
    let allPrompts = '';
    let allVideoPrompts = '';
    let formattedExportRu = '';
    let formattedExportUs = '';
    let globalImageCounter = 1;

    script.sections.forEach((section, index) => {
      const sectionScenes = scenes[section.id];
      if (sectionScenes && sectionScenes.length > 0) {
        const textContentRu = sectionScenes.map(scene => scene.voiceover).join(' ');
        const textContentUs = sectionScenes.map(scene => scene.voiceoverEn || scene.voiceover).join(' ');
        
        voiceRuFolder?.file(`chapter_${index + 1}.txt`, textContentRu);
        voiceUsFolder?.file(`chapter_${index + 1}.txt`, textContentUs);

        fullTextRu += `${textContentRu}\n\n`;
        fullTextUs += `${textContentUs}\n\n`;

        sectionScenes.forEach(scene => {
          if (scene.imagePrompt) {
            allPrompts += scene.imagePrompt + '\n';
          }
          if (scene.videoPrompt) {
            allVideoPrompts += scene.videoPrompt + '\n';
          }
        });

        formattedExportRu += `ГЛАВА - ${index + 1}\n`;
        formattedExportUs += `ГЛАВА - ${index + 1}\n`;
        sectionScenes.forEach(scene => {
          formattedExportRu += `[${globalImageCounter}.jpg]\n`;
          formattedExportRu += `${scene.voiceover}\n`;

          formattedExportUs += `[${globalImageCounter}.jpg]\n`;
          formattedExportUs += `${scene.voiceoverEn || scene.voiceover}\n`;

          globalImageCounter++;
        });
      }
    });

    const projectRuFolder = projectFolder?.folder('ru');
    const projectEnFolder = projectFolder?.folder('en');

    projectRuFolder?.file('full_text.txt', fullTextRu.trim());
    projectRuFolder?.file('script.txt', formattedExportRu.trim());

    projectEnFolder?.file('full_text.txt', fullTextUs.trim());
    projectEnFolder?.file('script.txt', formattedExportUs.trim());

    promtFolder?.file('all_image_prompts.txt', allPrompts.trim());
    if (allVideoPrompts.trim()) {
      promtFolder?.file('all_video_prompts.txt', allVideoPrompts.trim());
    }
    
    const projectData = {
      topic,
      style,
      visualStyle,
      character,
      sceneDuration,
      script,
      scenes
    };
    zip.file('project.json', JSON.stringify(projectData, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCopiedIndex('download-project-zip');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateSectionScript = async (section: VideoSection, globalStartTime: number, isLastSection: boolean) => {
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
            globalStartTime,
            isLastSection,
            sectionIndex,
            allSectionTitles,
            allSections: script.sections
          }),
        });

        if (!response.ok) throw new Error('Failed to generate section');
        const data: VideoScene[] = await response.json();
        
        // Жесткая проверка на содержимое:
        // Массив должен быть непустым, и каждая сцена должна иметь voiceover и visualDescription
        const isValid = data && data.length > 0 && data.every((s: any) => s.voiceover && s.visualDescription);
        
        if (isValid) {
          setScenes(prev => ({ ...prev, [section.id]: data }));
          success = true;
        } else {
          console.warn(`Section ${section.id} returned empty or invalid array, retrying...`);
          if (attempts >= maxAttempts) {
            playNotification('Секция ' + section.title + ' сгенерировалась пустой. Попробуйте нажать кнопку "Перегенерировать секцию".');
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts >= maxAttempts) {
          playNotification('Ошибка при генерации сценария. Попробуйте еще раз.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    setLoadingSection(prev => ({ ...prev, [section.id]: false }));
  };

  const generateVisualPrompt = async (sectionId: number, sceneId: number, scene: VideoScene) => {
    const key = `${sectionId}-${sceneId}`;
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
          character}),
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

  const generateVideoPrompt = async (sectionId: number, sceneId: number, scene: VideoScene) => {
    const key = `${sectionId}-${sceneId}`;
    setLoadingVideoPrompt(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch('/api/generate-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualDescription: scene.visualDescription || '',
          imagePrompt: scene.imagePrompt || '',
          voiceover: scene.voiceover || scene.voiceoverEn || '',
          topic,
          style,
          visualStyle,
          character,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate video prompt');
      const data = await response.json();

      setScenes(prev => {
        const sectionScenes = prev[sectionId] || [];
        const updatedScenes = sectionScenes.map(scene => {
          if (scene.id === sceneId) {
            return { ...scene, videoPrompt: data.videoPrompt };
          }
          return scene;
        });
        return { ...prev, [sectionId]: updatedScenes };
      });
    } catch (error) {
      console.error(error);
      alert('Ошибка при генерации промпта для анимации. Попробуйте еще раз.');
    } finally {
      setLoadingVideoPrompt(prev => ({ ...prev, [key]: false }));
    }
  };

  const playNotification = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateVideoPromptsForRange = async () => {
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
            setLoadingVideoPrompt(prev => ({ ...prev, [`${sectionId}-${s.id}`]: true }));
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
                character}),
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
              setLoadingVideoPrompt(prev => ({ ...prev, [`${sectionId}-${s.id}`]: false }));
            });
          }
        }
      }
      playNotification('Видео-промпты успешно сгенерированы');
    } finally {
      setTimeout(() => setIsGeneratingRange(false), 2000);
    }
  };

  const generateAllSections = async () => {
    setIsGeneratingAll(true);
    let time = 0;
    for (let i = 0; i < script.sections.length; i++) {
      const section = script.sections[i];
      if (!scenes[section.id]) {
        await generateSectionScript(section, time, i === script.sections.length - 1);
        // Small delay between sections to avoid rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
      time += section.estimatedDuration;
    }
    setIsGeneratingAll(false);
    playNotification('Генерация всех глав успешно завершена');
  };

  const polishSection = async (section: VideoSection, index: number) => {
    setIsPolishingSection(prev => ({ ...prev, [section.id]: true }));
    try {
      const sectionScenes = scenes[section.id] || [];
      if (sectionScenes.length === 0) return;

      let previousText = "";
      for (let i = 0; i < index; i++) {
        const prevSection = script.sections[i];
        const prevScenes = scenes[prevSection.id] || [];
        previousText += prevScenes.map(s => s.voiceover).join(" ") + " ";
      }

      const response = await fetch('/api/polish-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          scenes: sectionScenes,
          previousText,
          topic,
        }),
      });

      if (!response.ok) throw new Error('Failed to polish section');
      const data = await response.json();

      setScenes(prev => {
        const newSectionScenes = [...sectionScenes];
        data.updatedScenes.forEach((updatedScene: any) => {
          const sceneIndex = newSectionScenes.findIndex(s => s.id === updatedScene.id);
          if (sceneIndex !== -1) {
            newSectionScenes[sceneIndex] = { ...newSectionScenes[sceneIndex], voiceover: updatedScene.voiceover };
          }
        });
        return { ...prev, [section.id]: newSectionScenes };
      });
    } catch (error) {
      console.error(error);
      alert('Ошибка при редактуре текста.');
    } finally {
      setIsPolishingSection(prev => ({ ...prev, [section.id]: false }));
    }
  };

  const polishAllSections = async () => {
    setIsPolishing(true);
    try {
      for (let i = 0; i < script.sections.length; i++) {
        const section = script.sections[i];
        if (scenes[section.id] && scenes[section.id].length > 0) {
          await polishSection(section, i);
        }
      }
    } finally {
      setIsPolishing(false);
    }
  };

  const generateAllVisuals = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsGeneratingVisuals(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;
        const sectionScenes = scenes[section.id] || [];
        // Only generate for scenes that miss imagePrompt
        const scenesWithoutVisuals = sectionScenes.filter(s => !s.imagePrompt);
        
        if (scenesWithoutVisuals.length === 0) continue;

        // Process in batches of 5 to avoid payload limits and JSON truncation
        const BATCH_SIZE = 3;
        let newSectionScenes = [...sectionScenes];

        for (let i = 0; i < scenesWithoutVisuals.length; i += BATCH_SIZE) {
          const batch = scenesWithoutVisuals.slice(i, i + BATCH_SIZE);
          
          try {
            const response = await fetch('/api/generate-visuals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                scenes: batch,
                topic,
                style,
                visualStyle,
                character}),
            });

            if (!response.ok) throw new Error('Failed to generate visuals');
            const data = await response.json();

            setScenes(prev => {
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
            });
            
            // Add a delay between batches to prevent rate limits
            await new Promise(r => setTimeout(r, 4000));
          } catch (err) {
            console.error(err);
            playNotification('Ошибка при генерации визуальных промптов (batch). Попробуйте еще раз.');
            return;
          }
        }
      }
      playNotification('Генерация визуальных промптов успешно завершена');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при генерации визуальных промптов.');
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  const generateAllVideoPrompts = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsGeneratingVideoPrompts(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;
        const sectionScenes = scenes[section.id] || [];
        const scenesWithoutVideo = sectionScenes.filter(s => !s.videoPrompt);
        
        if (scenesWithoutVideo.length === 0) continue;

        const BATCH_SIZE = 5;
        let newSectionScenes = [...sectionScenes];

        for (let i = 0; i < scenesWithoutVideo.length; i += BATCH_SIZE) {
          const batch = scenesWithoutVideo.slice(i, i + BATCH_SIZE);
          
          batch.forEach(s => {
            setLoadingVideoPrompt(prev => ({ ...prev, [`${section.id}-${s.id}`]: true }));
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
                character}),
            });
            if (!response.ok) throw new Error('Failed to generate video prompts');
            const data = await response.json();
            
            setScenes(prev => {
              const currentSectionScenes = prev[section.id] ? [...prev[section.id]] : [];
              data.updatedPrompts.forEach((promptUpdate: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === promptUpdate.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { 
                    ...currentSectionScenes[sIdx], 
                    videoPrompt: promptUpdate.videoPrompt 
                  };
                }
              });
              return { ...prev, [section.id]: currentSectionScenes };
            });
            
            await new Promise(r => setTimeout(r, 4000));
          } catch (err) {
            console.error(err);
            playNotification('Ошибка при генерации видео-промптов. Попробуйте еще раз.');
            return;
          } finally {
            batch.forEach(s => {
              setLoadingVideoPrompt(prev => ({ ...prev, [`${section.id}-${s.id}`]: false }));
            });
          }
        }
      }
      playNotification('Генерация видео-промптов успешно завершена');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при генерации видео-промптов.');
    } finally { 
      setIsGeneratingVideoPrompts(false); 
    }
  };

  const translateAll = async (filterIds?: number[] | any) => {
    const ids = Array.isArray(filterIds) ? filterIds : null;
    setIsTranslating(true);
    try {
      for (const section of script.sections) {
        if (ids && !ids.includes(section.id)) continue;
        const sectionScenes = scenes[section.id] || [];
        const scenesWithoutTranslation = sectionScenes.filter(s => !s.voiceoverEn);
        
        if (scenesWithoutTranslation.length === 0) continue;

        const BATCH_SIZE = 5;
        let newSectionScenes = [...sectionScenes];
        for (let i = 0; i < scenesWithoutTranslation.length; i += BATCH_SIZE) {
          const batch = scenesWithoutTranslation.slice(i, i + BATCH_SIZE);
          try {
            const response = await fetch('/api/translate-project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scenes: batch }),
            });
            if (!response.ok) throw new Error('Translation failed');
            const data = await response.json();
            setScenes(prev => {
              const currentSectionScenes = prev[section.id] ? [...prev[section.id]] : [];
              data.updatedScenes.forEach((t: any) => {
                const sIdx = currentSectionScenes.findIndex(s => s.id === t.id);
                if (sIdx !== -1) {
                  currentSectionScenes[sIdx] = { 
                    ...currentSectionScenes[sIdx], 
                    voiceover: t.voiceoverRu || currentSectionScenes[sIdx].voiceover,
                    voiceoverEn: t.voiceoverEn 
                  };
                }
              });
              return { ...prev, [section.id]: currentSectionScenes };
            });
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) {
            console.error(err);
            playNotification('Ошибка при переводе. Попробуйте еще раз.');
            return;
          }
        }
      }
      playNotification('Перевод на английский успешно завершен');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при переводе.');
    } finally {
      setIsTranslating(false);
    }
  };

  const sectionStartTimes = script.sections.reduce((acc, section, index) => {
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
      globalSceneIndices[`${section.id}-${s.id}`] = sceneCounterRender++;
    });
  });

  const scrollToChapter = (chapterIndex: number) => {
    const target = script.sections[chapterIndex];
    if (!target) return;
    document.getElementById(`section-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHome = () => {
    document.getElementById('script-home')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="script-home" className="flex flex-col lg:flex-row gap-8 items-start pb-20 scroll-mt-4">
      
      {/* Left side: Content */}
      <div className="w-full lg:flex-1 space-y-6">
        <div className="text-center bg-[#111318] p-6 rounded border border-[#2D2E32]">
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">
            {script.title}
          </h2>
          <p className="mt-3 text-[11px] font-mono text-slate-400">
            {script.description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={generateAllSections}
              disabled={isGeneratingAll || Object.keys(scenes).length === script.sections.length}
              className="w-full flex justify-center items-center gap-2 rounded bg-indigo-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {isGeneratingAll ? 'ГЕНЕРАЦИЯ ВСЕХ ГЛАВ...' : 'СГЕНЕРИРОВАТЬ ВСЕ ГЛАВЫ'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                generateAllVisuals();
                generateAllVideoPrompts();
                translateAll();
              }}
              disabled={isGeneratingVisuals || isGeneratingVideoPrompts || isTranslating || Object.keys(scenes).length === 0}
              className="w-full flex justify-center items-center gap-2 rounded bg-emerald-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600"
              title="Запустить параллельно 3 процесса: генерация image-промптов, video-промптов и перевод на английский"
            >
              {(isGeneratingVisuals || isGeneratingVideoPrompts || isTranslating) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              {(isGeneratingVisuals || isGeneratingVideoPrompts || isTranslating) ? 'СОЗДАНИЕ СТРУКТУРЫ...' : 'СОЗДАТЬ СТРУКТУРУ'}
            </button>

            <button
              onClick={generateAllVisuals}
              disabled={isGeneratingVisuals || Object.keys(scenes).length === 0}
              className="w-full flex justify-center items-center gap-2 rounded bg-fuchsia-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-fuchsia-700 disabled:opacity-50 disabled:hover:bg-fuchsia-600"
              title="Сгенерировать визуальные промпты для загруженных глав"
            >
              {isGeneratingVisuals ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {isGeneratingVisuals ? 'ГЕНЕРАЦИЯ...' : 'IMG ПРОМТЫ'}
            </button>
            
            <button
              onClick={translateAll}
              disabled={isTranslating || Object.keys(scenes).length === 0}
              className="w-full flex justify-center items-center gap-2 rounded bg-indigo-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
              title="Перевести текст загруженного плана на английский язык"
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              {isTranslating ? 'ПЕРЕВОД...' : 'ПЕРЕВЕСТИ EN'}
            </button>

            <button
              onClick={generateAllVideoPrompts}
              disabled={isGeneratingVideoPrompts || Object.keys(scenes).length === 0}
              className="w-full flex justify-center items-center gap-2 rounded bg-pink-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-pink-700 disabled:opacity-50 disabled:hover:bg-pink-600"
              title="Сгенерировать видео-промпты (motion) для всех сцен с готовыми image-промптами"
            >
              {isGeneratingVideoPrompts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {isGeneratingVideoPrompts ? 'АНИМАЦИЯ...' : 'ВИДЕО ПРОМТЫ'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <input
              type="text"
              value={promptRange}
              onChange={(e) => setPromptRange(e.target.value)}
              placeholder="Сцены: 1-8, 10"
              className="w-full sm:w-1/3 bg-[#0A0B0E] border border-[#2D2E32] rounded px-4 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={generateVideoPromptsForRange}
              disabled={isGeneratingRange || !promptRange.trim() || Object.keys(scenes).length === 0}
              className="w-full sm:w-2/3 flex justify-center items-center gap-2 rounded bg-indigo-900/40 border border-indigo-500/50 px-4 py-3 text-xs font-bold tracking-wider uppercase text-indigo-300 transition-colors hover:bg-indigo-900/60 disabled:opacity-50"
            >
              {isGeneratingRange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {isGeneratingRange ? 'ГЕНЕРАЦИЯ...' : 'ВИДЕО ПРОМПТЫ ДЛЯ ВЫБРАННЫХ СЦЕН'}
            </button>
          </div>
        </div>

        {script.sections.length > 0 && (
          <div className="bg-[#111318] p-4 rounded border border-[#2D2E32]">
            <h3 className="text-[11px] font-bold tracking-widest text-white uppercase mb-3">Путеводитель по главам</h3>
            <div className="flex flex-wrap gap-2">
              {script.sections.map((section, index) => (
                <button
                  key={`nav-${section.id}`}
                  onClick={() => {
                    setIsFeedCollapsed(false);
                    setTimeout(() => {
                      const el = document.getElementById(`section-${section.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className="px-3 py-1.5 bg-[#0A0B0E] border border-[#2D2E32] rounded text-[10px] font-mono font-bold text-slate-300 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors uppercase"
                >
                  Глава {index + 1}: {section.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {script.sections.length > 0 && (
          <div className="flex items-center justify-between border-b border-[#2D2E32] pb-2 mt-8 mb-4">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">Основная лента</h3>
            <button
              onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              {isFeedCollapsed ? (
                <>
                  <span className="hidden sm:inline">Развернуть</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Свернуть</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <div className={`space-y-6 ${isFeedCollapsed ? 'hidden' : 'block'}`}>
          {script.sections.map((section, index) => {
          const sectionStartTime = sectionStartTimes[index];
          const sectionScenes = scenes[section.id];
          const isLoading = loadingSection[section.id];

          return (
            <motion.div
              key={section.id}
              id={`section-${section.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="overflow-hidden rounded bg-[#0A0B0E] border border-[#2D2E32]"
            >
              <div className="flex flex-wrap items-center justify-start gap-2 border-b border-[#2D2E32] bg-[#111318] px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={scrollToHome}
                  className="inline-flex items-center gap-1.5 rounded border border-[#3A3D44] bg-[#24272D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-[#30343B] hover:text-white"
                >
                  <Home className="h-3.5 w-3.5" />
                  На главную
                </button>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToChapter(index - 1)}
                    className="inline-flex items-center gap-1.5 rounded border border-[#3A3D44] bg-[#24272D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-[#30343B] hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    К прошлой главе
                  </button>
                )}

                {index < script.sections.length - 1 && (
                  <button
                    type="button"
                    onClick={() => scrollToChapter(index + 1)}
                    className="inline-flex items-center gap-1.5 rounded border border-[#3A3D44] bg-[#24272D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-[#30343B] hover:text-white"
                  >
                    К следующей главе
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="border-b border-[#2D2E32] bg-[#16181D]">
                {/* Desktop Version */}
                <div className="hidden lg:flex px-6 py-8 items-center justify-between relative min-h-[140px]">
                  {/* Invisible Left Spacer to keep center perfect */}
                  <div className="flex-1 opacity-0 pointer-events-none">
                    <div className="flex gap-2 shrink-0">
                      <button className="px-2 py-1">РЕДАКТУРА</button>
                      <button className="px-2 py-1">Текст</button>
                    </div>
                  </div>

                  {/* Main Centered Content */}
                  <div className="flex flex-col items-center justify-center flex-shrink-0 max-w-2xl px-4 z-10 gap-3">
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                      <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1 rounded text-indigo-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                        Глава {index + 1}
                      </div>
                      <span className="font-bold text-lg uppercase tracking-wider text-white text-center">
                        {section.title}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-mono text-center">
                      {section.description}
                    </p>
                  </div>

                  {/* Right Side Content */}
                  <div className="flex-1 flex flex-col items-end justify-center gap-3">
                    <div className="font-mono text-xs text-slate-500 text-right">
                      {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? ` / ~${section.estimatedCharacters} симв.` : ''})</span>
                    </div>
                    {sectionScenes && (
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => polishSection(section, index)}
                          disabled={isPolishingSection[section.id]}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-900/50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          title="Убрать повторы в главе"
                        >
                          {isPolishingSection[section.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
                          {isPolishingSection[section.id] ? 'ОБРАБОТКА...' : 'РЕДАКТУРА'}
                        </button>
                        <button 
                          onClick={() => downloadSectionText(section.id, index)}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-900/50 px-2 py-1 rounded transition-colors"
                          title="Скачать текст главы целиком"
                        >
                          {copiedIndex === `download-section-${section.id}` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                          Текст
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Version */}
                <div className="lg:hidden flex flex-col items-center px-4 py-6 relative">
                  {/* Main Centered Content */}
                  <div className="flex flex-col items-center justify-center w-full max-w-3xl z-10 gap-3">
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                      <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1 rounded text-indigo-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                        Глава {index + 1}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-white text-center">
                        {section.title}
                      </span>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-slate-400 font-mono text-center max-w-xl">
                      {section.description}
                    </p>
                  </div>

                  {/* Mobile Fallback for Right Content */}
                  <div className="flex flex-col items-center gap-3 mt-5 w-full z-10 border-t border-[#2D2E32] pt-4">
                    <div className="font-mono text-xs text-slate-500 text-center">
                      {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? ` / ~${section.estimatedCharacters} симв.` : ''})</span>
                    </div>
                    {sectionScenes && (
                      <div className="flex flex-wrap justify-center gap-2 shrink-0">
                        <button 
                          onClick={() => polishSection(section, index)}
                          disabled={isPolishingSection[section.id]}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-900/50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          title="Убрать повторы в главе"
                        >
                          {isPolishingSection[section.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
                          {isPolishingSection[section.id] ? 'ОБРАБОТКА...' : 'РЕДАКТУРА'}
                        </button>
                        <button 
                          onClick={() => downloadSectionText(section.id, index)}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-900/50 px-2 py-1 rounded transition-colors"
                          title="Скачать текст главы целиком"
                        >
                          {copiedIndex === `download-section-${section.id}` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                          Текст
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!sectionScenes ? (
                <div className="p-8 flex justify-center items-center bg-[#0A0B0E]">
                  <button
                    onClick={() => generateSectionScript(section, sectionStartTime, index === script.sections.length - 1)}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold tracking-wider uppercase transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    <span>{isLoading ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ СЦЕНАРИЙ СЕКЦИИ'}</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#2D2E32]">
                  {sectionScenes.map((scene, sceneIndex) => (
                    <div key={scene.id} className="p-0 flex flex-col sm:flex-row bg-[#0A0B0E]">
                      {/* Left Column: Script & Narration */}
                      <div className="flex-1 p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-[#2D2E32] relative">
                         <div className="absolute top-2 right-4 text-[10px] font-mono text-slate-500">
                          {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                        </div>
                        <div className="flex gap-3 mb-6 mt-2">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-900/30 text-blue-400 border border-blue-800">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ТЕКСТ (VOICEOVER)</h4>
                              <span className="text-[9px] font-mono font-bold text-slate-500 bg-[#16181D] px-2 py-0.5 rounded border border-[#2D2E32]">
                                Символов: {langEn && scene.voiceoverEn ? scene.voiceoverEn.length : (scene.voiceover?.length || 0)} / {Math.round(scene.duration * 15)}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#D1D5DB] leading-relaxed">&quot;{langEn && scene.voiceoverEn ? scene.voiceoverEn : scene.voiceover}&quot;</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-900/30 text-orange-400 border border-orange-800">
                            <Scissors className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">МОНТАЖ</h4>
                            <p className="text-[12px] text-slate-400 leading-relaxed">{scene.editingCue}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-6 border-t border-[#2D2E32]/30">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/50">
                            <Video className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">АНИМАЦИЯ КАДРА</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVideoPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVideoPrompt[`${section.id}-${scene.id}`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVideoPrompt[`${section.id}-${scene.id}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVideoPrompt[`${section.id}-${scene.id}`] ? 'Генерация...' : 'Перегенерировать'}</span>
                                </button>
                                {scene.videoPrompt && (
                                  <button
                                    onClick={() => copyToClipboard(scene.videoPrompt || '', `video-${section.id}-${scene.id}`)}
                                    className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-indigo-400 hover:text-white transition-colors bg-indigo-950/50 px-2 py-1 rounded border border-indigo-900"
                                  >
                                    {copiedIndex === `video-${section.id}-${scene.id}` ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400">СКОПИРОВАНО</span>
                                    </>
                                  ) : (
                                    <span>КОПИРОВАТЬ</span>
                                  )}
                                </button>
                                )}
                              </div>
                            </div>

                            {scene.videoPrompt ? (
                              <div className="p-3 border border-[#2D2E32] rounded bg-[#111318]">
                                <p className="text-[11px] text-slate-300 leading-relaxed font-mono italic">
                                  {scene.videoPrompt}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-[11px] text-slate-500 mb-2">Промпт для оживления кадра не сгенерирован.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Visual AI Prompt / Action */}
                      <div className="flex-1 bg-[#111318] p-5 sm:p-6 relative"> 
                        <div className="absolute top-2 right-4 flex items-center gap-2">
                          <div className="bg-indigo-950/40 border border-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-[9px] font-bold tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                            Сцена {globalSceneIndices[`${section.id}-${scene.id}`]}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{scene.duration}с</span>
                        </div>
                        <div className="flex gap-3 mb-6 mt-2">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                            <Video className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ВИЗУАЛ</h4>
                            <p className="text-[12px] text-slate-300 leading-relaxed">{scene.visualDescription}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-900/30 text-purple-400 border border-purple-800">
                            <ImageIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest underline">AI Промпт</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVisualPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVisualPrompt[`${section.id}-${scene.id}`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVisualPrompt[`${section.id}-${scene.id}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVisualPrompt[`${section.id}-${scene.id}`] ? 'Генерация...' : 'Перегенерировать'}</span>
                                </button>
                                <button
                                  onClick={() => copyToClipboard(scene.imagePrompt, `${section.id}-${scene.id}`)}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-purple-400 hover:text-white transition-colors bg-purple-900/30 px-2 py-1 rounded border border-purple-800"
                                >
                                  {copiedIndex === `${section.id}-${scene.id}` ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>СКОПИРОВАНО</span>
                                  </>
                                ) : (
                                  <span>КОПИРОВАТЬ ПРОМПТ</span>
                                )}
                              </button>
                              </div>
                            </div>
                            <div className="p-3 border border-[#2D2E32] rounded bg-[#0A0B0E]">
                              <p className="text-[11px] text-slate-400 leading-relaxed font-mono italic">
                                {scene.imagePrompt}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* Right side: Exports & Stats panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-8">
        <div className="bg-[#111318] p-6 rounded border border-[#2D2E32]">
          <h3 className="text-[11px] font-bold tracking-widest text-white uppercase mb-4">Информация</h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Длительность</span>
              <span className="text-white">~{script.targetDuration} МИН</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Секций</span>
              <span className="text-white">{script.sections.length}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Сцен сгенерировано</span>
              <span className="text-white">{Object.values(scenes).flat().length}</span>
            </div>
          </div>
          
          <h3 className="text-[11px] font-bold tracking-widest text-white uppercase mb-4 border-t border-[#2D2E32] pt-6">Экспорт</h3>
          <div className="space-y-3">
            <button
              onClick={copyAllPrompts}
              disabled={Object.keys(scenes).length === 0}
              className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${Object.keys(scenes).length > 0 ? 'bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border-purple-900/50' : 'bg-[#0A0B0E] text-slate-600 border-[#2D2E32] cursor-not-allowed'}`}
            >
              {copiedIndex === 'all-prompts' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Все промпты (AI)</span>
            </button>

            <button
              onClick={copyAllText}
              disabled={Object.keys(scenes).length === 0}
              className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${Object.keys(scenes).length > 0 ? 'bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border-blue-900/50' : 'bg-[#0A0B0E] text-slate-600 border-[#2D2E32] cursor-not-allowed'}`}
            >
              {copiedIndex === 'all-text' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Весь текст ({langEn ? 'EN' : 'RU'})</span>
            </button>
            <button
              onClick={downloadFormattedScript}
              disabled={Object.keys(scenes).length === 0}
              className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${Object.keys(scenes).length > 0 ? 'bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border-emerald-900/50' : 'bg-[#0A0B0E] text-slate-600 border-[#2D2E32] cursor-not-allowed'}`}
            >
              {copiedIndex === 'download-formatted' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>Формат выгрузки (.txt)</span>
            </button>
            <button
              onClick={downloadAllSectionsZip}
              disabled={Object.keys(scenes).length === 0}
              className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${Object.keys(scenes).length > 0 ? 'bg-orange-900/20 hover:bg-orange-900/40 text-orange-400 border-orange-900/50' : 'bg-[#0A0B0E] text-slate-600 border-[#2D2E32] cursor-not-allowed'}`}
            >
              {copiedIndex === 'download-zip' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              <span>Тексты по главам (.zip)</span>
            </button>
            <button
              onClick={downloadEntireProjectZip}
              disabled={Object.keys(scenes).length === 0}
              className={`w-full flex items-center justify-center gap-2 border px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${Object.keys(scenes).length > 0 ? 'bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border-rose-900/50' : 'bg-[#0A0B0E] text-slate-600 border-[#2D2E32] cursor-not-allowed'}`}
            >
              {copiedIndex === 'download-project-zip' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>Весь проект (.zip)</span>
            </button>
          </div>

          <h3 className="text-[11px] font-bold tracking-widest text-white uppercase mb-4 border-t border-[#2D2E32] pt-6">Настройки текста</h3>
          <button
            onClick={() => setLangEn(!langEn)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors border ${langEn ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-[#16181D] hover:bg-[#1C1E26] text-slate-400 border-[#2D2E32]'}`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>ЯЗЫК: {langEn ? 'АНГЛИЙСКИЙ' : 'РУССКИЙ'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

