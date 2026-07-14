import ScriptGenerator from '@/components/ScriptGenerator';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0B0E] text-[#D1D5DB] font-sans selection:bg-indigo-500/30">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center border-b border-[#2D2E32] pb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">Нейро-Студия v2.4</h1>
              <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest text-left mt-1">Конвейер ИИ-продакшена</p>
            </div>
          </div>
          <p className="mx-auto max-w-2xl text-sm text-slate-400 font-mono">
            Генерируйте подробные, логически выстроенные сценарии для YouTube. Точные таймкоды, промпты для генерации изображений и инструкции для монтажа.
          </p>
        </header>
        
        <ScriptGenerator />
      </div>
    </main>
  );
}
