// src/pages/SalesMobile.jsx
import React, { useState } from "react";
import { FaPlus, FaTrash, FaShoppingCart, FaSearch, FaBarcode } from "react-icons/fa";
import BarcodeModal from "../components/BarcodeModal";
import InvoiceModal from "../components/common/InvoiceModal"; // Corrected import path

/**
 * SalesMobile - Mobile flow (Step-by-step)
 * Props are provided by parent Sales.jsx (now includes `company`)
 */

const SalesMobile = (props) => {
  const {
    user,
    products,
    customers,
    cart,
    setCart,
    selectedCustomer,
    setSelectedCustomer,
    lastSale,
    setLastSale,
    handleAddToCart,
    handleRemoveFromCart,
    updateQuantity,
    subtotal,
    payable,
    discount,
    setDiscount,
    showProductModal,
    setShowProductModal,
    showNewCustomerModal,
    setShowNewCustomerModal,
    showPaymentModal,
    setShowPaymentModal,
    resetPaymentForm,
    paymentAmount,
    changeAmount,
    isGstCustomer,
    paymentMode,
    upiId,
    gstInputValue,
    setPaymentAmount,
    setChangeAmount,
    setIsGstCustomer,
    setPaymentMode,
    setUpiId,
    setGstInputValue,
    handleProcessSale,
    handleBarcodeScanSuccess,
    handleNewCustomerChange,
    handleAddNewCustomer,
    filteredProducts,
    filteredCustomers,
    company, // new prop from Sales.jsx
  } = props;

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [productOverlayOpen, setProductOverlayOpen] = useState(false);
  const [overlayTab, setOverlayTab] = useState("search"); // search | scan
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const customerList = filteredCustomers(customerSearchTerm);
  const productList = filteredProducts(productSearchTerm);

  // UI helpers
  const itemsCount = cart.length;
  const payableDisplay = (Number(payable) || 0).toFixed(2);

  // Called when invoice "New Sale" clicked
  const handleNewSale = () => {
    setCart([]);
    setSelectedCustomer(null);
    setLastSale(null);
    resetPaymentForm();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      {/* Header with centered logo / fallback text */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button onClick={() => window.history.back()} className="text-sm text-gray-700">Back</button>
        <div className="flex-1 text-center">
          <img src="/logo.png" alt="logo" className="h-10 mx-auto object-contain" onError={(e) => { e.target.style.display = "none"; }} />
          {!document.querySelector('img[src="/logo.png"]') && <div className="text-sm font-bold">Sri Balaji Renewables POS</div>}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: Select Customer */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-lg mb-2 text-gray-800">Step 1: Select Customer</h3>
          <div className="flex gap-2">
            <input className="flex-1 p-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search customer..." value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} />
            <button onClick={() => setShowNewCustomerModal(true)} className="px-4 rounded-lg bg-blue-600 text-white shadow-lg"><FaPlus /></button>
          </div>

          {customerSearchTerm && (
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
              {customerList.map(c => (
                <div key={c.id} className="p-3 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => { setSelectedCustomer(c); setCustomerSearchTerm(""); }}>
                  <div className="font-semibold text-gray-800">{c.full_name ?? c.name}</div>
                  <div className="text-sm text-gray-600">{c.phone_number ?? c.phone}</div>
                </div>
              ))}
            </div>
          )}

          {selectedCustomer ? (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="font-bold text-gray-800">{selectedCustomer.full_name ?? selectedCustomer.name}</div>
              <div className="text-sm text-gray-600">{selectedCustomer.phone_number ?? selectedCustomer.phone}</div>
              {selectedCustomer.gst_number && <div className="text-xs text-gray-600 mt-1">GST: {selectedCustomer.gst_number}</div>}
            </div>
          ) : (
            <div className="mt-3 p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">Select a customer to begin the sale.</div>
          )}
        </div>

        {/* Step 2: Add Products */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-800">Step 2: Add Products</h3>
            <div className="flex items-center gap-2">
              {/* Open full-screen Add Products overlay */}
              <button disabled={!selectedCustomer} onClick={() => { setProductOverlayOpen(true); setOverlayTab("search"); }} className={`px-4 py-3 rounded-lg ${selectedCustomer ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                <FaSearch />
              </button>
              <button disabled={!selectedCustomer} onClick={() => { setProductOverlayOpen(true); setOverlayTab("scan"); }} className={`px-4 py-3 rounded-lg ${selectedCustomer ? 'bg-white border text-blue-600 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                <FaBarcode />
              </button>
            </div>
          </div>

          <div className="min-h-[120px]">
            {!cart.length ? <div className="text-center text-gray-400 py-8">No products added yet</div> : (
              <ul className="space-y-3">
                {cart.map(item => (
                  <li key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">₹{(Number(item.price)||0).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={item.quantity} onChange={(e)=>{ const v=parseInt(e.target.value,10); if(!isNaN(v)&&v>0) updateQuantity(item.id,v); }} className="w-16 p-2 border rounded-lg text-center" />
                      <button onClick={()=>handleRemoveFromCart(item.id)} className="text-red-600 text-lg p-2 rounded-full hover:bg-gray-100"><FaTrash /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 border-t border-gray-200 pt-3">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Discount (flat)</label>
            <input type="number" value={discount} onChange={(e)=>setDiscount(Number(e.target.value || 0))} className="w-full p-2 border border-gray-300 rounded-lg mb-3" />
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-gray-800">Payable</div>
              <div className="font-bold text-lg text-gray-900">₹{payableDisplay}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Always visible when customer selected */}
      {selectedCustomer && (
        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-3 shadow-lg z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-600 text-white w-12 h-12 flex items-center justify-center shadow-lg">
                <FaShoppingCart className="text-xl" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Items</div>
                <div className="font-bold text-gray-800">{itemsCount} • ₹{payableDisplay}</div>
              </div>
            </div>

            <div className="flex-1">
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50"
                disabled={!cart.length}
                onClick={() => {
                  if (!user || !user.id) {
                    console.warn("No logged-in user, proceeding with Admin fallback.");
                  }
                  setShowPaymentModal(true);
                }}
              >
                {cart.length
                  ? `Complete Transaction · ${itemsCount} items · ₹${payableDisplay}`
                  : "Cart is empty"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Overlay (full-screen) */}
      {productOverlayOpen && (
        <ProductOverlay
          products={products}
          term={productSearchTerm}
          setTerm={setProductSearchTerm}
          list={productList}
          onClose={() => setProductOverlayOpen(false)}
          tab={overlayTab}
          setTab={setOverlayTab}
          onAdd={(p, q) => handleAddToCart(p, q)}
          onScan={(code) => handleBarcodeScanSuccess(code)}
          openScanner={() => setScannerOpen(true)}
        />
      )}

      {/* Scanner Modal (if using a separate scanner component) */}
      {scannerOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center">
          <div className="w-full h-full">
            <BarcodeModal
              onClose={() => setScannerOpen(false)}
              onScanSuccess={(code) => { setScannerOpen(false); handleBarcodeScanSuccess(code); }}
              fullScreen={true}
            />
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Complete Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500">Close</button>
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-600">Total</label>
              <div className="font-semibold">₹{(Number(subtotal) || 0).toFixed(2)}</div>
            </div>

            <div className="mb-3">
              <label className="text-sm text-gray-600">Payable</label>
              <div className="font-semibold">₹{(Number(payable) || 0).toFixed(2)}</div>
            </div>

            <div className="mb-3">
              <label className="text-sm">Payment Mode</label>
              <select value={paymentMode} onChange={(e)=>setPaymentMode(e.target.value)} className="w-full p-2 border rounded">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {paymentMode === "upi" && (
              <div className="mb-3">
                <label className="text-sm">UPI ID</label>
                <input value={upiId} onChange={(e)=>setUpiId(e.target.value)} className="w-full p-2 border rounded" placeholder="example@upi" />
              </div>
            )}

            <div className="mb-3">
              <label className="text-sm">Amount Received</label>
              <input type="number" value={paymentAmount} onChange={(e)=>{ const v = e.target.value; setPaymentAmount(v); const n = parseFloat(v) || 0; const ch = n - Number(payable || 0); setChangeAmount(ch > 0 ? ch : 0); }} className="w-full p-2 border rounded" />
            </div>

            <div className="mb-3">
              <label className="text-sm">Change Due</label>
              <div className="font-semibold">₹{(Number(changeAmount) || 0).toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={isGstCustomer} onChange={(e)=>setIsGstCustomer(e.target.checked)} />
              <label>GST-registered customer?</label>
            </div>

            {isGstCustomer && !selectedCustomer?.gst_number && (
              <div className="mb-3">
                <label className="text-sm">GST Number</label>
                <input value={gstInputValue} onChange={(e)=>setGstInputValue(e.target.value)} className="w-full p-2 border rounded" />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
              <button onClick={() => handleProcessSale()} className="flex-1 py-2 bg-green-600 text-white rounded">Process Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* New customer modal (basic) */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3">Add Customer</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddNewCustomer(e); }}>
              <input placeholder="Full name" required className="w-full p-2 border rounded mb-2" onChange={(e) => handleNewCustomerChange("full_name", e.target.value)} />
              <input placeholder="Phone" required className="w-full p-2 border rounded mb-2" onChange={(e) => handleNewCustomerChange("phone_number", e.target.value)} />
              <input placeholder="Email" className="w-full p-2 border rounded mb-2" onChange={(e) => handleNewCustomerChange("email", e.target.value)} />
              <textarea placeholder="Address" className="w-full p-2 border rounded mb-2" onChange={(e) => handleNewCustomerChange("address", e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewCustomerModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice modal shown when lastSale exists - PASS company prop */}
      {lastSale && (
        <InvoiceModal
          sale={lastSale}
          onClose={() => setLastSale(null)}
          onNewSale={handleNewSale}
          company={company}
        />
      )}
    </div>
  );
};

/* ProductOverlay component (unchanged) */
const ProductOverlay = ({ products, term, setTerm, list, onClose, tab, setTab, onAdd, onScan, openScanner }) => {
  return (
    <div className="fixed inset-0 z-70 bg-black/50">
      <div className="absolute inset-0 overflow-auto">
        <div className="max-w-3xl mx-auto bg-white rounded-lg mt-8 mb-8 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button onClick={() => setTab("search")} className={`px-3 py-1 rounded ${tab === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Search</button>
              <button onClick={() => setTab("scan")} className={`px-3 py-1 rounded ${tab === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Scan</button>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>
          </div>

          {tab === "search" && (
            <>
              <input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full p-2 border rounded mb-3" placeholder="Search products by name or SKU..." />
              <div className="max-h-[60vh] overflow-y-auto border rounded">
                {list.length ? list.map(p => {
                  const id = p?.id ?? Math.random();
                  const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
                  return (
                    <div key={id} className="p-3 flex items-center justify-between border-b">
                      <div>
                        <div className="font-semibold">{p.name ?? p.title}</div>
                        <div className="text-sm text-gray-600">₹{price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input defaultValue={1} min={1} type="number" id={`qty-${id}`} className="w-20 p-1 border rounded" />
                        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => {
                          const qEl = document.getElementById(`qty-${id}`);
                          const q = qEl ? parseInt(qEl.value, 10) || 1 : 1;
                          onAdd(p, q);
                        }}>Add</button>
                      </div>
                    </div>
                  );
                }) : <div className="p-4 text-gray-500">No products found</div>}
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 border rounded">Done</button>
                <button onClick={onClose} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded">Continue to Cart</button>
              </div>
            </>
          )}

          {tab === "scan" && (
            <div>
              <div className="mb-3">Scan product barcode using camera (tap Open Scanner).</div>
              <div className="flex gap-2">
                <button onClick={openScanner} className="flex-1 py-3 bg-blue-600 text-white rounded">Open Scanner</button>
                <button onClick={() => {
                  const code = prompt("Enter barcode manually (test)");
                  if (code) onScan(code);
                }} className="flex-1 py-3 border rounded">Enter Manually</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesMobile;