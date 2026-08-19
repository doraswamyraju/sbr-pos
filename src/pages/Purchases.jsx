import { API_BASE_URL } from '../config';
// src/pages/Purchases.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaSpinner, FaTruck } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const Purchases = ({ userRole }) => {
    const currentUserRaw = localStorage.getItem('pos_user');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : {};
    const isAdmin = (currentUser.role || userRole || '').toString().toLowerCase().includes('admin');
    const canViewPrice = isAdmin || !!(currentUser.permissions?.can_view_purchase_price);

    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPurchase, setCurrentPurchase] = useState(null);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const purchaseResponse = await axios.get(`${API_BASE_URL}/server/api/purchase_history.php`);
            const suppliersResponse = await axios.get(`${API_BASE_URL}/server/api/suppliers.php`);
            const productsResponse = await axios.get(`${API_BASE_URL}/server/api/products.php`);
            setPurchases(Array.isArray(purchaseResponse.data) ? purchaseResponse.data : []);
            setSuppliers(Array.isArray(suppliersResponse.data) ? suppliersResponse.data : []);
            setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to fetch purchase history. Please check the backend server.');
            setLoading(false);
        }
    };

    const handleDeletePurchase = async (purchaseId) => {
        if (window.confirm("Are you sure you want to delete this purchase? This will revert stock levels.")) {
            try {
                await axios.delete(`${API_BASE_URL}/server/api/purchases.php?id=${purchaseId}`);
                alert('Purchase deleted successfully!');
                fetchData();
            } catch (error) {
                console.error('Error deleting purchase:', error);
                alert('Failed to delete purchase.');
            }
        }
    };

    const handleEditPurchase = async (purchase) => {
        setCurrentPurchase(purchase);
        setShowEditModal(true);
        
        const itemNames = (purchase.purchased_items || '').split(', ').map(item => item.trim());
        const items = itemNames.map(itemName => {
            const [quantity, ...nameParts] = itemName.split('x ');
            const name = nameParts.join('x ');
            const product = products.find(p => p.name === name);
            return {
                product_id: product ? product.id : '',
                quantity: parseInt(quantity) || 1,
                unit_price: product ? (product.price || 0) : 0
            };
        });
        setPurchaseItems(items.length ? items : [{ product_id: '', quantity: 1, unit_price: 0 }]);
        setSelectedSupplier(purchase.supplier_id || '');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                supplier_id: selectedSupplier,
                items: purchaseItems.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    unit_price: canViewPrice ? parseFloat(item.unit_price || 0) : 0
                }))
            };

            await axios.put(`${API_BASE_URL}/server/api/purchases.php?id=${currentPurchase.id}`, dataToSend);
            alert('Purchase updated successfully!');
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error('Error updating purchase:', error);
            alert('Failed to update purchase.');
        }
    };
    
    const handleAddPurchaseItem = () => {
        setPurchaseItems([...purchaseItems, { product_id: '', quantity: 1, unit_price: 0 }]);
    };

    const handleItemChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...purchaseItems];
        list[index][name] = value;
        
        // Auto-fill price if product changes
        if (name === 'product_id') {
            const prod = products.find(p => String(p.id) === String(value));
            if (prod) {
                list[index].unit_price = prod.price || 0;
            }
        }
        setPurchaseItems(list);
    };

    const handleRemoveItem = (index) => {
        const list = [...purchaseItems];
        list.splice(index, 1);
        setPurchaseItems(list);
    };

    if (loading) return <div className="text-center p-6"><FaSpinner className="animate-spin inline-block mr-2" /> Loading purchase history...</div>;
    if (error) return <div className="text-center p-6 text-red-600 font-semibold">{error}</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md pb-24 md:pb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <FaTruck className="mr-2 text-indigo-600" /> Purchase History & Stock Inward
                    </h2>
                    <p className="text-sm text-gray-500">Record incoming stock purchases from suppliers.</p>
                </div>
            </div>
            
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Received</th>
                            {canViewPrice && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            )}
                            {isAdmin && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {purchases.map(purchase => (
                            <tr key={purchase.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{purchase.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(purchase.purchase_date).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{purchase.supplier_name || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-800">{purchase.purchased_items || 'N/A'}</td>
                                {canViewPrice && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{parseFloat(purchase.total_amount || 0).toFixed(2)}</td>
                                )}
                                {isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleEditPurchase(purchase)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit Purchase">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeletePurchase(purchase.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Purchase">
                                            <FaTrash />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {purchases.length > 0 ? (
                    purchases.map(purchase => (
                        <div key={purchase.id} className="bg-gray-50 p-4 rounded-lg shadow-md border-t-4 border-indigo-600">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-indigo-700">Purchase #{purchase.id}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{new Date(purchase.purchase_date).toLocaleString()}</p>
                                </div>
                                {canViewPrice && (
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">₹{parseFloat(purchase.total_amount || 0).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Supplier:</span> {purchase.supplier_name || 'N/A'}</p>
                                <p className="mt-1"><span className="font-semibold">Items:</span> {purchase.purchased_items || 'N/A'}</p>
                            </div>
                            {isAdmin && (
                                <div className="flex space-x-2 mt-4 text-sm font-semibold border-t pt-4">
                                    <button onClick={() => handleEditPurchase(purchase)} className="flex-1 py-2 px-3 rounded-lg text-blue-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                                        <FaEdit className="w-4 h-4" /> <span>Edit</span>
                                    </button>
                                    <button onClick={() => handleDeletePurchase(purchase.id)} className="flex-1 py-2 px-3 rounded-lg text-red-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                                        <FaTrash className="w-4 h-4" /> <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No purchase history found.
                    </div>
                )}
            </div>

            {/* Edit Purchase Modal */}
            {showEditModal && currentPurchase && (
                <Modal onClose={() => setShowEditModal(false)}>
                    <h2 className="text-2xl font-bold mb-4">Edit Purchase #{currentPurchase.id}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="supplier" className="block text-gray-700 font-semibold mb-1">Supplier</label>
                            <select
                                id="supplier"
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="w-full p-2.5 border rounded-lg"
                            >
                                <option value="">Select a Supplier</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>
                                ))}
                            </select>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Items Received</h3>
                        {purchaseItems.map((item, index) => (
                            <div key={index} className="flex space-x-2 mb-3 items-end bg-gray-50 p-2 rounded border">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-700">Product</label>
                                    <select
                                        name="product_id"
                                        value={item.product_id}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-semibold text-gray-700">Quantity Added</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, e)}
                                        className="w-full p-2 border rounded-lg"
                                        min="1"
                                        required
                                    />
                                </div>
                                {canViewPrice && (
                                    <div className="w-1/3">
                                        <label className="block text-xs font-semibold text-gray-700">Unit Price (₹)</label>
                                        <input
                                            type="number"
                                            name="unit_price"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, e)}
                                            className="w-full p-2 border rounded-lg"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2 text-red-600 hover:text-red-800"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddPurchaseItem}
                            className="text-blue-600 font-semibold underline text-sm mb-4 block"
                        >
                            + Add another item
                        </button>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                            Update Purchase Record
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Purchases;