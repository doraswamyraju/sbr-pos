// src/pages/Suppliers.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [supplierData, setSupplierData] = useState({ 
        supplier_name: '', 
        contact_name: '', 
        phone_number: '', 
        email: '', 
        address: '' 
    });

    const API_BASE_URL = 'https://rajugariventures.com/sbr-pos';

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/server/api/suppliers.php`);
            setSuppliers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
            setError('Failed to fetch suppliers. Please check the backend server.');
            setLoading(false);
        }
    };

    const handleAddSupplier = () => {
        setCurrentSupplier(null);
        setSupplierData({ 
            supplier_name: '', 
            contact_name: '', 
            phone_number: '', 
            email: '', 
            address: '' 
        });
        setShowFormModal(true);
    };

    const handleEditSupplier = (supplier) => {
        setCurrentSupplier(supplier);
        setSupplierData({
            supplier_name: supplier.supplier_name,
            contact_name: supplier.contact_name,
            phone_number: supplier.phone_number,
            email: supplier.email,
            address: supplier.address
        });
        setShowFormModal(true);
    };

    const handleDeleteSupplier = async (supplierId) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try {
                await axios.delete(`${API_BASE_URL}/server/api/suppliers.php?id=${supplierId}`);
                alert('Supplier deleted successfully!');
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
                alert('Failed to delete supplier.');
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentSupplier) {
                // Edit supplier
                await axios.put(`${API_BASE_URL}/server/api/suppliers.php?id=${currentSupplier.id}`, supplierData);
                alert('Supplier updated successfully!');
            } else {
                // Add new supplier
                await axios.post(`${API_BASE_URL}/server/api/suppliers.php`, supplierData);
                alert('Supplier added successfully!');
            }
            setShowFormModal(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to save supplier.');
        }
    };

    if (loading) return <div className="text-center p-4">Loading suppliers...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Supplier Management</h2>
                <button
                    className="bg-primary-blue text-white px-4 py-2 rounded-lg flex items-center hover:bg-secondary-blue transition-colors"
                    onClick={handleAddSupplier}
                >
                    <FaPlus className="mr-2" /> Add New Supplier
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-200">
                        {suppliers.map(supplier => (
                            <tr key={supplier.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.supplier_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.contact_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.phone_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => handleEditSupplier(supplier)} className="text-primary-blue hover:text-secondary-blue transition-colors">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600 hover:text-red-800 transition-colors">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {suppliers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No suppliers found.
                </div>
            )}
            
            {/* Modal for Add/Edit Supplier */}
            {showFormModal && (
                <Modal onClose={() => setShowFormModal(false)}>
                    <h2 className="text-2xl font-bold mb-4">{currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="supplier_name" className="block text-gray-700">Supplier Name</label>
                            <input type="text" id="supplier_name" name="supplier_name" value={supplierData.supplier_name} onChange={(e) => setSupplierData({...supplierData, supplier_name: e.target.value})} required className="w-full p-2 border rounded-lg" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="contact_name" className="block text-gray-700">Contact Name</label>
                            <input type="text" id="contact_name" name="contact_name" value={supplierData.contact_name} onChange={(e) => setSupplierData({...supplierData, contact_name: e.target.value})} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="phone_number" className="block text-gray-700">Phone Number</label>
                            <input type="text" id="phone_number" name="phone_number" value={supplierData.phone_number} onChange={(e) => setSupplierData({...supplierData, phone_number: e.target.value})} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700">Email</label>
                            <input type="email" id="email" name="email" value={supplierData.email} onChange={(e) => setSupplierData({...supplierData, email: e.target.value})} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="address" className="block text-gray-700">Address</label>
                            <textarea id="address" name="address" value={supplierData.address} onChange={(e) => setSupplierData({...supplierData, address: e.target.value})} className="w-full p-2 border rounded-lg"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-primary-blue text-white py-3 rounded-lg font-bold hover:bg-secondary-blue">
                            {currentSupplier ? 'Update Supplier' : 'Add Supplier'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Suppliers;