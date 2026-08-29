import { API_BASE_URL } from '../config';
// src/components/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BarcodeModal from './BarcodeModal';
import { FaBarcode } from 'react-icons/fa';

const ProductForm = ({ onProductAdded, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    stock_level: initialData?.stock_level || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    supplier_id: initialData?.supplier_id || ''
  });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [numBarcodes, setNumBarcodes] = useState(1);

  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      stock_level: initialData?.stock_level || '',
      sku: initialData?.sku || '',
      category: initialData?.category || '',
      supplier_id: initialData?.supplier_id || ''
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await axios.put(`${API_BASE_URL}/server/api/products.php?id=${initialData.id}`, formData);
        alert('Product updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/server/api/products.php`, formData);
        alert('Product added successfully!');
      }
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const serverMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save product. Please try again.';
      alert(`Failed to save product: ${serverMessage}`);
    }
  };

  const handlePrintBarcode = () => {
    if (formData.sku) {
      setShowBarcodeModal(true);
    } else {
      alert("Please add an SKU to print a barcode.");
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{initialData?.id ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="text-gray-700 font-semibold mb-1">Product Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="price" className="text-gray-700 font-semibold mb-1">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="stock_level" className="text-gray-700 font-semibold mb-1">Stock Level</label>
              <input
                type="number"
                id="stock_level"
                name="stock_level"
                value={formData.stock_level}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="sku" className="text-gray-700 font-semibold mb-1">SKU</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="category" className="text-gray-700 font-semibold mb-1">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="supplier_id" className="text-gray-700 font-semibold mb-1">Supplier ID</label>
              <input
                type="number"
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex flex-col">
              <label htmlFor="description" className="text-gray-700 font-semibold mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="numBarcodes" className="text-gray-700 font-semibold">Print Barcodes:</label>
              <input
                type="number"
                id="numBarcodes"
                value={numBarcodes}
                onChange={(e) => setNumBarcodes(e.target.value)}
                min="1"
                className="w-20 px-2 py-1 border rounded-lg"
              />
              <button
                type="button"
                onClick={handlePrintBarcode}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={!formData.sku}
              >
                <FaBarcode />
              </button>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {initialData?.id ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      {showBarcodeModal && (
        <BarcodeModal
          barcodes={Array(parseInt(numBarcodes) || 1).fill(formData)}
          onClose={() => setShowBarcodeModal(false)}
          mode="print"
        />
      )}
    </>
  );
};

export default ProductForm;