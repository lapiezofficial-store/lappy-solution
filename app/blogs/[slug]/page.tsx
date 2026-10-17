'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, ArrowLeft, Clock, User, Calendar, 
  Tag, Share2, MessageSquare, BookOpen, Sparkles, 
  ExternalLink, CheckCircle2, ShoppingBag 
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../../data/storeData';
import { DEFAULT_BLOGS } from '../../../data/blogData';

export default function SingleBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { blogPosts, products, siteSettings } = useStore();

  const allBlogs = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();
    if (blogPosts && Array.isArray(blogPosts)) {
      blogPosts.forEach((b: any) => {
        if (b && b.slug && !seen.has(b.slug)) {
          seen.add(b.slug);
          list.push(b);
        }
      });
    }
    DEFAULT_BLOGS.forEach((d) => {
      if (!seen.has(d.slug)) {
        seen.add(d.slug);
        list.push(d);
      }
    });
    return list;
  }, [blogPosts]);

  const blog = useMemo(() => {
    return allBlogs.find((b) => b.slug === slug);
  }, [allBlogs, slug]);

  const relatedBlogs = useMemo(() => {
    if (!blog) return [];
    return allBlogs
      .filter((b) => b.id !== blog.id && b.slug !== blog.slug)
      .slice(0, 3);
  }, [allBlogs, blog]);

  // Suggested products to buy based on blog category or tags
  const relatedProducts = useMemo(() => {
    if (!blog) return [];
    const cat = (blog.category || '').toLowerCase();
    const tags = (blog.tags || '').toLowerCase();
    return products
      .filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        if (cat.includes('laptop') || tags.includes('laptop')) {
          return pCat.includes('laptop') || pName.includes('laptop');
        }
        if (cat.includes('monitor') || tags.includes('monitor')) {
          return pCat.includes('monitor') || pName.includes('monitor');
        }
        if (cat.includes('security') || tags.includes('cctv')) {
          return pCat.includes('cctv') || pCat.includes('security') || pName.includes('camera');
        }
        return p.featured || (p.rating && p.rating >= 4.5);
      })
      .slice(0, 4);
  }, [blog, products]);

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: blog?.title || 'Lapiez Tech Blog',
        text: blog?.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Blog post link copied to clipboard!');
    }
  };

  const handleWhatsAppConsult = () => {
    const phone = getCleanWhatsAppNumber(siteSettings?.whatsapp);
    const text = encodeURIComponent(
      `Hello Lapiez! I just read your article "${blog?.title}" on your website and would like expert guidance on recommended hardware.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  if (!blog) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Article Not Found</h1>
        <p className="text-xs text-gray-500 max-w-md mb-6">
          The requested tech blog article &quot;{slug}&quot; does not exist or has been archived.
        </p>
        <Link
          href="/blogs"
          className="h-10 px-5 rounded-lg bg-[#1A56DB] text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-[#1E40AF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Articles</span>
        </Link>
      </div>
    );
  }

  // Parse markdown content into structured React nodes
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg sm:text-2xl font-black text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#1A56DB] rounded-full inline-block" />
            <span>{trimmed.replace(/^##\s+/, '')}</span>
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm sm:text-lg font-bold text-gray-800 mt-5 mb-2">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs sm:text-[14.5px] text-gray-700 ml-4 list-disc mb-1.5 leading-relaxed">
            {trimmed.replace(/^[\*\-]\s+/, '')}
          </li>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-4 p-4 rounded-xl bg-blue-50/60 border-l-4 border-[#1A56DB] text-xs sm:text-[13.5px] font-medium text-[#1E3A8A] italic leading-relaxed">
            {trimmed.replace(/^>\s+/, '')}
          </blockquote>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-[14.5px] text-gray-700 leading-relaxed mb-3.5">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#1A56DB] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/blogs" className="hover:text-[#1A56DB] transition-colors">Tech Guides & Blogs</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-800 line-clamp-1">{blog.title}</span>
        </nav>

        {/* Article Container */}
        <article className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          
          {/* Cover Header Banner */}
          <div className="relative w-full h-56 sm:h-80 bg-gradient-to-br from-[#0A1633] via-[#0F2960] to-[#1A56DB] overflow-hidden">
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover opacity-85"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Overlay Info */}
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-[#1A56DB] text-white">
                {blog.category}
              </span>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight drop-shadow-sm">
                {blog.title}
              </h1>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="px-6 sm:px-10 py-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-[#1A56DB]" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{blog.readTime} read</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Published Oct 2026</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Share</span>
              </button>
              <button
                onClick={handleWhatsAppConsult}
                className="h-8 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Expert</span>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="px-6 sm:px-12 py-8 sm:py-12">
            
            {/* Excerpt callout */}
            {blog.excerpt && (
              <div className="p-4 sm:p-5 mb-8 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 text-gray-800 text-xs sm:text-sm font-medium leading-relaxed shadow-2xs">
                {blog.excerpt}
              </div>
            )}

            {/* Markdown Main Content */}
            <div className="prose max-w-none text-gray-800">
              {renderFormattedContent(blog.content)}
            </div>

            {/* Tags Cloud */}
            {blog.tags && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Tags:
                </span>
                {blog.tags.split(',').map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Author Guarantee Box */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#0F2960] to-[#1A56DB] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-blue-200 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                  <span>Tested & Recommended by Lapiez Garhwa</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Need Help Choosing the Right Hardware?
                </h4>
                <p className="text-xs text-blue-100 max-w-xl">
                  Visit our Garhwa showroom or speak directly with our certified technical engineers for personalized quotation and warranty coverage.
                </p>
              </div>
              <button
                onClick={handleWhatsAppConsult}
                className="h-10 px-5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-black flex items-center gap-2 shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Hardware Desk</span>
              </button>
            </div>
          </div>
        </article>

        {/* Recommended Store Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#1A56DB]" />
                  <span>Recommended Hardware in Our Showroom</span>
                </h3>
                <p className="text-xs text-gray-500">Genuine items discussed in this guide available for immediate dispatch</p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#1A56DB] hover:underline inline-flex items-center gap-1"
              >
                <span>Browse All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-[#1A56DB] transition-all flex flex-col justify-between"
                >
                  <div className="w-full aspect-square bg-[#F8FAFC] rounded-lg overflow-hidden flex items-center justify-center p-2 mb-2">
                    <img
                      src={p.images?.[0] || p.image || '/images/products/laptop-dell.png'}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/laptop-dell.png';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{p.brand}</span>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-[#1A56DB] transition-colors">
                      {p.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        ₹{(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{p.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More Articles */}
        {relatedBlogs.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-base sm:text-lg font-black text-gray-900">More Buying Guides & Articles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedBlogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/blogs/${b.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#1A56DB] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#1A56DB] bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                      {b.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-[#1A56DB] transition-colors">
                      {b.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {b.excerpt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span>{b.readTime} read</span>
                    <span className="text-[#1A56DB] font-semibold group-hover:underline">Read Now &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
