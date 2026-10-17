export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
  tags: string;
  status: 'published' | 'draft';
  createdAt: string;
  featured?: boolean;
}

export const DEFAULT_BLOGS: BlogPostItem[] = [
  {
    id: "blog-refurb-2026",
    slug: "refurbished-vs-new-laptops-guide-2026",
    title: "Refurbished vs Brand New Laptops: Why Certified Pre-Owned Saves You Up to 60%",
    excerpt: "Discover why students, coaching institutes, and businesses in Garhwa are choosing Grade-A certified refurbished Dell Latitude, Lenovo ThinkPad, and HP EliteBook laptops over cheap plastic new laptops.",
    content: `Buying a laptop today can be overwhelming. Brand-new budget laptops under ₹30,000 often cut corners with cheap plastic chassis, dim displays, and entry-level Celeron or Athlon processors that lag after a few months.

On the other hand, **Certified Refurbished Business Laptops** (such as Dell Latitude, Lenovo ThinkPad, and HP EliteBook) were originally built for corporate enterprises with starting prices upwards of ₹80,000.

## 1. Magnesium-Alloy Military-Grade Durability
Enterprise laptops are built to withstand daily office transit, minor spills, and high workloads. Their metal hinges, spill-resistant keyboards, and copper cooling systems far outperform retail consumer models.

## 2. Powerful Core i5/i7 Processors + Fast NVMe SSDs
At Lapiez Garhwa, all refurbished laptops are upgraded with brand-new Crucial/Kingston NVMe SSDs and 8GB to 16GB of DDR4 RAM. They boot Windows 11 in under 10 seconds and handle intensive multitasking effortlessly.

## 3. Rigorous 28-Point Showroom Testing Bench
Every machine undergoes extensive quality certification before hitting the showroom shelf:
* **Battery Health Test:** Minimum 2.5 to 4 hours active backup under heavy YouTube/office load.
* **Display Inspection:** Backlight uniformity and zero dead pixel verification.
* **Hardware Diagnostics:** Keyboard keys, trackpad gesture test, webcam, microphone, and HDMI/USB port validation.
* **Thermal Overhaul:** Ultrasonic fan cleaning and fresh Arctic MX-4 thermal paste reapplication.

## 4. Showroom Testing Bench & Local Warranty
Unlike online unverified sellers, Lapiez gives you the freedom to sit at our Chiniya Road testing bench, run benchmarks, check hardware specifications live, and receive our dedicated local showroom warranty.`,
    coverImage: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&auto=format&fit=crop&q=80",
    category: "Buying Guide",
    author: "Rupesh Kumar (Lapiez Tech Team)",
    readTime: "5 min read",
    tags: "refurbished,laptops,guide,dell,hp,thinkpad",
    status: "published",
    createdAt: "2026-10-12T10:00:00.000Z",
    featured: true
  },
  {
    id: "blog-cctv-guide",
    slug: "how-to-choose-cctv-camera-system-garhwa",
    title: "Complete Guide: Choosing the Best CCTV Camera Setup for Your Shop or Home",
    excerpt: "Learn the differences between 2MP, 5MP, and IP CCTV cameras, night vision requirements, and mobile app live view setup for Garhwa & Palamu properties.",
    content: `Security is essential for retail shops, godowns, schools, and residences across Jharkhand. Choosing the right surveillance setup prevents blind spots, captures clear number plates, and provides instant mobile access.

## 1. Analog HD vs IP Network Cameras
* **Analog HD (CP-PLUS / Frontech 2MP & 5MP):** Cost-effective, reliable coaxial cabling, ideal for retail counters, grocery stores, and 1-2 room offices.
* **IP PoE Cameras (Cat6 Structured Cabling):** Ultra high-definition, crystal-clear digital zoom, wide dynamic range (WDR), ideal for multi-storey showrooms, godowns, and outdoor perimeter security.

## 2. Full-Color Night Vision vs Traditional Infrared
Traditional IR cameras switch to grainy black and white footage when the lights turn off. Modern **Full-Color LED cameras** use warm auxiliary lighting to record vibrant, full-color HD video even in pitch darkness, allowing accurate identification of clothing color and vehicle details.

## 3. Storage Calculation & Surveillance Hard Disks
Standard desktop PC hard drives fail quickly in CCTV DVRs. We exclusively use **Seagate SkyHawk and WD Purple surveillance hard disks** built for 24/7 continuous write cycles:
* 4 Cameras @ 2MP with H.265 compression: 1TB gives approximately 15-20 days continuous recording.
* 8 Cameras @ 5MP: 2TB to 4TB recommended for 30 days retention.

## 4. Remote Live View on Your Android & iPhone
Every CCTV package installed by Lapiez includes complete mobile app setup so you can watch live video, playback footage, and receive motion alerts on your smartphone anywhere in the world.

Contact our team at **+91 9608828288** for a free site inspection and instant quotation in Garhwa!`,
    coverImage: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1000&auto=format&fit=crop&q=80",
    category: "Security & Surveillance",
    author: "Lapiez Security Services",
    readTime: "6 min read",
    tags: "cctv,cpplus,security,cameras,installation,nightvision",
    status: "published",
    createdAt: "2026-10-14T09:30:00.000Z",
    featured: true
  },
  {
    id: "blog-frontech-monitors",
    slug: "frontech-curved-gaming-monitors-review",
    title: "Review: Frontech 100Hz & 200Hz Curved Frameless Monitors in Garhwa",
    excerpt: "An in-depth look at Frontech's Ultima & Gaming monitor series available at Lapiez with 3-year warranty and prices starting at ₹5,999.",
    content: `Frontech has revolutionized the Indian display market with their new **Ultima and Gaming series displays**. For users in Garhwa and Palamu looking for frameless designs, vibrant color accuracy, and high refresh rates without breaking the bank, Frontech offers unbeatable value.

## 1. 100Hz to 200Hz Ultra-Smooth Refresh Rates
Standard office monitors operate at 60Hz. Stepping up to 100Hz or 200Hz eliminates ghosting and motion blur in fast-paced gaming (BGMI, CS:GO, Valorant) and makes daily document scrolling buttery smooth.

## 2. Frameless Curved Panels (1500R Curvature)
The 1500R curvature wraps around your natural field of view, reducing eye fatigue during long coding, accounting, or gaming sessions. Multi-monitor setups look seamless thanks to the ultra-slim 2mm bezels.

## 3. Dual HDMI & VGA Connectivity
Connect your laptop, desktop PC, CCTV DVR, or gaming console seamlessly with built-in audio-out for external speakers and headphones.

## 4. 3-Year All-India On-Site Warranty
Backed by official Frontech service centers and 100% genuine replacement support at Lapiez. Drop by our Garhwa showroom counter to witness the display clarity and contrast side-by-side!`,
    coverImage: "https://cdn.shopify.com/s/files/1/0854/3227/1149/files/24.5_inch_mon_0087v_01.jpg?v=1772186717",
    category: "Display & Gaming",
    author: "Lapiez Hardware Lab",
    readTime: "4 min read",
    tags: "frontech,monitors,gaming,curved,review,100hz",
    status: "published",
    createdAt: "2026-10-15T11:00:00.000Z",
    featured: false
  },
  {
    id: "blog-ssd-upgrade-2026",
    slug: "ssd-upgrade-guide-revive-old-laptop",
    title: "SSD Upgrade Guide: How NVMe & SATA SSDs Revive Slow Laptops in 10 Minutes",
    excerpt: "Is your 4-year-old laptop taking 3 minutes to boot? Learn how upgrading from traditional mechanical HDD to Crucial or Kingston NVMe SSD boosts speed by 500% with zero data loss.",
    content: `If your laptop takes forever to boot Windows or hangs when opening Google Chrome, your mechanical hard disk drive (HDD) is almost certainly the bottleneck. Upgrading to a Solid State Drive (SSD) is the single most cost-effective performance upgrade you can make.

## 1. HDD vs SATA SSD vs NVMe M.2 Speed Comparison
* **Mechanical HDD:** ~100 to 120 MB/s read/write speed with mechanical spin latency.
* **SATA 2.5-inch SSD (Crucial BX500):** ~540 MB/s speed (4x to 5x faster than HDD).
* **NVMe M.2 PCIe Gen 4 (Crucial P3 Plus / Kingston):** ~3,500 to 5,000 MB/s speed (30x faster than HDD).

## 2. Boot Times Slashed from 3 Minutes to 8 Seconds
With an SSD installed:
* Windows 11 boots instantly in 7-10 seconds.
* Chrome opens with 20 tabs without lag.
* Microsoft Office and Tally Prime launch in 1 second.
* Battery life improves because SSDs have zero moving parts and consume 60% less power.

## 3. 100% Data Cloning Without Losing Files or Software
At Lapiez Garhwa, our technical lab clones your existing Windows license, desktop files, software, and accounting data directly onto the new SSD. You get your laptop back within 30 minutes with identical files, just 5x faster!`,
    coverImage: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1000&auto=format&fit=crop&q=80",
    category: "Laptop Upgrades & SSD",
    author: "Senior Chip-Level Engineer, Lapiez",
    readTime: "5 min read",
    tags: "ssd,nvme,crucial,kingston,upgrade,speed,tally",
    status: "published",
    createdAt: "2026-10-16T08:00:00.000Z",
    featured: false
  },
  {
    id: "blog-battery-maintenance",
    slug: "laptop-battery-care-overheating-prevention",
    title: "Laptop Battery Health & Indian Summer Overheating Prevention Guide",
    excerpt: "Why laptop batteries degrade quickly in hot climates, when to re-apply thermal cooling paste, how to test battery cycles, and the real risks of cheap duplicate chargers.",
    content: `Summer temperatures in Jharkhand frequently exceed 42°C, which poses severe risks to laptop motherboards and lithium-ion battery cells. Here is our official hardware maintenance guide to keep your machine cool and healthy.

## 1. The Dangers of Using Duplicate Cheap Chargers
Duplicate power adapters lack surge protection, filter capacitors, and precise voltage regulation. They send erratic ripple voltage into the charging IC, causing motherboard burns and battery swelling within months. Always use 100% original OEM adapters.

## 2. When Should You Clean the Cooling Fan & Thermal Paste?
Every laptop accumulates dust, lint, and hair inside the heatsink fins over 12 to 18 months. When the factory thermal paste dries up:
* The laptop runs hot to the touch.
* The CPU throttles down clock speeds, causing severe lagging.
* The fan spins at maximum RPM making loud noise.
Re-applying premium thermal compound (like Arctic MX-4) drops CPU temperatures by up to 15°C instantly.

## 3. Best Battery Charging Habits
* Avoid keeping the laptop plugged in 24/7 at 100% on a hot desk.
* Never use your laptop on a bed or pillow as it blocks the bottom air intake vents.
* Calibrate your battery every 2-3 months by running it down to 10% and charging uninterrupted to full.`,
    coverImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80",
    category: "Maintenance & Care",
    author: "Lapiez Service Center",
    readTime: "6 min read",
    tags: "battery,overheating,cooling,charger,maintenance",
    status: "published",
    createdAt: "2026-10-16T14:30:00.000Z",
    featured: false
  },
  {
    id: "blog-printer-guide",
    slug: "ink-tank-vs-laser-printers-guide",
    title: "Ink Tank vs Laser Printers: Complete Cost-Per-Page Breakdown for Offices & Cyber Cafes",
    excerpt: "Comparing HP LaserJet 1020 Plus vs Epson EcoTank printers. Which one saves more on paper, toner refills, electricity, and photo printing for small businesses in Jharkhand?",
    content: `For retail shops, schools, law offices, and cyber cafes in Garhwa, printing costs can eat into monthly profits. Choosing between an Ink Tank printer and a Monochrome Laser printer comes down to your printing volume and requirements.

## 1. Monochrome Laser Printers (HP LaserJet 1020 Plus / Canon LBP2900B)
* **Printing Speed:** 14-18 pages per minute.
* **Consumables:** 12A / 88A toner cartridges with easy refill availability across Garhwa for ₹200-₹300.
* **Best For:** High-volume legal documents, GST invoices, bills, and text documents where crisp smudge-free black text is mandatory.

## 2. Ink Tank Printers (Epson L3210 / HP Smart Tank)
* **Cost Per Page:** Ultra-low ~10 to 15 paise per black & white page, and ~25 paise per color page.
* **Photo Printing:** Outstanding color reproduction for ID cards, school projects, color brochures, and passport photos.
* **Best For:** Cyber cafes, schools, and offices that require color printing and scanning alongside routine document printing.

Visit Lapiez Garhwa for genuine ink bottles, toner cartridges, and live printer demonstrations with official warranty support.`,
    coverImage: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1000&auto=format&fit=crop&q=80",
    category: "Printers & Office",
    author: "Lapiez Commercial Solutions",
    readTime: "5 min read",
    tags: "printer,laser,inktank,epson,hp,costperpage",
    status: "published",
    createdAt: "2026-10-17T09:00:00.000Z",
    featured: false
  }
];

export const BLOG_CATEGORIES = [
  "All",
  "Buying Guide",
  "Security & Surveillance",
  "Display & Gaming",
  "Laptop Upgrades & SSD",
  "Maintenance & Care",
  "Printers & Office"
];
