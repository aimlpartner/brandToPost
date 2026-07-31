import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  Loader2,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  Globe,
  Briefcase,
  Megaphone,
  UserCheck,
  Check,
  LogOut,
  ChevronLeft,
  MessageSquare,
  Zap,
  Target,
  Brain,
  Pencil,
  Info,
} from 'lucide-react';
import { playSuccessChime } from '../lib/utils';
import { PersonalBrandItem, PersonalBrandingProfile } from '../types';

interface EditableVoiceFieldProps {
  label: string;
  items: string[];
  icon: React.ElementType;
  color: string;
  onChange: (newItems: string[]) => void;
}

function EditableVoiceField({
  label,
  items,
  icon: Icon,
  color,
  onChange,
}: EditableVoiceFieldProps) {
  const [editing, setEditing] = useState(false);
  const [textValue, setTextValue] = useState('');

  useEffect(() => {
    if (editing) {
      setTextValue((items || []).join('\n'));
    }
  }, [editing, items]);

  const handleSave = () => {
    const newItems = textValue
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => Boolean(line));
    onChange(newItems);
    setEditing(false);
  };

  return (
    <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 shadow-sm text-left flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            <span>{label}</span>
          </h4>
          <button
            type="button"
            onClick={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              editing ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Pencil className="h-3 w-3" strokeWidth={1.8} />
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            rows={5}
            placeholder={`Enter each ${label.toLowerCase()} on a new line...`}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-350 outline-none resize-none leading-relaxed transition-all"
          />
        ) : (
          <ul className="space-y-1.5">
            {!items || items.length === 0 ? (
              <li className="text-xs text-slate-400 italic">
                None specified. Click Edit to add.
              </li>
            ) : (
              items.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <span className={`${color} font-bold mt-0.5 shrink-0`}>•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PersonalBrandingOnboarding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State
  const [founderName, setFounderName] = useState(user?.displayName || '');
  const [founderDescription, setFounderDescription] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [voiceDna, setVoiceDna] = useState<any>(null);

  // Step 2 & 3 State
  const [includeBrands, setIncludeBrands] = useState<boolean | null>(null);
  const [brandType, setBrandType] = useState<'owned' | 'promotional'>('owned');

  // Step 4 State
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);

  // Step 5 State
  const [isResearching, setIsResearching] = useState(false);
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchedBrands, setResearchedBrands] = useState<PersonalBrandItem[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentText(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const handleSynthesizeVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderName.trim() && !founderDescription.trim() && !documentText.trim()) {
      setError('Please provide your name and a brief voice description or file excerpt.');
      return;
    }
    setError(null);
    setIsSynthesizing(true);
    try {
      const token = user ? await user.getIdToken() : '';
      const response = await fetch('/api/personal-branding/voice-synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: founderName,
          description: founderDescription,
          documentText: documentText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Voice synthesis failed');
      }

      const data = await response.json();
      setVoiceDna(data);
      playSuccessChime();
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize Voice DNA');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const saveProfileAndRedirect = async (brandsToSave: PersonalBrandItem[]) => {
    if (!user) return;
    try {
      const profileData: Record<string, any> = {
        id: user.uid,
        userId: user.uid,
        founderName: founderName || user.displayName || 'Founder',
        founderDescription: founderDescription || '',
        includeBrands: !!includeBrands,
        brands: brandsToSave || [],
        updatedAt: new Date().toISOString(),
      };
      if (fileName) profileData.founderVoiceFileName = fileName;
      if (voiceDna) profileData.voiceDna = voiceDna;
      if (includeBrands && brandType) profileData.brandType = brandType;
      await setDoc(doc(db, 'users', user.uid, 'personalBranding', 'profile'), profileData, {
        merge: true,
      });
      localStorage.setItem(`onboardingCompleted_${user.uid}`, 'true');
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          onboarded: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      playSuccessChime();
      navigate('/individual', { replace: true });
    } catch (err: any) {
      console.error('Failed to save PersonalBranding profile:', err);
      setError('Failed to save profile. Proceeding to dashboard...');
      navigate('/individual', { replace: true });
    }
  };

  const handleNoBrands = async () => {
    setIncludeBrands(false);
    await saveProfileAndRedirect([]);
  };

  const handleAddUrl = () => {
    const trimmed = currentUrlInput.trim();
    if (!trimmed) return;
    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }
    if (!urls.includes(formatted)) {
      setUrls([...urls, formatted]);
    }
    setCurrentUrlInput('');
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(urls.filter((u) => u !== urlToRemove));
  };

  const handleStartResearch = async () => {
    if (urls.length === 0) {
      setError('Please add at least one website link.');
      return;
    }
    setError(null);
    setStep(5);
    setIsResearching(true);
    setResearchLogs(['Initializing grounding research engine...']);

    try {
      for (const u of urls) {
        setResearchLogs((prev) => [...prev, `Researching ${u}...`]);
      }

      const token = user ? await user.getIdToken() : '';
      const response = await fetch('/api/personal-branding/grounding-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          urls,
          brandType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Grounding research failed');
      }

      const data = await response.json();
      setResearchedBrands(data.brands || []);
      setResearchLogs((prev) => [
        ...prev,
        'Brand positioning and target audience extracted.',
        'Saving profile to Firestore...',
        'Complete!',
      ]);

      setTimeout(() => {
        saveProfileAndRedirect(data.brands || []);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Grounding research encountered an error');
      setIsResearching(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-8 pt-6 sm:pt-10 relative selection:bg-[#7C3AED] selection:text-white select-none bg-slate-50">
      <div className="w-full max-w-6xl z-10 flex flex-col items-center">
        {/* Header Branding */}
        <div className="flex items-center justify-between w-full mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/B2PLOGO.png"
              alt="Logo"
              className="h-9 object-contain drop-shadow-md select-none pointer-events-none"
            />
            <span className="text-xl font-bold font-display text-slate-800 tracking-tight select-none">
              BrandToPost
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              Personal Branding
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-slate-500 hover:text-slate-850 hover:bg-slate-200/50 py-1.5 px-3 border border-slate-350 bg-white/70 hover:border-slate-450 rounded-lg font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-semibold text-center shadow-sm">
            <div>{error}</div>
          </div>
        )}

        {/* Wizard Panel */}
        <div className="w-full bg-[#FAF9F6] border border-slate-900/10 shadow-[0_30px_70px_rgba(15,23,42,0.06)] rounded-3xl overflow-hidden flex flex-col min-h-[520px]">
          {/* Progress Banner */}
          <div className="w-full border-b border-slate-900/10 bg-[#08080C] text-[#FAF9F6] p-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">
                {step === 1 && 'Step 1: Founder Identity & Voice DNA'}
                {step === 2 && 'Step 2: Include Products & Brands?'}
                {step === 3 && 'Step 3: Brand Ownership Type'}
                {step === 4 && 'Step 4: Add Brand Website Links'}
                {step === 5 && 'Step 5: Grounding Research Engine'}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {step === 1 && 'Calibrate your digital doppelganger with your natural voice heuristics.'}
                {step === 2 && 'Choose whether to feature companies or focus strictly on personal branding.'}
                {step === 3 && 'Specify if these are your own companies or affiliate promotional brands.'}
                {step === 4 && 'Add the website URLs for the brands you want to feature.'}
                {step === 5 && 'Extracting brand positioning and audience from your website links...'}
              </p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-white">
              Step {step} of 5
            </div>
          </div>

          <div className="p-6 sm:p-10 flex-1 flex flex-col justify-between">
            {/* STEP 1: VOICE SYNTHESIZATION */}
            {step === 1 && (
              <div className="space-y-6">
                {!voiceDna ? (
                  <form onSubmit={handleSynthesizeVoice} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        placeholder="e.g. Arthur Pendelton"
                        className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Describe Your Communication Style & Heuristics
                      </label>
                      <textarea
                        rows={4}
                        value={founderDescription}
                        onChange={(e) => setFounderDescription(e.target.value)}
                        placeholder="e.g. Short punchy sentences, zero fluff, candid startup lessons, high agency mindset. I prioritize speed and long-term customer value..."
                        className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Optional: Upload Sample Writings or Bio File
                      </label>
                      <label className="flex items-center justify-center gap-2 w-full p-4 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl bg-white cursor-pointer transition-colors text-xs font-semibold text-slate-600">
                        <Upload className="w-4 h-4 text-[#7C3AED]" />
                        <span>{fileName ? `Uploaded: ${fileName}` : 'Choose a text (.txt) file or essay'}</span>
                        <input
                          type="file"
                          accept=".txt,.md,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSynthesizing}
                        className="py-3 px-6 rounded-xl bg-[#08080C] text-[#FAF9F6] font-semibold text-xs flex items-center gap-2 hover:bg-[#7C3AED] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isSynthesizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Synthesizing Voice DNA...</span>
                          </>
                        ) : (
                          <>
                            <span>Synthesize Voice DNA</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Output Card for Synthesized Voice DNA */
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                            Synthesized Profile
                          </span>
                          <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                            {voiceDna.personaName || founderName || 'Founder Voice Profile'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200">
                          <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
                          <span>You can edit these heuristics now or anytime later in your Dashboard</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                        <EditableVoiceField
                          label="Communication Style"
                          items={voiceDna.communicationStyle || []}
                          icon={MessageSquare}
                          color="text-blue-500"
                          onChange={(newItems) =>
                            setVoiceDna((prev: any) => ({
                              ...prev,
                              communicationStyle: newItems,
                            }))
                          }
                        />
                        <EditableVoiceField
                          label="Behavioral Traits"
                          items={voiceDna.behavioralTraits || []}
                          icon={Zap}
                          color="text-amber-500"
                          onChange={(newItems) =>
                            setVoiceDna((prev: any) => ({
                              ...prev,
                              behavioralTraits: newItems,
                            }))
                          }
                        />
                        <EditableVoiceField
                          label="Core Values"
                          items={voiceDna.coreValues || []}
                          icon={Target}
                          color="text-emerald-500"
                          onChange={(newItems) =>
                            setVoiceDna((prev: any) => ({
                              ...prev,
                              coreValues: newItems,
                            }))
                          }
                        />
                        <EditableVoiceField
                          label="Decision Heuristics"
                          items={voiceDna.decisionHeuristics || []}
                          icon={Brain}
                          color="text-purple-500"
                          onChange={(newItems) =>
                            setVoiceDna((prev: any) => ({
                              ...prev,
                              decisionHeuristics: newItems,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setVoiceDna(null)}
                        className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                      >
                        Recalibrate
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="py-2.5 px-6 rounded-xl bg-[#08080C] text-[#FAF9F6] font-semibold text-xs flex items-center gap-2 hover:bg-[#7C3AED] transition-colors shadow-sm cursor-pointer"
                      >
                        <span>Looks great, continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: INCLUDE PRODUCTS (BRANDS)? YES OR NO */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option 1: Yes, include brands */}
                  <div
                    onClick={() => {
                      setIncludeBrands(true);
                      setStep(3);
                    }}
                    className="bg-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md text-left"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#08080C] text-white flex items-center justify-center mb-4">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Yes, include products / brands
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Incorporate your startups, owned companies, or promotional/affiliate partner links into your personal branding posts.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                      <span>Continue with brands</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Option 2: No, personal only */}
                  <div
                    onClick={handleNoBrands}
                    className="bg-white border border-slate-200 hover:border-slate-900 rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md text-left"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#08080C] text-white flex items-center justify-center mb-4">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        No, personal branding only
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Skip brand links entirely. Focus 100% on executive thought leadership, lessons, and personal authority without product pitches.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span>Skip to individual dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BRAND OWNERSHIP TYPE (OWNED vs PROMOTIONAL) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal / Owned Brands */}
                  <div
                    onClick={() => {
                      setBrandType('owned');
                      setStep(4);
                    }}
                    className={`bg-white border rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md text-left ${
                      brandType === 'owned'
                        ? 'border-slate-900 ring-2 ring-slate-900/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#08080C] text-white flex items-center justify-center mb-4">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Personal / Owned Brands
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your own startups, SaaS products, or executive services. We generate professional executive storytelling that naturally features your brand link.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <span>Select Personal / Owned</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Advertising / Affiliate / Promotional Brands */}
                  <div
                    onClick={() => {
                      setBrandType('promotional');
                      setStep(4);
                    }}
                    className={`bg-white border rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md text-left ${
                      brandType === 'promotional'
                        ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center mb-4">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Advertising / Affiliate (Promotional Brands)
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Brands you partner with, affiliate for, or sponsor. Unlocks viral LinkedIn formats: Broetry, Guerrilla Influencer Marketing, Astroturfing, and Corporate Fanfiction.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                      <span>Select Advertising / Affiliate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ADD WEBSITE LINKS WITH + BUTTON */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">
                      Add {brandType === 'owned' ? 'Personal / Owned' : 'Promotional / Affiliate'} Brand Websites
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentUrlInput}
                      onChange={(e) => setCurrentUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      placeholder="e.g. https://example.com"
                      className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-4 py-2.5 bg-[#08080C] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  {/* List of Added URLs */}
                  {urls.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Added Brands ({urls.length})
                      </span>
                      {urls.map((u) => (
                        <div
                          key={u}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                        >
                          <span className="font-medium truncate">{u}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(u)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      No brand website links added yet. Enter a URL above and click + to add.
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    💡 You can always add or remove brand links later on in your individual dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartResearch}
                    disabled={urls.length === 0}
                    className="py-3 px-6 rounded-xl bg-[#08080C] text-[#FAF9F6] font-semibold text-xs flex items-center gap-2 hover:bg-[#7C3AED] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>Research Brands & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: GROUNDING RESEARCH CONSOLE */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left font-mono text-xs text-slate-300 min-h-[220px] shadow-inner space-y-2">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                    <span>Grounding Research Console ({brandType})</span>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {researchLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-slate-500 select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isResearching}
                    onClick={() => saveProfileAndRedirect(researchedBrands)}
                    className="py-3 px-6 rounded-xl bg-[#08080C] text-[#FAF9F6] font-semibold text-xs flex items-center gap-2 hover:bg-[#7C3AED] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>Enter Individual Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
