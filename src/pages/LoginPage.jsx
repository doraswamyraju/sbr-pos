import { API_BASE_URL } from '../config';
// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import logo from '../assets/Main LOGO.png';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/server/api/auth.php`, { username, password });
      
      if (response.data.success) {
        onLogin(response.data.user);
        navigate('/inventory');
      } else {
        setError(response.data.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-xl">
        <div className="text-center mb-6">
          <img 
            src={logo} 
            alt="Sri Balaji Renewables POS Logo" 
            className="mx-auto h-16 w-auto mb-2" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-xl font-bold text-gray-800">Login to Sri Balaji Renewables POS</h1>
        </div>

        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging in...' : (
              <>
                <FaSignInAlt className="mr-2" /> Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;