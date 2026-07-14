const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldButton = `<button
              onClick={polishAllSections}
              disabled={isPolishing || Object.keys(scenes).length === 0}
              className="w-full flex justify-center items-center gap-2 rounded bg-amber-600 px-4 py-3 text-xs font-bold tracking-wider uppercase text-white transition-colors hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600"
              title="Убрать повторы и улучшить плотность текста во всех сгенерированных главах"
            >
              {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              {isPolishing ? 'РЕДАКТУРА...' : 'УБРАТЬ ПОВТОРЫ'}
            </button>`;

const newButton = `<button
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
            </button>`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Renamed button');
