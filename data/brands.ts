export interface CMSBrand {
  id: string;
  name: string;
  query: string;
  logoType: 'preset' | 'image' | 'text';
  presetKey?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  position: number;
  isVisible: boolean;
}

export interface BrandsCarouselConfig {
  autoScroll: boolean;
  speed: 'slow' | 'normal' | 'fast' | 'superfast';
  speedSeconds: number;
  direction: 'dual' | 'left' | 'right';
  pauseOnHover: boolean;
}

export const DEFAULT_BRANDS_CAROUSEL_CONFIG: BrandsCarouselConfig = {
  autoScroll: true,
  speed: 'normal',
  speedSeconds: 28,
  direction: 'dual',
  pauseOnHover: true,
};

export const DEFAULT_BRANDS: CMSBrand[] = [
  // 1. HP (New Modern Logo)
  { id: 'brand-hp', name: 'HP', query: 'HP', logoType: 'preset', presetKey: 'hp', position: 0, isVisible: true },
  // 2. Dell
  { id: 'brand-dell', name: 'Dell', query: 'Dell', logoType: 'preset', presetKey: 'dell', position: 1, isVisible: true },
  // 3. Lenovo
  { id: 'brand-lenovo', name: 'Lenovo', query: 'Lenovo', logoType: 'preset', presetKey: 'lenovo', bgColor: '#E2231A', textColor: '#FFFFFF', position: 2, isVisible: true },
  // 4. Acer
  { id: 'brand-acer', name: 'Acer', query: 'Acer', logoType: 'preset', presetKey: 'acer', textColor: '#83B81A', position: 3, isVisible: true },
  // 5. ASUS
  { id: 'brand-asus', name: 'ASUS', query: 'ASUS', logoType: 'preset', presetKey: 'asus', textColor: '#000000', position: 4, isVisible: true },
  // 6. Frontech
  { id: 'brand-frontech', name: 'Frontech', query: 'Frontech', logoType: 'preset', presetKey: 'frontech', bgColor: '#FEC907', textColor: '#000000', position: 5, isVisible: true },
  // 7. CP-PLUS
  { id: 'brand-cpplus', name: 'CP-PLUS', query: 'CP-PLUS', logoType: 'preset', presetKey: 'cpplus', position: 6, isVisible: true },
  // 8. Hikvision
  { id: 'brand-hikvision', name: 'Hikvision', query: 'Hikvision', logoType: 'preset', presetKey: 'hikvision', position: 7, isVisible: true },
  // 9. Lapcare
  { id: 'brand-lapcare', name: 'Lapcare', query: 'Lapcare', logoType: 'preset', presetKey: 'lapcare', position: 8, isVisible: true },
  // 10. Lappy Power
  { id: 'brand-lappypower', name: 'Lappy Power', query: 'Lappy Power', logoType: 'preset', presetKey: 'lappypower', position: 9, isVisible: true },
  // 11. Prodot
  { id: 'brand-prodot', name: 'Prodot', query: 'Prodot', logoType: 'preset', presetKey: 'prodot', position: 10, isVisible: true },
  // 12. D-Link
  { id: 'brand-dlink', name: 'D-Link', query: 'D-Link', logoType: 'preset', presetKey: 'dlink', position: 11, isVisible: true },
  // 13. Epson
  { id: 'brand-epson', name: 'Epson', query: 'Epson', logoType: 'preset', presetKey: 'epson', position: 12, isVisible: true },
  // 14. Canon
  { id: 'brand-canon', name: 'Canon', query: 'Canon', logoType: 'preset', presetKey: 'canon', position: 13, isVisible: true },
  // 15. Brother
  { id: 'brand-brother', name: 'Brother', query: 'Brother', logoType: 'preset', presetKey: 'brother', position: 14, isVisible: true },
  // 16. Consistent
  { id: 'brand-consistent', name: 'Consistent', query: 'Consistent', logoType: 'preset', presetKey: 'consistent', position: 15, isVisible: true },
  // 17. Zebronics
  { id: 'brand-zebronics', name: 'Zebronics', query: 'Zebronics', logoType: 'preset', presetKey: 'zebronics', position: 16, isVisible: true },
  // 18. Rapoo
  { id: 'brand-rapoo', name: 'Rapoo', query: 'Rapoo', logoType: 'preset', presetKey: 'rapoo', position: 17, isVisible: true },
  // 19. Fingers
  { id: 'brand-fingers', name: 'Fingers', query: 'Fingers', logoType: 'preset', presetKey: 'fingers', position: 18, isVisible: true },
  // 20. Hoki
  { id: 'brand-hoki', name: 'Hoki', query: 'Hoki', logoType: 'preset', presetKey: 'hoki', position: 19, isVisible: true },
  // 21. Logitech
  { id: 'brand-logitech', name: 'Logitech', query: 'Logitech', logoType: 'preset', presetKey: 'logitech', position: 20, isVisible: true },
  // 22. Intel
  { id: 'brand-intel', name: 'Intel', query: 'Intel', logoType: 'preset', presetKey: 'intel', position: 21, isVisible: true },
  // 23. AMD
  { id: 'brand-amd', name: 'AMD', query: 'AMD', logoType: 'preset', presetKey: 'amd', position: 22, isVisible: true },
  // 24. Nvidia
  { id: 'brand-nvidia', name: 'Nvidia', query: 'Nvidia', logoType: 'preset', presetKey: 'nvidia', position: 23, isVisible: true },
  // 25. Western Digital (WD)
  { id: 'brand-wd', name: 'Western Digital', query: 'Western Digital', logoType: 'preset', presetKey: 'wd', position: 24, isVisible: true },
  // 26. Seagate
  { id: 'brand-seagate', name: 'Seagate', query: 'Seagate', logoType: 'preset', presetKey: 'seagate', position: 25, isVisible: true },
  // 27. Kingston
  { id: 'brand-kingston', name: 'Kingston', query: 'Kingston', logoType: 'preset', presetKey: 'kingston', position: 26, isVisible: true },
  // 28. SanDisk
  { id: 'brand-sandisk', name: 'SanDisk', query: 'SanDisk', logoType: 'preset', presetKey: 'sandisk', position: 27, isVisible: true },
  // 29. Crucial
  { id: 'brand-crucial', name: 'Crucial', query: 'Crucial', logoType: 'preset', presetKey: 'crucial', position: 28, isVisible: true },
  // 30. Transcend
  { id: 'brand-transcend', name: 'Transcend', query: 'Transcend', logoType: 'preset', presetKey: 'transcend', position: 29, isVisible: true },
  // 31. ADATA
  { id: 'brand-adata', name: 'ADATA', query: 'ADATA', logoType: 'preset', presetKey: 'adata', position: 30, isVisible: true },
  // 32. Samsung
  { id: 'brand-samsung', name: 'Samsung', query: 'Samsung', logoType: 'preset', presetKey: 'samsung', position: 31, isVisible: true },
  // 33. LG
  { id: 'brand-lg', name: 'LG', query: 'LG', logoType: 'preset', presetKey: 'lg', position: 32, isVisible: true },
  // 34. BenQ
  { id: 'brand-benq', name: 'BenQ', query: 'BenQ', logoType: 'preset', presetKey: 'benq', position: 33, isVisible: true },
  // 35. ViewSonic
  { id: 'brand-viewsonic', name: 'ViewSonic', query: 'ViewSonic', logoType: 'preset', presetKey: 'viewsonic', position: 34, isVisible: true },
  // 36. MSI
  { id: 'brand-msi', name: 'MSI', query: 'MSI', logoType: 'preset', presetKey: 'msi', position: 35, isVisible: true },
  // 37. Gigabyte
  { id: 'brand-gigabyte', name: 'Gigabyte', query: 'Gigabyte', logoType: 'preset', presetKey: 'gigabyte', position: 36, isVisible: true },
  // 38. Corsair
  { id: 'brand-corsair', name: 'Corsair', query: 'Corsair', logoType: 'preset', presetKey: 'corsair', position: 37, isVisible: true },
  // 39. Ant Esports
  { id: 'brand-antesports', name: 'Ant Esports', query: 'Ant Esports', logoType: 'preset', presetKey: 'antesports', position: 38, isVisible: true },
  // 40. Cosmic Byte
  { id: 'brand-cosmicbyte', name: 'Cosmic Byte', query: 'Cosmic Byte', logoType: 'preset', presetKey: 'cosmicbyte', position: 39, isVisible: true },
  // 41. Redragon
  { id: 'brand-redragon', name: 'Redragon', query: 'Redragon', logoType: 'preset', presetKey: 'redragon', position: 40, isVisible: true },
  // 42. TP-Link
  { id: 'brand-tplink', name: 'TP-Link', query: 'TP-Link', logoType: 'preset', presetKey: 'tplink', position: 41, isVisible: true },
  // 43. Dahua
  { id: 'brand-dahua', name: 'Dahua', query: 'Dahua', logoType: 'preset', presetKey: 'dahua', position: 42, isVisible: true },
  // 44. EZVIZ
  { id: 'brand-ezviz', name: 'EZVIZ', query: 'EZVIZ', logoType: 'preset', presetKey: 'ezviz', position: 43, isVisible: true },
  // 45. Imou
  { id: 'brand-imou', name: 'Imou', query: 'Imou', logoType: 'preset', presetKey: 'imou', position: 44, isVisible: true },
  // 46. Secureye
  { id: 'brand-secureye', name: 'Secureye', query: 'Secureye', logoType: 'preset', presetKey: 'secureye', position: 45, isVisible: true },
  // 47. Tenda
  { id: 'brand-tenda', name: 'Tenda', query: 'Tenda', logoType: 'preset', presetKey: 'tenda', position: 46, isVisible: true },
  // 48. Portronics
  { id: 'brand-portronics', name: 'Portronics', query: 'Portronics', logoType: 'preset', presetKey: 'portronics', position: 47, isVisible: true },
  // 49. TVS Electronics
  { id: 'brand-tvse', name: 'TVS Electronics', query: 'TVS', logoType: 'preset', presetKey: 'tvse', position: 48, isVisible: true },
  // 50. iBall
  { id: 'brand-iball', name: 'iBall', query: 'iBall', logoType: 'preset', presetKey: 'iball', position: 49, isVisible: true },
  // 51. Intex
  { id: 'brand-intex', name: 'Intex', query: 'Intex', logoType: 'preset', presetKey: 'intex', position: 50, isVisible: true },
  // 52. APC
  { id: 'brand-apc', name: 'APC', query: 'APC', logoType: 'preset', presetKey: 'apc', position: 51, isVisible: true },
  // 53. Microtek
  { id: 'brand-microtek', name: 'Microtek', query: 'Microtek', logoType: 'preset', presetKey: 'microtek', position: 52, isVisible: true },
  // 54. Luminous
  { id: 'brand-luminous', name: 'Luminous', query: 'Luminous', logoType: 'preset', presetKey: 'luminous', position: 53, isVisible: true },
  // 55. Pantum
  { id: 'brand-pantum', name: 'Pantum', query: 'Pantum', logoType: 'preset', presetKey: 'pantum', position: 54, isVisible: true },
  // 56. Quick
  { id: 'brand-quick', name: 'Quick', query: 'Quick', logoType: 'preset', presetKey: 'quick', position: 55, isVisible: true },
  // 57. Mechanic
  { id: 'brand-mechanic', name: 'Mechanic', query: 'Mechanic', logoType: 'preset', presetKey: 'mechanic', position: 56, isVisible: true },
];
