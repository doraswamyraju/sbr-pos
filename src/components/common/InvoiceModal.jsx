// src/components/InvoiceModal.jsx
import React from "react";
import axios from "axios";

/**
 * InvoiceModal - renders an invoice and provides printing (A4 and 2" thermal)
 *
 * Props:
 * - sale: object (required) { id, customer_name, gst_number, cart_items[], total_amount, discount, payable_amount, sale_date }
 * - company: object { name, addressLine1, addressLine2, phone, email, gst, logoUrl }
 * - onClose: func
 * - onNewSale: func
 */
const InvoiceModal = ({ sale, onClose, onNewSale, company }) => {
  if (!sale || !company) return null; // Ensure company prop is available

  const items = sale.cart_items || [];

  const formatCurrency = (v) => `₹${(Number(v) || 0).toFixed(2)}`;

  // Build printable HTML for A4
  const buildA4Html = () => {
    const rows = items.map(it => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(it.name || "")}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${escapeHtml(String(it.quantity || 1))}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency(it.price)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${formatCurrency((Number(it.price)||0)*(Number(it.quantity)||0))}</td>
      </tr>`).join("");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice ${escapeHtml(String(sale.id || ''))}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color:#222; margin: 20px; }
  .invoice-box { width: 100%; max-width: 800px; margin: auto; }
  h1 { margin:0 0 10px 0; }
  table { width:100%; border-collapse: collapse; margin-top: 16px; }
  th { padding:8px; background:#f7f7f7; border:1px solid #ddd; text-align:left; }
  td { padding:8px; border:1px solid #ddd; }
  .summary { margin-top: 12px; float:right; width: 300px; }
  .summary table { width:100%; border:0; }
  .summary td { border:0; padding:6px; }
  .center { text-align:center; }
</style>
</head>
<body>
  <div class="invoice-box">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <h1>${escapeHtml(company.name)}</h1>
        <div>${escapeHtml(company.addressLine1)}</div>
        ${company.addressLine2 ? `<div>${escapeHtml(company.addressLine2)}</div>` : ''}
        <div>Phone: ${escapeHtml(company.phone)}</div>
        ${company.email ? `<div>Email: ${escapeHtml(company.email)}</div>` : ''}
        ${company.gst ? `<div>GSTIN: ${escapeHtml(company.gst)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div>Invoice #: <strong>${escapeHtml(String(sale.id || ""))}</strong></div>
        <div>Date: ${escapeHtml(new Date(sale.sale_date || Date.now()).toLocaleString())}</div>
      </div>
    </div>

    <div style="margin-top:16px;">
      <strong>Bill To:</strong>
      <div>${escapeHtml(sale.customer_name || 'Walk-in')}</div>
      ${sale.gst_number ? `<div>GST: ${escapeHtml(sale.gst_number)}</div>` : ""}
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th><th style="width:80px">Qty</th><th style="width:110px;text-align:right">Price</th><th style="width:110px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(sale.total_amount)}</td></tr>
        <tr><td>Discount</td><td style="text-align:right">${formatCurrency(sale.discount || 0)}</td></tr>
        <tr><td><strong>Payable</strong></td><td style="text-align:right"><strong>${formatCurrency(sale.payable_amount)}</strong></td></tr>
      </table>
    </div>

    <div style="clear:both; margin-top:60px; text-align:center; color:#888; font-size:12px;">
      Thank you for your purchase!
    </div>
  </div>

<script>
  // auto print? leave to user after popup opens
</script>
</body>
</html>`;
  };

  // Build printable HTML for thermal 2" printer (narrow)
  const buildThermalHtml = () => {
    const rows = items.map(it => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ddd">
        <div style="flex:1">${escapeHtml(truncate(it.name||'', 30))}</div>
        <div style="width:40px;text-align:center">${escapeHtml(String(it.quantity || 1))}</div>
        <div style="width:70px;text-align:right">${formatCurrency((Number(it.price)||0)*(Number(it.quantity)||0))}</div>
      </div>`).join("");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Receipt ${escapeHtml(String(sale.id || ""))}</title>
<style>
  @media print {
    @page { margin: 4mm; size: 72mm 297mm; } /* 72mm ~ 2.8in typical thermal */
    body { margin:0; padding:0; }
  }
  body { font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#000; padding:6px; background:#fff; }
  .receipt { width: 100%; max-width: 300px; }
  .center { text-align:center; }
  .small { font-size:11px; color:#444; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <h2 style="margin:4px 0">${escapeHtml(company.name)}</h2>
      <div class="small">${escapeHtml(company.addressLine1)}</div>
      ${company.addressLine2 ? `<div class="small">${escapeHtml(company.addressLine2)}</div>` : ''}
      <div class="small">Phone: ${escapeHtml(company.phone)}</div>
      ${company.email ? `<div class="small">${escapeHtml(company.email)}</div>` : ''}
      ${company.gst ? `<div class="small">GSTIN: ${escapeHtml(company.gst)}</div>` : ''}
      <div style="margin-top:6px">Invoice #: <strong>${escapeHtml(String(sale.id || ""))}</strong></div>
      <div class="small">${escapeHtml(new Date(sale.sale_date || Date.now()).toLocaleString())}</div>
    </div>

    <div style="margin-top:8px">${rows}</div>

    <div style="margin-top:8px;border-top:1px solid #000;padding-top:6px">
      <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>${formatCurrency(sale.total_amount)}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Discount</div><div>${formatCurrency(sale.discount || 0)}</div></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:4px"><div>Payable</div><div>${formatCurrency(sale.payable_amount)}</div></div>
    </div>

    <div style="margin-top:12px" class="center small">Thank you!</div>
  </div>

<script>
  setTimeout(()=>{ window.print(); }, 500);
</script>
</body>
</html>`;
  };

  const printWindowWithHtml = (html, autoClose = true) => {
    const w = window.open("", "_blank", "toolbar=0,location=0,menubar=0");
    if (!w) {
      alert("Popup blocked — allow popups to print receipts.");
      return;
    }
    w.document.write(html);
    w.document.close();
    // Some printers need time to render
    setTimeout(() => {
      try {
        w.focus();
        w.print();
        if (autoClose) setTimeout(() => w.close(), 1000);
      } catch (e) {
        console.warn("Print error", e);
      }
    }, 600);
  };

  const handlePrintA4 = () => {
    const html = buildA4Html();
    printWindowWithHtml(html, false); // leave window open for user to inspect/print
  };

  const handlePrintThermal = () => {
    const html = buildThermalHtml();
    printWindowWithHtml(html, true); // auto print and close
  };

  const handleShare = () => {
    // Minimal share: download HTML snapshot. You can extend to pdf via jsPDF or server-side.
    const a = document.createElement("a");
    const blob = new Blob([buildA4Html()], { type: "text/html" });
    a.href = URL.createObjectURL(blob);
    a.download = `invoice_${sale.id || Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invoice #{sale.id}</h2>
          <button onClick={onClose} className="text-gray-500">×</button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Customer</h3>
          <p>{sale.customer_name ?? "Walk-in Customer"}</p>
          {sale.gst_number && <p>GST: {sale.gst_number}</p>}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Items</h3>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border text-center">{it.quantity}</td>
                  <td className="p-2 border">₹{(Number(it.price)||0).toFixed(2)}</td>
                  <td className="p-2 border">₹{((Number(it.price)||0)*(Number(it.quantity)||0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4 text-right">
          <p>Subtotal: {formatCurrency(sale.total_amount)}</p>
          <p>Discount: {formatCurrency(sale.discount || 0)}</p>
          <p className="font-bold">Payable: {formatCurrency(sale.payable_amount)}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrintA4} className="flex-1 py-2 bg-blue-600 text-white rounded">Print A4</button>
          <button onClick={handlePrintThermal} className="flex-1 py-2 bg-indigo-600 text-white rounded">Print 2"</button>
          <button onClick={handleShare} className="flex-1 py-2 bg-teal-600 text-white rounded">Share</button>
          <button onClick={onNewSale} className="flex-1 py-2 border rounded">New Sale</button>
        </div>
      </div>
    </div>
  );
};

// small helpers
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