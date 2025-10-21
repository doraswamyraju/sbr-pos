// src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaLockOpen, FaLock, FaSpinner } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({ username: '', password: '', role: '', full_name: '', printer_type: 'auto' });
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const API_BASE_URL = 'https://rajugariventures.com/sbr-pos';

  useEffect(() => {
    fetchUsers();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

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

  const handleAddUser = () => {
    setCurrentUser(null);
    setUserData({ username: '', password: '', role: 'store_incharge', full_name: '', printer_type: 'auto' });
    setShowFormModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setUserData({ ...user, password: '', printer_type: user.printer_type ?? 'auto' });
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
      // don't send empty password on edit
      if (!currentUser) {
        response = await axios.post(`${API_BASE_URL}/server/api/users.php`, payload);
      } else {
        // when updating, backend expects id in query param
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

  if (loading) return <div className="text-center p-4"><FaSpinner className="animate-spin inline-block mr-2" /> Loading users...</div>;
  if (error) return <div className="text-center p-4 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users</h1>
        <button 
          onClick={handleAddUser}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Add User
        </button>
      </div>
      {message && <div className="mb-4 text-center text-green-600 font-semibold">{message}</div>}
      
      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Printer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.printer_type ?? 'auto'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 mr-3">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 mr-3">
                    <FaTrash />
                  </button>
                  <button onClick={() => handleToggleStatus(user.id, !user.is_active)} className="text-gray-600 hover:text-gray-900">
                    {user.is_active ? <FaLock /> : <FaLockOpen />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {users.length > 0 ? (
          users.map(user => (
            <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow-md border-t-4 border-blue-600">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <p><span className="font-semibold">Role:</span> {user.role}</p>
                <p className="mt-1"><span className="font-semibold">Printer:</span> {user.printer_type ?? 'auto'}</p>
              </div>
              <div className="flex space-x-2 mt-4 text-sm font-semibold border-t pt-4">
                <button onClick={() => handleEditUser(user)} className="flex-1 py-2 px-3 rounded-lg text-blue-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                  <FaEdit className="w-4 h-4" /> <span>Edit</span>
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="flex-1 py-2 px-3 rounded-lg text-red-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                  <FaTrash className="w-4 h-4" /> <span>Delete</span>
                </button>
                <button onClick={() => handleToggleStatus(user.id, !user.is_active)} className="flex-1 py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center space-x-1">
                  {user.is_active ? <FaLock className="w-4 h-4" /> : <FaLockOpen className="w-4 h-4" />}
                  <span>{user.is_active ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No users found.
          </div>
        )}
      </div>

      {showFormModal && (
        <Modal title={currentUser ? "Edit User" : "Add User"} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="full_name" className="block text-gray-700">Full Name</label>
              <input type="text" id="full_name" name="full_name" value={userData.full_name} onChange={(e) => setUserData({...userData, full_name: e.target.value})} required className="w-full p-2 border rounded-lg" />
            </div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700">Username</label>
              <input type="text" id="username" name="username" value={userData.username} onChange={(e) => setUserData({...userData, username: e.target.value})} required className="w-full p-2 border rounded-lg" />
            </div>
            {!currentUser && (
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700">Password</label>
                <input type="password" id="password" name="password" value={userData.password} onChange={(e) => setUserData({...userData, password: e.target.value})} required className="w-full p-2 border rounded-lg" />
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="role" className="block text-gray-700">Role</label>
              <select id="role" name="role" value={userData.role} onChange={(e) => setUserData({...userData, role: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="admin">Admin</option>
                <option value="store_incharge">Store In-charge</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="printer_type" className="block text-gray-700">Default Printer</label>
              <select id="printer_type" name="printer_type" value={userData.printer_type} onChange={(e) => setUserData({...userData, printer_type: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="auto">Auto (Default - A4)</option>
                <option value="thermal-3in">3" Thermal (3×2 in)</option>
                <option value="regular-a4">Regular (A4, 3 labels / row)</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
              {currentUser ? 'Update User' : 'Add User'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Users;