import * as fs from 'fs';

function applyPortal(filepath: string, exactReplace1: RegExp, exactReplace2: string, exactReplaceEnd1: RegExp, exactReplaceEnd2: string) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    if (!content.includes('import { createPortal }')) {
        content = "import { createPortal } from 'react-dom';\n" + content;
    }

    content = content.replace(exactReplace1, exactReplace2);
    content = content.replace(exactReplaceEnd1, exactReplaceEnd2);

    fs.writeFileSync(filepath, content);
    console.log("Patched " + filepath);
}

// Settings.tsx
applyPortal(
    'src/pages/Settings.tsx',
    /\{showOrgModal && \(\s*<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/50 backdrop-blur-sm">/,
    '{showOrgModal && createPortal(\n<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">',
    /<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}/,
    '</button>\n  </div>\n  </div>\n  </div>,\n  document.body\n)}\n  </div>\n  );\n}'
);

// SharedCampaign.tsx
applyPortal(
    'src/pages/SharedCampaign.tsx',
    /\{isSettingName && \(\s*<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/50 backdrop-blur-sm p-4">/,
    '{isSettingName && createPortal(\n  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">',
    /Continue\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/,
    'Continue\n  </button>\n </div>\n </div>,\n document.body\n )}'
);
