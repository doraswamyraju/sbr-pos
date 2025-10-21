// src/pages/EditSale.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

const EditSale = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isGstCustomer, setIsGstCustomer] = useState(false);
    const [gstInputValue, setGstInputValue] = useState('');

    const [productSearchTerm, setProductSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [saleRes, customersRes, productsRes] = await Promise.all([
                    axios.get(`/sbr-pos/server/api/sales.php?id=${id}`),
                    axios.get("/sbr-pos/server/api/customers.php"),
                    axios.get("/sbr-pos/server/api/products.php")
                ]);

                // Set initial customers and products lists FIRST to avoid the filter error
                setCustomers(customersRes.data.data);
                setProducts(productsRes.data.products || productsRes.data.data || productsRes.data.items);

                // Set initial sale data
                if (saleRes.data.success && saleRes.data.sale) {
                    const saleData = saleRes.data.sale;
                    const itemsData = saleRes.data.items || [];
                    setSale(saleData);
                    setCart(itemsData.map(item => ({
                        id: item.product_id,
                        name: item.product_name,
                        quantity: Number(item.quantity),
                        price: Number(item.price)
                    })));
                    setDiscount(Number(saleData.discount) || 0);

                    // Set initial customer details
                    const initialCustomer = customersRes.data.data.find(c => String(c.id) === String(saleData.customer_id));
                    if (initialCustomer) {
                        setSelectedCustomer(initialCustomer);
                        setIsGstCustomer(initialCustomer.is_gst_registered == 1);
                        setGstInputValue(initialCustomer.gstin || '');
                    } else {
                        // If customer is 'Walk-in' or not found, use sale data
                        setSelectedCustomer({
                            full_name: saleData.customer_name || 'Walk-in Customer',
                            is_gst_registered: saleData.is_gst_customer == 1,
                            gstin: saleData.gst_number || ''
                        });
                        setIsGstCustomer(saleData.is_gst_customer == 1);
                        setGstInputValue(saleData.gst_number || '');
                    }
                } else {
                    setError('Sale not found.');
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to fetch sale details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleUpdateQuantity = (productId, newQuantity) => {
        const value = newQuantity === '' ? '' : Number(newQuantity);
        if (isNaN(value)) return;
        setCart(cart.map(item =>
            String(item.id) === String(productId) ? { ...item, quantity: value } : item
        ));
    };

    const handleUpdatePrice = (productId, newPrice) => {
        const value = newPrice === '' ? '' : Number(newPrice);
        if (isNaN(value)) return;
        setCart(cart.map(item =>
            String(item.id) === String(productId) ? { ...item, price: value } : item
        ));
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => String(item.id) !== String(productId)));
    };

    const handleAddProduct = (product, quantity = 1) => {
        const existing = cart.find(item => String(item.id) === String(product.id));
        if (existing) {
            setCart(cart.map(item =>
                String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item
            ));
        } else {
            setCart([...cart, {
                id: product.id,
                name: product.name || product.title,
                price: Number(product.price || product.sale_price),
                quantity: quantity
            }]);
        }
        setProductSearchTerm('');
    };

    const handleSave = async () => {
        if (cart.length === 0) {
            alert("Cannot save an empty sale.");
            return;
        }

        const payload = {
            sale_id: id,
            customer_id: selectedCustomer?.id || null,
            customer_name: selectedCustomer?.full_name || selectedCustomer?.name || 'Walk-in Customer',
            is_gst_customer: isGstCustomer,
            gst_number: isGstCustomer ? (selectedCustomer?.gstin || gstInputValue) : null,
            cart_items: cart,
            discount: discount
        };

        try {
            const response = await axios.put(`/sbr-pos/server/api/edit_sale.php`, payload);
            if (response.data.success) {
                alert('Sale updated successfully!');
                navigate('/sales-management');
            } else {
                alert(`Failed to update sale: ${response.data.message}`);
            }
        } catch (err) {
            console.error('Failed to update sale:', err);
            alert('Failed to update sale. Please check console for details.');
        }
    };

    const filteredCustomers = (customers || []).filter(c =>
        (c.full_name?.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
        (c.phone_number?.toLowerCase().includes(customerSearchTerm.toLowerCase()))
    );

    const filteredProducts = (products || []).filter(p =>
        (p.name?.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
        (p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()))
    );

    const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const payable = Math.max(0, subtotal - Number(discount || 0));

    if (loading) return <div className="p-4 text-center">Loading sale details...</div>;
    if (error) return <div className="p-4 text-red-600 text-center">{error}</div>;

    return (
        <div className="p-4 bg-gray-100 min-h-screen md:bg-white md:rounded-lg md:shadow-md pb-24 md:pb-4">
            <h2 className="text-2xl font-bold mb-4">Edit Sale #{id}</h2>
            <div className="mb-4 space-y-4">
                {/* Customer Section */}
                <div className="bg-white border-t-4 border-indigo-600 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
                    <div className="flex gap-2 mb-2">
                        <input
                            className="flex-1 p-2 border rounded"
                            placeholder="Search customer..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        />
                        {selectedCustomer && (
                            <button onClick={() => setSelectedCustomer(null)} className="px-3 rounded bg-red-600 text-white">Clear</button>
                        )}
                    </div>
                    {customerSearchTerm && (
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded">
                            {filteredCustomers.map(c => (
                                <div key={c.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedCustomer(c); setCustomerSearchTerm(""); }}>
                                    <div className="font-semibold">{c.full_name ?? c.name}</div>
                                    <div className="text-xs text-gray-600">{c.phone_number ?? c.phone}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedCustomer && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                            <div className="font-semibold">{selectedCustomer.full_name ?? selectedCustomer.name}</div>
                            <div className="text-sm text-gray-600">{selectedCustomer.phone_number ?? selectedCustomer.phone}</div>
                            {selectedCustomer.gstin && <div className="text-xs text-gray-600 mt-1">GST: {selectedCustomer.gstin}</div>}
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                        <input type="checkbox" checked={isGstCustomer} onChange={(e) => setIsGstCustomer(e.target.checked)} />
                        <label>GST-registered customer?</label>
                    </div>
                    {isGstCustomer && !selectedCustomer?.gstin && (
                        <div className="mt-2">
                            <input
                                placeholder="Enter GST Number"
                                value={gstInputValue}
                                onChange={(e) => setGstInputValue(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    )}
                </div>

                {/* Products Section */}
                <div className="bg-white border-t-4 border-indigo-600 p-4 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-2">Cart</h3>
                    <div className="flex gap-2 mb-2">
                        <input
                            className="flex-1 p-2 border rounded"
                            placeholder="Search and add products..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                        {/* The search button is part of the form, it doesn't need to do anything specific as the input handles the filtering */}
                        <button type="button" className="px-3 rounded bg-blue-600 text-white"><FaSearch /></button>
                    </div>
                    {productSearchTerm && (
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center" onClick={() => handleAddProduct(p)}>
                                    <div>{p.name || p.title}</div>
                                    <div className="text-sm text-gray-600">₹{(Number(p.price) || 0).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <ul className="space-y-3 mt-4">
                        {cart.map(item => (
                            <li key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-sm text-gray-600">₹{(Number(item.price)||0).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                        className="w-20 text-center border rounded-lg"
                                        min="0"
                                    />
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                        className="w-16 text-center border rounded-lg"
                                        min="1"
                                    />
                                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-600">
                                        <FaTrash />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {cart.length === 0 && (
                        <div className="text-center text-gray-500 py-4">No items in cart.</div>
                    )}
                </div>
            </div>

            <div className="bg-white border-t-4 border-indigo-600 p-4 rounded-lg shadow-md">
                <div className="mb-3">
                    <label className="block font-semibold">Discount</label>
                    <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg"
                    />
                </div>
                <div className="flex justify-between font-bold text-lg mb-3">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl mb-6">
                    <span>Payable:</span>
                    <span>₹{payable.toFixed(2)}</span>
                </div>
                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold"
                >
                    Save Changes
                </button>
                <button
                    onClick={() => navigate('/sales-management')}
                    className="w-full py-3 mt-2 border rounded-lg font-bold"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default EditSale;