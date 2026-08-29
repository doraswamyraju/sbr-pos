// src/components/common/Header.jsx
import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import logoImg from '../../assets/logo.png';

const Header = ({ user = {}, onLogout = () => {} }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm w-full h-16 flex-shrink-0">
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Sri Balaji Renewables POS Logo" className="h-9 w-auto object-contain" />
          <div className="text-lg font-bold text-gray-800 tracking-tight">Sri Balaji Renewables POS</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 text-right">
            <div className="font-semibold text-gray-800">{user.full_name || user.name || "Admin User"}</div>
            <div className="text-xs text-gray-500 capitalize">{user.role || "admin"}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow">
            {(user.full_name || user.name || 'A').charAt(0).toUpperCase()}
          </div>
          
          {/* Mobile Logout Button */}
          <button 
            onClick={onLogout} 
            className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100" 
            aria-label="Logout"
          >
            <FaSignOutAlt className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;