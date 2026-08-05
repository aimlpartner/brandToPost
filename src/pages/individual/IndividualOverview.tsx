import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Megaphone,
  FileText,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';
import { PersonalBrandingProfile } from '../../types';

const LinkedinLogo = ({ className = "h-4 w-4 shrink-0" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  imageUrl?: string;
  headline?: string;
  hashtags?: string[];
  quoteExcerpt?: string;
  imageStyle?: string;
  imagePrompt?: string;
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
          const data = snap.data() as PersonalBrandingProfile;
          setProfile(data);
          if (data.recentPosts && Array.isArray(data.recentPosts) && data.recentPosts.length > 0) {
            setRecentPosts(data.recentPosts);
            localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(data.recentPosts));
          }
        }

        const linkedInSaved = localStorage.getItem(`linkedin_connected_${user.uid}`);
        if (linkedInSaved === 'true') {
          setIsLinkedinConnected(true);
        }

        const savedPosts = localStorage.getItem(`individual_recent_posts_${user.uid}`);
        if (savedPosts && (!recentPosts || recentPosts.length === 0)) {
          setRecentPosts(JSON.parse(savedPosts));
        } else if (!savedPosts && (!recentPosts || recentPosts.length === 0)) {
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

  const handleCopyRecentPost = (e: React.MouseEvent, post: RecentPost) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.content);
    setCopiedRecentId(post.id);
    setTimeout(() => setCopiedRecentId(null), 2000);
  };

  const handleOpenRecentPost = (post: RecentPost) => {
    navigate('/individual/creator', { state: { editPost: post, openModal: true } });
  };

  const handleDeleteRecentPost = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const founderDisplayName = profile?.founderName
    ? profile.founderName.split(' ')[0]
    : user?.displayName
    ? user.displayName.split(' ')[0]
    : 'Founder';

  return (
    <div className="space-y-4 sm:space-y-8 px-4 sm:px-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 font-display">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-slate-600 font-light">
            Welcome to Founder Persona. Turn your Founder Position into Outreach, Signal, and Authority.
          </p>
        </div>

        {/* Persona Selector & Action Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#7C3AED]/15 shadow-sm">
            <span className="text-sm font-medium text-slate-500">Persona:</span>
            <span className="text-sm font-semibold text-slate-800">
              {profile?.founderName || user?.displayName || 'Founder Voice'}
            </span>
          </div>

          <button
            onClick={() => navigate('/individual/creator', { state: { openModal: true } })}
            className="glass-button-primary rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[#7C3AED]/20 transition-all font-display"
          >
            <PenTool className="h-4 w-4" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Arthur / Tror Assistant Welcome Card */}
        <div className="glass-card p-4 sm:p-6 sm:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-white/95 border-[#7C3AED]/15 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,_rgba(124,58,237,0.08)_0%,_transparent_70%)] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle,_rgba(124,58,237,0.06)_0%,_transparent_70%)] rounded-full pointer-events-none" />

          <div className="relative shrink-0 z-10 w-32 h-32 md:w-40 md:h-40 rounded-full border border-[#7C3AED]/15 bg-white flex items-center justify-center p-2 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
            <img
              src="/B2P AVATAR.png"
              alt="Arthur"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>

          <div className="flex-1 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Arthur (Voice DNA) is Online
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">
              Sup, {founderDisplayName}! I'm calibrated to your voice.
            </h2>
            <p className="text-slate-600 font-medium">
              {profile?.founderDescription ||
                "Ready to draft authentic executive posts, hooks, and thought leadership graphics tailored to your industry."}
            </p>
          </div>
        </div>

        {/* Total Posts Stat */}
        <div className="glass-card p-4 sm:p-6 bg-white/95 border-[#7C3AED]/15 hover:border-[#7C3AED]/35 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-sm">
              <PenTool
                className="h-7 w-7 text-white"
                strokeWidth={1.8}
                fill="currentColor"
                fillOpacity={0.16}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Drafted Posts
              </p>
              <p className="text-3xl font-bold text-slate-800 font-display mt-1">
                {recentPosts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Voice Persona Calibration Stat */}
        <div className="glass-card p-4 sm:p-6 bg-white/95 border-[#7C3AED]/15 hover:border-[#7C3AED]/35 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-sm">
              <Volume2
                className="h-7 w-7 text-white"
                strokeWidth={1.8}
                fill="currentColor"
                fillOpacity={0.16}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Voice Calibration
              </p>
              <p className="text-3xl font-bold text-slate-800 font-display mt-1">
                {profile?.voiceDna?.communicationStyle?.length || 4} Traits
              </p>
            </div>
          </div>
        </div>

        {/* Active Brands Stat */}
        <div className="glass-card p-4 sm:p-6 bg-white/95 border-[#7C3AED]/15 hover:border-[#7C3AED]/35 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-sm">
              <Globe
                className="h-7 w-7 text-white"
                strokeWidth={1.8}
                fill="currentColor"
                fillOpacity={0.16}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Connected Brands
              </p>
              <p className="text-3xl font-bold text-slate-800 font-display mt-1">
                {profile?.brands?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* POST Framework Card */}
        <div className="glass-card p-4 sm:p-6 col-span-full bg-white/80 border-[#7C3AED]/10 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 font-display">
            The POST Framework (Founder Edition)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold text-[#7C3AED] mb-1">
                P — Position
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unique founder voice, decision heuristics & earned secrets.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">
                O — Outreach
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tailored executive hooks & multi-format LinkedIn copywriting.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#FF7778] mb-1">
                S — Signal
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-contrast branded quote cards and visual infographics.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#10B981] mb-1">
                T — Traction
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Executive authority, audience engagement, and inbound leads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Founder Posts Panel */}
      <div className="glass-panel overflow-hidden bg-white border-[#7C3AED]/15 shadow-sm rounded-2xl">
        <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-semibold leading-6 text-slate-800 flex items-center gap-2 font-display">
            <Sparkles
              className="h-5 w-5 text-[#7C3AED]"
              strokeWidth={1.8}
              fill="currentColor"
              fillOpacity={0.16}
            />
            Recent Founder Posts
          </h3>
          <button
            onClick={() => navigate('/individual/creator', { state: { openModal: true } })}
            className="text-sm font-medium text-[#7C3AED] hover:text-[#7C3AED]/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Create / View all <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentPosts.length === 0 ? (
            <div className="px-8 py-20 text-center flex flex-col items-center">
              <img
                src="/B2P AVATAR.png"
                alt="Arthur"
                className="h-44 w-auto mb-6 drop-shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              />
              <h3 className="text-xl font-bold text-slate-800 font-display">
                No posts created yet
              </h3>
              <p className="mt-2 text-slate-500 max-w-md">
                Arthur is calibrated to your voice and ready to draft your first LinkedIn thought leadership post!
              </p>
              <div className="mt-8">
                <button
                  onClick={() => navigate('/individual/creator', { state: { openModal: true } })}
                  className="glass-button-primary rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center justify-center font-bold cursor-pointer"
                >
                  Draft First Post
                </button>
              </div>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handleOpenRecentPost(post)}
                className="block px-8 py-6 hover:bg-[#7C3AED]/5 transition-all duration-300 group cursor-pointer border-l-2 border-transparent hover:border-[#7C3AED]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <p className="text-base font-semibold text-slate-800 group-hover:text-[#7C3AED] transition-colors truncate">
                        {post.topic}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase">
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
                    <p className="text-sm text-slate-500 font-light line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-slate-400 font-medium">
                      {post.createdAt}
                    </span>

                    <button
                      onClick={(e) => handleCopyRecentPost(e, post)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Copy Post Content"
                    >
                      {copiedRecentId === post.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDeleteRecentPost(e, post.id)}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
