import { API_BASE_URL } from '../config';
// src/components/BarcodeModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { FaPrint } from 'react-icons/fa';
import Barcode from 'react-barcode';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const ALLOWED_PRINTERS = ['auto', 'thermal-3in', 'regular-a4'];

/**
 * BarcodeModal
 * Props:
 * - barcodes: []            // for print view
 * - onClose: func
 * - onScanSuccess: func     // called with scanned code
 * - mode: 'scan'|'print'    // choose initial view. default -> 'scan' (camera)
 */
const BarcodeModal = ({ barcodes = [], onClose, onScanSuccess, mode = 'scan' }) => {
  const [scanResult, setScanResult] = useState('');
  const [printerType, setPrinterType] = useState('auto');
  const scannerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pos_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.printer_type && ALLOWED_PRINTERS.includes(u.printer_type)) {
          setPrinterType(u.printer_type);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const escapeHtml = (unsafe = '') =>
    String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const buildPrintWindowAndPrint = (htmlContent, selectedPrinter) => {
    const a4RowHeightPx = 180;
    const a4CSS = `
      @page { size: A4 portrait; margin: 10mm; }
      html, body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      .labels-root {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: ${a4RowHeightPx}px;
        grid-gap: 10mm;
        box-sizing: border-box;
      }
      .print-item { height: ${a4RowHeightPx}px; box-sizing: border-box; padding: 10px; border: 1px solid #f0f0f0; display:block; page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
      .print-item .inner { height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; }
      .print-item .name { font-size: 12px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .print-item .barcode-wrap { width:100%; display:flex; justifyContent:center; alignItems:center; overflow:hidden; }
      .print-item .sku { font-size: 10px; margin-top:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      svg { max-width:100%; height:auto; display:block; }
    `;
    const thermalCSS = `
      @page { size: 3in 11in; margin: 0; }
      html, body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      .labels-root { display:flex; flex-wrap:wrap; align-items:flex-start; padding:0; margin:0; box-sizing:border-box; }
      .print-item { width: 3in; height: 2in; box-sizing: border-box; padding: 6px; display: inline-block; vertical-align: top; page-break-inside: avoid; break-inside: avoid; margin: 0; overflow: hidden; }
      .print-item .inner { height:100%; display:flex; flex-direction:column; justifyContent:center; alignItems:center; text-align:center; }
      .print-item .name { font-size: 12px; margin-bottom:6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width:100%; }
      .print-item .barcode-wrap { width:100%; display:flex; justifyContent:center; alignItems:center; overflow:hidden; }
      .print-item .sku { font-size:10px; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; }
      svg { max-width:100%; height:auto; display:block; }
    `;
    const selectedCSS = printerType === 'thermal-3in' ? thermalCSS : a4CSS;

    const printWindow = window.open('', '_blank', 'toolbar=0,location=0,menubar=0');
    if (!printWindow) {
      alert('Popup blocked — allow popups for this site to print.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print Barcodes</title>
          <style>${selectedCSS}</style>
        </head>
        <body>
          <div class="labels-root">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 700);
  };

  const handlePrint = () => {
    const onScreenContainer = document.getElementById('barcode-labels-modal');
    let finalHtml = '';
    if (onScreenContainer && onScreenContainer.children.length > 0) {
      try {
        finalHtml = Array.from(onScreenContainer.children).map(c => c.outerHTML).join('\n');
      } catch (e) {
        finalHtml = '';
      }
    }
    if (!finalHtml) {
      finalHtml = barcodes.map((item, idx) => {
        const name = escapeHtml(item.name || '');
        const sku = escapeHtml(item.sku || (`Product ${item.id ?? (idx + 1)}`));
        return `
          <div class="print-item">
            <div class="inner">
              <div class="name">${name}</div>
              <div class="barcode-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="240" height="40"><text x="0" y="24" style="font-size:12px">${sku}</text></svg>
              </div>
              <div class="sku">${sku}</div>
            </div>
          </div>
        `;
      }).join('\n');
    }
    const selectedPrinter = printerType === 'auto' ? 'regular-a4' : printerType;
    buildPrintWindowAndPrint(finalHtml, selectedPrinter);
  };

  const handleScan = async (result, error) => {
    if (result) {
      const txt = result?.text ?? (typeof result === 'string' ? result : '');
      setScanResult(txt);
      if (onScanSuccess) onScanSuccess(txt);
      
      try {
        const res = await axios.get(`${API_BASE_URL}/server/api/barcode_lookup.php?sku=${encodeURIComponent(txt)}`);
        const product = res.data?.product ?? res.data?.data ?? res.data;
        if (product) {
          onScanSuccess(product);
        }
      } catch (err) {
        console.error("Barcode lookup failed", err);
      }
    }
    if (error) {
      // ignore minor camera errors
    }
  };

  const handleManualScan = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val && onScanSuccess) onScanSuccess(val);
      if (onClose) onClose();
    }
  };

  const renderPrintView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Print Barcodes</h2>
        <div className="flex items-center space-x-3">
          <label className="mr-2 text-sm">Printer:</label>
          <select value={printerType} onChange={(e) => setPrinterType(e.target.value)} className="p-1 border rounded">
            <option value="auto">Auto (Default - A4)</option>
            <option value="thermal-3in">3" Thermal (3×2 in)</option>
            <option value="regular-a4">Regular (A4 - 3/row)</option>
          </select>
        </div>
      </div>

      <div id="barcode-labels-modal" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 overflow-y-auto max-h-96 p-1">
        {barcodes.map((item, idx) => {
          const name = item.name || '';
          const sku = item.sku || (`Product ${item.id ?? (idx + 1)}`);
          return (
            <div key={idx} className="label-card" style={{ minHeight: 140, padding: 10, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #eee', borderRadius: 6, background: '#fff' }}>
              <div style={{ width: '100%', fontSize: 14, fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={name}>
                {name}
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', paddingTop: 4, paddingBottom: 4 }}>
                <div style={{ maxWidth: '100%', width: 220, display: 'block' }}>
                  <Barcode value={sku} height={48} width={1.2} fontSize={12} margin={0} />
                </div>
              </div>
              <div style={{ width: '100%', fontSize: 12, color: '#444', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sku}>
                {sku}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handlePrint} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">
          <FaPrint className="mr-2" /> Print Barcodes
        </button>
      </div>

      <style>{`
        #barcode-labels-modal svg { display:block; max-width:100%; height:auto; }
        .label-card { page-break-inside: avoid; break-inside: avoid; }
      `}</style>
    </div>
  );

  const renderScanView = () => (
    <div className="w-full h-full flex flex-col items-center justify-start">
      <div className="p-4 w-full">
        <h2 className="text-2xl font-bold mb-2">Scan Barcode</h2>
        <p className="text-gray-600 mb-4">Use your camera (allow permission) to scan a barcode. The result will be added automatically.</p>
      </div>

      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }} className="p-2">
        <div style={{ width: '100%', height: '60vh', background: '#000', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrReader onResult={handleScan} scanDelay={300} style={{ width: '100%', height: '100%' }} videoId="video-element-for-qr-reader" />
        </div>
      </div>

      <div className="w-full max-w-2xl p-4">
        <div className="mb-3">
          <label htmlFor="manual-barcode-input" className="block text-gray-700">Or enter manually</label>
          <input type="text" id="manual-barcode-input" placeholder="Scan or enter barcode here and press Enter" onKeyDown={handleManualScan} className="w-full p-2 border rounded-lg mt-2" ref={scannerRef} />
        </div>

        {scanResult && <div className="mt-2 text-green-600 font-semibold">Scanned: {scanResult}</div>}
      </div>
    </div>
  );

  const content = mode === 'print' ? renderPrintView() : renderScanView();

  return <Modal onClose={onClose} fullScreen={true}>{content}</Modal>;
};

export default BarcodeModal;