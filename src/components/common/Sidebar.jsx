// src/components/common/Sidebar.jsx
import React from 'react';
import {
  FaBoxes, FaChartBar, FaUserTie, FaUsers,
  FaShoppingCart, FaSignOutAlt, FaBullhorn,
  FaFileInvoiceDollar, FaCog, FaTruck, FaTasks, FaBuilding // FaBuilding is new
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout, userRole, expanded = false, setExpanded = () => {} }) => {
  const activeLinkStyle = "bg-secondary-gold text-primary-blue";
  const defaultLinkStyle = "text-white hover:bg-secondary-gold hover:text-primary-blue transition-colors";
  const baseLinkStyle = "flex items-center p-3 rounded-lg";

  const isAdmin = (userRole ?? '').toString().toLowerCase().includes('admin');

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`bg-primary-blue text-white ${expanded ? 'w-64' : 'w-20'} min-h-screen p-4 flex flex-col fixed left-0 top-0 transition-all duration-300 z-40`}
    >
      <div className="mb-8 flex items-center justify-between">
        {expanded ? (
          <h1 className="text-2xl font-bold text-secondary-gold">SBR POS</h1>
        ) : (
          <div className="w-10 h-10 bg-yellow-400 rounded-md flex items-center justify-center text-primary-blue font-bold">S</div>
        )}
      </div>

      <nav className="flex-1">
        <ul>
          <li className="mb-2">
            <NavLink to="/inventory" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaBoxes className="mr-3" />
              {expanded && 'Inventory'}
            </NavLink>
          </li>
          
          {/* <li className="mb-2">
            <NavLink to="/projects" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaBuilding className="mr-3" />
              {expanded && 'Projects'}
            </NavLink>
          </li> */}
          
          <li className="mb-2">
            <NavLink to="/sales" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaShoppingCart className="mr-3" />
              {expanded && 'Sales'}
            </NavLink>
          </li>

          <li className="mb-2">
            <NavLink to="/customers" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaUsers className="mr-3" />
              {expanded && 'Customers'}
            </NavLink>
          </li>

          <li className="mb-2">
            <NavLink to="/leads" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaBullhorn className="mr-3" />
              {expanded && 'Leads'}
            </NavLink>
          </li>

          <li className="mb-2">
            <NavLink to="/sales-management" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaFileInvoiceDollar className="mr-3" />
              {expanded && 'Sales Management'}
            </NavLink>
          </li>

          <li className="mb-2">
            <NavLink to="/purchases" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
              <FaTruck className="mr-3" />
              {expanded && 'Purchases'}
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li className="mb-2">
                <NavLink to="/users" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
                  <FaUserTie className="mr-3" />
                  {expanded && 'Users'}
                </NavLink>
              </li>

              <li className="mb-2">
                <NavLink to="/reports" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
                  <FaChartBar className="mr-3" />
                  {expanded && 'Reports'}
                </NavLink>
              </li>

              <li className="mb-2">
                <NavLink to="/settings" className={({ isActive }) => isActive ? `${baseLinkStyle} ${activeLinkStyle}` : `${baseLinkStyle} ${defaultLinkStyle}`}>
                  <FaCog className="mr-3" />
                  {expanded && 'Settings'}
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="mt-auto">
        <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-red-600 transition-colors">
          <FaSignOutAlt className="mr-3" />
          {expanded && 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;