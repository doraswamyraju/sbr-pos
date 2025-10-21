// src/components/PurchaseManagement.jsx
import React, { useState } from 'react';
import axios from 'axios';
import Modal from './common/Modal';
import { FaPlus, FaTrash, FaBarcode } from 'react-icons/fa';
import BarcodeModal from './BarcodeModal';

const PurchaseManagement = ({ products, suppliers, onPurchaseComplete, onClose }) => {
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([{ product_id: '', quantity: '', unit_price: '' }]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    const handleAddPurchaseItem = () => {
        setPurchaseItems([...purchaseItems, { product_id: '', quantity: '', unit_price: '' }]);
    };

    const handleItemChange = (index, event) => {
        const { name, value } = event.target;
        const list = [...purchaseItems];
        list[index][name] = value;
        setPurchaseItems(list);
    };

    const handleRemoveItem = (index) => {
        const list = [...purchaseItems];
        list.splice(index, 1);
        setPurchaseItems(list);
    };

    const handlePurchaseSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                supplier_id: selectedSupplier || null,
                items: purchaseItems.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            await axios.post('/sbr-pos/server/api/purchases.php', dataToSend);
            alert('Purchase recorded successfully!');
            onClose();
            setPurchaseItems([{ product_id: '', quantity: '', unit_price: '' }]);
            setSelectedSupplier('');
            onPurchaseComplete();
        } catch (error) {
            console.error('Error recording purchase:', error);
            alert('Failed to record purchase.');
        }
    };
    
    const handleBarcodeScanSuccess = async (scannedBarcode) => {
        try {
            const response = await axios.get(`/sbr-pos/server/api/barcode_lookup.php?sku=${scannedBarcode}`);
            const product = response.data;
            
            const existingItemIndex = purchaseItems.findIndex(item => item.product_id === product.id);

            if (existingItemIndex > -1) {
                const updatedItems = [...purchaseItems];
                updatedItems[existingItemIndex].quantity = parseInt(updatedItems[existingItemIndex].quantity) + 1;
                setPurchaseItems(updatedItems);
            } else {
                setPurchaseItems([...purchaseItems, {
                    product_id: product.id,
                    quantity: 1,
                    unit_price: product.purchase_price
                }]);
            }
            setShowBarcodeModal(false);
        } catch (error) {
            console.error('Error looking up product:', error);
            alert('Product not found for the scanned barcode.');
            setShowBarcodeModal(false);
        }
    };
    
    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold mb-4">Record New Purchase</h2>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowBarcodeModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                >
                    <FaBarcode className="mr-2" /> Scan Barcode
                </button>
            </div>
            <form onSubmit={handlePurchaseSubmit}>
                <div className="mb-4">
                    <label htmlFor="supplier" className="block text-gray-700">Supplier (Optional)</label>
                    <select
                        id="supplier"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                    >
                        <option value="">Select a Supplier</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>
                        ))}
                    </select>
                </div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                {purchaseItems.map((item, index) => (
                    <div key={index} className="flex space-x-2 mb-2 items-end">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-700">Product</label>
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
                        <div className="w-1/4">
                            <label className="block text-sm text-gray-700">Quantity</label>
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
                        <div className="w-1/4">
                            <label className="block text-sm text-gray-700">Unit Price</label>
                            <input
                                type="number"
                                name="unit_price"
                                value={item.unit_price}
                                onChange={(e) => handleItemChange(index, e)}
                                className="w-full p-2 border rounded-lg"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
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
                    className="text-blue-600 underline text-sm mb-4"
                >
                    Add another item
                </button>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                    Record Purchase
                </button>
            </form>

            {showBarcodeModal && (
                <BarcodeModal onClose={() => setShowBarcodeModal(false)} onScanSuccess={handleBarcodeScanSuccess} mode="scan" />
            )}
        </Modal>
    );
};

export default PurchaseManagement;