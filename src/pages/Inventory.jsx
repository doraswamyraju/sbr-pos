// src/pages/Inventory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InventoryDashboard from '../components/InventoryDashboard';
import PurchaseManagement from '../components/PurchaseManagement';
import Modal from '../components/common/Modal';
import ProductForm from '../components/ProductForm';

const Inventory = ({ currentUser }) => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showNewProductModal, setShowNewProductModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const productsResponse = await axios.get('/sbr-pos/server/api/products.php');
            const suppliersResponse = await axios.get('/sbr-pos/server/api/suppliers.php');
            // const productsResponse = await axios.get('http://localhost/pos-system/server/api/products.php');
            // const suppliersResponse = await axios.get('http://localhost/pos-system/server/api/suppliers.php');
            setProducts(productsResponse.data);
            setSuppliers(suppliersResponse.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to fetch products or suppliers. Please check the backend server.');
            setLoading(false);
        }
    };
    
    const getHeaderTitle = () => {
        if (!currentUser) return "Inventory";
        const role = (currentUser.role || '').toLowerCase();
        if (role.includes('admin')) {
            return "Admin Panel";
        }
        return "Inventory Management";
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow p-4">
                <h1 className="text-xl font-semibold">{getHeaderTitle()}</h1>
            </header>
            <main className="container mx-auto p-4 pb-28 md:pb-6">
                <InventoryDashboard 
                    onRecordPurchase={() => setShowPurchaseModal(true)}
                    products={products}
                    suppliers={suppliers}
                    onDataChange={fetchData}
                    onAddProduct={() => setShowNewProductModal(true)}
                />
            </main>
            
            {showPurchaseModal && (
                <PurchaseManagement 
                    products={products}
                    suppliers={suppliers}
                    onPurchaseComplete={() => {
                        fetchData();
                        setShowPurchaseModal(false);
                    }}
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}

            {showNewProductModal && (
                <Modal onClose={() => setShowNewProductModal(false)}>
                    <ProductForm
                        onProductAdded={fetchData}
                        initialData={null}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Inventory;