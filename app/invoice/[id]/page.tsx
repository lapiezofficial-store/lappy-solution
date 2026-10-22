'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Printer, ArrowLeft, Download, ShieldCheck, 
  CheckCircle2, Building2, Phone, Mail, Globe, 
  MapPin, QrCode, FileText, Share2, Copy, Store, UserCheck, AlertCircle, Lock
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { 
  DEFAULT_INVOICE_SETTINGS, 
  buildInvoiceFromOrder, 
  Invoice 
} from '../../../lib/invoiceUtils';

export default function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = (params?.id as string) || '';

  const { 
    invoices, 
    orders, 
    updateOrders,
    invoiceSettings, 
    siteSettings,
    showToast 
  } = useStore();

  const printAreaRef = useRef<HTMLDivElement>(null);

  const [remoteOrder, setRemoteOrder] = useState<any>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(true);

  // Auto-trigger print if ?print=true in query
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams?.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch order from server if not found in local memory or storage
  useEffect(() => {
    if (typeof window === 'undefined' || !invoiceId) return;
    const decodedId = decodeURIComponent(invoiceId || '');

    const foundInLocal = invoices.some(i => i.id === decodedId || i.orderId === decodedId || i.invoiceNumber === decodedId) ||
                         orders.some(o => o.orderId === decodedId || o.id === decodedId);

    if (foundInLocal) {
      setIsLoadingRemote(false);
      return;
    }

    fetch(`/api/cms/orders?orderId=${encodeURIComponent(decodedId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.order) {
          setRemoteOrder(data.order);
        }
      })
      .catch(() => null)
      .finally(() => setIsLoadingRemote(false));
  }, [invoiceId, invoices, orders]);

  // Find invoice by ID, Invoice Number, or Order ID (with instant localStorage sync & server fallback)
  const invoice: Invoice | null = useMemo(() => {
    const decodedId = decodeURIComponent(invoiceId || '');

    // 1. Match from existing StoreContext invoices
    const existing = invoices.find(
      (inv) => inv.id === decodedId || 
               inv.invoiceNumber === decodedId || 
               inv.invoiceNumber.replace(/\//g, '-') === decodedId ||
               inv.orderId === decodedId
    );
    if (existing) return existing;

    // 2. Check direct localStorage 'ls_invoices'
    if (typeof window !== 'undefined') {
      try {
        const savedInvoices: Invoice[] = JSON.parse(localStorage.getItem('ls_invoices') || '[]');
        const match = savedInvoices.find(
          (inv) => inv.id === decodedId || 
                   inv.invoiceNumber === decodedId || 
                   inv.invoiceNumber.replace(/\//g, '-') === decodedId ||
                   inv.orderId === decodedId
        );
        if (match) return match;

        const lastInv = JSON.parse(localStorage.getItem('ls_last_invoice') || 'null');
        if (lastInv && (lastInv.id === decodedId || lastInv.orderId === decodedId || lastInv.invoiceNumber === decodedId)) {
          return lastInv;
        }
      } catch (e) {}
    }

    // 3. Match from StoreContext orders
    const matchedOrder = orders.find(
      (o) => o.orderId === decodedId || o.id === decodedId
    );
    if (matchedOrder) {
      return buildInvoiceFromOrder({
        order: matchedOrder,
        settings: invoiceSettings || DEFAULT_INVOICE_SETTINGS
      });
    }

    // 4. Check direct localStorage 'ls_orders' and 'ls_last_order'
    if (typeof window !== 'undefined') {
      try {
        const savedOrders = JSON.parse(localStorage.getItem('ls_orders') || '[]');
        const match = savedOrders.find(
          (o: any) => o.orderId === decodedId || o.id === decodedId
        );
        if (match) {
          return buildInvoiceFromOrder({
            order: match,
            settings: invoiceSettings || DEFAULT_INVOICE_SETTINGS
          });
        }

        const lastOrder = JSON.parse(localStorage.getItem('ls_last_order') || 'null');
        if (lastOrder && (lastOrder.orderId === decodedId || lastOrder.id === decodedId)) {
          return buildInvoiceFromOrder({
            order: lastOrder,
            settings: invoiceSettings || DEFAULT_INVOICE_SETTINGS
          });
        }
      } catch (e) {}
    }

    // 5. Build from fetched remote database order
    if (remoteOrder) {
      return buildInvoiceFromOrder({
        order: remoteOrder,
        settings: invoiceSettings || DEFAULT_INVOICE_SETTINGS
      });
    }

    return null;
  }, [invoiceId, invoices, orders, invoiceSettings, remoteOrder]);

  if (isLoadingRemote && !invoice) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-600">Generating tax invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-black text-gray-900">Invoice not found</h1>
        <p className="text-sm text-gray-600">The invoice reference could not be found or has expired.</p>
        <Link href="/shop" className="rounded-lg bg-[#1A56DB] px-5 py-3 text-sm font-bold text-white">Continue Shopping</Link>
      </div>
    );
  }

  const isPickup = Boolean(
    invoice?.isPickupOrder ||
    String(invoice?.paymentMethod || '').toLowerCase().includes('pickup') ||
    String(invoice?.buyerAddress || '').toLowerCase().includes('pickup')
  );

  const matchedOrder = orders.find(
    (o) => o.orderId === invoice?.orderId || o.id === invoice?.orderId
  );

  const isOrderApproved = Boolean(
    invoice?.isApproved ||
    invoice?.paymentStatus === 'Paid' ||
    invoice?.approvedBy ||
    matchedOrder?.approvedBy ||
    matchedOrder?.paymentStatus === 'Paid'
  );

  const handleQuickApproveOrder = () => {
    if (!invoice?.orderId) return;
    const approver = typeof window !== 'undefined' ? window.prompt("Enter Approver / Manager Name:", "Jay Prakash Chaubey") : "Jay Prakash Chaubey";
    if (approver === null) return;
    const finalApprover = approver.trim() || "Jay Prakash Chaubey";

    const updated = orders.map(o => {
      if (o.orderId === invoice.orderId || o.id === invoice.orderId) {
        let updatedAddr = o.address || '';
        if (updatedAddr.includes('Approved By:')) {
          updatedAddr = updatedAddr.replace(/Approved By:\s*([^•\n]+)/i, `Approved By: ${finalApprover}`);
        } else {
          updatedAddr = `${updatedAddr} • Approved By: ${finalApprover}`;
        }
        return {
          ...o,
          address: updatedAddr,
          paymentStatus: 'Paid',
          approvedBy: finalApprover,
        };
      }
      return o;
    });
    updateOrders(updated);
    showToast(`Order #${invoice.orderId} approved by ${finalApprover}! Official Bill generated.`);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Invoice link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] py-4 sm:py-8 print:p-0 print:bg-white text-gray-800">
      
      {/* 1. TOP ACTION TOOLBAR (Hidden when Printing) */}
      <div className="max-w-4xl mx-auto px-4 mb-4 sm:mb-6 print:hidden">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.back()}
              className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <Link
              href="/account"
              className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>My Orders</span>
            </Link>

            <span className="text-xs text-gray-400 font-mono hidden sm:inline">|</span>
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">
              Tax Invoice #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyLink}
              className="h-9 px-3.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy shareable invoice link"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-9 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL WARNING BANNER */}
      {!isOrderApproved && (
        <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-950 flex items-center gap-1.5">
                  <span>Bill Pending Showroom Approval</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Provisional Slip
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Ye bill abhi showroom manager dwara approve nahi hua hai. Official GST Tax Invoice counter approval aur product handover ke baad finalize hoga.
                </p>
                {invoice.sellerHandedBy && (
                  <p className="text-[11px] text-amber-950 mt-1 font-semibold">
                    Seller / Handover Staff: <span className="underline">{invoice.sellerHandedBy}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleQuickApproveOrder}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Finalize Bill Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. A4 PRINT-READY INVOICE CONTAINER */}
      <div 
        ref={printAreaRef}
        className="invoice-container max-w-4xl mx-auto bg-white border border-gray-300 print:border-none shadow-sm print:shadow-none rounded-xl print:rounded-none p-5 sm:p-8 print:p-0 font-sans text-gray-900"
        style={{
          boxSizing: 'border-box'
        }}
      >
        
        {/* HEADER: Business Info & Title (Matching Image 2) */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg border-2 border-gray-900 bg-white text-gray-900 font-extrabold flex items-center justify-center text-sm shadow-xs print:border print:border-black">
                LS
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 leading-tight">
                  {invoice.sellerName || siteSettings?.siteName || 'Lapiez'}
                </h1>
                <p className="text-[11px] font-semibold text-gray-600">
                  {invoiceSettings?.tagline || 'Technology • Security • Complete Hardware Solutions'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed pt-0.5">
              {invoice.sellerAddress}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-700 pt-0.5">
              <span><strong>Phone:</strong> {invoice.sellerPhone}</span>
              <span><strong>Email:</strong> {invoice.sellerEmail}</span>
            </div>

            {invoiceSettings?.showGstin && (
              <div className="flex flex-wrap items-center gap-x-3 text-xs font-bold text-gray-900 pt-0.5">
                <span>GSTIN: {invoice.sellerGstin}</span>
                <span>PAN: {invoice.sellerPan}</span>
              </div>
            )}
          </div>

          <div className="sm:text-right space-y-1.5 min-w-[210px]">
            <div className="inline-block px-3 py-1 bg-white border border-gray-700 text-gray-900 font-extrabold text-xs tracking-wider uppercase rounded print:border print:border-black">
              TAX INVOICE
            </div>
            <div className="text-[10.5px] font-extrabold text-emerald-700 uppercase tracking-wider block">
              ORIGINAL FOR RECIPIENT
            </div>

            <div className="text-xs space-y-0.5 pt-0.5">
              <div>
                <span className="text-gray-500">Invoice No: </span>
                <strong className="text-[#1A56DB] print:text-black font-mono font-bold text-[13px]">{invoice.invoiceNumber}</strong>
              </div>
              <div>
                <span className="text-gray-500">Date: </span>
                <strong className="text-gray-900">{invoice.date}</strong>
              </div>
              {invoice.orderId && (
                <div>
                  <span className="text-gray-500">Order Ref: </span>
                  <strong className="text-[#1A56DB] print:text-black font-mono">#{invoice.orderId}</strong>
                </div>
              )}
              {invoice.poNumber && (
                <div>
                  <span className="text-gray-500">P.O. Number: </span>
                  <strong className="text-purple-800 print:text-black font-mono font-bold">{invoice.poNumber}</strong>
                </div>
              )}
              <div>
                <span className="text-gray-500">Place of Supply: </span>
                <strong className="text-gray-900">{invoice.placeOfSupply}</strong>
              </div>
              <div>
                <span className="text-gray-500">Reverse Charge: </span>
                <strong className="text-gray-900">{invoice.reverseCharge}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* THICK DIVIDING LINE */}
        <div className="border-b-2 border-gray-900 mb-3.5"></div>

        {/* BUYER & CONSIGNEE DETAILS (BILL TO / SHIP TO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5 text-xs">
          
          {/* Bill To */}
          <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-1">
            <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[10px] block">
              BILLED TO (BUYER DETAILS)
            </span>
            <div className="text-sm font-bold text-gray-900">
              {invoice.buyerName}
            </div>
            <div className="text-gray-700">
              Phone: <strong>{invoice.buyerPhone}</strong>
            </div>
            {invoice.buyerEmail && (
              <div className="text-gray-700 truncate">
                Email: {invoice.buyerEmail}
              </div>
            )}
            <div className="text-gray-700 leading-snug">
              Address: {invoice.buyerAddress}
            </div>
            <div className="text-gray-700">
              State: <strong>{invoice.buyerState} (Code: {invoice.buyerStateCode})</strong>
            </div>
            {invoice.buyerGstin && (
              <div className="text-xs font-bold text-blue-800 pt-0.5">
                Buyer GSTIN: {invoice.buyerGstin}
              </div>
            )}
            {invoice.poNumber && (
              <div className="text-xs font-bold text-purple-800 pt-0.5 font-mono">
                P.O. Number: {invoice.poNumber}
              </div>
            )}
          </div>

          {/* Ship To / Settlement */}
          <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-1">
            <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[10px] block">
              {isPickup ? 'SHOWROOM COUNTER PICKUP & SETTLEMENT' : 'SHIPPED TO & PAYMENT SETTLEMENT'}
            </span>
            <div className="text-sm font-bold text-gray-900">
              {invoice.buyerName}
            </div>
            <div className="text-gray-700 leading-snug text-xs">
              {isPickup ? (
                <span className="inline-flex items-center gap-1 font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  <Store className="w-3.5 h-3.5 text-purple-700" />
                  <span>Showroom Counter Pickup (Garhwa Showroom)</span>
                </span>
              ) : (
                <>Delivery Destination: {invoice.buyerAddress}</>
              )}
            </div>

            <div className="pt-1 space-y-1 text-xs">
              <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded border border-gray-200">
                <span className="text-gray-600 font-semibold">Payment Mode:</span>
                <strong className="text-gray-900 font-bold">
                  {invoice.paymentMethod || (isPickup ? 'Store Pickup (Cash at Counter)' : 'UPI / Online Payment')}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded text-[10.5px] ${
                  isOrderApproved ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-amber-800 bg-amber-50 border border-amber-200'
                }`}>
                  {isOrderApproved ? '✓ PAID / SETTLED' : 'APPROVAL PENDING'}
                </span>
              </div>

              {(invoice.sellerHandedBy || isPickup) && (
                <div className="flex justify-between items-center bg-amber-50/70 px-2 py-1 rounded border border-amber-200 text-[11px]">
                  <span className="text-amber-900 font-bold">Sold & Handed By:</span>
                  <strong className="text-gray-900 font-bold">
                    {invoice.sellerHandedBy || 'Showroom Sales Counter'}
                  </strong>
                </div>
              )}

              {(invoice.approvedBy || isOrderApproved) && (
                <div className="flex justify-between items-center bg-blue-50/70 px-2 py-1 rounded border border-blue-200 text-[11px]">
                  <span className="text-blue-900 font-bold">Approved By:</span>
                  <strong className="text-blue-950 font-bold">
                    {invoice.approvedBy || 'Jay Prakash Chaubey'}
                  </strong>
                </div>
              )}

              <div className="flex justify-between text-gray-500 text-[10px] pt-0.5">
                <span>Dispatch Hub:</span>
                <strong className="text-gray-800">Chiniya Road Showroom, Garhwa</strong>
              </div>
            </div>
          </div>

        </div>

        {/* ITEMS TABLE (CBIC Rule 46 Compliant) */}
        <div className="mb-3.5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-transparent text-gray-800 font-extrabold uppercase text-[10px] border-t border-b border-gray-300">
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-3">DESCRIPTION OF GOODS</th>
                  <th className="py-2 px-2 text-center">HSN/SAC</th>
                  <th className="py-2 px-2 text-center">QTY</th>
                  <th className="py-2 px-2.5 text-right">UNIT RATE</th>
                  <th className="py-2 px-2 text-right">DISCOUNT</th>
                  <th className="py-2 px-2.5 text-right">TAXABLE VAL</th>
                  <th className="py-2 px-2 text-center">GST %</th>
                  <th className="py-2 px-3 text-right">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                    <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-gray-900 leading-snug">
                        {item.productName}
                      </div>
                      {item.sku && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          SKU: {item.sku}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[#1A56DB] print:text-black font-semibold">
                      {item.hsn}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-gray-900 leading-tight">
                      <div>{item.quantity}</div>
                      <div className="text-[9px] text-gray-500 font-medium">{item.unit || 'PCS'}</div>
                    </td>
                    <td className="py-2 px-2.5 text-right text-gray-700 font-mono">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-500 font-mono">
                      {item.discount > 0 ? `₹${item.discount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-gray-900 font-mono">
                      ₹{item.taxableValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-gray-700">
                      {item.gstRate}%
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-gray-900 font-mono">
                      ₹{item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAX SUMMARY & GRAND TOTAL CALCULATION */}
        <div className="pt-2 pb-3 border-t border-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            
            {/* Amount in words & Bank info (span 7) */}
            <div className="sm:col-span-7 space-y-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                  INVOICE AMOUNT IN WORDS:
                </span>
                <div className="text-xs font-extrabold text-gray-900 bg-white p-2 rounded border border-gray-300 italic">
                  {invoice.amountInWords}
                </div>
              </div>

              {/* Dynamic UPI Payment QR + Bank Details */}
              <div className="border border-gray-300 rounded-lg p-2.5 bg-white flex items-center gap-3">
                {invoiceSettings?.showUpiQr && invoice.upiQrData && (
                  <div className="flex-shrink-0 text-center">
                    <img 
                      src={invoice.upiQrData} 
                      alt="UPI Payment QR Code" 
                      className="w-20 h-20 rounded border border-gray-300 bg-white p-1 mx-auto"
                    />
                    <span className="text-[8.5px] font-extrabold text-gray-700 block mt-0.5 uppercase tracking-wider">
                      SCAN TO PAY ₹{invoice.grandTotal}
                    </span>
                  </div>
                )}

                <div className="text-[11px] space-y-0.5 text-gray-700 min-w-0">
                  <div className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 pb-0.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1A56DB]" />
                    <span>Bank & UPI Settlement Details</span>
                  </div>
                  <div><strong>A/C Name:</strong> {invoiceSettings?.accountHolderName || 'lappy solutions'}</div>
                  <div><strong>Bank:</strong> {invoiceSettings?.bankName || 'Union Bank of India, GARHWA'}</div>
                  <div><strong>A/C No:</strong> <span className="font-mono font-bold text-gray-900">{invoiceSettings?.accountNumber || '638301010050261'}</span></div>
                  <div><strong>IFSC Code:</strong> <span className="font-mono font-bold text-gray-900">{invoiceSettings?.ifscCode || 'UBIN0563838'}</span></div>
                  {invoice.upiId && <div><strong>UPI VPA:</strong> <span className="font-mono text-blue-700 font-bold">{invoice.upiId}</span></div>}
                </div>
              </div>

            </div>

            {/* Calculations breakdown (span 5) */}
            <div className="sm:col-span-5 bg-white p-3 rounded-lg border border-gray-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Gross):</span>
                <span className="font-mono">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount:</span>
                  <span className="font-mono">-₹{invoice.discountTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-800 font-bold border-t border-gray-200 pt-1">
                <span>Taxable Value:</span>
                <span className="font-mono">₹{invoice.taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {invoice.cgstTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>CGST (9%):</span>
                  <span className="font-mono">₹{invoice.cgstTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              {invoice.sgstTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>SGST (9%):</span>
                  <span className="font-mono">₹{invoice.sgstTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              {invoice.igstTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>IGST (18%):</span>
                  <span className="font-mono">₹{invoice.igstTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery / Shipping:</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>

              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.roundOff > 0 ? `+₹${invoice.roundOff}` : `-₹${Math.abs(invoice.roundOff)}`}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t-2 border-gray-900 pt-1.5 text-base font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-[#1A56DB] print:text-black font-mono text-lg font-black">
                  ₹{invoice.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[10px] text-right text-gray-500">
                (Inclusive of all applicable GST)
              </div>
            </div>

          </div>
        </div>

        {/* TERMS & SIGNATURE FOOTER (Compact, Fits on 1 Page) */}
        <div className="pt-2 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-[10.5px]">
          
          <div className="sm:col-span-8 space-y-1 text-gray-600">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-gray-500 block">
              TERMS & CONDITIONS:
            </span>
            <ol className="list-decimal pl-3 space-y-0.5 text-[10px] leading-tight text-gray-600">
              {(invoice.terms || DEFAULT_INVOICE_SETTINGS.termsAndConditions).slice(0, 3).map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ol>
            <p className="text-[9.5px] text-gray-400 italic pt-0.5">
              This is a computer generated legal tax invoice under Rule 46 of CGST Rules 2017.
            </p>
          </div>

          <div className="sm:col-span-4 text-center sm:text-right space-y-1 pt-2 sm:pt-0">
            {invoice.sellerHandedBy && (
              <div className="text-[10px] text-gray-600 pb-0.5">
                Sold / Handed By: <strong className="text-gray-900 font-bold">{invoice.sellerHandedBy}</strong>
              </div>
            )}
            <div className="h-10 flex items-end justify-center sm:justify-end">
              <div className="border-b border-gray-400 min-w-40 px-3 pb-0.5 text-center font-serif italic text-gray-900 font-bold text-xs sm:text-sm">
                {invoice.signatoryName || invoiceSettings?.signatoryName || 'Jay Prakash Chaubey'}
              </div>
            </div>
            <div className="space-y-0">
              <div className="font-extrabold text-gray-900 text-[10.5px]">
                For LAPIEZ
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">
                {invoice.signatoryTitle || 'AUTHORIZED SIGNATORY FOR LAPIEZ'}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* PRINT CSS STYLES INJECTION */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          header, footer, nav, aside, [role="navigation"], .no-print, .print\:hidden, #sq-panel-top, .sq-ext {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
          }
          .invoice-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
