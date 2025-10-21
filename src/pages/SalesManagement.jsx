// src/pages/SalesManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileInvoiceDollar, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import InvoiceModal from '../components/common/InvoiceModal';
import Modal from '../components/common/Modal';

const SalesManagement = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();

    const API_BASE_URL = 'https://rajugariventures.com/sbr-pos';

    useEffect(() => {
        fetchSales();
        fetchCompanyInfo();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
    };

    const fetchSales = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/server/api/sales.php`);
            if (response.data && response.data.success) {
                const salesData = response.data.data.map(sale => ({
                    ...sale,
                    customer_name: sale.customer_name || 'Walk-in',
                    user_name: sale.user_name || 'N/A'
                }));
                setSales(salesData);
            } else {
                setSales([]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch sales data.');
            setLoading(false);
        }
    };
    
    const fetchCompanyInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/server/api/company_info.php`);
            const data = response.data;
            if (data && data.company_name) {
                setCompanyInfo({
                    name: data.company_name,
                    addressLine1: data.address,
                    addressLine2: data.address_line2,
                    phone: data.phone_number,
                    email: data.email,
                    gst: data.gstin,
                    logoUrl: data.logo_path,
                    default_print_format: data.default_print_format,
                });
            }
        } catch (err) {
            console.error('Failed to fetch company info:', err);
        }
    };
  
    const handleViewInvoice = async (sale) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/server/api/sales.php?id=${sale.id}`);
            if (response.data && response.data.success) {
                const saleData = response.data.sale || {};
                const itemsData = Array.isArray(response.data.items) ? response.data.items : [];

                const cart_items = itemsData.map(it => ({
                    name: it.name || it.product_name || it.title || it.product || "",
                    quantity: Number(it.quantity ?? it.qty ?? 1),
                    price: Number(it.price ?? it.unit_price ?? it.rate ?? it.amount ?? 0)
                }));

                const fullSaleData = {
                    ...saleData,
                    cart_items,
                    items: itemsData,
                    customer_name: saleData.customer_full_name || saleData.customer_name || 'Walk-in Customer',
                    gst_number: saleData.gstin || saleData.gst_number || null,
                };

                setSelectedInvoice(fullSaleData);
                setShowInvoiceModal(true);
            } else {
                console.error('Failed to fetch sale details:', response.data && response.data.message);
                setError('Failed to fetch invoice details.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch invoice details.');
        }
    };

    const handleEditSale = (sale) => {
        navigate(`/edit-sale/${sale.id}`);
    };

    const handleDeleteSale = async (saleId) => {
        if (window.confirm(`Are you sure you want to delete Sale ID ${saleId}? This action cannot be undone.`)) {
            try {
                await axios.delete(`${API_BASE_URL}/server/api/sales.php?id=${saleId}`);
                alert(`Sale ID ${saleId} deleted successfully.`);
                fetchSales();
            } catch (err) {
                console.error("Failed to delete sale:", err);
                alert("Failed to delete the sale. Please try again.");
            }
        }
    };
    
    const filteredSales = sales.filter(sale => 
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.user_name && sale.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (String(sale.id).includes(searchTerm))
    );

    if (loading) return <div className="text-center p-4">Loading sales history...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        // Add pb-24 to main container for mobile nav bar spacing
        <div className="p-4 bg-gray-100 min-h-screen md:bg-white md:rounded-lg md:shadow-md pb-24 md:pb-4"> 
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Sales History</h2>
                <div className="relative w-full sm:w-1/3">
                    <input 
                        type="text" 
                        placeholder="Search sales..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>
            
            {!isMobile && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSales.map(sale => (
                                <tr key={sale.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{sale.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.sale_date).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{sale.user_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{sale.customer_name || 'Walk-in'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleViewInvoice(sale)} className="text-blue-600 hover:text-blue-800 transition-colors">
                                            <FaFileInvoiceDollar />
                                        </button>
                                        <button onClick={() => handleEditSale(sale)} className="text-yellow-600 hover:text-yellow-800 transition-colors">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDeleteSale(sale.id)} className="text-red-600 hover:text-red-800 transition-colors">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isMobile && (
                <div className="space-y-4">
                    {filteredSales.map(sale => (
                        <div key={sale.id} className="bg-white p-4 rounded-lg shadow-md border-t-4 border-indigo-600">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-indigo-700">SALE ID: {sale.id}</span>
                                <span className="text-xs text-gray-500">{new Date(sale.sale_date).toLocaleString()}</span>
                            </div>
                            <div className="mt-2 text-xl font-bold text-gray-800">₹{parseFloat(sale.total_amount || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">Customer:</span> {sale.customer_name || 'Walk-in'}
                            </div>
                            <div className="text-sm text-gray-700">
                                <span className="font-semibold">Sold By:</span> {sale.user_name}
                            </div>
                            <div className="flex space-x-2 mt-4 text-sm font-semibold">
                                <button onClick={() => handleViewInvoice(sale)} className="flex-1 py-2 px-3 rounded-lg text-blue-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                                    <FaFileInvoiceDollar className="w-4 h-4" /> <span>View Invoice</span>
                                </button>
                                <button onClick={() => handleEditSale(sale)} className="flex-1 py-2 px-3 rounded-lg text-yellow-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                                    <FaEdit className="w-4 h-4" /> <span>Edit</span>
                                </button>
                                <button onClick={() => handleDeleteSale(sale.id)} className="flex-1 py-2 px-3 rounded-lg text-red-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                                    <FaTrash className="w-4 h-4" /> <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredSales.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No sales found.
                </div>
            )}
  
            {showInvoiceModal && selectedInvoice && companyInfo && (
                <Modal onClose={() => setShowInvoiceModal(false)}>
                    <InvoiceModal sale={selectedInvoice} company={companyInfo} onClose={() => setShowInvoiceModal(false)} onNewSale={() => {}} />
                </Modal>
            )}
        </div>
    );
};
  
export default SalesManagement;