const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

code = code.replace(
  "import { Clock, Image as ImageIcon, Video, Scissors, FileText, CheckCircle2, PlayCircle, Loader2, Copy, Languages, Download, Archive } from 'lucide-react';",
  "import { Clock, Image as ImageIcon, Video, Scissors, FileText, CheckCircle2, PlayCircle, Loader2, Copy, Languages, Download, Archive, ChevronDown, ChevronUp } from 'lucide-react';"
);

code = code.replace(
  "const [isTranslating, setIsTranslating] = useState(false);",
  "const [isTranslating, setIsTranslating] = useState(false);\n  const [isFeedCollapsed, setIsFeedCollapsed] = useState(false);"
);

fs.writeFileSync('components/ScriptResult.tsx', code);
