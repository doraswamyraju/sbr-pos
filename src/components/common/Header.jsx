// src/components/common/Header.jsx
import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const Header = ({ user = {}, onLogout = () => {}, sidebarExpanded = false, company = {} }) => {
  const leftClass = sidebarExpanded ? 'header-left-expanded' : 'header-left-collapsed';

  return (
    <header
      className={`header-fixed ${leftClass} bg-white border-b z-30 shadow-sm`}
      role="banner"
    >
      <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {company.logoUrl && (
            <img src={company.logoUrl} alt="Company Logo" className="h-10 w-auto" onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <div className="text-lg font-semibold text-gray-800">Sri Balaji Renewables POS</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 text-right">
            <div className="font-semibold text-gray-800">{user.full_name || "Admin User"}</div>
            <div className="text-xs text-gray-500">{user.role || "admin"}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
            {(user.full_name || 'A').charAt(0).toUpperCase()}
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