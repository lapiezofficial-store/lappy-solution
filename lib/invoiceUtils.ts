// Lapiez - Dynamic GST Tax Invoice & Billing Engine
// Compliant with CBIC Rule 46 (GST Tax Invoice Rules)

export interface InvoiceItem {
  id: string;
  productId?: string;
  productName: string;
  sku?: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number; // MRP or unit selling price (inclusive of GST)
  discount: number;
  taxableValue: number;
  gstRate: number; // e.g. 18, 12, 5, 28
  cgstRate: number; // e.g. 9
  sgstRate: number; // e.g. 9
  igstRate: number; // e.g. 18 (for interstate)
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface InvoiceSettings {
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. 20 for Jharkhand
  pincode: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;

  // Invoice series
  prefix: string; // e.g. 'INV'
  financialYear: string; // e.g. '2026-27'
  nextNumber: number; // e.g. 1

  // Bank & UPI details
  upiId: string;
  upiName: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;

  // Defaults
  defaultGstRate: number;
  isInterstate: boolean; // default false (Jharkhand intrastate)

  // Policy & Signature
  termsAndConditions: string[];
  declaration: string;
  signatoryName?: string;
  signatoryTitle: string;

  // Visibility toggles
  showGstin: boolean;
  showHsn: boolean;
  showUpiQr: boolean;
  showBankDetails: boolean;
  showAmountInWords: boolean;
  showSignature: boolean;
  showTerms: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV/2026-27/00001
  financialYear: string;
  orderId?: string;
  date: string; // DD/MM/YYYY
  dueDate?: string;
  placeOfSupply: string;
  reverseCharge: string; // 'No' or 'Yes'

  // Seller details (snapshot)
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerState: string;
  sellerStateCode: string;

  // Buyer details
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerAddress: string;
  buyerState: string;
  buyerStateCode: string;
  buyerGstin?: string;
  poNumber?: string;

  // Items
  items: InvoiceItem[];

  // Tax calculations
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  shipping: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  // Payment & Staff Handover
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Cancelled';
  upiId: string;
  upiQrData: string;
  sellerHandedBy?: string;
  approvedBy?: string;
  isApproved?: boolean;
  isPickupOrder?: boolean;

  // Terms & Footer
  notes?: string;
  terms: string[];
  declaration: string;
  signatoryName?: string;
  signatoryTitle: string;
  createdAt: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  businessName: 'Lapiez',
  tagline: 'Technology • Security • Complete Hardware Solutions',
  address: 'In front of G P Plaza, Chiniya Road',
  city: 'Garhwa',
  state: 'Jharkhand',
  stateCode: '20',
  pincode: '822114',
  gstin: '20AABCL1234F1Z5',
  pan: 'AABCL1234F',
  phone: '+91 9608828288',
  email: 'lapiezofficial@gmail.com',
  website: 'www.lapiez.com',
  logoUrl: '',

  prefix: 'INV',
  financialYear: '2026-27',
  nextNumber: 10248,

  upiId: 'lappy.solution@ybl',
  upiName: 'LAPIEZ GARHWA',
  accountHolderName: 'lappy solutions',
  bankName: 'Union Bank of India',
  accountNumber: '638301010050261',
  ifscCode: 'UBIN0563838',
  branch: 'GARHWA',

  defaultGstRate: 18,
  isInterstate: false,

  termsAndConditions: [
    'All disputes are subject to Garhwa, Jharkhand jurisdiction only.',
    'Goods once sold will be replaced within 7 days in case of manufacturing defect as per showroom policy.',
    'Brand warranty on laptops, printers and CCTV systems will be honored at authorized brand service centers across India.',
    'Original tax invoice is mandatory for claiming manufacturer warranty and GSTR-1 Input Tax Credit (ITC).',
    'Subject to realization of Cheque / UPI / Bank transfer.'
  ],
  declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  signatoryName: '',
  signatoryTitle: 'Authorized Signatory for Lapiez',

  showGstin: true,
  showHsn: true,
  showUpiQr: true,
  showBankDetails: true,
  showAmountInWords: true,
  showSignature: true,
  showTerms: true
};

// Number to Words converter (Indian Currency Format: Crores, Lakhs, Thousands, Rupees)
export function convertAmountToWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertNumber(num: number): string {
    let str = '';
    if (num > 19) {
      str += tensMultiple[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + singleDigits[num % 10] : '');
    } else if (num >= 10) {
      str += twoDigits[num - 10];
    } else if (num > 0) {
      str += singleDigits[num];
    }
    return str;
  }

  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = '';

  const crore = Math.floor(rupees / 10000000);
  let remainder = rupees % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = Math.floor(remainder / 100);
  const tens = remainder % 100;

  if (crore > 0) {
    result += convertNumber(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertNumber(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertNumber(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    result += convertNumber(hundred) + ' Hundred ';
  }
  if (tens > 0) {
    result += convertNumber(tens) + ' ';
  }

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertNumber(paise) + ' Paise';
  }

  return 'INR ' + result + ' Only';
}

// Generate dynamic UPI URI and QR Code URL
export function generateUpiData(params: {
  upiId: string;
  upiName: string;
  amount: number;
  invoiceNumber: string;
}): { upiUri: string; qrCodeUrl: string } {
  const { upiId, upiName, amount, invoiceNumber } = params;
  const formattedAmount = amount.toFixed(2);
  const note = `Invoice ${invoiceNumber}`;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}&margin=4`;

  return { upiUri, qrCodeUrl };
}

// Compute HSN Code from category
export function getHsnCodeForCategory(category?: string): string {
  if (!category) return '84713010';
  const cat = category.toLowerCase();
  if (cat.includes('laptop')) return '84713010'; // Laptops & portable computers
  if (cat.includes('computer') || cat.includes('pc')) return '84714190'; // Desktop computers
  if (cat.includes('cctv') || cat.includes('security') || cat.includes('camera')) return '85258900'; // Surveillance CCTV
  if (cat.includes('printer') || cat.includes('ink') || cat.includes('toner')) return '84433200'; // Printers & multifunction
  if (cat.includes('storage') || cat.includes('ssd') || cat.includes('ram')) return '84717020'; // Hard drives, SSDs
  if (cat.includes('adapter') || cat.includes('power') || cat.includes('battery')) return '85044090'; // Power adapters
  if (cat.includes('networking') || cat.includes('router') || cat.includes('switch')) return '85176290'; // Networking routers
  return '84733020'; // Computer parts & accessories
}

// Calculate Indian GST item line
// In Indian retail, prices displayed are commonly inclusive of GST.
// We calculate: Taxable Value = (Unit Price * Qty - Discount) / (1 + GST_Rate / 100)
export function calculateInvoiceItem(params: {
  id: string;
  productId?: string;
  productName: string;
  category?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  gstRate?: number;
  isInterstate?: boolean;
}): InvoiceItem {
  const {
    id,
    productId,
    productName,
    category,
    sku,
    quantity,
    unitPrice,
    discount = 0,
    gstRate = 18,
    isInterstate = false
  } = params;

  const grossTotal = unitPrice * quantity;
  const netAfterDiscount = Math.max(0, grossTotal - discount);

  // Derive taxable value and tax
  const taxMultiplier = 1 + gstRate / 100;
  const taxableValue = Math.round((netAfterDiscount / taxMultiplier) * 100) / 100;
  const totalTax = Math.round((netAfterDiscount - taxableValue) * 100) / 100;

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstRate = gstRate;
    igstAmount = totalTax;
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Math.round((totalTax / 2) * 100) / 100;
    sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100; // balance cent
  }

  return {
    id,
    productId,
    productName,
    sku: sku || `LS-${Math.floor(100000 + Math.random() * 900000)}`,
    hsn: getHsnCodeForCategory(category),
    quantity,
    unit: 'PCS',
    unitPrice,
    discount,
    taxableValue,
    gstRate,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total: netAfterDiscount
  };
}

// Generate formatted sequential invoice number
export function formatInvoiceNumber(prefix: string, financialYear: string, seqNumber: number): string {
  const padded = String(seqNumber).padStart(5, '0');
  return `${prefix}/${financialYear}/${padded}`;
}

// Build a complete Invoice from an order or manual input
export function buildInvoiceFromOrder(params: {
  order: any;
  settings?: InvoiceSettings;
  customBuyerGstin?: string;
  isInterstate?: boolean;
}): Invoice {
  const { order, settings = DEFAULT_INVOICE_SETTINGS, customBuyerGstin, isInterstate = false } = params;

  const invoiceNumber = formatInvoiceNumber(settings.prefix, settings.financialYear, settings.nextNumber);

  // Parse items
  let rawItems: any[] = [];
  if (Array.isArray(order.items)) {
    rawItems = order.items;
  } else if (typeof order.itemsJson === 'string') {
    try {
      rawItems = JSON.parse(order.itemsJson);
    } catch {
      rawItems = [];
    }
  }

  if (rawItems.length === 0) {
    rawItems = [
      {
        id: 'item-1',
        name: 'HP 15s Business Laptop Core i5 12th Gen',
        price: order.totalAmount || 52999,
        quantity: 1,
        category: 'Laptops'
      }
    ];
  }

  const invoiceItems: InvoiceItem[] = rawItems.map((item, idx) => {
    return calculateInvoiceItem({
      id: `inv-item-${idx + 1}`,
      productId: item.id || item.productId,
      productName: item.name || item.productName || 'Computer Hardware',
      category: item.category,
      sku: item.sku,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.price || item.unitPrice || 0),
      discount: Number(item.discount || 0),
      gstRate: settings.defaultGstRate || 18,
      isInterstate
    });
  });

  const subtotal = invoiceItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const discountTotal = invoiceItems.reduce((acc, it) => acc + it.discount, 0);
  const taxableAmount = Math.round(invoiceItems.reduce((acc, it) => acc + it.taxableValue, 0) * 100) / 100;
  const cgstTotal = Math.round(invoiceItems.reduce((acc, it) => acc + it.cgstAmount, 0) * 100) / 100;
  const sgstTotal = Math.round(invoiceItems.reduce((acc, it) => acc + it.sgstAmount, 0) * 100) / 100;
  const igstTotal = Math.round(invoiceItems.reduce((acc, it) => acc + it.igstAmount, 0) * 100) / 100;
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const calculatedGrand = taxableAmount + totalTax;
  const roundedGrand = Math.round(calculatedGrand);
  const roundOff = Math.round((roundedGrand - calculatedGrand) * 100) / 100;

  const { upiUri, qrCodeUrl } = generateUpiData({
    upiId: settings.upiId,
    upiName: settings.upiName,
    amount: roundedGrand,
    invoiceNumber
  });

  const dateStr = order.date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const isPickup = Boolean(
    order.isStorePickup ||
    String(order.address || '').toLowerCase().includes('pickup') ||
    String(order.paymentMethod || '').toLowerCase().includes('pickup')
  );

  const sellerHandedBy = (
    order.pickupHandedBy ||
    order.sellerName ||
    order.address?.match(/(?:Handed Over By|Sold By):\s*([^•\n]+)/i)?.[1]?.trim() ||
    ''
  );

  const rawApproved = (
    order.approvedBy ||
    order.address?.match(/Approved By:\s*([^•\n]+)/i)?.[1]?.trim() ||
    ''
  );
  const approvedBy = rawApproved === 'Jay Prakash Chaubey' || rawApproved === 'Jay Prakash' ? 'Lapiez' : rawApproved;

  const isApproved = Boolean(
    approvedBy ||
    order.paymentStatus === 'Paid' ||
    order.orderStatus === 'Delivered' ||
    order.orderStatus === 'Shipped'
  );

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    financialYear: settings.financialYear,
    orderId: order.orderId || order.id,
    date: dateStr,
    dueDate: dateStr,
    placeOfSupply: isInterstate ? 'Interstate (99)' : `${settings.state} (${settings.stateCode})`,
    reverseCharge: 'No',

    sellerName: settings.businessName,
    sellerAddress: `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`,
    sellerGstin: settings.gstin,
    sellerPan: settings.pan,
    sellerPhone: settings.phone,
    sellerEmail: settings.email,
    sellerState: settings.state,
    sellerStateCode: settings.stateCode,

    buyerName: order.customerName || 'Valued Customer',
    buyerPhone: order.phone || '+91 9608828288',
    buyerEmail: order.email || 'customer@lapiez.com',
    buyerAddress: order.address || `${settings.city}, ${settings.state}`,
    buyerState: isInterstate ? 'Bihar' : settings.state,
    buyerStateCode: isInterstate ? '10' : settings.stateCode,
    buyerGstin: customBuyerGstin || order.buyerGstin || undefined,
    poNumber: order.poNumber || order.po_number || undefined,

    items: invoiceItems,

    subtotal,
    discountTotal,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalTax,
    shipping: 0,
    roundOff,
    grandTotal: roundedGrand,
    amountInWords: convertAmountToWords(roundedGrand),

    paymentMethod: order.paymentMethod || (isPickup ? 'Store Pickup (Cash at Counter)' : 'UPI / Online Payment'),
    paymentStatus: (order.paymentStatus === 'Paid' || order.paymentStatus === 'Verified' || order.paymentStatus === 'Verification In Progress' || String(order.paymentMethod || '').toLowerCase().includes('upi') || Boolean(order.utrNumber)) ? 'Paid' : (order.paymentStatus === 'Cancelled' ? 'Cancelled' : 'Pending'),
    upiId: settings.upiId,
    upiQrData: qrCodeUrl,
    sellerHandedBy,
    approvedBy,
    isApproved,
    isPickupOrder: isPickup,

    notes: order.notes || 'Goods verified and packed in brand original sealed packaging.',
    terms: settings.termsAndConditions,
    declaration: settings.declaration,
    signatoryName: settings.signatoryName && settings.signatoryName !== 'Jay Prakash Chaubey' ? settings.signatoryName : '',
    signatoryTitle: settings.signatoryTitle || 'Authorized Signatory for Lapiez',
    createdAt: new Date().toISOString()
  };
}
