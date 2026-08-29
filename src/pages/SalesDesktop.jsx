// src/pages/SalesDesktop.jsx
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCamera, FaSearch, FaPlus, FaTrash, FaPause, FaHistory, FaCheckCircle, FaUserPlus, FaTh, FaList, FaTimes } from "react-icons/fa";
import Modal from "../components/common/Modal";
import logoImg from "../assets/logo.png";

/**
 * SalesDesktop - Modern, ultra-useful POS terminal desktop layout
 */
const SalesDesktop = (props) => {
  const {
    user,
    products = [],
    customers = [],
    cart = [],
    selectedCustomer,
    setSelectedCustomer,
    handleAddToCart,
    handleRemoveFromCart,
    updateQuantity,
    handleClearCart,
    handleHoldCart,
    handleRecallCart,
    heldCarts = [],
    subtotal = 0,
    payable = 0,
    discount = 0,
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
    paymentMode,
    upiId
  } = props;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [showHeldModal, setShowHeldModal] = useState(false);

  const allCategories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const localFilteredProducts = filteredProducts(searchTerm).filter(p => {
    if (selectedCategory === "All") return true;
    return (p.category || "").toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Sleek Top POS Header Bar */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 px-6 py-2.5 flex items-center justify-between shadow-lg z-20 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center px-3 py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all border border-slate-600"
          >
            <FaArrowLeft className="mr-2 text-xs text-slate-400" /> Back to Dashboard
          </button>
          <div className="h-5 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <img src={logoImg} alt="Logo" className="h-7 w-auto object-contain bg-slate-900/50 p-1 rounded" />
            <h1 className="text-xl font-black tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Sri Balaji Renewables POS
            </h1>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="hidden lg:flex items-center space-x-2 overflow-x-auto py-1 max-w-xl">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Controls & Cashier Info */}
        <div className="flex items-center space-x-3">
          {heldCarts.length > 0 && (
            <button 
              onClick={() => setShowHeldModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-xl text-xs font-bold transition-all shadow"
            >
              <FaHistory />
              <span>Recall Cart ({heldCarts.length})</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-700" />
          
          <div className="flex items-center space-x-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cashier / Staff</div>
              <div className="text-xs font-bold text-slate-200">{user?.full_name || user?.name || "Store Admin"}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-md border border-blue-400/40">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main POS Workspace */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden h-[calc(100vh-56px)]">
        
        {/* Left Section: Product Catalog & Search (REDESIGNED) */}
        <div className="flex-1 flex flex-col bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-4 shadow-2xl overflow-hidden min-w-0">
          
          {/* Product Search, View Mode Switcher, & Barcode Scan Bar */}
          <div className="flex items-center gap-3 mb-3 bg-slate-800/90 backdrop-blur p-2.5 rounded-xl border border-slate-700/60 shadow-md flex-shrink-0">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input 
                placeholder="Search products by name, SKU, or category (or scan barcode)..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-9 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all"
                autoFocus
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* View Mode Toggle Switch (Grid vs List) */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button 
                onClick={() => setViewMode("grid")} 
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <FaTh />
              </button>
              <button 
                onClick={() => setViewMode("list")} 
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Compact List View"
              >
                <FaList />
              </button>
            </div>

            <button 
              onClick={() => setShowProductModal(true)} 
              className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all space-x-2 border border-indigo-400/40"
              title="Camera Scan & Search"
            >
              <FaCamera />
              <span className="hidden sm:inline">Camera Scan</span>
            </button>
          </div>

          {/* Active Filter Summary Bar */}
          <div className="flex justify-between items-center px-1 mb-2 text-xs text-slate-400 flex-shrink-0">
            <div>
              Showing <span className="font-bold text-slate-200">{localFilteredProducts.length}</span> products {selectedCategory !== 'All' ? `in "${selectedCategory}"` : ''}
            </div>
            {selectedCategory !== 'All' && (
              <button 
                onClick={() => setSelectedCategory('All')}
                className="text-blue-400 hover:underline text-[11px] font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Scrollable Products Catalog Container */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            
            {/* GRID VIEW (Spacious Cards) */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 content-start pb-4">
                {localFilteredProducts.map((p) => {
                  const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
                  const stock = Number(p?.stock_level ?? p?.stock ?? 0);
                  const id = p?.id ?? p?.ID ?? p?.product_id ?? p?.sku ?? Math.random();
                  const inCart = cart.find(item => item.id === p.id);
                  
                  return (
                    <div 
                      key={id} 
                      onClick={() => handleAddToCart(p)}
                      className={`relative group min-h-[155px] bg-gradient-to-b from-slate-800/90 to-slate-800/70 hover:from-slate-750 hover:to-slate-800 border ${
                        inCart ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700/80 hover:border-blue-500/60'
                      } p-4 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden select-none`}
                    >
                      {/* Top Badges: Category Tag & Stock Pill */}
                      <div className="flex justify-between items-start gap-1 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80 truncate max-w-[110px]">
                          {p.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          stock <= 0 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : stock <= 5 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {stock <= 0 ? 'Out of Stock' : `Stock: ${stock}`}
                        </span>
                      </div>

                      {/* Product Title & SKU */}
                      <div className="my-1 flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
                          {p.name ?? p.title ?? "Product Item"}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">SKU: {p.sku || '-'}</p>
                      </div>

                      {/* Bottom Footer: Price & Add Button */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/60">
                        <div className="text-lg font-black text-emerald-400">
                          ₹{price.toFixed(2)}
                        </div>
                        <button 
                          className={`px-3 py-1.5 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                            inCart ? 'bg-blue-600 text-white border border-blue-400' : 'bg-slate-700 text-slate-200 group-hover:bg-blue-600 group-hover:text-white'
                          }`}
                        >
                          {inCart ? `In Cart (${inCart.quantity})` : <><FaPlus className="mr-1 text-[10px]" /> Add</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPACT LIST VIEW (Table View) */}
            {viewMode === "list" && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg pb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Stock</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-slate-200">
                    {localFilteredProducts.map((p) => {
                      const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
                      const stock = Number(p?.stock_level ?? p?.stock ?? 0);
                      const inCart = cart.find(item => item.id === p.id);

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => handleAddToCart(p)}
                          className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-bold text-slate-100">{p.name ?? p.title}</td>
                          <td className="p-3 text-slate-400">{p.category || 'General'}</td>
                          <td className="p-3 font-mono text-slate-400">{p.sku || '-'}</td>
                          <td className="p-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              stock <= 0 ? 'bg-rose-500/20 text-rose-300' : stock <= 5 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {stock}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-emerald-400 text-sm">₹{price.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                              className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                inCart ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-blue-600 hover:text-white'
                              }`}
                            >
                              {inCart ? `Qty: ${inCart.quantity}` : '+ Add'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {localFilteredProducts.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <FaSearch className="w-10 h-10 mb-3 opacity-40 text-slate-500" />
                <p className="font-bold text-base text-slate-300">No products match your search query.</p>
                <p className="text-xs text-slate-500 mt-1">Try searching by a different name, SKU, or category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Active Cart & Checkout Pane (PERFECT RIGHT PANEL preserved) */}
        <div className="w-[430px] flex flex-col bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 shadow-2xl overflow-hidden flex-shrink-0">
          
          {/* Customer Selection Box */}
          <div className="mb-3 bg-slate-900/70 border border-slate-700/80 p-3 rounded-xl shadow-inner">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customer Details</label>
              {selectedCustomer?.id !== 0 && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Registered Customer
                </span>
              )}
            </div>
            <CustomerSelector 
              customers={customers} 
              selectedCustomer={selectedCustomer} 
              setSelectedCustomer={setSelectedCustomer} 
              filteredCustomers={filteredCustomers} 
              setShowNewCustomerModal={setShowNewCustomerModal}
            />
          </div>

          {/* Cart Header & Action Buttons */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
            <h3 className="font-black text-slate-200 text-base flex items-center gap-2">
              <span>Cart Items</span>
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a,c)=>a+c.quantity, 0)}
              </span>
            </h3>

            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <>
                  <button 
                    onClick={handleHoldCart}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition-all"
                    title="Hold current cart to attend another customer"
                  >
                    <FaPause className="text-[10px]" />
                    <span>Hold</span>
                  </button>
                  <button 
                    onClick={handleClearCart}
                    className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-lg text-xs font-bold transition-all"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 py-1 min-h-0">
            {!cart.length ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                <div className="w-12 h-12 rounded-full bg-slate-900/90 flex items-center justify-center border border-slate-700 text-slate-500 text-xl shadow-inner">
                  🛒
                </div>
                <p className="text-sm font-bold text-slate-300">Cart is empty</p>
                <p className="text-xs text-slate-500 text-center max-w-[210px]">
                  Click products on the left or scan a barcode to build customer order.
                </p>
              </div>
            ) : (
              cart.map(item => {
                const price = Number(item.price) || 0;
                const itemTotal = price * item.quantity;
                return (
                  <div key={item.id} className="bg-slate-900/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between shadow-md hover:border-slate-600 transition-all">
                    <div className="flex-1 mr-2 min-w-0">
                      <h4 className="font-bold text-sm text-slate-100 truncate">{item.name ?? item.title ?? 'Item'}</h4>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                        <span>₹{price.toFixed(2)} × {item.quantity} =</span>
                        <span className="font-extrabold text-blue-400">₹{itemTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Quantity Modifier */}
                    <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-inner">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 active:bg-slate-600 text-xs font-black"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-100">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 active:bg-slate-600 text-xs font-black"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => handleRemoveFromCart(item.id)} 
                      className="ml-2.5 text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove item"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout Totals & Quick Pay Bar */}
          <div className="mt-3 pt-3 border-t border-slate-700/80 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 shadow-xl space-y-2.5 flex-shrink-0">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Subtotal</span>
              <span className="font-bold text-slate-200">₹{(Number(subtotal)||0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400">
              <label>Discount Amount (₹)</label>
              <input 
                type="number" 
                value={discount || ''} 
                onChange={(e) => setDiscount(Number(e.target.value||0))} 
                className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-right text-xs text-slate-100 font-bold focus:outline-none focus:border-blue-500" 
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Grand Total</div>
                <div className="text-2xl font-black text-emerald-400">₹{(Number(payable)||0).toFixed(2)}</div>
              </div>

              <button 
                disabled={!cart.length}
                onClick={() => { 
                  if(!cart.length) return;
                  resetPaymentForm(); 
                  setShowPaymentModal(true); 
                }}
                className={`px-6 py-3.5 rounded-xl font-black text-sm shadow-xl transition-all flex items-center space-x-2 ${
                  cart.length 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-600/30 cursor-pointer active:scale-95 border border-emerald-400/40' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                }`}
              >
                <span>Checkout Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Held Carts Modal */}
      {showHeldModal && (
        <Modal onClose={() => setShowHeldModal(false)}>
          <div className="p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-1 text-gray-900 flex items-center gap-2">
              <FaHistory className="text-amber-500" /> Held / Suspended Orders
            </h2>
            <p className="text-xs text-gray-500 mb-4">Click recall on any held order to resume checkout.</p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {heldCarts.map((h) => {
                const total = h.cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
                return (
                  <div key={h.id} className="p-3 bg-gray-50 border rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-gray-800">{h.customer?.full_name || 'Walk-in Customer'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Held at {h.timestamp} • {h.cart.length} items • <span className="font-bold text-gray-900">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        handleRecallCart(h.id);
                        setShowHeldModal(false);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 shadow"
                    >
                      Recall Order
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Camera Product Modal */}
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

      {/* Quick Checkout Payment Modal */}
      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <PaymentForm
            {...{ subtotal, payable, paymentAmount, changeAmount, isGstCustomer, gstInputValue, setPaymentAmount, setChangeAmount, setIsGstCustomer, setGstInputValue, handleProcessSale, selectedCustomer, paymentMode, setPaymentMode, upiId, setUpiId }}
          />
        </Modal>
      )}

      {/* Add New Customer Modal */}
      {showNewCustomerModal && (
        <Modal onClose={() => setShowNewCustomerModal(false)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-3 text-gray-800 flex items-center gap-2">
              <FaUserPlus className="text-blue-600" /> Add New Customer
            </h2>
            <form onSubmit={handleAddNewCustomer} className="space-y-3">
              <input name="full_name" placeholder="Full Name" required className="w-full p-2.5 border rounded-lg text-sm" onChange={(e)=>handleNewCustomerChange('full_name',e.target.value)} />
              <input name="phone_number" placeholder="Phone Number" required className="w-full p-2.5 border rounded-lg text-sm" onChange={(e)=>handleNewCustomerChange('phone_number',e.target.value)} />
              <input name="email" placeholder="Email Address (Optional)" className="w-full p-2.5 border rounded-lg text-sm" onChange={(e)=>handleNewCustomerChange('email',e.target.value)} />
              <textarea name="address" placeholder="Billing Address (Optional)" className="w-full p-2.5 border rounded-lg text-sm" rows={2} onChange={(e)=>handleNewCustomerChange('address',e.target.value)} />
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_gst_registered" 
                  name="is_gst_registered" 
                  checked={isGstCustomer} 
                  onChange={(e) => setIsGstCustomer(e.target.checked)} 
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor="is_gst_registered" className="text-xs font-semibold text-gray-700">GST-Registered Customer</label>
              </div>

              {isGstCustomer && (
                <div>
                  <input
                    type="text"
                    id="gstin"
                    name="gstin"
                    placeholder="GSTIN Number (e.g. 29ABCDE1234F2Z5)"
                    value={gstInputValue}
                    onChange={(e) => setGstInputValue(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md text-sm">
                Save & Select Customer
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* Product Modal Content (Camera / Search tabs) */
const ProductModalContent = ({ onClose, products, onAdd, onBarcodeScanSuccess, filteredProducts }) => {
  const [tab, setTab] = useState("search");
  const [term, setTerm] = useState("");
  const list = filteredProducts(term);

  return (
    <div className="p-4 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold text-gray-800">Add Product to Cart</h3>
        <div className="flex space-x-2">
          <button onClick={()=>setTab('search')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab==='search'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>Search</button>
          <button onClick={()=>setTab('scan')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab==='scan'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`}>Camera Scan</button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">Close</button>
        </div>
      </div>

      {tab === "search" && (
        <>
          <input 
            value={term} 
            onChange={(e)=>setTerm(e.target.value)} 
            placeholder="Type product name or SKU..." 
            className="w-full p-2.5 border rounded-lg mb-3 text-sm" 
            autoFocus 
          />
          <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
            {list.length ? list.map(p => {
              const price = Number(p?.price ?? p?.sale_price ?? 0) || 0;
              return (
                <div key={p.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{p.name ?? p.title}</div>
                    <div className="text-xs text-gray-500">SKU: {p.sku || '-'} • ₹{price.toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={() => { onAdd(p, 1); onClose(); }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow"
                  >
                    + Add
                  </button>
                </div>
              );
            }) : <div className="p-4 text-center text-sm text-gray-500">No matching products found.</div>}
          </div>
        </>
      )}

      {tab === "scan" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Enter or scan barcode below:</p>
          <input 
            placeholder="Scan barcode SKU..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onBarcodeScanSuccess(e.target.value);
                onClose();
              }
            }}
            className="w-full p-2.5 border rounded-lg text-sm" 
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

/* Fast Customer Dropdown Selector */
const CustomerSelector = ({ customers = [], selectedCustomer, setSelectedCustomer, filteredCustomers, setShowNewCustomerModal }) => {
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const list = filteredCustomers(term);

  const handleSelect = (customer) => {
    setSelectedCustomer(customer);
    setTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input 
          placeholder={selectedCustomer ? selectedCustomer.full_name : "Search or select customer..."} 
          value={term} 
          onChange={(e) => {
            setTerm(e.target.value);
            setIsOpen(true);
          }} 
          onFocus={() => setIsOpen(true)}
          className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-300 font-bold focus:outline-none focus:border-blue-500" 
        />
        <button 
          onClick={() => setShowNewCustomerModal(true)} 
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow"
          title="Add New Customer"
        >
          <FaPlus />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800">
          <div 
            onClick={() => handleSelect({ id: 0, full_name: "Walk-in Customer", phone_number: "-", email: "-" })}
            className="p-2.5 hover:bg-blue-600/30 cursor-pointer text-xs font-bold text-slate-200 flex items-center justify-between"
          >
            <span>Walk-in Customer</span>
            <span className="text-[10px] text-slate-400">Default</span>
          </div>

          {list.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleSelect(c)} 
              className="p-2.5 hover:bg-blue-600/30 cursor-pointer text-xs text-slate-200 flex justify-between items-center"
            >
              <div className="font-bold">{c.full_name ?? c.name}</div>
              <div className="text-[10px] text-slate-400">{c.phone_number ?? c.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* High-Speed Payment Form with Quick Cash Shortcuts */
const PaymentForm = ({ 
  subtotal, 
  payable, 
  paymentAmount, 
  changeAmount, 
  isGstCustomer, 
  paymentMode = 'cash', 
  gstInputValue, 
  setPaymentAmount, 
  setChangeAmount, 
  setIsGstCustomer, 
  setPaymentMode, 
  setGstInputValue, 
  handleProcessSale, 
  selectedCustomer 
}) => {

  const onAmountChange = (v) => {
    const n = parseFloat(v) || 0;
    const change = n - Number(payable || 0);
    setPaymentAmount(v);
    setChangeAmount(change > 0 ? change : 0);
  };

  const handleQuickCash = (amount) => {
    const amtStr = String(amount);
    onAmountChange(amtStr);
  };

  useEffect(() => {
    if (!paymentAmount) {
      onAmountChange(String(payable));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payable]);

  return (
    <div className="p-6 max-w-md w-full">
      <h2 className="text-xl font-black mb-4 text-gray-900 border-b pb-2 flex items-center justify-between">
        <span>Complete Payment</span>
        <span className="text-2xl text-emerald-600">₹{(Number(payable)||0).toFixed(2)}</span>
      </h2>

      {/* Payment Mode Selector Pills */}
      <div className="mb-4">
        <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1.5">Payment Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {['cash', 'upi', 'card'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaymentMode(mode)}
              className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                paymentMode === mode 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Cash Tender Shortcuts */}
      {paymentMode === 'cash' && (
        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Quick Cash Tender (Shortcuts)</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button 
              onClick={() => handleQuickCash(payable)} 
              className="py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 shadow"
            >
              Exact
            </button>
            <button 
              onClick={() => handleQuickCash(100)} 
              className="py-1.5 bg-white border font-bold text-xs text-gray-800 rounded-lg hover:bg-gray-100 shadow-sm"
            >
              ₹100
            </button>
            <button 
              onClick={() => handleQuickCash(500)} 
              className="py-1.5 bg-white border font-bold text-xs text-gray-800 rounded-lg hover:bg-gray-100 shadow-sm"
            >
              ₹500
            </button>
            <button 
              onClick={() => handleQuickCash(2000)} 
              className="py-1.5 bg-white border font-bold text-xs text-gray-800 rounded-lg hover:bg-gray-100 shadow-sm"
            >
              ₹2000
            </button>
          </div>
        </div>
      )}

      {/* Amount Tendered Input */}
      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-700 mb-1">Amount Received (₹)</label>
        <input 
          type="number" 
          value={paymentAmount} 
          onChange={(e) => onAmountChange(e.target.value)} 
          className="w-full p-2.5 border rounded-xl text-lg font-bold text-gray-900 bg-white"
          step="0.01"
        />
      </div>

      {/* Change Due Display */}
      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
        <span className="text-xs font-bold text-emerald-800 uppercase">Change Due to Customer:</span>
        <span className="text-xl font-black text-emerald-700">₹{(Number(changeAmount)||0).toFixed(2)}</span>
      </div>

      {/* GST Option */}
      <div className="flex items-center mb-4">
        <input 
          type="checkbox" 
          id="is_gst_sale" 
          checked={isGstCustomer} 
          onChange={(e) => setIsGstCustomer(e.target.checked)} 
          className="w-4 h-4 text-blue-600 rounded mr-2" 
        />
        <label htmlFor="is_gst_sale" className="text-xs font-semibold text-gray-700">Include GST Invoice details</label>
      </div>

      {isGstCustomer && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
          <input 
            value={selectedCustomer?.gstin ?? gstInputValue} 
            onChange={(e) => setGstInputValue(e.target.value)} 
            placeholder="Enter GSTIN Number..." 
            className="w-full p-2 border rounded-lg text-sm" 
          />
        </div>
      )}

      <button 
        onClick={handleProcessSale} 
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-xl font-black text-base shadow-xl flex items-center justify-center space-x-2"
      >
        <FaCheckCircle />
        <span>Complete Sale & Print Receipt</span>
      </button>
    </div>
  );
};

export default SalesDesktop;