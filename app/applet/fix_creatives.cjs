const fs = require('fs');

const file = 'src/pages/Creatives.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change bg colors
content = content.replace(/bg-\[#f8f9fa\]/g, 'bg-[#0A0A0F]');

content = content.replace(
  'import { Loader2, Plus, Image as ImageIcon, Trash2, AlertCircle, Folder, DownloadCloud, CheckCircle2 } from "lucide-react";',
  'import { Loader2, Plus, Image as ImageIcon, Trash2, AlertCircle, Folder, DownloadCloud, CheckCircle2, Eye, X } from "lucide-react";'
);

// 2. Add previewCreative state
if (!content.includes('const [previewCreative, setPreviewCreative]')) {
  content = content.replace(
    'const [isDeleting, setIsDeleting] = useState(false);',
    'const [isDeleting, setIsDeleting] = useState(false);\n  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);'
  );
}

// 3. Update grid UI
content = content.replace(
  /<div className="absolute inset-0 bg-black\/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">\s*<button\s*onClick={\(\) => setCreativeToDelete\(creative\)}\s*className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"\s*title="Delete Creative"\s*>\s*<Trash2 className="h-4 w-4" \/>\s*<\/button>\s*<\/div>/g,
  `<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={() => setPreviewCreative(creative)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      title="Preview Creative"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCreativeToDelete(creative)}
                      className="p-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Delete Creative"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>`
);


// 4. Add the overlay modal at the very end
content = content.replace(
  /\{\/\* Delete Confirmation Modal \*\/\}(.|\n)*$/m,
  `{/* Delete Confirmation Modal */}
      {creativeToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1C1C22] rounded-xl shadow-xl max-w-md w-full p-6 border border-[#7C3AED]/20">
            <h3 className="text-lg font-bold text-white mb-2">Delete Creative</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{creativeToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCreativeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-300 font-medium hover:bg-[#0A0A0F] rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <VideoLoader className="mr-2 h-7 w-7" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
}
`
);

fs.writeFileSync(file, content);
console.log('Fixed Creatives');
