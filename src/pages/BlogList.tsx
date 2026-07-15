import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { Blog } from '../types';

export function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const qBlogs = query(
          collection(db, 'blogs'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(qBlogs);
        const list: Blog[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Blog);
        });
        setBlogs(list);
      } catch (err) {
        console.error("Failed to retrieve blogs collection: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog => {
    const titleMatch = blog.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const summaryMatch = blog.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const tagsMatch = blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return titleMatch || summaryMatch || tagsMatch;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">
      {/* Editorial Header */}
      <header className="border-b border-slate-900/10 bg-[#08080C] text-white py-16 px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link to="/" className="text-xs font-semibold tracking-wider text-slate-400 hover:text-white transition-colors">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight font-display mt-2">
            Insights &amp; <span className="text-[#C084FC] italic font-serif">Perspectives</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto font-light font-sans">
            Founder metrics, automated distribution strategies, and real-world GTM heuristics compiled by the BrandToPost team.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Filter bar */}
        <div className="flex justify-between items-center border-b border-slate-900/10 pb-6 mb-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, topic, or tags..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {filteredBlogs.length} Articles
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-mono">Retrieving archives...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-900/10 rounded-xl p-8">
            <p className="text-sm text-slate-500">No matching articles found.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredBlogs.map((blog) => (
              <article 
                key={blog.id} 
                className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 border-b border-slate-900/10 pb-12 last:border-b-0"
              >
                {/* Visual Thumbnail */}
                <div className="md:col-span-4 rounded-xl overflow-hidden bg-slate-100 aspect-video md:aspect-[4/3] border border-slate-900/10">
                  {blog.imageUrl ? (
                    <img 
                      src={blog.imageUrl} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-105">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Metadata & Copy Content */}
                <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>&bull;</span>
                      <span className="text-[#7C3AED] font-semibold">{blog.targetAudience || 'General'}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 group-hover:text-[#7C3AED] transition-colors font-display">
                      <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h2>

                    <p className="text-slate-650 font-light leading-relaxed text-sm md:text-base line-clamp-3">
                      {blog.summary || "Read the latest update and heuristics from the BrandToPost team."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-2">
                      {blog.tags?.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-sans border border-slate-900/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <Link 
                      to={`/blog/${blog.slug}`} 
                      className="text-xs font-semibold text-slate-800 group-hover:text-[#7C3AED] transition-colors flex items-center gap-1"
                    >
                      Read Article 
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
