import { API_BASE_URL } from '../config';
// src/components/ExcelImport.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ExcelImport = ({
  endpoint = '/bulk_import_leads.php', // endpoint path under API base
  requiredColumns = ['Date', 'Name'],
  onImportComplete = null,
}) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // API base: use env var or default to your php server path
  const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.replace(/\/$/, '')) 
                    || API_BASE_URL + "/server/api";
  const TARGET_JSON_ENDPOINT = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const TARGET_FILE_ENDPOINT = TARGET_JSON_ENDPOINT; // same endpoint supports file/multipart

  const normalize = (s) => (s === undefined || s === null ? '' : String(s).trim());

  const canonicalMap = (rawHeaders) => {
    const map = {};
    rawHeaders.forEach((h, idx) => {
      const key = normalize(h).toLowerCase();
      map[key] = { name: normalize(h), index: idx };
    });
    return map;
  };

  const findMissingRequired = (rawHeaders) => {
    const lookup = canonicalMap(rawHeaders);
    const missing = [];
    requiredColumns.forEach((req) => {
      const found = Object.keys(lookup).find((k) => k === req.toLowerCase() || k === req.toLowerCase().replace(/\s+/g, '_'));
      if (!found) missing.push(req);
    });
    return missing;
  };

  const mapRowToServer = (rowObj) => {
    const get = (candidates) => {
      for (const k of candidates) {
        const nk = k.toLowerCase();
        if (rowObj.hasOwnProperty(nk)) return rowObj[nk];
        const kUnd = nk.replace(/\s+/g, '_');
        if (rowObj.hasOwnProperty(kUnd)) return rowObj[kUnd];
      }
      return '';
    };

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
      const missing = findMissingRequired(headerRow);
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
      setMessage(`${normalizedRows.length} rows parsed`);
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

  const prepareRowsForSend = (inputRows) => {
    return inputRows.map(r => {
      const out = { ...r };
      if (!out.full_name && out.fullName) out.full_name = out.fullName;
      if (!out.full_name && out.name) out.full_name = out.name;
      out.Name = out.full_name ?? out.Name ?? null;
      out.full_name = out.full_name ?? out.Name ?? null;

      if (!out.phone_number && out.Phone) out.phone_number = out.Phone;
      if (!out.phone_number && out.contact_info) out.phone_number = out.contact_info;
      out.Phone = out.phone_number ?? out.Phone ?? null;
      out.phone_number = out.phone_number ?? out.Phone ?? null;

      return out;
    });
  };

  const uploadParsedRows = async () => {
    if (!rows || rows.length === 0) {
      alert('No rows to import. Please parse a file first.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const prepared = prepareRowsForSend(rows);
      console.log('Posting to', TARGET_JSON_ENDPOINT, 'payload sample:', prepared[0]);
      const res = await axios.post(TARGET_JSON_ENDPOINT, { rows: prepared }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
      });
      if (res && res.data && (res.data.success || res.status === 200)) {
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

  const uploadFileRaw = async () => {
    if (!file) { alert('Choose a file first'); return; }
    setUploading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      console.log('Uploading file raw to', TARGET_FILE_ENDPOINT);
      const res = await axios.post(TARGET_FILE_ENDPOINT, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setMessage(res.data.message || 'File uploaded and processed by server.');
      if (onImportComplete) onImportComplete(res.data);
    } catch (err) {
      console.error('Raw upload error', err);
      setMessage('Raw upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Import Leads (Excel / CSV)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Expected columns (any order allowed): <strong>Date, Name, Phone, Email, Source, Assigned To, Address, Notes, Status</strong>.
        The importer will validate that <strong>{requiredColumns.join(', ')}</strong> are present before sending to the server.
      </p>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="file"
          accept="*/*"
          onChange={handleFileChange}
        />
        <button onClick={parseFile} disabled={!file || parsing} className={`px-4 py-2 rounded bg-blue-600 text-white ${parsing ? 'opacity-60' : ''}`}>
          {parsing ? 'Parsing...' : 'Parse & Validate'}
        </button>

        <button onClick={uploadParsedRows} disabled={rows.length === 0 || uploading} className={`px-4 py-2 rounded bg-green-600 text-white ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? 'Importing...' : 'Import Parsed Rows'}
        </button>

        <button onClick={uploadFileRaw} disabled={!file || uploading} className="px-3 py-2 rounded border">
          Upload File (fallback)
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-700 mb-2">Parsed headers:</div>
        <div className="text-xs text-gray-600 mb-2">{headers && headers.length ? headers.join(' | ') : '—'}</div>

        <div className="text-sm text-gray-700 mb-2">Rows parsed: <strong>{rows.length}</strong></div>
        {validationErrors && validationErrors.length > 0 && (
          <div className="bg-red-50 text-red-700 p-2 rounded mb-2">
            Missing required columns: {validationErrors.join(', ')}
          </div>
        )}
        {message && <div className="p-2 rounded bg-gray-50 text-gray-800 mb-2">{message}</div>}
      </div>

      {rows && rows.length > 0 && (
        <div className="overflow-auto max-h-64 border p-2 rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pr-6">#</th>
                <th className="text-left pr-6">Date</th>
                <th className="text-left pr-6">Name</th>
                <th className="text-left pr-6">Phone</th>
                <th className="text-left pr-6">Email</th>
                <th className="text-left pr-6">Source</th>
                <th className="text-left pr-6">Assigned To</th>
                <th className="text-left pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.date}</td>
                  <td>{r.full_name}</td>
                  <td>{r.phone_number}</td>
                  <td>{r.email}</td>
                  <td>{r.source}</td>
                  <td>{r.assigned_to_user_id}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && <div className="text-xs text-gray-500 mt-2">Showing first 200 rows only.</div>}
        </div>
      )}
    </div>
  );
};

export default ExcelImport;