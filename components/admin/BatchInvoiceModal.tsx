'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Printer,
  Download,
  Search,
  Filter,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Share2,
  Layers,
  Table as TableIcon,
  Tag,
  Store,
  CreditCard,
  Hash
} from 'lucide-react';
import {
  Invoice,
  InvoiceSettings,
  DEFAULT_INVOICE_SETTINGS,
  buildInvoiceFromOrder
} from '../../lib/invoiceUtils';

interface BatchInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  invoices: Invoice[];
  invoiceSettings?: InvoiceSettings;
}

export const BatchInvoiceModal: React.FC<BatchInvoiceModalProps> = ({
  isOpen,
  onClose,
  orders,
  invoices,
  invoiceSettings = DEFAULT_INVOICE_SETTINGS,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'printable' | 'table'>('printable');

  // Consolidate all invoices: Built from orders + direct manual invoices
  const allInvoices = useMemo(() => {
    const list: Invoice[] = [];
    const seenInvoiceNumbers = new Set<string>();

    // 1. Process orders
    for (const ord of orders) {
      try {
        const inv = buildInvoiceFromOrder({ order: ord, settings: invoiceSettings });
        if (inv && inv.invoiceNumber && !seenInvoiceNumbers.has(inv.invoiceNumber)) {
          seenInvoiceNumbers.add(inv.invoiceNumber);
          list.push(inv);
        }
      } catch (err) {
        console.warn('Failed to build invoice for order', ord.orderId, err);
      }
    }

    // 2. Process manual invoices
    for (const inv of invoices) {
      if (inv && inv.invoiceNumber && !seenInvoiceNumbers.has(inv.invoiceNumber)) {
        seenInvoiceNumbers.add(inv.invoiceNumber);
        list.push(inv);
      }
    }

    // Sort newest first
    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [orders, invoices, invoiceSettings]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return allInvoices.filter((inv) => {
      // Status filter
      if (statusFilter === 'approved' && !inv.isApproved && inv.paymentStatus !== 'Paid') {
        return false;
      }
      if (statusFilter === 'pending' && (inv.isApproved || inv.paymentStatus === 'Paid')) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const rawDate = inv.createdAt || inv.date || '';
        const invDate = new Date(rawDate);
        if (dateFilter === 'today') {
          if (!rawDate.includes(todayStr) && !inv.date.includes(now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))) {
            return false;
          }
        } else if (dateFilter === '7days') {
          const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === 'month') {
          const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 31) return false;
        }
      }

      // Search query
      if (q) {
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchOrder = inv.orderId ? inv.orderId.toLowerCase().includes(q) : false;
        const matchBuyer = inv.buyerName.toLowerCase().includes(q);
        const matchPhone = inv.buyerPhone.toLowerCase().includes(q);
        const matchItems = inv.items.some(
          (it) =>
            it.productName.toLowerCase().includes(q) ||
            (it.serialNumber && it.serialNumber.toLowerCase().includes(q)) ||
            (it.sku && it.sku.toLowerCase().includes(q))
        );
        return matchNumber || matchOrder || matchBuyer || matchPhone || matchItems;
      }

      return true;
    });
  }, [allInvoices, search, statusFilter, dateFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalGrand = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalItemsCount = 0;
    let paidCount = 0;

    for (const inv of filteredInvoices) {
      totalGrand += Number(inv.grandTotal) || 0;
      totalTaxable += Number(inv.taxableAmount) || 0;
      totalTax += Number(inv.totalTax) || 0;
      totalItemsCount += inv.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      if (inv.isApproved || inv.paymentStatus === 'Paid') {
        paidCount++;
      }
    }

    return {
      totalGrand,
      totalTaxable,
      totalTax,
      totalItemsCount,
      paidCount,
      totalCount: filteredInvoices.length,
    };
  }, [filteredInvoices]);

  // Print all invoices currently filtered
  const handlePrintAll = () => {
    window.print();
  };

  // Download complete Excel / CSV Ledger
  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) return;

    const headers = [
      'Invoice No',
      'Order Ref',
      'Date',
      'Time',
      'Customer Name',
      'Phone Number',
      'Delivery Address',
      'Buyer GSTIN',
      'Ordered Items (Name x Qty)',
      'Serial Numbers (S/N)',
      'Taxable Value (INR)',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'IGST (INR)',
      'Total Tax (INR)',
      'Delivery Charge (INR)',
      'Grand Total (INR)',
      'Payment Method',
      'Payment Status',
      'Staff / Handed By',
      'Approved By',
    ];

    const rows = filteredInvoices.map((inv) => {
      const itemsSummary = inv.items.map((it) => `${it.productName} (x${it.quantity})`).join('; ');
      const serialsSummary = inv.items
        .map((it) => (it.serialNumber ? `${it.productName}: ${it.serialNumber}` : ''))
        .filter(Boolean)
        .join('; ');

      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.orderId || ''}"`,
        `"${inv.date}"`,
        `"${inv.time || ''}"`,
        `"${(inv.buyerName || '').replace(/"/g, '""')}"`,
        `"${inv.buyerPhone || ''}"`,
        `"${(inv.buyerAddress || '').replace(/"/g, '""')}"`,
        `"${inv.buyerGstin || ''}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${serialsSummary.replace(/"/g, '""')}"`,
        inv.taxableAmount || 0,
        inv.cgstTotal || 0,
        inv.sgstTotal || 0,
        inv.igstTotal || 0,
        inv.totalTax || 0,
        inv.shipping || 0,
        inv.grandTotal || 0,
        `"${inv.paymentMethod || ''}"`,
        `"${inv.paymentStatus || ''}"`,
        `"${(inv.sellerHandedBy || '').replace(/"/g, '""')}"`,
        `"${(inv.approvedBy || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lapiez_Master_Billing_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      
      {/* 1. Modal Top Bar (Hidden during Print) */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A56DB] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Batch Customer Bills & Invoices Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#1A56DB]">
                {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Bill' : 'Bills'}
              </span>
            </div>
            <p className="text-[11.5px] text-gray-500 font-medium">
              View, bulk print (multi-page A4 PDF), and export all customer GST invoices with serial numbers.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintAll}
            className="px-4 py-2 rounded-xl bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Print all customer bills or save as a single multi-page PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Bills (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Download complete ledger spreadsheet (CSV / Excel)"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Ledger</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Subheader Metrics & Filter Controls (Hidden during Print) */}
      <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 print:hidden">
        
        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Turnover</span>
            <strong className="text-gray-900 font-mono font-black text-sm">₹{metrics.totalGrand.toLocaleString('en-IN')}</strong>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">GST Collected</span>
            <strong className="text-emerald-700 font-mono font-black text-sm">₹{metrics.totalTax.toLocaleString('en-IN')}</strong>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Units Billed</span>
            <strong className="text-blue-900 font-mono font-black text-sm">{metrics.totalItemsCount} PCS</strong>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Settled / Paid</span>
            <strong className="text-emerald-800 font-bold text-sm">{metrics.paidCount} / {metrics.totalCount}</strong>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, S/N..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 bg-white border border-gray-300 rounded-lg pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1A56DB]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8.5 bg-white border border-gray-300 rounded-lg px-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1A56DB] cursor-pointer"
          >
            <option value="all">All Orders</option>
            <option value="approved">Approved & Paid Only</option>
            <option value="pending">Awaiting Approval</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="h-8.5 bg-white border border-gray-300 rounded-lg px-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1A56DB] cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today's Bills</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-200/80 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('printable')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'printable' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>A4 Bills</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Ledger Table</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Main Invoices Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-md mx-auto my-12 space-y-3">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Invoices Match Current Filters</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your search query, status filter, or date range to see customer bills.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ========================================================= */
          /* VIEW MODE 1: MASTER LEDGER TABLE                          */
          /* ========================================================= */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden max-w-7xl mx-auto print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10.5px] border-b border-gray-200">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">INVOICE NO & REF</th>
                    <th className="py-3 px-3">DATE & TIME</th>
                    <th className="py-3 px-3">CUSTOMER & PHONE</th>
                    <th className="py-3 px-3">ITEMS & SERIAL NUMBERS</th>
                    <th className="py-3 px-3 text-right">TAXABLE (₹)</th>
                    <th className="py-3 px-3 text-right">GST (₹)</th>
                    <th className="py-3 px-3 text-right">TOTAL (₹)</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1A56DB] whitespace-nowrap">
                        <div>{inv.invoiceNumber}</div>
                        {inv.orderId && (
                          <div className="text-[10px] text-gray-400 font-sans">
                            Order #{inv.orderId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        <div>{inv.date}</div>
                        <div className="text-[10.5px] text-gray-400 font-mono">{inv.time}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{inv.buyerName}</div>
                        <div className="text-gray-500 font-mono text-[11px]">{inv.buyerPhone}</div>
                      </td>
                      <td className="py-3 px-3 min-w-[240px]">
                        <div className="space-y-1">
                          {inv.items.map((it, itIdx) => (
                            <div key={itIdx} className="text-[11.5px] text-gray-800 leading-tight">
                              <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-gray-500 font-bold">x{it.quantity}</span>
                              {it.serialNumber && (
                                <span className="block text-[10px] font-mono text-[#1A56DB] font-bold">
                                  S/N: {it.serialNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-700">
                        ₹{inv.taxableAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        ₹{inv.totalTax.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-gray-900 text-sm">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${
                            inv.isApproved || inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.isApproved || inv.paymentStatus === 'Paid' ? 'PAID / SETTLED' : 'APPROVAL PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded bg-[#1A56DB] hover:bg-[#1E40AF] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Open Single Fullscreen Bill"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW MODE 2: PRINTABLE A4 CARDS (Exact CBIC Rule 46)      */
          /* ========================================================= */
          <div className="space-y-8 max-w-4xl mx-auto print:space-y-0 print:max-w-none">
            {filteredInvoices.map((invoice, idx) => (
              <div
                key={invoice.id || idx}
                className="batch-invoice-sheet bg-white border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-md print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none relative"
              >
                {/* Single Invoice Card Action Header (Hidden during Print) */}
                <div className="pb-4 mb-4 border-b border-gray-200 flex items-center justify-between gap-2 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1A56DB] font-extrabold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <strong className="text-gray-900 font-mono text-sm">
                      {invoice.invoiceNumber}
                    </strong>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-600 font-semibold">{invoice.buyerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/invoice/${encodeURIComponent(invoice.invoiceNumber)}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Tab</span>
                    </Link>
                  </div>
                </div>

                {/* INVOICE HEADER: SELLER & INVOICE META */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 pb-3 border-b-2 border-gray-900">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#1A56DB] text-white flex items-center justify-center font-black text-lg print:text-black print:bg-transparent">
                        L
                      </div>
                      <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
                          {invoiceSettings.businessName || 'LAPIEZ'}
                        </h1>
                        <p className="text-[10.5px] font-semibold text-gray-600">
                          {invoiceSettings.tagline || 'Technology • Security • Complete Hardware Solutions'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed pt-1">
                      {invoice.sellerAddress}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-700">
                      <span><strong>Phone:</strong> {invoice.sellerPhone}</span>
                      <span><strong>Email:</strong> {invoice.sellerEmail}</span>
                    </div>

                    {invoiceSettings.showGstin && (
                      <div className="flex flex-wrap items-center gap-x-3 text-xs font-bold text-gray-900 pt-0.5">
                        <span>GSTIN: {invoice.sellerGstin}</span>
                        <span>PAN: {invoice.sellerPan}</span>
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right space-y-1 min-w-[200px]">
                    <div className="inline-block px-3 py-1 bg-white border border-gray-700 text-gray-900 font-extrabold text-xs tracking-wider uppercase rounded print:border print:border-black">
                      TAX INVOICE
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                      ORIGINAL FOR RECIPIENT
                    </div>

                    <div className="text-xs space-y-0.5 pt-0.5">
                      <div>
                        <span className="text-gray-500">Invoice No: </span>
                        <strong className="text-[#1A56DB] print:text-black font-mono font-bold text-sm">
                          {invoice.invoiceNumber}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Date: </span>
                        <strong className="text-gray-900">{invoice.date}</strong>
                      </div>
                      {invoice.time && (
                        <div>
                          <span className="text-gray-500">Time: </span>
                          <strong className="text-gray-900 font-mono text-[11px]">{invoice.time}</strong>
                        </div>
                      )}
                      {invoice.orderId && (
                        <div>
                          <span className="text-gray-500">Order Ref: </span>
                          <strong className="text-[#1A56DB] print:text-black font-mono">#{invoice.orderId}</strong>
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

                {/* BUYER & CONSIGNEE DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-1">
                    <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[10px] block">
                      BILLED TO (BUYER DETAILS)
                    </span>
                    <div className="text-sm font-bold text-gray-900">{invoice.buyerName}</div>
                    <div className="text-gray-700">Phone: <strong>{invoice.buyerPhone}</strong></div>
                    {invoice.buyerEmail && <div className="text-gray-700 truncate">Email: {invoice.buyerEmail}</div>}
                    <div className="text-gray-700 leading-snug">Address: {invoice.buyerAddress}</div>
                    <div className="text-gray-700">
                      State: <strong>{invoice.buyerState} (Code: {invoice.buyerStateCode})</strong>
                    </div>
                    {invoice.buyerGstin && (
                      <div className="text-xs font-bold text-blue-800 pt-0.5">
                        Buyer GSTIN: {invoice.buyerGstin}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-1">
                    <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[10px] block">
                      SHIPPED TO & PAYMENT SETTLEMENT
                    </span>
                    <div className="text-sm font-bold text-gray-900">{invoice.buyerName}</div>
                    <div className="text-gray-700 leading-snug text-xs">
                      {invoice.isPickupOrder ? (
                        <span className="font-bold text-purple-900">
                          Showroom Counter Pickup (Garhwa Showroom)
                        </span>
                      ) : (
                        <>Delivery Destination: {invoice.buyerAddress}</>
                      )}
                    </div>
                    <div className="pt-1 space-y-1 text-xs">
                      <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded border border-gray-200">
                        <span className="text-gray-600 font-semibold">Payment Mode:</span>
                        <strong className="text-gray-900 font-bold">{invoice.paymentMethod}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Status:</span>
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded text-[10px] ${
                            invoice.isApproved || invoice.paymentStatus === 'Paid'
                              ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                              : 'text-amber-800 bg-amber-50 border border-amber-200'
                          }`}
                        >
                          {invoice.isApproved || invoice.paymentStatus === 'Paid' ? '✓ PAID / SETTLED' : 'APPROVAL PENDING'}
                        </span>
                      </div>
                      {invoice.sellerHandedBy && (
                        <div className="flex justify-between items-center bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200 text-[10.5px]">
                          <span className="text-amber-900 font-bold">Sold & Handed By:</span>
                          <strong className="text-gray-900">{invoice.sellerHandedBy}</strong>
                        </div>
                      )}
                      {invoice.approvedBy && (
                        <div className="flex justify-between items-center bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200 text-[10.5px]">
                          <span className="text-blue-900 font-bold">Approved By:</span>
                          <strong className="text-blue-950 font-bold">{invoice.approvedBy}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CBIC RULE 46 ITEMS TABLE WITH SERIAL NUMBERS */}
                <div className="mb-4 overflow-x-auto">
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
                      {invoice.items.map((item, itIdx) => (
                        <tr key={item.id || itIdx} className="hover:bg-gray-50/50 print:hover:bg-transparent">
                          <td className="py-2 px-2 text-center text-gray-500">{itIdx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-gray-900 leading-snug">
                              {item.productName}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              {item.sku && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  SKU: {item.sku}
                                </span>
                              )}
                              {item.serialNumber && (
                                <span className="text-[10px] text-[#1A56DB] print:text-black font-mono font-bold bg-blue-50 print:bg-transparent px-1.5 py-0.2 rounded print:px-0">
                                  S/N: {item.serialNumber}
                                </span>
                              )}
                            </div>
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

                {/* TAX TOTALS, AMOUNT IN WORDS & SETTLEMENT */}
                <div className="pt-2 pb-3 border-t border-gray-300">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    
                    <div className="sm:col-span-7 space-y-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                          INVOICE AMOUNT IN WORDS:
                        </span>
                        <div className="text-xs font-extrabold text-gray-900 bg-white p-2 rounded border border-gray-300 italic">
                          {invoice.amountInWords}
                        </div>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-2.5 bg-white flex items-center gap-3">
                        {invoiceSettings.showUpiQr && invoice.upiQrData && (
                          <div className="shrink-0 text-center">
                            <img
                              src={invoice.upiQrData}
                              alt="UPI QR"
                              className="w-16 h-16 rounded border border-gray-300 bg-white p-1 mx-auto"
                            />
                            <span className="text-[8px] font-extrabold text-gray-700 block mt-0.5 uppercase tracking-wider">
                              SCAN TO PAY ₹{invoice.grandTotal}
                            </span>
                          </div>
                        )}
                        <div className="text-[10.5px] space-y-0.5 text-gray-700 min-w-0">
                          <div className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 pb-0.5">
                            <Building2 className="w-3.5 h-3.5 text-[#1A56DB]" />
                            <span>Bank & UPI Settlement Details</span>
                          </div>
                          <div><strong>A/C Name:</strong> {invoiceSettings.accountHolderName || 'lappy solutions'}</div>
                          <div><strong>Bank:</strong> {invoiceSettings.bankName || 'Union Bank of India, GARHWA'}</div>
                          <div><strong>A/C No:</strong> <span className="font-mono font-bold text-gray-900">{invoiceSettings.accountNumber || '638301010050261'}</span></div>
                          <div><strong>IFSC Code:</strong> <span className="font-mono font-bold text-gray-900">{invoiceSettings.ifscCode || 'UBIN0563838'}</span></div>
                          {invoice.upiId && <div><strong>UPI VPA:</strong> <span className="font-mono text-blue-700 font-bold">{invoice.upiId}</span></div>}
                        </div>
                      </div>
                    </div>

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
                        <span className={invoice.shipping > 0 ? "font-mono font-bold text-gray-900" : "font-semibold text-emerald-700"}>
                          {invoice.shipping > 0 ? `₹${invoice.shipping.toLocaleString('en-IN')}` : 'FREE'}
                        </span>
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

                {/* TERMS & SIGNATURE FOOTER */}
                <div className="pt-2 border-t border-gray-300 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-[10px]">
                  <div className="sm:col-span-8 space-y-1 text-gray-600">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 block">
                      TERMS & CONDITIONS:
                    </span>
                    <ol className="list-decimal pl-3 space-y-0.5 text-[9.5px] leading-tight text-gray-600">
                      {(invoice.terms || invoiceSettings.termsAndConditions).slice(0, 3).map((t, tIdx) => (
                        <li key={tIdx}>{t}</li>
                      ))}
                    </ol>
                    <p className="text-[9px] text-gray-400 italic pt-0.5">
                      This is a computer generated legal tax invoice under Rule 46 of CGST Rules 2017.
                    </p>
                  </div>

                  <div className="sm:col-span-4 text-center sm:text-right space-y-0.5 pt-2 sm:pt-0">
                    {invoice.sellerHandedBy && (
                      <div className="text-[9.5px] text-gray-600 pb-0.5">
                        Sold / Handed By: <strong className="text-gray-900 font-bold">{invoice.sellerHandedBy}</strong>
                      </div>
                    )}
                    <div className="h-8 flex items-end justify-center sm:justify-end">
                      <div className="border-b border-gray-400 min-w-36 px-2 pb-0.5 text-center font-serif italic text-gray-900 font-bold text-xs">
                        {invoice.signatoryName || invoiceSettings.signatoryName || ''}
                      </div>
                    </div>
                    <div className="font-extrabold text-gray-900 text-[10px]">
                      For LAPIEZ
                    </div>
                    <div className="text-[8.5px] text-gray-500 uppercase tracking-wider">
                      {invoice.signatoryTitle || 'AUTHORIZED SIGNATORY FOR LAPIEZ'}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRINT STYLES FOR BATCH PRINTING: Multi-page A4 PDF output */}
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
          header, nav, aside, .no-print, .print\\:hidden, #sq-panel-top, .sq-ext {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
          }
          .batch-invoice-sheet {
            page-break-after: always !important;
            break-after: page !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 6mm 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .batch-invoice-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

    </div>
  );
};
export default BatchInvoiceModal;
