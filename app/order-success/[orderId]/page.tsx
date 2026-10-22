'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, Printer, MessageSquare, ArrowRight, ArrowLeft,
  MapPin, Phone, ShieldCheck, Store, Clock, Package, Navigation, Check,
  FileText, ExternalLink, Download, QrCode, Building2
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { STORE_INFO, getCleanWhatsAppNumber } from '../../../data/storeData';
import { getHsnCodeForCategory, convertAmountToWords } from '../../../lib/invoiceUtils';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.orderId as string) || '';

  const { orders, siteSettings, paymentSettings, products } = useStore();
  const [localOrder, setLocalOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);

  // Read order from localStorage or fetch from server API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Check ls_last_order
      const lastOrd = JSON.parse(localStorage.getItem('ls_last_order') || 'null');
      if (lastOrd && (lastOrd.orderId === orderId || !orderId)) {
        setLocalOrder(lastOrd);
        setLoadingOrder(false);
        return;
      }

      // 2. Check ls_orders array
      const savedOrders = JSON.parse(localStorage.getItem('ls_orders') || '[]');
      const match = savedOrders.find((o: any) => o.orderId === orderId);
      if (match) {
        setLocalOrder(match);
        setLoadingOrder(false);
        return;
      }
    } catch (e) {}

    // 3. Fetch from server by orderId
    if (orderId) {
      fetch(`/api/cms/orders?orderId=${encodeURIComponent(orderId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.order) {
            setLocalOrder(data.order);
          }
        })
        .catch(() => null)
        .finally(() => setLoadingOrder(false));
    } else {
      setLoadingOrder(false);
    }
  }, [orderId]);

  // Priority order resolution
  const order = orders.find(o => o.orderId === orderId) || localOrder;

  if (loadingOrder && !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-600">Retrieving order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-black text-gray-900">Order not available</h1>
        <p className="text-sm text-gray-600">This order is not stored in this browser session.</p>
        <Link href="/shop" className="rounded-lg bg-[#1A56DB] px-5 py-3 text-sm font-bold text-white">Continue shopping</Link>
      </div>
    );
  }

  const handlePrintA4 = () => {
    if (typeof window !== 'undefined') {
      window.open(`/invoice/${order.orderId}?print=true`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const itemsList = order.items?.map((it: any) => `• ${it.name} (Qty: ${it.quantity}) - ₹${((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}`).join('\n') || '';
    const waText = `Hello Lapiez Garhwa!\n\nI have placed order *#${order.orderId}* on your website.\n\n*Customer:* ${order.customerName} (${order.phone})\n*Delivery:* ${order.address}\n*Total Amount:* ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}\n*Payment Mode:* ${order.paymentMethod}${order.utrNumber ? `\n*UTR / Ref No:* ${order.utrNumber}` : ''}\n\n*Items Ordered:*\n${itemsList}\n\nPlease confirm availability and delivery dispatch schedule.`;
    const waNum = getCleanWhatsAppNumber(siteSettings?.whatsapp);
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  // Calculate taxes for display preview
  const grandTotal = Number(order.totalAmount || 0);
  const taxableValue = Math.round((grandTotal / 1.18) * 100) / 100;
  const totalTax = Math.round((grandTotal - taxableValue) * 100) / 100;
  const cgst = Math.round((totalTax / 2) * 100) / 100;
  const sgst = Math.round((totalTax - cgst) * 100) / 100;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings?.upiId || 'lappy.solution@ybl'}&pn=LAPIEZ%20GARHWA&am=${grandTotal}&cu=INR&tn=Invoice%20${order.orderId}`)}`;

  // Pickup & approval detection
  const isPickup = Boolean(
    order.isStorePickup ||
    String(order.address || '').toLowerCase().includes('pickup') ||
    String(order.paymentMethod || '').toLowerCase().includes('pickup')
  );
  const isApproved = Boolean(
    order.approvedBy ||
    order.address?.includes('Approved By:') ||
    order.paymentStatus === 'Paid' ||
    order.orderStatus === 'Delivered'
  );

  return (
    <div className="bg-[#F1F3F6] py-6 sm:py-10 min-h-[90vh]">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 space-y-6">
        
        {/* 1. SUCCESS HEADER BANNER */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-6 sm:p-9 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block mb-2">
              {isPickup ? 'Store Pickup Confirmed' : 'Order received'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Thank You, {order.customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-xl mx-auto leading-relaxed">
              {isPickup && !isApproved ? (
                <>
                  Your order <strong className="text-gray-900 font-mono font-bold">#{order.orderId}</strong> is reserved for Showroom Counter Pickup. Please show this Order ID at our Chiniya Road showroom counter. Your official 18% GST Tax Invoice will be finalized and printed upon staff approval & handover.
                </>
              ) : (
                <>
                  Your order <strong className="text-gray-900 font-mono font-bold">#{order.orderId}</strong> has been received by our Garhwa showroom team. An official 18% GST Tax Invoice is ready for your manufacturer warranty.
                </>
              )}
            </p>
          </div>

          {/* Action CTAs: Direct A4 Invoice & WhatsApp */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href={`/invoice/${order.orderId}`}
              target="_blank"
              className="h-10 sm:h-11 px-5 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isPickup && !isApproved ? 'View Showroom Pickup Slip' : 'Download Official GST Invoice (A4 PDF)'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
            </Link>

            <button
              onClick={handlePrintA4}
              className="h-10 sm:h-11 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1A56DB]" />
              <span>{isPickup && !isApproved ? 'Print Pickup Slip' : 'Print A4 Invoice'}</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="h-10 sm:h-11 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>WhatsApp Store Desk</span>
            </button>
          </div>
        </div>

        {/* 2. OFFICIAL GST TAX INVOICE PREVIEW CARD (CBIC RULE 46 COMPLIANT) */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#1A56DB] border border-blue-200 inline-block mb-1">
                {isPickup && !isApproved ? 'PROVISIONAL SHOWROOM SLIP (PENDING STORE APPROVAL)' : 'ORIGINAL TAX INVOICE / BILL OF SUPPLY'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {siteSettings?.siteName || STORE_INFO.name}
              </h2>
              <p className="text-xs text-gray-500">
                {siteSettings?.address || STORE_INFO.address} • Phone: {siteSettings?.phone || STORE_INFO.phone}
              </p>
              <p className="text-xs font-mono text-gray-700 font-bold mt-0.5">
                GSTIN: <span className="text-blue-900">{paymentSettings?.gstin || '20AABCL1234F1Z5'}</span> • PAN: AABCL1234F
              </p>
            </div>

            <div className="sm:text-right font-mono text-xs">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">INVOICE NUMBER</span>
              <strong className="text-gray-900 text-sm">INV-LS-{order.orderId}</strong>
              <div className="text-gray-500 text-[11px] mt-0.5">Date: {order.orderDate || 'Today'}</div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Place of Supply: Jharkhand (20)</div>
            </div>
          </div>

          {/* Billed To Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="font-bold text-gray-400 uppercase text-[10px] block">BILLED TO (CUSTOMER)</span>
              <strong className="font-extrabold text-sm text-gray-900 block mt-0.5">
                {order.customerName}
              </strong>
              <span className="text-gray-600 block mt-0.5 font-mono">{order.phone}</span>
              <span className="text-gray-500 block text-[11px] mt-0.5 leading-snug">{order.address}</span>
              {order.gstin && (
                <span className="text-blue-900 font-mono font-bold block mt-1">Recipient GSTIN: {order.gstin}</span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="font-bold text-gray-400 uppercase text-[10px] block">PAYMENT & SETTLEMENT</span>
              <strong className="font-bold text-emerald-700 block mt-0.5">
                {order.paymentStatus || 'Verification Pending'}
              </strong>
              <span className="text-gray-600 block font-mono text-[11px] mt-0.5">
                Mode: {order.paymentMethod}
              </span>
              {order.utrNumber && (
                <span className="text-blue-700 block font-mono text-[11px] mt-0.5">
                  UTR: {order.utrNumber}
                </span>
              )}
              <span className="text-gray-500 block text-[11px] mt-0.5">State Code: 20 (Jharkhand)</span>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-y border-gray-200 font-extrabold text-gray-700 text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2 text-center">HSN</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((it: any, idx: number) => {
                  const lineTotal = Number(it.price || 0) * Number(it.quantity || 1);
                  const lineTaxable = Math.round((lineTotal / 1.18) * 100) / 100;
                  const hsnCode = getHsnCodeForCategory(it.category || it.name);

                  return (
                    <tr key={idx} className="text-gray-800 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-gray-900 block">{it.name}</span>
                        <span className="text-[10.5px] text-gray-400">SKU: {it.sku || 'Not available'}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-gray-500 text-[11px]">{hsnCode}</td>
                      <td className="py-2.5 px-2 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{lineTaxable.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500 font-mono text-[11px]">18%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation & UPI QR Box */}
          <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 w-full sm:w-auto">
              <img
                src={qrUrl}
                alt="UPI Payment QR"
                className="w-16 h-16 rounded-lg border border-gray-300 bg-white p-1 flex-shrink-0"
              />
              <div className="space-y-0.5 text-[11px]">
                <span className="font-bold text-gray-900 block flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span>Dynamic UPI Payment QR</span>
                </span>
                <span className="text-gray-500 font-mono block">VPA: {paymentSettings?.upiId || 'lappy.solution@ybl'}</span>
                <span className="text-emerald-700 font-bold block">Amount: ₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{taxableValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="font-mono text-[#1A56DB]">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-gray-500 italic">
            Amount in words: <strong className="text-gray-800 not-italic">{convertAmountToWords(grandTotal)}</strong>
          </div>

          {/* Quick Button Strip inside Invoice */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[10.5px] text-gray-400">
              Computer generated tax invoice. Valid for brand manufacturer warranty across India.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/invoice/${order.orderId}`}
                target="_blank"
                className="px-3.5 py-1.5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Fullscreen A4 Bill</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. LIVE ORDER TRACKING PROGRESS STEPPER */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">
              Showroom Delivery & Verification Status
            </h3>
            <span className="text-xs font-bold text-[#1A56DB] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Expected Today (Garhwa Express)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
            {order.trackingSteps?.map((step: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                  step.done ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <strong className={`text-[11px] block font-bold leading-tight ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.step}
                </strong>
                <span className="text-[9.5px] text-gray-500 mt-1">{step.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. RETURN TO SHOP CTA */}
        <div className="text-center pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1A56DB] hover:text-[#1E40AF]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping ({products.length || 413}+ Hardware Items)</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
