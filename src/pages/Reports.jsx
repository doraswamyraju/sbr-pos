import { API_BASE_URL } from '../config';
// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaDollarSign, FaBoxes, FaChartLine, FaExclamationTriangle, 
  FaCalendarAlt, FaDownload, FaSpinner, FaShoppingCart, FaUserCheck 
} from 'react-icons/fa';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('7days');

  useEffect(() => {
    fetchReports();
  }, [filterPeriod]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, inventoryRes, leadsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/server/api/reports.php?type=sales`),
        axios.get(`${API_BASE_URL}/server/api/reports.php?type=inventory`),
        axios.get(`${API_BASE_URL}/server/api/reports.php?type=leads`)
      ]);

      setReportData({
        sales: salesRes.data || {},
        inventory: inventoryRes.data || {},
        leads: leadsRes.data || {}
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const { sales, inventory, leads } = reportData;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Sales Today,₹${sales.total_sales_today || 0}\n`;
    csvContent += `Sales This Month,₹${sales.total_sales_month || 0}\n`;
    csvContent += `Total Revenue All Time,₹${sales.total_revenue || 0}\n`;
    csvContent += `Total Products,${inventory.total_products || 0}\n`;
    csvContent += `Inventory Total Value,₹${inventory.total_value || 0}\n`;
    csvContent += `Low Stock Count,${inventory.low_stock_count || 0}\n`;
    csvContent += `Total Leads,${leads.total_leads || 0}\n`;
    csvContent += `Converted Leads,${leads.converted_leads || 0}\n`;
    csvContent += `Conversion Rate,${leads.conversion_rate || 0}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POS_Business_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-600">
        <FaSpinner className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="font-semibold text-lg">Loading business analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg text-center max-w-lg mx-auto border border-red-100 mt-10">
        <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Reports</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchReports} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all">
          Retry
        </button>
      </div>
    );
  }

  const { sales, inventory, leads } = reportData || {};
  const maxTrendTotal = Math.max(...(sales.sales_trend || []).map(t => t.total), 1);

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Executive Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time performance metrics, inventory valuation, and lead conversion insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            <FaDownload className="text-xs" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sales Today</span>
            <div className="text-2xl font-black text-blue-600 mt-1">₹{(sales.total_sales_today || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-500 mt-1">Month Total: ₹{(sales.total_sales_month || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FaDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Inventory Items</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{inventory.total_products || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Value: ₹{(inventory.total_value || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FaBoxes className="w-6 h-6" />
          </div>
        </div>

        {/* Lead Conversion */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lead Conversion Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{leads.conversion_rate || 0}%</div>
            <div className="text-xs text-gray-500 mt-1">{leads.converted_leads || 0} of {leads.total_leads || 0} leads</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FaUserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Low Stock Alerts</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{inventory.low_stock_count || 0}</div>
            <div className="text-xs text-rose-500 font-semibold mt-1">Requires reorder</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <FaExclamationTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">7-Day Sales Performance Trend</h3>
              <p className="text-xs text-gray-500">Daily revenue breakdown for the past week.</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">Last 7 Days</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
            {(sales.sales_trend || []).map((trend, idx) => {
              const heightPercent = Math.max(10, Math.round((trend.total / maxTrendTotal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[11px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    ₹{trend.total.toLocaleString('en-IN')}
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300 shadow-sm"
                  />
                  <div className="text-[11px] font-semibold text-gray-500 mt-2 truncate w-full text-center">
                    {trend.date}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Total Revenue Recorded: <strong className="text-gray-900">₹{(sales.total_revenue || 0).toLocaleString('en-IN')}</strong></span>
            <span>Est. Profit Margin: <strong className="text-emerald-600">₹{(sales.total_profit || 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Lead Conversion Funnel</h3>
            <p className="text-xs text-gray-500 mb-6">CRM lead acquisition to sale ratio.</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Total Leads Captured</span>
                  <span>{leads.total_leads || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Contacted / Qualified</span>
                  <span>{leads.contacted_leads || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${leads.total_leads ? Math.round((leads.contacted_leads / leads.total_leads) * 100) : 0}%` }} 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Converted Sales</span>
                  <span>{leads.converted_leads || 0}</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${leads.total_leads ? Math.round((leads.converted_leads / leads.total_leads) * 100) : 0}%` }} 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl text-center border border-blue-100/60 mt-6">
            <div className="text-3xl font-black text-blue-600">{leads.conversion_rate || 0}%</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-0.5">Overall Conversion Rate</div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Top 5 Selling Products</span>
            <FaShoppingCart className="text-gray-400 text-sm" />
          </h3>
          <div className="divide-y divide-gray-100">
            {(sales.top_selling_products || []).length > 0 ? (
              (sales.top_selling_products || []).map((product, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">{product.product_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-gray-900">{product.total_quantity_sold} units</span>
                    {product.total_sales_val && (
                      <div className="text-xs text-blue-600 font-semibold">₹{product.total_sales_val.toLocaleString('en-IN')}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">No product sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Low Stock Items Watchlist</span>
            <FaExclamationTriangle className="text-rose-500 text-sm" />
          </h3>
          <div className="divide-y divide-gray-100">
            {(inventory.low_stock_items || []).length > 0 ? (
              (inventory.low_stock_items || []).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-400">SKU: {item.sku || '-'} · ₹{Number(item.price || 0).toFixed(2)}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.stock_level <= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    Qty: {item.stock_level}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-emerald-600 font-semibold">All products have sufficient stock level!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;