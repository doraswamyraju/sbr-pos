import { API_BASE_URL } from '../config';
// src/components/BOMManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBoxes,
  FaCogs,
  FaHistory,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHammer,
  FaTimes,
  FaSearch
} from 'react-icons/fa';

const BOMManagement = ({ allProducts = [], onDataChange, onClose }) => {
  const [activeTab, setActiveTab] = useState('assemble'); // 'assemble' | 'lists' | 'logs'
  const [boms, setBoms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Assemble Modal state
  const [selectedProductForAssemble, setSelectedProductForAssemble] = useState(null);
  const [assembleBomDetails, setAssembleBomDetails] = useState(null);
  const [assembleQty, setAssembleQty] = useState(1);
  const [assembleNotes, setAssembleNotes] = useState('');
  const [assembling, setAssembling] = useState(false);

  // Packing List Builder Modal state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderProductSource, setBuilderProductSource] = useState('existing'); // 'existing' | 'new'
  const [selectedFinishedProductId, setSelectedFinishedProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Finished Goods');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [packingComponents, setPackingComponents] = useState([]); // [{ component_product_id, quantity }]
  const [savingPackingList, setSavingPackingList] = useState(false);

  useEffect(() => {
    fetchPackingLists();
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchPackingLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/server/api/assembly.php`);
      setBoms(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Packing Lists.');
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/server/api/assembly.php?action=logs`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAssembleModal = async (product) => {
    setSelectedProductForAssemble(product);
    setAssembleQty(1);
    setAssembleNotes('');
    setAssembleBomDetails(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/server/api/assembly.php?action=get_bom&product_id=${product.id}`);
      setAssembleBomDetails(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load Packing List components for this product.');
    }
  };

  const handleExecuteAssemble = async (e) => {
    e.preventDefault();
    if (!selectedProductForAssemble || assembleQty <= 0) return;

    if (assembleBomDetails && assembleQty > assembleBomDetails.max_producible_units) {
      if (!window.confirm(`Warning: You requested ${assembleQty} units, but stock is only available for ${assembleBomDetails.max_producible_units} units. Proceeding will fail unless stock is replenished. Continue?`)) {
        return;
      }
    }

    setAssembling(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/server/api/assembly.php?action=assemble`, {
        finished_product_id: selectedProductForAssemble.id,
        quantity: parseInt(assembleQty, 10),
        notes: assembleNotes
      });

      setSuccessMsg(`Successfully assembled ${assembleQty} unit(s) of ${selectedProductForAssemble.name}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setSelectedProductForAssemble(null);
      fetchPackingLists();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to assemble product.';
      if (err.response?.data?.shortages) {
        const shortList = err.response.data.shortages.map(s => `• ${s.component}: Need ${s.required}, have ${s.available} (Short by ${s.shortage})`).join('\n');
        alert(`${msg}\n\nShortage Breakdown:\n${shortList}`);
      } else {
        alert(msg);
      }
    } finally {
      setAssembling(false);
    }
  };

  // Open builder for an existing product
  const openEditPackingList = async (product) => {
    setBuilderProductSource('existing');
    setSelectedFinishedProductId(product.id);
    setNewProductName('');
    setNewProductSku('');
    setNewProductCategory('Finished Goods');
    setNewProductPrice('');
    setPackingComponents([]);
    setShowBuilderModal(true);

    try {
      const res = await axios.get(`${API_BASE_URL}/server/api/assembly.php?action=get_bom&product_id=${product.id}`);
      if (res.data?.components) {
        setPackingComponents(res.data.components.map(c => ({
          component_product_id: c.component_product_id,
          quantity: c.required_qty
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open builder for creating a brand new product packing list
  const openNewProductPackingList = () => {
    setBuilderProductSource('new');
    setSelectedFinishedProductId('');
    setNewProductName('');
    setNewProductSku('');
    setNewProductCategory('Finished Goods');
    setNewProductPrice('');
    setPackingComponents([]);
    setShowBuilderModal(true);
  };

  const addComponentRow = () => {
    const currentFinishedId = builderProductSource === 'existing' ? parseInt(selectedFinishedProductId) : null;
    const available = allProducts.find(p => p.id !== currentFinishedId && !packingComponents.some(rc => rc.component_product_id === p.id));
    if (!available) {
      alert('No more unique products available in inventory to add.');
      return;
    }
    setPackingComponents(prev => [...prev, { component_product_id: available.id, quantity: 1 }]);
  };

  const updateComponentRow = (index, field, value) => {
    setPackingComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeComponentRow = (index) => {
    setPackingComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePackingList = async (e) => {
    e.preventDefault();

    if (builderProductSource === 'new') {
      if (!newProductName.trim()) {
        alert('Please enter a name for the new finished product.');
        return;
      }
    } else {
      if (!selectedFinishedProductId) {
        alert('Please select a product from inventory.');
        return;
      }
    }

    if (packingComponents.length === 0) {
      if (!window.confirm('No components added. This will clear the packing list. Continue?')) {
        return;
      }
    }

    setSavingPackingList(true);
    try {
      const payload = {
        finished_product_id: builderProductSource === 'existing' ? parseInt(selectedFinishedProductId) : 0,
        new_product_name: builderProductSource === 'new' ? newProductName.trim() : '',
        new_product_sku: builderProductSource === 'new' ? newProductSku.trim() : '',
        new_product_category: builderProductSource === 'new' ? newProductCategory.trim() : '',
        new_product_price: builderProductSource === 'new' ? parseFloat(newProductPrice) || 0 : 0,
        components: packingComponents
      };

      await axios.post(`${API_BASE_URL}/server/api/assembly.php?action=save_bom`, payload);

      const targetName = builderProductSource === 'new'
        ? newProductName
        : (allProducts.find(p => p.id === parseInt(selectedFinishedProductId))?.name || 'Product');

      setSuccessMsg(`Packing List saved successfully for ${targetName}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setShowBuilderModal(false);
      fetchPackingLists();
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save packing list.');
    } finally {
      setSavingPackingList(false);
    }
  };

  // Filter products for lists tab
  const filteredProducts = allProducts.filter(p =>
    !searchTerm ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter boms for assemble tab
  const filteredBoms = boms.filter(b =>
    !searchTerm ||
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.sku && b.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl p-2 sm:p-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <FaBoxes className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Packing List & Assembly</h2>
            <p className="text-sm text-gray-500">Create component packing lists & assemble finished products with live inventory tracking</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 animate-fade-in">
          <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2 animate-fade-in">
          <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 border-b border-gray-200 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('assemble')}
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'assemble'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaBoxes className="mr-2" /> Assemble Stock ({boms.length})
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'lists'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaCogs className="mr-2" /> Packing Lists ({allProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaHistory className="mr-2" /> Packing List History
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab !== 'logs' && (
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            </div>
          )}

          <button
            onClick={openNewProductPackingList}
            className="flex items-center whitespace-nowrap px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all"
          >
            <FaPlus className="mr-1.5 text-xs" /> + New Packing List
          </button>
        </div>
      </div>

      {/* TAB 1: ASSEMBLE FINISHED PRODUCTS */}
      {activeTab === 'assemble' && (
        <div className="mt-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-start space-x-2">
            <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
            <span>
              When you assemble a finished product, component stock is verified, raw components are automatically deducted from POS inventory, and finished goods stock is incremented.
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading Packing Lists...</div>
          ) : filteredBoms.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <FaBoxes className="mx-auto text-4xl text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No Packing Lists configured yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
                Define the component packing list for your finished products or RO combos to start assembling stock.
              </p>
              <button
                onClick={openNewProductPackingList}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                + Create First Packing List
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBoms.map((item) => {
                const canProduce = item.max_producible_units > 0;
                return (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{item.name}</h4>
                          <span className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</span>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-800 font-semibold rounded-full">
                          {item.component_count} Components
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm bg-gray-50 p-2.5 rounded-lg">
                        <div>
                          <span className="text-xs text-gray-500 block">Current Stock</span>
                          <span className="font-bold text-gray-800 text-base">{item.stock_level ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Can Assemble</span>
                          <span className={`font-bold text-base ${canProduce ? 'text-emerald-600' : 'text-red-500'}`}>
                            {item.max_producible_units} units
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <button
                        onClick={() => openAssembleModal(item)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-colors ${
                          canProduce
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <FaHammer />
                        <span>Assemble Stock</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKING LISTS */}
      {activeTab === 'lists' && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">All Finished Products & Combos</h3>
            <span className="text-sm text-gray-500">Showing {filteredProducts.length} product(s)</span>
          </div>

          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name & SKU</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Packing List Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-gray-500">
                      No products match your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const bomInfo = boms.find(b => b.id === p.id);
                    const hasBom = !!bomInfo;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          {p.sku && <span className="inline-block text-xs text-gray-500 font-normal">SKU: {p.sku}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{p.category || 'General'}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{p.stock_level ?? 0}</td>
                        <td className="px-5 py-3.5 text-sm">
                          {hasBom ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Configured ({bomInfo.component_count} parts)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              No Packing List
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right">
                          <button
                            onClick={() => openEditPackingList(p)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                              hasBom
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {hasBom ? 'Edit Packing List' : '+ Create Packing List'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASSEMBLY HISTORY */}
      {activeTab === 'logs' && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Assembly Run History</h3>
            <button onClick={fetchLogs} className="text-sm text-indigo-600 hover:underline font-semibold">Refresh Logs</button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">No assembly runs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto border rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Finished Product</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity Assembled</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assembled By</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{log.finished_product_name || `Product #${log.finished_product_id}`}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">+{log.quantity_assembled} units</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{log.assembled_by_name || 'System Admin'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ASSEMBLE MODAL */}
      {selectedProductForAssemble && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center space-x-2">
                <FaHammer className="text-emerald-600 text-xl" />
                <h3 className="text-xl font-bold text-gray-800">Assemble {selectedProductForAssemble.name}</h3>
              </div>
              <button onClick={() => setSelectedProductForAssemble(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            {assembleBomDetails ? (
              <form onSubmit={handleExecuteAssemble} className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Required Components per unit:</h4>
                  <div className="space-y-2">
                    {assembleBomDetails.components.map((c) => {
                      const totalNeeded = c.required_qty * assembleQty;
                      const hasEnough = c.current_stock >= totalNeeded;
                      return (
                        <div key={c.component_product_id} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                          <div>
                            <span className="font-medium text-gray-900">{c.component_name}</span>
                            <span className="text-xs text-gray-500 block">Required: {c.required_qty} / unit</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Need: {totalNeeded} | Stock: {c.current_stock}</span>
                            <span className={`block text-xs font-bold ${hasEnough ? 'text-emerald-600' : 'text-red-500'}`}>
                              {hasEnough ? '✓ Sufficient' : `✗ Short by ${totalNeeded - c.current_stock}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2 border-t flex justify-between items-center font-bold text-sm">
                    <span>Max Assembly Capacity Now:</span>
                    <span className="text-emerald-600 text-base">{assembleBomDetails.max_producible_units} units</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity to Produce / Assemble</label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, assembleBomDetails.max_producible_units)}
                    value={assembleQty}
                    onChange={(e) => setAssembleQty(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Production Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Batch #101, assembled for customer order"
                    value={assembleNotes}
                    onChange={(e) => setAssembleNotes(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedProductForAssemble(null)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assembling || assembleBomDetails.max_producible_units === 0}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center space-x-2"
                  >
                    {assembling ? <span>Assembling...</span> : <span>Confirm & Assemble Stock</span>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center text-gray-500">Loading Packing List details...</div>
            )}
          </div>
        </div>
      )}

      {/* PACKING LIST BUILDER MODAL (Supports both New and Existing finished products) */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Configure Packing List</h3>
                <span className="text-xs text-gray-500">Define raw materials and spare parts required for the finished product</span>
              </div>
              <button onClick={() => setShowBuilderModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSavePackingList} className="mt-4 space-y-4">
              {/* Product Selection Mode Picker */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setBuilderProductSource('existing')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    builderProductSource === 'existing'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Select from Existing Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderProductSource('new')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    builderProductSource === 'new'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  + Create New Finished Product
                </button>
              </div>

              {/* Section 1: Finished Product Details */}
              {builderProductSource === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Finished Product</label>
                  <select
                    value={selectedFinishedProductId}
                    onChange={(e) => setSelectedFinishedProductId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                    required
                  >
                    <option value="">-- Choose a Product from Inventory --</option>
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ''} - Current Stock: {p.stock_level ?? 0}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">New Finished Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 100 LPD Solar Water Heater System / Complete RO Unit"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">SKU (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SWH-100L"
                      value={newProductSku}
                      onChange={(e) => setNewProductSku(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Solar Heaters / RO Systems"
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Component Parts List */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Component Parts in Packing List ({packingComponents.length})
                  </label>
                  <span className="text-xs text-gray-500">Pick raw parts and required quantity per 1 unit</span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {packingComponents.map((comp, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Component Part</label>
                        <select
                          value={comp.component_product_id}
                          onChange={(e) => updateComponentRow(idx, 'component_product_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                          required
                        >
                          {allProducts
                            .filter(p => builderProductSource === 'new' || p.id !== parseInt(selectedFinishedProductId))
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level ?? 0})</option>
                            ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-500 block mb-1">Qty Required</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={comp.quantity}
                          onChange={(e) => updateComponentRow(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold"
                          required
                        />
                      </div>
                      <div className="pt-5">
                        <button
                          type="button"
                          onClick={() => removeComponentRow(idx)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Remove Component"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addComponentRow}
                  className="w-full mt-3 py-2.5 border-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <FaPlus className="text-xs" />
                  <span>Add Component Part to Packing List</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPackingList}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 text-sm shadow-md"
                >
                  {savingPackingList ? 'Saving...' : 'Save Packing List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMManagement;
