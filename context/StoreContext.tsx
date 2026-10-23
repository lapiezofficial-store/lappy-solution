'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { STORE_INFO, INITIAL_ORDERS, INITIAL_LEADS } from '../data/storeData';
import { CartItem } from '../components/CartDrawer';
import { 
  Invoice, 
  InvoiceSettings, 
  DEFAULT_INVOICE_SETTINGS, 
  buildInvoiceFromOrder, 
  formatInvoiceNumber 
} from '../lib/invoiceUtils';
import { supabase, signInWithGoogle, signOutCustomer, User } from '../lib/supabase';
import { Coupon, INITIAL_COUPONS, calculateCouponDiscount } from '../data/coupons';
import { CMSBrand, DEFAULT_BRANDS } from '../data/brands';
import { CATEGORIES } from '../data/categories';
import { INITIAL_BANNERS } from '../data/banners';

export interface CMSSubcategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  parentId?: string | null;
  startingPrice?: string | null;
  position?: number;
  status?: string;
  itemCount?: number;
}

export interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  imageUrl?: string;
  href?: string;
  startingPrice?: string | null;
  position?: number;
  status?: string;
  parentId?: string | null;
  title?: string;
  shortDesc?: string;
  iconName?: string;
  subcategories: CMSSubcategory[];
}

export type { Coupon, CMSBrand };


export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  timings: string;
  announcementText: string;
  maintenanceMode: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  googleMapsUrl?: string;
}

export interface PaymentMethodsConfig {
  enableUPI: boolean;
  enableBankTransfer: boolean;
  enableStorePickup: boolean;
  enableCOD: boolean;
}

export const DEFAULT_PAYMENT_METHODS_CONFIG: PaymentMethodsConfig = {
  enableUPI: true,
  enableBankTransfer: true,
  enableStorePickup: true,
  enableCOD: true,
};

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  dealColor: string;
  canvasBg: string;
  fontFamily: string;
  borderRadius: string;
}

export interface BankAccount {
  id: string;
  accountHolderName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  accountType?: 'Current' | 'Savings';
  upiId?: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-union-01',
    accountHolderName: 'lappy solutions',
    bankName: 'Union Bank of India',
    branch: 'GARHWA',
    accountNumber: '638301010050261',
    ifscCode: 'UBIN0563838',
    accountType: 'Current',
    upiId: 'lappy.solution@ybl',
    isPrimary: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export interface PaymentSettings {
  upiId: string;
  upiName: string;
  codEnabled: boolean;
  gstRate: number;
  gstin: string;
  bankAccountsJson?: string;
}

export interface CMSBanner {
  id: string;
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  badge?: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText: string;
  buttonUrl: string;
  whatsappMsg?: string;
  bgGradient: string;
  position: number;
  status: string;
}

export interface CMSSection {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  productIds?: string | string[] | null;
  position: number;
  isVisible: boolean;
}

export interface CMSCustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CMSBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
  tags?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  wishlistIds: string[];
  orders: any[];
  leads: any[];
  siteSettings: SiteSettings;
  themeSettings: ThemeSettings;
  paymentSettings: PaymentSettings;
  paymentMethodsConfig: PaymentMethodsConfig;
  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => Promise<BankAccount>;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<boolean>;
  deleteBankAccount: (id: string) => Promise<boolean>;
  setPrimaryBankAccount: (id: string) => Promise<boolean>;
  banners: CMSBanner[];
  homepageSections: CMSSection[];
  customPages: CMSCustomPage[];
  blogPosts: CMSBlogPost[];
  invoices: Invoice[];
  invoiceSettings: InvoiceSettings;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  isAppModalOpen: boolean;
  setIsAppModalOpen: (open: boolean) => void;
  accountTab: 'orders' | 'cart' | 'wishlist';
  setAccountTab: (tab: 'orders' | 'cart' | 'wishlist') => void;
  toast: string | null;
  showToast: (msg: string) => void;
  addToCart: (p: Product, qty?: number) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (p: Product) => void;
  placeOrder: (order: any) => Promise<Invoice>;
  createLead: (lead: any) => void;
  updateProducts: (prods: Product[]) => void;
  updateOrders: (ords: any[]) => void;
  fetchOrders: () => Promise<any[]>;
  updateLeads: (lds: any[]) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  updateThemeSettings: (theme: Partial<ThemeSettings>) => Promise<void>;
  updatePaymentSettings: (payment: Partial<PaymentSettings>) => Promise<void>;
  updatePaymentMethodsConfig: (config: Partial<PaymentMethodsConfig>) => Promise<void>;
  updateStoreAndPaymentSettings: (site: Partial<SiteSettings>, payment: Partial<PaymentSettings>, methodsConfig?: Partial<PaymentMethodsConfig>) => Promise<void>;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
  createInvoiceFromOrder: (order: any, buyerGstin?: string, isInterstate?: boolean) => Invoice;
  createManualInvoice: (invoice: Partial<Invoice>) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (idOrNumber: string) => Invoice | undefined;
  getInvoiceByOrderId: (orderId: string) => Invoice | undefined;
  updateBanners: (banners: CMSBanner[]) => Promise<void>;
  addBanner: (banner: Partial<CMSBanner>) => Promise<void>;
  editBanner: (banner: CMSBanner) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  resetBannersToDefault: () => Promise<boolean>;
  addProductToDb: (prod: Partial<Product>) => Promise<Product | void>;
  updateProductInDb: (id: string, updatedFields: Partial<Product>) => Promise<boolean>;
  deleteProductFromDb: (id: string, permanent?: boolean) => Promise<void>;
  wipeAllProductsFromDb: () => Promise<boolean>;
  trashProducts: Product[];
  isLoadingTrash: boolean;
  fetchTrashProducts: () => Promise<void>;
  restoreProductFromDb: (id: string) => Promise<void>;
  restoreAllTrash: () => Promise<void>;
  emptyTrashDb: () => Promise<void>;
  updateHomepageSections: (sections: CMSSection[]) => Promise<void>;
  updateHomepageSectionDetails: (sectionKey: string, details: Partial<CMSSection>) => Promise<void>;
  updateHomepageSectionProducts: (sectionKey: string, productIds: string[]) => Promise<void>;
  resetHomepageSectionsToDefault: () => Promise<void>;
  makeAllHomepageSectionsVisible: () => Promise<void>;
  addCustomPage: (page: Partial<CMSCustomPage>) => Promise<CMSCustomPage>;
  editCustomPage: (page: CMSCustomPage) => Promise<void>;
  deleteCustomPage: (id: string) => Promise<void>;
  addBlogPost: (post: Partial<CMSBlogPost>) => Promise<CMSBlogPost>;
  editBlogPost: (post: CMSBlogPost) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  syncWithDatabase: (options?: { forceFresh?: boolean }) => Promise<void>;
  customer: User | null;
  isCustomerLoading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  loginCustomerManually: (userData: { id?: string; email: string; name?: string; picture?: string; phone?: string }) => void;
  signOutCustomer: () => Promise<void>;
  isCustomerAuthModalOpen: boolean;
  openCustomerAuthModal: (redirectTo?: string) => void;
  closeCustomerAuthModal: () => void;
  authRedirectUrl: string | null;
  isApp: boolean;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (code: string, orderTotal: number) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  createCoupon: (couponData: any) => Promise<{ success: boolean; message?: string }>;
  updateCoupon: (id: string, couponData: any) => Promise<{ success: boolean; message?: string }>;
  deleteCoupon: (id: string) => Promise<{ success: boolean; message?: string }>;
  fetchCoupons: () => Promise<void>;
  brands: CMSBrand[];
  addBrand: (brandData: Partial<CMSBrand>) => Promise<CMSBrand | null>;
  updateBrand: (id: string, updates: Partial<CMSBrand>) => Promise<boolean>;
  deleteBrand: (id: string) => Promise<boolean>;
  reorderBrands: (newBrands: CMSBrand[]) => Promise<boolean>;
  resetBrandsToDefault: () => Promise<boolean>;
  categories: CMSCategory[];
  addCategory: (catData: Partial<CMSCategory>) => Promise<CMSCategory | null>;
  updateCategory: (id: string, updates: Partial<CMSCategory>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  addSubcategory: (parentId: string, subData: Partial<CMSSubcategory>) => Promise<CMSSubcategory | null>;
  updateSubcategory: (id: string, updates: Partial<CMSSubcategory>) => Promise<boolean>;
  deleteSubcategory: (id: string) => Promise<boolean>;
  reorderCategories: (newCategories: CMSCategory[]) => Promise<boolean>;
  resetCategoriesToDefault: () => Promise<boolean>;
  fetchCategories: () => Promise<void>;
}

export const DEFAULT_SHOP_BY_CATEGORIES: CMSCategory[] = [
  {
    id: 'cat-laptops',
    name: 'Computer & Laptops',
    slug: 'laptops',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/242BcPaL.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/242BcPaL.webp',
    startingPrice: 'Starting ₹9,999',
    position: 0,
    status: 'active',
    subcategories: [
      { id: '6282348', name: 'Desktop & Laptops', slug: 'desktop-laptops', startingPrice: '', position: 0, status: 'active', parentId: 'cat-laptops' },
      { id: '6282546', name: 'Refurbished Laptops', slug: 'refurbished', startingPrice: '', position: 1, status: 'active', parentId: 'cat-laptops' },
      { id: 'sub-gaming-pc', name: 'Custom Desktop PC Rigs', slug: 'custom-pcs', startingPrice: '', position: 2, status: 'active', parentId: 'cat-laptops' },
    ],
    href: '/shop?cat=Laptops',
  },
  {
    id: 'cat-laptop-parts',
    name: 'Laptop Parts & Spares',
    slug: 'laptop-parts',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/cJZR0B6A.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/cJZR0B6A.webp',
    startingPrice: 'Starting ₹650',
    position: 1,
    status: 'active',
    subcategories: [
      { id: '6282354', name: 'Laptop Battery', slug: 'laptop-battery', startingPrice: '', position: 0, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282357', name: 'Laptop Adaptor', slug: 'laptop-adaptor', startingPrice: '', position: 1, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282356', name: 'Laptop Body', slug: 'laptop-body', startingPrice: '', position: 2, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282347', name: 'Laptop Parts', slug: 'laptop-parts-4', startingPrice: '', position: 3, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282355', name: 'Laptop Keyboards', slug: 'laptop-keyboards', startingPrice: '', position: 4, status: 'active', parentId: 'cat-laptop-parts' },
      { id: 'cmv8x80uh0000jp06usrkmxwk', name: 'Laptop Screen', slug: 'laptop--screen', startingPrice: '', position: 5, status: 'active', parentId: 'cat-laptop-parts' },
    ],
    href: '/shop?cat=Laptop%20Parts',
  },
  {
    id: 'cat-peripherals',
    name: 'Computer Peripherals',
    slug: 'peripherals',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/q1ZdCuDa.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/q1ZdCuDa.webp',
    startingPrice: 'Starting ₹199',
    position: 2,
    status: 'active',
    subcategories: [
      { id: '6282351', name: 'Mouse & Keyboard', slug: 'mouse-keyboard', startingPrice: '', position: 0, status: 'active', parentId: 'cat-peripherals' },
      { id: '6283522', name: 'Speakers & Soundbars', slug: 'speakers', startingPrice: '', position: 1, status: 'active', parentId: 'cat-peripherals' },
      { id: '6282349', name: 'Computer Peripherals', slug: 'pc-peripherals', startingPrice: '', position: 2, status: 'active', parentId: 'cat-peripherals' },
      { id: '6282352', name: 'Cable & Connector (HDMI/VGA/Power)', slug: 'cables-connectors', startingPrice: '', position: 3, status: 'active', parentId: 'cat-peripherals' },
    ],
    href: '/shop?cat=Peripherals',
  },
  {
    id: 'cat-printers',
    name: 'Printers',
    slug: 'printers',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/ZIB6owYD.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/ZIB6owYD.webp',
    startingPrice: 'Starting ₹9,999',
    position: 3,
    status: 'active',
    subcategories: [
      { id: '6282340', name: 'Printers (InkTank & Laser)', slug: 'printers-list', startingPrice: '', position: 0, status: 'active', parentId: 'cat-printers' },
      { id: '6282341', name: 'Toner & Ink Bottles', slug: 'toner-ink', startingPrice: '', position: 1, status: 'active', parentId: 'cat-printers' },
      { id: '6287242', name: 'Paper & Sticker Sheets', slug: 'paper-sticker', startingPrice: '', position: 2, status: 'active', parentId: 'cat-printers' },
      { id: '5998950', name: 'Printer Spare Parts & Rollers', slug: 'printer-parts', startingPrice: '', position: 3, status: 'active', parentId: 'cat-printers' },
    ],
    href: '/shop?cat=Printers',
  },
  {
    id: 'cat-cctv',
    name: 'CCTV & Security',
    slug: 'cctv-security',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034738/lapiez/categories/tmqqbyejjsmmmogqlwlh.jpg',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034738/lapiez/categories/tmqqbyejjsmmmogqlwlh.jpg',
    startingPrice: 'Starting ₹1,250',
    position: 4,
    status: 'active',
    subcategories: [
      { id: '6282350', name: 'CCTV Cameras (Dome/Bullet/Wi-Fi)', slug: 'cctv-cameras', startingPrice: '', position: 0, status: 'active', parentId: 'cat-cctv' },
      { id: '6282353', name: 'Biometric Attendance & Scanners', slug: 'biometric-scanners', startingPrice: '', position: 1, status: 'active', parentId: 'cat-cctv' },
    ],
    href: '/shop?cat=CCTV%20%26%20Security',
  },
  {
    id: 'cat-storage',
    name: 'Storage & Memory',
    slug: 'storage',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034503/lapiez/categories/eqqtzkb1o6r7ctxzz3a3.jpg',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034503/lapiez/categories/eqqtzkb1o6r7ctxzz3a3.jpg',
    startingPrice: 'Starting ₹399',
    position: 5,
    status: 'active',
    subcategories: [
      { id: '6282406', name: 'SSD & Hard Disk', slug: 'ssd-hard-disk', startingPrice: '', position: 0, status: 'active', parentId: 'cat-storage' },
      { id: '6282407', name: 'Pendrive & SD Card', slug: 'pendrive-sd-card', startingPrice: '', position: 1, status: 'active', parentId: 'cat-storage' },
    ],
    href: '/shop?cat=Storage%20%26%20Memory',
  },
  {
    id: 'cat-software',
    name: 'Antivirus & Software',
    slug: 'antivirus',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/M0Si0HDm.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/M0Si0HDm.webp',
    startingPrice: 'Starting ₹350',
    position: 6,
    status: 'active',
    subcategories: [
      { id: '6282549', name: 'Antivirus (Quick Heal / Total Security)', slug: 'antivirus-keys', startingPrice: '', position: 0, status: 'active', parentId: 'cat-software' },
    ],
    href: '/shop?search=Antivirus',
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & Audio',
    slug: 'electronics',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/bYcAegxA.webp',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/bYcAegxA.webp',
    startingPrice: 'Starting ₹299',
    position: 7,
    status: 'active',
    subcategories: [
      { id: '6282405', name: 'Electronics & Gadgets', slug: 'gadgets', startingPrice: '', position: 0, status: 'active', parentId: 'cat-electronics' },
    ],
    href: '/shop?search=Speaker',
  },
  {
    id: 'cmv8xmqla0000ld06okzims12',
    name: 'Toner & ink',
    slug: 'toner---ink',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032072/lapiez/categories/nk41zet4lmioaljhedb8.jpg',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032072/lapiez/categories/nk41zet4lmioaljhedb8.jpg',
    startingPrice: 'Starting ₹499',
    position: 8,
    status: 'active',
    subcategories: [],
    href: '/shop?search=Toner',
  },
  {
    id: 'cmv8xxzob0001ky0633l9qsg0',
    name: 'Printer Parts',
    slug: 'printer-parts-1',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032587/lapiez/categories/juhkokvaxtgsjtzehzch.jpg',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032587/lapiez/categories/juhkokvaxtgsjtzehzch.jpg',
    startingPrice: 'Starting ₹100',
    position: 9,
    status: 'active',
    subcategories: [],
    href: '/shop?search=Printer%20Parts',
  },
  {
    id: 'cmv8y3vbf0002ky06z8rhpygf',
    name: 'Refurbished',
    slug: 'refurbished-1',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032874/lapiez/categories/soygmudbo94aeuoxchrb.jpg',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792032874/lapiez/categories/soygmudbo94aeuoxchrb.jpg',
    startingPrice: 'Starting ₹100',
    position: 10,
    status: 'active',
    subcategories: [],
    href: '/shop?condition=refurbished',
  },
];

export const DEFAULT_CMS_CATEGORIES: CMSCategory[] = DEFAULT_SHOP_BY_CATEGORIES;
export const CORE_STORE_DEPARTMENTS: CMSCategory[] = DEFAULT_SHOP_BY_CATEGORIES;


const defaultSiteSettings: SiteSettings = {
  siteName: STORE_INFO.name,
  tagline: STORE_INFO.tagline,
  logo: '',
  favicon: '/favicon.ico',
  phone: STORE_INFO.phone,
  whatsapp: STORE_INFO.whatsapp,
  email: STORE_INFO.email,
  address: `${STORE_INFO.address}, ${STORE_INFO.city}, ${STORE_INFO.state} - ${STORE_INFO.pincode}`,
  timings: STORE_INFO.timings,
  announcementText: '100% Asli Samaan • 18% GST Bill • Garhwa & Palamu Delivery',
  maintenanceMode: false,
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  twitterUrl: STORE_INFO.mapsUrl,
  googleMapsUrl: STORE_INFO.mapsUrl,
};

const defaultThemeSettings: ThemeSettings = {
  primaryColor: '#1A56DB',
  secondaryColor: '#FB641B',
  dealColor: '#15803D',
  canvasBg: '#F1F3F6',
  fontFamily: 'Plus Jakarta Sans',
  borderRadius: '12px',
};

const defaultPaymentSettings: PaymentSettings = {
  upiId: 'lappy.solution@ybl',
  upiName: 'LAPIEZ GARHWA',
  codEnabled: true,
  gstRate: 18,
  gstin: '20AABCL1234F1Z5',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function isDemoProduct(p: any): boolean {
  if (!p) return false;
  if (p.id && (String(p.id).startsWith('prod-flagship-') || String(p.id).startsWith('prod-demo-'))) return true;
  return false;
}

export function normalizeProduct(p: any): Product {
  let galleryImages: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    galleryImages = p.images
      .flatMap((s: any) => typeof s === 'string' && s.includes('|||') ? s.split('|||') : [s])
      .map((s: string) => String(s).trim())
      .filter(Boolean);
  } else if (typeof p.image === 'string' && p.image.includes('|||')) {
    galleryImages = p.image.split('|||').map((s: string) => s.trim()).filter(Boolean);
  } else if (typeof p.image === 'string' && p.image.startsWith('[')) {
    try {
      const parsed = JSON.parse(p.image);
      if (Array.isArray(parsed)) galleryImages = parsed.map((s: string) => String(s).trim()).filter(Boolean);
    } catch (e) {}
  } else if (p.image) {
    galleryImages = [String(p.image).trim()];
  }

  const primaryImage = galleryImages[0] || (typeof p.image === 'string' ? p.image.split('|||')[0].trim() : '') || '/images/product-placeholder.svg';
  const resolvedSubcat = p.subcategory || p.subCategory || '';

  return {
    ...p,
    subcategory: resolvedSubcat,
    subCategory: resolvedSubcat,
    image: primaryImage,
    images: galleryImages.length > 0 ? galleryImages : [primaryImage],
  };
}

export function serializeBankAccountsWithConfig(accounts: BankAccount[], config: PaymentMethodsConfig): string {
  const clean = accounts.filter(a => a.id !== '__payment_methods_config__');
  const payload = [
    ...clean,
    {
      id: '__payment_methods_config__',
      enableUPI: config.enableUPI !== false,
      enableBankTransfer: config.enableBankTransfer !== false,
      enableStorePickup: config.enableStorePickup !== false,
      enableCOD: config.enableCOD !== false,
    }
  ];
  return JSON.stringify(payload);
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isApp, setIsApp] = useState(false);
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string | null>(null);

  const openCustomerAuthModal = (redirectTo?: string) => {
    if (redirectTo) setAuthRedirectUrl(redirectTo);
    setIsCustomerAuthModalOpen(true);
  };

  const closeCustomerAuthModal = () => {
    setIsCustomerAuthModalOpen(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const searchParams = new URLSearchParams(window.location.search);
    const isFromUrl = searchParams.get('app') === 'true' || searchParams.get('isApp') === 'true';
    const isSavedApp = localStorage.getItem('isLapiezApp') === 'true';
    const isNativeUA = /LapiezApp|LapiezAndroidApp/i.test(ua);
    const isWebView = /wv|Android.*Version\/[0-9.]+/i.test(ua) && !/Chrome\/[0-9.]+ Mobile/i.test(ua);

    if (isFromUrl || isSavedApp || isNativeUA || isWebView) {
      setIsApp(true);
      try {
        localStorage.setItem('isLapiezApp', 'true');
      } catch (e) {}
    }
  }, []);

  function safeSaveProductsToLocalStorage(productsList: Product[]) {
    if (typeof window === 'undefined') return;
    try {
      // Safely cache up to 100 products to prevent localStorage 5MB QuotaExceededError and browser freezing when catalog scales to 10,000+ items
      localStorage.setItem('ls_products', JSON.stringify(productsList.slice(0, 100)));
    } catch (e) {
      // Safely ignore QuotaExceededError
    }
  }

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasReset = localStorage.getItem('ls_catalog_fresh_start_2026');
        if (!hasReset) {
          localStorage.removeItem('ls_products');
          localStorage.setItem('ls_catalog_fresh_start_2026', 'true');
          return [];
        }
        const saved = localStorage.getItem('ls_products');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(normalizeProduct);
          }
        }
      } catch (e) {}
    }
    return [];
  });
  const [trashProducts, setTrashProducts] = useState<Product[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<PaymentMethodsConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ls_payment_methods_config');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_PAYMENT_METHODS_CONFIG;
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANK_ACCOUNTS);
  const [banners, setBanners] = useState<CMSBanner[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ls_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_BANNERS;
  });
  const [homepageSections, setHomepageSections] = useState<CMSSection[]>([]);
  const [customPages, setCustomPages] = useState<CMSCustomPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<CMSBlogPost[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [brands, setBrands] = useState<CMSBrand[]>(DEFAULT_BRANDS);
  const [categories, setCategories] = useState<CMSCategory[]>(DEFAULT_CMS_CATEGORIES);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<'orders' | 'cart' | 'wishlist'>('orders');
  const [toast, setToast] = useState<string | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  // Monitor Supabase Customer Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCustomer(session.user);
      } else {
        try {
          const local = localStorage.getItem('ls_customer_session');
          if (local) setCustomer(JSON.parse(local));
        } catch (e) {}
      }
      setIsCustomerLoading(false);
    }).catch(() => {
      try {
        const local = localStorage.getItem('ls_customer_session');
        if (local) setCustomer(JSON.parse(local));
      } catch (e) {}
      setIsCustomerLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCustomer(session.user);
        try {
          localStorage.setItem('ls_customer_session', JSON.stringify(session.user));
        } catch (e) {}
      }
      setIsCustomerLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginCustomerManually = (userData: { id?: string; email: string; name?: string; picture?: string; phone?: string }) => {
    const userObj: any = {
      id: userData.id || `usr-${Date.now()}`,
      email: userData.email,
      phone: userData.phone || '',
      user_metadata: {
        full_name: userData.name || userData.email.split('@')[0],
        name: userData.name || userData.email.split('@')[0],
        avatar_url: userData.picture || '',
        picture: userData.picture || '',
        email: userData.email,
        phone: userData.phone || '',
        provider: 'google',
      },
    };
    setCustomer(userObj);
    try {
      localStorage.setItem('ls_customer_session', JSON.stringify(userObj));
    } catch (e) {}
    showToast(`Welcome ${userObj.user_metadata.full_name}! Account Connected.`);
  };

  const handleSignInWithGoogle = async (redirectTo?: string) => {
    if (redirectTo) setAuthRedirectUrl(redirectTo);

    // 1. In standard desktop browser, try Google Identity Services One Tap prompt in background if available
    try {
      const google = typeof window !== 'undefined' ? (window as any).google : null;
      if (google?.accounts?.id && !isApp) {
        google.accounts.id.prompt();
      }
    } catch (e) {}

    // 2. Open dedicated CustomerAuthModal instantly for guaranteed login
    setIsCustomerAuthModalOpen(true);
  };

  const handleSignOutCustomer = async () => {
    try {
      await signOutCustomer().catch(() => {});
    } catch (err: any) {}
    setCustomer(null);
    try {
      localStorage.removeItem('ls_customer_session');
      localStorage.removeItem('ls_orders');
      localStorage.removeItem('ls_customer_profile');
      localStorage.removeItem('ls_customer_addresses');
      localStorage.removeItem('ls_customer_gst');
      localStorage.removeItem('ls_last_order');
      localStorage.removeItem('ls_last_invoice');
    } catch (e) {}
    setOrders([]);
    showToast('Signed out of customer account');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };


  // Synchronize state with Database via unified /api/cms/init endpoint
  const syncWithDatabase = useCallback(async (options?: { forceFresh?: boolean }) => {
    try {
      // 1. Unified Fast Batch Fetch (Edge CDN Cached / Force Fresh on Admin updates)
      const url = options?.forceFresh ? '/api/cms/init?fresh=true' : '/api/cms/init';
      const resInit = await fetch(url);
      if (resInit.ok) {
        const initData = await resInit.json();

        // 1. Settings
        if (initData.siteSettings) {
          const site = {
            ...initData.siteSettings,
            siteName: initData.siteSettings.siteName || 'Lapiez',
            googleMapsUrl: initData.siteSettings.googleMapsUrl || initData.siteSettings.twitterUrl || STORE_INFO.mapsUrl,
            twitterUrl: initData.siteSettings.twitterUrl || STORE_INFO.mapsUrl,
          };
          setSiteSettings(site);
          try {
            localStorage.setItem('ls_site_settings', JSON.stringify(site));
          } catch (e) {}
        }
        if (initData.paymentSettings) {
          const payment = {
            ...initData.paymentSettings,
            upiId: initData.paymentSettings.upiId || 'lappy.solution@ybl',
            upiName: initData.paymentSettings.upiName || 'LAPIEZ GARHWA',
          };
          setPaymentSettings(payment);
          try {
            localStorage.setItem('ls_payment_settings', JSON.stringify(payment));
          } catch (e) {}

          if (initData.paymentSettings.bankAccountsJson) {
            try {
              const parsedBanks = JSON.parse(initData.paymentSettings.bankAccountsJson);
              if (Array.isArray(parsedBanks) && parsedBanks.length > 0) {
                const configObj = parsedBanks.find((b: any) => b.id === '__payment_methods_config__');
                const realBanks = parsedBanks.filter((b: any) => b.id !== '__payment_methods_config__');

                if (configObj) {
                  const resolvedConfig: PaymentMethodsConfig = {
                    enableUPI: configObj.enableUPI !== false,
                    enableBankTransfer: configObj.enableBankTransfer !== false,
                    enableStorePickup: configObj.enableStorePickup !== false,
                    enableCOD: configObj.enableCOD !== false && initData.paymentSettings.codEnabled !== false,
                  };
                  setPaymentMethodsConfig(resolvedConfig);
                  try {
                    localStorage.setItem('ls_payment_methods_config', JSON.stringify(resolvedConfig));
                  } catch (e) {}
                } else if (initData.paymentSettings.codEnabled !== undefined) {
                  setPaymentMethodsConfig((prev) => ({
                    ...prev,
                    enableCOD: Boolean(initData.paymentSettings.codEnabled),
                  }));
                }

                if (realBanks.length > 0) {
                  setBankAccounts(realBanks);
                  try {
                    localStorage.setItem('ls_bank_accounts', JSON.stringify(realBanks));
                  } catch (e) {}
                  const primary = realBanks.find((b: any) => b.isPrimary) || realBanks[0];
                  if (primary) {
                    setInvoiceSettings((prev) => ({
                      ...prev,
                      accountHolderName: primary.accountHolderName || prev.accountHolderName,
                      bankName: primary.bankName || prev.bankName,
                      accountNumber: primary.accountNumber || prev.accountNumber,
                      ifscCode: primary.ifscCode || prev.ifscCode,
                      branch: primary.branch || prev.branch,
                    }));
                  }
                }
              }
            } catch (e) {}
          }
        }

        // 2. Theme
        if (initData.themeSettings) {
          setThemeSettings(initData.themeSettings);
        }

        // 3. Banners
        if (initData.banners && Array.isArray(initData.banners) && initData.banners.length > 0) {
          setBanners(initData.banners);
          try {
            localStorage.setItem('ls_banners', JSON.stringify(initData.banners));
          } catch (e) {}
        } else {
          setBanners((prev) => (prev && prev.length > 0 ? prev : INITIAL_BANNERS));
        }

        // 4. Homepage Sections
        if (initData.homepageSections && Array.isArray(initData.homepageSections) && initData.homepageSections.length > 0) {
          setHomepageSections(initData.homepageSections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(initData.homepageSections));
          } catch (e) {}
        }

        // 5. Categories
        if (initData.categories && Array.isArray(initData.categories) && initData.categories.length > 0) {
          setCategories(initData.categories);
          try {
            localStorage.setItem('ls_categories', JSON.stringify(initData.categories));
          } catch (e) {}
        }

        // 6. Products: Database is the authoritative source of truth
        if (initData.products && Array.isArray(initData.products)) {
          if (initData.products.length === 0) {
            if (options?.forceFresh) {
              setProducts([]);
              try {
                localStorage.setItem('ls_products', '[]');
              } catch (e) {}
            }
          } else {
            const cleanProds = initData.products
              .filter((p: any) => !isDemoProduct(p))
              .map(normalizeProduct);

            // Fast DB index maps for exact SKU, Name, and ID matching
            const dbBySku = new Map<string, Product>();
            const dbByName = new Map<string, Product>();
            const dbById = new Map<string, Product>();
            cleanProds.forEach((p: Product) => {
              if (p.sku) dbBySku.set(p.sku.trim().toLowerCase(), p);
              if (p.name) dbByName.set(p.name.trim().toLowerCase(), p);
              if (p.id) dbById.set(p.id.trim().toLowerCase(), p);
            });

            setProducts((prev) => {
              const nextList = cleanProds;

              // Deep check to prevent re-rendering when state is already identical
              if (
                prev.length === nextList.length &&
                prev.every((item, i) => 
                  item.id === nextList[i]?.id && 
                  item.price === nextList[i]?.price && 
                  item.inStock === nextList[i]?.inStock &&
                  item.stockQuantity === nextList[i]?.stockQuantity
                )
              ) {
                return prev;
              }

              safeSaveProductsToLocalStorage(nextList);

              return nextList;
            });
          }
        }

        // 7. Custom Pages
        if (initData.customPages && Array.isArray(initData.customPages) && initData.customPages.length > 0) {
          setCustomPages(initData.customPages);
          try {
            localStorage.setItem('ls_custom_pages', JSON.stringify(initData.customPages));
          } catch (e) {}
        }

        // 8. Blog Posts
        if (initData.blogPosts && Array.isArray(initData.blogPosts) && initData.blogPosts.length > 0) {
          setBlogPosts(initData.blogPosts);
          try {
            localStorage.setItem('ls_blog_posts', JSON.stringify(initData.blogPosts));
          } catch (e) {}
        }

        // 9. Coupons
        if (initData.coupons && Array.isArray(initData.coupons) && initData.coupons.length > 0) {
          setCoupons(initData.coupons);
        }
      }

      // Sync admin orders if on admin / portal route or forced fresh sync
      const isConsoleRoute = typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal'));
      if (isConsoleRoute || options?.forceFresh) {
        try {
          const resOrders = await fetch('/api/cms/orders');
          if (resOrders.ok) {
            const data = await resOrders.json();
            if (Array.isArray(data.orders)) {
              setOrders(data.orders);
              try {
                localStorage.setItem('ls_orders', JSON.stringify(data.orders));
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      // Brands (cached, only re-fetch if forceFresh is requested)
      if (options?.forceFresh) {
        try {
          const resBrands = await fetch('/api/cms/brands');
          if (resBrands.ok) {
            const data = await resBrands.json();
            if (Array.isArray(data.brands) && data.brands.length > 0) {
              setBrands(data.brands);
              try {
                localStorage.setItem('ls_brands', JSON.stringify(data.brands));
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

    } catch (e) {
      console.warn('CMS DB sync fallback to local cache:', e);
    }
  }, []);

  // Initial Load from localStorage & trigger DB sync
  useEffect(() => {
    try {
      
      const savedBanners = localStorage.getItem('ls_banners');
      if (savedBanners) {
        try {
          const parsed = JSON.parse(savedBanners);
          if (Array.isArray(parsed) && parsed.length > 0) setBanners(parsed);
        } catch (e) {}
      }

      const savedSections = localStorage.getItem('ls_homepage_sections');
      if (savedSections) {
        try {
          const parsed = JSON.parse(savedSections);
          if (Array.isArray(parsed) && parsed.length > 0) setHomepageSections(parsed);
        } catch (e) {}
      }

      const savedCart = localStorage.getItem('ls_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('ls_wishlist');
      if (savedWishlist) setWishlistIds(JSON.parse(savedWishlist));

      const savedBrands = localStorage.getItem('ls_brands');
      if (savedBrands) {
        try {
          const parsed = JSON.parse(savedBrands);
          if (Array.isArray(parsed) && parsed.length >= DEFAULT_BRANDS.length) {
            setBrands(parsed);
          } else {
            setBrands(DEFAULT_BRANDS);
            try {
              localStorage.setItem('ls_brands', JSON.stringify(DEFAULT_BRANDS));
            } catch (e) {}
          }
        } catch (e) {
          setBrands(DEFAULT_BRANDS);
        }
      } else {
        setBrands(DEFAULT_BRANDS);
      }

      const savedCats = localStorage.getItem('ls_categories');
      if (savedCats) {
        try {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isStale = parsed.some((c: any) => c.id === 'cat-accessories' || c.id === 'cat-networking' || c.id === 'cat-computers') || parsed.length > 15;
            if (!isStale) {
              setCategories(parsed);
            } else {
              setCategories(DEFAULT_CMS_CATEGORIES);
              try { localStorage.setItem('ls_categories', JSON.stringify(DEFAULT_CMS_CATEGORIES)); } catch (e) {}
            }
          }
        } catch (e) {}
      }

      const savedOrders = localStorage.getItem('ls_orders');
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          const realOrders = Array.isArray(parsed)
            ? parsed.filter((o: any) => !['LS-10248', 'LS-10247', 'LS-10246'].includes(o.orderId))
            : [];
          setOrders(realOrders);
          localStorage.setItem('ls_orders', JSON.stringify(realOrders));
        } catch {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }

      const savedLeads = localStorage.getItem('ls_leads');
      if (savedLeads) {
        try {
          const parsed = JSON.parse(savedLeads);
          const realLeads = Array.isArray(parsed)
            ? parsed.filter((l: any) => !['lead-101', 'lead-102', 'lead-103', 'lead-104'].includes(l.id))
            : [];
          setLeads(realLeads);
          localStorage.setItem('ls_leads', JSON.stringify(realLeads));
        } catch {
          setLeads([]);
        }
      } else {
        setLeads([]);
      }

      // If products state is empty for any reason, restore from localStorage or fallback
      const savedProducts = localStorage.getItem('ls_products');
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts((prev) => (prev.length > 0 ? prev : parsed.filter((p: any) => !isDemoProduct(p)).map(normalizeProduct)));
          }
        } catch (e) {}
      }

      const savedInvoices = localStorage.getItem('ls_invoices');
      if (savedInvoices) {
        try {
          const parsed = JSON.parse(savedInvoices);
          const realInvs = Array.isArray(parsed)
            ? parsed.filter((inv: any) => !['LS-10248', 'LS-10247', 'LS-10246'].includes(inv.orderId))
            : [];
          setInvoices(realInvs);
          localStorage.setItem('ls_invoices', JSON.stringify(realInvs));
        } catch {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }

      const savedInvSettings = localStorage.getItem('ls_invoice_settings');
      if (savedInvSettings) {
        try {
          const parsed = JSON.parse(savedInvSettings);
          if (!parsed.nextNumber || parsed.nextNumber >= 10000) {
            parsed.nextNumber = 1;
          }
          setInvoiceSettings(parsed);
        } catch (e) {}
      }

      const savedPages = localStorage.getItem('ls_custom_pages');
      if (savedPages) setCustomPages(JSON.parse(savedPages));

      const savedBlogs = localStorage.getItem('ls_blog_posts');
      if (savedBlogs) setBlogPosts(JSON.parse(savedBlogs));

      const savedSiteSettings = localStorage.getItem('ls_site_settings');
      if (savedSiteSettings) {
        try {
          const parsed = JSON.parse(savedSiteSettings);
          if (parsed && typeof parsed === 'object') setSiteSettings(parsed);
        } catch (e) {}
      }

      const savedPaymentSettings = localStorage.getItem('ls_payment_settings');
      if (savedPaymentSettings) {
        try {
          const parsed = JSON.parse(savedPaymentSettings);
          if (parsed && typeof parsed === 'object') setPaymentSettings(parsed);
        } catch (e) {}
      }

      const savedBankAccounts = localStorage.getItem('ls_bank_accounts');
      if (savedBankAccounts) {
        try {
          const parsed = JSON.parse(savedBankAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBankAccounts(parsed);
            const primary = parsed.find((b: any) => b.isPrimary) || parsed[0];
            if (primary) {
              setInvoiceSettings((prev) => ({
                ...prev,
                accountHolderName: primary.accountHolderName || prev.accountHolderName,
                bankName: primary.bankName || prev.bankName,
                accountNumber: primary.accountNumber || prev.accountNumber,
                ifscCode: primary.ifscCode || prev.ifscCode,
                branch: primary.branch || prev.branch,
              }));
            }
          } else {
            setBankAccounts(DEFAULT_BANK_ACCOUNTS);
            localStorage.setItem('ls_bank_accounts', JSON.stringify(DEFAULT_BANK_ACCOUNTS));
          }
        } catch {
          setBankAccounts(DEFAULT_BANK_ACCOUNTS);
        }
      } else {
        setBankAccounts(DEFAULT_BANK_ACCOUNTS);
        localStorage.setItem('ls_bank_accounts', JSON.stringify(DEFAULT_BANK_ACCOUNTS));
      }
    } catch (e) {
      console.error('LocalStorage load error:', e);
    }

    syncWithDatabase();
  }, [syncWithDatabase]);

  // Live Auto-Sync for Mobile App & Web (Heartbeat + Visibility + Window Focus)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Expose global bridge hook for Native Android App (MainActivity.java)
    (window as any).__lapiezSync = () => {
      syncWithDatabase({ forceFresh: true }).catch(() => {});
    };

    const handleForegroundSync = () => {
      if (document.visibilityState === 'visible') {
        syncWithDatabase({ forceFresh: true }).catch(() => {});
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ls_')) {
        syncWithDatabase({ forceFresh: true }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleForegroundSync);
    document.addEventListener('visibilitychange', handleForegroundSync);
    window.addEventListener('storage', handleStorageChange);

    // 25-second background heartbeat to auto-fetch admin updates on phone & web without manual refresh
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncWithDatabase({ forceFresh: true }).catch(() => {});
      }
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleForegroundSync);
      document.removeEventListener('visibilitychange', handleForegroundSync);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(heartbeat);
    };
  }, [syncWithDatabase]);

  const addToCart = (product: Product, qty: number = 1) => {
    const isOutOfStock = product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity !== null && Number(product.stockQuantity) <= 0);
    if (isOutOfStock) {
      showToast(`Sorry, "${product.name}" is currently Out of Stock!`);
      return;
    }

    const addCount = Math.max(1, qty);
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx].quantity += addCount;
      } else {
        updated = [{ product, quantity: addCount }, ...prev];
      }
      try {
        localStorage.setItem('ls_cart', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(addCount > 1 ? `Added ${addCount}x "${product.name}" to cart!` : `Added "${product.name}" to cart!`);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    const updated = cart.map((item) => {
      if (item.product.id === id) {
        return { ...item, quantity: qty };
      }
      return item;
    });
    setCart(updated);
    try {
      localStorage.setItem('ls_cart', JSON.stringify(updated));
    } catch (e) {}
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter((item) => item.product.id !== id);
    setCart(updated);
    try {
      localStorage.setItem('ls_cart', JSON.stringify(updated));
    } catch (e) {}
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('ls_cart');
    } catch (e) {}
  };

  const toggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      let updated: string[];
      if (prev.includes(product.id)) {
        updated = prev.filter((id) => id !== product.id);
        showToast('Removed from wishlist');
      } else {
        updated = [...prev, product.id];
        showToast('Added to wishlist');
      }
      try {
        localStorage.setItem('ls_wishlist', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const placeOrder = async (newOrder: any): Promise<Invoice> => {
    try {
      // Direct frictionless checkout support: If customer session is absent, link guest details seamlessly
      const guestEmail = newOrder.customerEmail || newOrder.email || (newOrder.phone ? `${newOrder.phone}@customer.lapiez.com` : 'customer@lapiez.com');
      const guestId = customer?.id || newOrder.customerId || `cust-${Date.now()}`;
      const guestName = customer?.user_metadata?.full_name || customer?.user_metadata?.name || newOrder.customerName || 'Valued Customer';

      if (!customer) {
        try {
          loginCustomerManually({
            id: guestId,
            name: guestName,
            email: guestEmail,
            phone: newOrder.phone || '',
          });
        } catch (e) {}
      }

      const orderPayload = {
        ...newOrder,
        customerId: guestId,
        customerEmail: guestEmail,
      };
      const response = await fetch('/api/cms/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order could not be placed');

      const savedOrder = data.order;
      const updated = [savedOrder, ...orders.filter((o) => o.orderId !== savedOrder.orderId)];
      setOrders(updated);
      setCart([]);
      const newInvoice = createInvoiceFromOrder(savedOrder);
      localStorage.setItem('ls_orders', JSON.stringify(updated));
      localStorage.setItem('ls_last_order', JSON.stringify(savedOrder));
      localStorage.setItem('ls_last_invoice', JSON.stringify(newInvoice));
      localStorage.setItem('ls_cart', JSON.stringify([]));
      showToast(`Order #${savedOrder.orderId} placed. Payment verification is pending.`);
      syncWithDatabase({ forceFresh: true }).catch(() => {});
      return newInvoice;
    } catch (e) {
      console.error('Order save error:', e);
      throw e;
    }
  };

  const fetchOrders = useCallback(async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/cms/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
          try {
            localStorage.setItem('ls_orders', JSON.stringify(data.orders));
          } catch (e) {}
          return data.orders;
        }
      }
    } catch (e) {
      console.warn('Orders fetch error:', e);
    }
    return [];
  }, []);

  const createLead = (leadData: any) => {
    const newLead = {
      id: `lead-${Date.now()}`,
      customerName: leadData.customerName,
      phone: leadData.phone,
      location: 'Garhwa / Palamu',
      type: leadData.type,
      requirement:
        leadData.requirement ||
        (leadData.type === 'CCTV Setup'
          ? `${leadData.cameraCount}x ${leadData.cameraType} for ${leadData.propertyType}, Storage: ${leadData.storage}`
          : `Custom PC: ${leadData.cpu} + ${leadData.gpu} + ${leadData.ram}`),
      estimatedBudget: leadData.estimatedBudget,
      date: leadData.date || new Date().toISOString().split('T')[0],
      status: 'New' as const,
    };
    const updated = [newLead, ...leads];
    setLeads(updated);
    try {
      localStorage.setItem('ls_leads', JSON.stringify(updated));
    } catch (e) {}
    showToast('Consultation request sent to Garhwa showroom!');
  };

  const updateProducts = async (prods: Product[]) => {
    setProducts(prods);
    try {
      safeSaveProductsToLocalStorage(prods);
      const changes = prods.filter((product) => {
        const previous = products.find((current) => current.id === product.id || (product.sku && current.sku === product.sku));
        return previous && (previous.inStock !== product.inStock || previous.stockQuantity !== product.stockQuantity);
      });
      await Promise.all(changes.map((product) => fetch('/api/cms/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: product.id, 
          sku: product.sku,
          name: product.name,
          inStock: product.inStock, 
          stockQuantity: product.inStock === false ? 0 : (product.stockQuantity || 10) 
        }),
      })));
    } catch (e) {}
  };

  const updateOrders = async (ords: any[]) => {
    setOrders(ords);
    try {
      localStorage.setItem('ls_orders', JSON.stringify(ords));
      const changes = ords.filter((order) => {
        const previous = orders.find((current) => current.orderId === order.orderId);
        return previous && (
          previous.paymentStatus !== order.paymentStatus || 
          previous.orderStatus !== order.orderStatus ||
          previous.pickupHandedBy !== order.pickupHandedBy ||
          (previous as any).approvedBy !== (order as any).approvedBy
        );
      });
      await Promise.all(changes.map((order) => fetch('/api/cms/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          pickupHandedBy: order.pickupHandedBy,
          approvedBy: (order as any).approvedBy,
        }),
      })));
    } catch (e) {}
  };

  const updateLeads = (lds: any[]) => {
    setLeads(lds);
    try {
      localStorage.setItem('ls_leads', JSON.stringify(lds));
    } catch (e) {}
  };

  // CMS Server Update Handlers
  const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
    const updated = { ...siteSettings, ...settings };
    setSiteSettings(updated);
    try {
      localStorage.setItem('ls_site_settings', JSON.stringify(updated));
    } catch (e) {}
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteSettings: updated }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast('Store settings saved successfully!');
    } catch (e: any) {
      console.error('Failed to update site settings in DB:', e);
      showToast(`Saved locally! (DB: ${e.message || 'notice'})`);
    }
  };

  const updateThemeSettings = async (theme: Partial<ThemeSettings>) => {
    const updated = { ...themeSettings, ...theme };
    setThemeSettings(updated);
    try {
      const res = await fetch('/api/cms/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast('Theme colors updated in database!');
    } catch (e: any) {
      console.error('Failed to update theme:', e);
      showToast(`Theme saved locally! (DB: ${e.message || 'notice'})`);
    }
  };

  const updatePaymentSettings = async (payment: Partial<PaymentSettings>) => {
    const updated = { 
      ...paymentSettings, 
      ...payment,
      bankAccountsJson: serializeBankAccountsWithConfig(bankAccounts, paymentMethodsConfig),
    };
    setPaymentSettings(updated);
    try {
      localStorage.setItem('ls_payment_settings', JSON.stringify(updated));
    } catch (e) {}
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentSettings: updated }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast('Payment & UPI settings saved successfully!');
    } catch (e: any) {
      console.error('Failed to update payment settings in DB:', e);
      showToast(`Saved locally! (DB: ${e.message || 'notice'})`);
    }
  };

  const updatePaymentMethodsConfig = async (config: Partial<PaymentMethodsConfig>) => {
    const updatedMethods = { ...paymentMethodsConfig, ...config };
    setPaymentMethodsConfig(updatedMethods);
    try {
      localStorage.setItem('ls_payment_methods_config', JSON.stringify(updatedMethods));
    } catch (e) {}

    const updatedPayment = {
      ...paymentSettings,
      codEnabled: updatedMethods.enableCOD,
      bankAccountsJson: serializeBankAccountsWithConfig(bankAccounts, updatedMethods),
    };
    setPaymentSettings(updatedPayment);
    try {
      localStorage.setItem('ls_payment_settings', JSON.stringify(updatedPayment));
    } catch (e) {}

    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentSettings: updatedPayment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast('Payment methods configuration saved!');
    } catch (e: any) {
      console.error('Failed to update payment methods in DB:', e);
      showToast(`Saved locally! (DB: ${e.message || 'notice'})`);
    }
  };

  const updateStoreAndPaymentSettings = async (
    site: Partial<SiteSettings>,
    payment: Partial<PaymentSettings>,
    methodsConfig?: Partial<PaymentMethodsConfig>
  ) => {
    const updatedMethods = methodsConfig ? { ...paymentMethodsConfig, ...methodsConfig } : paymentMethodsConfig;
    if (methodsConfig) {
      setPaymentMethodsConfig(updatedMethods);
      try {
        localStorage.setItem('ls_payment_methods_config', JSON.stringify(updatedMethods));
      } catch (e) {}
    }

    const updatedSite = { 
      ...siteSettings, 
      ...site,
      twitterUrl: site.googleMapsUrl || site.twitterUrl || siteSettings.googleMapsUrl || siteSettings.twitterUrl || STORE_INFO.mapsUrl,
      googleMapsUrl: site.googleMapsUrl || site.twitterUrl || siteSettings.googleMapsUrl || siteSettings.twitterUrl || STORE_INFO.mapsUrl,
    };

    const combinedBankJson = serializeBankAccountsWithConfig(
      bankAccounts,
      updatedMethods
    );

    const updatedPayment = { 
      ...paymentSettings, 
      ...payment,
      codEnabled: methodsConfig ? updatedMethods.enableCOD : (payment.codEnabled !== undefined ? payment.codEnabled : paymentSettings.codEnabled),
      bankAccountsJson: combinedBankJson,
    };

    setSiteSettings(updatedSite);
    setPaymentSettings(updatedPayment);
    try {
      localStorage.setItem('ls_site_settings', JSON.stringify(updatedSite));
      localStorage.setItem('ls_payment_settings', JSON.stringify(updatedPayment));
    } catch (e) {}
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteSettings: updatedSite, paymentSettings: updatedPayment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      showToast('Store details & Payment settings saved permanently to database!');
    } catch (e: any) {
      console.error('Failed to update settings in DB:', e);
      showToast(`Settings saved locally! (DB: ${e.message || 'notice'})`);
    }
  };

  const addBankAccount = async (accountData: Omit<BankAccount, 'id' | 'createdAt'>): Promise<BankAccount> => {
    const newAccount: BankAccount = {
      ...accountData,
      id: `bank-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    let updated = [...bankAccounts];
    if (newAccount.isPrimary) {
      updated = updated.map(a => ({ ...a, isPrimary: false }));
    }
    updated.push(newAccount);
    setBankAccounts(updated);
    try {
      localStorage.setItem('ls_bank_accounts', JSON.stringify(updated));
    } catch (e) {}

    if (newAccount.isPrimary || updated.length === 1) {
      updateInvoiceSettings({
        accountHolderName: newAccount.accountHolderName,
        bankName: newAccount.bankName,
        accountNumber: newAccount.accountNumber,
        ifscCode: newAccount.ifscCode,
        branch: newAccount.branch,
      });
    }

    try {
      await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentSettings: {
            ...paymentSettings,
            bankAccountsJson: serializeBankAccountsWithConfig(updated, paymentMethodsConfig),
          },
        }),
      });
    } catch (e) {}

    showToast(`Bank account "${newAccount.bankName}" added!`);
    return newAccount;
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>): Promise<boolean> => {
    let updated = bankAccounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, ...updates };
      }
      if (updates.isPrimary) {
        return { ...acc, isPrimary: false };
      }
      return acc;
    });
    setBankAccounts(updated);
    try {
      localStorage.setItem('ls_bank_accounts', JSON.stringify(updated));
    } catch (e) {}

    const primaryAcc = updated.find(a => a.isPrimary) || (updates.isPrimary ? updated.find(a => a.id === id) : null);
    if (primaryAcc) {
      updateInvoiceSettings({
        accountHolderName: primaryAcc.accountHolderName,
        bankName: primaryAcc.bankName,
        accountNumber: primaryAcc.accountNumber,
        ifscCode: primaryAcc.ifscCode,
        branch: primaryAcc.branch,
      });
    }

    try {
      await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentSettings: {
            ...paymentSettings,
            bankAccountsJson: serializeBankAccountsWithConfig(updated, paymentMethodsConfig),
          },
        }),
      });
    } catch (e) {}

    showToast('Bank details updated successfully!');
    return true;
  };

  const deleteBankAccount = async (id: string): Promise<boolean> => {
    if (bankAccounts.length <= 1) {
      showToast('Cannot delete the only bank account. At least 1 bank account is required.');
      return false;
    }
    const target = bankAccounts.find(a => a.id === id);
    let updated = bankAccounts.filter((a) => a.id !== id);
    if (target?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
      updateInvoiceSettings({
        accountHolderName: updated[0].accountHolderName,
        bankName: updated[0].bankName,
        accountNumber: updated[0].accountNumber,
        ifscCode: updated[0].ifscCode,
        branch: updated[0].branch,
      });
    }
    setBankAccounts(updated);
    try {
      localStorage.setItem('ls_bank_accounts', JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentSettings: {
            ...paymentSettings,
            bankAccountsJson: serializeBankAccountsWithConfig(updated, paymentMethodsConfig),
          },
        }),
      });
    } catch (e) {}

    showToast('Bank account removed successfully!');
    return true;
  };

  const setPrimaryBankAccount = async (id: string): Promise<boolean> => {
    const updated = bankAccounts.map((a) => ({
      ...a,
      isPrimary: a.id === id,
    }));
    setBankAccounts(updated);
    try {
      localStorage.setItem('ls_bank_accounts', JSON.stringify(updated));
    } catch (e) {}

    const primary = updated.find(a => a.id === id);
    if (primary) {
      updateInvoiceSettings({
        accountHolderName: primary.accountHolderName,
        bankName: primary.bankName,
        accountNumber: primary.accountNumber,
        ifscCode: primary.ifscCode,
        branch: primary.branch,
      });
    }

    try {
      await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentSettings: {
            ...paymentSettings,
            bankAccountsJson: serializeBankAccountsWithConfig(updated, paymentMethodsConfig),
          },
        }),
      });
    } catch (e) {}

    showToast(`"${primary?.bankName}" set as primary bank account!`);
    return true;
  };

  // Dynamically apply Theme CSS Variables to document root
  useEffect(() => {
    if (typeof document !== 'undefined' && themeSettings) {
      document.documentElement.style.setProperty('--primary-color', themeSettings.primaryColor || '#1A56DB');
      document.documentElement.style.setProperty('--secondary-color', themeSettings.secondaryColor || '#FB641B');
      document.documentElement.style.setProperty('--deal-color', themeSettings.dealColor || '#15803D');
    }
  }, [themeSettings]);

  const updateBanners = async (newBanners: CMSBanner[]) => {
    setBanners(newBanners);
    showToast('Banners updated!');
  };

  const addBanner = async (bannerData: Partial<CMSBanner>) => {
    try {
      const res = await fetch('/api/cms/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData),
      });
      if (res.ok) {
        const data = await res.json();
        setBanners((prev) => [...prev, data.banner]);
        showToast('New Banner added to database!');
      }
    } catch (e) {
      console.error('Failed to add banner:', e);
    }
  };

  const editBanner = async (bannerData: CMSBanner) => {
    try {
      const res = await fetch('/api/cms/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData),
      });
      if (res.ok) {
        setBanners((prev) => prev.map((b) => (b.id === bannerData.id ? bannerData : b)));
        showToast('Banner updated in database!');
      }
    } catch (e) {
      console.error('Failed to update banner:', e);
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/banners?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        showToast('Banner deleted from database!');
      }
    } catch (e) {
      console.error('Failed to delete banner:', e);
    }
  };

  const resetBannersToDefault = async () => {
    try {
      const res = await fetch('/api/cms/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_defaults' }),
      });
      if (res.ok) {
        setBanners(INITIAL_BANNERS);
        try {
          localStorage.setItem('ls_banners', JSON.stringify(INITIAL_BANNERS));
        } catch (e) {}
        showToast('All 6 official storefront banners restored!');
        return true;
      }
    } catch (e) {
      console.error('Failed to reset banners in DB:', e);
    }
    setBanners(INITIAL_BANNERS);
    try {
      localStorage.setItem('ls_banners', JSON.stringify(INITIAL_BANNERS));
    } catch (e) {}
    showToast('Official banners restored!');
    return true;
  };

  const addProductToDb = async (prod: Partial<Product>) => {
    // Ensure collision-free unique SKU for database
    const catClean = ((prod.category || 'GEN') as string).replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
    let sku = prod.sku?.trim();
    if (!sku || products.some(p => p.sku && p.sku.toLowerCase() === sku!.toLowerCase())) {
      sku = `LS-${catClean}-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    }
    const finalProd = { ...prod, sku };

    try {
      const res = await fetch('/api/cms/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalProd),
      });

      if (res.ok) {
        const data = await res.json();
        const created = normalizeProduct(data.product);
        setProducts((prev) => {
          const updated = [created, ...prev.filter(p => p.id !== created.id && p.sku !== created.sku)];
          safeSaveProductsToLocalStorage(updated);
          return updated;
        });
        showToast(`Product "${created.name}" saved to database!`);
        return created;
      } else {
        const err = await res.json().catch(() => ({}));
        const errorMessage = res.status === 401 
          ? 'Admin session expired. Please re-login to the Admin Panel.'
          : (err.error || `Server error (${res.status}): Failed to save product`);
        showToast(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (e: any) {
      console.error('Failed to add product to DB:', e);
      throw e;
    }
  };

  const fetchTrashProducts = async () => {
    try {
      setIsLoadingTrash(true);
      const res = await fetch('/api/cms/products?trash=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setTrashProducts(data.products.map(normalizeProduct));
        }
      }
    } catch (e) {
      console.error('Failed to fetch trash products:', e);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const deleteProductFromDb = async (id: string, permanent = false) => {
    try {
      const prodToDelete = products.find(p => p.id === id || p.sku === id || (p as any).dbId === id)
        || trashProducts.find(p => p.id === id || p.sku === id || (p as any).dbId === id);
      const sku = prodToDelete?.sku;
      const targetId = prodToDelete?.id || id;

      if (!permanent) {
        // Soft-delete: Move to Dustbin (15 Days Retention)
        setProducts((prev) => {
          const next = prev.filter((p) => 
            p.id !== id && 
            p.id !== targetId && 
            (p as any).dbId !== id && 
            (p as any).dbId !== targetId && 
            (!sku || !p.sku || p.sku.toLowerCase() !== sku.toLowerCase())
          );
          safeSaveProductsToLocalStorage(next);
          return next;
        });

        if (prodToDelete) {
          const trashedItem: Product = {
            ...prodToDelete,
            status: 'trash',
            deletedAt: new Date().toISOString()
          };
          setTrashProducts(prev => [trashedItem, ...prev.filter(p => p.id !== targetId)]);
        }

        const res = await fetch(`/api/cms/products?id=${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          showToast('Product moved to Dustbin! Kept safely for 15 days.');
        } else {
          showToast('Product moved to Dustbin locally');
        }
      } else {
        // Hard delete: Permanent deletion from database
        setTrashProducts(prev => prev.filter(p => p.id !== id && p.id !== targetId));
        setProducts(prev => prev.filter(p => p.id !== id && p.id !== targetId));
        try {
          const saved = localStorage.getItem('ls_products');
          if (saved) {
            const parsed = JSON.parse(saved);
            const filtered = parsed.filter((p: any) => p.id !== id && p.id !== targetId);
            safeSaveProductsToLocalStorage(filtered);
          }
        } catch (e) {}

        const res = await fetch(`/api/cms/products?id=${encodeURIComponent(targetId)}&permanent=true`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          showToast('Product permanently deleted from database!');
        } else {
          showToast('Product permanently deleted');
        }
      }
    } catch (e) {
      console.error('Failed to delete product:', e);
      showToast('Action completed locally');
    }
  };

  const restoreProductFromDb = async (id: string) => {
    try {
      const prodToRestore = trashProducts.find(p => p.id === id || p.sku === id || (p as any).dbId === id);
      const targetId = prodToRestore?.id || id;

      setTrashProducts(prev => prev.filter(p => p.id !== id && p.id !== targetId));

      if (prodToRestore) {
        const restored: Product = {
          ...prodToRestore,
          status: 'active',
          deletedAt: null
        };
        setProducts(prev => {
          const exists = prev.some(p => p.id === targetId || (p.sku && prodToRestore.sku && p.sku.toLowerCase() === prodToRestore.sku.toLowerCase()));
          const next = exists ? prev : [restored, ...prev];
          safeSaveProductsToLocalStorage(next);
          return next;
        });
      }

      const res = await fetch(`/api/cms/products?action=restore&id=${encodeURIComponent(targetId)}`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('Product restored to Active Catalog!');
      } else {
        showToast('Product restored locally');
      }
    } catch (e) {
      console.error('Failed to restore product:', e);
      showToast('Product restored locally');
    }
  };

  const restoreAllTrash = async () => {
    try {
      const items = [...trashProducts];
      setTrashProducts([]);
      setProducts(prev => {
        const restored = items.map(p => ({ ...p, status: 'active', deletedAt: null }));
        const next = [...restored, ...prev];
        safeSaveProductsToLocalStorage(next);
        return next;
      });

      const res = await fetch('/api/cms/products?action=restoreAll', {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('All products restored to active catalog!');
      }
    } catch (e) {
      console.error('Failed to restore all trash:', e);
    }
  };

  const emptyTrashDb = async () => {
    try {
      setTrashProducts([]);
      const res = await fetch('/api/cms/products?emptyTrash=true', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('Dustbin emptied permanently!');
      }
    } catch (e) {
      console.error('Failed to empty dustbin:', e);
    }
  };

  const wipeAllProductsFromDb = async (): Promise<boolean> => {
    try {
      setProducts([]);
      setTrashProducts([]);
      try {
        localStorage.setItem('ls_products', '[]');
      } catch (e) {}

      const res = await fetch('/api/cms/wipe-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret: 'Lapiez@2026#' }),
      });
      if (res.ok) {
        showToast('All products successfully deleted from database!');
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to wipe products from database');
        return false;
      }
    } catch (e) {
      console.error('Failed to wipe all products:', e);
      showToast('Wipe completed locally');
      return false;
    }
  };

  const updateProductInDb = async (id: string, updatedFields: Partial<Product>): Promise<boolean> => {
    try {
      const currentProd = products.find((p) => p.id === id || p.sku === id || (p as any).dbId === id);
      const sku = currentProd?.sku;
      const name = currentProd?.name;
      const finalFields: Partial<Product> = { ...updatedFields };

      if (finalFields.inStock === false) {
        finalFields.stockQuantity = 0;
      } else if (finalFields.inStock === true && (finalFields.stockQuantity === undefined || finalFields.stockQuantity <= 0)) {
        finalFields.stockQuantity = (currentProd?.stockQuantity && currentProd.stockQuantity > 0) ? currentProd.stockQuantity : 10;
      }

      // 1. Instant local state update across all instances
      setProducts((prev) => {
        const next = prev.map((p) => {
          const isMatch = p.id === id || 
            (p as any).dbId === id ||
            (sku && p.sku && p.sku.toLowerCase() === sku.toLowerCase()) || 
            (name && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
          return isMatch ? { ...p, ...finalFields } : p;
        });
        safeSaveProductsToLocalStorage(next);
        return next;
      });

      // 2. Persist to Prisma DB
      const res = await fetch('/api/cms/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          id, 
          sku: sku || (id.startsWith('LS-') || id.startsWith('MON-') || id.startsWith('FT-') || id.startsWith('KB-') ? id : undefined),
          name, 
          ...finalFields 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          const updatedProd = normalizeProduct(data.product);
          setProducts((prev) => {
            const next = prev.map((p) => {
              const isMatch = p.id === updatedProd.id || 
                (p as any).dbId === updatedProd.id ||
                (updatedProd.sku && p.sku && p.sku.toLowerCase() === updatedProd.sku.toLowerCase()) ||
                (updatedProd.name && p.name && p.name.trim().toLowerCase() === updatedProd.name.trim().toLowerCase());
              return isMatch ? updatedProd : p;
            });
            safeSaveProductsToLocalStorage(next);
            return next;
          });
        }
        showToast('Product updated successfully!');
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update product in database');
        return false;
      }
    } catch (e) {
      console.error('Failed to update product:', e);
      showToast('Error saving product changes');
      return false;
    }
  };

  const updateHomepageSections = async (sections: CMSSection[]) => {
    setHomepageSections(sections);
    try {
      localStorage.setItem('ls_homepage_sections', JSON.stringify(sections));
    } catch (e) {}

    try {
      const res = await fetch('/api/cms/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sections && Array.isArray(data.sections)) {
          setHomepageSections(data.sections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(data.sections));
          } catch (e) {}
        }
        showToast('Homepage section order saved!');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to save sections to database');
      }
    } catch (e) {
      console.error('Failed to update homepage sections:', e);
      showToast('Error saving sections');
    }
  };

  const updateHomepageSectionDetails = async (sectionKey: string, details: Partial<CMSSection>) => {
    setHomepageSections((prev) => {
      const updated = prev.map((s) => (s.sectionKey === sectionKey ? { ...s, ...details } : s));
      try { localStorage.setItem('ls_homepage_sections', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch('/api/cms/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKey, ...details }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sections && Array.isArray(data.sections)) {
          setHomepageSections(data.sections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(data.sections));
          } catch (e) {}
        }
        showToast(`Section "${details.title || sectionKey}" updated!`);
      }
    } catch (e) {
      console.error('Failed to update section:', e);
    }
  };

  const updateHomepageSectionProducts = async (sectionKey: string, productIds: string[]) => {
    setHomepageSections((prev) => {
      const updated = prev.map((s) => (s.sectionKey === sectionKey ? { ...s, productIds } : s));
      try { localStorage.setItem('ls_homepage_sections', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch('/api/cms/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKey, productIds }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sections && Array.isArray(data.sections)) {
          setHomepageSections(data.sections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(data.sections));
          } catch (e) {}
        }
        showToast(`Products updated for section!`);
      }
    } catch (e) {
      console.error('Failed to update section products:', e);
    }
  };

  const resetHomepageSectionsToDefault = async () => {
    try {
      const res = await fetch('/api/cms/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToDefaults: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sections && Array.isArray(data.sections)) {
          setHomepageSections(data.sections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(data.sections));
          } catch (e) {}
        }
        showToast('All homepage sections reset to default layout!');
      } else {
        showToast('Failed to reset homepage sections');
      }
    } catch (e) {
      console.error('Failed to reset sections:', e);
      showToast('Error resetting sections');
    }
  };

  const makeAllHomepageSectionsVisible = async () => {
    try {
      const res = await fetch('/api/cms/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeAllVisible: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.sections && Array.isArray(data.sections)) {
          setHomepageSections(data.sections);
          try {
            localStorage.setItem('ls_homepage_sections', JSON.stringify(data.sections));
          } catch (e) {}
        }
        showToast('All homepage sections are now visible!');
      } else {
        showToast('Failed to update section visibility');
      }
    } catch (e) {
      console.error('Failed to make all visible:', e);
      showToast('Error updating visibility');
    }
  };

  const addCustomPage = async (page: Partial<CMSCustomPage>): Promise<CMSCustomPage> => {
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });
      const data = await res.json();
      if (data.page) {
        setCustomPages((prev) => [data.page, ...prev]);
        showToast('Page published successfully!');
        return data.page;
      }
    } catch (e) {
      console.error('Failed to create page:', e);
    }
    const fallback: CMSCustomPage = {
      id: `page-${Date.now()}`,
      slug: page.slug || 'custom-page',
      title: page.title || 'Untitled Page',
      content: page.content || '',
      status: page.status || 'published',
    };
    setCustomPages((prev) => [fallback, ...prev]);
    return fallback;
  };

  const editCustomPage = async (page: CMSCustomPage) => {
    setCustomPages((prev) => prev.map((p) => (p.id === page.id ? page : p)));
    try {
      await fetch('/api/cms/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });
      showToast('Page updated successfully!');
    } catch (e) {
      console.error('Failed to update page:', e);
    }
  };

  const deleteCustomPage = async (id: string) => {
    setCustomPages((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/cms/pages?id=${id}`, { method: 'DELETE' });
      showToast('Page deleted!');
    } catch (e) {
      console.error('Failed to delete page:', e);
    }
  };

  const addBlogPost = async (post: Partial<CMSBlogPost>): Promise<CMSBlogPost> => {
    try {
      const res = await fetch('/api/cms/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      const data = await res.json();
      if (data.blog) {
        setBlogPosts((prev) => [data.blog, ...prev]);
        showToast('Blog article published!');
        return data.blog;
      }
    } catch (e) {
      console.error('Failed to create blog:', e);
    }
    const fallback: CMSBlogPost = {
      id: `blog-${Date.now()}`,
      slug: post.slug || 'tech-article',
      title: post.title || 'New Tech Article',
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000',
      category: post.category || 'Hardware Guide',
      author: post.author || 'Lapiez Team',
      readTime: post.readTime || '4 min read',
      status: post.status || 'published',
    };
    setBlogPosts((prev) => [fallback, ...prev]);
    return fallback;
  };

  const editBlogPost = async (post: CMSBlogPost) => {
    setBlogPosts((prev) => prev.map((b) => (b.id === post.id ? post : b)));
    try {
      await fetch('/api/cms/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      showToast('Blog article updated!');
    } catch (e) {
      console.error('Failed to update blog:', e);
    }
  };

  const deleteBlogPost = async (id: string) => {
    setBlogPosts((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/cms/blogs?id=${id}`, { method: 'DELETE' });
      showToast('Blog article deleted!');
    } catch (e) {
      console.error('Failed to delete blog:', e);
    }
  };

  // Coupon Engine Methods
  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/coupons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coupons) && data.coupons.length > 0) {
          setCoupons(data.coupons);
        }
      }
    } catch (e) {
      console.error('Failed to fetch coupons:', e);
    }
  }, []);

  const applyCoupon = useCallback((code: string, orderTotal: number) => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a coupon code.', discount: 0 };
    }
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === cleanCode);
    if (!found) {
      return { 
        success: false, 
        message: `Invalid or expired coupon code.`, 
        discount: 0 
      };
    }
    const result = calculateCouponDiscount(found, orderTotal);
    if (!result.isValid) {
      return { success: false, message: result.error || 'Coupon cannot be applied.', discount: 0 };
    }
    setAppliedCoupon(found);
    setCouponDiscount(result.discountAmount);
    showToast(`Coupon "${found.code}" applied! Saved ₹${result.discountAmount.toLocaleString('en-IN')}`);
    return { 
      success: true, 
      message: `Applied ${found.code}! Saved ₹${result.discountAmount.toLocaleString('en-IN')}`, 
      discount: result.discountAmount 
    };
  }, [coupons]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    showToast('Coupon removed');
  }, []);

  const createCoupon = useCallback(async (couponData: any) => {
    try {
      const res = await fetch('/api/cms/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');
      await fetchCoupons();
      showToast(`Coupon ${couponData.code?.toUpperCase()} created successfully!`);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to create coupon' };
    }
  }, [fetchCoupons]);

  const updateCoupon = useCallback(async (id: string, couponData: any) => {
    try {
      const res = await fetch('/api/cms/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...couponData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update coupon');
      await fetchCoupons();
      showToast('Coupon updated successfully!');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update coupon' };
    }
  }, [fetchCoupons]);

  const deleteCoupon = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/cms/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete coupon');
      await fetchCoupons();
      showToast('Coupon deleted!');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to delete coupon' };
    }
  }, [fetchCoupons]);

  // Brand Engine Methods
  const addBrand = async (brandData: Partial<CMSBrand>): Promise<CMSBrand | null> => {
    try {
      const res = await fetch('/api/cms/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });
      const data = await res.json();
      if (data.brands) {
        setBrands(data.brands);
        localStorage.setItem('ls_brands', JSON.stringify(data.brands));
        showToast(`Brand "${brandData.name || 'New'}" added successfully!`);
        return data.brand || null;
      }
    } catch (e) {
      console.error('Failed to add brand:', e);
    }
    const newBrand: CMSBrand = {
      id: `brand-${Date.now()}`,
      name: brandData.name || 'New Brand',
      query: brandData.query || brandData.name || 'Brand',
      logoType: brandData.logoType || 'preset',
      presetKey: brandData.presetKey,
      imageUrl: brandData.imageUrl,
      bgColor: brandData.bgColor,
      textColor: brandData.textColor,
      position: brands.length,
      isVisible: brandData.isVisible !== undefined ? brandData.isVisible : true,
    };
    const updated = [...brands, newBrand];
    setBrands(updated);
    localStorage.setItem('ls_brands', JSON.stringify(updated));
    showToast(`Brand "${newBrand.name}" added!`);
    return newBrand;
  };

  const updateBrand = async (id: string, updates: Partial<CMSBrand>): Promise<boolean> => {
    const updated = brands.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBrands(updated);
    localStorage.setItem('ls_brands', JSON.stringify(updated));
    try {
      await fetch('/api/cms/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      showToast('Brand updated successfully!');
      return true;
    } catch (e) {
      console.error('Failed to update brand:', e);
      showToast('Saved locally!');
      return true;
    }
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    const filtered = brands.filter((b) => b.id !== id).map((b, idx) => ({ ...b, position: idx }));
    setBrands(filtered);
    localStorage.setItem('ls_brands', JSON.stringify(filtered));
    try {
      await fetch(`/api/cms/brands?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      showToast('Brand removed!');
      return true;
    } catch (e) {
      console.error('Failed to delete brand:', e);
      showToast('Removed locally!');
      return true;
    }
  };

  const reorderBrands = async (newBrands: CMSBrand[]): Promise<boolean> => {
    const reindexed = newBrands.map((b, idx) => ({ ...b, position: idx }));
    setBrands(reindexed);
    localStorage.setItem('ls_brands', JSON.stringify(reindexed));
    try {
      await fetch('/api/cms/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brands: reindexed }),
      });
      showToast('Brand order saved!');
      return true;
    } catch (e) {
      console.error('Failed to save brand order:', e);
      return true;
    }
  };

  const resetBrandsToDefault = async (): Promise<boolean> => {
    setBrands(DEFAULT_BRANDS);
    localStorage.setItem('ls_brands', JSON.stringify(DEFAULT_BRANDS));
    try {
      await fetch('/api/cms/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToDefaults: true }),
      });
      showToast('Brands restored to defaults!');
      return true;
    } catch (e) {
      console.error('Failed to reset brands:', e);
      return true;
    }
  };

  // Categories & Subcategories CMS Methods
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/cms/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          try { localStorage.setItem('ls_categories', JSON.stringify(data.categories)); } catch (e) {}
        }
      }
    } catch (e) {}
  };

  const addCategory = async (catData: Partial<CMSCategory>) => {
    const newCat: CMSCategory = {
      id: catData.id || `cat-${Date.now()}`,
      name: catData.name || 'New Category',
      slug: catData.slug || (catData.name || 'new-category').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      image: catData.image || catData.imageUrl || '/images/categories/laptop-adapters.png',
      imageUrl: catData.imageUrl || catData.image || '/images/categories/laptop-adapters.png',
      startingPrice: catData.startingPrice || 'From ₹499',
      position: categories.length,
      status: catData.status || 'active',
      subcategories: catData.subcategories || [],
      href: catData.href || `/shop?search=${encodeURIComponent((catData.name || '').replace(/^Laptop\s*/i, ''))}`,
      ...catData,
    };

    // Optimistic local state update
    const updated = [...categories, newCat];
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast(`Category "${newCat.name}" added!`);

    try {
      const res = await fetch('/api/cms/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        await fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
    return newCat;
  };

  const updateCategory = async (id: string, updates: Partial<CMSCategory>) => {
    // Optimistic local state update
    const updated = categories.map((c) => (c.id === id || c.slug === id ? { ...c, ...updates } : c));
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast('Category updated!');

    try {
      await fetch('/api/cms/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const deleteCategory = async (id: string) => {
    // Optimistic local state update
    const updated = categories.filter((c) => c.id !== id && c.slug !== id).map((c, idx) => ({ ...c, position: idx }));
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast('Category deleted!');

    try {
      await fetch(`/api/cms/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const addSubcategory = async (parentId: string, subData: Partial<CMSSubcategory>) => {
    const newSub: CMSSubcategory = {
      id: subData.id || `sub-${Date.now()}`,
      name: subData.name || 'New Subcategory',
      slug: subData.slug || (subData.name || 'new-sub').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      parentId,
      startingPrice: subData.startingPrice || '',
      position: 0,
      status: 'active',
      ...subData,
    };

    // Optimistic local state update
    const updated = categories.map((c) => {
      if (c.id === parentId || c.slug === parentId) {
        return {
          ...c,
          subcategories: [...(c.subcategories || []), newSub],
        };
      }
      return c;
    });
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast(`Subcategory "${newSub.name}" added!`);

    try {
      const res = await fetch('/api/cms/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subData, parentId }),
      });
      if (res.ok) {
        await fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
    return newSub;
  };

  const updateSubcategory = async (id: string, updates: Partial<CMSSubcategory>) => {
    // Optimistic local state update
    const updated = categories.map((c) => ({
      ...c,
      subcategories: (c.subcategories || []).map((s) => (s.id === id || s.slug === id ? { ...s, ...updates } : s)),
    }));
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast('Subcategory updated!');

    try {
      await fetch('/api/cms/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const deleteSubcategory = async (id: string) => {
    // Optimistic local state update
    const updated = categories.map((c) => ({
      ...c,
      subcategories: (c.subcategories || []).filter((s) => s.id !== id && s.slug !== id),
    }));
    setCategories(updated);
    try { localStorage.setItem('ls_categories', JSON.stringify(updated)); } catch (e) {}
    showToast('Subcategory removed!');

    try {
      await fetch(`/api/cms/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const reorderCategories = async (newCategories: CMSCategory[]) => {
    const reindexed = newCategories.map((c, i) => ({ ...c, position: i }));
    setCategories(reindexed);
    try { localStorage.setItem('ls_categories', JSON.stringify(reindexed)); } catch (e) {}
    showToast('Category order saved!');

    try {
      const items = reindexed.map((c, i) => ({ id: c.id, position: i }));
      await fetch('/api/cms/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: items }),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetCategoriesToDefault = async (): Promise<boolean> => {
    setCategories(DEFAULT_CMS_CATEGORIES);
    try { localStorage.setItem('ls_categories', JSON.stringify(DEFAULT_CMS_CATEGORIES)); } catch (e) {}
    showToast('Categories restored to 10 homepage showroom defaults!');
    return true;
  };

  // Invoicing Engine Methods
  const createInvoiceFromOrder = (order: any, buyerGstin?: string, isInterstate: boolean = false): Invoice => {
    const currentSettings = { ...invoiceSettings };
    if (!currentSettings.nextNumber || currentSettings.nextNumber >= 10000) {
      currentSettings.nextNumber = 1;
    }
    const nextSeq = currentSettings.nextNumber;
    currentSettings.nextNumber = nextSeq + 1;
    setInvoiceSettings(currentSettings);
    try {
      localStorage.setItem('ls_invoice_settings', JSON.stringify(currentSettings));
    } catch (e) {}

    const newInv = buildInvoiceFromOrder({
      order,
      settings: currentSettings,
      customBuyerGstin: buyerGstin,
      isInterstate
    });

    const updated = [newInv, ...invoices.filter((inv) => inv.orderId !== order.orderId && inv.id !== newInv.id)];
    setInvoices(updated);
    try {
      localStorage.setItem('ls_invoices', JSON.stringify(updated));
    } catch (e) {}

    return newInv;
  };

  const createManualInvoice = (manualData: Partial<Invoice>): Invoice => {
    const currentSettings = { ...invoiceSettings };
    if (!currentSettings.nextNumber || currentSettings.nextNumber >= 10000) {
      currentSettings.nextNumber = 1;
    }
    const nextSeq = currentSettings.nextNumber;
    currentSettings.nextNumber = nextSeq + 1;
    setInvoiceSettings(currentSettings);
    try {
      localStorage.setItem('ls_invoice_settings', JSON.stringify(currentSettings));
    } catch (e) {}

    const invoiceNumber = formatInvoiceNumber(currentSettings.prefix, currentSettings.financialYear, nextSeq);
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      financialYear: currentSettings.financialYear,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      placeOfSupply: `${currentSettings.state} (${currentSettings.stateCode})`,
      reverseCharge: 'No',
      sellerName: currentSettings.businessName,
      sellerAddress: `${currentSettings.address}, ${currentSettings.city}, ${currentSettings.state} - ${currentSettings.pincode}`,
      sellerGstin: currentSettings.gstin,
      sellerPan: currentSettings.pan,
      sellerPhone: currentSettings.phone,
      sellerEmail: currentSettings.email,
      sellerState: currentSettings.state,
      sellerStateCode: currentSettings.stateCode,
      buyerName: manualData.buyerName || 'Walk-in Customer',
      buyerPhone: manualData.buyerPhone || '+91 9608828288',
      buyerEmail: manualData.buyerEmail,
      buyerAddress: manualData.buyerAddress || 'Garhwa, Jharkhand',
      buyerState: manualData.buyerState || currentSettings.state,
      buyerStateCode: manualData.buyerStateCode || currentSettings.stateCode,
      buyerGstin: manualData.buyerGstin,
      items: manualData.items || [],
      subtotal: manualData.subtotal || 0,
      discountTotal: manualData.discountTotal || 0,
      taxableAmount: manualData.taxableAmount || 0,
      cgstTotal: manualData.cgstTotal || 0,
      sgstTotal: manualData.sgstTotal || 0,
      igstTotal: manualData.igstTotal || 0,
      totalTax: manualData.totalTax || 0,
      shipping: manualData.shipping || 0,
      roundOff: manualData.roundOff || 0,
      grandTotal: manualData.grandTotal || 0,
      amountInWords: manualData.amountInWords || 'Zero Rupees',
      paymentMethod: manualData.paymentMethod || 'Cash on Counter',
      paymentStatus: manualData.paymentStatus || 'Paid',
      upiId: currentSettings.upiId,
      upiQrData: manualData.upiQrData || '',
      notes: manualData.notes || 'Counter sale invoice. 100% genuine guaranteed.',
      terms: currentSettings.termsAndConditions,
      declaration: currentSettings.declaration,
      signatoryName: currentSettings.signatoryName && currentSettings.signatoryName !== 'Jay Prakash Chaubey' ? currentSettings.signatoryName : '',
      signatoryTitle: currentSettings.signatoryTitle || 'Authorized Signatory for Lapiez',
      createdAt: new Date().toISOString(),
      ...manualData
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem('ls_invoices', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Invoice #${newInv.invoiceNumber} generated!`);
    return newInv;
  };

  const updateInvoice = (inv: Invoice) => {
    const updated = invoices.map((i) => (i.id === inv.id || i.invoiceNumber === inv.invoiceNumber ? inv : i));
    setInvoices(updated);
    try {
      localStorage.setItem('ls_invoices', JSON.stringify(updated));
    } catch (e) {}
    showToast(`Invoice #${inv.invoiceNumber} updated!`);
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter((i) => i.id !== id && i.invoiceNumber !== id);
    setInvoices(updated);
    try {
      localStorage.setItem('ls_invoices', JSON.stringify(updated));
    } catch (e) {}
    showToast('Invoice deleted.');
  };

  const updateInvoiceSettings = (settings: Partial<InvoiceSettings>) => {
    const updated = { ...invoiceSettings, ...settings };
    setInvoiceSettings(updated);
    try {
      localStorage.setItem('ls_invoice_settings', JSON.stringify(updated));
    } catch (e) {}
    showToast('Invoice settings saved!');
  };

  const getInvoiceById = (idOrNumber: string) => {
    return invoices.find((i) => i.id === idOrNumber || i.invoiceNumber === idOrNumber);
  };

  const getInvoiceByOrderId = (orderId: string) => {
    return invoices.find((i) => i.orderId === orderId);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        wishlistIds,
        orders,
        leads,
        siteSettings,
        themeSettings,
        paymentSettings,
        paymentMethodsConfig,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setPrimaryBankAccount,
        banners,
        homepageSections,
        customPages,
        blogPosts,
        invoices,
        invoiceSettings,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAccountOpen,
        setIsAccountOpen,
        isAppModalOpen,
        setIsAppModalOpen,
        accountTab,
        setAccountTab,
        toast,
        showToast,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        placeOrder,
        createLead,
        updateProducts,
        updateOrders,
        fetchOrders,
        updateLeads,
        updateSiteSettings,
        updateThemeSettings,
        updatePaymentSettings,
        updatePaymentMethodsConfig,
        updateStoreAndPaymentSettings,
        updateInvoiceSettings,
        createInvoiceFromOrder,
        createManualInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoiceById,
        getInvoiceByOrderId,
        updateBanners,
        addBanner,
        editBanner,
        deleteBanner,
        resetBannersToDefault,
        addProductToDb,
        updateProductInDb,
        deleteProductFromDb,
        wipeAllProductsFromDb,
        trashProducts,
        isLoadingTrash,
        fetchTrashProducts,
        restoreProductFromDb,
        restoreAllTrash,
        emptyTrashDb,
        updateHomepageSections,
        updateHomepageSectionDetails,
        updateHomepageSectionProducts,
        resetHomepageSectionsToDefault,
        makeAllHomepageSectionsVisible,
        addCustomPage,
        editCustomPage,
        deleteCustomPage,
        addBlogPost,
        editBlogPost,
        deleteBlogPost,
        syncWithDatabase,
        customer,
        isCustomerLoading,
        signInWithGoogle: handleSignInWithGoogle,
        loginCustomerManually,
        signOutCustomer: handleSignOutCustomer,
        isCustomerAuthModalOpen,
        openCustomerAuthModal,
        closeCustomerAuthModal,
        authRedirectUrl,
        isApp,
        coupons,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        fetchCoupons,
        brands,
        addBrand,
        updateBrand,
        deleteBrand,
        reorderBrands,
        resetBrandsToDefault,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        reorderCategories,
        resetCategoriesToDefault,
        fetchCategories,
      }}
    >

      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
