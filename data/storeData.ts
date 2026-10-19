export interface StoreInfo {
  name: string;
  tagline: string;
  address: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  timings: string;
  established: string;
  mapsUrl: string;
  directionsUrl: string;
  embedMapUrl: string;
  lat: number;
  lng: number;
}

export const STORE_INFO: StoreInfo = {
  name: 'Lapiez',
  tagline: 'Technology • Security • Solutions',
  address: 'Chiniya Rd, Bishunpur, Opp G P Plaza',
  landmark: 'Chiniya Road, Bishunpur',
  city: 'Garhwa',
  district: 'Garhwa',
  state: 'Jharkhand',
  pincode: '822114',
  phone: '+91 9608828288',
  whatsapp: '919608828288',
  email: 'lapiezofficial@gmail.com',
  timings: 'Monday - Saturday: 10:00 AM - 8:30 PM',
  established: '2018',
  mapsUrl: 'https://www.google.com/maps/place/LAPPY+SOLUTION/@24.1624844,83.7994142,14.58z/data=!4m19!1m12!4m11!1m3!2m2!1d85.0827707!2d25.6822957!1m6!1m2!1s0x398c0f004ce430c7:0xe58fa9332947c20e!2sLAPPY+SOLUTION,+Chiniya+Rd,+Bishunpur,+Garhwa,+Jharkhand+822114!2m2!1d83.8030729!2d24.1581205!3m5!1s0x398c0f004ce430c7:0xe58fa9332947c20e!8m2!3d24.1581205!4d83.8030729!16s%2Fg%2F11vj3g_7j2?entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=24.1581205,83.8030729',
  embedMapUrl: 'https://maps.google.com/maps?q=24.1581205,83.8030729+(LAPPY+SOLUTION)&t=&z=16&ie=UTF8&iwloc=B&output=embed',
  lat: 24.1581205,
  lng: 83.8030729
};

/**
 * Standardize and clean WhatsApp number into strict international digits (91XXXXXXXXXX)
 * Prevents broken wa.me links caused by spaces, pluses, dashes or missing country codes.
 */
export function getCleanWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone) return STORE_INFO.whatsapp;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10) return digits;
  return STORE_INFO.whatsapp;
}

export interface ServiceItem {
  id: string;
  title: string;
  icon: string;
  shortDesc: string;
  description: string;
  features: string[];
  startingPrice: string;
  popular?: boolean;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'laptop-sales',
    title: 'Laptop & Computer Sales',
    icon: 'Laptop',
    shortDesc: 'Brand new & certified imported laptops from HP, Dell, Lenovo, ASUS & Apple with official warranty.',
    description: 'Find the ideal laptop tailored to your budget and work needs. We stock business series, gaming rigs, student portables, and certified imported laptops with full local warranty.',
    features: ['100% Genuine with Bill', 'Brand Warranty Support', 'Free Initial Setup & Software', 'Best Price Guarantee in Garhwa'],
    startingPrice: '₹18,500',
    popular: true
  },
  {
    id: 'chip-repair',
    title: 'Chip-Level Laptop Repair',
    icon: 'Wrench',
    shortDesc: 'Advanced motherboard diagnostics, chip replacement, display fixes, keyboard & battery replacements.',
    description: 'Our certified technicians in Garhwa perform microscopic solder work, BGA reballing, liquid damage recovery, and hinge/body rebuilding with precision testing equipment.',
    features: ['No Display / Dead Motherboard Fix', 'Screen & Hinge Replacement', 'Original Batteries & Chargers', 'Fast 24-48h Turnaround'],
    startingPrice: '₹450',
    popular: true
  },
  {
    id: 'cctv-setup',
    title: 'CCTV Installation & Maintenance',
    icon: 'Camera',
    shortDesc: 'Turnkey surveillance systems for homes, retail shops, schools, hospitals, and warehouses.',
    description: 'Official partners for CP-PLUS and Hikvision. We handle site survey, neat concealed cabling, DVR/NVR configuration, and instant mobile view setup on your phone.',
    features: ['High-Definition Night Vision', 'Live Mobile App Setup', 'On-site AMC & Cable Relocation', '1-2 Year On-site Warranty'],
    startingPrice: '₹2,500',
    popular: true
  },
  {
    id: 'custom-pc',
    title: 'Custom PC Assembly',
    icon: 'Cpu',
    shortDesc: 'Purpose-built gaming, 3D rendering, video editing, and office workstation rigs.',
    description: 'We calculate exact power requirements, optimal airflow, cable management, and stress-test every component with 24-hour thermal benchmarks before hand-off.',
    features: ['Component Compatibility Check', 'Stress & Thermal Tested', 'Clean Cable Aesthetics', 'Lifetime Tech Consultation'],
    startingPrice: '₹22,000'
  },
  {
    id: 'networking',
    title: 'Office & LAN Networking',
    icon: 'Network',
    shortDesc: 'Structured cabling, gigabit switch installation, high-speed Wi-Fi 6 mesh & fiber routing.',
    description: 'Eliminate dead zones in your shop, multi-story home, or enterprise building. Complete Cat6 cabling, patch panel crimping, and firewall router setup.',
    features: ['Multi-Room Seamless Wi-Fi', 'High Speed Cat6 Structured Cabling', 'Network Security & Bandwidth Control', 'Rack & Switch Termination'],
    startingPrice: '₹1,500'
  },
  {
    id: 'printer-repair',
    title: 'Printer Repair & Cartridge Refill',
    icon: 'Printer',
    shortDesc: 'LaserJet & InkTank printer servicing, head cleaning, paper pickup roller & toner refills.',
    description: 'Authorized service expertise for Epson, Canon, HP, and Brother printers. Rapid toner cartridge refilling and original ink refills at wholesale rates.',
    features: ['Cartridge & Ink Refills', 'Paper Jam & Roller Fix', 'Head Unclogging & Cleaning', 'Logic Board Repair'],
    startingPrice: '₹250'
  },
  {
    id: 'amc-service',
    title: 'Annual Maintenance Contract (AMC)',
    icon: 'ShieldCheck',
    shortDesc: 'Comprehensive maintenance contracts for schools, colleges, banks, offices, and institutions in Garhwa.',
    description: 'Keep your IT systems running without downtime. Includes scheduled monthly preventive checkups, emergency priority support, and antivirus definitions update.',
    features: ['Scheduled Preventive Visits', 'Zero Downtime Guarantee', 'Free Routine Cleaning & Tune-up', 'Discounted Spare Parts'],
    startingPrice: 'Custom Quote'
  },
  {
    id: 'data-recovery',
    title: 'Data Recovery & Backup',
    icon: 'HardDrive',
    shortDesc: 'Safe recovery of critical documents, photos, and databases from corrupted or formatted drives.',
    description: 'Specialized recovery for accidentally formatted hard drives, RAW partition SSDs, broken USB flash drives, and automatic automated cloud/local backup setups.',
    features: ['RAW & Corrupted Drive Recovery', 'Accidental Deletion Retrieval', 'Automated Daily Backup Setup', 'Strict Data Confidentiality'],
    startingPrice: '₹950'
  }
];

export interface PcPart {
  id: string;
  name: string;
  category: 'processor' | 'motherboard' | 'ram' | 'storage' | 'gpu' | 'psu' | 'cabinet';
  brand: string;
  price: number;
  specs: string;
}

export const PC_PARTS = {
  processors: [
    { id: 'cpu-1', name: 'Intel Core i3 12100 (12th Gen)', brand: 'Intel', price: 8200, specs: '4 Cores, 8 Threads, Up to 4.3 GHz, LGA1700' },
    { id: 'cpu-2', name: 'Intel Core i5 12400F (12th Gen)', brand: 'Intel', price: 11999, specs: '6 Cores, 12 Threads, Up to 4.4 GHz (Requires GPU)' },
    { id: 'cpu-3', name: 'Intel Core i5 14400F (14th Gen)', brand: 'Intel', price: 17999, specs: '10 Cores (6P+4E), 16 Threads, Up to 4.7 GHz' },
    { id: 'cpu-4', name: 'Intel Core i7 13700K (13th Gen)', brand: 'Intel', price: 34999, specs: '16 Cores (8P+8E), 24 Threads, Up to 5.4 GHz' },
    { id: 'cpu-5', name: 'AMD Ryzen 5 5600', brand: 'AMD', price: 10499, specs: '6 Cores, 12 Threads, 35MB Cache, Up to 4.4 GHz' },
    { id: 'cpu-6', name: 'AMD Ryzen 7 7700X (AM5)', brand: 'AMD', price: 28999, specs: '8 Cores, 16 Threads, Zen 4, Up to 5.4 GHz, DDR5' }
  ],
  motherboards: [
    { id: 'mobo-1', name: 'MSI PRO H610M-E DDR4', brand: 'MSI', price: 6100, specs: 'Intel LGA1700, PCIe 4.0, M.2 Slot, USB 3.2 Gen 1' },
    { id: 'mobo-2', name: 'Gigabyte B760M DS3H AX (Wi-Fi)', brand: 'Gigabyte', price: 12400, specs: 'Intel LGA1700, DDR5, Wi-Fi 6E, Dual M.2 PCIe 4.0' },
    { id: 'mobo-3', name: 'ASUS Prime B550M-A Wi-Fi II', brand: 'ASUS', price: 9200, specs: 'AMD AM4, PCIe 4.0, Wi-Fi 6, Dual M.2, Aura Sync' },
    { id: 'mobo-4', name: 'MSI B650M Gaming Wi-Fi (AM5)', brand: 'MSI', price: 13900, specs: 'AMD AM5, DDR5, Wi-Fi 6E, 2.5G LAN, Core Boost' }
  ],
  ram: [
    { id: 'ram-1', name: 'Crucial 8GB DDR4 3200MHz', brand: 'Crucial', price: 1650, specs: '1x 8GB DDR4 Desktop Memory, CL22' },
    { id: 'ram-2', name: 'Corsair Vengeance 16GB (8x2) DDR4 3200MHz', brand: 'Corsair', price: 3400, specs: 'Dual Channel Kit, Aluminum Heatspreader' },
    { id: 'ram-3', name: 'G.Skill Ripjaws S5 16GB (16x1) DDR5 6000MHz', brand: 'G.Skill', price: 4600, specs: 'High Speed DDR5, Low Profile, Intel XMP 3.0' },
    { id: 'ram-4', name: 'Corsair Vengeance RGB 32GB (16x2) DDR5 6000MHz', brand: 'Corsair', price: 9800, specs: '32GB Ultra Fast Kit, Ten-Zone RGB Lighting' }
  ],
  storage: [
    { id: 'stor-1', name: 'Crucial P3 512GB NVMe PCIe 3.0 SSD', brand: 'Crucial', price: 3200, specs: 'Up to 3500MB/s Read, M.2 2280 NVMe' },
    { id: 'stor-2', name: 'Western Digital Black SN770 1TB Gen4 NVMe', brand: 'WD', price: 6200, specs: 'Up to 5150MB/s Read, Gen4 Gaming SSD' },
    { id: 'stor-3', name: 'Kingston NV2 2TB PCIe 4.0 NVMe SSD', brand: 'Kingston', price: 10999, specs: '2TB High Capacity High Speed Storage' },
    { id: 'stor-4', name: 'Seagate Barracuda 2TB 7200RPM HDD', brand: 'Seagate', price: 5400, specs: 'Secondary Mass Storage for Media & CCTV' }
  ],
  gpu: [
    { id: 'gpu-none', name: 'Integrated Graphics (No Dedicated GPU)', brand: 'Intel/AMD', price: 0, specs: 'Sufficient for Office, Browsing, Tally, Billing & YouTube' },
    { id: 'gpu-1', name: 'ZOTAC GeForce GTX 1650 4GB GDDR6', brand: 'ZOTAC', price: 12900, specs: 'Entry 1080p Esports Gaming & Dual Monitors' },
    { id: 'gpu-2', name: 'Inno3D GeForce RTX 3050 6GB GDDR6', brand: 'NVIDIA', price: 16999, specs: 'Ray Tracing, DLSS 2.0, Low Power Draw' },
    { id: 'gpu-3', name: 'MSI GeForce RTX 4060 Ventus 2X 8GB OC', brand: 'MSI', price: 28999, specs: 'Ada Lovelace, DLSS 3 Frame Gen, 1080p Ultra Gaming' },
    { id: 'gpu-4', name: 'Gigabyte GeForce RTX 4070 Super Eagle 12GB', brand: 'Gigabyte', price: 59999, specs: '1440p / 4K Gaming, 3D Blender, Unreal Engine' }
  ],
  psu: [
    { id: 'psu-1', name: 'Ant Esports VS450L 450W', brand: 'Ant Esports', price: 1550, specs: 'Standard Office Power Supply with 120mm Fan' },
    { id: 'psu-2', name: 'Deepcool PK550D 550W 80 PLUS Bronze', brand: 'Deepcool', price: 3450, specs: '80+ Bronze Certified, Flat Black Cables, 5-Yr Warranty' },
    { id: 'psu-3', name: 'Cooler Master MWE 650 V2 650W 80 PLUS Bronze', brand: 'Cooler Master', price: 4950, specs: 'Reliable Japanese Caps, DC-to-DC Circuit' },
    { id: 'psu-4', name: 'Corsair RM750e 750W 80 PLUS Gold Fully Modular', brand: 'Corsair', price: 9200, specs: 'ATX 3.0 & PCIe 5.0 Ready, Zero RPM Fan Mode' }
  ],
  cabinet: [
    { id: 'cab-1', name: 'Frontech Compact Office Cabinet with USB 3.0', brand: 'Frontech', price: 1200, specs: 'Minimalist Clean Black Chassis for Office & Shop' },
    { id: 'cab-2', name: 'Ant Esports ICE-100 Air Mini Mesh ARGB', brand: 'Ant Esports', price: 2900, specs: 'High Airflow Front Mesh with 4x Pre-installed ARGB Fans' },
    { id: 'cab-3', name: 'Deepcool CC560 V2 Tempered Glass Mid-Tower', brand: 'Deepcool', price: 3950, specs: 'Clean Aesthetics, 4x LED Fans, Supports 360mm Rad' },
    { id: 'cab-4', name: 'Lian Li LANCOOL 216 RGB Black', brand: 'Lian Li', price: 7900, specs: 'Ultra High Airflow with Dual 160mm ARGB Fans' }
  ]
};

export interface CctvPackageOption {
  camerasCount: number;
  cameraType: '2mp-hd' | '5mp-color' | '4mp-ip' | '4g-solar';
  propertyType: 'home' | 'shop' | 'office' | 'school' | 'warehouse';
  storageDays: '15-days' | '30-days' | '60-days';
}

export const CCTV_CONFIG = {
  cameraPricing: {
    '2mp-hd': { name: 'CP-PLUS 2MP Full HD IR (Day/Night)', pricePerUnit: 1450, indoor: 'Dome', outdoor: 'Bullet' },
    '5mp-color': { name: 'CP-PLUS 5MP Full Color with Built-in Mic', pricePerUnit: 2250, indoor: 'Color Dome', outdoor: 'Color Bullet' },
    '4mp-ip': { name: 'CP-PLUS 4MP Network IP AI Human Detection', pricePerUnit: 3400, indoor: 'IP Dome', outdoor: 'IP Bullet' },
    '4g-solar': { name: 'Consistent 4G Solar PTZ Camera (SIM Card)', pricePerUnit: 5800, indoor: 'Outdoor Only', outdoor: 'Solar PTZ' }
  },
  dvrPricing: {
    4: { name: 'CP-PLUS 4-Channel Full HD DVR/NVR', price: 2800 },
    8: { name: 'CP-PLUS 8-Channel Full HD DVR/NVR', price: 4200 },
    16: { name: 'CP-PLUS 16-Channel 5MP DVR/NVR', price: 7800 },
    32: { name: 'CP-PLUS 32-Channel Commercial NVR', price: 16500 }
  },
  storagePricing: {
    '15-days': { size: '1TB WD Purple / Seagate SkyHawk', price: 3800 },
    '30-days': { size: '2TB WD Purple Surveillance HDD', price: 5400 },
    '60-days': { size: '4TB WD Purple Surveillance HDD', price: 9200 }
  },
  accessoriesPerCamera: {
    cablePerCamMeters: 20,
    costPerMeter: 18,
    smpsAndBncCostPerCam: 350,
    installationLaborPerCam: 300
  }
};

export const INITIAL_LEADS: any[] = [];

export const INITIAL_ORDERS: any[] = [];

