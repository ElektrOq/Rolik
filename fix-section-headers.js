const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const desktopHeaderOld = `<div className="flex items-center justify-center space-x-3 text-indigo-400">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {section.id}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-slate-200 text-center">
                        {section.title}
                      </span>
                    </div>`;

const desktopHeaderNew = `<div className="flex flex-col items-center justify-center gap-2 mb-2">
                      <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1 rounded text-indigo-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                        Глава {index + 1}
                      </div>
                      <span className="font-bold text-lg uppercase tracking-wider text-white text-center">
                        {section.title}
                      </span>
                    </div>`;

code = code.replace(desktopHeaderOld, desktopHeaderNew);

const mobileHeaderOld = `<div className="flex items-center justify-center space-x-3 text-indigo-400">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-600 font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        {section.id}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-slate-200 text-center">
                        {section.title}
                      </span>
                    </div>`;

const mobileHeaderNew = `<div className="flex flex-col items-center justify-center gap-2 mb-2">
                      <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/30 px-3 py-1 rounded text-indigo-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                        Глава {index + 1}
                      </div>
                      <span className="font-bold text-base uppercase tracking-wider text-white text-center">
                        {section.title}
                      </span>
                    </div>`;

code = code.replace(mobileHeaderOld, mobileHeaderNew);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed section headers');
