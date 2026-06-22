import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, Bot, Target, FileText, Globe, ArrowRight, Terminal, Activity, Database, Zap, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { BrainCircuit, AlertTriangle, Palette } from 'lucide-react';

type InputType = 'website' | 'document' | 'description';

interface BrandExtractionModalProps {
  isOpen: boolean;
  inputType: InputType;
  isComplete: boolean;
  screenshotUrl?: string | null;
  extractionLogs: string[];
  extractionProgress: number;
  onClose: () => void;
  onSaveAndContinue: () => void;
}

const terminalLogs = {
  website: [
    "Initializing Tror Core [v2.4.1]...",
    "Booting Strategist Agent...",
    "Establishing secure connection to target URL...",
    "Parsing DOM tree and semantic HTML...",
    "Extracting <H1> through <H3> hierarchy...",
    "> Found potential core value proposition.",
    "Mapping CSS variables & theme tokens...",
    "> Extracted primary aesthetic (dark mode/neon).",
    "Running psychographic NLP passing...",
    "Identifying Pain Points vs Expected Transformation...",
    "> \"Hell State\" quantified.",
    "Synthesizing brand tone from body copy...",
    "Structuring DNA JSON payload...",
    "Finalizing Tror Memory Graph..."
  ],
  document: [
    "Initializing Tror Core [v2.4.1]...",
    "Booting Analyst Agent...",
    "Ingesting raw document bytes...",
    "Executing contextual entity extraction...",
    "Mapping feature lists to deep user pain...",
    "> Correlating features to JTBD (Jobs To Be Done).",
    "Structuring narrative architecture...",
    "Extracting target audience demographics...",
    "> Audience persona locked.",
    "Drafting 'Heaven State' emotional outcomes...",
    "Mapping unique mechanisms...",
    "Structuring DNA JSON payload...",
    "Finalizing Tror Memory Graph..."
  ],
  description: [
    "Initializing Tror Core [v2.4.1]...",
    "Booting NLP Pipeline...",
    "Ingesting user description...",
    "Performing semantic expansion...",
    "Inferring industry context...",
    "> Industry vertical extrapolated.",
    "Hypothesizing primary customer objections...",
    "Formulating Core Value Proposition...",
    "Drafting origin story parameters...",
    "> Synthesizing emotional triggers.",
    "Establishing baseline brand voice...",
    "Structuring DNA JSON payload...",
    "Finalizing Tror Memory Graph..."
  ]
};

const stepsData = {
  website: [
    { label: 'Scraping Context', icon: Globe },
    { label: 'Deconstructing UI/UX', icon: Palette },
    { label: 'Mapping Psychographics', icon: Target },
    { label: 'Locking DNA Matrix', icon: Database }
  ],
  document: [
    { label: 'Ingesting Deep Lore', icon: FileText },
    { label: 'Mapping Capabilities', icon: Zap },
    { label: 'Extracting Personas', icon: Target },
    { label: 'Locking DNA Matrix', icon: Database }
  ],
  description: [
    { label: 'Semantic Inference', icon: BrainCircuit },
    { label: 'Hypothesizing Pain', icon: AlertTriangle },
    { label: 'Structuring Narrative', icon: FileText },
    { label: 'Locking DNA Matrix', icon: Database }
  ]
};

export function BrandExtractionModal({ isOpen, inputType, isComplete, screenshotUrl, extractionLogs, extractionProgress, onClose, onSaveAndContinue }: BrandExtractionModalProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  const currentSteps = stepsData[inputType] || stepsData.website;
  
  // Map progress to steps
  const currentStepIndex = Math.min(Math.floor((extractionProgress / 100) * currentSteps.length), currentSteps.length - 1);
  const progressPercent = extractionProgress;
  const displayedLogs = extractionLogs;

  // Auto-scroll terminal
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [extractionLogs]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200/80 rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Panel: Status & Steps */}
        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 w-full md:w-[45%] relative flex flex-col bg-slate-50/50">
          
          <div className="relative z-10 flex flex-col h-full">
             <div className="flex items-center gap-4 mb-8">
               <div className="relative">
                 <div className="absolute -inset-2 bg-[#7C3AED]/10 animate-ping rounded-full" style={{ animationDuration: '3s' }} />
                 <div className="w-12 h-12 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-md relative z-10">
                   <Activity className="w-6 h-6 text-white animate-pulse" />
                 </div>
               </div>
               <div>
                  <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">System Active</h2>
                  <p className="text-xs text-[#7C3AED] font-semibold font-mono uppercase tracking-wider">Running DNA Extraction</p>
               </div>
             </div>

             <div className="space-y-6 flex-1">
                 {currentSteps.map((step, idx) => {
                   const isActive = !isComplete && idx === currentStepIndex;
                   const isDone = isComplete || idx < currentStepIndex;
                   const StepIcon = step.icon;
                   
                   return (
                     <div key={idx} className="flex gap-4 relative">
                        {/* Connection Line */}
                        {idx !== currentSteps.length - 1 && (
                          <div className={`absolute top-8 left-[19px] bottom-[-24px] w-[2px] ${isDone ? 'bg-[#7C3AED]' : 'bg-slate-200'} transition-colors duration-500`} />
                        )}
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 relative z-10 ${
                          isActive ? 'bg-[#7C3AED]/15 border-[#7C3AED] text-[#7C3AED] shadow-[0_4px_12px_rgba(124,58,237,0.15)]' : 
                          isDone ? 'bg-[#7C3AED] border-[#7C3AED] text-white' : 
                          'bg-white border-slate-200 text-slate-405'
                        }`}>
                           {isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                        </div>
                        
                        <div className="pt-2">
                          <span className={`text-sm block transition-colors ${isActive ? 'text-[#7C3AED] font-bold font-display' : isDone ? 'text-slate-700 font-semibold font-display' : 'text-slate-400 font-light'}`}>
                            {step.label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-[#7C3AED] uppercase tracking-wider font-mono font-bold mt-1 block">In Progress...</span>
                          )}
                        </div>
                     </div>
                   );
                 })}
             </div>

             <AnimatePresence>
               {isComplete && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="mt-8 pt-6 border-t border-slate-200/60 space-y-3"
                 >
                     <button 
                       onClick={onSaveAndContinue}
                       className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_10px_20px_rgba(124,58,237,0.15)] transition-all"
                     >
                       <Sparkles className="w-4 h-4" /> Save DNA Matrix <ArrowRight className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={onClose}
                       className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
                     >
                       Review & Edit Parameters
                     </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Terminal Output */}
        <div className="w-full md:w-[55%] bg-slate-900 font-mono text-xs md:text-sm flex flex-col relative h-[400px] md:h-[500px] overflow-hidden">
           <div className="relative z-10 p-6 flex flex-col h-full pointer-events-auto">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-805/80">
                 <div className="flex items-center gap-2 text-slate-400">
                   <Terminal className="w-4 h-4" />
                   <span>agent.stdout</span>
                 </div>
                 <div className="text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                   <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                   {progressPercent}%
                 </div>
              </div>
              
              {screenshotUrl && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="mb-4 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative aspect-[16/9] w-full shrink-0 border border-slate-800"
                 >
                    <img referrerPolicy="no-referrer" src={screenshotUrl || undefined} alt="Website Screenshot" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-md p-2 text-[11px] text-center text-white font-sans tracking-wide border-t border-white/5">
                      Target Site Snapshot Acquired
                    </div>
                 </motion.div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 text-slate-300 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                 {displayedLogs.map((log, i) => (
                   <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`${log.startsWith('>') ? 'text-[#a78bfa] ml-4 font-semibold' : 'text-slate-405'}`}
                   >
                     <span className="text-slate-600 mr-2">[{String(i+1).padStart(2, '0')}]</span>
                     {log}
                   </motion.div>
                 ))}
                 
                 {!isComplete && (
                   <div className="flex items-center gap-2 mt-4 text-[#a78bfa] opacity-80">
                      <div className="w-1.5 h-3 bg-[#a78bfa] animate-pulse" />
                      Processing...
                   </div>
                 )}
                 <div ref={logsEndRef} className="pb-8" />
              </div>
           </div>

           {/* Overlay overlay when complete */}
           <AnimatePresence>
             {isComplete && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-8 text-center"
               >
                 <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xl max-w-xs w-full text-center">
                    <Database className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-bounce" />
                    <h3 className="text-slate-850 font-bold font-display text-base mb-1">Extraction Complete</h3>
                    <p className="text-slate-500 text-xs font-light">Brand context graph synchronized.</p>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
