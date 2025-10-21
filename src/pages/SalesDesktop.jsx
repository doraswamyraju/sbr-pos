// src/pages/SalesDesktop.jsx
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCamera, FaSearch, FaPlus, FaTrash } from "react-icons/fa";
import Modal from "../components/common/Modal";
import BarcodeModal from "../components/BarcodeModal";

/**
 * SalesDesktop - desktop layout
 * receives sharedProps from wrapper
 */
const SalesDesktop = (props) => {
  const {
    user,
    products,
    customers,
    cart,
    selectedCustomer,
    setSelectedCustomer,
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
    company
  } = props;

  const [searchTerm, setSearchTerm] = useState("");

  const localFilteredProducts = filteredProducts(searchTerm);

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => window.history.back()} className="text-gray-600 flex items-center">
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
        <div className="flex-1 text-center">
          {/* logo centered */}
          <img src="/logo.png" alt="logo" className="mx-auto h-10 object-contain" onError={(e)=>{e.target.style.display='none'}} />
        </div>
        <div className="w-24 text-right">Admin</div>
      </div>

      <div className="flex gap-4">
        {/* Products */}
        <div className="flex-1 p-4 bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-center mb-4 sticky top-0 bg-white z-10 py-2">
            <input placeholder="Search products..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="flex-1 pl-3 pr-10 py-2 border rounded-lg" />
            <button onClick={()=>setShowProductModal(true)} className="ml-3 text-primary-blue"><FaCamera /></button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {localFilteredProducts.map((p) => {
              const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
              const id = p?.id ?? p?.ID ?? p?.product_id ?? p?.sku ?? Math.random();
              return (
                <div key={id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center cursor-pointer hover:bg-primary-blue hover:text-white" onClick={()=>handleAddToCart(p)}>
                  <div className="font-bold text-center mb-2">{p.name ?? p.title ?? "Product"}</div>
                  <div className="text-sm">₹{price.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 p-4 bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-6rem)]">
          <h3 className="text-xl font-bold mb-2">Customer</h3>
          <CustomerSelector 
            customers={customers} 
            selectedCustomer={selectedCustomer} 
            setSelectedCustomer={setSelectedCustomer} 
            filteredCustomers={filteredCustomers} 
            setShowNewCustomerModal={setShowNewCustomerModal}
          />
          <div className="flex-1 overflow-y-auto mt-4">
            <h3 className="text-xl font-bold mb-4">Cart</h3>
            {!cart.length ? <div className="text-center text-gray-400 py-10">Cart is empty</div> : (
              <ul className="space-y-3">
                {cart.map(item => (
                  <li key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{item.name ?? item.title ?? 'Item'}</div>
                      <div className="text-sm">₹{(Number(item.price)||0).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="number" value={item.quantity} onChange={(e)=>{ const v=parseInt(e.target.value,10); if(!isNaN(v)&&v>0) updateQuantity(item.id,v); }} className="w-16 text-center border rounded-lg" min="1" />
                      <button onClick={()=>handleRemoveFromCart(item.id)} className="text-red-600"><FaTrash /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer with dynamic Complete Transaction */}
          <div className="border-t pt-4 bg-white sticky bottom-0">
            <div className="mb-3">
              <label className="block font-semibold">Discount</label>
              <input type="number" value={discount} onChange={(e)=>setDiscount(Number(e.target.value||0))} className="w-full p-2 border rounded-lg" />
            </div>

            <div className="flex justify-between font-bold text-xl mb-3">
              <span>Total:</span>
              <span>₹{(Number(subtotal)||0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <div>Payable: ₹{(Number(payable)||0).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Items: {cart.length}</div>
            </div>

            <button className="w-full py-3 bg-primary-blue text-white rounded-lg font-bold" onClick={() => { if(!user?.id){ alert('User missing — login first.'); return; } if(!selectedCustomer){ alert('Select customer first.'); return; } resetPaymentForm(); setShowPaymentModal(true); }}>
              Complete Transaction · {cart.length} items · ₹{(Number(payable)||0).toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Combined Product Modal (Search + Scan as tabs) */}
      {showProductModal && (
        <Modal onClose={() => setShowProductModal(false)}>
          <ProductModalContent
            onClose={() => setShowProductModal(false)}
            products={products}
            onAdd={(p, qty)=>{ handleAddToCart(p, qty); }}
            onBarcodeScanSuccess={handleBarcodeScanSuccess}
            filteredProducts={filteredProducts}
          />
        </Modal>
      )}

      {/* BarcodeModal (if you keep separate scanner component) */}
      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <PaymentForm
            {...{ subtotal, payable, paymentAmount, changeAmount, isGstCustomer, gstInputValue, setPaymentAmount, setChangeAmount, setIsGstCustomer, setGstInputValue, handleProcessSale, selectedCustomer }}
          />
        </Modal>
      )}

      {/* New customer modal */}
      {showNewCustomerModal && (
        <Modal onClose={() => setShowNewCustomerModal(false)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Customer</h2>
            <form onSubmit={handleAddNewCustomer}>
              <input name="full_name" placeholder="Full name" required className="w-full p-2 border rounded-lg mb-3" onChange={(e)=>handleNewCustomerChange('full_name',e.target.value)} />
              <input name="phone_number" placeholder="Phone" required className="w-full p-2 border rounded-lg mb-3" onChange={(e)=>handleNewCustomerChange('phone_number',e.target.value)} />
              <input name="email" placeholder="Email" className="w-full p-2 border rounded-lg mb-3" onChange={(e)=>handleNewCustomerChange('email',e.target.value)} />
              <textarea name="address" placeholder="Address" className="w-full p-2 border rounded-lg mb-3" onChange={(e)=>handleNewCustomerChange('address',e.target.value)} />
              
              <div className="mb-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="is_gst_registered" 
                  name="is_gst_registered" 
                  checked={isGstCustomer} 
                  onChange={(e) => setIsGstCustomer(e.target.checked)} 
                  className="mr-2"
                />
                <label htmlFor="is_gst_registered" className="text-gray-700">GST-Registered Customer</label>
              </div>

              {isGstCustomer && (
                <div className="mb-4">
                  <input
                    type="text"
                    id="gstin"
                    name="gstin"
                    placeholder="GST Number"
                    value={gstInputValue}
                    onChange={(e) => setGstInputValue(e.target.value)}
                    required
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-primary-blue text-white py-2 rounded-lg">Save</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* Product Modal Content (tabs: Scan / Search) */
const ProductModalContent = ({ onClose, products, onAdd, onBarcodeScanSuccess, filteredProducts }) => {
  const [tab, setTab] = useState("search");
  const [term, setTerm] = useState("");
  const list = filteredProducts(term);

  return (
    <div className="p-4 max-w-3xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Add Products</h3>
        <div className="space-x-2">
          <button onClick={()=>setTab('search')} className={`px-3 py-1 rounded ${tab==='search'?'bg-primary-blue text-white':'bg-gray-100'}`}>Search</button>
          <button onClick={()=>setTab('scan')} className={`px-3 py-1 rounded ${tab==='scan'?'bg-primary-blue text-white':'bg-gray-100'}`}>Scan</button>
          <button onClick={onClose} className="ml-2 px-3 py-1 rounded bg-gray-200">Close</button>
        </div>
      </div>

      {tab === "search" && (
        <>
          <input value={term} onChange={(e)=>setTerm(e.target.value)} placeholder="Type product name or SKU..." className="w-full p-2 border rounded-lg mb-3" />
          <div className="max-h-72 overflow-y-auto border rounded">
            {list.length ? list.map(p=>{
              const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
              const id = p?.id ?? Math.random();
              const [qty, setQty] = useState ? 1 : 1;
              return (
                <div key={id} className="p-3 flex justify-between items-center border-b">
                  <div>
                    <div className="font-semibold">{p.name ?? p.title}</div>
                    <div className="text-sm text-gray-600">₹{price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="number" defaultValue={1} min={1} className="w-20 p-1 border rounded" onChange={(e)=>{}} id={`qty-${id}`} />
                    <button className="bg-primary-blue text-white px-3 py-2 rounded-lg" onClick={()=>{
                      const qtyEl = document.getElementById(`qty-${id}`);
                      const q = qtyEl ? parseInt(qtyEl.value,10) || 1 : 1;
                      onAdd(p, q);
                    }}>Add</button>
                  </div>
                </div>
              );
            }) : <div className="p-4 text-gray-500">No products match.</div>}
          </div>
        </>
      )}

      {tab === "scan" && (
        <div>
          <p className="mb-3 text-gray-600">Open the scanner and scan a barcode to add products.</p>
          <BarcodeInline onBarcode={(code)=>onBarcodeScanSuccess(code)} />
        </div>
      )}
    </div>
  );
};

/* Basic inline barcode trigger placeholder */
const BarcodeInline = ({ onBarcode }) => {
  const [manual, setManual] = useState("");
  return (
    <div>
      <div className="mb-3">
        <input placeholder="Manually enter barcode to simulate scan" value={manual} onChange={(e)=>setManual(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="flex gap-2">
        <button onClick={()=>{ if(manual) onBarcode(manual); }} className="bg-primary-blue text-white px-3 py-2 rounded">Simulate Scan</button>
      </div>
    </div>
  );
};

const CustomerSelector = ({ customers, selectedCustomer, setSelectedCustomer, filteredCustomers, setShowNewCustomerModal }) => {
  const [term, setTerm] = useState("");
  const list = filteredCustomers(term);

  const handleSelect = (customer) => {
    setSelectedCustomer(customer);
    setTerm("");
  };

  const handleClear = () => {
    setSelectedCustomer(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input 
          placeholder="Search customer..." 
          value={term} 
          onChange={(e) => {
            setTerm(e.target.value);
            if(selectedCustomer) handleClear();
          }} 
          className="flex-1 p-2 border rounded-lg" 
        />
        <button onClick={() => setShowNewCustomerModal(true)} className="px-3 py-2 bg-primary-blue text-white rounded-lg"><FaPlus /></button>
      </div>
      {selectedCustomer ? (
        <div className="mt-2 p-3 bg-gray-100 rounded flex justify-between items-center">
          <div>
            <div className="font-semibold">{selectedCustomer.full_name ?? selectedCustomer.name}</div>
            <div className="text-sm text-gray-500">{selectedCustomer.phone_number ?? selectedCustomer.phone}</div>
          </div>
          <button onClick={handleClear} className="text-red-600 hover:text-red-800">
            <FaTrash />
          </button>
        </div>
      ) : (
        term && (
          <div className="mt-2 max-h-48 overflow-y-auto border rounded">
            {list.map(c => (
              <div key={c.id} onClick={() => handleSelect(c)} className="p-2 hover:bg-gray-100 cursor-pointer">
                {c.full_name ?? c.name}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

const PaymentForm = ({ subtotal, payable, paymentAmount, changeAmount, isGstCustomer, paymentMode, gstInputValue, setPaymentAmount, setChangeAmount, setIsGstCustomer, setPaymentMode, setGstInputValue, handleProcessSale, selectedCustomer }) => {
  const onAmountChange = (v, payable) => {
    const n = parseFloat(v) || 0;
    const change = n - Number(payable || 0);
    setPaymentAmount(v);
    setChangeAmount(change > 0 ? change : 0);
  };

  useEffect(() => {
    if(selectedCustomer) {
      setIsGstCustomer(selectedCustomer.is_gst_registered == 1);
    }
  }, [selectedCustomer]);

  return (
    <div className="p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4">Complete Payment</h2>

      <div className="mb-3">
        <label className="block font-semibold">Total</label>
        <input readOnly value={`₹${Number(subtotal||0).toFixed(2)}`} className="w-full p-2 border rounded bg-gray-100" />
      </div>

      <div className="mb-3">
        <label className="block font-semibold">Payable (after discount)</label>
        <input readOnly value={`₹${Number(payable||0).toFixed(2)}`} className="w-full p-2 border rounded bg-gray-100" />
      </div>

      <div className="mb-3">
        <label className="block font-semibold">Payment Mode</label>
        <select value={paymentMode} onChange={(e)=>setPaymentMode(e.target.value)} className="w-full p-2 border rounded">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
      </div>

      <div className="mb-3">
        <label>Amount Received</label>
        <input type="number" value={paymentAmount} onChange={(e)=>onAmountChange(e.target.value, payable)} className="w-full p-2 border rounded" />
      </div>

      <div className="mb-3">
        <label>Change Due</label>
        <input readOnly value={`₹${(Number(changeAmount)||0).toFixed(2)}`} className="w-full p-2 border rounded bg-gray-100" />
      </div>

      <div className="flex items-center mb-3">
        <input type="checkbox" checked={isGstCustomer} onChange={(e)=>setIsGstCustomer(e.target.checked)} className="mr-2" />
        <label>GST-registered customer?</label>
      </div>

      {isGstCustomer && (
        <div className="mb-3">
          <label>GST Number</label>
          <input value={selectedCustomer?.gstin ?? gstInputValue} onChange={(e)=>setGstInputValue(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      )}

      <button onClick={handleProcessSale} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Process Sale</button>
    </div>
  );
};

export default SalesDesktop;