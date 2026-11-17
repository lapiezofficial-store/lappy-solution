// Lapiez - Official Store Categories & Subcategories Taxonomy
// Synchronized directly with live database & showroom inventory

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  image?: string;
  itemCount?: number;
  description?: string;
  startingPrice?: string;
  position?: number;
  status?: string;
  parentId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  title?: string;
  shortDesc?: string;
  imageUrl?: string;
  image?: string;
  iconName?: string;
  startingPrice?: string;
  position?: number;
  status?: string;
  subcategories: SubCategory[];
  isFeatured?: boolean;
  parentId?: string | null;
}

export const CATEGORIES: Category[] = [
  // 1. Computer & Laptops
  {
    id: 'cat-laptops',
    name: 'Computer & Laptops',
    slug: 'laptops',
    title: 'Computer & Laptops',
    shortDesc: 'Refurbished business laptops, brand new computers and high performance desktop rigs.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794544844/lapiez/categories/rh3lpqqkh4wza6omv2tm.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794544844/lapiez/categories/rh3lpqqkh4wza6omv2tm.jpg',
    iconName: 'Laptop',
    startingPrice: '₹9,999',
    position: 0,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282348', name: 'Desktop & Laptops', slug: 'desktop-laptops', startingPrice: '', position: 0, status: 'active', parentId: 'cat-laptops' },
      { id: '6282546', name: 'Refurbished Laptops', slug: 'refurbished', startingPrice: '', position: 1, status: 'active', parentId: 'cat-laptops' },
      { id: 'sub-gaming-pc', name: 'Custom Desktop PC Rigs', slug: 'custom-pcs', startingPrice: '', position: 2, status: 'active', parentId: 'cat-laptops' },
    ],
  },

  // 2. Laptop Parts & Spares
  {
    id: 'cat-laptop-parts',
    name: 'Laptop Parts & Spares',
    slug: 'laptop-parts',
    title: 'Laptop Parts & Spares',
    shortDesc: 'Original laptop batteries, adapters, keyboards, display screens and spare parts.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794676574/lapiez/categories/ejv9y4jzyhc6ntvhjhlp.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794676574/lapiez/categories/ejv9y4jzyhc6ntvhjhlp.jpg',
    iconName: 'Cpu',
    startingPrice: '₹650',
    position: 1,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282354', name: 'Laptop Battery', slug: 'laptop-battery', startingPrice: '', position: 0, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282357', name: 'Laptop Adaptor', slug: 'laptop-adaptor', startingPrice: '', position: 1, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282356', name: 'Laptop Body', slug: 'laptop-body', startingPrice: '', position: 2, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282347', name: 'Laptop Parts', slug: 'laptop-parts-4', startingPrice: '', position: 3, status: 'active', parentId: 'cat-laptop-parts' },
      { id: '6282355', name: 'Laptop Keyboards', slug: 'laptop-keyboards', startingPrice: '', position: 4, status: 'active', parentId: 'cat-laptop-parts' },
      { id: 'cmv8x80uh0000jp06usrkmxwk', name: 'Laptop Screen', slug: 'laptop--screen', startingPrice: '', position: 5, status: 'active', parentId: 'cat-laptop-parts' },
    ],
  },

  // 3. Computer Peripherals
  {
    id: 'cat-peripherals',
    name: 'Computer Peripherals',
    slug: 'peripherals',
    title: 'Computer Peripherals',
    shortDesc: 'Keyboards, wireless mice, webcams, speakers and connectivity accessories.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677271/lapiez/categories/h3n0l67t65a9qnvjhl2m.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677271/lapiez/categories/h3n0l67t65a9qnvjhl2m.jpg',
    iconName: 'Mouse',
    startingPrice: '₹199',
    position: 2,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282351', name: 'Mouse & Keyboard', slug: 'mouse-keyboard', startingPrice: '', position: 0, status: 'active', parentId: 'cat-peripherals' },
      { id: '6283522', name: 'Speakers & Soundbars', slug: 'speakers', startingPrice: '', position: 1, status: 'active', parentId: 'cat-peripherals' },
      { id: '6282349', name: 'Computer Peripherals', slug: 'pc-peripherals', startingPrice: '', position: 2, status: 'active', parentId: 'cat-peripherals' },
      { id: '6282352', name: 'Cable & Connector (HDMI/VGA/Power)', slug: 'cables-connectors', startingPrice: '', position: 3, status: 'active', parentId: 'cat-peripherals' },
    ],
  },

  // 4. Printers
  {
    id: 'cat-printers',
    name: 'Printers',
    slug: 'printers',
    title: 'Printers',
    shortDesc: 'All-in-one WiFi InkTank and laser printers with official warranty.',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/ZIB6owYD.webp',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/ZIB6owYD.webp',
    iconName: 'Printer',
    startingPrice: '₹9,999',
    position: 3,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282340', name: 'Printers (InkTank & Laser)', slug: 'printers-list', startingPrice: '', position: 0, status: 'active', parentId: 'cat-printers' },
      { id: '6282341', name: 'Toner & Ink Bottles', slug: 'toner-ink', startingPrice: '', position: 1, status: 'active', parentId: 'cat-printers' },
      { id: '6287242', name: 'Paper & Sticker Sheets', slug: 'paper-sticker', startingPrice: '', position: 2, status: 'active', parentId: 'cat-printers' },
      { id: '5998950', name: 'Printer Spare Parts & Rollers', slug: 'printer-parts', startingPrice: '', position: 3, status: 'active', parentId: 'cat-printers' },
    ],
  },

  // 5. CCTV & Security
  {
    id: 'cat-cctv',
    name: 'CCTV & Security',
    slug: 'cctv-security',
    title: 'CCTV & Security',
    shortDesc: 'HD CCTV cameras, biometric scanners, DVR/NVR surveillance equipment.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034738/lapiez/categories/tmqqbyejjsmmmogqlwlh.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034738/lapiez/categories/tmqqbyejjsmmmogqlwlh.jpg',
    iconName: 'Shield',
    startingPrice: '₹1,250',
    position: 4,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282350', name: 'CCTV Cameras (Dome/Bullet/Wi-Fi)', slug: 'cctv-cameras', startingPrice: '', position: 0, status: 'active', parentId: 'cat-cctv' },
      { id: '6282353', name: 'Biometric Attendance & Scanners', slug: 'biometric-scanners', startingPrice: '', position: 1, status: 'active', parentId: 'cat-cctv' },
    ],
  },

  // 6. Storage & Memory
  {
    id: 'cat-storage',
    name: 'Storage & Memory',
    slug: 'storage',
    title: 'Storage & Memory',
    shortDesc: 'High-speed NVMe/SATA SSDs, DDR4/DDR5 RAM, pendrives and external drives.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034503/lapiez/categories/eqqtzkb1o6r7ctxzz3a3.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1792034503/lapiez/categories/eqqtzkb1o6r7ctxzz3a3.jpg',
    iconName: 'HardDrive',
    startingPrice: '₹399',
    position: 5,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282406', name: 'SSD & Hard Disk', slug: 'ssd-hard-disk', startingPrice: '', position: 0, status: 'active', parentId: 'cat-storage' },
      { id: '6282407', name: 'Pendrive & SD Card', slug: 'pendrive-sd-card', startingPrice: '', position: 1, status: 'active', parentId: 'cat-storage' },
    ],
  },

  // 7. Antivirus & Software
  {
    id: 'cat-software',
    name: 'Antivirus & Software',
    slug: 'antivirus',
    title: 'Antivirus & Software',
    shortDesc: 'Original Quick Heal, Kaspersky, Total Security licenses and office software.',
    imageUrl: 'https://cdn.dotpe.in/longtail/item_collection/8473996/M0Si0HDm.webp',
    image: 'https://cdn.dotpe.in/longtail/item_collection/8473996/M0Si0HDm.webp',
    iconName: 'Lock',
    startingPrice: '₹350',
    position: 6,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: '6282549', name: 'Antivirus (Quick Heal / Total Security)', slug: 'antivirus-keys', startingPrice: '', position: 0, status: 'active', parentId: 'cat-software' },
    ],
  },

  // 8. Electronic
  {
    id: 'cat-electronics',
    name: 'Electronic',
    slug: 'screen',
    title: 'Electronic & Displays',
    shortDesc: 'Screens, panels, electronic components and display modules.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794676310/lapiez/categories/jqvgihs1ezsxsgbca4lr.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794676310/lapiez/categories/jqvgihs1ezsxsgbca4lr.jpg',
    iconName: 'Monitor',
    startingPrice: '₹499',
    position: 7,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-elec-screen', name: 'Laptop Screens & Displays', slug: 'screens-displays', position: 0, status: 'active', parentId: 'cat-electronics' },
      { id: 'sub-elec-parts', name: 'Electronic Modules & ICs', slug: 'electronic-modules', position: 1, status: 'active', parentId: 'cat-electronics' },
      { id: 'sub-elec-sound', name: 'Speakers & Audio Modules', slug: 'audio-modules', position: 2, status: 'active', parentId: 'cat-electronics' },
    ],
  },

  // 9. Toner & ink
  {
    id: 'cmvhvzqln0000l507w15zkg57',
    name: 'Toner & ink',
    slug: 'toner---ink',
    title: 'Toner & ink',
    shortDesc: 'Original toner cartridges, refill bottles and printer ink supplies.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677916/lapiez/categories/t2crpmqkeegtwrwwygjv.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677916/lapiez/categories/t2crpmqkeegtwrwwygjv.jpg',
    iconName: 'Package',
    startingPrice: '₹499',
    position: 8,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-toner-cart', name: 'Toner Cartridges', slug: 'toner-cartridges', position: 0, status: 'active', parentId: 'cmvhvzqln0000l507w15zkg57' },
      { id: 'sub-ink-bottles', name: 'Ink Bottles & Refills', slug: 'ink-bottles', position: 1, status: 'active', parentId: 'cmvhvzqln0000l507w15zkg57' },
      { id: 'sub-cart-parts', name: 'OPC Drum & Doctor Blade', slug: 'drum-blades', position: 2, status: 'active', parentId: 'cmvhvzqln0000l507w15zkg57' },
    ],
  },

  // 10. Refurbished
  {
    id: 'cmweetc8x0002l1084bkacugq',
    name: 'Refurbished',
    slug: 'r',
    title: 'Refurbished',
    shortDesc: 'Fully tested, showroom certified refurbished laptops and desktops with warranty.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794545038/lapiez/categories/n97cwmemaykpi7sw8mqw.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794545038/lapiez/categories/n97cwmemaykpi7sw8mqw.jpg',
    iconName: 'RefreshCw',
    startingPrice: '₹9,999',
    position: 9,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-refurb-laptops', name: 'Certified Refurbished Laptops', slug: 'refurb-laptops', position: 0, status: 'active', parentId: 'cmweetc8x0002l1084bkacugq' },
      { id: 'sub-refurb-desktop', name: 'Refurbished Desktop PCs', slug: 'refurb-desktops', position: 1, status: 'active', parentId: 'cmweetc8x0002l1084bkacugq' },
      { id: 'sub-refurb-monitors', name: 'Refurbished HD Monitors', slug: 'refurb-monitors', position: 2, status: 'active', parentId: 'cmweetc8x0002l1084bkacugq' },
    ],
  },

  // 11. Paper &Sticker
  {
    id: 'cmweeusjv0000jp08sfqy641e',
    name: 'Paper &Sticker',
    slug: 'paper--sticker',
    title: 'Paper & Sticker Sheets',
    shortDesc: 'Photo glossy papers, barcode label stickers and printing rolls.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677051/lapiez/categories/uktafkupju6iruvmiqmc.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794677051/lapiez/categories/uktafkupju6iruvmiqmc.jpg',
    iconName: 'FileText',
    startingPrice: '₹149',
    position: 10,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-photo-paper', name: 'Photo Glossy Paper', slug: 'photo-paper', position: 0, status: 'active', parentId: 'cmweeusjv0000jp08sfqy641e' },
      { id: 'sub-barcode-labels', name: 'Barcode & Shipping Labels', slug: 'barcode-labels', position: 1, status: 'active', parentId: 'cmweeusjv0000jp08sfqy641e' },
      { id: 'sub-matte-sheets', name: 'Matte & Sticker Rolls', slug: 'sticker-rolls', position: 2, status: 'active', parentId: 'cmweeusjv0000jp08sfqy641e' },
    ],
  },

  // 12. Battery
  {
    id: 'cmweev64j0001jp08le6ikuyw',
    name: 'Battery',
    slug: 'battery',
    title: 'Laptop & Device Batteries',
    shortDesc: 'Original replacement batteries with guaranteed backup for Dell, HP, Lenovo & Acer.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794548667/lapiez/categories/gllf6xzxjb43yuqdohuo.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794548667/lapiez/categories/gllf6xzxjb43yuqdohuo.jpg',
    iconName: 'BatteryCharging',
    startingPrice: '₹1,250',
    position: 11,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-dell-bat', name: 'Dell Laptop Battery', slug: 'dell-batteries', position: 0, status: 'active', parentId: 'cmweev64j0001jp08le6ikuyw' },
      { id: 'sub-hp-bat', name: 'HP Laptop Battery', slug: 'hp-batteries', position: 1, status: 'active', parentId: 'cmweev64j0001jp08le6ikuyw' },
      { id: 'sub-lenovo-bat', name: 'Lenovo & Acer Battery', slug: 'lenovo-acer-batteries', position: 2, status: 'active', parentId: 'cmweev64j0001jp08le6ikuyw' },
      { id: 'sub-cmos-bat', name: 'CMOS & Device Cells', slug: 'cmos-cells', position: 3, status: 'active', parentId: 'cmweev64j0001jp08le6ikuyw' },
    ],
  },

  // 13. Cable & Connector
  {
    id: 'cmweevtwk0003l1083g37q35n',
    name: 'Cable & Connector',
    slug: 'cable---connector',
    title: 'Cables & Connectors',
    shortDesc: 'HDMI 4K cables, VGA cords, Type-C USB adapters, SATA data cables and power cords.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794675985/lapiez/categories/czfa9jplqk0wqvzvwraz.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794675985/lapiez/categories/czfa9jplqk0wqvzvwraz.jpg',
    iconName: 'Cable',
    startingPrice: '₹99',
    position: 12,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-hdmi-cables', name: 'HDMI & DisplayPort Cables', slug: 'hdmi-dp-cables', position: 0, status: 'active', parentId: 'cmweevtwk0003l1083g37q35n' },
      { id: 'sub-typec-cables', name: 'Type-C & USB Data Cables', slug: 'typec-usb-cables', position: 1, status: 'active', parentId: 'cmweevtwk0003l1083g37q35n' },
      { id: 'sub-power-cords', name: 'Power Cords & SATA Cables', slug: 'power-sata-cords', position: 2, status: 'active', parentId: 'cmweevtwk0003l1083g37q35n' },
      { id: 'sub-vga-lan', name: 'VGA & LAN Ethernet Cables', slug: 'vga-lan-cables', position: 3, status: 'active', parentId: 'cmweevtwk0003l1083g37q35n' },
    ],
  },

  // 14. Adapters
  {
    id: 'cmweexco90004l108zxzfyoee',
    name: 'Adapters',
    slug: 'adapters',
    title: 'Laptop & Device Adapters',
    shortDesc: '65W, 90W, 120W genuine power adapters and chargers with warranty.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794548466/lapiez/categories/tupjzxf2np2l2bhyek2l.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794548466/lapiez/categories/tupjzxf2np2l2bhyek2l.jpg',
    iconName: 'Zap',
    startingPrice: '₹650',
    position: 13,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-lap-chargers', name: 'Laptop Adapters (65W / 90W)', slug: 'laptop-adapters', position: 0, status: 'active', parentId: 'cmweexco90004l108zxzfyoee' },
      { id: 'sub-typec-chargers', name: 'Type-C Fast PD Adapters', slug: 'typec-chargers', position: 1, status: 'active', parentId: 'cmweexco90004l108zxzfyoee' },
      { id: 'sub-all-in-one', name: 'Desktop & Monitor Power Supplies', slug: 'desktop-power-supplies', position: 2, status: 'active', parentId: 'cmweexco90004l108zxzfyoee' },
    ],
  },

  // 15. Keyboard
  {
    id: 'cmwek9x5c0000l207qu12qn1l',
    name: 'Keyboard',
    slug: 'keyboard',
    title: 'Keyboards & Typing Accessories',
    shortDesc: 'Mechanical gaming keyboards, replacement laptop keyboards and wireless combos.',
    imageUrl: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794549218/lapiez/categories/q7tmxodgyvdg27f0fkib.jpg',
    image: 'https://res.cloudinary.com/ydugu2xq/image/upload/v1794549218/lapiez/categories/q7tmxodgyvdg27f0fkib.jpg',
    iconName: 'Keyboard',
    startingPrice: '₹349',
    position: 14,
    status: 'active',
    isFeatured: true,
    subcategories: [
      { id: 'sub-mech-kb', name: 'Mechanical & Gaming Keyboards', slug: 'mech-gaming-keyboards', position: 0, status: 'active', parentId: 'cmwek9x5c0000l207qu12qn1l' },
      { id: 'sub-wireless-kb', name: 'Wireless Keyboard & Mouse Combos', slug: 'wireless-combos', position: 1, status: 'active', parentId: 'cmwek9x5c0000l207qu12qn1l' },
      { id: 'sub-laptop-rep-kb', name: 'Internal Laptop Keyboards', slug: 'replacement-laptop-keyboards', position: 2, status: 'active', parentId: 'cmwek9x5c0000l207qu12qn1l' },
    ],
  },
];
