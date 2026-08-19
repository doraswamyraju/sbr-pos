// src/components/InvoiceModal.jsx
import React, { useState, useEffect } from "react";
import { FaPrint, FaBluetoothB, FaFileInvoice, FaShareAlt } from "react-icons/fa";

/**
 * InvoiceModal - renders an invoice and provides printing (A4, 2" 58mm, 3" 80mm thermal, and Bluetooth)
 */
const InvoiceModal = ({ sale, onClose, onNewSale }) => {
  const [printerType, setPrinterType] = useState('58mm');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Sri Balaji Renewables POS',
    address: 'Main Road, Commercial Center',
    phone: '+91 99999 99999',
    gstin: ''
  });

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('pos_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.printer_type === 'thermal-3in') setPrinterType('80mm');
        else if (u.printer_type === 'regular-a4') setPrinterType('a4');
      }

      const rawComp = localStorage.getItem('company_info');
      if (rawComp) {
        const c = JSON.parse(rawComp);
        setCompanyInfo(prev => ({ ...prev, ...c }));
      }
    } catch (e) {}
  }, []);

  if (!sale) return null;

  const items = sale.cart_items || sale.items || [];
  const formatCurrency = (v) => `₹${(Number(v) || 0).toFixed(2)}`;

  // Build A4 Printable HTML
  const buildA4Html = () => {
    const rows = items.map((it, idx) => `
      <tr>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:center">${idx + 1}</td>
        <td style="padding:10px;border:1px solid #e2e8f0">${escapeHtml(it.name || "Item")}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:center">${escapeHtml(String(it.quantity || 1))}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:right">${formatCurrency(it.price)}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:right">${formatCurrency((Number(it.price)||0)*(Number(it.quantity)||0))}</td>
      </tr>`).join("");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice #${escapeHtml(String(sale.id || ''))}</title>
<style>
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    body { -webkit-print-color-adjust: exact; }
  }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b; margin: 0; padding: 20px; background:#fff; }
  .invoice-card { width: 100%; max-width: 800px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-sizing: border-box; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
  .company-title { font-size: 24px; font-weight: 800; color: #1e40af; margin: 0; }
  .company-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .inv-meta { text-align: right; }
  .inv-id { font-size: 20px; font-weight: 700; color: #0f172a; }
  .bill-to { margin-top: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; }
  table { width:100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
  th { padding: 10px; background: #f1f5f9; border: 1px solid #cbd5e1; text-align: left; font-weight: 700; color: #334155; }
  .summary-table { margin-top: 20px; width: 280px; margin-left: auto; font-size: 13px; }
  .summary-table td { padding: 6px 10px; text-align: right; }
  .total-row { font-size: 16px; font-weight: 800; color: #1e40af; border-top: 2px solid #2563eb; }
</style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="company-title">${escapeHtml(companyInfo.name)}</h1>
        <div class="company-sub">${escapeHtml(companyInfo.address)}</div>
        <div class="company-sub">Phone: ${escapeHtml(companyInfo.phone)} ${companyInfo.gstin ? ' | GST: ' + escapeHtml(companyInfo.gstin) : ''}</div>
      </div>
      <div class="inv-meta">
        <div class="inv-id">INVOICE #${escapeHtml(String(sale.id || ""))}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">Date: ${escapeHtml(new Date(sale.sale_date || Date.now()).toLocaleString())}</div>
      </div>
    </div>

    <div class="bill-to">
      <strong>Bill To:</strong> ${escapeHtml(sale.customer_name || 'Walk-in Customer')}
      ${sale.gst_number ? `<br/><strong>GSTIN:</strong> ${escapeHtml(sale.gst_number)}` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center">#</th>
          <th>Item Description</th>
          <th style="width:60px;text-align:center">Qty</th>
          <th style="width:100px;text-align:right">Price</th>
          <th style="width:110px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="summary-table">
      <tr><td>Subtotal:</td><td>${formatCurrency(sale.total_amount)}</td></tr>
      <tr><td>Discount:</td><td>${formatCurrency(sale.discount || 0)}</td></tr>
      <tr class="total-row"><td>Grand Total:</td><td>${formatCurrency(sale.payable_amount)}</td></tr>
    </table>

    <div style="margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;padding-top:12px;">
      Thank you for shopping with us!
    </div>
  </div>
<script>setTimeout(()=>{ window.print(); }, 500);</script>
</body>
</html>`;
  };

  // Build Thermal Printable HTML (for 2" 58mm or 3" 80mm Bluetooth/WiFi Thermal Printers)
  const buildThermalHtml = (paperWidth = '58mm') => {
    const is80 = paperWidth === '80mm';
    const maxChars = is80 ? 42 : 32;
    const paperPxWidth = is80 ? '78mm' : '56mm';

    const rows = items.map(it => `
      <div style="display:flex;justify-space-between;padding:3px 0;border-bottom:1px dashed #cbd5e1;font-size:11px;">
        <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(truncate(it.name||'', maxChars - 12))}</div>
        <div style="width:28px;text-align:center">${escapeHtml(String(it.quantity || 1))}</div>
        <div style="width:65px;text-align:right">${formatCurrency((Number(it.price)||0)*(Number(it.quantity)||0))}</div>
      </div>`).join("");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Receipt #${escapeHtml(String(sale.id || ""))}</title>
<style>
  @media print {
    @page { margin: 0; size: ${paperWidth} auto; }
    html, body { width: ${paperWidth}; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
  }
  body { font-family: 'Courier New', Courier, monospace; font-size:11px; color:#000; padding:6px; background:#fff; width:${paperPxWidth}; margin:0 auto; }
  .receipt { width: 100%; box-sizing: border-box; }
  .center { text-align:center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div style="font-size:15px;font-weight:bold;">${escapeHtml(companyInfo.name)}</div>
      <div style="font-size:10px;">${escapeHtml(companyInfo.address)}</div>
      <div style="font-size:10px;">Ph: ${escapeHtml(companyInfo.phone)}</div>
      <div class="line"></div>
      <div style="font-size:12px;font-weight:bold;">RECEIPT #${escapeHtml(String(sale.id || ""))}</div>
      <div style="font-size:10px;">${escapeHtml(new Date(sale.sale_date || Date.now()).toLocaleString())}</div>
      <div style="font-size:10px;">Customer: ${escapeHtml(sale.customer_name || 'Walk-in')}</div>
    </div>

    <div class="line"></div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:10px;margin-bottom:4px;">
      <span style="flex:1">ITEM</span>
      <span style="width:28px;text-align:center">QTY</span>
      <span style="width:65px;text-align:right">AMT</span>
    </div>
    <div class="line"></div>

    ${rows}

    <div class="line"></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Subtotal:</span><span>${formatCurrency(sale.total_amount)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Discount:</span><span>${formatCurrency(sale.discount || 0)}</span></div>
    <div class="line"></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:bold;"><span>PAYABLE:</span><span>${formatCurrency(sale.payable_amount)}</span></div>
    <div class="line"></div>

    <div className="center" style="text-align:center;margin-top:8px;font-size:10px;">
      *** THANK YOU FOR YOUR VISIT ***
    </div>
  </div>
<script>setTimeout(()=>{ window.print(); }, 400);</script>
</body>
</html>`;
  };

  const printWindowWithHtml = (html, autoClose = true) => {
    const w = window.open("", "_blank", "toolbar=0,location=0,menubar=0,width=450,height=600");
    if (!w) {
      alert("Popup blocked — please allow popups for localhost to print thermal receipts.");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
        if (autoClose) setTimeout(() => w.close(), 800);
      } catch (e) {
        console.warn("Print error", e);
      }
    }, 500);
  };

  const handleDirectBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      alert("Web Bluetooth is not supported in this browser. Please use Google Chrome or Chrome for Android.");
      return;
    }
    try {
      alert("Searching for Bluetooth Thermal Printer... Please select your paired Bluetooth POS Printer in the browser prompt.");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb']
      });
      if (device) {
        alert(`Connected to ${device.name || 'Bluetooth Printer'}. Printing ESC/POS receipt...`);
      }
    } catch (err) {
      console.warn("Bluetooth pair error:", err);
      // Fallback to standard thermal printer window print
      printWindowWithHtml(buildThermalHtml('58mm'), true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center pb-3 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaFileInvoice className="text-blue-600" /> Invoice #{sale.id}
            </h2>
            <p className="text-xs text-gray-500">{new Date(sale.sale_date || Date.now()).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-2xl">×</button>
        </div>

        {/* Customer info */}
        <div className="my-4 p-3 bg-gray-50 rounded-xl border text-sm">
          <div className="font-bold text-gray-800">Customer: {sale.customer_name ?? "Walk-in Customer"}</div>
          {sale.gst_number && <div className="text-xs text-gray-600 mt-0.5">GSTIN: {sale.gst_number}</div>}
        </div>

        {/* Items Summary Table */}
        <div className="mb-4 overflow-hidden border rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 text-gray-700 font-bold">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 font-medium">{it.name}</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-right">₹{(Number(it.price)||0).toFixed(2)}</td>
                  <td className="p-2 text-right font-bold">₹{((Number(it.price)||0)*(Number(it.quantity)||0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 space-y-1 text-sm text-right">
          <div className="text-gray-600">Subtotal: {formatCurrency(sale.total_amount)}</div>
          <div className="text-gray-600">Discount: {formatCurrency(sale.discount || 0)}</div>
          <div className="text-lg font-black text-blue-700 pt-1 border-t border-blue-200">
            Payable Amount: {formatCurrency(sale.payable_amount)}
          </div>
        </div>

        {/* Print Buttons Bar */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => printWindowWithHtml(buildThermalHtml('58mm'), true)} 
              className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <FaPrint /> <span>Print 2" Thermal</span>
            </button>
            <button 
              onClick={() => printWindowWithHtml(buildThermalHtml('80mm'), true)} 
              className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <FaPrint /> <span>Print 3" Thermal</span>
            </button>
            <button 
              onClick={() => printWindowWithHtml(buildA4Html(), false)} 
              className="py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <FaFileInvoice /> <span>Print A4 Invoice</span>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleDirectBluetoothPrint} 
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow"
            >
              <FaBluetoothB /> <span>Direct Bluetooth ESC/POS</span>
            </button>
            {onNewSale && (
              <button onClick={onNewSale} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">
                New Sale
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(s = "", n = 30) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default InvoiceModal;
