'use client';

import { useState } from 'react';
import { VideoScript } from '@/types/script';
import ScriptResult from './ScriptResult';
import { Loader2, Wand2, FileText } from 'lucide-react';
import { motion } from "motion/react";

export default function ScriptGenerator() {
  const [topic, setTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [style, setStyle] = useState('Образовательный и вовлекающий');
  const [visualStyle, setVisualStyle] = useState('В векторном стиле (Vector style, flat design, colorful), 16:9, 8k');
  const [character, setCharacter] = useState('');
  const [sceneDuration, setSceneDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [scenes, setScenes] = useState<Record<number, any>>({});
  const [error, setError] = useState('');

  const handleSaveProject = () => {
    const data = {
      topic,
      durationMinutes,
      style,
      visualStyle,
      character,
      sceneDuration,
      script,
      scenes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.topic) setTopic(data.topic);
        if (data.durationMinutes) setDurationMinutes(data.durationMinutes);
        if (data.style) setStyle(data.style);
        if (data.visualStyle) setVisualStyle(data.visualStyle);
        if (data.character) setCharacter(data.character);
        if (data.sceneDuration) setSceneDuration(data.sceneDuration);
        if (data.script) setScript(data.script);
        if (data.scenes) setScenes(data.scenes);
        setError('');
      } catch (err) {
        setError('Ошибка при загрузке файла');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleUploadReadyPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        const newSections: any[] = [];
        const newScenes: Record<number, any[]> = {};
        
        let currentSectionId = 0;
        let currentScene: any = null;
        let inTitle = false;

        lines.forEach(line => {
          const chapterMatch = line.match(/^ГЛАВА\s*-\s*(\d+)/i);
          if (chapterMatch) {
            if (currentScene && currentSectionId) {
              newScenes[currentSectionId].push(currentScene);
              currentScene = null;
            }
            currentSectionId = parseInt(chapterMatch[1], 10);
            newSections.push({
              id: currentSectionId,
              title: `Глава ${currentSectionId}`,
              description: '',
              estimatedDuration: 0
            });
            newScenes[currentSectionId] = [];
            inTitle = true;
            return;
          }

          if (inTitle && currentSectionId) {
            const section = newSections.find(s => s.id === currentSectionId);
            if (section) {
              section.title = line;
            }
            inTitle = false;
            return;
          }

          const imageMatch = line.match(/^\[(\d+)\.jpg\]/i);
          if (imageMatch) {
            if (currentScene && currentSectionId) {
              newScenes[currentSectionId].push(currentScene);
            }
            currentScene = {
              id: parseInt(imageMatch[1], 10),
              voiceover: '',
              imagePrompt: '',
              videoPrompt: ''
            };
            return;
          }

          if (currentScene) {
            currentScene.voiceover += (currentScene.voiceover ? ' ' : '') + line;
          }
        });

        if (currentScene && currentSectionId) {
          newScenes[currentSectionId].push(currentScene);
        }

        if (newSections.length > 0) {
          // Calculate estimated durations for each section
          newSections.forEach(section => {
            const sectionScenes = newScenes[section.id] || [];
            let currentStartTime = 0;
            sectionScenes.forEach(scene => {
              scene.duration = sceneDuration || 15;
              scene.startTime = currentStartTime;
              scene.endTime = currentStartTime + scene.duration;
              currentStartTime += scene.duration;
            });
            section.estimatedDuration = sectionScenes.length * (sceneDuration || 15);
            section.estimatedCharacters = sectionScenes.reduce((acc, scene) => acc + (scene.voiceover?.length || 0), 0);
          });
          setScript({ title: topic || 'Загруженный проект', description: '', sections: newSections, targetDuration: Math.round(newSections.reduce((acc, s) => acc + s.estimatedDuration, 0) / 60) });
          setScenes(newScenes);
        } else {
          alert('Не удалось распознать формат файла. Убедитесь, что он содержит "ГЛАВА - X" и "[Y.jpg]"');
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  const generateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setScript(null);

    try {
      const response = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, durationMinutes, style }),
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации плана. Попробуйте еще раз.');
      }

      const data = await response.json();
      setScript(data);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Структура сценария сгенерирована');
        utterance.lang = 'ru-RU';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setError(err.message || 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded bg-[#111318] p-6 shadow-xl border border-[#2D2E32] sm:p-8"
      >
        <form onSubmit={generateScript} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Тема или идея ролика
            </label>
            <div className="mt-2">
              <textarea
                id="topic"
                rows={3}
                className="block w-full rounded border border-[#2D2E32] bg-[#0A0B0E] py-3 px-4 text-[#D1D5DB] shadow-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Например, История искусственного интеллекта в стиле сай-фай."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="duration" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Длительность ролика (минуты)
              </label>
              <div className="mt-2 flex items-center space-x-4">
                <input
                  type="range"
                  id="duration-slider"
                  min="1"
                  max="120"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="w-16 rounded bg-[#0A0B0E] px-3 py-1.5 text-center text-[10px] font-mono text-indigo-400 border border-[#2D2E32]">
                  {durationMinutes}м
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="sceneDuration" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Длительность сцены (секунды)
              </label>
              <div className="mt-2 flex items-center space-x-4">
                <input
                  type="range"
                  id="scene-duration-slider"
                  min="5"
                  max="60"
                  step="5"
                  value={sceneDuration}
                  onChange={(e) => setSceneDuration(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="w-16 rounded bg-[#0A0B0E] px-3 py-1.5 text-center text-[10px] font-mono text-indigo-400 border border-[#2D2E32]">
                  {sceneDuration}с
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="style" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Тон / Стиль
            </label>
            <div className="mt-2">
              <select
                id="style"
                className="block w-full rounded border border-[#2D2E32] bg-[#0A0B0E] py-3 px-4 text-[#D1D5DB] shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm sm:leading-6"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Образовательный и вовлекающий">Образовательный и вовлекающий</option>
                <option value="Динамичный и энергичный">Динамичный и энергичный</option>
                <option value="Кинематографичный и драматичный">Кинематографичный и драматичный</option>
                <option value="Юмористический и развлекательный">Юмористический и развлекательный</option>
                <option value="Документальный и серьезный">Документальный и серьезный</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="visualStyle" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Визуальный стиль (Для AI-картинок)
            </label>
            <div className="mt-2">
              <input
                id="visualStyle"
                type="text"
                className="block w-full rounded border border-[#2D2E32] bg-[#0A0B0E] py-3 px-4 text-[#D1D5DB] shadow-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Например: Cinematic, hyper-realistic, 8k"
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="character" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Персонаж / Рассказчик (Опционально)
            </label>
            <div className="mt-2">
              <input
                id="character"
                type="text"
                className="block w-full rounded border border-[#2D2E32] bg-[#0A0B0E] py-3 px-4 text-[#D1D5DB] shadow-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Например: young scientist with glasses and a white coat"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
              />
            </div>
          </div>



          {error && (
            <div className="rounded bg-red-950/30 p-4 text-[11px] font-mono text-red-400 border border-red-900/50">
              {error}
            </div>
          )}

          <div className="pt-4 space-y-4">
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="flex-1 group relative flex justify-center overflow-hidden rounded bg-indigo-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ИНИЦИАЛИЗАЦИЯ...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    СГЕНЕРИРОВАТЬ ПЛАН
                  </>
                )}
              </button>

              <div className="flex-1 relative">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleUploadReadyPlan}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex w-full h-full justify-center items-center gap-2 rounded bg-emerald-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-emerald-700">
                  <FileText className="w-4 h-4" />
                  ЗАГРУЗИТЬ ГОТОВЫЙ ПЛАН (.TXT)
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSaveProject}
                disabled={!script}
                className="flex-1 flex justify-center items-center rounded border border-[#2D2E32] bg-[#16181D] px-4 py-3 text-xs font-bold tracking-wider uppercase text-slate-300 transition-colors hover:bg-[#1C1E26] hover:text-white disabled:opacity-50 disabled:hover:bg-[#16181D]"
              >
                Сохранить проект
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadProject}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex w-full h-full justify-center items-center rounded border border-[#2D2E32] bg-[#16181D] px-4 py-3 text-xs font-bold tracking-wider uppercase text-slate-300 transition-colors hover:bg-[#1C1E26] hover:text-white">
                  Загрузить проект
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      {script && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ScriptResult script={script} setScript={setScript} topic={topic} style={style} visualStyle={visualStyle} character={character} sceneDuration={sceneDuration} scenes={scenes} setScenes={setScenes} />
        </motion.div>
      )}
    </div>
  );
}
