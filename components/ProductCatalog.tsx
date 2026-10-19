'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Filter, Search, ArrowUpDown, ChevronDown, Check, X,
  Star, Laptop, Monitor, Camera, Printer, HardDrive, 
  Wifi, LayoutGrid, Sparkles, SlidersHorizontal, ChevronRight,
  ShieldCheck, CheckCircle2, Tag, Layers
} from 'lucide-react';
import { Product } from '../data/products';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';

interface ProductCatalogProps {
  initialCategory?: string;
  initialSubcategory?: string;
  initialSearch?: string;
  initialBrand?: string;
}

// Helper to map legacy / abbreviated category slugs to canonical showroom category names
function normalizeToCanonicalCategory(query: string, availableCategories: string[]): string | null {
  if (!query || query === 'All' || query === 'All Products') return null;
  const q = query.trim().toLowerCase();
  
  // 1. Direct exact match (case-insensitive)
  const direct = availableCategories.find(c => c.toLowerCase() === q);
  if (direct) return direct;

  // 2. Direct containment match
  const contains = availableCategories.find(c => c.toLowerCase().includes(q) || q.includes(c.toLowerCase()));
  if (contains) return contains;

  // 3. Known taxonomy aliases
  if (['laptops', 'laptop', 'notebooks'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('laptop'));
    if (found) return found;
  }
  if (['computers', 'computer', 'desktops', 'desktop', 'pc', 'custom-pcs'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('computer') && !c.toLowerCase().includes('peripheral'));
    if (found) return found;
  }
  if (['displays', 'monitors', 'monitor'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('monitor') || c.toLowerCase().includes('display') || c.toLowerCase().includes('peripheral'));
    if (found) return found;
  }
  if (['peripherals', 'computer peripherals', 'input devices', 'keyboards', 'mouse'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('peripheral') || c.toLowerCase().includes('keyboard') || c.toLowerCase().includes('input'));
    if (found) return found;
  }
  if (['storage', 'ssd', 'hdd', 'ram', 'memory', 'storage & memory', 'storage & parts'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('storage') || c.toLowerCase().includes('memory') || c.toLowerCase().includes('peripheral'));
    if (found) return found;
  }
  if (['printers', 'printer', 'printers & parts', 'printers & accessories'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('printer'));
    if (found) return found;
  }
  if (['cctv', 'cctv & security', 'cctv & security surveillance', 'surveillance', 'security'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('cctv') || c.toLowerCase().includes('surveillance'));
    if (found) return found;
  }
  if (['antivirus & software', 'antivirus', 'software'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('software') || c.toLowerCase().includes('antivirus'));
    if (found) return found;
  }
  if (['laptop parts', 'laptop spares', 'laptop parts & spares', 'accessories'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('laptop parts') || c.toLowerCase().includes('spares'));
    if (found) return found;
  }
  if (['networking', 'network', 'wifi', 'wi-fi', 'routers', 'router'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('network') || c.toLowerCase().includes('wifi'));
    if (found) return found;
  }
  if (['power', 'batteries', 'battery', 'adapters', 'adapter', 'chargers', 'smps', 'ups'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase().includes('power') || c.toLowerCase().includes('batteries') || c.toLowerCase().includes('adapter'));
    if (found) return found;
  }

  return null;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ 
  initialCategory = 'All',
  initialSubcategory = 'All',
  initialSearch = '',
  initialBrand = 'All'
}) => {
  const { products, brands, categories: cmsCategories } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('featured');
  const [mobileSortOpen, setMobileSortOpen] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [displayLimit, setDisplayLimit] = useState<number>(24);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [minRating, setMinRating] = useState<number>(0);
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);

  const sortOptions = [
    { id: 'featured', label: 'Featured Deals', desc: 'Curated & Trending at Showroom' },
    { id: 'price-asc', label: 'Price: Low to High', desc: 'Budget & Affordable First' },
    { id: 'price-desc', label: 'Price: High to Low', desc: 'Premium Laptops & Rigs First' },
    { id: 'rating', label: 'Top Customer Rating', desc: 'Highest Rated by Buyers' },
    { id: 'discount', label: 'Biggest Discount', desc: 'Maximum % Savings (Up to 70% Off)' },
  ] as const;

  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.label || 'Featured Deals';

  useEffect(() => {
    if (initialCategory && initialCategory !== 'All' && initialCategory !== 'All Products') {
      const allCatNames = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      const canonical = normalizeToCanonicalCategory(initialCategory, allCatNames);
      setSelectedCategory(canonical || initialCategory);
    } else if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, products]);

  useEffect(() => {
    if (initialSubcategory) {
      setSelectedSubcategory(initialSubcategory);
    }
  }, [initialSubcategory]);

  useEffect(() => {
    if (initialBrand) {
      setSelectedBrand(initialBrand);
    }
  }, [initialBrand]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Clean Category Icon Resolver (No Stickers / Emojis / Sparkles)
  const getCategoryIcon = (categoryName: string) => {
    const n = categoryName.toLowerCase();
    if (n === 'all' || n === 'all products') return LayoutGrid;
    if (n.includes('laptop')) return Laptop;
    if (n.includes('computer') || n.includes('desktop') || n.includes('pc') || n.includes('monitor')) return Monitor;
    if (n.includes('cctv') || n.includes('security') || n.includes('camera')) return ShieldCheck;
    if (n.includes('printer') || n.includes('toner') || n.includes('cartridge')) return Printer;
    if (n.includes('storage') || n.includes('ssd') || n.includes('hard') || n.includes('ram')) return HardDrive;
    if (n.includes('network') || n.includes('wifi') || n.includes('router')) return Wifi;
    if (n.includes('accessories') || n.includes('keyboard') || n.includes('mouse') || n.includes('cable') || n.includes('adapter')) return Layers;
    return Layers;
  };

  // Dynamic Categories organized from CMS & Real Inventory
  const categories = useMemo(() => {
    const list: { name: string; icon: any; count: number }[] = [
      { name: 'All', icon: LayoutGrid, count: products.length }
    ];

    // Tally actual product counts per category name
    const catProductCounts = new Map<string, number>();
    products.forEach((p) => {
      const catName = p.category?.trim();
      if (catName) {
        catProductCounts.set(catName, (catProductCounts.get(catName) || 0) + 1);
      }
    });

    const seen = new Set<string>();
    seen.add('all');

    // Add active CMS categories that have products or are top-level parent categories
    if (Array.isArray(cmsCategories) && cmsCategories.length > 0) {
      cmsCategories
        .filter((c) => c.status !== 'inactive' && !c.parentId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .forEach((c) => {
          const cName = c.name.trim();
          const count = catProductCounts.get(cName) || 0;
          if (count > 0) {
            seen.add(cName.toLowerCase());
            list.push({
              name: cName,
              icon: getCategoryIcon(cName),
              count,
            });
          }
        });
    }

    // Ensure any category that has active products is included
    catProductCounts.forEach((count, catName) => {
      if (!seen.has(catName.toLowerCase()) && count > 0) {
        seen.add(catName.toLowerCase());
        list.push({
          name: catName,
          icon: getCategoryIcon(catName),
          count,
        });
      }
    });

    // Sort: 'All' first, then categories by count descending
    const allItem = list[0];
    const otherItems = list.slice(1).sort((a, b) => b.count - a.count);

    return [allItem, ...otherItems];
  }, [cmsCategories, products]);

  // Subcategories available under currently selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'All' || selectedCategory === 'All Products') return [];
    const matched = (cmsCategories || []).find(c => c.name.toLowerCase() === selectedCategory.toLowerCase());
    if (matched && matched.subcategories && matched.subcategories.length > 0) {
      return matched.subcategories.map(s => ({ name: s.name, slug: s.slug }));
    }
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category.toLowerCase() === selectedCategory.toLowerCase() && p.subcategory?.trim()) {
        set.add(p.subcategory.trim());
      }
    });
    return Array.from(set).map(name => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
  }, [selectedCategory, cmsCategories, products]);

  // Derive unique brands with product count (Connected with Admin CMS Brands & Products)
  const brandListWithCounts = useMemo(() => {
    // 1. Tally product counts per normalized brand name
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const b = (p.brand || '').trim().toLowerCase();
      if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    });

    const brandMap = new Map<string, { name: string; count: number; position: number }>();

    // 2. Load active brands from Admin CMS (only visible ones)
    const activeCmsBrands = (brands || [])
      .filter((b) => b.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    activeCmsBrands.forEach((b, idx) => {
      const key = b.name.trim().toLowerCase();
      const queryKey = (b.query || '').trim().toLowerCase();
      const count = counts[key] || (queryKey ? counts[queryKey] : 0) || 0;
      brandMap.set(key, {
        name: b.name.trim().toUpperCase(),
        count,
        position: b.position ?? idx
      });
    });

    // 3. Include any brands on catalog products that might not be in CMS
    products.forEach((p) => {
      const raw = (p.brand || '').trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!brandMap.has(key)) {
        brandMap.set(key, {
          name: raw.toUpperCase(),
          count: counts[key] || 1,
          position: 999
        });
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    });
  }, [products, brands]);

  const displayedBrands = useMemo(() => {
    let list = brandListWithCounts;
    if (brandSearch.trim()) {
      list = list.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
    }
    return list;
  }, [brandListWithCounts, brandSearch]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category Match
      if (selectedCategory !== 'All' && selectedCategory !== 'All Products') {
        const catLower = selectedCategory.toLowerCase();
        const pCatLower = (p.category || '').toLowerCase();
        const matchesDirect = pCatLower === catLower || pCatLower.includes(catLower) || catLower.includes(pCatLower);
        const matchesSub = (p.subcategory || '').toLowerCase().includes(catLower);
        const matchesName = p.name.toLowerCase().includes(catLower);
        if (!matchesDirect && !matchesSub && !matchesName) {
          return false;
        }
      }

      // Subcategory Match
      if (selectedSubcategory !== 'All') {
        const subLower = selectedSubcategory.toLowerCase();
        const matchesSubDirect = (p.subcategory || '').toLowerCase() === subLower;
        const matchesSubName = p.name.toLowerCase().includes(subLower);
        if (!matchesSubDirect && !matchesSubName) {
          return false;
        }
      }

      if (selectedBrand !== 'All') {
        const pBrand = (p.brand || '').trim().toLowerCase();
        const selBrand = selectedBrand.trim().toLowerCase();
        if (pBrand !== selBrand) {
          return false;
        }
      }
      if (onlyInStock) {
        const isAvailable = p.inStock !== false && (p.stockQuantity === undefined || p.stockQuantity === null || Number(p.stockQuantity) > 0);
        if (!isAvailable) {
          return false;
        }
      }
      if (p.price > maxPrice) {
        return false;
      }
      if (minRating > 0 && (p.rating || 0) < minRating) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesSubcat = (p.subcategory || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesSpecs = (p.specs || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesSubcat && !matchesBrand && !matchesSpecs) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedSubcategory, selectedBrand, onlyInStock, searchQuery, maxPrice, minRating, sortBy]);

  const visibleProducts = filteredProducts.slice(0, displayLimit);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setOnlyInStock(false);
    setMaxPrice(100000);
    setMinRating(0);
    setBrandSearch('');
    setSearchQuery('');
  };

  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const activeFilterCount = (selectedCategory !== 'All' && selectedCategory !== 'All Products' ? 1 : 0) +
    (selectedBrand !== 'All' ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (maxPrice < 100000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="py-4 sm:py-8 bg-[#F1F3F6] min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Top Breadcrumb & Title */}
        <div className="mb-3 sm:mb-5">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 mb-1">
            <Link href="/" className="hover:text-[#1A56DB]">Home</Link>
            <span>/</span>
            <span className="text-[#1A56DB] font-semibold">Store Catalog</span>
            {selectedCategory !== 'All' && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-bold">{selectedCategory}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#111827]">
                {selectedCategory === 'All' ? 'All Hardware & Spares Collection' : `${selectedCategory}`}
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> genuine products in Garhwa showroom inventory
              </p>
            </div>

            {/* Search Input in Catalog */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search catalog items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8.5 pr-7 py-1.5 sm:py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A56DB] shadow-2xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Fast-Swipe Category Chips (Phone Optimized) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3">
          {categories.map((cat) => {
            const count = cat.name === 'All' ? products.length : products.filter(p => p.category === cat.name).length;
            const isSelected = selectedCategory === cat.name || (cat.name === 'All' && selectedCategory === 'All Products');
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubcategory('All');
                  setDisplayLimit(24);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#1A56DB] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Filter & Sort Bar (Phone Optimized Flipkart/Amazon Style) */}
        <div className="lg:hidden flex items-center justify-between gap-2 bg-white border border-[#E5E7EB] rounded-xl p-2 mb-3 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 h-9 px-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#111827] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-gray-200"
          >
            <Filter className="w-3.5 h-3.5 text-[#1A56DB]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#1A56DB] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileSortOpen(true)}
            className="flex-1 h-9 px-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#111827] text-xs font-bold flex items-center justify-between transition-colors border border-gray-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#1A56DB] flex-shrink-0" />
              <span className="truncate">{currentSortLabel}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-1" />
          </button>
        </div>

        {/* Mobile Sort Bottom Drawer (Touch-Optimized Bottom Sheet) */}
        {mobileSortOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setMobileSortOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl p-4 pb-6 z-10 animate-in slide-in-from-bottom duration-200">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#1A56DB]" />
                  <span className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">Sort Products By</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSortOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center font-bold text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 divide-y divide-gray-100">
                {sortOptions.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id as any);
                        setMobileSortOpen(false);
                      }}
                      className={`w-full py-3 px-3 flex items-center justify-between text-left transition-colors rounded-xl ${
                        isSelected ? 'bg-blue-50/80 text-[#1A56DB]' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#1A56DB]' : 'text-gray-900'}`}>
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#1A56DB] bg-[#1A56DB]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* E-Commerce Grid with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Desktop Left Sidebar Filters (Flipkart / Amazon Style) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm sticky top-24">
            
            {/* Header with Title & Clear All */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-extrabold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#1A56DB]" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-[#1A56DB] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-[#1A56DB] hover:text-[#1E40AF] transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* 1. Category Tree Filter (Clean Organization, No Sparkle Stickers) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Categories
                </h3>
                <Link
                  href="/admin?tab=categories"
                  className="text-[10px] font-bold text-[#1A56DB] hover:underline"
                  title="Manage categories in Admin CMS"
                >
                  + Manage
                </Link>
              </div>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase() || (cat.name === 'All' && selectedCategory === 'All Products');

                  return (
                    <div key={cat.name} className="space-y-1">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setSelectedSubcategory('All');
                          setDisplayLimit(24);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex justify-between items-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-[#1A56DB] font-extrabold border border-blue-200 shadow-2xs'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#1A56DB]' : 'text-gray-400'}`} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isSelected ? 'bg-[#1A56DB] text-white font-bold' : 'text-gray-500 bg-gray-100 font-semibold'
                        }`}>
                          {cat.count}
                        </span>
                      </button>

                      {/* Expandable Subcategories when category is selected */}
                      {isSelected && cat.name !== 'All' && availableSubcategories.length > 0 && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-blue-200 ml-2 animate-in slide-in-from-top-1">
                          <button
                            onClick={() => setSelectedSubcategory('All')}
                            className={`w-full text-left py-1 px-2 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                              selectedSubcategory === 'All'
                                ? 'font-bold text-[#1A56DB] bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <span>All {cat.name}</span>
                          </button>
                          {availableSubcategories.map((sub) => {
                            const isSubActive = selectedSubcategory.toLowerCase() === sub.name.toLowerCase();
                            const subCount = products.filter(
                              p => p.category.toLowerCase() === cat.name.toLowerCase() && 
                              p.subcategory?.toLowerCase() === sub.name.toLowerCase()
                            ).length;

                            return (
                              <button
                                key={sub.name}
                                onClick={() => setSelectedSubcategory(sub.name)}
                                className={`w-full text-left py-1 px-2 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                                  isSubActive
                                    ? 'font-bold text-[#1A56DB] bg-blue-100/70 shadow-2xs'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <span className="truncate">↳ {sub.name}</span>
                                {subCount > 0 && (
                                  <span className="text-[9.5px] text-gray-400 font-semibold">{subCount}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            {/* 3. Price Filter Slider & Quick Range Chips */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Max Price
                </h3>
                <span className="text-xs font-extrabold text-[#1A56DB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input 
                type="range"
                min="500"
                max="100000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#1A56DB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 mb-2">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>

              {/* Quick Range Chips */}
              <div className="grid grid-cols-2 gap-1 pt-1">
                {[
                  { label: 'All', val: 100000 },
                  { label: 'Under ₹2K', val: 2000 },
                  { label: 'Under ₹10K', val: 10000 },
                  { label: 'Under ₹35K', val: 35000 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setMaxPrice(chip.val)}
                    className={`py-1 px-1.5 text-[10.5px] rounded border text-center font-medium transition-colors ${
                      maxPrice === chip.val 
                        ? 'bg-[#1A56DB] text-white border-[#1A56DB] font-bold' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Customer Rating Filter (Flipkart & Amazon style) */}
            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Customer Rating
              </h3>
              <div className="space-y-1">
                {[
                  { rating: 4, label: '4 Stars & Above' },
                  { rating: 3, label: '3 Stars & Above' },
                  { rating: 0, label: 'All Ratings' }
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setMinRating(r.rating)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                      minRating === r.rating ? 'bg-blue-50 text-[#1A56DB] font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${minRating === r.rating ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'}`} />
                      <span>{r.label}</span>
                    </div>
                    {minRating === r.rating && <Check className="w-3.5 h-3.5 text-[#1A56DB]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. In-Stock Garhwa Showroom Verification Toggle */}
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-emerald-400 text-[#15803D] focus:ring-[#15803D] mt-0.5"
                />
                <div>
                  <div className="font-extrabold text-[11.5px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Garhwa Showroom In-Stock Only</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                    Ready for 30-min store pickup or same-day delivery
                  </p>
                </div>
              </label>
            </div>

          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-9 space-y-3.5">
            
            {/* Top Brand Filter Ribbon (Matching Image 2) */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Filter by Brand
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] border border-blue-100">
                    {brandListWithCounts.length} Brands
                  </span>
                </div>

                {/* Brand Dropdown (Matching Image 2 Reference) + Search & Quick Reset */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Brand: All Companies Select Menu (Image 2) */}
                  <div className="relative">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="h-7.5 px-2.5 bg-[#F9FAFB] hover:bg-white border border-gray-200 hover:border-[#1A56DB] rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#1A56DB] focus:bg-white transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="All">Brand: All Companies</option>
                      {displayedBrands.map((b) => (
                        <option key={b.name} value={b.name}>
                          Brand: {b.name} {b.count > 0 ? `(${b.count})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex-1 sm:w-44">
                    <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search brands (HP, Dell, Lapcare...)"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full h-7.5 pl-7 pr-6 bg-[#F9FAFB] border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A56DB] focus:bg-white transition-colors"
                    />
                    {brandSearch && (
                      <button
                        onClick={() => setBrandSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {selectedBrand !== 'All' && (
                    <button
                      onClick={() => setSelectedBrand('All')}
                      className="h-7.5 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear ({selectedBrand})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subcategories Filter Ribbon (Displays dynamically when a Category is chosen) */}
            {availableSubcategories.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#1A56DB]" />
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      Subcategories for {selectedCategory}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] border border-blue-100">
                      {availableSubcategories.length}
                    </span>
                  </div>

                  {selectedSubcategory !== 'All' && (
                    <button
                      onClick={() => setSelectedSubcategory('All')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      View All {selectedCategory}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    onClick={() => setSelectedSubcategory('All')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                      selectedSubcategory === 'All'
                        ? 'bg-[#1A56DB] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Subcategories
                  </button>

                  {availableSubcategories.map((sub) => {
                    const isSelected = selectedSubcategory.toLowerCase() === sub.name.toLowerCase();
                    const subCount = products.filter(p => 
                      (p.subcategory && p.subcategory.toLowerCase() === sub.name.toLowerCase()) ||
                      p.name.toLowerCase().includes(sub.name.toLowerCase())
                    ).length;

                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSelectedSubcategory(isSelected ? 'All' : sub.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A56DB] text-white font-bold shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-400 font-bold'}`}>
                          ({subCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Sorting & Result Controls Strip (Desktop) */}
            <div className="hidden lg:flex bg-white border border-[#E5E7EB] rounded-xl p-3 items-center justify-between gap-2 shadow-2xs">
              <span className="text-xs text-gray-500">
                Displaying 1 - {Math.min(visibleProducts.length, filteredProducts.length)} of <strong>{filteredProducts.length}</strong> items
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 font-semibold focus:outline-none focus:border-[#1A56DB] cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responsive 2-Col Mobile, 3-Col Desktop Product Grid */}
            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-4">
                {visibleProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No products match your criteria</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Try adjusting the category, lowering the price threshold, or searching for a broader term.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {filteredProducts.length > displayLimit && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 24)}
                  className="px-6 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 text-xs font-bold transition-all shadow-xs"
                >
                  Load More Products ({filteredProducts.length - displayLimit} remaining)
                </button>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE FILTER BOTTOM SHEET DRAWER (Phone Optimized)        */}
      {/* ========================================================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1A56DB]" />
                <h3 className="font-extrabold text-sm text-[#111827]">
                  Filter Products ({filteredProducts.length})
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-[#1A56DB]"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="p-4 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Category Options */}
              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wider block mb-2">
                  Select Category
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => {
                    const count = cat.name === 'All' ? products.length : products.filter(p => p.category === cat.name).length;
                    const isSelected = selectedCategory === cat.name || (cat.name === 'All' && selectedCategory === 'All Products');
                    return (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setDisplayLimit(24);
                        }}
                        className={`p-2 rounded-lg text-left text-xs font-medium border flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-[#1A56DB] text-[#1A56DB] font-bold'
                            : 'bg-[#F9FAFB] border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-gray-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Slider */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-gray-900 uppercase tracking-wider">
                    Maximum Budget
                  </span>
                  <span className="text-sm font-extrabold text-[#1A56DB]">
                    ₹{maxPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="100000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#1A56DB] cursor-pointer"
                />
              </div>

              {/* Brand Chips */}
              <div className="pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900 uppercase tracking-wider block mb-2">
                  Brand ({brandListWithCounts.length} brands)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  <button
                    key="All"
                    onClick={() => setSelectedBrand('All')}
                    className={`px-2.5 py-1 rounded-md text-xs border font-medium transition-colors ${
                      selectedBrand === 'All'
                        ? 'bg-[#1A56DB] text-white border-[#1A56DB] font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  {brandListWithCounts.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => setSelectedBrand(b.name)}
                      className={`px-2.5 py-1 rounded-md text-xs border font-medium transition-colors ${
                        selectedBrand === b.name
                          ? 'bg-[#1A56DB] text-white border-[#1A56DB] font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {b.name} ({b.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* In-Stock Garhwa Checkbox */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2.5 text-xs text-gray-800 font-semibold cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A56DB] focus:ring-[#1A56DB]"
                  />
                  <span>Show In-Stock Garhwa Showroom Only</span>
                </label>
              </div>

            </div>

            {/* Bottom Apply CTA */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98"
              >
                <span>Apply & View {filteredProducts.length} Products</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
