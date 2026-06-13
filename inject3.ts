import fs from 'fs';

let content = fs.readFileSync('src/pages/ProductDNA.tsx', 'utf8');

const psychographicsHtml = `
            {/* ADVANCED DNA (Psychographics & Strategy) */}
            <div className="bg-[#1C1C22] rounded-xl shadow-md border border-[#7C3AED]/20 overflow-hidden mb-8 mt-8">
              <div className="border-b border-[#7C3AED]/20 bg-[#1C1C22] px-6 py-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#7C3AED]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Deep Psychographics & Strategy</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-6 border-l-2 border-[#7C3AED] pl-3">
                  This root-level intelligence powers Tror's ability to write highly specific, empathy-driven hooks rather than generic AI copy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* The Why */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                      <Globe className="h-3.5 w-3.5" /> The Narrative (The "Why")
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">The Enemy / Status Quo</label>
                      <p className="text-[10px] text-gray-500 mb-2">What old way of doing things is this product trying to kill?</p>
                      <textarea
                        name="enemy"
                        value={dna.enemy || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-20"
                        placeholder="e.g., Endless manual spreadsheet reconciliation..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">The "Earned Secret"</label>
                      <p className="text-[10px] text-gray-500 mb-2">What does this company know about the industry that nobody else realizes?</p>
                      <textarea
                        name="earnedSecret"
                        value={dna.earnedSecret || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Origin Story</label>
                      <p className="text-[10px] text-gray-500 mb-2">Why was this built? What was the founding frustration?</p>
                      <textarea
                        name="originStory"
                        value={dna.originStory || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-24"
                      />
                    </div>
                  </div>

                  {/* The Who */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                      <Target className="h-3.5 w-3.5" /> JTBD & Psychographics (The "Who")
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" /> "Hell" State
                        </label>
                        <textarea
                          name="hellState"
                          value={dna.hellState || ""}
                          onChange={handleChange}
                          placeholder="Before: The exact pain..."
                          className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 outline-none h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-[#18F07A]" /> "Heaven" State
                        </label>
                        <textarea
                          name="heavenState"
                          value={dna.heavenState || ""}
                          onChange={handleChange}
                          placeholder="After: The emotional payoff..."
                          className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#18F07A]/50 focus:border-[#18F07A]/50 outline-none h-20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Top 3 Buying Objections</label>
                      <p className="text-[10px] text-gray-500 mb-2">Why do people say no? (we will dismantle these in copy)</p>
                      <textarea
                        name="objections"
                        value={dna.objections || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-20"
                      />
                    </div>
                  </div>

                  {/* The How & The Voice */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                      <Zap className="h-3.5 w-3.5" /> Product & Proof (The "How")
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Unique Mechanism</label>
                      <p className="text-[10px] text-gray-500 mb-2">How exactly does it deliver results differently?</p>
                      <textarea
                        name="uniqueMechanism"
                        value={dna.uniqueMechanism || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Proof Points / Hard Numbers</label>
                      <textarea
                        name="proofPoints"
                        value={dna.proofPoints || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 outline-none h-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                      <MessageSquare className="h-3.5 w-3.5" /> Brand Dictionary (The "Voice")
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-[#18F07A] mb-1">Words we ALWAYS use</label>
                      <textarea
                        name="vocabularyAlways"
                        value={dna.vocabularyAlways || ""}
                        onChange={handleChange}
                        placeholder="e.g., Revenue-driven, Asynchronous, Craft..."
                        className="w-full bg-[#1C1C22]/50 border border-[#18F07A]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#18F07A]/50 outline-none h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-red-500 mb-1">Words we NEVER use</label>
                      <textarea
                        name="vocabularyNever"
                        value={dna.vocabularyNever || ""}
                        onChange={handleChange}
                        placeholder="e.g., Synergy, Hack, Ninja, Revolutionary..."
                        className="w-full bg-[#1C1C22]/50 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-red-500/50 outline-none h-20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
`;

// Remove the one inside the button
content = content.replace(
  /<button\n\s*type="button"\n\s*onClick=\{\(\) => setIsDeleteModalOpen\(true\)\}\n\s*className="[^"]*"\n\s*>[\s\S]*?\{[^}]*ADVANCED DNA[^}]*\}([\s\S]*?)<\/button>/g,
  '<button\n        type="button"\n        onClick={() => setIsDeleteModalOpen(true)}\n        className="flex items-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"\n      >\n        <Trash2 className="mr-2 h-4 w-4" />\n        Delete Product\n      </button>'
);

// Inject correctly above it
content = content.replace(
  /<div className="glass-panel p-4 flex items-center justify-between">\n\s*<button\n\s*type="button"\n\s*onClick=\{\(\) => setIsDeleteModalOpen\(true\)\}/g,
  psychographicsHtml + '\n\n  <div className="glass-panel p-4 flex items-center justify-between">\n    <button\n      type="button"\n      onClick={() => setIsDeleteModalOpen(true)}'
);

fs.writeFileSync('src/pages/ProductDNA.tsx', content);
console.log("Fixed button injection regex!");
