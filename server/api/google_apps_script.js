/**
 * Google Apps Script for SBR POS Google Sheets Integration
 * 
 * How to setup:
 * 1. In your Google Sheet ("SBR POS"), click: Extensions > Apps Script
 * 2. Delete any existing code in Code.gs and paste this entire script.
 * 3. Save the project (Ctrl+S or Cmd+S).
 * 4. Refresh your Google Sheet tab.
 * 5. A custom menu named "SBR POS Sync" will appear at the top.
 */

const POS_SYNC_API_URL = "https://pos.sriddha.com/server/api/google_sheet_sync.php";

/**
 * Creates custom menu when Google Sheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SBR POS Sync')
    .addItem('📤 Push Sheet Data to POS (Sync Price & Stock)', 'syncSheetToPOS')
    .addItem('📥 Pull POS Data to Sheet (Load All Products)', 'pullPOSToSheet')
    .addToUi();
}

/**
 * Reads product rows from Sheet and updates Price, Stock, Category in POS Database
 */
function syncSheetToPOS() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert("No product data found in sheet.");
    return;
  }
  
  const headers = data[0].map(h => String(h).trim());
  const skuIdx = headers.findIndex(h => /item id|sku/i.test(h));
  const nameIdx = headers.findIndex(h => /product name|name/i.test(h));
  const catIdx = headers.findIndex(h => /category/i.test(h));
  const priceIdx = headers.findIndex(h => /price/i.test(h));
  const stockIdx = headers.findIndex(h => /current stock|stock/i.test(h));
  
  if (nameIdx === -1) {
    SpreadsheetApp.getUi().alert("Error: 'Product Name' column was not found in Header (Row 1).");
    return;
  }
  
  const products = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sku = skuIdx !== -1 ? String(row[skuIdx]).trim() : '';
    const name = nameIdx !== -1 ? String(row[nameIdx]).trim() : '';
    
    if (!name && !sku) continue;
    
    const category = catIdx !== -1 ? String(row[catIdx]).trim() : 'General';
    const price = (priceIdx !== -1 && row[priceIdx] !== '') ? Number(row[priceIdx]) : 0;
    const stock = (stockIdx !== -1 && row[stockIdx] !== '') ? Number(row[stockIdx]) : 0;
    
    products.push({
      "Item ID": sku,
      "Product Name": name,
      "Category": category,
      "Price": price,
      "Current Stock": stock
    });
  }
  
  if (products.length === 0) {
    SpreadsheetApp.getUi().alert("No valid product rows to sync.");
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
      SpreadsheetApp.getUi().alert(
        `✅ POS Sync Successful!\n\n` +
        `Updated Products: ${result.updated}\n` +
        `New Products Added: ${result.inserted}\n` +
        `Errors: ${result.errors}`
      );
    } else {
      SpreadsheetApp.getUi().alert(`❌ Sync failed: ${result.message}`);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert(`❌ Connection error: ${e.toString()}`);
  }
}

/**
 * Fetches all products from POS database and populates the Google Sheet
 */
function pullPOSToSheet() {
  try {
    const response = UrlFetchApp.fetch(`${POS_SYNC_API_URL}?action=get_all`, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());
    
    if (!result.success || !result.products) {
      SpreadsheetApp.getUi().alert("Failed to fetch products from POS API.");
      return;
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Item ID", "Product Name", "Category", "Price", "Current Stock"]);
    }
    
    // Clear data rows below header
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    
    const rows = result.products.map(p => [
      p.sku || '-',
      p.name,
      p.category || 'General',
      p.price || 0,
      p.stock_level || 0
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    }
    
    SpreadsheetApp.getUi().alert(`✅ Successfully loaded ${rows.length} products from POS system!`);
  } catch (e) {
    SpreadsheetApp.getUi().alert(`❌ Connection error: ${e.toString()}`);
  }
}
