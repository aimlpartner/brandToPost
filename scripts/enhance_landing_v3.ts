import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// Font weight cleanup
content = content.replace(/font-bold/g, 'font-medium');
content = content.replace(/font-black/g, 'font-normal');
content = content.replace(/font-extrabold/g, 'font-medium');
content = content.replace(/<strong>/g, '<span className="font-medium text-white">');
content = content.replace(/<\/strong>/g, '<\/span>');

const deepDiveSection = `
      {/* Deep Dive: The Output */}
      <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#18F07A]/10 text-[#18F07A] border border-[#18F07A]/20 text-[10px] uppercase font-medium tracking-widest px-4 py-1.5 rounded-full shadow-sm">The Deliverable</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light font-display text-white mb-6">
            1 URL in. 1 Month of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#18F07A] to-[#2583EB]">Pipeline</span> out.
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            We don't sell you "prompts" or "ai writing assistants." Tror’s agents architect, draft, and assemble a complete, multi-platform publishing engine tailored exactly to your user’s pain points.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Bento 1: LinkedIn Mastery */}
          <div className="glass-card p-8 md:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2583EB]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#2583EB]/20 transition-all"></div>
            <h3 className="text-2xl text-white font-light mb-2">12x LinkedIn Thought Leadership Posts</h3>
            <p className="text-gray-400 font-light mb-8 text-sm leading-relaxed max-w-md">Crafted by the Copywriter agent using the hook-story-lesson framework. Formatted with proper spacing, strategic zero-click methodology, and your exact brand tone.</p>
            
            <div className="bg-[#1C1C22]/80 border border-white/5 rounded-xl p-6 relative z-10 shadow-lg">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2583EB]"></div>
                <div>
                  <div className="w-32 h-2 bg-white/20 rounded mb-2"></div>
                  <div className="w-20 h-2 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-white/20 rounded"></div>
                <div className="w-[90%] h-2 bg-white/20 rounded"></div>
                <div className="w-[80%] h-2 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>

          {/* Bento 2: Native X Threads */}
          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#7C3AED]/20 transition-all"></div>
            <h3 className="text-2xl text-white font-light mb-2">20x Native X Threads</h3>
            <p className="text-gray-400 font-light mb-8 text-sm leading-relaxed">Punchy, visually segmented threads optimized for the X algorithm.</p>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 items-start border-l-2 border-white/10 pl-4 py-1">
                   <div className="w-6 h-6 rounded-full bg-white/10 shrink-0"></div>
                   <div className="w-full h-8 bg-white/5 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Bento 3: DNA Verification */}
          <div className="glass-card p-8 relative overflow-hidden group">
             <h3 className="text-2xl text-white font-light mb-2">Brand DNA Report</h3>
             <p className="text-gray-400 font-light mb-6 text-sm leading-relaxed">The Strategist locks down your ICP and unique mechanism.</p>
             <div className="flex flex-wrap gap-2">
               <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/70">Value Prop</span>
               <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/70">Tone Tracker</span>
               <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-white/70">Competitor Map</span>
             </div>
          </div>

          {/* Bento 4: Visual Hooks */}
          <div className="glass-card p-8 md:col-span-2 relative overflow-hidden group flex flex-col md:flex-row items-center gap-8">
             <div className="flex-1">
               <h3 className="text-2xl text-white font-light mb-2">High-Fidelity Visual Hooks</h3>
               <p className="text-gray-400 font-light text-sm leading-relaxed">The Designer agent creates branded UI mockups and infographics to stop the scroll. Always aligned with your actual interface and brand parameters.</p>
             </div>
             <div className="w-full md:w-48 h-32 md:h-48 rounded-xl bg-gradient-to-tr from-[#FF7778]/10 to-[#7C3AED]/10 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0A0A0F] opacity-50"></div>
                <div className="w-20 h-20 rounded shadow-lg bg-white/10 backdrop-blur-md border border-white/20 relative z-10 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18F07A] to-[#2583EB]"></div>
                </div>
             </div>
          </div>
        </div>
      </section>
`;

content = content.replace('{/* Feature 2: Tror Generation - REDESIGNED */}', deepDiveSection + '\n\n      {/* Feature 2: Tror Generation - REDESIGNED */}');

fs.writeFileSync('src/pages/LandingPage.tsx', content);
