'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Search, ArrowRight, Clock, User, 
  Calendar, Tag, Sparkles, ChevronRight, MessageSquare,
  ShieldCheck, Laptop, Cpu, Monitor, Wrench, Printer,
  CheckCircle2, Store, HelpCircle, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../data/storeData';
import { DEFAULT_BLOGS, BLOG_CATEGORIES, BlogPostItem } from '../../data/blogData';

export default function BlogListingPage() {
  const { blogPosts: dbBlogPosts, siteSettings } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'quick' | 'title'>('newest');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Merge database blog posts with default rich tech guides, avoiding duplicates by slug
  const allBlogs = useMemo(() => {
    const list: BlogPostItem[] = [];
    const seenSlugs = new Set<string>();

    // 1. Add database blogs first (if any published)
    if (dbBlogPosts && Array.isArray(dbBlogPosts)) {
      dbBlogPosts.forEach((b: any) => {
        if (b && b.slug && !seenSlugs.has(b.slug) && (b.status === 'published' || !b.status)) {
          seenSlugs.add(b.slug);
          list.push({
            id: b.id || b.slug,
            slug: b.slug,
            title: b.title,
            excerpt: b.excerpt || '',
            content: b.content || '',
            coverImage: b.coverImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&auto=format&fit=crop&q=80',
            category: b.category || 'Technology',
            author: b.author || 'Lapiez Team',
            readTime: b.readTime || '5 min read',
            tags: b.tags || 'tech,hardware',
            status: 'published',
            createdAt: b.createdAt || new Date().toISOString(),
            featured: b.featured || false
          });
        }
      });
    }

    // 2. Add rich default blogs for any slugs not yet represented
    DEFAULT_BLOGS.forEach((d) => {
      if (!seenSlugs.has(d.slug)) {
        seenSlugs.add(d.slug);
        list.push(d);
      }
    });

    return list;
  }, [dbBlogPosts]);

  // Dynamic Category List with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allBlogs.length };
    BLOG_CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = allBlogs.filter((b) => b.category === cat).length;
      }
    });
    return BLOG_CATEGORIES.map((cat) => ({
      name: cat,
      count: counts[cat] || allBlogs.filter((b) => b.category.toLowerCase().includes(cat.toLowerCase())).length
    }));
  }, [allBlogs]);

  // Featured Hero Story
  const featuredArticle = useMemo(() => {
    return allBlogs.find((b) => b.featured) || allBlogs[0];
  }, [allBlogs]);

  // Filter and Sort
  const filteredBlogs = useMemo(() => {
    return allBlogs
      .filter((b) => {
        if (selectedCategory !== 'All' && b.category !== selectedCategory) {
          // Check substring match as fallback
          if (!b.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = b.title.toLowerCase().includes(q);
          const matchesExcerpt = b.excerpt.toLowerCase().includes(q);
          const matchesTags = (b.tags || '').toLowerCase().includes(q);
          const matchesAuthor = (b.author || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesExcerpt && !matchesTags && !matchesAuthor) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'quick') {
          const parseTime = (s: string) => parseInt(s) || 5;
          return parseTime(a.readTime) - parseTime(b.readTime);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [allBlogs, selectedCategory, searchQuery, sortBy]);

  const whatsappPhone = getCleanWhatsAppNumber(siteSettings?.whatsapp);

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('buying') || c.includes('laptop')) return Laptop;
    if (c.includes('security') || c.includes('cctv')) return ShieldCheck;
    if (c.includes('display') || c.includes('monitor')) return Monitor;
    if (c.includes('upgrade') || c.includes('ssd')) return Cpu;
    if (c.includes('maintenance') || c.includes('care') || c.includes('battery')) return Wrench;
    if (c.includes('printer')) return Printer;
    return BookOpen;
  };

  const getCategoryColor = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('buying')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c.includes('security') || c.includes('cctv')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (c.includes('display')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (c.includes('upgrade') || c.includes('ssd')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (c.includes('maintenance')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (c.includes('printer')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Garhwa Technical FAQs
  const blogFaqs = [
    {
      q: 'How does Lapiez perform the 28-point testing check on refurbished laptops?',
      a: 'Every machine runs through battery cycle benchmarking, full screen dead-pixel verification, copper heatsink thermal paste reapplication, keyboard and trackpad responsiveness testing, and 100% SSD health testing on our physical Chiniya Road showroom testing bench.'
    },
    {
      q: 'Can I get my old laptop upgraded with an NVMe SSD on the same day in Garhwa?',
      a: 'Yes! Bring your laptop to our showroom opposite G P Plaza. Our technicians clone your existing Windows, apps, and data onto a brand-new Crucial or Kingston SSD in approximately 30 minutes with zero data loss.'
    },
    {
      q: 'Do you provide on-site CCTV installation and mobile view configuration in Garhwa & Palamu?',
      a: 'Yes, our certified CCTV engineering team handles complete on-site wiring, camera mounting, DVR/NVR configuration, and live mobile phone viewing setup across Garhwa, Nagar Untari, Majhiaon, and Daltonganj.'
    },
    {
      q: 'Do all hardware purchases and repairs include an official 18% GST tax invoice?',
      a: 'Yes, every sale and service from Lapiez comes with a statutory 18% GST invoice featuring our official GSTIN, allowing businesses and institutions to legitimately claim Input Tax Credit (ITC).'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        
        {/* 1. Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-[#1A56DB]">Tech Guides & Knowledge Hub</span>
        </nav>

        {/* 2. Hero Header Banner */}
        <div className="bg-gradient-to-br from-[#091530] via-[#0E275E] to-[#1A56DB] rounded-3xl p-6 sm:p-12 text-white shadow-xl relative overflow-hidden border border-white/10">
          {/* Subtle Ambient Backdrops */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>LAPIEZ HARDWARE ACADEMY • GARHWA SHOWROOM</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Hardware Guides, Tech Reviews & Buying Advice
            </h1>

            <p className="text-xs sm:text-base text-blue-100 leading-relaxed max-w-2xl">
              Authoritative buying advice, chip-level upgrade benchmarks, CCTV surveillance security setups, and maintenance tutorials written by certified Lapiez engineers.
            </p>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-blue-200 font-semibold">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Tested on 28-Point Bench
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Genuine Advice
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Store className="w-3.5 h-3.5 text-yellow-300" />
                Free Showroom Consultation
              </span>
            </div>
          </div>
        </div>

        {/* 3. Featured Story Card */}
        {featuredArticle && !searchQuery && selectedCategory === 'All' && (
          <div className="relative bg-white rounded-3xl border border-[#E5E7EB] shadow-md overflow-hidden transition-all hover:shadow-xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Cover Image */}
              <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-900">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:hidden" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 text-[#1A56DB] shadow-md backdrop-blur-md">
                  ★ FEATURED GUIDE
                </span>
              </div>

              {/* Story Content */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1A56DB] border border-blue-200">
                      {featuredArticle.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {featuredArticle.readTime}
                    </span>
                  </div>

                  <Link href={`/blogs/${featuredArticle.slug}`}>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 group-hover:text-[#1A56DB] transition-colors leading-tight">
                      {featuredArticle.title}
                    </h2>
                  </Link>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1A56DB] flex items-center justify-center font-bold text-[10px]">
                      {featuredArticle.author.charAt(0)}
                    </div>
                    <span>{featuredArticle.author}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/blogs/${featuredArticle.slug}`}
                    className="h-10 px-5 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs group-hover:translate-x-0.5"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello Lapiez, I read your featured guide "${featuredArticle.title}" and would like to ask a question.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-[#15803D] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Consult on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Ask on WhatsApp</span>
                  </a>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. Filter Bar & Search Toolbar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tech guides, SSDs, laptops, CCTV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-9 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A56DB] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Stats */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
              <span className="text-gray-500 font-medium">
                Showing <strong className="text-gray-900 font-bold">{filteredBlogs.length}</strong> articles
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-9 px-2.5 bg-[#F8FAFC] border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#1A56DB] cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="quick">Quick Reads</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Category Chips with Icons & Counts */}
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categoriesWithCounts.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const Icon = getCategoryIcon(cat.name);
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer font-semibold ${
                    isSelected
                      ? 'bg-[#1A56DB] text-white shadow-xs font-bold scale-[1.02]'
                      : 'bg-[#F8FAFC] text-gray-700 hover:bg-gray-100 border border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#1A56DB]'}`} />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* 5. Articles Grid */}
        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredBlogs.map((blog) => {
              const CategoryIcon = getCategoryIcon(blog.category);
              return (
                <article
                  key={blog.id}
                  className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                >
                  {/* Cover Header */}
                  <Link href={`/blogs/${blog.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-900">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Category Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-md flex items-center gap-1 border ${getCategoryColor(blog.category)}`}>
                        <CategoryIcon className="w-3 h-3" />
                        <span>{blog.category}</span>
                      </span>
                    </div>

                    {/* Read Time Overlay */}
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.readTime}
                    </span>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                        <span className="text-gray-600 font-semibold">{blog.author}</span>
                        <span>•</span>
                        <span>{new Date(blog.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                      </div>

                      <Link href={`/blogs/${blog.slug}`}>
                        <h3 className="font-extrabold text-gray-900 text-base sm:text-[17px] group-hover:text-[#1A56DB] transition-colors leading-snug line-clamp-2">
                          {blog.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </p>
                    </div>

                    {/* Tags & Action Row */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      {blog.tags && (
                        <div className="flex flex-wrap items-center gap-1">
                          {blog.tags.split(',').slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md font-medium"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] inline-flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
                        >
                          <span>Read Full Guide</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <a
                          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello Lapiez, I read your article "${blog.title}" and would like to inquire.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#25D366] hover:bg-emerald-50 transition-colors"
                          title="Ask question on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">No Articles Found</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                No guides matched your search for &quot;{searchQuery}&quot; in {selectedCategory}. Try resetting filters or searching with different keywords.
              </p>
            </div>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="h-9 px-5 rounded-xl bg-[#1A56DB] text-white text-xs font-bold hover:bg-[#1E40AF] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* 6. Technical Q&A / FAQs Accordion */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1A56DB]">
              <HelpCircle className="w-4 h-4 text-[#1A56DB]" />
              <span>GARHWA SHOWROOM HARDWARE FAQS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Frequently Asked Technical Questions
            </h2>
            <p className="text-xs text-gray-500">
              Answers directly from our certified hardware and surveillance laboratory engineers.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {blogFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm sm:text-base text-gray-900 hover:text-[#1A56DB] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#1A56DB] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <p className="mt-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Showroom Live Bench & WhatsApp CTA Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
              FREE HARDWARE DIAGNOSTICS BENCH
            </span>
            <h3 className="text-xl sm:text-3xl font-black leading-tight">
              Have a Hardware Issue or Need a Custom PC Build?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Bring your laptop or desktop to our physical testing bench in front of G P Plaza, Chiniya Road, Garhwa. Our engineers will diagnose thermal and SSD issues live in front of you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello Lapiez, I want to book a physical hardware checkup or ask a technical question.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black inline-flex items-center justify-center gap-2 transition-all shadow-md w-full sm:w-auto"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Chat on WhatsApp</span>
            </a>

            <Link
              href="/contact"
              className="h-11 px-6 rounded-xl bg-black/25 hover:bg-black/35 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all border border-white/20 w-full sm:w-auto"
            >
              <Store className="w-4 h-4 text-yellow-300" />
              <span>Showroom Map</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
