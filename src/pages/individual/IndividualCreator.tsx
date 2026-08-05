import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Loader2,
  PenTool,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Download,
  RefreshCw,
  Image as ImageIcon,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  MoreHorizontal,
  Quote,
  Layers,
  Plus,
  Trash2,
  Search,
  Clock,
  X,
  ChevronRight,
  Eye,
  User,
  Building2,
} from 'lucide-react';
import { playSuccessChime } from '../../lib/utils';
import { PersonalBrandingProfile } from '../../types';
import { RecentPost } from './IndividualOverview';

export function IndividualCreator() {
  const { user } = useAuth();
  const location = useLocation();

  const [profile, setProfile] = useState<PersonalBrandingProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Post List & Selected State
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Form State
  const [postKind, setPostKind] = useState<'personal' | 'promotional'>('personal');
  const [styleFormat, setStyleFormat] = useState<
    'default' | 'broetry' | 'guerrilla' | 'astroturfing' | 'fanfiction'
  >('default');
  const [topic, setTopic] = useState('');
  const [selectedBrandIndex, setSelectedBrandIndex] = useState<number>(0);
  const [postFocus, setPostFocus] = useState<'personal_only' | 'with_brand'>('with_brand');
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [includeImage, setIncludeImage] = useState(true);
  const [imageStyle, setImageStyle] = useState<'content_visual' | 'quote' | 'diagram'>('content_visual');
  const [quoteExcerpt, setQuoteExcerpt] = useState<string>('');

  // Generation & Interactive State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active selected post helper
  const activePost = recentPosts.find((p) => p.id === selectedPostId) || recentPosts[0] || null;

  // Load Profile & Posts from Firestore & localStorage
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoadingProfile(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
        const snap = await getDoc(docRef);
        let profileData: PersonalBrandingProfile | null = null;
        if (snap.exists()) {
          profileData = snap.data() as PersonalBrandingProfile;
          setProfile(profileData);
          if (profileData.includeBrands && profileData.brandType === 'promotional') {
            setPostKind('promotional');
            setStyleFormat('guerrilla');
          } else {
            setPostKind('personal');
            setStyleFormat('default');
          }
        }

        // Load saved posts from Firestore or LocalStorage
        let postsList: RecentPost[] = [];
        if (profileData && (profileData as any).recentPosts && Array.isArray((profileData as any).recentPosts)) {
          postsList = (profileData as any).recentPosts;
        } else {
          const saved = localStorage.getItem(`individual_recent_posts_${user.uid}`);
          if (saved) {
            try {
              postsList = JSON.parse(saved);
            } catch (e) {
              console.error('Failed to parse saved posts', e);
            }
          }
        }

        // Fallback default posts if none exist
        if (!postsList || postsList.length === 0) {
          postsList = [
            {
              id: 'demo-1',
              topic: 'Why most founders overcomplicate B2B customer acquisition',
              styleFormat: 'default',
              content: `Most B2B founders overcomplicate customer acquisition. They chase complex funnels, fancy attributions, and trendy tactics when 80% of their pipeline comes from simple, high-trust executive conversations.\n\nHere is the exact 3-step heuristic we use to generate consistent pipeline without ad spend:\n\n1. Identify the 20 strategic accounts that actually move the needle.\n2. Craft an earned secret insight tailored to their CFO or VP of Ops.\n3. Follow up with value every 5 business days.\n\nConsistency in execution beats one-off growth hacks every single time.`,
              createdAt: '2 hours ago',
              imageStyle: 'content_visual',
            },
            {
              id: 'demo-2',
              topic: 'The real unit economics behind scaling B2B SaaS teams',
              styleFormat: 'broetry',
              content: `We scaled from $0 to $2M ARR with just 4 full-time operators.\n\nNo SDR armies.\nNo bloated management layers.\nNo vanity headcounts.\n\nJust ruthless focus on leverage, high-impact workflows, and AI automation.\n\nIf your team is growing faster than your revenue per head, you aren't scaling—you're just swelling.`,
              createdAt: 'Yesterday',
              imageStyle: 'quote',
              quoteExcerpt: "If your team is growing faster than revenue per head, you aren't scaling—you're just swelling.",
            },
          ];
          localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(postsList));
        }

        setRecentPosts(postsList);

        // Check if editing a post passed via navigation state
        if (location.state?.editPost) {
          const editPost = location.state.editPost as RecentPost;
          const found = postsList.find((p) => p.id === editPost.id);
          if (found) {
            setSelectedPostId(found.id);
          } else {
            const updated = [editPost, ...postsList];
            setRecentPosts(updated);
            setSelectedPostId(editPost.id);
          }
        } else if (location.state?.openModal) {
          setIsModalOpen(true);
          if (postsList.length > 0) setSelectedPostId(postsList[0].id);
        } else if (postsList.length > 0) {
          setSelectedPostId(postsList[0].id);
        }
      } catch (err) {
        console.error('Error loading profile in creator:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadData();
  }, [user, location.state]);

  const savePostsState = async (updatedPosts: RecentPost[]) => {
    setRecentPosts(updatedPosts);
    if (user?.uid) {
      localStorage.setItem(`individual_recent_posts_${user.uid}`, JSON.stringify(updatedPosts));
      try {
        // Deep clone & strip any undefined properties and ensure oversized legacy base64 strings never exceed Firestore 1MB document limit
        const sanitized = JSON.parse(JSON.stringify(updatedPosts)).map((p: any) => {
          if (p.imageUrl && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 5000) {
            return { ...p, imageUrl: '' };
          }
          return p;
        });
        const docRef = doc(db, 'users', user.uid, 'personalBranding', 'profile');
        await setDoc(docRef, { recentPosts: sanitized }, { merge: true });
      } catch (e) {
        console.error('Failed to sync recentPosts to Firestore', e);
      }
    }
  };

  const handleSuggestTopics = async () => {
    if (!user) return;
    setIsSuggestingTopics(true);
    setSuggestedTopics([]);
    try {
      const selectedBrand =
        postFocus === 'with_brand' && profile?.brands && profile.brands[selectedBrandIndex]
          ? profile.brands[selectedBrandIndex]
          : undefined;

      const token = user ? await user.getIdToken().catch(() => '') : '';

      const res = await fetch('/api/personal-branding/suggest-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    setFormError(null);

    try {
      const activeBrand =
        postFocus === 'with_brand' && profile?.brands && profile.brands[selectedBrandIndex]
          ? profile.brands[selectedBrandIndex]
          : undefined;

      const effectiveKind = postFocus === 'personal_only' ? 'personal' : 'branded';
      const effectiveFormat = postFocus === 'personal_only' ? 'default' : styleFormat;
      const token = user ? await user.getIdToken().catch(() => '') : '';

      console.log('[IndividualCreator] 🚀 Sending post generation request:', {
        topic: topic.trim(),
        postKind: effectiveKind,
        styleFormat: effectiveFormat,
        imageStyle,
        quoteText: quoteExcerpt.trim() || undefined,
      });

      const response = await fetch('/api/personal-branding/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user?.uid,
          topic: topic.trim(),
          postKind: effectiveKind,
          styleFormat: effectiveFormat,
          selectedBrand: activeBrand,
          profileOverride: profile,
          generateImage: true,
          imageStyle,
          quoteText: quoteExcerpt.trim() || undefined,
        }),
      });

      const data = await response.json();
      console.log('[IndividualCreator] 📥 Post generation server response:', {
        ok: response.ok,
        status: response.status,
        hasContent: !!data.content,
        hasImageUrl: !!data.imageUrl,
        imageUrlType: data.imageUrl ? (data.imageUrl.startsWith('data:') ? 'Base64 Data URI' : data.imageUrl) : 'None',
      });
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to generate post');

      const newPostId = `post-${Date.now()}`;
      const newPost: RecentPost = {
        id: newPostId,
        topic: topic.trim(),
        styleFormat: effectiveFormat,
        content: data.content || '',
        imageUrl: data.imageUrl || '',
        headline: data.headline || '',
        quoteExcerpt: data.quoteExcerpt || quoteExcerpt.trim() || '',
        imageStyle,
        imagePrompt: data.imagePrompt || '',
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        createdAt: 'Just now',
        brandName: activeBrand?.name || '',
      };

      const updatedPosts = [newPost, ...recentPosts.filter((p) => p.id !== newPostId).slice(0, 29)];
      await savePostsState(updatedPosts);
      setSelectedPostId(newPostId);
      playSuccessChime();

      // Close modal and reset topic suggestions
      setIsModalOpen(false);
      setSuggestedTopics([]);
    } catch (err: any) {
      console.error('[IndividualCreator] ❌ Error generating post:', err);
      setFormError(err.message || 'Something went wrong while drafting your post.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImageForActivePost = async (overrideStyle?: 'content_visual' | 'quote' | 'diagram') => {
    if (!user || !activePost) return;
    const targetStyle = overrideStyle || activePost.imageStyle || 'content_visual';
    setIsGeneratingImage(true);

    try {
      console.log(`[IndividualCreator] 🎨 Regenerating image for post (${targetStyle})...`);
      const activeBrand =
        profile?.brands && profile.brands.find((b) => b.name === activePost.brandName);

      const token = user ? await user.getIdToken().catch(() => '') : '';
      const response = await fetch('/api/personal-branding/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: activePost.imagePrompt || activePost.topic || activePost.headline || 'Executive Thought Leadership Strategy',
          headline: activePost.headline || activePost.topic.slice(0, 60),
          subtext: activeBrand?.name || profile?.founderName || 'Executive Perspective',
          quoteText: activePost.quoteExcerpt || activePost.headline || activePost.topic,
          imageStyle: targetStyle,
          brandColors: activeBrand?.brandColors || ['#08080C', '#FAF9F6', '#7C3AED'],
          logoUrl: activeBrand?.logoUrl || profile?.logoUrl || profile?.avatarUrl,
          brandName: activeBrand?.name || profile?.founderName,
        }),
      });

      const data = await response.json();
      console.log('[IndividualCreator] 📥 Image regeneration response:', {
        ok: response.ok,
        status: response.status,
        hasImageUrl: !!data.imageUrl,
        imageUrlType: data.imageUrl ? (data.imageUrl.startsWith('data:') ? 'Base64 Data URI' : data.imageUrl) : 'None',
      });
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to regenerate image');

      if (data.imageUrl) {
        const updatedPosts = recentPosts.map((p) =>
          p.id === activePost.id
            ? { ...p, imageUrl: data.imageUrl, imageStyle: targetStyle }
            : p
        );
        await savePostsState(updatedPosts);
        playSuccessChime();
      }
    } catch (err: any) {
      console.error('[IndividualCreator] ❌ Error regenerating image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!activePost?.imageUrl) return;
    const a = document.createElement('a');
    a.href = activePost.imageUrl;
    a.download = `linkedin_post_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPost = (postContent: string, id?: string) => {
    if (!postContent) return;
    navigator.clipboard.writeText(postContent);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
    }
  };

  const handleDeletePost = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = recentPosts.filter((p) => p.id !== id);
    await savePostsState(updated);
    if (selectedPostId === id) {
      setSelectedPostId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleOpenEditModalForPost = (post: RecentPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTopic(post.topic);
    if (post.styleFormat) setStyleFormat(post.styleFormat as any);
    if (post.quoteExcerpt) setQuoteExcerpt(post.quoteExcerpt);
    if (post.imageStyle) setImageStyle(post.imageStyle as any);
    setIsModalOpen(true);
  };

  if (isLoadingProfile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
        <span className="text-xs font-semibold">Loading LinkedIn Post Creator...</span>
      </div>
    );
  }

  const founderDisplayName = profile?.founderName || user?.displayName || 'Founder';
  const founderHeadline =
    profile?.voiceDna?.personaName ||
    profile?.tagline ||
    (profile?.voiceDna?.targetIndustry ? `Founder & Executive • ${profile.voiceDna.targetIndustry}` : 'Founder & Executive Leader');

  const filteredPosts = recentPosts.filter(
    (p) =>
      p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLinkedInLong =
    activePost &&
    (activePost.content.length > 220 ||
      activePost.content.split('\n').length > 3 ||
      activePost.content.trim().split(/\s+/).length > 35);

  return (
    <div className="space-y-6">
      {/* Top Banner Header with Primary Action Button */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-200">
              Personal Branding Ghostwriter
            </span>
            <span className="text-xs text-slate-400 font-medium">• {recentPosts.length} Posts Saved</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1.5 font-display">
            LinkedIn Post Creator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Draft high-agency executive LinkedIn posts calibrated strictly to your founder voice and generate matching editorial visuals.
          </p>
        </div>

        {/* Modal Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="py-3 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0 hover:shadow-md active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>Generate New Post</span>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left = Previous Posts List, Right = Live LinkedIn Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 text-left items-start">
        {/* Left Console: Previous & Saved Posts History */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Previous LinkedIn Posts
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {recentPosts.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Draft</span>
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by topic, insight, brand..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none transition-all"
            />
          </div>

          {/* Posts List */}
          {filteredPosts.length > 0 ? (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => {
                const isSelected = activePost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#7C3AED] bg-purple-50/40 shadow-xs ring-1 ring-[#7C3AED]'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 uppercase">
                            {post.styleFormat === 'broetry'
                              ? 'Broetry'
                              : post.styleFormat === 'guerrilla'
                              ? 'Guerrilla'
                              : post.styleFormat === 'astroturfing'
                              ? 'Astroturfing'
                              : post.styleFormat === 'fanfiction'
                              ? 'Fanfiction'
                              : 'Thought Leadership'}
                          </span>
                          {post.brandName && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-200 truncate max-w-[120px]">
                              {post.brandName}
                            </span>
                          )}
                          {post.imageUrl && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-0.5">
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>Visual</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                          {post.topic}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#7C3AED] translate-x-0.5' : 'text-slate-300'}`} />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>{post.createdAt}</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleCopyPost(post.content, post.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Copy text"
                        >
                          {copiedId === post.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModalForPost(post, e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Re-generate / Edit in Modal"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
              <PenTool className="w-6 h-6 text-slate-300" />
              <span className="text-xs font-semibold text-slate-600">No previous posts found</span>
              <span className="text-[11px] text-slate-400 max-w-xs">
                {searchQuery ? 'Try adjusting your search terms.' : 'Generate your first post to start building your personal branding library.'}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-2 py-1.5 px-3 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
              >
                + Create Post
              </button>
            </div>
          )}
        </div>

        {/* Right Console: Live Realistic LinkedIn Feed Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Live LinkedIn Feed Preview
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 font-display">
                  {activePost ? activePost.topic : 'Feed Preview'}
                </h3>
              </div>

              {activePost && (
                <div className="flex items-center gap-2">
                  {activePost.imageUrl && (
                    <button
                      onClick={handleDownloadImage}
                      title="Download Graphic"
                      className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-slate-800 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Image</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyPost(activePost.content)}
                    className="py-1.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-800 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPreview ? (
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
                  <button
                    onClick={() => handleOpenEditModalForPost(activePost)}
                    className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit / Variations</span>
                  </button>
                </div>
              )}
            </div>

            {/* Realistic LinkedIn Feed Post Preview Card */}
            {activePost ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs max-w-xl mx-auto font-sans text-left">
                {/* LinkedIn Author Header */}
                <div className="flex p-4 pb-3">
                  <div className="mr-3 shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 text-[#7C3AED] font-bold overflow-hidden border border-slate-200 shadow-2xs">
                      {profile?.logoUrl || profile?.avatarUrl ? (
                        <img
                          src={profile.logoUrl || profile.avatarUrl || ''}
                          alt={founderDisplayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-[#7C3AED] font-extrabold text-lg">
                          {founderDisplayName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-900 text-sm hover:text-[#0A66C2] hover:underline truncate">
                            {founderDisplayName}
                          </span>
                          <span className="text-slate-400 font-normal text-xs shrink-0">· 1st</span>
                        </div>
                        <span
                          className="text-xs text-slate-500 font-normal truncate max-w-[360px] block leading-tight mt-0.5"
                          title={founderHeadline}
                        >
                          {founderHeadline}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                          <span>{activePost.createdAt}</span>
                          <span>·</span>
                          <span>🌐</span>
                        </span>
                      </div>
                      <MoreHorizontal className="h-5 w-5 text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* LinkedIn Post Copy */}
                <div className="px-4 py-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  <div className={!isExpanded && isLinkedInLong ? 'line-clamp-4' : ''}>
                    {activePost.content}
                  </div>
                  {!isExpanded && isLinkedInLong && (
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="text-slate-500 hover:text-[#0A66C2] hover:underline text-xs font-semibold mt-1 block cursor-pointer"
                    >
                      ...see more
                    </button>
                  )}
                  {isExpanded && isLinkedInLong && (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-slate-500 hover:text-[#0A66C2] hover:underline text-xs font-semibold mt-1 block cursor-pointer"
                    >
                      see less
                    </button>
                  )}
                </div>

                {/* Post Visual Media Attachment */}
                {isGeneratingImage ? (
                  <div className="bg-slate-900 w-full aspect-square flex flex-col items-center justify-center p-8 text-center gap-3 border-y border-slate-200">
                    <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                    <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                      Rendering editorial visual with gpt-image-2...
                    </span>
                    <span className="text-[11px] text-slate-500 max-w-xs">
                      Formatting typography, brand colors, and negative space hierarchy.
                    </span>
                  </div>
                ) : activePost.imageUrl ? (
                  <div className="relative group bg-slate-900 border-y border-slate-200">
                    <img
                      src={activePost.imageUrl}
                      alt="LinkedIn Post Visual"
                      className="w-full h-auto aspect-square object-contain mx-auto"
                    />

                    {/* Image Style Badge */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-md">
                      {activePost.imageStyle === 'quote' && (
                        <>
                          <Quote className="w-3 h-3 text-[#A78BFA]" />
                          <span>Quote Card</span>
                        </>
                      )}
                      {activePost.imageStyle === 'diagram' && (
                        <>
                          <Layers className="w-3 h-3 text-[#A78BFA]" />
                          <span>Diagram / Map</span>
                        </>
                      )}
                      {(!activePost.imageStyle || activePost.imageStyle === 'content_visual') && (
                        <>
                          <ImageIcon className="w-3 h-3 text-[#A78BFA]" />
                          <span>Content Visual</span>
                        </>
                      )}
                    </div>

                    {/* Floating Hover Controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {activePost.imageStyle !== 'quote' && (
                        <button
                          type="button"
                          onClick={() => handleRegenerateImageForActivePost('quote')}
                          disabled={isGeneratingImage}
                          title="Generate as Quote Card"
                          className="bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-1 shadow-xl cursor-pointer"
                        >
                          <Quote className="w-3 h-3 text-purple-300" />
                          <span>As Quote</span>
                        </button>
                      )}
                      {activePost.imageStyle !== 'content_visual' && (
                        <button
                          type="button"
                          onClick={() => handleRegenerateImageForActivePost('content_visual')}
                          disabled={isGeneratingImage}
                          title="Generate as Content Visual Scene"
                          className="bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-1 shadow-xl cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3 text-purple-300" />
                          <span>As Visual</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRegenerateImageForActivePost()}
                        disabled={isGeneratingImage}
                        title="Regenerate Visual Graphic"
                        className="bg-black/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-xl cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadImage}
                        title="Download Image"
                        className="bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 flex items-center shadow-xl cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* LinkedIn Engagement & Reaction Counts */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="bg-[#0A66C2] rounded-full w-4 h-4 flex items-center justify-center text-white">
                      <ThumbsUp className="h-2.5 w-2.5" />
                    </div>
                    <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">
                      You and 94 others
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">
                      14 comments
                    </span>
                    <span>•</span>
                    <span className="hover:text-[#0A66C2] hover:underline cursor-pointer">
                      3 reposts
                    </span>
                  </div>
                </div>

                {/* LinkedIn Action Bar (Like, Comment, Repost, Send) */}
                <div className="px-2 py-1 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-2.5 rounded-lg flex-1 justify-center transition-colors cursor-pointer">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Like</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-2.5 rounded-lg flex-1 justify-center transition-colors cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-2.5 rounded-lg flex-1 justify-center transition-colors cursor-pointer">
                    <Repeat2 className="h-4 w-4" />
                    <span>Repost</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-2.5 rounded-lg flex-1 justify-center transition-colors cursor-pointer">
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-80 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-3">
                <PenTool className="w-8 h-8 text-slate-300" />
                <span className="text-sm font-semibold text-slate-600">No post selected</span>
                <span className="text-xs max-w-sm">
                  Select a previous post on the left or click Generate New Post above to draft a post in your calibrated voice.
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 py-2 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate New Post</span>
                </button>
              </div>
            )}
          </div>

          {activePost && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span>Characters: {activePost.content.length}</span>
              <span>Reading time: ~{Math.max(1, Math.round(activePost.content.split(/\s+/).length / 200))} min</span>
              <span>Readability: Executive High Agency</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Post Generating Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-5xl w-full p-6 sm:p-7 text-left relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Generate LinkedIn Post
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calibrated to founder voice heuristics & generating matching content visual with gpt-image-2.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isGenerating && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleGeneratePost} className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left Column: Focus, Brand & Format */}
                <div className="md:col-span-5 space-y-4">
                  {/* Step 1: Post Focus */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      1. Post Focus
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPostFocus('personal_only')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                          postFocus === 'personal_only'
                            ? 'border-[#7C3AED] bg-purple-50/80 shadow-xs ring-1 ring-[#7C3AED]'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <User className={`w-4 h-4 ${postFocus === 'personal_only' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                          {postFocus === 'personal_only' && <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${postFocus === 'personal_only' ? 'text-[#7C3AED]' : 'text-slate-800'}`}>
                            Personal Brand
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            Thought leadership & founder journey
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPostFocus('with_brand')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                          postFocus === 'with_brand'
                            ? 'border-[#7C3AED] bg-purple-50/80 shadow-xs ring-1 ring-[#7C3AED]'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Building2 className={`w-4 h-4 ${postFocus === 'with_brand' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                          {postFocus === 'with_brand' && <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${postFocus === 'with_brand' ? 'text-[#7C3AED]' : 'text-slate-800'}`}>
                            Include Brand
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            Product angles & case studies
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Conditional Brand & Format Selection */}
                  {postFocus === 'with_brand' ? (
                    <div className="space-y-3.5 pt-2 border-t border-slate-100">
                      {/* Choose Brand */}
                      {profile?.brands && profile.brands.length > 0 ? (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            2. Target Brand
                          </label>
                          <select
                            value={selectedBrandIndex}
                            onChange={(e) => setSelectedBrandIndex(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#7C3AED]"
                          >
                            {profile.brands.map((b, idx) => (
                              <option key={idx} value={idx}>
                                {b.name} ({b.website || b.url})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-800">
                          No linked brand websites detected in profile. Post will weave in your general company value proposition.
                        </div>
                      )}

                      {/* Post Format & Angle */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          3. Post Format & Promotional Angle
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            {
                              id: 'guerrilla',
                              title: 'Guerrilla Influencer',
                              desc: 'Casual personal workflow hack',
                            },
                            {
                              id: 'broetry',
                              title: 'LinkedIn Broetry',
                              desc: 'Punchy 1-line story hook & twist',
                            },
                            {
                              id: 'astroturfing',
                              title: 'Astroturfing Trend',
                              desc: 'Industry shift & category wave',
                            },
                            {
                              id: 'fanfiction',
                              title: 'Corporate Fanfiction',
                              desc: 'High-stakes executive case study',
                            },
                          ].map((f) => (
                            <div
                              key={f.id}
                              onClick={() => setStyleFormat(f.id as any)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                                styleFormat === f.id
                                  ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-slate-900 shadow-xs ring-1 ring-[#7C3AED]'
                                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="font-bold text-xs">{f.title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>Executive Thought Leadership</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Authentic founder stories, leadership heuristics, and decision frameworks calibrated to your synthesized Voice DNA.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Topic Input & Visual Settings */}
                <div className="md:col-span-7 space-y-4">
                  {/* Topic Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Topic / Key Insight / Lesson
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestTopics}
                        disabled={isSuggestingTopics}
                        className="py-1 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isSuggestingTopics ? 'Suggesting...' : 'Auto-Suggest Topics'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Why most B2B SaaS startups waste $50k on ads before finding product-market fit..."
                      className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none transition-all resize-none leading-relaxed"
                    />

                    {suggestedTopics.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                          Click to select suggested topic:
                        </span>
                        <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto">
                          {suggestedTopics.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setTopic(s);
                                setSuggestedTopics([]);
                              }}
                              className="p-2 bg-purple-50/40 hover:bg-purple-50 border border-purple-200/80 hover:border-[#7C3AED] rounded-lg text-left text-xs text-slate-800 font-medium transition-all cursor-pointer flex items-center justify-between gap-2"
                            >
                              <span className="line-clamp-1">{s}</span>
                              <ArrowRight className="w-3 h-3 text-[#7C3AED] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Post Graphic Style Selection (Always Generated with gpt-image-2) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <ImageIcon className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>Post Graphic Style</span>
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                        Generated with gpt-image-2
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setImageStyle('content_visual')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                          imageStyle === 'content_visual'
                            ? 'border-[#7C3AED] bg-purple-50/80 shadow-xs ring-1 ring-[#7C3AED]'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <ImageIcon className={`w-4 h-4 ${imageStyle === 'content_visual' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                          {imageStyle === 'content_visual' && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${imageStyle === 'content_visual' ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                            Visual Scene
                          </div>
                          <div className="text-[9px] text-slate-500 leading-tight">
                            AI photography & scene metaphor from content
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImageStyle('quote')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                          imageStyle === 'quote'
                            ? 'border-[#7C3AED] bg-purple-50/80 shadow-xs ring-1 ring-[#7C3AED]'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Quote className={`w-4 h-4 ${imageStyle === 'quote' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                          {imageStyle === 'quote' && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${imageStyle === 'quote' ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                            Founder Quote
                          </div>
                          <div className="text-[9px] text-slate-500 leading-tight">
                            Editorial typography quote card & attribution
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImageStyle('diagram')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                          imageStyle === 'diagram'
                            ? 'border-[#7C3AED] bg-purple-50/80 shadow-xs ring-1 ring-[#7C3AED]'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Layers className={`w-4 h-4 ${imageStyle === 'diagram' ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                          {imageStyle === 'diagram' && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${imageStyle === 'diagram' ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                            Diagram / Map
                          </div>
                          <div className="text-[9px] text-slate-500 leading-tight">
                            Architectural concept & strategy diagram
                          </div>
                        </div>
                      </button>
                    </div>

                    {imageStyle === 'quote' && (
                      <div className="mt-2 space-y-1 bg-purple-50/40 p-2.5 rounded-xl border border-purple-200/60">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Custom Quote Excerpt <span className="font-normal text-slate-400">(Optional — auto-extracted if left blank)</span>
                        </label>
                        <input
                          type="text"
                          value={quoteExcerpt}
                          onChange={(e) => setQuoteExcerpt(e.target.value)}
                          placeholder="e.g. In B2B, distribution will always eat superior features for breakfast."
                          className="w-full bg-white border border-slate-300 focus:border-[#7C3AED] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3.5 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="py-2.5 px-6 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Post & Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Post & Image (GPT Image 2)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
