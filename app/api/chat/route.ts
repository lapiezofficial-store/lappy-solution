import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const rawMessage = body.message?.trim() || '';

    if (!rawMessage) {
      return NextResponse.json(
        { reply: 'Kripya apna sawal ya product ka naam likhein.', products: [], orderData: null },
        { status: 400 }
      );
    }

    const lower = rawMessage.toLowerCase();

    // 1. ORDER TAKING & DIRECT BOOKING INTENT ("order lene wala")
    const isOrderPlacement =
      (lower.includes('order') && (lower.includes('book') || lower.includes('karna') || lower.includes('karo') || lower.includes('lena') || lower.includes('placing') || lower.includes('place'))) ||
      lower.includes('kharidna') ||
      lower.includes('lena hai') ||
      lower.includes('mangwana') ||
      lower.includes('bhejo') ||
      lower.includes('buy now') ||
      lower.includes('purchase') ||
      lower.includes('kaise order') ||
      lower.includes('how to order');

    // 2. SHOWROOM LOCATION, HOURS & CONTACT INTENT (High Priority for store inquiries)
    const isLocationQuery =
      lower.includes('address') ||
      lower.includes('location') ||
      lower.includes('where is') ||
      lower.includes('map') ||
      lower.includes('timing') ||
      lower.includes('open') ||
      lower.includes('close') ||
      lower.includes('hours') ||
      lower.includes('phone') ||
      lower.includes('contact') ||
      lower.includes('call') ||
      lower.includes('mobile') ||
      lower.includes('whatsapp') ||
      ((lower.includes('kahan') || lower.includes('kaha')) && (lower.includes('shop') || lower.includes('store') || lower.includes('showroom') || lower.includes('lapiez') || lower.includes('aap'))) ||
      (lower.includes('showroom') && (lower.includes('visit') || lower.includes('address') || lower.includes('kahan') || lower.includes('details')));

    if (isLocationQuery) {
      const reply = `Lapiez Technology Showroom Details:\n` +
        `• Location: Opposite G P Plaza, Chiniya Road, Garhwa, Jharkhand - 822114\n` +
        `• Showroom Hours: 10:00 AM - 8:30 PM (Monday to Sunday)\n` +
        `• Phone & WhatsApp: +91 9608828288\n` +
        `• Landmark: Chiniya Road main market, opposite G P Plaza.\n\n` +
        `Aap showroom aakar direct counter purchase kar sakte hain, ya laptop service/inspection karwa sakte hain.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
        action: {
          type: 'SHOWROOM_INFO',
          address: 'Opposite G P Plaza, Chiniya Road, Garhwa, Jharkhand - 822114',
          phone: '+919608828288',
          mapsUrl: 'https://maps.google.com/?q=Lapiez+Garhwa+Chiniya+Road',
        },
      });
    }

    // 3. ORDER TRACKING INTENT
    // Matches patterns like "LPZ-12345", "#LPZ-12345", "order 12345", "track 12345", or 4-6 digit order numbers
    const orderIdMatch = rawMessage.match(/(?:#|order\s*(?:id|#)?\s*|track\s*|status\s*)?(lpz-[\w-]+|\b\d{4,6}\b)/i);
    const mentionsTracking = (lower.includes('track') || lower.includes('status') || lower.includes('kahan tak')) && !isOrderPlacement;

    if (orderIdMatch && (mentionsTracking || /lpz/i.test(rawMessage) || /^\d{4,6}$/.test(rawMessage.trim()))) {
      const candidateId = orderIdMatch[1].trim();

      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { orderId: { equals: candidateId, mode: 'insensitive' } },
              { orderId: { equals: `LPZ-${candidateId}`, mode: 'insensitive' } },
              { orderId: { contains: candidateId, mode: 'insensitive' } },
            ],
          },
        });

        if (order) {
          let itemCount = 1;
          try {
            const parsed = JSON.parse(order.itemsJson);
            if (Array.isArray(parsed)) itemCount = parsed.length;
          } catch {}

          const reply = `Aapka Order #${order.orderId} mil gaya hai (${order.customerName}):\n` +
            `• Status: ${order.orderStatus.toUpperCase()}\n` +
            `• Payment: ${order.paymentStatus} (${order.paymentMethod})\n` +
            `• Total: ₹${order.totalAmount.toLocaleString('en-IN')} (${itemCount} item${itemCount > 1 ? 's' : ''})\n` +
            `• Address: ${order.address}\n\n` +
            `Aapka order showroom dispatch team ke dwara pack ho chuka hai. Full details aur GST invoice niche dekhein.`;

          return NextResponse.json({
            reply,
            orderData: {
              orderId: order.orderId,
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus,
              paymentMethod: order.paymentMethod,
              totalAmount: order.totalAmount,
              customerName: order.customerName,
              address: order.address,
              date: order.date || new Date(order.createdAt).toLocaleDateString('en-IN'),
              itemCount,
            },
            products: [],
            action: { type: 'TRACK_ORDER', orderId: order.orderId },
          });
        } else if (/lpz/i.test(candidateId) || /^\d{4,6}$/.test(candidateId)) {
          return NextResponse.json({
            reply: `No order found matching "${candidateId}". Kripya apna sahi Order ID (jaise #LPZ-XXXXX) check karke dobara bhejein.`,
            orderData: null,
            products: [],
          });
        }
      } catch (err) {
        console.error('Error looking up order in chatbot:', err);
      }
    }

    if (mentionsTracking && !orderIdMatch) {
      return NextResponse.json({
        reply: 'Apna order status check karne ke liye kripya apna Order ID (jaise #LPZ-19845 ya 5-digit number) bhejein. Main turant live status check karke bata dunga.',
        orderData: null,
        products: [],
      });
    }

    // 4. WARRANTY, REPAIR & HARDWARE SERVICE INTENT
    if (
      lower.includes('warranty') ||
      lower.includes('guarantee') ||
      lower.includes('repair') ||
      lower.includes('service') ||
      lower.includes('screen') ||
      lower.includes('hinge') ||
      lower.includes('format') ||
      lower.includes('windows') ||
      lower.includes('not turning on') ||
      lower.includes('battery') ||
      lower.includes('fan') ||
      lower.includes('heating') ||
      lower.includes('rma')
    ) {
      const reply = `Lapiez Garhwa Hardware & Warranty Services:\n` +
        `• Chip-Level Motherboard Repair: Short-circuit, no power, charging IC diagnosis.\n` +
        `• Screen & Display Replacement: Original HD/FHD LED panels for HP, Dell, Lenovo, Asus.\n` +
        `• Hinge & Body Repair: Hinge fabrication aur structural restoration.\n` +
        `• Brand Authorized Warranty: Official ASC support for HP, Dell, Lenovo, Asus, CP Plus.\n` +
        `• Software & Maintenance: Windows installation, SSD upgrades, and thermal cleaning.\n\n` +
        `Aap apna device direct Chiniya Road showroom par laa sakte hain ya online RMA claim submit kar sakte hain.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
        action: { type: 'NAVIGATE', url: '/warranty', label: 'Open Warranty Desk' },
      });
    }

    // 5. DELIVERY & SHIPPING INTENT
    if (
      lower.includes('delivery') ||
      lower.includes('shipping') ||
      lower.includes('charge') ||
      lower.includes('speed') ||
      lower.includes('meral') ||
      lower.includes('palamu') ||
      lower.includes('ranka') ||
      lower.includes('majhiaon')
    ) {
      const reply = `Garhwa Showroom se Doorstep Delivery Coverage:\n` +
        `• Garhwa Town Core (0-5 km): 30 se 60 minute ke andar express delivery. ₹5,000 se upar ke order par 100% Free Delivery.\n` +
        `• Suburbs (5-15 km): 2 se 4 ghante me delivery.\n` +
        `• Outer Blocks & Palamu (15-50+ km): Same-day / Next-day courier dispatch.\n\n` +
        `Delivery charges aapke live GPS distance ke hisab se automatic checkout par calculate hote hain.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // 6. INVOICE, GST & PAYMENT INTENT
    if (
      lower.includes('gst') ||
      lower.includes('invoice') ||
      lower.includes('tax') ||
      lower.includes('bill') ||
      lower.includes('genuine') ||
      lower.includes('original') ||
      lower.includes('asli') ||
      lower.includes('cod') ||
      lower.includes('cash on delivery') ||
      lower.includes('payment')
    ) {
      const reply = `Payment & 100% Genuine Billing:\n` +
        `• 100% Original Products: Authorized distributor warranty ke sath.\n` +
        `• Official 18% GST Invoice: Sabhi orders ke sath official tax invoice diya jata hai (Input Tax Credit / ITC valid).\n` +
        `• Payment Options: Cash on Delivery (COD), UPI Dynamic QR (GPay, PhonePe, Paytm), aur Counter Payment.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // 7. PRODUCT SEARCH & ORDERING ("order lene wala")
    let maxPrice: number | undefined;
    const priceMatch = rawMessage.match(/(?:under|below|kam|upto|within|budget of)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1], 10);
    }

    const brandKeywords = [
      'hp', 'dell', 'lenovo', 'asus', 'acer', 'frontech', 
      'lapcare', 'cp plus', 'cp-plus', 'hikvision', 'logitech', 
      'brother', 'canon', 'ant esports', 'zebronics', 'fingers'
    ];
    const detectedBrand = brandKeywords.find((b) => lower.includes(b));

    const categoryKeywords: Record<string, string[]> = {
      'Laptops': ['laptop', 'notebook', 'ultrabook', 'refurbished laptop', 'macbook'],
      'Toners & Cartridges': ['toner', 'cartridge', 'ink', 'laser toner', 'printer ink'],
      'CCTV & Security': ['cctv', 'camera', 'security', 'dvr', 'nvr', 'surveillance'],
      'Printers': ['printer', 'all in one printer', 'laserjet', 'inkjet'],
      'Peripherals': ['keyboard', 'mouse', 'speaker', 'headphone', 'headset', 'mic'],
      'Components': ['ram', 'ssd', 'nvme', 'hard disk', 'hdd', 'motherboard', 'processor', 'smps'],
      'Cables & Adapters': ['cable', 'adapter', 'charger', 'hdmi', 'vga', 'power cord'],
      'Monitors': ['monitor', 'screen', 'display', 'led monitor'],
      'Networking': ['router', 'wifi', 'switch', 'lan', 'ethernet'],
    };

    let detectedCategory = '';
    for (const [cat, kws] of Object.entries(categoryKeywords)) {
      if (kws.some((kw) => lower.includes(kw))) {
        detectedCategory = cat;
        break;
      }
    }

    const isProductQuery = detectedBrand || detectedCategory || maxPrice || isOrderPlacement ||
      lower.includes('buy') || lower.includes('chahiye') || lower.includes('price') || 
      lower.includes('rate') || lower.includes('cost') || lower.includes('sasta') || 
      lower.includes('best') || lower.includes('suggest') || lower.includes('recommend');

    if (isProductQuery) {
      const searchTerms = rawMessage
        .replace(/(?:under|below|kam|upto|within|budget of)\s*(?:rs\.?|inr|₹)?\s*\d+/gi, '')
        .replace(/(?:chahiye|mujhe|dikhao|price|rate|cost|best|suggest|recommend|hai|kya|ke|ka|ki|in|for|buy|please|order|book|karna|lena)/gi, '')
        .trim();

      const whereClause: any = {
        status: 'active',
        deletedAt: null,
      };

      if (maxPrice) {
        whereClause.price = { lte: maxPrice };
      }

      if (detectedBrand) {
        const brandNorm = detectedBrand === 'cp-plus' ? 'cp plus' : detectedBrand;
        whereClause.brand = { contains: brandNorm, mode: 'insensitive' };
      }

      let products = await prisma.product.findMany({
        where: whereClause,
        take: 6,
        orderBy: [{ inStock: 'desc' }, { rating: 'desc' }, { price: 'asc' }],
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          price: true,
          mrp: true,
          discount: true,
          image: true,
          inStock: true,
          specs: true,
          rating: true,
        },
      });

      if (products.length === 0 && searchTerms.length > 2) {
        const words = searchTerms.split(/\s+/).filter((w) => w.length > 2);
        if (words.length > 0) {
          products = await prisma.product.findMany({
            where: {
              status: 'active',
              deletedAt: null,
              ...(maxPrice ? { price: { lte: maxPrice } } : {}),
              OR: words.map((w) => ({
                OR: [
                  { name: { contains: w, mode: 'insensitive' } },
                  { specs: { contains: w, mode: 'insensitive' } },
                  { category: { contains: w, mode: 'insensitive' } },
                  { brand: { contains: w, mode: 'insensitive' } },
                ],
              })),
            },
            take: 6,
            orderBy: [{ inStock: 'desc' }, { rating: 'desc' }],
            select: {
              id: true,
              name: true,
              brand: true,
              category: true,
              price: true,
              mrp: true,
              discount: true,
              image: true,
              inStock: true,
              specs: true,
              rating: true,
            },
          });
        }
      }

      if (products.length > 0) {
        let reply = '';
        if (isOrderPlacement) {
          reply = `Aapke order ke liye Lapiez Garhwa showroom se top options available hain. Niche product card par **Add to Cart** ya **Buy Now** click karke turant order book karein:`;
        } else {
          reply = `Lapiez Garhwa showroom me yeh best items available hain`;
          if (detectedBrand) reply += ` (${detectedBrand.toUpperCase()})`;
          if (maxPrice) reply += ` under ₹${maxPrice.toLocaleString('en-IN')}`;
          reply += ` (18% GST Invoice aur brand warranty ke sath):`;
        }

        return NextResponse.json({
          reply,
          orderData: null,
          products,
          isOrderIntent: isOrderPlacement,
          action: { type: 'VIEW_CATALOG', query: searchTerms || detectedBrand || detectedCategory },
        });
      } else {
        return NextResponse.json({
          reply: `Aap jo product dhundh rahe hain${maxPrice ? ` under ₹${maxPrice.toLocaleString('en-IN')}` : ''}, uska exact match online abhi stock me update ho raha hai. Hamare Chiniya Road showroom counter par aur bhi stock available hai! Aap Shop me browse karein ya direct +91 9608828288 par call/WhatsApp karke order book karein.`,
          orderData: null,
          products: [],
          action: { type: 'NAVIGATE', url: '/shop', label: 'Browse Full Shop' },
        });
      }
    }

    // 8. GENERAL GREETINGS & CHAT ("baat krne wala")
    if (
      lower.includes('hi') ||
      lower.includes('hello') ||
      lower.includes('hey') ||
      lower.includes('namaste') ||
      lower.includes('start') ||
      lower.includes('help') ||
      lower.includes('bhaiya') ||
      lower.includes('sir')
    ) {
      const reply = `Namaste! Lapiez Garhwa Showroom Assistant me aapka swagat hai.\n\n` +
        `Main aapki kya madad kar sakta hoon?\n` +
        `• Product order karne me (Laptops, Toners, CCTV, Printers)\n` +
        `• Live Order Status track karne me (Send Order ID: #LPZ-19845)\n` +
        `• Showroom location, timing aur counter pickup me\n` +
        `• Laptop repair, screen replacement aur warranty assistance me`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // Polite fallback
    const reply = `Lapiez Garhwa Showroom me sampark karne ke liye dhanyawad. Main aapki in chizon me madad kar sakta hoon:\n` +
      `• Kisi bhi product ko order karne me (Direct chat se Add to Cart ya Buy Now karein)\n` +
      `• Order track karne me (Send Order ID jaise #LPZ-19845)\n` +
      `• Showroom timing (10 AM - 8:30 PM, Chiniya Road, Garhwa)\n` +
      `• Laptop motherboard repair aur original warranty service\n\n` +
      `Aap direct hamare showroom desk par call bhi kar sakte hain: +91 9608828288.`;

    return NextResponse.json({
      reply,
      orderData: null,
      products: [],
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        reply: 'Assistant abhi busy hai. Kripya thodi der baad koshish karein ya direct showroom par call karein: +91 9608828288.',
        orderData: null,
        products: [],
      },
      { status: 500 }
    );
  }
}
