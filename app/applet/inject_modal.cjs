const fs = require('fs');
let content = fs.readFileSync('src/pages/Creatives.tsx', 'utf8');

const overlay = `
      {/* Full-screen Image Preview Overlay */}
      {previewCreative && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setPreviewCreative(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
            onClick={() => setPreviewCreative(null)}
          >
            <X className="h-8 w-8" />
          </button>
          
          <img 
            src={previewCreative.url} 
            alt={previewCreative.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-white font-medium">
            {previewCreative.name}
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(/\s*\}\)\}\s*<\/div>\s*\);\s*\}\s*$/, '\n  )}' + overlay);
fs.writeFileSync('src/pages/Creatives.tsx', content);
