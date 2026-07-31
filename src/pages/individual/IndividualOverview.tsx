import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Loader2,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Globe,
  Briefcase,
  Copy,
  PenTool,
  Trash2,
  Check,
  Sparkles,
  Clock
} from 'lucide-react';
import { PersonalBrandingProfile } from '../../types';

const LinkedinLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.7 19H4.9V10H7.7V19ZM6.3 8.8C5.4 8.8 4.7 8.1 4.7 7.2C4.7 6.3 5.4 5.6 6.3 5.6C7.2 5.6 7.9 6.3 7.9 7.2C7.9 8.1 7.2 8.8 6.3 8.8ZM19 19H16.2V14.6C16.2 13.5 16.2 12.1 14.7 12.1C13.1 12.1 12.9 13.3 12.9 14.5V19H10.1V10H12.8V11.2H12.8C13.2 10.5 14.1 9.8 15.4 9.8C18.2 9.8 18.7 11.6 18.7 14V19H19Z" fill="white" />
  </svg>
);

export interface RecentPost {
  id: string;
  topic: string;
  styleFormat: string;
  content: string;
  createdAt: string;
  brandName?: string;
}

export function IndividualOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PersonalBrandingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [copiedRecentId, setCopiedRecentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfile(snap.data() as PersonalBrandingProfile);
        }

        const linkedInSaved = localStorage.getItem(`linkedin_connected_${user.uid}`);
        if (linkedInSaved === 'true') {
          setIsLinkedinConnected(true);
        }

        const savedPosts = localStorage.getItem(`individual_recent_posts_${user.uid}`);
        if (savedPosts) {
          setRecentPosts(JSON.parse(savedPosts));
        } else {
          const defaultPosts: RecentPost[] = [
            {
              id: 'demo-1',
              topic: 'Why most founders overcomplicate B2B customer acquisition',
              styleFormat: 'default',
              content: `Most B2B founders overcomplicate customer acquisition. They chase complex funnels, fancy attributions, and trendy tactics when 80% of their pipeline comes from simple, high-trust executive conversations.\n\nHere is the exact 3-step heuristic we use to generate consistent pipeline without ad spend:\n\n1. Identify the 20 strategic accounts that actually move the needle.\n2. Craft an earned secret insight tailored to their CFO or VP of Ops.\n3. Follow up with value every 5 business days.\n\nConsistency in execution beats one-off growth hacks every single time.`,
              createdAt: '2 hours ago',
            },
            {
              id: 'demo-2',
              topic: 'The real unit economics behind scaling B2B SaaS teams',
              styleFormat: 'broetry',
              content: `We scaled from $0 to $2M ARR with just 4 full-time operators.\n\nNo SDR armies.\nNo bloated management layers.\nNo vanity headcounts.\n\nJust ruthless focus on leverage, high-impact workflows, and AI automation.\n\nIf your team is growing faster than your revenue per head, you aren't scaling—you're just swelling.`,
              createdAt: 'Yesterday',
            },
          ];
          setRecentPosts(defaultPosts);
          localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(defaultPosts));
        }
      } catch (err) {
        console.error('Error loading overview data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleCopyRecentPost = (post: RecentPost) => {
    navigator.clipboard.writeText(post.content);
    setCopiedRecentId(post.id);
    setTimeout(() => setCopiedRecentId(null), 2000);
  };

  const handleOpenRecentPost = (post: RecentPost) => {
    navigate('/individual/creator', { state: { editPost: post } });
  };

  const handleDeleteRecentPost = (id: string) => {
    const updated = recentPosts.filter((p) => p.id !== id);
    setRecentPosts(updated);
    if (user?.uid) {
      localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(updated));
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <span className="text-xs font-semibold">Loading Personal Branding Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-200">
              Personal Branding Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">• Active Calibrated Ghostwriter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-display">
            Welcome back, {profile?.founderName || user?.displayName || 'Founder'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Your personal branding persona is synthesized and ready to draft LinkedIn thought leadership posts in your authentic founder voice.
          </p>
        </div>

        <button
          onClick={() => navigate('/individual/creator')}
          className="py-3 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <PenTool className="w-4 h-4" />
          <span>Draft LinkedIn Post</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Voice Persona</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">
              {profile?.voiceDna?.personaName || 'Calibrated Founder'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Connected Brands</span>
            <span className="text-base font-bold text-slate-900 block mt-0.5">
              {profile?.brands?.length || 0} Products Active
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] flex items-center justify-center shrink-0">
              <LinkedinLogo />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">LinkedIn Status</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5 flex items-center gap-1.5">
                {isLinkedinConnected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Connected</span>
                  </>
                ) : (
                  <span className="text-slate-500">Not Connected</span>
                )}
              </span>
            </div>
          </div>
          {!isLinkedinConnected && (
            <button
              onClick={() => navigate('/individual/linkedin')}
              className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Persona Info & Brand DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Founder Persona Summary Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Founder Voice Profile
                </h3>
                <span className="text-xs text-slate-500">
                  Synthesized AI heuristics & tone
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/individual/voice')}
              className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              View Full Voice
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Founder Name & Persona
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {profile?.founderName || 'Founder'}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Voice DNA Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                {profile?.founderDescription || 'Executive thought leadership persona calibrated for LinkedIn growth.'}
              </p>
            </div>

            {profile?.voiceDna?.communicationStyle && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Communication Traits
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.voiceDna.communicationStyle.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] border border-purple-200 rounded-lg text-xs font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Connected Brand DNA Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Connected Products & Brands
                </h3>
                <span className="text-xs text-slate-500">
                  {profile?.includeBrands ? 'Enabled in posts' : 'Personal branding only'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/individual/voice')}
              className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              Manage Brands
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Brand Ownership Type
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                {profile?.brandType === 'promotional' ? 'Promotional / Affiliate Brands' : 'Personal / Owned Brands'}
              </span>
            </div>

            {profile?.brands && profile.brands.length > 0 ? (
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Active Brand Scrapes ({profile.brands.length})
                </span>
                {profile.brands.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{b.name}</span>
                      <span className="text-slate-500 truncate block max-w-xs">{b.website || b.url}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Scraped
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500">
                No active brands attached. You are operating in pure Personal Branding mode.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recently Created LinkedIn Posts Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Recently Created LinkedIn Posts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drafts and generated posts saved to your personal branding history.
            </p>
          </div>
          <button
            onClick={() => navigate('/individual/creator')}
            className="py-2 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
        </div>

        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {post.topic}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 uppercase">
                        {post.styleFormat === 'broetry'
                          ? 'Broetry'
                          : post.styleFormat === 'guerrilla'
                          ? 'Guerrilla Marketing'
                          : post.styleFormat === 'astroturfing'
                          ? 'Astroturfing'
                          : post.styleFormat === 'fanfiction'
                          ? 'Fanfiction'
                          : 'Thought Leadership'}
                      </span>
                      {post.brandName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-200">
                          {post.brandName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium block mt-1">
                      {post.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyRecentPost(post)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Copy Post"
                    >
                      {copiedRecentId === post.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenRecentPost(post)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Edit in Creator"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRecentPost(post.id)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">
                  {post.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-44 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-6">
            <Clock className="w-7 h-7 mb-2 text-slate-300" />
            <span className="text-xs font-semibold">No recent LinkedIn posts created yet</span>
            <span className="text-[11px] mt-0.5 text-slate-400">
              Use the Post Creator to draft your first LinkedIn post in your calibrated voice.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
