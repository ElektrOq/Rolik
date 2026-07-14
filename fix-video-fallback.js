const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldFallbackRegex = /\{scene\.videoPrompt \? \([\s\S]*?\) : \([\s\S]*?<\/div>\s*\)\}/;

const newFallback = `{scene.videoPrompt ? (
                              <div className="p-3 border border-[#2D2E32] rounded bg-[#111318]">
                                <p className="text-[11px] text-slate-300 leading-relaxed font-mono italic">
                                  {scene.videoPrompt}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-[11px] text-slate-500 mb-2">Промпт для оживления кадра не сгенерирован.</p>
                              </div>
                            )}`;

code = code.replace(oldFallbackRegex, newFallback);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed video fallback');
