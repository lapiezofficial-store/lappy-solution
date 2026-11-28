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
import { CATEGORIES as DEFAULT_TAXONOMY_CATEGORIES } from '../data/categories';

interface ProductCatalogProps {
  initialCategory?: string;
  initialSubcategory?: string;
  initialSearch?: string;
  initialBrand?: string;
}

// Subcategory keyword taxonomy for intelligent showroom inventory matching
// Terms wrapped in regex boundaries or phrases prevent partial-word false positives (e.g. "ink" vs "d-link")
const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  'speakers & soundbars': ['speaker', 'soundbar', 'sound bar', 'soundbox', 'sound box', 'home theatre', 'woofer', 'subwoofer'],
  'speakers': ['speaker', 'soundbar', 'sound bar', 'soundbox'],
  'mouse & keyboard': ['keyboard', '\\bmouse\\b', 'keypad'],
  'monitors & displays': ['monitor', 'display', 'curved monitor', 'led monitor', 'ips monitor', '\\bips\\b', '100hz', 'e2225hm', 'p204v', 'ek220q', 'mon-0068'],
  'cable & connector (hdmi/vga/power)': ['\\bcable\\b', 'connector', '\\bhdmi\\b', '\\bvga\\b', 'power cord', 'patch cord', 'extender', 'splitter', 'converter', '\\bhub\\b', 'usb wi-fi', 'wi-fi dongle', 'bluetooth dongle', 'ft-0844'],
  'cables-connectors': ['\\bcable\\b', 'connector', '\\bhdmi\\b', '\\bvga\\b', 'extender', 'converter', '\\bhub\\b'],
  'computer peripherals': ['webcam', 'biometric', 'fingerprint', '\\bups\\b', 'switch', 'dongle', 'motherboard', 'processor', 'cooler', '\\bfan\\b', '\\bram\\b', 'scanner', 'pen drive'],
  'computer & laptop': ['\\blaptop\\b', '\\bnotebook\\b', '\\bdesktop\\b', '\\bpc\\b'],
  'desktop & laptops': ['\\blaptop\\b', '\\bnotebook\\b', '\\bdesktop\\b', '\\bpc\\b'],
  'refurbished laptops': ['refurbished', 'pre-owned', 'renewed', 'latitude', 'thinkpad', 'elitebook'],
  'custom desktop pc rigs': ['motherboard', 'processor', 'core-i', 'cooler', 'heatsink', 'gaming pc', 'cabinet', 'h110', 'h81', 'h61'],
  'laptop battery': ['\\bbattery\\b', '\\bbatt\\b', '\\bmah\\b', '\\bcmos\\b'],
  'laptop adaptor': ['adaptor', 'adapter', 'charger', 'power supply', 'ac adapter', '\\b65w\\b', '\\b45w\\b', '\\b90w\\b'],
  'laptop body': ['\\bbody\\b', 'casing', '\\bbase\\b', 'top cover', 'palmrest', 'back panel', 'bezel'],
  'laptop screen cable': ['screen cable', 'display cable', 'lvds', '\\bedp\\b', 'flex cable'],
  'laptop keyboards': ['keyboard', 'keypad'],
  'laptop screen': ['laptop screen', 'led screen', 'lcd screen', 'led panel', 'lcd panel', 'paper led', 'ips led', 'slim led'],
  'laptop parts': ['dc jack', 'dc jac', 'cooling fan', 'cpu fan', 'display cable', 'screen cable', 'hinge', 'screw', 'power switch', 'speaker', 'motherboard', 'spare part'],
  'laptop motherboard': ['motherboard', 'mainboard', 'logic board'],
  'laptop dc jac': ['dc jack', 'dc jac', 'charging port', 'power jack'],
  'laptop fan': ['cooling fan', 'cpu fan', '\\bfan\\b', 'heatsink'],
  'laptop ic': ['\\bic\\b', 'chipset', 'mosfet', 'regulator'],
  'laptop ram': ['\\bram\\b', '\\bddr3\\b', '\\bddr4\\b', '\\bddr5\\b', 'sodimm', 'memory module'],
  'laptop hing': ['hinge', 'hinges', '\\bhing\\b'],
  'laptop screws': ['screw', 'screws'],
  'laptop power switch': ['power switch', 'power button', 'on/off board'],
  'laptop speaker': ['speaker', 'speakers', 'audio module'],
  'printers (inktank & laser)': ['printer', 'inktank', 'ink tank', 'laserjet', 'ecotank', 'all-in-one', 'multifunction', 'multi-function', 'pixma', 'deskjet'],
  'toner & ink bottles': ['toner bottle', 'ink bottle', 'ink bottel', '\\b003\\b', '\\b001\\b', '\\b057\\b', '\\bt673\\b', 'gt-52', 'gt53', '\\b664\\b', 'gi-790', 'btd', 'bt5000', 'refill'],
  'paper & sticker sheets': ['paper', 'sticker', 'glossy', 'photo paper', 'thermal paper', 'sublimation'],
  'printer spare parts & rollers': ['roller', 'pick up roller', 'teflon', 'fuser', 'printhead', 'print head', '\\bgear\\b', 'carriage', 'encoder'],
  'cctv cameras (dome/bullet/wi-fi)': ['camera', '\\bdome\\b', '\\bbullet\\b', '\\bptz\\b', '\\bdvr\\b', '\\bnvr\\b', 'wi-fi camera'],
  'biometric attendance & scanners': ['biometric', 'fingerprint', 'scanner', 'attendance', 'mantra', 'morpho', 'mfs110', 'rd service'],
  'ssd & hard disk': ['\\bssd\\b', 'hard disk', '\\bhdd\\b', '\\bsata\\b', '\\bnvme\\b', 'm\\.2'],
  'pendrive & sd card': ['pen drive', 'pendrive', 'usb.*drive', 'flash drive', '\\bsd card\\b', 'micro sd', 'memory card', '\\botg\\b'],
  'antivirus (quick heal / total security)': ['antivirus', 'quick heal', 'total security', 'internet security', 'kaspersky', '\\bk7\\b', 'license'],
  'electronics & gadgets': ['electronic', 'gadget', 'led', 'display', 'speaker', '\\bhub\\b', 'converter'],
  'ink': ['\\bink\\b'],
  'toner cartridge': ['toner', 'cartridge'],
  'toner cartridges': ['toner', 'cartridge'],
  'ink bottles & refills': ['\\bink\\b', 'bottle', 'bottel', 'refill', '\\b003\\b', 'gt-52', 'gt53', '\\b664\\b'],
  'opc drum & doctor blade': ['\\bdrum\\b', 'blade', '\\bopc\\b', 'wiper blade', 'doctor blade'],
  'screens-displays': ['screen', 'display', 'panel', '\\bled\\b', '\\blcd\\b'],
  'audio-modules': ['speaker', 'audio', 'sound', 'woofer'],
  'certified refurbished laptops': ['refurbished', 'pre-owned', 'renewed', 'latitude', 'thinkpad', 'elitebook'],
  'refurbished desktop pcs': ['refurbished desktop', 'renewed pc', 'desktop rig'],
  'refurbished hd monitors': ['refurbished monitor', 'used monitor', 'hd monitor'],
};

// Multi-condition subcategory rules where EVERY group must match (e.g. brand + product type)
const SUBCATEGORY_MATCH_GROUPS: Record<string, string[][]> = {
  'hp keyboard': [['\\bhp\\b'], ['keyboard', 'keypad']],
  'dell keyboard': [['\\bdell\\b'], ['keyboard', 'keypad']],
  'lenovo keyboard': [['\\blenovo\\b'], ['keyboard', 'keypad']],
  'acer keyboard': [['\\bacer\\b'], ['keyboard', 'keypad']],
  'dell adapter': [['\\bdell\\b'], ['adapter', 'adaptor', 'charger']],
  'hp adapter': [['\\bhp\\b'], ['adapter', 'adaptor', 'charger']],
  'acer adapter': [['\\bacer\\b'], ['adapter', 'adaptor', 'charger']],
  'dell laptop battery': [['\\bdell\\b'], ['\\bbattery\\b', '\\bbatt\\b']],
  'hp laptop battery': [['\\bhp\\b'], ['\\bbattery\\b', '\\bbatt\\b']],
  'lenovo & acer battery': [['\\blenovo\\b', '\\bacer\\b'], ['\\bbattery\\b', '\\bbatt\\b']],
};

const GENERIC_SUBCATEGORY_WORDS = new Set([
  'and', 'for', 'with', 'the', 'all',
  'laptop', 'laptops', 'computer', 'computers', 'printer', 'printers',
  'cctv', 'electronic', 'electronics', 'part', 'parts', 'spare', 'spares',
  'accessory', 'accessories', 'product', 'products', 'device', 'devices',
]);

function matchesTerm(text: string, term: string): boolean {
  if (!term) return false;
  if (term.includes('\\b') || term.includes('.*') || term.includes('\\.')) {
    try {
      return new RegExp(term, 'i').test(text);
    } catch {
      return text.includes(term.replace(/\\b/g, ''));
    }
  }
  return text.includes(term);
}

// Robust Category Matcher
export function isProductInCategory(p: Product, targetCategory: string): boolean {
  if (!targetCategory || targetCategory === 'All' || targetCategory === 'All Products') return true;
  const target = targetCategory.trim().toLowerCase();
  const pCat = (p.category || '').trim().toLowerCase();
  if (!pCat) return false;

  // Direct exact match
  if (pCat === target) return true;

  // Normalized string match (remove plural endings and ampersands)
  const targetBase = target.replace(/s\b/g, '').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  const pCatBase = pCat.replace(/s\b/g, '').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  if (targetBase === pCatBase) return true;

  // Dedicated showroom domain rules
  if (target.includes('periph') && pCat.includes('periph')) return true;
  if ((target.includes('cctv') || target.includes('secur')) && (pCat.includes('cctv') || pCat.includes('secur'))) return true;
  if (target.includes('toner') && pCat.includes('toner')) return true;
  if (target.includes('printer') && pCat.includes('printer')) return true;
  if ((target.includes('storage') || target.includes('memory')) && (pCat.includes('storage') || pCat.includes('memory'))) return true;
  if (target.includes('electronic') && pCat.includes('electronic')) return true;

  // Distinguish Laptops from Laptop Parts & Spares
  if (target.includes('part') || target.includes('spare')) {
    return pCat.includes('part') || pCat.includes('spare') || pCat.includes('adaptor') || pCat.includes('battery');
  }
  if (target.includes('laptop') && !target.includes('part') && !target.includes('spare')) {
    return (pCat.includes('laptop') || pCat.includes('computer')) && !pCat.includes('peripheral') && !pCat.includes('part');
  }

  return false;
}

// Robust Subcategory Matcher
export function isProductInSubcategory(p: Product, subcategoryName: string): boolean {
  if (!subcategoryName || subcategoryName === 'All') return true;
  const subLower = subcategoryName.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!subLower) return true;

  // 1. Direct match on product's explicit subcategory field if present (and distinct from parent category)
  const pSub = (p.subcategory || (p as any).subCategory || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const pCat = (p.category || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (pSub && pSub !== pCat) {
    if (pSub === subLower) return true;
    if (pSub.includes(subLower) || subLower.includes(pSub)) return true;
    return false;
  }

  const pText = `${p.name} ${p.specs || ''} ${p.description || ''} ${p.brand || ''}`.toLowerCase();

  // 2. Multi-group rules (e.g. brand + device type)
  const requiredGroups = SUBCATEGORY_MATCH_GROUPS[subLower];
  if (requiredGroups && requiredGroups.length > 0) {
    return requiredGroups.every(group => group.some(term => matchesTerm(pText, term)));
  }

  // 3. Keyword dictionary lookup
  const keywords = SUBCATEGORY_KEYWORDS[subLower];
  if (keywords && keywords.length > 0) {
    return keywords.some(kw => matchesTerm(pText, kw));
  }

  // 4. Strict fallback for custom subcategories: require ALL specific words (excluding generic category words)
  const rawWords = subLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !['and', 'for', 'with', 'the', 'all'].includes(w));

  const specificWords = rawWords.filter(w => !GENERIC_SUBCATEGORY_WORDS.has(w));
  const targetWords = specificWords.length > 0 ? specificWords : rawWords;

  if (targetWords.length > 0) {
    return targetWords.every(w => matchesTerm(pText, `\\b${w}`));
  }

  return false;
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
    const found = availableCategories.find(c => c.toLowerCase().includes('laptop') && !c.toLowerCase().includes('part') && !c.toLowerCase().includes('spare'));
    if (found) return found;
  }
  if (['computer & laptops', 'computers & laptops'].includes(q)) {
    const found = availableCategories.find(c => c.toLowerCase() === 'computer & laptops');
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

  const initialMountDoneRef = React.useRef<boolean>(false);

  // Synchronize browser URL bar query params without page reload
  const updateUrlFilters = (cat: string, sub: string, brand?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (cat && cat !== 'All' && cat !== 'All Products') {
        url.searchParams.set('cat', cat);
      } else {
        url.searchParams.delete('cat');
        url.searchParams.delete('category');
      }
      if (sub && sub !== 'All') {
        url.searchParams.set('sub', sub);
      } else {
        url.searchParams.delete('sub');
        url.searchParams.delete('subcat');
      }
      if (brand && brand !== 'All') {
        url.searchParams.set('brand', brand);
      } else {
        url.searchParams.delete('brand');
      }
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    } catch (e) {
      // ignore
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedSubcategory('All');
    setDisplayLimit(24);
    updateUrlFilters(catName, 'All', selectedBrand);
  };

  const handleSubcategorySelect = (subName: string) => {
    setSelectedSubcategory(subName);
    setDisplayLimit(24);
    updateUrlFilters(selectedCategory, subName, selectedBrand);
  };

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrand(brandName);
    setDisplayLimit(24);
    updateUrlFilters(selectedCategory, selectedSubcategory, brandName);
  };

  // 1. URL param and prop synchronization (always keeps category and subcategory in sync with navigation)
  useEffect(() => {
    if (initialCategory) {
      if (initialCategory !== 'All' && initialCategory !== 'All Products') {
        const allCatNames = Array.from(new Set([
          ...products.map(p => p.category).filter(Boolean),
          ...(cmsCategories || []).filter(c => !c.parentId).map(c => c.name).filter(Boolean),
        ]));
        const canonical = normalizeToCanonicalCategory(initialCategory, allCatNames);
        setSelectedCategory(canonical || initialCategory);
      } else {
        setSelectedCategory(initialCategory);
      }
    }
  }, [initialCategory, products, cmsCategories]);

  useEffect(() => {
    setSelectedSubcategory(initialSubcategory || 'All');
  }, [initialSubcategory]);

  // 2. Browser Back / Forward button support
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const c = sp.get('cat') || sp.get('category') || 'All';
      const s = sp.get('sub') || sp.get('subcat') || 'All';
      const b = sp.get('brand') || 'All';
      setSelectedCategory(c);
      setSelectedSubcategory(s);
      setSelectedBrand(b);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Dynamic Categories organized from CMS, Taxonomy & Real Inventory
  const categories = useMemo(() => {
    const list: { name: string; icon: any; count: number }[] = [
      { name: 'All', icon: LayoutGrid, count: products.length }
    ];

    const seen = new Set<string>();
    seen.add('all');

    // Source categories: prefer active CMS categories, fallback/complement with DEFAULT_TAXONOMY_CATEGORIES
    const sourceCategories = (Array.isArray(cmsCategories) && cmsCategories.length > 0)
      ? cmsCategories
      : DEFAULT_TAXONOMY_CATEGORIES;

    // 1. First add all primary CMS categories in exact position order
    sourceCategories
      .filter((c: any) => c.status !== 'inactive' && !c.parentId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .forEach((c) => {
        const cName = c.name.trim();
        if (!seen.has(cName.toLowerCase())) {
          seen.add(cName.toLowerCase());
          const count = products.filter(p => isProductInCategory(p, cName)).length;
          list.push({
            name: cName,
            icon: getCategoryIcon(cName),
            count,
          });
        }
      });

    // 2. Also ensure all categories from DEFAULT_TAXONOMY_CATEGORIES are present if CMS had fewer
    DEFAULT_TAXONOMY_CATEGORIES.forEach((c) => {
      const cName = c.name.trim();
      if (!seen.has(cName.toLowerCase())) {
        seen.add(cName.toLowerCase());
        const count = products.filter(p => isProductInCategory(p, cName)).length;
        list.push({
          name: cName,
          icon: getCategoryIcon(cName),
          count,
        });
      }
    });

    // 3. Ensure any category that has active products is included
    products.forEach((p) => {
      const pCat = p.category?.trim();
      if (pCat && !seen.has(pCat.toLowerCase())) {
        seen.add(pCat.toLowerCase());
        const count = products.filter(prod => isProductInCategory(prod, pCat)).length;
        list.push({
          name: pCat,
          icon: getCategoryIcon(pCat),
          count,
        });
      }
    });

    const nonAll = list.slice(1);
    nonAll.sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1;
      if (a.count === 0 && b.count > 0) return 1;
      return 0;
    });

    return [list[0], ...nonAll];
  }, [cmsCategories, products]);

  // Subcategories available under currently selected category (Merged CMS + Taxonomy + Inventory counts)
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'All' || selectedCategory === 'All Products') return [];
    const catLower = selectedCategory.toLowerCase();

    // 1. Find matching CMS category or taxonomy category
    const matched = (cmsCategories || []).find(
      (c) =>
        c.name.toLowerCase() === catLower ||
        c.name.toLowerCase().includes(catLower) ||
        catLower.includes(c.name.toLowerCase()) ||
        c.slug?.toLowerCase() === catLower
    ) || DEFAULT_TAXONOMY_CATEGORIES.find(
      (c) =>
        c.name.toLowerCase() === catLower ||
        c.name.toLowerCase().includes(catLower) ||
        catLower.includes(c.name.toLowerCase()) ||
        c.slug?.toLowerCase() === catLower
    );

    const subMap = new Map<string, { name: string; slug: string; count: number }>();

    if (matched && Array.isArray(matched.subcategories)) {
      matched.subcategories.forEach((s) => {
        if (s.status === 'inactive') return;
        const sName = (s.name || '').replace(/\s+/g, ' ').trim();
        if (sName) {
          const key = sName.toLowerCase();
          if (!subMap.has(key)) {
            subMap.set(key, {
              name: sName,
              slug: s.slug || key.replace(/[^a-z0-9]+/g, '-'),
              count: 0,
            });
          }
        }
      });
    }

    // 2. Also include any extra subcategories stored explicitly in product data (excluding parent category fallback)
    products.forEach((p) => {
      if (!isProductInCategory(p, selectedCategory)) return;
      const pSub = (p.subcategory || (p as any).subCategory || '').replace(/\s+/g, ' ').trim();
      if (pSub && pSub.toLowerCase() !== (p.category || '').trim().toLowerCase() && pSub.toLowerCase() !== catLower) {
        const key = pSub.toLowerCase();
        if (!subMap.has(key)) {
          subMap.set(key, {
            name: pSub,
            slug: key.replace(/[^a-z0-9]+/g, '-'),
            count: 0,
          });
        }
      }
    });

    // 3. Accurately calculate product count for each subcategory
    const catProducts = products.filter(p => isProductInCategory(p, selectedCategory));
    subMap.forEach((subItem) => {
      subItem.count = catProducts.filter(p => isProductInSubcategory(p, subItem.name)).length;
    });

    return Array.from(subMap.values()).sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1;
      if (a.count === 0 && b.count > 0) return 1;
      return 0;
    });
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

  // Filtered products with robust Category & Subcategory matching
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Category Match
      if (selectedCategory !== 'All' && selectedCategory !== 'All Products') {
        if (!isProductInCategory(p, selectedCategory)) {
          return false;
        }
      }

      // 2. Subcategory Match
      if (selectedSubcategory !== 'All') {
        if (!isProductInSubcategory(p, selectedSubcategory)) {
          return false;
        }
      }

      // 3. Brand Match
      if (selectedBrand !== 'All') {
        const pBrand = (p.brand || '').trim().toLowerCase();
        const selBrand = selectedBrand.trim().toLowerCase();
        if (pBrand !== selBrand) {
          return false;
        }
      }

      // 4. In Stock Filter
      if (onlyInStock) {
        const isAvailable = p.inStock !== false && (p.stockQuantity === undefined || p.stockQuantity === null || Number(p.stockQuantity) > 0);
        if (!isAvailable) {
          return false;
        }
      }

      // 5. Price Filter
      if (p.price > maxPrice) {
        return false;
      }

      // 6. Rating Filter
      if (minRating > 0 && (p.rating || 0) < minRating) {
        return false;
      }

      // 7. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesSubcat = (p.subcategory || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesSpecs = (p.specs || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesSubcat && !matchesBrand && !matchesSpecs && !matchesSku) {
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
    setSelectedSubcategory('All');
    setSelectedBrand('All');
    setOnlyInStock(false);
    setMaxPrice(100000);
    setMinRating(0);
    setBrandSearch('');
    setSearchQuery('');
    setDisplayLimit(24);
    updateUrlFilters('All', 'All', 'All');
  };

  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const activeFilterCount = (selectedCategory !== 'All' && selectedCategory !== 'All Products' ? 1 : 0) +
    (selectedSubcategory !== 'All' ? 1 : 0) +
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
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 mb-1 flex-wrap">
            <Link href="/" className="hover:text-[#1A56DB]">Home</Link>
            <span>/</span>
            <button 
              onClick={() => handleCategorySelect('All')} 
              className="text-[#1A56DB] font-semibold hover:underline cursor-pointer"
            >
              Store Catalog
            </button>
            {selectedCategory !== 'All' && selectedCategory !== 'All Products' && (
              <>
                <span>/</span>
                <button
                  onClick={() => handleSubcategorySelect('All')}
                  className={`${selectedSubcategory === 'All' ? 'text-gray-900 font-bold' : 'text-[#1A56DB] hover:underline cursor-pointer'}`}
                >
                  {selectedCategory}
                </button>
              </>
            )}
            {selectedSubcategory !== 'All' && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-bold">{selectedSubcategory}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#111827]">
                {selectedCategory === 'All' || selectedCategory === 'All Products'
                  ? 'All Hardware & Spares Collection' 
                  : (selectedSubcategory !== 'All' ? `${selectedCategory} › ${selectedSubcategory}` : `${selectedCategory}`)}
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {filteredProducts.length} Products Available
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
                        type="button"
                        onClick={() => handleCategorySelect(cat.name)}
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold ${
                          isSelected ? 'bg-[#1A56DB] text-white' : 'text-gray-500 bg-gray-100'
                        }`}>
                          {cat.count}
                        </span>
                      </button>

                      {/* Expandable Subcategories when category is selected */}
                      {isSelected && cat.name !== 'All' && availableSubcategories.length > 0 && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-blue-200 ml-2 animate-in slide-in-from-top-1">
                          <button
                            type="button"
                            onClick={() => handleSubcategorySelect('All')}
                            className={`w-full text-left py-1 px-2 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                              selectedSubcategory === 'All'
                                ? 'font-bold text-[#1A56DB] bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <span>All {cat.name}</span>
                            <span className="text-[9.5px] text-gray-400 font-semibold">{cat.count}</span>
                          </button>
                          {availableSubcategories.map((sub) => {
                            const isSubActive = selectedSubcategory.replace(/\s+/g, ' ').trim().toLowerCase() === sub.name.toLowerCase();

                            return (
                              <button
                                key={sub.name}
                                type="button"
                                onClick={() => handleSubcategorySelect(isSubActive ? 'All' : sub.name)}
                                className={`w-full text-left py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                                  isSubActive
                                    ? 'font-bold text-[#1A56DB] bg-blue-100/90 shadow-2xs border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                <span className="truncate">↳ {sub.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                                  isSubActive ? 'bg-[#1A56DB] text-white' : 'text-gray-500 bg-gray-100'
                                }`}>
                                  {sub.count}
                                </span>
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

            {/* 5. In-Stock Verification Toggle */}
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-emerald-400 text-[#15803D] focus:ring-[#15803D]"
                />
                <div className="font-extrabold text-[12px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>In Stock Only</span>
                </div>
              </label>
            </div>

          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-9 space-y-3.5">
            {/* Active Filter Chips Strip (Flipkart / Amazon Style) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-white border border-[#E5E7EB] rounded-xl shadow-2xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Active:</span>
                {selectedCategory !== 'All' && selectedCategory !== 'All Products' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1A56DB] border border-blue-200">
                    Category: {selectedCategory}
                    <button
                      onClick={() => handleCategorySelect('All')}
                      className="hover:text-red-500 cursor-pointer ml-1"
                      title="Clear category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSubcategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-[#1A56DB] border border-blue-300">
                    Subcategory: {selectedSubcategory}
                    <button
                      onClick={() => handleSubcategorySelect('All')}
                      className="hover:text-red-500 cursor-pointer ml-1"
                      title="Clear subcategory filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedBrand !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
                    Brand: {selectedBrand}
                    <button
                      onClick={() => handleBrandSelect('All')}
                      className="hover:text-red-500 cursor-pointer ml-1"
                      title="Clear brand filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-500 cursor-pointer ml-1"
                      title="Clear search query"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF] hover:underline cursor-pointer ml-auto"
                >
                  Clear All
                </button>
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
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-[#1A56DB]">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {selectedSubcategory !== 'All' 
                    ? `No products found in "${selectedSubcategory}"` 
                    : (selectedCategory !== 'All' ? `No products found in "${selectedCategory}"` : 'No products match your criteria')}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  {selectedSubcategory !== 'All'
                    ? `Currently there are no showroom products cataloged under this subcategory. You can view all ${selectedCategory} products or reset your filters.`
                    : 'Try adjusting the category, lowering the price threshold, or searching for a broader term.'}
                </p>
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  {selectedSubcategory !== 'All' && selectedCategory !== 'All' && (
                    <button
                      onClick={() => handleSubcategorySelect('All')}
                      className="px-4 py-2 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      View All {selectedCategory} Products
                    </button>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
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
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider block">
                    Select Category
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold">
                    {categories.length - 1} Categories
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const count = cat.name === 'All' ? products.length : cat.count;
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase() || (cat.name === 'All' && selectedCategory === 'All Products');
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold border flex items-center justify-between gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#1A56DB] text-[#1A56DB] font-extrabold shadow-2xs'
                            : 'bg-[#F9FAFB] hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                          isSelected ? 'bg-[#1A56DB] text-white' : 'text-gray-500 bg-gray-200/70'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategories (When Category is selected) */}
              {selectedCategory !== 'All' && selectedCategory !== 'All Products' && availableSubcategories.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider block">
                      Subcategories in {selectedCategory}
                    </span>
                    {selectedSubcategory !== 'All' && (
                      <button
                        type="button"
                        onClick={() => handleSubcategorySelect('All')}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Reset to All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => handleSubcategorySelect('All')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSubcategory === 'All'
                          ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      All {selectedCategory}
                    </button>
                    {availableSubcategories.map((sub) => {
                      const isSubSelected = selectedSubcategory.replace(/\s+/g, ' ').trim().toLowerCase() === sub.name.toLowerCase();
                      return (
                        <button
                          key={sub.name}
                          type="button"
                          onClick={() => handleSubcategorySelect(isSubSelected ? 'All' : sub.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSubSelected
                              ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-2xs'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span className={`text-[9.5px] px-1 py-0.2 rounded-full font-semibold ${
                            isSubSelected ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    onClick={() => handleBrandSelect('All')}
                    className={`px-2.5 py-1 rounded-md text-xs border font-medium transition-colors cursor-pointer ${
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
                      onClick={() => handleBrandSelect(b.name)}
                      className={`px-2.5 py-1 rounded-md text-xs border font-medium transition-colors cursor-pointer ${
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

              {/* In-Stock Checkbox */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2.5 text-xs text-gray-800 font-semibold cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A56DB] focus:ring-[#1A56DB]"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

            </div>

            {/* Bottom Apply CTA */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  updateUrlFilters(selectedCategory, selectedSubcategory, selectedBrand);
                  setMobileFilterOpen(false);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
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
