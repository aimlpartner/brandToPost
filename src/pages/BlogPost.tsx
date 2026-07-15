import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Blog } from '../types';

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const qBlog = query(
          collection(db, 'blogs'),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(qBlog);
        if (snapshot.empty) {
          setError("Article not found.");
          setBlog(null);
        } else {
          const doc = snapshot.docs[0];
          setBlog({ id: doc.id, ...doc.data() } as Blog);
        }
      } catch (err: any) {
        console.error("Error loading blog post: ", err);
        setError("Error fetching blog post content.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug]);

  // Secure and lightweight Markdown-to-HTML parser function
  const parseMarkdown = (md: string): string => {
    if (!md) return '';
    
    // Basic HTML escaping
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-lg font-bold text-slate-800 mt-6 mb-2 font-display">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-8 mb-3 font-display border-b border-slate-900/10 pb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-950 mt-10 mb-4 font-display">$1</h2>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
    
    // Lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-6 list-disc text-slate-650 my-1 font-light">$1</li>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-4 overflow-x-auto">$1</pre>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-[#7C3AED] px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');
    
    // Paragraphs (split by double newlines)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<li') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return `<p class="text-slate-650 font-sans leading-relaxed text-sm md:text-base mb-4 font-light text-left">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');
    
    return html;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#7C3AED] animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-mono">Opening archive...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center text-slate-850">
        <h2 className="text-2xl font-bold font-display text-slate-900 mb-3">{error || "Article not found"}</h2>
        <p className="text-xs text-slate-500 mb-6 font-light max-w-sm">
          The link might be broken, or the article may have been unpublished or removed by administrators.
        </p>
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-5 py-2.5 text-xs font-semibold rounded-lg shadow-sm hover:bg-[#6D28D9] transition-all border-none cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-[#7C3AED]/20 selection:text-[#7C3AED] pb-24">
      {/* Small Navbar */}
      <nav className="border-b border-slate-900/10 bg-[#08080C] text-white py-4 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Articles
          </Link>
          <Link to="/" className="text-xs font-bold font-display tracking-tight text-white">
            BrandToPost
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 mt-12 md:mt-16 text-left">
        {/* Category & Date */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-4">
          <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span>&bull;</span>
          <span className="text-[#7C3AED] font-semibold">{blog.targetAudience || 'Insight'}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 font-display mb-6 leading-tight">
          {blog.title}
        </h1>

        {/* Author / Metadata */}
        <div className="flex items-center gap-3 border-y border-slate-900/10 py-4 mb-8">
          <div className="h-8 w-8 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold text-xs border border-[#7C3AED]/20 select-none">
            {blog.author?.[0]?.toUpperCase() || 'B'}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Written by {blog.author || 'BrandToPost Team'}</div>
            <div className="text-[10px] text-slate-450 font-mono">System Publisher Agent</div>
          </div>
        </div>

        {/* Featured Image */}
        {blog.imageUrl && (
          <div className="rounded-xl overflow-hidden bg-slate-100 mb-8 border border-slate-900/10 aspect-video">
            <img 
              src={blog.imageUrl} 
              alt={blog.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Markdown Content */}
        <article 
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:tracking-tight text-slate-800"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(blog.content) }}
        />

        {/* CTA Block (if defined) */}
        {blog.cta && (
          <div className="mt-12 p-6 md:p-8 bg-white border border-[#7C3AED]/10 rounded-2xl text-left space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-display">Get Started with BrandToPost</h3>
            <p className="text-xs md:text-sm text-slate-650 font-light leading-relaxed">
              Did you find this insight useful? Implement it directly in your own GTM pipeline using the BrandToPost platform.
            </p>
            <div className="pt-2">
              {blog.cta.startsWith('http') ? (
                <a 
                  href={blog.cta} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg shadow-sm transition-all border-none cursor-pointer"
                >
                  Learn More &rarr;
                </a>
              ) : (
                <Link 
                  to="/login?mode=signup" 
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg shadow-sm transition-all border-none cursor-pointer"
                >
                  {blog.cta} &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
