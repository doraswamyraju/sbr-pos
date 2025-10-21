// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDollarSign, FaBoxes, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const salesRes = await axios.get('/sbr-pos/server/api/reports.php?type=sales');
      const inventoryRes = await axios.get('/sbr-pos/server/api/reports.php?type=inventory');
      const leadsRes = await axios.get('/sbr-pos/server/api/reports.php?type=leads');

      setReportData({
        sales: salesRes.data,
        inventory: inventoryRes.data,
        leads: leadsRes.data
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please check the backend server.');
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading reports...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  const { sales, inventory, leads } = reportData;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Business Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border-l-4 border-blue-600">
          <div>
            <h3 className="text-lg font-semibold text-gray-500">Total Sales Today</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{sales.total_sales_today}</p>
          </div>
          <FaDollarSign className="text-4xl text-blue-600" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border-l-4 border-green-500">
          <div>
            <h3 className="text-lg font-semibold text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.total_products}</p>
          </div>
          <FaBoxes className="text-4xl text-green-500" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border-l-4 border-yellow-500">
          <div>
            <h3 className="text-lg font-semibold text-gray-500">Leads Converted</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{leads.converted_leads}</p>
          </div>
          <FaChartLine className="text-4xl text-yellow-500" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border-l-4 border-red-500">
          <div>
            <h3 className="text-lg font-semibold text-gray-500">Low Stock Items</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.low_stock_count}</p>
          </div>
          <FaArrowDown className="text-4xl text-red-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Daily Sales Trend</h3>
          {/* Placeholder for chart */}
          <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Top Selling Products</h3>
          <ul className="divide-y divide-gray-200">
            {sales.top_selling_products.length > 0 ? (
              sales.top_selling_products.map((product, index) => (
                <li key={product.product_name || index} className="py-2 flex justify-between items-center">
                  <span className="text-gray-700">{product.product_name}</span>
                  <span className="text-gray-500">{product.total_quantity_sold} units</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500">No sales data available.</li>
            )}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Low Stock Items</h3>
          <ul className="divide-y divide-gray-200">
            {inventory.low_stock_items.length > 0 ? (
              inventory.low_stock_items.map(item => (
                <li key={item.id} className="py-2 flex justify-between">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-red-500 font-semibold">Qty: {item.stock_level}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-gray-500">No low stock items.</li>
            )}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Lead Conversion Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">Converted Leads:</span>
            <span className="font-semibold">{leads.converted_leads}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Total Leads:</span>
            <span className="font-semibold">{leads.total_leads}</span>
          </div>
          <div className="mt-4 text-center">
            <p className="text-4xl font-bold text-blue-600">
              {leads.total_leads > 0 ? ((leads.converted_leads / leads.total_leads) * 100).toFixed(2) + '%' : '0%'}
            </p>
            <p className="text-gray-500 mt-1">Conversion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;