import fs from 'fs';

let content = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

// Figure out which logo to show globally
const darkTemplates = ['creative-story', 'powerful-quote'];
const lightTemplates = ['data-infographic'];
// Abstract announcement depends on the primary color intensity over black, typically we use white text there so dark templates apply

const templateReplace = `
  const isDarkTemplate = ['creative-story', 'powerful-quote', 'abstract-announcement'].includes(visualType || '');
  const activeLogo = (isDarkTemplate ? dna?.logoLightUrl : dna?.logoDarkUrl) || dna?.logoUrl;
`;

// Insert the activeLogo logic right after handleDownload declaration
content = content.replace(
  /const handleDownload = async \(e: React\.MouseEvent\) => \{[\s\S]*?setIsDownloading\(false\);\n    \}\n  \};\n/,
  match => match + "\n" + templateReplace + "\n"
);


// Replace dna?.logoUrl references with activeLogo where rendering
content = content.replace(
  /\{dna\?\.logoUrl && \(\s*<img src=\{dna\.logoUrl\} alt="Logo" className="h-12 w-auto mx-auto mb-6 @md:mb-8 drop-shadow-md" crossOrigin="anonymous" \/>\s*\)\}/,
  `{activeLogo && (
                <img src={activeLogo} alt="Logo" className="h-12 w-auto mx-auto mb-6 @md:mb-8 drop-shadow-md" crossOrigin="anonymous" />
              )}`
);

content = content.replace(
  /\{dna\?\.logoUrl && \(\s*<div className="mt-8 flex justify-center">\s*<img src=\{dna\.logoUrl\}/,
  `{activeLogo && (
              <div className="mt-8 flex justify-center">
                <img src={activeLogo}`
);

// Global logo section and remove the filter invert logic
content = content.replace(
  /\{\!\['data-infographic', 'abstract-announcement'\]\.includes\(visualType\) && dna\?\.logoUrl && \(\s*<div className="absolute bottom-6 @md:bottom-8 right-6 @md:right-8 z-20">\s*<img src=\{dna\.logoUrl\} alt="Logo" className="h-6 @md:h-8 w-auto drop-shadow-md" style=\{\{ filter: \['creative-story', 'powerful-quote'\]\.includes\(visualType\) \? 'brightness\(0\) invert\(1\)' : 'none' \}\} crossOrigin="anonymous" \/>\s*<\/div>\s*\)\}/,
  `{!['data-infographic', 'abstract-announcement'].includes(visualType || '') && activeLogo && (
           <div className="absolute bottom-6 @md:bottom-8 right-6 @md:right-8 z-20">
             <img src={activeLogo} alt="Logo" className="h-6 @md:h-8 w-auto drop-shadow-md" crossOrigin="anonymous" />
           </div>
        )}`
);

fs.writeFileSync('src/components/VisualEngine.tsx', content);
