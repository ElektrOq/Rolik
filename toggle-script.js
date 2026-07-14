const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

const oldNav = `onClick={() => {
                    const el = document.getElementById(\`section-\${section.id}\`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}`;

const newNav = `onClick={() => {
                    setIsFeedCollapsed(false);
                    setTimeout(() => {
                      const el = document.getElementById(\`section-\${section.id}\`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}`;

code = code.replace(oldNav, newNav);

const oldFeedStart = `<div className="space-y-6">
          {script.sections.map((section, index) => {`;

const newFeedStart = `{script.sections.length > 0 && (
          <div className="flex items-center justify-between border-b border-[#2D2E32] pb-2 mt-8 mb-4">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">Основная лента</h3>
            <button
              onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              {isFeedCollapsed ? (
                <>
                  <span className="hidden sm:inline">Развернуть</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Свернуть</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <div className={\`space-y-6 \${isFeedCollapsed ? 'hidden' : 'block'}\`}>
          {script.sections.map((section, index) => {`;

if (code.includes(oldFeedStart)) {
  code = code.replace(oldFeedStart, newFeedStart);
  console.log("Successfully replaced feed start");
} else {
  console.log("Feed start not found!");
}

fs.writeFileSync('components/ScriptResult.tsx', code);
