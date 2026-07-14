const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const imagePromptHeaderOld = `<div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest underline">AI Промпт</h4>
                              <button
                                onClick={() => copyToClipboard(scene.imagePrompt, \`\${section.id}-\${scene.id}\`)}
                                className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-purple-400 hover:text-white transition-colors bg-purple-900/30 px-2 py-1 rounded border border-purple-800"
                              >
                                {copiedIndex === \`\${section.id}-\${scene.id}\` ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>СКОПИРОВАНО</span>
                                  </>
                                ) : (
                                  <span>КОПИРОВАТЬ ПРОМПТ</span>
                                )}
                              </button>
                            </div>`;

const imagePromptHeaderNew = `<div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest underline">AI Промпт</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVisualPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVisualPrompt[\`\${section.id}-\${scene.id}\`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVisualPrompt[\`\${section.id}-\${scene.id}\`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVisualPrompt[\`\${section.id}-\${scene.id}\`] ? 'Генерация...' : 'Сгенерировать'}</span>
                                </button>
                                <button
                                  onClick={() => copyToClipboard(scene.imagePrompt, \`\${section.id}-\${scene.id}\`)}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-purple-400 hover:text-white transition-colors bg-purple-900/30 px-2 py-1 rounded border border-purple-800"
                                >
                                  {copiedIndex === \`\${section.id}-\${scene.id}\` ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Скопировано</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Копировать</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>`;

code = code.replace(imagePromptHeaderOld, imagePromptHeaderNew);

const videoPromptHeaderOld = `<div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">АНИМАЦИЯ КАДРА</h4>
                              {scene.videoPrompt && (
                                <button
                                  onClick={() => copyToClipboard(scene.videoPrompt || '', \`video-\${section.id}-\${scene.id}\`)}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-indigo-400 hover:text-white transition-colors bg-indigo-950/50 px-2 py-1 rounded border border-indigo-900"
                                >
                                  {copiedIndex === \`video-\${section.id}-\${scene.id}\` ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      <span>СКОПИРОВАНО</span>
                                    </>
                                  ) : (
                                    <span>КОПИРОВАТЬ ПРОМПТ</span>
                                  )}
                                </button>
                              )}
                            </div>`;

const videoPromptHeaderNew = `<div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">АНИМАЦИЯ КАДРА</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => generateVideoPrompt(section.id, scene.id, scene)}
                                  disabled={loadingVideoPrompt[\`\${section.id}-\${scene.id}\`]}
                                  className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-amber-400 hover:text-white transition-colors bg-amber-900/30 px-2 py-1 rounded border border-amber-800 disabled:opacity-50"
                                >
                                  {loadingVideoPrompt[\`\${section.id}-\${scene.id}\`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                  <span>{loadingVideoPrompt[\`\${section.id}-\${scene.id}\`] ? 'Генерация...' : 'Сгенерировать'}</span>
                                </button>
                                {scene.videoPrompt && (
                                  <button
                                    onClick={() => copyToClipboard(scene.videoPrompt || '', \`video-\${section.id}-\${scene.id}\`)}
                                    className="text-[9px] font-bold tracking-wider uppercase flex items-center space-x-1 text-indigo-400 hover:text-white transition-colors bg-indigo-950/50 px-2 py-1 rounded border border-indigo-900"
                                  >
                                    {copiedIndex === \`video-\${section.id}-\${scene.id}\` ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span>Скопировано</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Копировать</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>`;

code = code.replace(videoPromptHeaderOld, videoPromptHeaderNew);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed UI block');
