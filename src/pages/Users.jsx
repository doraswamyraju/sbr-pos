import { API_BASE_URL } from '../config';
// src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaLockOpen, FaLock, FaSpinner, FaShieldAlt } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    role: 'store_incharge',
    full_name: '',
    printer_type: 'auto',
    permissions: {
      can_view_purchase_price: false,
      can_manage_inventory: true,
      can_view_reports: false,
      can_manage_users: false
    }
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/server/api/users.php`);
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      } else {
        setError(response.data.message);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users. Please check the backend server.');
      setLoading(false);
    }
  };

  const defaultPermissions = {
    can_view_purchase_price: false,
    can_manage_inventory: true,
    can_view_reports: false,
    can_manage_users: false
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setUserData({
      username: '',
      password: '',
      role: 'store_incharge',
      full_name: '',
      printer_type: 'auto',
      permissions: { ...defaultPermissions }
    });
    setShowFormModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    const perms = typeof user.permissions === 'object' && user.permissions !== null
      ? user.permissions
      : (user.role === 'admin'
        ? { can_view_purchase_price: true, can_manage_inventory: true, can_view_reports: true, can_manage_users: true }
        : { ...defaultPermissions });

    setUserData({
      ...user,
      password: '',
      printer_type: user.printer_type ?? 'auto',
      permissions: perms
    });
    setShowFormModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/server/api/users.php?id=${userId}`);
        if (response.data.status === 'success') {
          setMessage('User deleted successfully!');
          fetchUsers();
        } else {
          setMessage(response.data.message);
        }
      } catch (err) {
        setMessage('Failed to delete user.');
      }
    }
  };

  const handleToggleStatus = async (userId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/server/api/users.php?id=${userId}`, {
        is_active: newStatus ? 1 : 0
      });
      if (response.data.status === 'success') {
        setMessage('User status updated successfully!');
        fetchUsers();
      } else {
        setMessage(response.data.message);
      }
    } catch (err) {
      setMessage('Failed to update user status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      let response;
      const payload = { ...userData };
      if (!currentUser) {
        response = await axios.post(`${API_BASE_URL}/server/api/users.php`, payload);
      } else {
        response = await axios.put(`${API_BASE_URL}/server/api/users.php?id=${currentUser.id}`, payload);
      }
      if (response.data.status === 'success') {
        setMessage(response.data.message);
        fetchUsers();
        setShowFormModal(false);
      } else {
        setMessage(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save user.');
    }
  };

  const handlePermissionToggle = (key) => {
    setUserData(prev => ({
      ...prev,
      permissions: {
        ...(prev.permissions || {}),
        [key]: !(prev.permissions?.[key])
      }
    }));
  };

  if (loading) return <div className="text-center p-4"><FaSpinner className="animate-spin inline-block mr-2" /> Loading users...</div>;
  if (error) return <div className="text-center p-4 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User & Staff Management</h1>
          <p className="text-sm text-gray-500">Define employee roles and granular access permissions.</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-md"
        >
          <FaPlus className="mr-2" /> Add Staff Member
        </button>
      </div>
      {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-center font-semibold border border-green-200">{message}</div>}
      
      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price Permission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => {
              const perms = user.permissions || {};
              const canViewCost = user.role === 'admin' || !!perms.can_view_purchase_price;

              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? 'Admin' : 'Store Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${canViewCost ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {canViewCost ? 'Allowed' : 'Hidden (Staff Restricted)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 mr-3" title="Edit User">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 mr-3" title="Delete User">
                      <FaTrash />
                    </button>
                    <button onClick={() => handleToggleStatus(user.id, !user.is_active)} className="text-gray-600 hover:text-gray-900">
                      {user.is_active ? <FaLock /> : <FaLockOpen />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {users.map(user => (
          <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow border-t-4 border-blue-600">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{user.full_name}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Role:</span> {user.role}</p>
              <p><span className="font-semibold">Purchase Price Access:</span> {user.role === 'admin' || user.permissions?.can_view_purchase_price ? 'Allowed' : 'Hidden'}</p>
            </div>
            <div className="flex space-x-2 mt-4 text-sm font-semibold border-t pt-3">
              <button onClick={() => handleEditUser(user)} className="flex-1 py-2 rounded text-blue-600 hover:bg-gray-100 flex justify-center items-center gap-1">
                <FaEdit /> Edit
              </button>
              <button onClick={() => handleDeleteUser(user.id)} className="flex-1 py-2 rounded text-red-600 hover:bg-gray-100 flex justify-center items-center gap-1">
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <Modal title={currentUser ? "Edit Staff Member" : "Add Staff Member"} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" id="full_name" value={userData.full_name} onChange={(e) => setUserData({...userData, full_name: e.target.value})} required className="w-full p-2.5 border rounded-lg" />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input type="text" id="username" value={userData.username} onChange={(e) => setUserData({...userData, username: e.target.value})} required className="w-full p-2.5 border rounded-lg" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                {currentUser ? "Update Password (leave blank to keep current password)" : "Password"}
              </label>
              <input 
                type="password" 
                id="password" 
                value={userData.password || ''} 
                onChange={(e) => setUserData({...userData, password: e.target.value})} 
                placeholder={currentUser ? "Enter new password to update" : "Enter password"}
                required={!currentUser} 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1">System Role</label>
              <select 
                id="role" 
                value={userData.role} 
                onChange={(e) => {
                  const r = e.target.value;
                  setUserData({
                    ...userData, 
                    role: r,
                    permissions: r === 'admin'
                      ? { can_view_purchase_price: true, can_manage_inventory: true, can_view_reports: true, can_manage_users: true }
                      : { ...defaultPermissions }
                  });
                }} 
                className="w-full p-2.5 border rounded-lg"
              >
                <option value="admin">Admin (Full Control)</option>
                <option value="store_incharge">Store Staff / Cashier</option>
              </select>
            </div>

            {/* Granular Employee Permissions Section */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-sm text-gray-800 flex items-center text-indigo-700">
                <FaShieldAlt className="mr-2" /> Staff Permissions & Restrictions
              </h4>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                <div>
                  <div className="text-sm font-semibold text-gray-800">View / Edit Purchase Wholesale Prices</div>
                  <div className="text-xs text-gray-500">Uncheck to hide purchase cost & profit margin in Purchases & Inventory.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!userData.permissions?.can_view_purchase_price} 
                  onChange={() => handlePermissionToggle('can_view_purchase_price')}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Manage Inventory & Products</div>
                  <div className="text-xs text-gray-500">Allow staff to add/edit product details and stock quantities.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!userData.permissions?.can_manage_inventory} 
                  onChange={() => handlePermissionToggle('can_manage_inventory')}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                <div>
                  <div className="text-sm font-semibold text-gray-800">View Business Reports & Financials</div>
                  <div className="text-xs text-gray-500">Allow staff to view executive sales reports and analytics.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!userData.permissions?.can_view_reports} 
                  onChange={() => handlePermissionToggle('can_view_reports')}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
              {currentUser ? 'Update User Permissions' : 'Create Staff User'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Users;