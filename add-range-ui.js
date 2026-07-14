const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldEnd = `            </button>
          </div>
        </div>

        {script.sections.length > 0 && (`;

const newEnd = `            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <input
              type="text"
              value={promptRange}
              onChange={(e) => setPromptRange(e.target.value)}
              placeholder="Главы: 1-8, 10"
              className="w-full sm:w-1/3 bg-[#0A0B0E] border border-[#2D2E32] rounded px-4 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={generateStructureForRange}
              disabled={isGeneratingRange || !promptRange.trim() || Object.keys(scenes).length === 0}
              className="w-full sm:w-2/3 flex justify-center items-center gap-2 rounded bg-indigo-900/40 border border-indigo-500/50 px-4 py-3 text-xs font-bold tracking-wider uppercase text-indigo-300 transition-colors hover:bg-indigo-900/60 disabled:opacity-50"
            >
              {isGeneratingRange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              {isGeneratingRange ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ СТРУКТУРУ ДЛЯ ВЫБРАННЫХ ГЛАВ'}
            </button>
          </div>
        </div>

        {script.sections.length > 0 && (`;

code = code.replace(oldEnd, newEnd);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Added UI block');
