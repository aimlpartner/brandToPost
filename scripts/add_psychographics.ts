import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

const psychographicSection = `
      {/* Psychographic Deep Dive */}
      <section className="py-24 md:py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/5 bg-[#0A0A0F]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center justify-center mb-6">
              <span className="bg-[#FF7778]/10 text-[#FF7778] border border-[#FF7778]/20 text-[10px] uppercase font-medium tracking-widest px-4 py-1.5 rounded-full shadow-sm">The Psychographic Engine</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light font-display text-white mb-6 leading-tight">
              Why generic AI copy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7778] to-[#7C3AED]">destroys your brand.</span>
            </h2>
            <div className="space-y-6 text-gray-400 font-light leading-relaxed">
              <p>
                The problem with "AI Writers" isn't the LLM. It's the prompt. Asking a chatbot to "write a LinkedIn post about SaaS" results in generic platitudes that actively harm your credibility.
              </p>
              <p>
                To write high-converting copy, you need root-level psychographics: <strong>The exact pain your customer is in, the "Hell State" they want to escape, and the Unique Mechanism your product uses to save them.</strong>
              </p>
              <p>
                Tror’s Strategist Agent doesn't just read your website; it extracts a 12-point psychographic profile, locking in your exact "Heaven State," "Hell State," and Top Objections before a single word is drafted. This is why Tror's output reads like a Senior Copywriter, not a robot.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-[#FF7778]/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="glass-card p-8 border-[#FF7778]/20 relative z-10">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#FF7778]" />
                  <span className="text-sm font-medium text-white">Brand DNA Matrix</span>
                </div>
                <span className="text-xs text-[#18F07A]">LOCKED</span>
              </div>
              
              <div className="space-y-5">
                <div className="bg-[#1C1C22]/80 p-4 rounded-lg border border-white/5">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Hell State identified</div>
                   <div className="text-sm text-gray-200 font-light">"Endless manual spreadsheet reconciliation leading to 4am fire drills."</div>
                </div>
                <div className="bg-[#1C1C22]/80 p-4 rounded-lg border border-white/5">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Unique Mechanism identified</div>
                   <div className="text-sm text-gray-200 font-light">"Asynchronous multi-ledger sync using proprietary WebAssembly core."</div>
                </div>
                <div className="bg-[#1C1C22]/80 p-4 rounded-lg border border-white/5 border-l-2 border-l-[#FF7778]">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Objection Dismantling Strategy</div>
                   <div className="text-sm text-gray-200 font-light">"Injecting SOC2 compliance proof in hook 3 to counter security fears."</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
`;

content = content.replace('{/* POST Methodology */}', psychographicSection + '\n\n      {/* POST Methodology */}');

fs.writeFileSync('src/pages/LandingPage.tsx', content);
