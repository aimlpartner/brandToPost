import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { Blog } from '../types';
import { PublicLayout } from '../components/PublicLayout';

export function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || [])));

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? blog.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <PublicLayout transparentNavbar={false}>
      <div className="bg-[#FAF9F6] min-h-screen py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-8">
          
          {/* LEFT COLUMN: Editorial Sidebar Header (40%) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit space-y-8 text-left">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">Archives & Insights</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight font-display text-slate-900 leading-[1.05]">
                Marketing <br />
                demystified for <br />
                <span className="italic font-serif text-[#7C3AED]">founders.</span>
              </h1>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-md font-light">
                Distribution breakdowns, doppelganger writing heuristics, and growth guidelines written by our team and specialist agents.
              </p>
            </div>

            {/* Filter Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full bg-white border border-slate-900/10 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all font-sans"
              />
            </div>

            {/* Filter Tags */}
            {allTags.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Filter by Topic</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none ${
                      selectedTag === null 
                        ? 'bg-slate-900 text-white font-semibold' 
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    All Topics
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none ${
                        selectedTag === tag 
                          ? 'bg-[#7C3AED] text-white font-semibold' 
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Article Feed (60%) */}
          <div className="lg:col-span-7 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-mono tracking-wider">Laying out content shelves...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-900/10 rounded-2xl p-8">
                <p className="text-sm text-slate-500 font-light">No articles match your query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-900/10">
                {filteredBlogs.map((blog, idx) => (
                  <article 
                    key={blog.id} 
                    className={`group pt-10 pb-10 ${idx === 0 ? 'pt-0' : ''} text-left flex flex-col sm:flex-row justify-between gap-6 sm:gap-10`}
                  >
                    {/* Content Section */}
                    <div className="flex-1 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                          <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>&bull;</span>
                          <span className="text-[#7C3AED] font-semibold tracking-wider uppercase text-[9px]">{blog.targetAudience || 'Heuristics'}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-display group-hover:text-[#7C3AED] transition-colors leading-tight">
                          <Link to={`/blog/${blog.slug}`} className="hover:underline underline-offset-4 decoration-1 decoration-[#7C3AED]/40">
                            {blog.title}
                          </Link>
                        </h2>
                        <p className="text-slate-600 font-light leading-relaxed text-sm line-clamp-3">
                          {blog.summary || "A deep dive into GTM automation insights and campaign distribution guidelines."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {blog.tags?.map(t => (
                            <span 
                              key={t}
                              className="text-[9px] font-mono bg-slate-900/5 text-slate-600 px-1.5 py-0.5 rounded border border-slate-900/5"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                        <Link 
                          to={`/blog/${blog.slug}`} 
                          className="text-xs font-semibold text-slate-800 hover:text-[#7C3AED] flex items-center gap-1 group/btn"
                        >
                          Read 
                          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    {/* Thumbnail Section */}
                    <div className="w-full sm:w-44 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-105 border border-slate-900/10">
                      {blog.imageUrl ? (
                        <img 
                          src={blog.imageUrl} 
                          alt={blog.title} 
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Archive</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
