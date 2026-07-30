import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, Bot, Target, FileText, Globe, ArrowRight, Terminal, Activity, Database, Zap, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { BrainCircuit, AlertTriangle, Palette } from 'lucide-react';
import { ProductDNA } from '../types';
import { DnaModel } from './DnaModel';

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
  dna?: Partial<ProductDNA>;
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

export function BrandExtractionModal({ isOpen, inputType, isComplete, screenshotUrl, extractionLogs, extractionProgress, onClose, onSaveAndContinue, dna }: BrandExtractionModalProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [dismissCompleteOverlay, setDismissCompleteOverlay] = useState(false);

  useEffect(() => {
    if (!isComplete) {
      setDismissCompleteOverlay(false);
    }
  }, [isComplete]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200/80 rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Panel: Status & Steps */}
        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 w-full md:w-[45%] relative flex flex-col bg-slate-50/50 overflow-y-auto">
          
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
                  <p className="text-xs text-[#7C3AED] font-semibold font-sans uppercase tracking-wider">Running DNA Extraction</p>
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

              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div 
                    key="complete-buttons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
                ) : (
                  <motion.div
                    key="cancel-button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-8 pt-6 border-t border-slate-100"
                  >
                    <button 
                      onClick={onClose}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-650 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Cancel extraction
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: DNA Helix Model Visualizer */}
        <div className="w-full md:w-[55%] bg-[#FAF9F6] border-l border-slate-900/10 flex flex-col relative h-[450px] md:h-auto md:self-stretch overflow-hidden">
          {/* Floating Progress HUD Indicator */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-emerald-600 text-[10px] font-mono font-bold tracking-wider shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></span>
            <span>DNA_SYNTHESIS: {progressPercent}%</span>
          </div>

          <DnaModel progress={extractionProgress} dna={dna} isComplete={isComplete} />

          {/* Overlay when complete */}
          <AnimatePresence>
            {isComplete && !dismissCompleteOverlay && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#FAF9F6]/70 backdrop-blur-sm flex items-center justify-center p-8 text-center z-30 pointer-events-none"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl max-w-xs w-full text-center pointer-events-auto"
                >
                   <Database className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                   <h3 className="text-slate-900 font-bold font-display text-base mb-1">Extraction Complete</h3>
                   <p className="text-slate-600 text-xs font-light mb-4">Brand DNA Matrix successfully compiled and synchronized.</p>
                   <button
                     onClick={() => setDismissCompleteOverlay(true)}
                     className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                   >
                     Explore 3D DNA Model
                   </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
