import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Loader2,
  PenTool,
  Copy,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { playSuccessChime } from '../../lib/utils';
import { PersonalBrandingProfile } from '../../types';
import { RecentPost } from './IndividualOverview';

export function IndividualCreator() {
  const { user } = useAuth();
  const location = useLocation();

  const [profile, setProfile] = useState<PersonalBrandingProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form & Post Generation State
  const [postKind, setPostKind] = useState<'personal' | 'promotional'>('personal');
  const [styleFormat, setStyleFormat] = useState<
    'default' | 'broetry' | 'guerrilla' | 'astroturfing' | 'fanfiction'
  >('default');
  const [topic, setTopic] = useState('');
  const [selectedBrandIndex, setSelectedBrandIndex] = useState<number>(0);
  const [postFocus, setPostFocus] = useState<'personal_only' | 'with_brand'>('with_brand');
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setIsLoadingProfile(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as PersonalBrandingProfile;
          setProfile(data);
          if (data.includeBrands && data.brandType === 'promotional') {
            setPostKind('promotional');
            setStyleFormat('guerrilla');
          } else {
            setPostKind('personal');
            setStyleFormat('default');
          }
        }

        // Check if editing a post passed via navigation state
        if (location.state?.editPost) {
          const editPost = location.state.editPost as RecentPost;
          setTopic(editPost.topic);
          setGeneratedPost(editPost.content);
          if (editPost.styleFormat) {
            setStyleFormat(editPost.styleFormat as any);
          }
        }
      } catch (err) {
        console.error('Error loading profile in creator:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, [user, location.state]);

  const handleSuggestTopics = async () => {
    if (!user) return;
    setIsSuggestingTopics(true);
    setSuggestedTopics([]);
    try {
      const selectedBrand =
        postFocus === 'with_brand' && profile?.brands && profile.brands[selectedBrandIndex]
          ? profile.brands[selectedBrandIndex]
          : undefined;

      const res = await fetch('/api/personal-branding/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          postKind: postFocus === 'with_brand' ? 'promotional' : 'personal',
          selectedBrand,
          voiceDna: profile?.voiceDna,
        }),
      });

      const data = await res.json();
      if (res.ok && data.topics) {
        setSuggestedTopics(data.topics);
      } else {
        // Fallback suggestions
        setSuggestedTopics([
          'Why traditional B2B playbooks are failing in 2026',
          '3 non-obvious lessons from building in a competitive market',
          'How we cut customer acquisition costs by 40% using leverage',
          'The biggest mistake founders make when positioning their product',
        ]);
      }
    } catch (e) {
      console.error('Failed to suggest topics:', e);
      setSuggestedTopics([
        'Why traditional B2B playbooks are failing in 2026',
        '3 non-obvious lessons from building in a competitive market',
        'How we cut customer acquisition costs by 40% using leverage',
        'The biggest mistake founders make when positioning their product',
      ]);
    } finally {
      setIsSuggestingTopics(false);
    }
  };

  const handleGeneratePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedPost('');

    try {
      const activeBrand =
        postFocus === 'with_brand' && profile?.brands && profile.brands[selectedBrandIndex]
          ? profile.brands[selectedBrandIndex]
          : undefined;

      const effectiveKind = postFocus === 'personal_only' ? 'personal' : postKind;

      const response = await fetch('/api/personal-branding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          topic: topic.trim(),
          postKind: effectiveKind,
          styleFormat,
          selectedBrand: activeBrand,
          profileOverride: profile,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate post');

      setGeneratedPost(data.content);
      playSuccessChime();

      // Save to recent posts
      if (user?.uid) {
        const newPost: RecentPost = {
          id: `post-${Date.now()}`,
          topic: topic.trim(),
          styleFormat,
          content: data.content,
          createdAt: 'Just now',
          brandName: activeBrand?.name,
        };
        const existing = localStorage.getItem(`individual_recent_posts_${user.uid}`);
        const list: RecentPost[] = existing ? JSON.parse(existing) : [];
        const updated = [newPost, ...list.slice(0, 19)];
        localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(updated));
      }
    } catch (err: any) {
      console.error('Error generating post:', err);
      setError(err.message || 'Something went wrong while drafting your post.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPost = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoadingProfile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <span className="text-xs font-semibold">Loading LinkedIn Post Creator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          LinkedIn Post Creator
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Draft high-agency executive LinkedIn posts calibrated strictly to your founder voice.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Console: Generator Controls */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-slate-900 font-display">
            LinkedIn Post Calibration
          </h3>

          <form onSubmit={handleGeneratePost} className="space-y-5">
            {/* Post Style / Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Post Type & Format
              </label>
              {profile?.includeBrands && profile.brandType === 'promotional' ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      id: 'guerrilla',
                      title: 'Guerrilla Influencer Marketing',
                      desc: 'Casual, unsolicited personal experience/hack',
                    },
                    {
                      id: 'broetry',
                      title: 'LinkedIn Broetry',
                      desc: '1 sentence per line hook, emotional twist, subtle mention',
                    },
                    {
                      id: 'astroturfing',
                      title: 'Astroturfing Trend',
                      desc: 'Curious observation about industry shift or trend',
                    },
                    {
                      id: 'fanfiction',
                      title: 'Corporate Fanfiction',
                      desc: 'In-depth executive teardown/case study of the brand',
                    },
                  ].map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setStyleFormat(f.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        styleFormat === f.id
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-slate-900 shadow-xs ring-1 ring-[#7C3AED]'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">{f.title}</div>
                      <div className="text-[11px] opacity-75 mt-0.5">{f.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800">
                  <div className="font-bold text-xs">Executive Thought Leadership</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Authentic founder stories, lessons, and insights
                  </div>
                </div>
              )}
            </div>

            {/* Post Focus Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Post Focus & Angle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPostFocus('personal_only')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    postFocus === 'personal_only'
                      ? 'border-[#7C3AED] bg-purple-50/70 text-[#7C3AED] shadow-sm ring-1 ring-[#7C3AED]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Personal Branding Only
                </button>
                <button
                  type="button"
                  onClick={() => setPostFocus('with_brand')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    postFocus === 'with_brand'
                      ? 'border-[#7C3AED] bg-purple-50/70 text-[#7C3AED] shadow-sm ring-1 ring-[#7C3AED]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Include Brand / Product
                </button>
              </div>
            </div>

            {/* Brand Selector (Only when 'with_brand' is selected) */}
            {postFocus === 'with_brand' && profile?.includeBrands && profile.brands && profile.brands.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Target Brand to Include
                </label>
                <select
                  value={selectedBrandIndex}
                  onChange={(e) => setSelectedBrandIndex(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#7C3AED]"
                >
                  {profile.brands.map((b, idx) => (
                    <option key={idx} value={idx}>
                      {b.name} ({b.website || b.url})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Topic / Insight Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Topic / Key Insight / Lesson
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTopics}
                  disabled={isSuggestingTopics}
                  className="py-1 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSuggestingTopics ? 'Suggesting...' : 'Auto-Suggest Topics'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why most B2B SaaS startups waste $50k on ads before finding product-market fit..."
                className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all resize-none"
              />
              {suggestedTopics.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">
                    Suggested Topics for Your Persona (Click to select):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedTopics.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTopic(s);
                          setSuggestedTopics([]);
                        }}
                        className="p-3 bg-purple-50/40 hover:bg-purple-50 border border-purple-200/80 hover:border-[#7C3AED] rounded-xl text-left text-xs text-slate-800 font-medium transition-all cursor-pointer flex items-start justify-between gap-2"
                      >
                        <span>{s}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating post with Founder DNA...</span>
                </>
              ) : (
                <>
                  <span>Generate LinkedIn Post</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Console: Live Preview / Generated Output */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  LinkedIn Post Preview
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5 font-display">
                  {styleFormat === 'broetry' && 'Broetry Format'}
                  {styleFormat === 'guerrilla' && 'Guerrilla Influencer Marketing'}
                  {styleFormat === 'astroturfing' && 'Astroturfing Industry Observation'}
                  {styleFormat === 'fanfiction' && 'Corporate Fanfiction Case Study'}
                  {styleFormat === 'default' && 'Executive Thought Leadership'}
                </h3>
              </div>

              {generatedPost && (
                <button
                  onClick={handleCopyPost}
                  className="py-2 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-800 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Post</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {generatedPost ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed shadow-xs">
                {generatedPost}
              </div>
            ) : (
              <div className="h-72 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-center p-8">
                <PenTool className="w-8 h-8 mb-3 text-slate-300" />
                <span className="text-sm font-semibold">No LinkedIn post generated yet</span>
                <span className="text-xs mt-1">
                  Configure your post type and topic on the left to draft in your calibrated founder voice.
                </span>
              </div>
            )}
          </div>

          {generatedPost && (
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Characters: {generatedPost.length}</span>
              <span>Readability: Executive High Agency</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
