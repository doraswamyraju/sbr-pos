/**
 * Google Apps Script for Sri Balaji Renewables POS - Google Sheets Integration
 * 
 * =========================================================================
 * HOW TO SETUP / UPDATE IN GOOGLE SHEETS:
 * 1. Open your Google Sheet ("SBR POS").
 * 2. Click: Extensions > Apps Script.
 * 3. Delete any existing code in Code.gs and paste this entire script.
 * 4. Click the Save icon (Ctrl+S / Cmd+S).
 * 5. Return to your Google Sheet and reload the page (F5).
 * 6. You will see a custom menu named "SBR POS Sync" at the top menu bar.
 * 7. Click: "SBR POS Sync" > "📥 Pull POS Data to Sheet (Load All 8 Fields)" 
 *    to automatically generate all standard headers and populate existing products.
 * =========================================================================
 */

// Default endpoint for Sri Balaji Renewables POS API
const POS_SYNC_API_URL = "https://pos.sribalajirenewables.com/server/api/google_sheet_sync.php";

/**
 * Creates custom menu when Google Sheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SBR POS Sync')
    .addItem('📥 Pull POS Data to Sheet (Load All 8 Fields)', 'pullPOSToSheet')
    .addItem('📤 Push Sheet Data to POS (Sync All Fields)', 'syncSheetToPOS')
    .addSeparator()
    .addItem('ℹ️ Help & Field Guide', 'showHelpModal')
    .addToUi();
}

/**
 * Standard column headers matching the website
 */
const STANDARD_HEADERS = [
  "SKU",
  "Product Name",
  "Category",
  "Price (₹)",
  "Current Stock Level",
  "Minimum Stock Level",
  "Supplier ID",
  "Description"
];

/**
 * Fetches all products from POS database and populates the Google Sheet with all 8 fields
 */
function pullPOSToSheet() {
  const ui = SpreadsheetApp.getUi();
  try {
    const response = UrlFetchApp.fetch(`${POS_SYNC_API_URL}?action=get_all`, { 
      muteHttpExceptions: true 
    });
    
    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      ui.alert(`❌ Server error (${statusCode}):\n${response.getContentText()}`);
      return;
    }

    const result = JSON.parse(response.getContentText());
    
    if (!result.success || !Array.isArray(result.products)) {
      ui.alert("❌ Failed to fetch products from POS API: " + (result.message || "Invalid response format."));
      return;
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Write standard headers on Row 1
    const headerRange = sheet.getRange(1, 1, 1, STANDARD_HEADERS.length);
    headerRange.setValues([STANDARD_HEADERS]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e293b"); // Dark slate
    headerRange.setFontColor("#ffffff"); // White text
    headerRange.setHorizontalAlignment("center");
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Clear old data rows below header across all 8 columns
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, STANDARD_HEADERS.length).clearContent();
    }
    
    const rows = result.products.map(p => [
      p.sku || '-',
      p.name || '',
      p.category || 'General',
      p.price !== undefined && p.price !== null ? Number(p.price) : 0,
      p.stock_level !== undefined && p.stock_level !== null ? Number(p.stock_level) : 0,
      p.min_stock_level !== undefined && p.min_stock_level !== null ? Number(p.min_stock_level) : 0,
      p.supplier_id || '',
      p.description || ''
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, STANDARD_HEADERS.length).setValues(rows);
      
      // Format number columns: Price (₹) -> Col 4, Current Stock -> Col 5, Min Stock -> Col 6
      sheet.getRange(2, 4, rows.length, 1).setNumberFormat("#,##0.00");
      sheet.getRange(2, 5, rows.length, 2).setNumberFormat("#,##0");
    }
    
    // Auto resize column widths for clean readability
    for (let col = 1; col <= STANDARD_HEADERS.length; col++) {
      sheet.autoResizeColumn(col);
    }
    
    ui.alert(`✅ Successfully loaded ${rows.length} products with all 8 fields matching the website!`);
  } catch (e) {
    ui.alert(`❌ Connection error: ${e.toString()}`);
  }
}

/**
 * Reads product rows from Sheet and pushes all 8 fields into POS Database
 */
function syncSheetToPOS() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    ui.alert("No product data rows found in the sheet.");
    return;
  }
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  
  // Intelligent column header matching (supports standard and legacy column names)
  const skuIdx = headers.findIndex(h => /^(sku|item\s*id|item_id|code|barcode)$/i.test(h) || h.includes('sku') || h.includes('item id'));
  const nameIdx = headers.findIndex(h => /^(product\s*name|product_name|name|item\s*name)$/i.test(h) || h.includes('product name') || h === 'name');
  const catIdx = headers.findIndex(h => /^(category|cat|group)$/i.test(h) || h.includes('category'));
  const priceIdx = headers.findIndex(h => /^(price|rate|mrp|cost|price\s*\(₹\)|price\s*\(inr\))$/i.test(h) || h.includes('price'));
  const stockIdx = headers.findIndex(h => /^(current\s*stock\s*level|current\s*stock|stock\s*level|stock|opening\s*stock|qty|quantity)$/i.test(h) || h.includes('current stock') || h === 'stock');
  const minStockIdx = headers.findIndex(h => /^(minimum\s*stock\s*level|min\s*stock\s*level|min\s*stock|minimum\s*stock|low\s*stock|low\s*stock\s*alert|threshold)$/i.test(h) || h.includes('min stock') || h.includes('minimum stock') || h.includes('low stock'));
  const supplierIdx = headers.findIndex(h => /^(supplier\s*id|supplier_id|supplier)$/i.test(h) || h.includes('supplier'));
  const descIdx = headers.findIndex(h => /^(description|desc|details|notes)$/i.test(h) || h.includes('desc'));
  
  if (nameIdx === -1 && skuIdx === -1) {
    ui.alert("Error: Neither 'Product Name' nor 'SKU' column was found in Header (Row 1).");
    return;
  }
  
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sku = skuIdx !== -1 ? String(row[skuIdx]).trim() : '';
    const name = nameIdx !== -1 ? String(row[nameIdx]).trim() : '';
    
    // Skip completely empty rows
    if (!name && (!sku || sku === '-')) continue;
    
    const category = catIdx !== -1 ? String(row[catIdx]).trim() : 'General';
    const price = (priceIdx !== -1 && row[priceIdx] !== '' && !isNaN(Number(row[priceIdx]))) ? Number(row[priceIdx]) : 0;
    const stock = (stockIdx !== -1 && row[stockIdx] !== '' && !isNaN(Number(row[stockIdx]))) ? Number(row[stockIdx]) : 0;
    const minStock = (minStockIdx !== -1 && row[minStockIdx] !== '' && !isNaN(Number(row[minStockIdx]))) ? Number(row[minStockIdx]) : 0;
    const supplierId = (supplierIdx !== -1 && row[supplierIdx] !== '' && !isNaN(Number(row[supplierIdx]))) ? Number(row[supplierIdx]) : '';
    const description = descIdx !== -1 ? String(row[descIdx]).trim() : '';
    
    products.push({
      "sku": sku === '-' ? '' : sku,
      "name": name,
      "category": category,
      "price": price,
      "stock_level": stock,
      "min_stock_level": minStock,
      "supplier_id": supplierId,
      "description": description
    });
  }
  
  if (products.length === 0) {
    ui.alert("No valid product rows to sync.");
    return;
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ products: products }),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(POS_SYNC_API_URL, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      ui.alert(
        `✅ POS Sync Successful!\n\n` +
        `• Products Updated: ${result.updated}\n` +
        `• New Products Inserted: ${result.inserted}\n` +
        `• Errors: ${result.errors}`
      );
    } else {
      ui.alert(`❌ Sync failed: ${result.message}`);
    }
  } catch (e) {
    ui.alert(`❌ Connection error: ${e.toString()}`);
  }
}

/**
 * Displays Help Modal with instructions
 */
function showHelpModal() {
  const ui = SpreadsheetApp.getUi();
  const helpText = 
    "SBR POS Google Sheets Sync Guide:\n\n" +
    "1. Pull POS Data:\n" +
    "   Fetches all products from the website database with all 8 fields:\n" +
    "   - SKU\n" +
    "   - Product Name\n" +
    "   - Category\n" +
    "   - Price (₹)\n" +
    "   - Current Stock Level\n" +
    "   - Minimum Stock Level (Low Stock Alert)\n" +
    "   - Supplier ID\n" +
    "   - Description\n\n" +
    "2. Push Sheet Data:\n" +
    "   Updates existing products (matched by SKU or Product Name) and creates new ones in the POS system.";
    
  ui.alert(helpText);
}
