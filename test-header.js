const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldHeader = `<div className="border-b border-[#2D2E32] bg-[#16181D] px-6 py-6 md:py-8 flex flex-col items-center justify-center relative min-h-[140px]">
                
                {/* Absolute Right Side Content (Desktop) */}
                <div className="hidden lg:flex absolute right-6 top-0 bottom-0 flex-col items-end justify-center gap-3">
                  <div className="font-mono text-xs text-slate-500 text-right">
                    {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? \` / ~\${section.estimatedCharacters} симв.\` : ''})</span>
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
                        {copiedIndex === \`download-section-\${section.id}\` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                        Текст
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Centered Content */}
                <div className="flex flex-col items-center justify-center w-full max-w-3xl z-10 gap-3">
                  <div className="flex items-center justify-center space-x-3 text-indigo-400">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                      {section.id}
                    </div>
                    <span className="font-bold text-base uppercase tracking-wider text-slate-200 text-center">
                      {section.title}
                    </span>
                  </div>
                  
                  <p className="text-[11px] leading-relaxed text-slate-400 font-mono text-center max-w-xl">
                    {section.description}
                  </p>
                </div>

                {/* Mobile Fallback for Right Content */}
                <div className="lg:hidden flex flex-col items-center gap-3 mt-5 w-full z-10 border-t border-[#2D2E32] pt-4">
                  <div className="font-mono text-xs text-slate-500 text-center">
                    {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? \` / ~\${section.estimatedCharacters} симв.\` : ''})</span>
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
                        {copiedIndex === \`download-section-\${section.id}\` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                        Текст
                      </button>
                    </div>
                  )}
                </div>

              </div>`;

const newHeader = `<div className="border-b border-[#2D2E32] bg-[#16181D]">
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
                    <div className="flex items-center justify-center space-x-3 text-indigo-400">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {section.id}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-slate-200 text-center">
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
                      {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? \` / ~\${section.estimatedCharacters} симв.\` : ''})</span>
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
                          {copiedIndex === \`download-section-\${section.id}\` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
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
                    <div className="flex items-center justify-center space-x-3 text-indigo-400">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {section.id}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-slate-200 text-center">
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
                      {formatTime(sectionStartTime)} - {formatTime(sectionStartTime + section.estimatedDuration)} <span className="opacity-70">({section.estimatedDuration}с{section.estimatedCharacters ? \` / ~\${section.estimatedCharacters} симв.\` : ''})</span>
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
                          {copiedIndex === \`download-section-\${section.id}\` ? <CheckCircle2 className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                          Текст
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>`;

if (code.includes(oldHeader)) {
  code = code.replace(oldHeader, newHeader);
  console.log('Replaced header successfully.');
} else {
  console.log('Header not found!');
}

fs.writeFileSync('components/ScriptResult.tsx', code);
