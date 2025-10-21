// src/pages/Customers.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaSearch } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerData, setCustomerData] = useState({ 
    full_name: '', 
    phone_number: '', 
    email: '', 
    address: '', 
    is_gst_registered: false,
    gstin: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetchCustomers();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const fetchCustomers = async () => {
    try {
       //const response = await axios.get('http://localhost/pos-system/server/api/customers.php');
      const response = await axios.get('/sbr-pos/server/api/customers.php');
      if (response.data.status === 'success') {
        setCustomers(response.data.data);
      } else {
        setError(response.data.message);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch customers. Please check the backend server.');
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setCurrentCustomer(null);
    setCustomerData({ 
      full_name: '', 
      phone_number: '', 
      email: '', 
      address: '', 
      is_gst_registered: false,
      gstin: ''
    });
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setCustomerData({ ...customer, is_gst_registered: customer.is_gst_registered == 1 ? true : false });
    setShowFormModal(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to mark this customer as inactive?')) {
      try {
        //const response = await axios.delete(`http://localhost/pos-system/server/api/customers.php?id=${customerId}`);
        const response = await axios.delete(`/sbr-pos/server/api/customers.php?id=${customerId}`);
        if (response.data.status === 'success') {
          setMessage('Customer marked as inactive successfully!');
          fetchCustomers();
        } else {
          setMessage(response.data.message);
        }
      } catch (err) {
        setMessage('Failed to mark customer as inactive.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError(null);

    if (customerData.is_gst_registered && !customerData.gstin) {
      setError("GST Number is mandatory for GST-registered customers.");
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (currentCustomer) {
        response = await axios.put(`/sbr-pos/server/api/customers.php?id=${currentCustomer.id}`, customerData);
      } else {
        response = await axios.post('/sbr-pos/server/api/customers.php', customerData);
      }
      //  response = await axios.put(`http://localhost/pos-system/server/api/customers.php?id=${currentCustomer.id}`, customerData);
      // } else {
      //   response = await axios.post('http://localhost/pos-system/server/api/customers.php', customerData);
      // }
      
      if (response.data.status === 'success') {
        setMessage(response.data.message);
        fetchCustomers();
        setShowFormModal(false);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone_number && customer.phone_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="text-center p-4"><FaSpinner className="animate-spin inline-block mr-2" /> Loading customers...</div>;
  if (error) return <div className="text-center p-4 text-red-600 font-semibold">{error}</div>;

  return (
    // Added pb-24 for mobile navigation bar spacing
    <div className="p-6 bg-white rounded-lg shadow-md pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <button 
          onClick={handleAddCustomer}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Add Customer
        </button>
      </div>
      {message && <div className="mb-4 text-center text-green-600 font-semibold">{message}</div>}
      {error && <div className="mb-4 text-center text-red-600 font-semibold">{error}</div>}

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search customers by name, phone, or email..."
          className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Registered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_gst_registered == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.is_gst_registered == 1 ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.gstin || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_active == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditCustomer(customer)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-gray-50 p-4 rounded-lg shadow-md border-t-4 border-blue-600">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{customer.full_name}</h3>
                  <p className="text-sm text-gray-600">{customer.phone_number}</p>
                  <p className="text-sm text-gray-600">{customer.email || 'N/A'}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEditCustomer(customer)} className="text-blue-600 p-1">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 p-1">
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="text-sm">
                <p>
                  <span className="font-semibold">GST Registered: </span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_gst_registered == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.is_gst_registered == 1 ? 'Yes' : 'No'}
                  </span>
                </p>
                {customer.is_gst_registered == 1 && (
                  <p className="mt-1"><span className="font-semibold">GSTIN:</span> {customer.gstin || 'N/A'}</p>
                )}
                <p className="mt-1">
                  <span className="font-semibold">Status: </span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.is_active == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.is_active == 1 ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No customers found.
          </div>
        )}
      </div>

      {showFormModal && (
        <Modal title={currentCustomer ? "Edit Customer" : "Add Customer"} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="full_name" className="block text-gray-700">Full Name</label>
              <input type="text" id="full_name" name="full_name" value={customerData.full_name} onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})} required className="w-full p-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label htmlFor="phone_number" className="block text-gray-700">Phone Number</label>
              <input type="tel" id="phone_number" name="phone_number" value={customerData.phone_number} onChange={(e) => setCustomerData({...customerData, phone_number: e.target.value})} required className="w-full p-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700">Email</label>
              <input type="email" id="email" name="email" value={customerData.email} onChange={(e) => setCustomerData({...customerData, email: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700">Address</label>
              <textarea id="address" name="address" value={customerData.address} onChange={(e) => setCustomerData({...customerData, address: e.target.value})} className="w-full p-2 border rounded-lg" rows="3"></textarea>
            </div>
            
            <div className="mb-4 flex items-center">
              <input 
                type="checkbox" 
                id="is_gst_registered" 
                name="is_gst_registered" 
                checked={customerData.is_gst_registered} 
                onChange={(e) => setCustomerData({...customerData, is_gst_registered: e.target.checked})} 
                className="mr-2"
              />
              <label htmlFor="is_gst_registered" className="text-gray-700">GST-Registered Customer</label>
            </div>

            {customerData.is_gst_registered && (
              <div className="mb-4">
                <label htmlFor="gstin" className="block text-gray-700">GST Number</label>
                <input 
                  type="text" 
                  id="gstin" 
                  name="gstin" 
                  value={customerData.gstin} 
                  onChange={(e) => setCustomerData({...customerData, gstin: e.target.value})} 
                  required={customerData.is_gst_registered}
                  className="w-full p-2 border rounded-lg" 
                />
                {customerData.is_gst_registered && !customerData.gstin && (
                  <p className="text-red-500 text-sm mt-1">This field is mandatory.</p>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? <><FaSpinner className="animate-spin mr-2" /> Saving...</> : (currentCustomer ? 'Update Customer' : 'Add Customer')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Customers;