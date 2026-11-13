import React from 'react';

export interface BrandData {
  id?: string;
  name: string;
  query?: string;
  logoType?: 'preset' | 'image' | 'text';
  presetKey?: string;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  position?: number;
  isVisible?: boolean;
}

export const PRESET_BRANDS_CONFIG: {
  key: string;
  label: string;
  defaultQuery: string;
}[] = [
  // Top Laptops & PCs
  { key: 'hp', label: 'HP', defaultQuery: 'HP' },
  { key: 'dell', label: 'Dell', defaultQuery: 'Dell' },
  { key: 'lenovo', label: 'Lenovo', defaultQuery: 'Lenovo' },
  { key: 'acer', label: 'Acer', defaultQuery: 'Acer' },
  { key: 'asus', label: 'ASUS', defaultQuery: 'ASUS' },
  { key: 'frontech', label: 'Frontech', defaultQuery: 'Frontech' },
  { key: 'msi', label: 'MSI', defaultQuery: 'MSI' },
  { key: 'gigabyte', label: 'Gigabyte', defaultQuery: 'Gigabyte' },
  
  // CCTV & Security
  { key: 'cpplus', label: 'CP-PLUS', defaultQuery: 'CP-PLUS' },
  { key: 'hikvision', label: 'Hikvision', defaultQuery: 'Hikvision' },
  { key: 'dahua', label: 'Dahua', defaultQuery: 'Dahua' },
  { key: 'ezviz', label: 'EZVIZ', defaultQuery: 'EZVIZ' },
  { key: 'imou', label: 'Imou', defaultQuery: 'Imou' },
  { key: 'secureye', label: 'Secureye', defaultQuery: 'Secureye' },

  // Processors & Core Tech
  { key: 'intel', label: 'Intel', defaultQuery: 'Intel' },
  { key: 'amd', label: 'AMD', defaultQuery: 'AMD' },
  { key: 'nvidia', label: 'Nvidia', defaultQuery: 'Nvidia' },

  // Storage & Memory
  { key: 'wd', label: 'Western Digital (WD)', defaultQuery: 'Western Digital' },
  { key: 'seagate', label: 'Seagate', defaultQuery: 'Seagate' },
  { key: 'kingston', label: 'Kingston', defaultQuery: 'Kingston' },
  { key: 'sandisk', label: 'SanDisk', defaultQuery: 'SanDisk' },
  { key: 'crucial', label: 'Crucial', defaultQuery: 'Crucial' },
  { key: 'transcend', label: 'Transcend', defaultQuery: 'Transcend' },
  { key: 'adata', label: 'ADATA', defaultQuery: 'ADATA' },
  { key: 'consistent', label: 'Consistent', defaultQuery: 'Consistent' },

  // Monitors & Displays
  { key: 'samsung', label: 'Samsung', defaultQuery: 'Samsung' },
  { key: 'lg', label: 'LG', defaultQuery: 'LG' },
  { key: 'benq', label: 'BenQ', defaultQuery: 'BenQ' },
  { key: 'viewsonic', label: 'ViewSonic', defaultQuery: 'ViewSonic' },

  // Printers & Imaging
  { key: 'epson', label: 'Epson', defaultQuery: 'Epson' },
  { key: 'canon', label: 'Canon', defaultQuery: 'Canon' },
  { key: 'brother', label: 'Brother', defaultQuery: 'Brother' },
  { key: 'pantum', label: 'Pantum', defaultQuery: 'Pantum' },

  // Networking
  { key: 'dlink', label: 'D-Link', defaultQuery: 'D-Link' },
  { key: 'tplink', label: 'TP-Link', defaultQuery: 'TP-Link' },
  { key: 'tenda', label: 'Tenda', defaultQuery: 'Tenda' },

  // Laptop Accessories & Power
  { key: 'lapcare', label: 'Lapcare', defaultQuery: 'Lapcare' },
  { key: 'lappypower', label: 'Lappy Power', defaultQuery: 'Lappy Power' },
  { key: 'prodot', label: 'Prodot', defaultQuery: 'Prodot' },

  // Peripherals & Gaming
  { key: 'logitech', label: 'Logitech', defaultQuery: 'Logitech' },
  { key: 'zebronics', label: 'Zebronics', defaultQuery: 'Zebronics' },
  { key: 'rapoo', label: 'Rapoo', defaultQuery: 'Rapoo' },
  { key: 'fingers', label: 'Fingers', defaultQuery: 'Fingers' },
  { key: 'portronics', label: 'Portronics', defaultQuery: 'Portronics' },
  { key: 'cosmicbyte', label: 'Cosmic Byte', defaultQuery: 'Cosmic Byte' },
  { key: 'redragon', label: 'Redragon', defaultQuery: 'Redragon' },
  { key: 'antesports', label: 'Ant Esports', defaultQuery: 'Ant Esports' },
  { key: 'corsair', label: 'Corsair', defaultQuery: 'Corsair' },
  { key: 'iball', label: 'iBall', defaultQuery: 'iBall' },
  { key: 'intex', label: 'Intex', defaultQuery: 'Intex' },
  { key: 'tvse', label: 'TVS Electronics', defaultQuery: 'TVS' },

  // Power Backup & UPS
  { key: 'apc', label: 'APC', defaultQuery: 'APC' },
  { key: 'microtek', label: 'Microtek', defaultQuery: 'Microtek' },
  { key: 'luminous', label: 'Luminous', defaultQuery: 'Luminous' },

  // Repair Tools & Hardware Equipment
  { key: 'hoki', label: 'Hoki', defaultQuery: 'Hoki' },
  { key: 'quick', label: 'Quick', defaultQuery: 'Quick' },
  { key: 'mechanic', label: 'Mechanic', defaultQuery: 'Mechanic' },
];

export const BrandLogoRenderer: React.FC<{ brand: BrandData; className?: string }> = ({
  brand,
  className = '',
}) => {
  // 1. Custom uploaded image
  if (brand.logoType === 'image' && brand.imageUrl) {
    return (
      <div className={`flex items-center justify-center max-h-[36px] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.imageUrl}
          alt={brand.name}
          className="max-h-7 sm:max-h-8 max-w-[90px] sm:max-w-[110px] object-contain"
          onError={(e) => {
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-xs font-bold text-gray-700">${brand.name}</span>`;
            }
          }}
        />
      </div>
    );
  }

  // Determine preset key (from presetKey or normalized name)
  const normKey = (
    brand.presetKey ||
    brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  ).toLowerCase();

  // 2. Preset Vector / Styled Logos
  switch (normKey) {
    // HP - Official Circular Blue Logo provided by user
    case 'hp':
    case 'hpnew':
    case 'hpclassic':
    case 'hewlettpackard':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brands/hp.png"
            alt="HP"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-full"
          />
        </div>
      );

    case 'dell':
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <svg viewBox="0 0 120 120" className="h-8 w-auto" fill="none">
            <circle cx="60" cy="60" r="54" stroke="#007DB8" strokeWidth="6" fill="white" />
            <text
              x="60"
              y="69"
              textAnchor="middle"
              fill="#007DB8"
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="bold"
              fontSize="26"
              letterSpacing="-1"
            >
              DELL
            </text>
          </svg>
        </div>
      );

    case 'lenovo':
    case 'lenevo':
      return (
        <div className={`bg-[#E2231A] px-3 py-1 rounded-[3px] flex items-center justify-center shadow-2xs ${className}`}>
          <span className="text-white font-extrabold text-[14px] tracking-tight font-sans">
            Lenovo
          </span>
        </div>
      );

    case 'acer':
      return (
        <div className={`flex items-center ${className}`}>
          <span className="text-[#83B81A] font-bold text-[20px] tracking-tight font-sans lowercase">
            acer
          </span>
        </div>
      );

    case 'asus':
      return (
        <div className={`flex items-center ${className}`}>
          <span
            className="text-[#000000] font-black text-[18px] tracking-widest font-sans"
            style={{ letterSpacing: '0.12em' }}
          >
            ASUS
          </span>
        </div>
      );

    case 'frontech':
      return (
        <div className={`bg-[#FEC907] text-black font-black px-2.5 py-1 rounded-[4px] flex items-center justify-center shadow-xs ${className}`}>
          <span className="text-black font-black text-[13px] tracking-wider font-sans">
            FRONTECH
          </span>
        </div>
      );

    case 'cpplus':
    case 'cp-plus':
      return (
        <div className={`flex items-center font-black text-[14px] tracking-tight font-sans ${className}`}>
          <span className="text-[#E11D48]">CP</span>
          <span className="text-[#1E293B]">-PLUS</span>
        </div>
      );

    case 'lapcare':
      return (
        <div className={`flex items-center font-black tracking-tight font-sans text-[16px] ${className}`}>
          <span className="text-[#004890]">lap</span>
          <span className="text-[#F37021]">care</span>
        </div>
      );

    case 'lappypower':
    case 'lappypowercharger':
      return (
        <div className={`flex items-center gap-1 ${className}`}>
          <span className="text-[#0F172A] font-black text-[12.5px] tracking-tight font-sans">LAPPY</span>
          <div className="bg-gradient-to-r from-[#FB641B] to-[#EA580C] text-white text-[9.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>POWER</span>
          </div>
        </div>
      );

    case 'prodot':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-tight font-sans ${className}`}>
          <span className="text-[#1E293B]">PRO</span>
          <span className="text-[#D9222A]">DOT</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9222A] ml-0.5 -mt-2"></span>
        </div>
      );

    case 'dlink':
    case 'd-link':
      return (
        <div className={`flex items-center font-extrabold text-[15.5px] tracking-wider font-sans ${className}`}>
          <span className="text-[#006699]">D-Link</span>
        </div>
      );

    case 'epson':
      return (
        <div className={`flex items-center font-black text-[17px] tracking-wider font-sans ${className}`}>
          <span className="text-[#003399]">EPSON</span>
        </div>
      );

    case 'canon':
      return (
        <div className={`flex items-center font-black text-[18px] tracking-tight font-serif ${className}`}>
          <span className="text-[#CC0000]">Canon</span>
        </div>
      );

    case 'brother':
    case 'brothers':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-tight font-sans lowercase ${className}`}>
          <span className="text-[#002D72]">brother</span>
        </div>
      );

    case 'consistent':
      return (
        <div className={`flex items-center gap-1.5 font-sans ${className}`}>
          <div className="w-5 h-5 rounded-full bg-[#D32F2F] text-white flex items-center justify-center font-black text-[11px] shadow-2xs">
            C
          </div>
          <span className="text-[#111827] font-black text-[12.5px] tracking-wider">
            CONSISTENT
          </span>
        </div>
      );

    case 'zebronics':
      return (
        <div className={`bg-[#0F172A] text-white px-2.5 py-0.5 rounded-[4px] flex items-center gap-0.5 ${className}`}>
          <span className="text-[#F59E0B] font-black text-[12px] tracking-wider font-sans">ZEB</span>
          <span className="text-white font-extrabold text-[12px] tracking-wider font-sans">RONICS</span>
        </div>
      );

    case 'rapoo':
    case 'rapo':
      return (
        <div className={`flex items-center font-bold text-[17px] tracking-tight font-sans lowercase ${className}`}>
          <span className="text-[#00A3E0] font-black">rapoo</span>
        </div>
      );

    case 'fingers':
    case 'finger':
      return (
        <div className={`flex items-center font-extrabold text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#111827] font-black">fingers</span>
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF5722] to-[#FF9800] ml-0.5 mb-2"></span>
        </div>
      );

    case 'hoki':
      return (
        <div className={`bg-[#FBBF24] border border-[#F59E0B] text-black px-2 py-0.5 rounded-[4px] flex items-center justify-center shadow-xs ${className}`}>
          <span className="text-black font-black text-[13px] tracking-widest font-sans">
            HOKI
          </span>
        </div>
      );

    case 'hikvision':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-tight font-sans ${className}`}>
          <span className="text-[#D71920]">HIK</span>
          <span className="text-[#53565A]">VISION</span>
        </div>
      );

    case 'logitech':
      return (
        <div className={`flex items-center ${className}`}>
          <span className="text-[#000000] font-bold text-[17px] tracking-tight font-sans lowercase">
            logitech
          </span>
        </div>
      );

    case 'intel':
      return (
        <div className={`bg-[#0068B5] text-white px-2.5 py-0.5 rounded-full flex items-center justify-center shadow-2xs ${className}`}>
          <span className="text-white font-black text-[13px] tracking-wider font-sans lowercase">intel</span>
        </div>
      );

    case 'amd':
      return (
        <div className={`flex items-center gap-1 font-black text-[15px] font-sans ${className}`}>
          <span className="text-[#ED1C24] text-[16px]">▲</span>
          <span className="text-black tracking-wider">AMD</span>
        </div>
      );

    case 'nvidia':
      return (
        <div className={`flex items-center gap-1 font-black ${className}`}>
          <svg className="w-3.5 h-3.5 text-[#76B900] fill-current" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
          <span className="text-[#111827] text-[13px] tracking-tight font-sans font-black">nVIDIA</span>
        </div>
      );

    case 'wd':
    case 'westerndigital':
      return (
        <div className={`bg-[#005596] text-white font-black px-2.5 py-0.5 rounded-[3px] flex items-center justify-center ${className}`}>
          <span className="text-white font-black text-[14px] tracking-wider font-sans">WD</span>
        </div>
      );

    case 'seagate':
      return (
        <div className={`flex items-center gap-1 font-extrabold text-[14px] font-sans ${className}`}>
          <span className="text-[#71BF44] text-[15px]">◉</span>
          <span className="text-[#1E293B] tracking-wide">SEAGATE</span>
        </div>
      );

    case 'kingston':
      return (
        <div className={`flex items-center font-black text-[14px] font-sans ${className}`}>
          <span className="text-[#E11D48] font-black mr-1">K</span>
          <span className="text-[#111827] font-extrabold">ingston</span>
        </div>
      );

    case 'sandisk':
      return (
        <div className={`flex items-center font-black text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#ED1C24] font-black italic">SanDisk</span>
        </div>
      );

    case 'crucial':
      return (
        <div className={`flex items-center font-black tracking-tight font-sans text-[15px] ${className}`}>
          <span className="text-[#00539F]">crucial</span>
        </div>
      );

    case 'transcend':
      return (
        <div className={`flex items-center font-bold tracking-tight font-sans text-[14px] ${className}`}>
          <span className="text-[#D71920] font-black">Transcend</span>
        </div>
      );

    case 'adata':
      return (
        <div className={`flex items-center font-black tracking-wider font-sans text-[14px] ${className}`}>
          <span className="text-[#E11D48]">ADATA</span>
        </div>
      );

    case 'samsung':
      return (
        <div className={`bg-[#034EA2] text-white px-2.5 py-0.5 rounded-[4px] flex items-center justify-center ${className}`}>
          <span className="text-white font-extrabold text-[13px] tracking-wider font-sans">SAMSUNG</span>
        </div>
      );

    case 'lg':
      return (
        <div className={`flex items-center gap-1 font-black font-sans ${className}`}>
          <div className="w-5 h-5 rounded-full bg-[#A50034] text-white flex items-center justify-center font-bold text-[10px]">
            LG
          </div>
          <span className="text-[#A50034] text-[14px] tracking-wide">LG</span>
        </div>
      );

    case 'benq':
      return (
        <div className={`flex items-center font-black text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#542E71]">BenQ</span>
        </div>
      );

    case 'viewsonic':
      return (
        <div className={`flex items-center font-extrabold text-[14px] tracking-tight font-sans ${className}`}>
          <span className="text-[#D71920]">View</span>
          <span className="text-[#005596]">Sonic</span>
        </div>
      );

    case 'msi':
      return (
        <div className={`flex items-center font-black text-[17px] tracking-widest font-sans ${className}`}>
          <span className="text-[#D71920]">msi</span>
        </div>
      );

    case 'gigabyte':
      return (
        <div className={`flex items-center font-black text-[13px] tracking-widest font-sans ${className}`}>
          <span className="text-black">GIGA</span>
          <span className="text-[#FB641B]">BYTE</span>
        </div>
      );

    case 'corsair':
      return (
        <div className={`flex items-center font-black text-[12.5px] tracking-widest font-sans ${className}`}>
          <span className="text-[#111827]">CORSAIR</span>
        </div>
      );

    case 'antesports':
      return (
        <div className={`flex items-center font-black text-[12px] tracking-wider font-sans ${className}`}>
          <span className="text-[#E11D48]">ANT</span>
          <span className="text-[#1E293B] ml-0.5">ESPORTS</span>
        </div>
      );

    case 'cosmicbyte':
      return (
        <div className={`flex items-center font-black text-[12px] tracking-wider font-sans ${className}`}>
          <span className="text-[#0284C7]">COSMIC</span>
          <span className="text-[#9333EA] ml-0.5">BYTE</span>
        </div>
      );

    case 'redragon':
      return (
        <div className={`flex items-center font-black text-[13px] tracking-wider font-sans ${className}`}>
          <span className="text-[#DC2626]">REDRAGON</span>
        </div>
      );

    case 'tplink':
      return (
        <div className={`flex items-center gap-1 font-bold text-[15px] font-sans ${className}`}>
          <span className="text-[#00A1A2] font-black tracking-tight">tp-link</span>
        </div>
      );

    case 'dahua':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-tight font-sans ${className}`}>
          <span className="text-[#0284C7]">alhua</span>
        </div>
      );

    case 'ezviz':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-wider font-sans ${className}`}>
          <span className="text-[#F97316]">EZ</span>
          <span className="text-[#0D9488]">VIZ</span>
        </div>
      );

    case 'imou':
      return (
        <div className={`flex items-center font-black text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#EA580C]">Imou</span>
        </div>
      );

    case 'secureye':
      return (
        <div className={`flex items-center font-black text-[14px] tracking-tight font-sans ${className}`}>
          <span className="text-[#0F172A]">secure</span>
          <span className="text-[#DC2626]">ye</span>
        </div>
      );

    case 'tenda':
      return (
        <div className={`flex items-center font-black text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#F97316]">Tenda</span>
        </div>
      );

    case 'portronics':
      return (
        <div className={`flex items-center font-black text-[12.5px] tracking-wider font-sans ${className}`}>
          <span className="text-[#DC2626]">PORTRONICS</span>
        </div>
      );

    case 'tvse':
    case 'tvs':
      return (
        <div className={`flex items-center font-black text-[14px] tracking-wider font-sans ${className}`}>
          <span className="text-[#0369A1]">TVS-E</span>
        </div>
      );

    case 'iball':
      return (
        <div className={`flex items-center font-black text-[16px] tracking-tight font-sans ${className}`}>
          <span className="text-[#1E293B]">i</span>
          <span className="text-[#E11D48]">Ball</span>
        </div>
      );

    case 'intex':
      return (
        <div className={`flex items-center font-black text-[15px] tracking-wider font-sans ${className}`}>
          <span className="text-[#DC2626]">INTEX</span>
        </div>
      );

    case 'apc':
      return (
        <div className={`flex items-center gap-1 font-black ${className}`}>
          <span className="text-[#DC2626] text-[14px]">▲</span>
          <span className="text-[#111827] text-[13px] tracking-tight font-sans">APC</span>
        </div>
      );

    case 'microtek':
      return (
        <div className={`flex items-center font-black text-[12.5px] tracking-wider font-sans ${className}`}>
          <span className="text-[#0284C7]">MICRO</span>
          <span className="text-[#DC2626]">TEK</span>
        </div>
      );

    case 'luminous':
      return (
        <div className={`flex items-center font-black text-[12.5px] tracking-wider font-sans ${className}`}>
          <span className="text-[#1E3A8A]">LUMI</span>
          <span className="text-[#F59E0B]">NOUS</span>
        </div>
      );

    case 'pantum':
      return (
        <div className={`flex items-center font-black text-[14px] tracking-wider font-sans ${className}`}>
          <span className="text-[#DC2626]">PANTUM</span>
        </div>
      );

    case 'quick':
      return (
        <div className={`bg-[#0284C7] text-white px-2 py-0.5 rounded-[3px] font-black text-[12px] tracking-wider font-sans flex items-center justify-center ${className}`}>
          QUICK
        </div>
      );

    case 'mechanic':
      return (
        <div className={`flex items-center font-black text-[12px] tracking-wider font-sans ${className}`}>
          <span className="text-[#0284C7]">MECHA</span>
          <span className="text-[#EA580C]">NIC</span>
        </div>
      );

    default:
      // Custom styled text or fallback
      const bg = brand.bgColor || '#1F2937';
      const text = brand.textColor || '#FFFFFF';
      return (
        <div
          className={`px-2.5 py-1 rounded-[4px] flex items-center justify-center max-w-[120px] text-center shadow-2xs ${className}`}
          style={{ backgroundColor: bg }}
        >
          <span
            className="font-extrabold text-[13px] tracking-wide font-sans truncate"
            style={{ color: text }}
          >
            {brand.name}
          </span>
        </div>
      );
  }
};
