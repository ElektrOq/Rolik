const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldUI = `                      {/* Right Column: Visual AI Prompt / Action */}
                      <div className="flex-1 bg-[#111318] p-5 sm:p-6 relative"> 
                        <div className="absolute top-2 right-4 text-[10px] font-mono text-slate-500">
                          {scene.duration}с
                        </div>`;

const newUI = `                      {/* Right Column: Visual AI Prompt / Action */}
                      <div className="flex-1 bg-[#111318] p-5 sm:p-6 relative"> 
                        <div className="absolute top-2 right-4 flex items-center gap-2">
                          <div className="bg-indigo-950/40 border border-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-[9px] font-bold tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                            Сцена {globalSceneIndices[\`\${section.id}-\${scene.id}\`]}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{scene.duration}с</span>
                        </div>`;

code = code.replace(oldUI, newUI);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed duration UI');
