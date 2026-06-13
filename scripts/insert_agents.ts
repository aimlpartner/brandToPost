import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// Add imports
content = content.replace(
  'X, XCircle, Bot, ZapOff, Fingerprint, Database, CalendarDays, Radar, Activity, Cpu, Network',
  'X, XCircle, Bot, ZapOff, Fingerprint, Database, CalendarDays, Radar, Activity, Cpu, Network, BrainCircuit, Palette, Send'
);

const agentsSection = `
      {/* Visual Agents Architecture */}
      <section className="py-24 md:py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">Autonomous Architecture</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-normal font-display text-white mb-6">4 Specialized Agents.<br/>1 CMO Orchestrating Them.</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            You aren't just buying software. You are hiring a complete marketing department that executes your strategy simultaneously.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto mt-20">
          {/* Tror Node */}
          <div className="flex flex-col items-center relative z-20 mb-8 sm:mb-16">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-gradient-to-br from-[#7C3AED] to-[#2583EB] p-[2px] shadow-[0_0_40px_rgba(124,58,237,0.4)] relative">
               <div className="w-full h-full bg-[#1C1C22] rounded-[30px] flex flex-col items-center justify-center p-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#7C3AED]/20 animate-pulse"></div>
                  <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full relative z-10 border border-white/20"/>
               </div>
            </div>
            <div className="mt-6 text-center bg-[#1C1C22]/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-0.5">Tror</h3>
              <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">The Orchestrator</p>
            </div>
          </div>

          {/* Connecting lines for Desktop */}
          <div className="hidden lg:block absolute top-[110px] left-1/2 -translate-x-1/2 w-[75%] h-[80px] border-t-2 border-l-2 border-r-2 border-dashed border-[#7C3AED]/40 rounded-t-3xl z-10">
             {/* Center pulsing line from Tror */}
             <div className="absolute top-0 left-1/2 w-0.5 h-16 bg-gradient-to-b from-[#7C3AED] to-transparent -translate-x-1/2 -mt-4 animate-pulse"></div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-20">
            
            {/* Agent 1 */}
            <div className="glass-card p-8 flex flex-col items-center text-center relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="hidden lg:block absolute -top-20 left-1/2 w-0.5 h-20 bg-gradient-to-b from-transparent to-[#FF7778]/50 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-2xl bg-[#1C1C22] border border-[#FF7778]/30 flex items-center justify-center mb-6 relative shadow-[0_0_20px_rgba(255,119,120,0.1)] group-hover:shadow-[0_0_30px_rgba(255,119,120,0.3)] transition-all">
                 <BrainCircuit className="w-8 h-8 text-[#FF7778]" />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF7778] rounded-full animate-pulse shadow-[0_0_10px_#FF7778]"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">The Strategist</h3>
              <p className="text-sm text-gray-400">Scrapes DNA, defines positioning, locks in the core value proposition.</p>
            </div>

            {/* Agent 2 */}
            <div className="glass-card p-8 flex flex-col items-center text-center relative group hover:-translate-y-2 transition-transform duration-300 transform lg:translate-y-8">
              <div className="hidden lg:block absolute -top-24 left-1/2 w-0.5 h-24 bg-gradient-to-b from-transparent to-[#2583EB]/50 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Extra connecting line for staggered layout */}
              <div className="hidden lg:block absolute -top-8 left-1/2 w-0.5 h-8 border-l-2 border-dashed border-[#7C3AED]/40 -translate-x-1/2 z-10" />
              
              <div className="w-16 h-16 rounded-2xl bg-[#1C1C22] border border-[#2583EB]/30 flex items-center justify-center mb-6 relative shadow-[0_0_20px_rgba(37,131,235,0.1)] group-hover:shadow-[0_0_30px_rgba(37,131,235,0.3)] transition-all">
                 <PenTool className="w-8 h-8 text-[#2583EB]" />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#2583EB] rounded-full animate-pulse shadow-[0_0_10px_#2583EB]"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">The Copywriter</h3>
              <p className="text-sm text-gray-400">Drafts emotionally resonant, native formats for LinkedIn and X.</p>
            </div>

            {/* Agent 3 */}
            <div className="glass-card p-8 flex flex-col items-center text-center relative group hover:-translate-y-2 transition-transform duration-300 transform lg:translate-y-8">
              <div className="hidden lg:block absolute -top-24 left-1/2 w-0.5 h-24 bg-gradient-to-b from-transparent to-[#18F07A]/50 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              {/* Extra connecting line for staggered layout */}
              <div className="hidden lg:block absolute -top-8 left-1/2 w-0.5 h-8 border-l-2 border-dashed border-[#7C3AED]/40 -translate-x-1/2 z-10" />
              
              <div className="w-16 h-16 rounded-2xl bg-[#1C1C22] border border-[#18F07A]/30 flex items-center justify-center mb-6 relative shadow-[0_0_20px_rgba(24,240,122,0.1)] group-hover:shadow-[0_0_30px_rgba(24,240,122,0.3)] transition-all">
                 <Palette className="w-8 h-8 text-[#18F07A]" />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#18F07A] rounded-full animate-pulse shadow-[0_0_10px_#18F07A]"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">The Designer</h3>
              <p className="text-sm text-gray-400">Generates branded assets and hooks matched to the drafted copy.</p>
            </div>

            {/* Agent 4 */}
            <div className="glass-card p-8 flex flex-col items-center text-center relative group hover:-translate-y-2 transition-transform duration-300">
              <div className="hidden lg:block absolute -top-20 left-1/2 w-0.5 h-20 bg-gradient-to-b from-transparent to-[#7C3AED]/50 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-2xl bg-[#1C1C22] border border-[#7C3AED]/30 flex items-center justify-center mb-6 relative shadow-[0_0_20px_rgba(124,58,237,0.1)] group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all">
                 <Send className="w-8 h-8 text-[#7C3AED]" />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#7C3AED] rounded-full animate-pulse shadow-[0_0_10px_#7C3AED]"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">The Distributor</h3>
              <p className="text-sm text-gray-400">Assembles outputs into a final approval queue, ready to publish.</p>
            </div>

          </div>
        </div>
      </section>
`;

content = content.replace(
  '{/* CTA Section */}',
  agentsSection + '\n\n      {/* CTA Section */}'
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
