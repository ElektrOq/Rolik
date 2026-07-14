const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');
code = code.replace(/playNotification\(([^,]+),\s*'error'\)/g, 'playNotification($1)');
fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed playNotification');
