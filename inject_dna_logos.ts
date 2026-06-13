import fs from 'fs';

let content = fs.readFileSync('src/pages/ProductDNA.tsx', 'utf8');

const uploadHandlers = `
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'logoDarkUrl' | 'logoLightUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError("Only JPEG and PNG images are allowed.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Preserve transparency by saving as PNG
          const base64String = canvas.toDataURL('image/png');
          setDna(prev => ({ ...prev, [type]: base64String }));
          setSaved(false);
          setError(null);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
`;

// replace original handleLogoUpload
content = content.replace(
  /const handleLogoUpload =.*?reader\.readAsDataURL\(file\);\s*\};/s, 
  uploadHandlers
);

// replace logo UI block
const newLogoUI = `
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold leading-6 text-white">
                    Primary Logo
                  </label>
                  <p className="text-xs text-gray-400 mt-1">Default logo used everywhere</p>
                  <div className="mt-2 flex items-center gap-4">
                    {dna.logoUrl && (
                      <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-lg border border-[#7C3AED]/30 overflow-hidden bg-[#1C1C22]/80 flex items-center justify-center shrink-0">
                        <img src={dna.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={(e) => handleLogoUpload(e, 'logoUrl')}
                      className="block w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 sm:file:mr-4 sm:file:py-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#7C3AED]/20 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold leading-6 text-white">
                      Light Logo
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Used on dark backgrounds</p>
                    <div className="mt-2 flex flex-col gap-2">
                       {dna.logoLightUrl && (
                         <div className="h-14 w-full rounded-lg border border-[#7C3AED]/30 overflow-hidden bg-black flex items-center justify-center">
                           <img src={dna.logoLightUrl} alt="Light Logo" className="max-h-10 max-w-full object-contain" />
                         </div>
                       )}
                       <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => handleLogoUpload(e, 'logoLightUrl')}
                          className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-white"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold leading-6 text-white">
                      Dark Logo
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Used on light backgrounds</p>
                    <div className="mt-2 flex flex-col gap-2">
                       {dna.logoDarkUrl && (
                         <div className="h-14 w-full rounded-lg border border-[#7C3AED]/30 overflow-hidden bg-white flex items-center justify-center">
                           <img src={dna.logoDarkUrl} alt="Dark Logo" className="max-h-10 max-w-full object-contain" />
                         </div>
                       )}
                       <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => handleLogoUpload(e, 'logoDarkUrl')}
                          className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-white"
                        />
                    </div>
                  </div>
                </div>
              </div>
`;

content = content.replace(
  /<div>\s*<label className="block text-sm font-semibold leading-6 text-white">\s*Company Logo\s*<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<div>\s*<label htmlFor="name"/,
  newLogoUI + '\n              <div>\n                <label htmlFor="name"'
);

fs.writeFileSync('src/pages/ProductDNA.tsx', content);
