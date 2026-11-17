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
        { reply: 'Please enter a message or question.', products: [], orderData: null },
        { status: 400 }
      );
    }

    const lower = rawMessage.toLowerCase();

    // 1. SHOWROOM LOCATION, HOURS & CONTACT INTENT (High Priority for store inquiries)
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
        `You can visit our counter for direct walk-in purchases, laptop service, or instant order counter pickups.`;

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

    // 2. ORDER TRACKING INTENT
    // Matches patterns like "LPZ-12345", "#LPZ-12345", "order 12345", "track 12345", or 4-6 digit order numbers
    const orderIdMatch = rawMessage.match(/(?:#|order\s*(?:id|#)?\s*|track\s*|status\s*)?(lpz-[\w-]+|\b\d{4,6}\b)/i);
    const mentionsOrder = (lower.includes('order') || lower.includes('track')) && !lower.includes('shop') && !lower.includes('store');

    if (orderIdMatch && (mentionsOrder || /lpz/i.test(rawMessage) || /^\d{4,6}$/.test(rawMessage.trim()))) {
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

          const reply = `I found Order #${order.orderId} for ${order.customerName}.\n` +
            `• Status: ${order.orderStatus.toUpperCase()}\n` +
            `• Payment: ${order.paymentStatus} (${order.paymentMethod})\n` +
            `• Total: ₹${order.totalAmount.toLocaleString('en-IN')} (${itemCount} item${itemCount > 1 ? 's' : ''})\n` +
            `• Destination: ${order.address}\n\n` +
            `Our showroom dispatch team is handling this order. You can view full details and download your 18% GST Invoice below.`;

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
            reply: `No order found matching "${candidateId}". Please double-check your Order ID (usually formatted as #LPZ-XXXXX) from your SMS or order confirmation screen.`,
            orderData: null,
            products: [],
          });
        }
      } catch (err) {
        console.error('Error looking up order in chatbot:', err);
      }
    }

    if (mentionsOrder && !orderIdMatch) {
      return NextResponse.json({
        reply: 'To check your order status, please provide your Order ID (e.g. #LPZ-19845 or your 5-digit order number), and I will instantly look it up for you.',
        orderData: null,
        products: [],
      });
    }

    // 3. WARRANTY, REPAIR & HARDWARE SERVICE INTENT
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
        `• Chip-Level Motherboard Repair: Power issues, short circuits, charging IC diagnosis.\n` +
        `• Screen & Display Replacement: Original HD/FHD LED panels for HP, Dell, Lenovo, Asus.\n` +
        `• Hinge & Body Restoration: Hinge fabrication and top-cover repair.\n` +
        `• Brand Warranty Coordination: Direct RMA assistance with official brand ASC centers.\n` +
        `• Software & Maintenance: Windows 11 installation, SSD upgrades, and thermal paste servicing.\n\n` +
        `You can bring your device directly to our Chiniya Road showroom or submit an RMA request under our Warranty section.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
        action: { type: 'NAVIGATE', url: '/warranty', label: 'View Warranty Desk' },
      });
    }

    // 4. DELIVERY & SHIPPING INTENT
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
      const reply = `Delivery Coverage & Rates from Garhwa Showroom:\n` +
        `• Garhwa Town Core (0-5 km): Ultra-fast delivery (30 to 60 minutes). Orders above ₹5,000 receive 100% Free Delivery.\n` +
        `• Suburbs (5-15 km): 2 to 4 hours delivery.\n` +
        `• Outer Blocks & Palamu (15-50+ km): Same-day / Next-day courier & rider dispatch.\n\n` +
        `Delivery charges are automatically calculated based on your live GPS distance at checkout.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // 5. INVOICE, GST & AUTHENTICITY INTENT
    if (
      lower.includes('gst') ||
      lower.includes('invoice') ||
      lower.includes('tax') ||
      lower.includes('bill') ||
      lower.includes('genuine') ||
      lower.includes('original') ||
      lower.includes('asli') ||
      lower.includes('fake')
    ) {
      const reply = `Quality Assurance & GST Compliance:\n` +
        `• 100% Genuine Products: Sourced directly from authorized brand distributors.\n` +
        `• Official 18% GST Invoice: Included with every single purchase for warranty validity and ITC credit.\n` +
        `• Official Brand Warranty: Valid at all authorized brand service centers across India.`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // 6. PRODUCT SEARCH & RECOMMENDATION INTENT
    // Extract price constraints if any
    let maxPrice: number | undefined;
    const priceMatch = rawMessage.match(/(?:under|below|kam|upto|within|budget of)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1], 10);
    }

    // Identify brand keywords
    const brandKeywords = [
      'hp', 'dell', 'lenovo', 'asus', 'acer', 'frontech', 
      'lapcare', 'cp plus', 'cp-plus', 'hikvision', 'logitech', 
      'brother', 'canon', 'ant esports', 'zebronics', 'fingers'
    ];
    const detectedBrand = brandKeywords.find((b) => lower.includes(b));

    // Identify category keywords
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

    // Product search query
    // If brand, category or specific hardware term is detected
    const isProductQuery = detectedBrand || detectedCategory || maxPrice ||
      lower.includes('buy') || lower.includes('chahiye') || lower.includes('price') || 
      lower.includes('rate') || lower.includes('cost') || lower.includes('sasta') || 
      lower.includes('best') || lower.includes('suggest') || lower.includes('recommend');

    if (isProductQuery) {
      // Build search query terms
      const searchTerms = rawMessage
        .replace(/(?:under|below|kam|upto|within|budget of)\s*(?:rs\.?|inr|₹)?\s*\d+/gi, '')
        .replace(/(?:chahiye|mujhe|dikhao|price|rate|cost|best|suggest|recommend|hai|kya|ke|ka|ki|in|for|buy|please)/gi, '')
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

      // Try searching Prisma
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

      // If no exact brand matches, fallback to keyword search across name, specs, category
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
        let reply = `Here are the top matches available at Lapiez Garhwa showroom`;
        if (detectedBrand) reply += ` for ${detectedBrand.toUpperCase()}`;
        if (maxPrice) reply += ` under ₹${maxPrice.toLocaleString('en-IN')}`;
        reply += ` with 18% GST Invoice and direct brand warranty:`;

        return NextResponse.json({
          reply,
          orderData: null,
          products,
          action: { type: 'VIEW_CATALOG', query: searchTerms || detectedBrand || detectedCategory },
        });
      } else {
        return NextResponse.json({
          reply: `I could not find an exact match${maxPrice ? ` under ₹${maxPrice.toLocaleString('en-IN')}` : ''} in our online catalog right now. However, we have additional stock at our Chiniya Road showroom counter! You can browse all 91+ SKUs in our Shop or call us directly at +91 9608828288.`,
          orderData: null,
          products: [],
          action: { type: 'NAVIGATE', url: '/shop', label: 'Browse Full Catalog' },
        });
      }
    }

    // 7. DEFAULT / GREETING RESPONSE
    if (
      lower.includes('hi') ||
      lower.includes('hello') ||
      lower.includes('hey') ||
      lower.includes('namaste') ||
      lower.includes('start') ||
      lower.includes('help')
    ) {
      const reply = `Hello! Welcome to Lapiez Garhwa. I am your online showroom assistant.\n\n` +
        `How can I help you today?\n` +
        `• Track an existing order status (e.g. #LPZ-19845)\n` +
        `• Find laptops, printers, CCTV systems or toners\n` +
        `• Get Garhwa showroom directions, timings & phone number\n` +
        `• Hardware repair, warranty & technical support`;

      return NextResponse.json({
        reply,
        orderData: null,
        products: [],
      });
    }

    // Generic polite answer with showroom context
    const reply = `Thank you for reaching out to Lapiez Garhwa. I can help you with:\n` +
      `• Checking order status (just send your Order ID, e.g. #LPZ-19845)\n` +
      `• Looking up product availability, genuine pricing, and specifications\n` +
      `• Showroom location on Chiniya Road, Garhwa (Open 10 AM - 8:30 PM)\n` +
      `• Laptop repairs and official brand warranty support\n\n` +
      `You can also reach our showroom desk directly at +91 9608828288.`;

    return NextResponse.json({
      reply,
      orderData: null,
      products: [],
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        reply: 'Our assistant is momentarily busy. Please try again or call our showroom directly at +91 9608828288.',
        orderData: null,
        products: [],
      },
      { status: 500 }
    );
  }
}
