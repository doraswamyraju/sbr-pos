import { API_BASE_URL } from '../config';
// src/components/InventoryDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBarcode,
  FaFileImport,
  FaSearch,
  FaTimes,
  FaArrowUp,
  FaShoppingCart,
  FaHammer,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';
import Modal from './common/Modal';
import ProductForm from './ProductForm';
import ExcelImport from './ExcelImport';
import BarcodeModal from './BarcodeModal';

const InventoryDashboard = ({ onRecordPurchase, onAddProduct, onOpenBOM, suppliers, onDataChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // SMS Sync state
  const [syncingSMS, setSyncingSMS] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleSyncWithSMS = async () => {
    try {
      setSyncingSMS(true);
      setSyncStatus(null);
      const res = await axios.post(`${API_BASE_URL}/server/api/sync_sms.php?action=push_all`);
      if (res.data && res.data.status === 'success') {
        setSyncStatus({ type: 'success', message: res.data.message });
      } else {
        setSyncStatus({ type: 'warning', message: res.data.message || 'Sync response received' });
      }
    } catch (err) {
      console.error('SMS Sync Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to sync with SMS Backend';
      setSyncStatus({ type: 'error', message: msg });
    } finally {
      setSyncingSMS(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  // floating search (mobile)
  const [floatingSearchOpen, setFloatingSearchOpen] = useState(false);
  const floatingInputRef = useRef(null);

  // go-to-top
  const [showGoTop, setShowGoTop] = useState(false);
  const [goTopBottom, setGoTopBottom] = useState(96); // px; default above mobile navbar

  // bulk-edit modal state (desktop)
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEdits, setBulkEdits] = useState({
    category: '',
    price: '',
    stockDelta: 0,
    stockMode: 'delta' // 'delta' or 'set'
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // update position for go-to-top based on window width (desktop lower, mobile higher)
    const updateBottom = () => {
      try {
        const w = window.innerWidth || document.documentElement.clientWidth || 1024;
        if (w < 768) {
          // mobile: place above bottom navbar
          setGoTopBottom(96);
        } else {
          // desktop: small offset
          setGoTopBottom(24);
        }
      } catch {
        setGoTopBottom(96);
      }
    };
    updateBottom();
    window.addEventListener('resize', updateBottom);
    return () => window.removeEventListener('resize', updateBottom);
  }, []);

  useEffect(() => {
    // robust scroll detection: listen to window + likely scroll containers
    const handler = () => {
      const y = (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
      setShowGoTop(y > 200);
    };

    // helper to add/remove to element if it supports addEventListener
    const add = (el) => {
      try {
        if (!el) return;
        el.addEventListener('scroll', handler, { passive: true });
      } catch (e) {}
    };
    const remove = (el) => {
      try {
        if (!el) return;
        el.removeEventListener('scroll', handler);
      } catch (e) {}
    };

    // common candidates for scroll containers
    const candidates = [
      window,
      document,
      document.scrollingElement,
      document.documentElement,
      document.body,
      document.getElementById('root'),
      document.querySelector('main'),
      document.querySelector('.flex-1'),
      document.querySelector('.app-main'),
      document.querySelector('.app-scroll'),
      document.querySelector('[role="main"]')
    ];

    const attached = [];
    candidates.forEach((c) => {
      if (c && typeof c.addEventListener === 'function') {
        add(c);
        attached.push(c);
      }
    });

    // trigger initial check
    handler();

    return () => {
      attached.forEach(remove);
    };
  }, []);

  useEffect(() => {
    if (floatingSearchOpen && floatingInputRef.current) {
      setTimeout(() => floatingInputRef.current.focus(), 80);
    }
  }, [floatingSearchOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
       //const response = await axios.get(API_BASE_URL + '/server/api/products.php');
      const response = await axios.get(`${API_BASE_URL}/server/api/products.php`);
      const data = response && response.data;
      if (Array.isArray(data)) setProducts(data);
      else if (data && Array.isArray(data.data)) setProducts(data.data);
      else if (data && Array.isArray(data.products)) setProducts(data.products);
      else if (data && typeof data === 'object' && Object.keys(data).length > 0) setProducts([data]);
      else setProducts([]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products. Please check the backend server.');
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsFormModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      //await axios.delete(`${API_BASE_URL}/server/api/products.php?id=${id}`);
      await axios.delete(`${API_BASE_URL}/server/api/products.php?id=${id}`);
      fetchProducts();
      setSelectedProducts(prev => prev.filter(x => x !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedProducts(products.map((p) => p.id));
    else setSelectedProducts([]);
  };

  const handleBulkBarcode = () => {
    if (selectedProducts.length === 0) return;
    setShowBarcodeModal(true);
  };

  const isLowStock = (product) => {
    const cur = Number(product.stock_level ?? product.stock ?? 0);
    const min = Number(product.min_stock_level ?? 0);
    return (min > 0 && cur <= min) || cur <= 0;
  };

  const lowStockCount = products.filter(isLowStock).length;

  const normalizedFilter = (product, term) => {
    if (filterLowStockOnly && !isLowStock(product)) return false;
    const name = product && product.name ? String(product.name).toLowerCase() : '';
    const sku = product && product.sku ? String(product.sku).toLowerCase() : '';
    const cat = product && product.category ? String(product.category).toLowerCase() : '';
    const termLow = term.trim().toLowerCase();
    if (!termLow) return true;
    return name.includes(termLow) || sku.includes(termLow) || cat.includes(termLow);
  };

  const filteredProducts = products.filter((p) => normalizedFilter(p, searchTerm));
  const barcodesToPrint = products.filter((p) => selectedProducts.includes(p.id));

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      try {
        const el = document.querySelector('main') || document.getElementById('root') || document.body;
        if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }
  };

  const openBulkEdit = () => {
    if (selectedProducts.length === 0) return;
    setBulkEdits({
      category: '',
      price: '',
      stockDelta: 0,
      stockMode: 'delta'
    });
    setBulkEditOpen(true);
  };

  const submitBulkEdit = async () => {
    if (selectedProducts.length === 0) return;
    setBulkUpdating(true);

    const errors = [];
    for (const id of selectedProducts) {
      try {
        const updateObj = {};
        if (bulkEdits.category) updateObj.category = bulkEdits.category;
        if (bulkEdits.price !== '') {
          const priceValue = Number(bulkEdits.price);
          if (!Number.isNaN(priceValue)) updateObj.price = priceValue;
        }
        if (bulkEdits.stockMode === 'set') {
          updateObj.stock = Number(bulkEdits.stockDelta) || 0;
        } else if (bulkEdits.stockMode === 'delta') {
          updateObj.stock_delta = Number(bulkEdits.stockDelta) || 0;
        }
        await axios.put(`${API_BASE_URL}/server/api/products.php?id=${id}`, updateObj, {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('Bulk update error for id', id, err);
        errors.push(id);
      }
    }

    setBulkUpdating(false);
    setBulkEditOpen(false);
    await fetchProducts();
    if (errors.length > 0) alert(`Bulk update completed with errors for ${errors.length} items.`);
    else setSelectedProducts([]);
  };

  if (loading) return <div className="text-center p-4">Loading products...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        
        {/* Mobile: Stacked Action Buttons */}
        <div className="flex flex-col space-y-2 md:hidden mb-4">
            <button
                onClick={handleSyncWithSMS}
                disabled={syncingSMS}
                className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md font-semibold transition-colors disabled:opacity-60"
            >
                <FaSync className={`mr-2 ${syncingSMS ? 'animate-spin' : ''}`} />
                {syncingSMS ? 'Syncing with SMS...' : 'Sync Catalog to SMS'}
            </button>
            <button onClick={onOpenBOM} className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md font-semibold">
                <FaHammer className="mr-2" /> Packing List & BOM Assembly
            </button>
            <button onClick={onRecordPurchase} className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-md">
                <FaShoppingCart className="mr-2" /> Record New Purchase
            </button>
            <button onClick={() => setShowBulkImportModal(true)} className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md">
                <FaFileImport className="mr-2" /> Bulk Import
            </button>
            <button onClick={handleBulkBarcode} disabled={selectedProducts.length === 0} className={`w-full flex items-center justify-center px-4 py-2 rounded-lg shadow-md ${selectedProducts.length === 0 ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}>
                <FaBarcode className="mr-2" /> Bulk Generate Barcodes
            </button>
            <button onClick={onAddProduct} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md">
                <FaPlus className="mr-2" /> Add New Product
            </button>
        </div>
        
        {/* Desktop: Horizontal Action Buttons */}
        <div className="hidden md:flex md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
              {lowStockCount > 0 && (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mt-1">
                  <FaExclamationTriangle className="text-amber-500" />
                  <span>{lowStockCount} product(s) at or below minimum inventory</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleSyncWithSMS}
                    disabled={syncingSMS}
                    className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md font-semibold transition-colors disabled:opacity-60"
                    title="Force full product catalog & price sync to SBR SMS"
                >
                    <FaSync className={`mr-2 ${syncingSMS ? 'animate-spin' : ''}`} />
                    {syncingSMS ? 'Syncing...' : 'Sync with SMS'}
                </button>
                <button onClick={onOpenBOM} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                    <FaHammer className="mr-2" /> BOM & Assembly
                </button>
                <button onClick={onRecordPurchase} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors">
                    <FaShoppingCart className="mr-2" /> Record Purchase
                </button>
                <button onClick={() => setShowBulkImportModal(true)} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors">
                    <FaFileImport className="mr-2" /> Bulk Import
                </button>
                <button onClick={handleBulkBarcode} disabled={selectedProducts.length === 0} className={`flex items-center px-4 py-2 rounded-lg shadow-md ${selectedProducts.length === 0 ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    <FaBarcode className="mr-2" /> Barcodes
                </button>
                <button onClick={onAddProduct} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <FaPlus className="mr-2" /> Add Product
                </button>
            </div>
        </div>

        {/* Sync Status Feedback Toast/Banner */}
        {syncStatus && (
          <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between text-sm font-medium ${
            syncStatus.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : syncStatus.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <FaSync className={syncStatus.type === 'success' ? 'text-green-600' : 'text-amber-600'} />
              <span>{syncStatus.message}</span>
            </div>
            <button onClick={() => setSyncStatus(null)} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>
        )}
        
        {/* Search, Filter & Quick Toggles */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Search products by name, SKU, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filterLowStockOnly
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border'
                }`}
            >
                <FaExclamationTriangle className="mr-2 text-xs" />
                <span>Low Stock ({lowStockCount})</span>
            </button>
        </div>

        <div className="flex justify-between items-center mb-4">
            <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={products.length > 0 && selectedProducts.length === products.length}
                />
                <span className="text-xs sm:text-sm">Select all</span>
            </label>
            {/* Desktop bulk edit button (visible on large screens) */}
            <button
                onClick={openBulkEdit}
                disabled={selectedProducts.length === 0}
                className={`hidden md:inline-flex items-center px-4 py-2 rounded-lg shadow-md transition-colors text-sm ${
                    selectedProducts.length === 0 ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
                title="Bulk edit selected rows"
            >
                Bulk Edit ({selectedProducts.length})
            </button>
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 text-center" />
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Min Threshold)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                        const low = isLowStock(product);
                        const curStock = Number(product.stock_level ?? product.stock ?? 0);
                        const minStock = Number(product.min_stock_level ?? 0);

                        return (
                            <tr key={product.id} className={low ? 'bg-amber-50/50' : ''}>
                                <td className="p-3 text-center">
                                    <input type="checkbox" className="w-4 h-4 rounded-full" checked={selectedProducts.includes(product.id)} onChange={() => handleProductSelection(product.id)} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{Number(product.price || 0).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-bold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                                            {curStock}
                                        </span>
                                        {minStock > 0 && (
                                            <span className="text-xs text-gray-500">
                                                (Min: {minStock})
                                            </span>
                                        )}
                                        {low && (
                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center space-x-1">
                                                <FaExclamationTriangle className="text-[10px]" />
                                                <span>Low</span>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.supplier_name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => handleEditProduct(product)} className="text-indigo-600 hover:text-indigo-800" title="Edit Product">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800" title="Delete Product">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredProducts.length === 0 && <div className="text-center py-6 text-gray-500">No products found.</div>}
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
            {filteredProducts.length === 0 && <div className="text-center py-6 text-gray-500">No products found.</div>}
            {filteredProducts.map((product) => {
                const low = isLowStock(product);
                const curStock = Number(product.stock_level ?? product.stock ?? 0);
                const minStock = Number(product.min_stock_level ?? 0);

                return (
                    <div key={product.id} className={`bg-white p-4 rounded-lg shadow-md border-t-4 ${low ? 'border-red-500 bg-red-50/20' : 'border-blue-600'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{product.name || '-'}</h3>
                                <p className="text-sm text-gray-600">SKU: {product.sku || '-'}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEditProduct(product)} className="text-blue-600">
                                    <FaEdit />
                                </button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600">
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 text-sm">
                            <p><span className="font-semibold">Category:</span> {product.category || '-'}</p>
                            <p><span className="font-semibold">Price:</span> ₹{Number(product.price || 0).toFixed(2)}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="font-semibold">Stock:</span>
                                <span className={`font-bold ${low ? 'text-red-600' : 'text-gray-900'}`}>{curStock}</span>
                                {minStock > 0 && <span className="text-xs text-gray-500">(Min: {minStock})</span>}
                                {low && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                        Low Stock
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 border-t pt-3">
                            <label className="flex items-center space-x-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => handleProductSelection(product.id)}
                                />
                                <span>Select</span>
                            </label>
                            <button
                                onClick={() => {
                                    if (!selectedProducts.includes(product.id)) handleProductSelection(product.id);
                                    setShowBarcodeModal(true);
                                }}
                                className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs flex items-center space-x-1"
                            >
                                <FaBarcode />
                                <span>Barcode</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Modals */}
      {isFormModalOpen && (
        <Modal onClose={() => {
          setIsFormModalOpen(false);
          setCurrentProduct(null);
        }}>
          <ProductForm
            initialData={currentProduct}
            onProductAdded={() => {
              setIsFormModalOpen(false);
              setCurrentProduct(null);
              fetchProducts();
              if (onDataChange) onDataChange();
            }}
          />
        </Modal>
      )}

      {showBarcodeModal && (
        <BarcodeModal
          barcodes={barcodesToPrint.map(p => ({ sku: p.sku, name: p.name }))}
          onClose={() => setShowBarcodeModal(false)}
          mode="print"
        />
      )}

      {showBulkImportModal && (
        <Modal onClose={() => setShowBulkImportModal(false)}>
          <ExcelImport
            type="products"
            title="Import Products / Inventory (Excel / CSV)"
            onImportComplete={() => {
              if (onDataChange) onDataChange();
            }}
          />
        </Modal>
      )}

      {bulkEditOpen && (
        <Modal onClose={() => setBulkEditOpen(false)}>
          <div className="max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Bulk Edit ({selectedProducts.length} items)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category (set)</label>
                <input type="text" value={bulkEdits.category} onChange={(e) => setBulkEdits((s) => ({ ...s, category: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (set)</label>
                <input type="number" value={bulkEdits.price} onChange={(e) => setBulkEdits((s) => ({ ...s, price: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <div className="mt-1 flex gap-2">
                  <select value={bulkEdits.stockMode} onChange={(e) => setBulkEdits((s) => ({ ...s, stockMode: e.target.value }))} className="border rounded px-3 py-2">
                    <option value="delta">Add (delta)</option>
                    <option value="set">Set absolute</option>
                  </select>
                  <input type="number" value={bulkEdits.stockDelta} onChange={(e) => setBulkEdits((s) => ({ ...s, stockDelta: e.target.value }))} className="flex-1 border rounded px-3 py-2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">If you choose "Add (delta)" enter +5 or -3 to increment or decrement stock.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button onClick={() => setBulkEditOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
              <button onClick={submitBulkEdit} disabled={bulkUpdating} className="px-4 py-2 rounded bg-yellow-600 text-white">
                {bulkUpdating ? 'Updating...' : 'Apply to selected'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating search button for mobile */}
      <div className="md:hidden">
          <button
            onClick={() => setFloatingSearchOpen(true)}
            className="fixed right-4 bottom-24 z-50 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
            aria-label="Search products"
          >
            <FaSearch className="w-6 h-6" />
          </button>
      </div>
      
      {/* Search overlay for mobile */}
      {floatingSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-lg shadow-lg">
                <div className="flex p-3 border-b">
                    <input
                        ref={floatingInputRef}
                        type="text"
                        placeholder="Search products..."
                        className="flex-1 pr-3 py-2 border-none focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={() => setFloatingSearchOpen(false)} className="p-2 text-gray-600">
                        <FaTimes />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* "Go to Top" button */}
      {showGoTop && (
        <button
          onClick={scrollToTop}
          aria-label="Go to top"
          style={{
            position: 'fixed',
            right: 16,
            bottom: goTopBottom,
            zIndex: 9999,
            width: 48,
            height: 48,
            borderRadius: 9999,
            background: '#1f2937',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
          }}
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
};

export default InventoryDashboard;