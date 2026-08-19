import { API_BASE_URL } from '../config';
// src/components/ExcelImport.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ExcelImport = ({
  type = 'products', // 'products' or 'leads'
  endpoint = null,
  title = null,
  requiredColumns = null,
  onImportComplete = null,
}) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const isProducts = type === 'products';

  const defaultEndpoint = isProducts ? '/bulk_import.php' : '/bulk_import_leads.php';
  const defaultTitle = isProducts ? 'Import Products (Excel / CSV)' : 'Import Leads (Excel / CSV)';
  
  const targetEndpointPath = endpoint || defaultEndpoint;
  const modalTitle = title || defaultTitle;

  const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.replace(/\/$/, '')) 
                    || API_BASE_URL + "/server/api";
  const TARGET_JSON_ENDPOINT = `${API_BASE}${targetEndpointPath.startsWith('/') ? '' : '/'}${targetEndpointPath}`;

  const normalize = (s) => (s === undefined || s === null ? '' : String(s).trim());

  const checkMissingRequired = (rawHeaders) => {
    if (isProducts) {
      const productKeywords = ['product name', 'name', 'item name', 'item id', 'sku', 'product', 'item'];
      const canonicalHeaders = rawHeaders.map(h => normalize(h).toLowerCase());
      const hasProductCol = canonicalHeaders.some(h => 
        productKeywords.some(kw => h === kw || h.includes('product') || h.includes('name') || h.includes('sku') || h.includes('item'))
      );
      if (!hasProductCol) {
        return ['Product Name or Item ID / SKU'];
      }
      return [];
    } else {
      const reqs = requiredColumns || ['Date', 'Name'];
      const lookup = rawHeaders.map(h => normalize(h).toLowerCase());
      const missing = [];
      reqs.forEach((req) => {
        const reqNorm = req.toLowerCase();
        const found = lookup.some((k) => k === reqNorm || k === reqNorm.replace(/\s+/g, '_'));
        if (!found) missing.push(req);
      });
      return missing;
    }
  };

  const mapRowToServer = (rowObj) => {
    const get = (candidates) => {
      for (const k of candidates) {
        const nk = k.toLowerCase().trim();
        if (rowObj.hasOwnProperty(nk)) return rowObj[nk];
        const kUnd = nk.replace(/\s+/g, '_');
        if (rowObj.hasOwnProperty(kUnd)) return rowObj[kUnd];
      }
      return '';
    };

    if (isProducts) {
      const name = get(['product name', 'name', 'item name', 'product_name', 'item_name', 'product', 'title']);
      const sku = get(['item id', 'sku', 'code', 'barcode', 'item_id', 'product code', 'item code', 'id']);
      const category = get(['category', 'cat', 'group', 'product category', 'category name']);
      const unit = get(['unit', 'uom', 'measurement', 'unit of measure']);

      const stock_raw = get(['current stock', 'opening stock', 'stock', 'stock level', 'quantity', 'qty', 'stock_level', 'opening_stock', 'current_stock']);
      const stock_level = stock_raw !== '' && !isNaN(parseFloat(stock_raw)) ? parseFloat(stock_raw) : 0;

      const price_raw = get(['price', 'selling price', 'unit price', 'rate', 'price (inr)', 'selling_price', 'mrp', 'cost price', 'cost']);
      const price = price_raw !== '' && !isNaN(parseFloat(price_raw)) ? parseFloat(price_raw) : 0;

      const reorder_raw = get(['reorder level', 'reorder_level', 'min stock', 'alert level']);
      const reorder_level = reorder_raw !== '' && !isNaN(parseFloat(reorder_raw)) ? parseFloat(reorder_raw) : 0;

      const description = get(['description', 'desc', 'notes', 'details']);

      const cleanSku = String(sku || '').trim();
      return {
        name: String(name || cleanSku || 'Unnamed Product').trim(),
        sku: cleanSku === '-' ? '' : cleanSku,
        category: String(category || 'General').trim(),
        unit: String(unit || 'pcs').trim(),
        price: price,
        stock_level: stock_level,
        reorder_level: reorder_level,
        description: String(description || '').trim()
      };
    } else {
      const mapped = {
        date: get(['date', 'Date', 'created_at']),
        full_name: get(['full_name', 'Full Name', 'Name', 'name']),
        phone_number: get(['phone_number', 'phone', 'Phone', 'contact', 'contact_info', 'mobile']),
        email: get(['email', 'Email']),
        source: get(['source', 'Source']),
        assigned_to_user_id: get(['assigned_to_user_id', 'Assigned To', 'assigned_to', 'assigned']),
        address: get(['address', 'Address']),
        notes: get(['notes', 'Notes', 'note']),
        status: get(['status', 'Status']),
      };

      Object.keys(mapped).forEach(k => {
        if (mapped[k] !== null && mapped[k] !== undefined) mapped[k] = String(mapped[k]).trim();
        if (mapped[k] === '') mapped[k] = null;
      });

      return mapped;
    }
  };

  const handleFileChange = (e) => {
    setMessage('');
    setRows([]);
    setHeaders([]);
    setValidationErrors([]);
    setFile(e.target.files[0] || null);
  };

  const parseFile = () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setParsing(true);
    setMessage('');
    setRows([]);
    setHeaders([]);
    setValidationErrors([]);

    const filename = file.name || '';
    const ext = filename.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onerror = (err) => {
      console.error('File read error', err);
      setParsing(false);
      setMessage('Failed to read file.');
    };

    const processWorksheet = (worksheet) => {
      const rawArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      const headerRow = rawArray[0] ? rawArray[0].map(h => normalize(h)) : [];
      setHeaders(headerRow);
      const missing = checkMissingRequired(headerRow);
      if (missing.length) {
        setValidationErrors(missing);
        setParsing(false);
        setMessage('Missing required columns: ' + missing.join(', '));
        return;
      }
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const normalizedRows = jsonRows
        .filter(r => Object.values(r).some(v => String(v).trim() !== ''))
        .map(r => {
          const obj = {};
          Object.keys(r).forEach(k => {
            obj[normalize(k).toLowerCase()] = r[k];
          });
          return obj;
        })
        .map(r => mapRowToServer(r));

      setRows(normalizedRows);
      setMessage(`Successfully parsed ${normalizedRows.length} rows.`);
      setParsing(false);
    };

    if (ext === 'csv') {
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const workbook = XLSX.read(csvText, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          processWorksheet(worksheet);
        } catch (err) {
          console.error(err);
          setParsing(false);
          setMessage('Failed to parse CSV file.');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          processWorksheet(worksheet);
        } catch (err) {
          console.error('parse error', err);
          setParsing(false);
          setMessage('Failed to parse Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const uploadParsedRows = async () => {
    if (!rows || rows.length === 0) {
      alert('No rows to import. Please parse a file first.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const payload = isProducts ? { products: rows } : { rows: rows };
      console.log('Posting to', TARGET_JSON_ENDPOINT, 'payload sample:', rows[0]);
      const res = await axios.post(TARGET_JSON_ENDPOINT, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
      });
      if (res && res.data && (res.data.success || res.status === 200 || res.data.message)) {
        setMessage(res.data.message || 'Import completed successfully.');
        if (onImportComplete) onImportComplete(res.data);
      } else {
        setMessage('Import finished but server returned unexpected response.');
      }
    } catch (err) {
      console.error('Upload error', err);
      const msg = err.response && err.response.data && (err.response.data.message || err.response.data.error)
        ? (err.response.data.message || err.response.data.error)
        : err.message;
      setMessage('Upload failed: ' + msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">{modalTitle}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {isProducts ? (
          <>
            Supported Excel / CSV columns: <strong>Item ID, Product Name, Category, Current Stock (or Opening Stock), Price, Unit, Reorder Level</strong>.
          </>
        ) : (
          <>
            Expected columns: <strong>Date, Name, Phone, Email, Source, Assigned To, Address, Notes, Status</strong>.
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="text-sm text-gray-600 border p-1 rounded"
        />
        <button 
          onClick={parseFile} 
          disabled={!file || parsing} 
          className={`px-4 py-2 rounded bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 ${parsing ? 'opacity-60' : ''}`}
        >
          {parsing ? 'Parsing...' : 'Parse & Validate'}
        </button>

        <button 
          onClick={uploadParsedRows} 
          disabled={rows.length === 0 || uploading} 
          className={`px-4 py-2 rounded bg-green-600 text-white font-medium text-sm hover:bg-green-700 ${uploading ? 'opacity-60' : ''}`}
        >
          {uploading ? 'Importing...' : 'Import Parsed Rows'}
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-1">Parsed headers:</div>
        <div className="text-xs font-mono bg-gray-50 p-2 rounded text-gray-600 mb-2 border">{headers && headers.length ? headers.join(' | ') : '—'}</div>

        <div className="text-sm text-gray-700 mb-2">Rows parsed: <strong>{rows.length}</strong></div>
        {validationErrors && validationErrors.length > 0 && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-2 text-sm border border-red-200">
            Missing required columns: {validationErrors.join(', ')}
          </div>
        )}
        {message && (
          <div className={`p-3 rounded mb-2 text-sm ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
            {message}
          </div>
        )}
      </div>

      {rows && rows.length > 0 && (
        <div className="overflow-auto max-h-64 border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b text-gray-700 font-semibold sticky top-0">
              {isProducts ? (
                <tr>
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">SKU / Item ID</th>
                  <th className="text-left py-2 px-3">Product Name</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-left py-2 px-3">Stock</th>
                  <th className="text-left py-2 px-3">Price</th>
                </tr>
              ) : (
                <tr>
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Phone</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                  {isProducts ? (
                    <>
                      <td className="py-2 px-3 font-mono text-xs text-gray-600">{r.sku || '-'}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{r.name}</td>
                      <td className="py-2 px-3 text-gray-600">{r.category}</td>
                      <td className="py-2 px-3 text-gray-800 font-semibold">{r.stock_level}</td>
                      <td className="py-2 px-3 text-gray-800">₹{r.price}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3">{r.date}</td>
                      <td className="py-2 px-3 font-medium">{r.full_name}</td>
                      <td className="py-2 px-3">{r.phone_number}</td>
                      <td className="py-2 px-3">{r.email}</td>
                      <td className="py-2 px-3">{r.status}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && <div className="text-xs text-gray-500 p-2">Showing first 200 rows only.</div>}
        </div>
      )}
    </div>
  );
};

export default ExcelImport;