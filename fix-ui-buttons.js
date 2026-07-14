const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const imgPromptOld = `<h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest underline">AI Промпт</h4>
                              <button
                                onClick={() => copyToClipboard(scene.imagePrompt, \`\${section.id}-\${scene.id}\`)}
                                className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-purple-400 hover:text-white transition-colors bg-purple-900/30 px-2 py-1 rounded border border-purple-800"
                              >
                                {copiedIndex === \`\${section.id}-\${scene.id}\` ? (`;

const imgPromptNew = `<h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest underline">AI Промпт</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVisualPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVisualPrompt[\`\${section.id}-\${scene.id}\`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVisualPrompt[\`\${section.id}-\${scene.id}\`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVisualPrompt[\`\${section.id}-\${scene.id}\`] ? 'Генерация...' : 'Перегенерировать'}</span>
                                </button>
                                <button
                                  onClick={() => copyToClipboard(scene.imagePrompt, \`\${section.id}-\${scene.id}\`)}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-purple-400 hover:text-white transition-colors bg-purple-900/30 px-2 py-1 rounded border border-purple-800"
                                >
                                  {copiedIndex === \`\${section.id}-\${scene.id}\` ? (`;

code = code.replace(imgPromptOld, imgPromptNew);


const videoPromptOld = `<h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">АНИМАЦИЯ КАДРА</h4>
                              {scene.videoPrompt && (
                                <button
                                  onClick={() => copyToClipboard(scene.videoPrompt || '', \`video-\${section.id}-\${scene.id}\`)}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-indigo-400 hover:text-white transition-colors bg-indigo-950/50 px-2 py-1 rounded border border-indigo-900"
                                >
                                  {copiedIndex === \`video-\${section.id}-\${scene.id}\` ? (`;

const videoPromptNew = `<h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">АНИМАЦИЯ КАДРА</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVideoPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVideoPrompt[\`\${section.id}-\${scene.id}\`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVideoPrompt[\`\${section.id}-\${scene.id}\`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVideoPrompt[\`\${section.id}-\${scene.id}\`] ? 'Генерация...' : 'Перегенерировать'}</span>
                                </button>
                                {scene.videoPrompt && (
                                  <button
                                    onClick={() => copyToClipboard(scene.videoPrompt || '', \`video-\${section.id}-\${scene.id}\`)}
                                    className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-indigo-400 hover:text-white transition-colors bg-indigo-950/50 px-2 py-1 rounded border border-indigo-900"
                                  >
                                    {copiedIndex === \`video-\${section.id}-\${scene.id}\` ? (`;

code = code.replace(videoPromptOld, videoPromptNew);

// Since we added an opening div for the flex gap-2, we need to add a closing div for both
// For Image Prompt:
code = code.replace(
  `                                ) : (
                                  <span>КОПИРОВАТЬ ПРОМПТ</span>
                                )}
                              </button>
                            </div>
                            <div className="p-3 border border-[#2D2E32] rounded bg-[#0A0B0E]">`,
  `                                ) : (
                                  <span>КОПИРОВАТЬ ПРОМПТ</span>
                                )}
                              </button>
                              </div>
                            </div>
                            <div className="p-3 border border-[#2D2E32] rounded bg-[#0A0B0E]">`
);

// For Video Prompt:
code = code.replace(
  `                                ) : (
                                    <span>КОПИРОВАТЬ</span>
                                  )}
                                </button>
                              )}
                            </div>

                            {scene.videoPrompt ? (`,
  `                                ) : (
                                    <span>КОПИРОВАТЬ</span>
                                  )}
                                </button>
                                )}
                              </div>
                            </div>

                            {scene.videoPrompt ? (`
);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed UI buttons!');
