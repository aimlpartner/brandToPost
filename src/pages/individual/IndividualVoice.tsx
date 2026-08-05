import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Zap,
  Target,
  Brain,
  Globe,
  Save,
  FileText,
  UserCheck,
  Sparkles,
  Upload,
  X,
  RefreshCw
} from 'lucide-react';
import { PersonalBrandingProfile } from '../../types';
import { synthesizeFounderAgent } from '../../services/geminiService';

type TabKey = 'identity' | 'heuristics' | 'settings' | 'brands';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'identity', label: 'Persona Identity', icon: UserCheck },
  { key: 'heuristics', label: 'Voice Heuristics', icon: Brain },
  { key: 'settings', label: 'Persona Settings', icon: FileText },
  { key: 'brands', label: 'Attached Brands', icon: Globe },
];

const BentoCard = ({ children, className = "", span = 1 }: { children: React.ReactNode; className?: string; span?: 1 | 2 | 3 }) => {
  const spanClass = span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-6 ${spanClass} ${className}`}>
      {children}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, iconColor = "text-[#7C3AED]", action }: { icon: React.ElementType; title: string; iconColor?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.8} />
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h3>
    </div>
    {action}
  </div>
);

// ─── Smart List Field (Editable Bullet Points) ───
interface SmartListFieldProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: string[];
  onChange: (newItems: string[]) => void;
  bulletColor?: string;
}

function SmartListField({ title, icon: Icon, iconColor, items, onChange, bulletColor = "text-blue-500" }: SmartListFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rawText, setRawText] = useState(items.join('\n'));

  useEffect(() => {
    if (!isEditing) {
      setRawText(items.join('\n'));
    }
  }, [items, isEditing]);

  const handleDone = () => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    onChange(lines);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-50/60 border border-slate-200/80 rounded-lg p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={() => isEditing ? handleDone() : setIsEditing(true)}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold cursor-pointer transition-colors"
        >
          {isEditing ? 'Save Items' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={Math.max(3, items.length + 1)}
            placeholder="Type one point per line..."
            className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-lg p-2.5 text-xs text-slate-800 outline-none leading-relaxed"
          />
          <p className="text-[10px] text-slate-400">Type 1 item per line, then click Save Items.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.length > 0 ? (
            items.map((t: string, i: number) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                <span className={`${bulletColor} font-bold mt-0.5`}>•</span>
                <span className="leading-relaxed font-medium">{t}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-400 italic">No items defined yet. Click Edit to add.</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Smart Field (Editable Single/Multi Text) ───
interface SmartFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (val: string) => void;
}

function SmartField({ label, value, placeholder = "—", multiline = false, onChange }: SmartFieldProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="group text-left">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold cursor-pointer"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="h-px bg-slate-100 mb-2.5" />
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-300 outline-none leading-relaxed transition-colors"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-300 outline-none transition-colors"
          />
        )
      ) : (
        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${value?.trim() ? "text-slate-800 font-medium" : "text-slate-400 italic"}`}>
          {value?.trim() || placeholder}
        </p>
      )}
    </div>
  );
}

// ─── Smart Content Pillars Field ───
function SmartPillarsField({ pillars, onChange }: { pillars: string[]; onChange: (p: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const handleAdd = () => {
    if (!inputVal.trim()) return;
    const tag = inputVal.trim().replace(/^#\s*/, '');
    if (!pillars.includes(tag)) {
      onChange([...pillars, tag]);
    }
    setInputVal('');
  };

  const handleRemove = (tag: string) => {
    onChange(pillars.filter((p) => p !== tag));
  };

  return (
    <div className="md:col-span-2 bg-slate-50/60 border border-slate-200/80 rounded-lg p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-600 block uppercase tracking-wider">
          Recommended Content Pillars
        </span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold cursor-pointer"
        >
          {editing ? 'Done' : 'Edit Pillars'}
        </button>
      </div>

      {editing && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="Add pillar tag (e.g. Scaling Frameworks)..."
            className="flex-1 bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {pillars.length > 0 ? (
          pillars.map((p, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-md text-xs font-semibold shadow-2xs"
            >
              <span># {p}</span>
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemove(p)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  ×
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic">No content pillars defined yet. Click Edit Pillars to add.</span>
        )}
      </div>
    </div>
  );
}

export function IndividualVoice() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<PersonalBrandingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('identity');

  // Edit States
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editUrls, setEditUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');

  // Re-synthesis Modal States
  const [isResynthesizeModalOpen, setIsResynthesizeModalOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthProgress, setSynthProgress] = useState(0);
  const [synthLogs, setSynthLogs] = useState<string[]>([]);
  const [synthDesc, setSynthDesc] = useState('');
  const [synthFile, setSynthFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  // Synthesized Voice DNA States
  const [voiceDna, setVoiceDna] = useState<{
    personaName: string;
    targetIndustry: string;
    targetAudience: string;
    vision: string;
    mission: string;
    goal: string;
    communicationStyle: string[];
    behavioralTraits: string[];
    coreValues: string[];
    decisionHeuristics: string[];
    contentPillars: string[];
  }>({
    personaName: '',
    targetIndustry: '',
    targetAudience: '',
    vision: '',
    mission: '',
    goal: '',
    communicationStyle: [],
    behavioralTraits: [],
    coreValues: [],
    decisionHeuristics: [],
    contentPillars: [],
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as PersonalBrandingProfile;
          setProfile(data);
          setEditName(data.founderName || '');
          setEditDesc(data.founderDescription || '');
          setSynthDesc(data.founderDescription || '');
          setEditUrls(data.brands?.map((b) => b.website || b.url || '') || []);

          if (data.voiceDna) {
            setVoiceDna({
              personaName: data.voiceDna.personaName || data.founderName || '',
              targetIndustry: data.voiceDna.targetIndustry || '',
              targetAudience: data.voiceDna.targetAudience || '',
              vision: data.voiceDna.vision || '',
              mission: data.voiceDna.mission || '',
              goal: data.voiceDna.goal || '',
              communicationStyle: data.voiceDna.communicationStyle || [],
              behavioralTraits: data.voiceDna.behavioralTraits || [],
              coreValues: data.voiceDna.coreValues || [],
              decisionHeuristics: data.voiceDna.decisionHeuristics || [],
              contentPillars: data.voiceDna.contentPillars || [],
            });
          }
        }
      } catch (err) {
        console.error('Error loading profile in voice page:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleAddNewUrl = () => {
    if (!newUrlInput.trim()) return;
    const url = newUrlInput.trim();
    if (!editUrls.includes(url)) {
      setEditUrls([...editUrls, url]);
    }
    setNewUrlInput('');
  };

  const handleRemoveUrl = (url: string) => {
    setEditUrls(editUrls.filter((u) => u !== url));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSynthError("File size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSynthFile({
        name: file.name,
        mimeType: file.type || "text/plain",
        data: (reader.result as string).split(",")[1],
      });
      setSynthError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunSynthesis = async () => {
    if (!synthDesc.trim() && !synthFile) {
      setSynthError("Please enter founder details or upload a background document to re-synthesize.");
      return;
    }
    if (!user) return;

    setSynthError(null);
    setIsSynthesizing(true);
    setSynthProgress(10);
    setSynthLogs(["Initializing AI Cognitive Profiler...", "Reading founder profile input..."]);

    try {
      const t1 = setTimeout(() => { setSynthLogs((p) => [...p, "Analyzing personality & action patterns..."]); setSynthProgress(35); }, 800);
      const t2 = setTimeout(() => { setSynthLogs((p) => [...p, "Extracting tone and communication style..."]); setSynthProgress(65); }, 1600);
      const t3 = setTimeout(() => { setSynthLogs((p) => [...p, "Modeling decision heuristics & core values..."]); setSynthProgress(88); }, 2400);

      const docObj = synthFile ? { data: synthFile.data, mimeType: synthFile.mimeType } : null;
      const res = await synthesizeFounderAgent(synthDesc || editDesc || "B2B Founder & Executive Leader", docObj, user.uid);

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setSynthLogs((p) => [...p, "> Analysis complete!", `Activating Doppelganger: "${res.personaName || 'Founder Profile'}"`]);
      setSynthProgress(100);

      const newVoiceDna = {
        personaName: res.personaName || editName || 'Founder Voice Profile',
        targetIndustry: res.targetIndustry || voiceDna.targetIndustry || '',
        targetAudience: res.targetAudience || voiceDna.targetAudience || '',
        vision: res.vision || voiceDna.vision || '',
        mission: res.mission || voiceDna.mission || '',
        goal: res.goal || voiceDna.goal || '',
        communicationStyle: res.communicationStyle || voiceDna.communicationStyle || [],
        behavioralTraits: res.behavioralTraits || voiceDna.behavioralTraits || [],
        coreValues: res.coreValues || voiceDna.coreValues || [],
        decisionHeuristics: res.decisionHeuristics || voiceDna.decisionHeuristics || [],
        contentPillars: res.contentPillars || voiceDna.contentPillars || [],
        synthesizedAt: new Date().toISOString(),
      };

      setVoiceDna(newVoiceDna);
      if (res.personaName) setEditName(res.personaName);

      // Save to Firestore
      const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
      await setDoc(docRef, {
        founderName: res.personaName || editName,
        founderDescription: synthDesc || editDesc,
        voiceDna: newVoiceDna,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setTimeout(() => {
        setIsSynthesizing(false);
        setIsResynthesizeModalOpen(false);
        setSuccessMsg("Founder Voice & AI Doppelganger successfully re-synthesized!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }, 700);
    } catch (err) {
      console.error("Re-synthesis failed:", err);
      setSynthError("Failed to re-synthesize founder agent. Please try again.");
      setIsSynthesizing(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');

      const updatedBrands = editUrls.map((u, i) => ({
        id: `brand-${i}-${Date.now()}`,
        name: u.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'Brand Website',
        website: u,
        url: u,
        brandType: 'owned' as const,
      }));

      const updatedVoiceDna = {
        ...profile?.voiceDna,
        personaName: voiceDna.personaName || editName,
        targetIndustry: voiceDna.targetIndustry,
        targetAudience: voiceDna.targetAudience,
        vision: voiceDna.vision,
        mission: voiceDna.mission,
        goal: voiceDna.goal,
        communicationStyle: voiceDna.communicationStyle,
        behavioralTraits: voiceDna.behavioralTraits,
        coreValues: voiceDna.coreValues,
        decisionHeuristics: voiceDna.decisionHeuristics,
        contentPillars: voiceDna.contentPillars,
        synthesizedAt: profile?.voiceDna?.synthesizedAt || new Date().toISOString(),
      };

      const payload: Partial<PersonalBrandingProfile> = {
        founderName: editName.trim(),
        founderDescription: editDesc.trim(),
        brands: updatedBrands,
        voiceDna: updatedVoiceDna,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      setProfile((prev) => (prev ? { ...prev, ...payload } : null));

      setSuccessMsg('Founder voice profile saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <span className="text-xs font-semibold">Loading Founder Voice Profile...</span>
      </div>
    );
  }

  // ─── Tab Renderer: Persona Identity ───
  const renderIdentityTab = () => (
    <div className="space-y-6">
      <BentoCard span={3}>
        <SectionTitle
          icon={UserCheck}
          title="Calibrated Founder Persona Identity"
          iconColor="text-[#7C3AED]"
          action={
            <button
              type="button"
              onClick={() => setIsResynthesizeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-synthesize Voice</span>
            </button>
          }
        />

        {/* Persona Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-5 border-b border-slate-100">
          <SmartField
            label="Persona Title / Name"
            value={voiceDna.personaName || editName}
            placeholder="e.g. Dean - B2B Scaling Architect"
            onChange={(v) => {
              setVoiceDna((prev) => ({ ...prev, personaName: v }));
              setEditName(v);
            }}
          />
          <SmartField
            label="Target Industry"
            value={voiceDna.targetIndustry}
            placeholder="e.g. B2B Services and SaaS"
            onChange={(v) => setVoiceDna((prev) => ({ ...prev, targetIndustry: v }))}
          />
          <SmartField
            label="Target Audience"
            value={voiceDna.targetAudience}
            placeholder="e.g. CMOs, Sales Directors, Ops Leaders"
            onChange={(v) => setVoiceDna((prev) => ({ ...prev, targetAudience: v }))}
          />
        </div>

        {/* Strategic Vision, Mission & Goals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 pb-5 border-b border-slate-100">
          <SmartField
            label="Founder Vision"
            value={voiceDna.vision}
            placeholder="Long term impact & industry vision..."
            multiline
            onChange={(v) => setVoiceDna((prev) => ({ ...prev, vision: v }))}
          />
          <SmartField
            label="Mission Statement"
            value={voiceDna.mission}
            placeholder="Core mission and daily driver..."
            multiline
            onChange={(v) => setVoiceDna((prev) => ({ ...prev, mission: v }))}
          />
          <SmartField
            label="Core Goal / Focus"
            value={voiceDna.goal}
            placeholder="Primary strategic objective..."
            multiline
            onChange={(v) => setVoiceDna((prev) => ({ ...prev, goal: v }))}
          />
        </div>

        {/* Communication Style & Behavioral Traits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SmartListField
            title="Communication Style"
            icon={MessageSquare}
            iconColor="text-blue-500"
            bulletColor="text-blue-500"
            items={voiceDna.communicationStyle}
            onChange={(items) => setVoiceDna((prev) => ({ ...prev, communicationStyle: items }))}
          />

          <SmartListField
            title="Behavioral Traits"
            icon={Zap}
            iconColor="text-amber-500"
            bulletColor="text-amber-500"
            items={voiceDna.behavioralTraits}
            onChange={(items) => setVoiceDna((prev) => ({ ...prev, behavioralTraits: items }))}
          />
        </div>
      </BentoCard>
    </div>
  );

  // ─── Tab Renderer: Voice Heuristics ───
  const renderHeuristicsTab = () => (
    <div className="space-y-6">
      <BentoCard span={3}>
        <SectionTitle
          icon={Brain}
          title="Cognitive & Decision Heuristics"
          iconColor="text-purple-600"
          action={
            <button
              type="button"
              onClick={() => setIsResynthesizeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-synthesize Voice</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <SmartListField
            title="Core Values"
            icon={Target}
            iconColor="text-emerald-500"
            bulletColor="text-emerald-500"
            items={voiceDna.coreValues}
            onChange={(items) => setVoiceDna((prev) => ({ ...prev, coreValues: items }))}
          />

          <SmartListField
            title="Decision Heuristics"
            icon={Brain}
            iconColor="text-purple-500"
            bulletColor="text-purple-500"
            items={voiceDna.decisionHeuristics}
            onChange={(items) => setVoiceDna((prev) => ({ ...prev, decisionHeuristics: items }))}
          />

          <SmartPillarsField
            pillars={voiceDna.contentPillars}
            onChange={(pillars) => setVoiceDna((prev) => ({ ...prev, contentPillars: pillars }))}
          />
        </div>
      </BentoCard>
    </div>
  );

  // ─── Tab Renderer: Persona Settings ───
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <BentoCard span={3}>
        <SectionTitle
          icon={FileText}
          title="Founder Persona Settings"
          iconColor="text-blue-600"
        />
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl text-left">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Founder Persona Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setVoiceDna((prev) => ({ ...prev, personaName: e.target.value }));
              }}
              placeholder="e.g. Dean - B2B Scaling Architect"
              className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Founder Profile Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={5}
              placeholder="Brief summary of founder background & key domain expertise..."
              className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>
        </form>
      </BentoCard>
    </div>
  );

  // ─── Tab Renderer: Brands ───
  const renderBrandsTab = () => (
    <div className="space-y-6">
      <BentoCard span={3}>
        <SectionTitle
          icon={Globe}
          title="Attached Brand Products & Sites"
          iconColor="text-emerald-600"
        />

        <div className="space-y-5 max-w-2xl text-left">
          <p className="text-xs text-slate-500 leading-relaxed">
            Add website URLs for products or brands you own or advocate for. These will be referenced during content generation.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newUrlInput}
              onChange={(e) => setNewUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handleAddNewUrl}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add URL</span>
            </button>
          </div>

          <div className="space-y-2 pt-1 max-h-64 overflow-y-auto">
            {editUrls.length > 0 ? (
              editUrls.map((u) => (
                <div
                  key={u}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800"
                >
                  <span className="font-mono text-xs text-slate-700 truncate">{u}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(u)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-400 italic">
                No brand websites added yet.
              </div>
            )}
          </div>
        </div>
      </BentoCard>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pt-2 sm:pt-4 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Founder Voice & Brand DNA</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review your synthesized AI persona heuristics and manage connected brand preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsResynthesizeModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <span>Re-synthesize Voice DNA</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Layout: Mini Sidebar + Content */}
      <div className="flex gap-8 items-start text-left mt-6">
        {/* ── Desktop: Vertical Mini Sidebar ── */}
        <nav className="hidden md:flex flex-col shrink-0 w-44 pt-1 sticky top-8 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Voice DNA</p>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`text-left px-3 py-2.5 text-sm transition-all duration-150 border-l-2 cursor-pointer ${
                  isActive
                    ? "border-[#7C3AED] text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-900 font-normal"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── Mobile: Horizontal Scroll Tabs ── */}
        <div className="md:hidden w-full mb-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive ? "bg-[#7C3AED] text-white" : "text-slate-500 bg-slate-100 hover:text-slate-700"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0">
          <div key={activeTab} className="animate-in fade-in duration-200">
            {activeTab === 'identity' && renderIdentityTab()}
            {activeTab === 'heuristics' && renderHeuristicsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
            {activeTab === 'brands' && renderBrandsTab()}
          </div>
        </div>
      </div>

      {/* Save Footer Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between mt-6 ml-0 md:ml-52">
        <div className="text-xs text-slate-500">
          {profile?.updatedAt ? `Last updated: ${new Date(profile.updatedAt).toLocaleDateString()}` : 'Profile ready'}
        </div>
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={isSavingSettings}
          className="py-2.5 px-5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isSavingSettings ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>

      {/* ── Re-synthesize Modal ── */}
      {isResynthesizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full p-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-50 text-[#7C3AED]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Re-synthesize Founder Voice</h3>
                  <p className="text-xs text-slate-500">Run AI Cognitive Profiler to re-generate tone, heuristics & rules.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSynthesizing && setIsResynthesizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {synthError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {synthError}
              </div>
            )}

            {isSynthesizing ? (
              <div className="py-8 space-y-5 text-center">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-t-[#7C3AED] animate-spin" />
                  <Sparkles className="w-6 h-6 text-[#7C3AED] animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Synthesizing AI Doppelganger...</p>
                  <p className="text-xs text-slate-500 mt-1">Analyzing voice profile & decision models</p>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#7C3AED] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${synthProgress}%` }}
                  />
                </div>

                <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-3 rounded-xl max-h-32 overflow-y-auto space-y-1 text-left">
                  {synthLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="text-purple-400">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Founder Voice Notes & Background
                  </label>
                  <textarea
                    value={synthDesc}
                    onChange={(e) => setSynthDesc(e.target.value)}
                    rows={4}
                    placeholder="Describe your background, tone of voice, values, decision rules, or storytelling preferences..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Optional Background Document (Bio / PDF / Notes)
                  </label>
                  {synthFile ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-[#7C3AED]">
                      <span className="font-medium truncate">{synthFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSynthFile(null)}
                        className="text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-all">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Upload Bio / Document (Max 5MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResynthesizeModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRunSynthesis}
                    className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start AI Synthesis</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
