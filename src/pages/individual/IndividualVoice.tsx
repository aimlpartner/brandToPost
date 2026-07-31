import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Loader2,
  Volume2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Zap,
  Target,
  Brain,
  ArrowRight
} from 'lucide-react';
import { PersonalBrandingProfile } from '../../types';

export function IndividualVoice() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<PersonalBrandingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIncludeBrands, setEditIncludeBrands] = useState(false);
  const [editBrandType, setEditBrandType] = useState<'owned' | 'promotional'>('owned');
  const [editUrls, setEditUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');

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
          setEditIncludeBrands(!!data.includeBrands);
          setEditBrandType(data.brandType || 'owned');
          setEditUrls(data.brands?.map((b) => b.website || b.url || '') || []);
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');

      const updatedBrands = editUrls.map((u) => ({
        name: u.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'Brand Website',
        website: u,
        url: u,
      }));

      const payload: Partial<PersonalBrandingProfile> = {
        founderName: editName.trim(),
        founderDescription: editDesc.trim(),
        includeBrands: editIncludeBrands,
        brandType: editBrandType,
        brands: updatedBrands,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      setProfile((prev) => (prev ? { ...prev, ...payload } : null));

      setSuccessMsg('Founder voice and brand preferences saved successfully!');
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display text-left">
          Founder Voice & Brand DNA
        </h2>
        <p className="text-xs text-slate-500 mt-1 text-left">
          Review your synthesized AI persona heuristics and manage attached brand products.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Synthesized Voice DNA Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left">
        <div className="border-b border-slate-200/80 pb-5 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
              Calibrated Founder Voice
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {profile?.voiceDna?.personaName || profile?.founderName || 'Founder Voice Profile'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Synthesized AI heuristics, decision models, and storytelling rules calibrated from your voice profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {profile?.voiceDna?.targetIndustry && (
              <span className="px-3 py-1 bg-purple-50 text-[#7C3AED] border border-purple-200 rounded-lg text-xs font-semibold">
                {profile.voiceDna.targetIndustry}
              </span>
            )}
            {profile?.voiceDna?.targetAudience && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold">
                {profile.voiceDna.targetAudience}
              </span>
            )}
          </div>
        </div>

        {profile?.voiceDna ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Communication Style */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Communication Style
                </span>
              </div>
              <ul className="space-y-2">
                {profile.voiceDna.communicationStyle?.map((t: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Behavioral Traits */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Behavioral Traits
                </span>
              </div>
              <ul className="space-y-2">
                {profile.voiceDna.behavioralTraits?.map((t: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Core Values */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Core Values
                </span>
              </div>
              <ul className="space-y-2">
                {profile.voiceDna.coreValues?.map((t: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decision Heuristics */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  Decision Heuristics
                </span>
              </div>
              <ul className="space-y-2">
                {profile.voiceDna.decisionHeuristics?.map((t: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-purple-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Pillars */}
            {profile.voiceDna.contentPillars && profile.voiceDna.contentPillars.length > 0 && (
              <div className="md:col-span-2 bg-slate-50/70 border border-slate-200 rounded-xl p-5">
                <span className="text-xs font-bold text-slate-600 block mb-3 uppercase tracking-wider">
                  Recommended LinkedIn Content Pillars
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.voiceDna.contentPillars.map((p: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-bold shadow-xs"
                    >
                      # {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 rounded-xl text-center">
            <p className="text-sm text-slate-600">
              No synthesized Voice DNA found for this profile yet. Complete onboarding or recalibrate to generate your heuristics.
            </p>
          </div>
        )}
      </div>

      {/* Brand & Preference Settings Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left">
        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-200/80 pb-4 font-display">
          Connected Products & Brand Preferences
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Founder Persona Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none"
            />
          </div>

          {/* Include Brands Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editIncludeBrands}
                onChange={(e) => setEditIncludeBrands(e.target.checked)}
                className="w-4 h-4 text-[#7C3AED] rounded cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-800">
                Include Products & Brands in Posts
              </span>
            </label>
          </div>

          {editIncludeBrands && (
            <div className="space-y-4 pl-6 border-l-2 border-[#7C3AED]">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Brand Ownership Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="brandType"
                      checked={editBrandType === 'owned'}
                      onChange={() => setEditBrandType('owned')}
                      className="cursor-pointer"
                    />
                    <span>Personal / Owned Brands</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="brandType"
                      checked={editBrandType === 'promotional'}
                      onChange={() => setEditBrandType('promotional')}
                      className="cursor-pointer"
                    />
                    <span>Promotional / Affiliate Brands</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Website URLs
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-2 text-xs text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewUrl}
                    className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editUrls.map((u) => (
                    <div
                      key={u}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      <span>{u}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUrl(u)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="py-3 px-6 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving settings...</span>
                </>
              ) : (
                <>
                  <span>Save Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
