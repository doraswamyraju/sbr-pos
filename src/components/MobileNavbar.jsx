// src/components/MobileNavbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUsers,
  FaDollarSign,
  FaBoxOpen,
  FaEllipsisH,
  FaTimes,
  FaChartBar,
  FaUserTie,
  FaCog,
  FaFileInvoiceDollar,
  FaTruck
} from 'react-icons/fa';

/**
 * MobileNavbar — improved visual design
 * - Shows on small screens only (md:hidden via tailwind utility on wrapper)
 * - 5 icons: Dashboard, Leads, Sales, Products, More
 * - "More" opens a rounded sheet above the bar with extra links
 * - Hides itself on POS routes (e.g., /sales or /pos)
 *
 * NOTE: This uses Tailwind CSS classes. If you don't have Tailwind,
 * adjust the class names to your own CSS.
 */

const MoreSheet = ({ open, onClose, isAdmin }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="fixed left-4 right-4 bottom-[calc(4rem+16px)] z-[46]">
        <div className="mx-auto max-w-lg bg-white rounded-2xl shadow-2xl border overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-lg font-semibold">More</div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto max-h-[60vh]">
            <Link to="/sales-management" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                <FaFileInvoiceDollar className="w-6 h-6 text-gray-700" />
                <span className="text-xs text-gray-700">Sales Mngt</span>
            </Link>

            <Link to="/purchases" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                <FaTruck className="w-6 h-6 text-gray-700" />
                <span className="text-xs text-gray-700">Purchases</span>
            </Link>
            
            {isAdmin && (
                <>
                    <Link to="/reports" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                        <FaChartBar className="w-6 h-6 text-gray-700" />
                        <span className="text-xs text-gray-700">Reports</span>
                    </Link>
                    {/* <Link to="/Projects" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                        <FaChartBar className="w-6 h-6 text-gray-700" />
                        <span className="text-xs text-gray-700">Projects</span>
                    </Link> */}
                    <Link to="/users" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                        <FaUserTie className="w-6 h-6 text-gray-700" />
                        <span className="text-xs text-gray-700">Users</span>
                    </Link>

                    <Link to="/settings" onClick={onClose} className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-gray-50">
                        <FaCog className="w-6 h-6 text-gray-700" />
                        <span className="text-xs text-gray-700">Settings</span>
                    </Link>
                </>
            )}
          </div>
        </div>
      </div>

      {/* small local styles for slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(18px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 210ms ease-out both; }
      `}</style>
    </>
  );
};

const NavItem = ({ to, label, Icon, active }) => {
  return (
    <Link to={to} aria-label={label} className="flex-1 text-center">
      <div className={`flex flex-col items-center justify-center gap-1 py-2 px-2 transition-colors`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>
          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
        </div>
        <span className={`text-[11px] ${active ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>{label}</span>
      </div>
    </Link>
  );
};

const MobileNavbar = ({ isAdmin }) => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const hideOn = ['/sales', '/pos'];
  const shouldHide = hideOn.some((path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  if (shouldHide) return null;

  const isActive = (prefix) =>
    location.pathname === prefix || location.pathname.startsWith(prefix + '/');
  
  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} isAdmin={isAdmin} />

      <nav
        className="md:hidden fixed left-4 right-4 bottom-0 z-[47]"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-sm border border-gray-100 rounded-full p-2 shadow-2xl">
            <NavItem to="/inventory" label="Dashboard" Icon={FaTachometerAlt} active={isActive('/inventory') || isActive('/dashboard') || location.pathname === '/'} />
            <NavItem to="/leads" label="Leads" Icon={FaUsers} active={isActive('/leads')} />
            <div className="flex-1 text-center">
              <Link to="/sales" aria-label="Sales">
                <div className={`relative -mt-6`} >
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform transform ${isActive('/sales') ? 'bg-indigo-600 scale-100' : 'bg-white scale-100'}`}>
                    <FaDollarSign className={`${isActive('/sales') ? 'text-white' : 'text-gray-700'} w-6 h-6`} />
                  </div>
                </div>
              </Link>
              <div className={`mt-1 text-[11px] ${isActive('/sales') ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>Sales</div>
            </div>

            <NavItem to="/customers" label="Customers" Icon={FaUsers} active={isActive('/customers')} />

            <button
              onClick={() => setMoreOpen((s) => !s)}
              aria-label="More"
              className="flex-1 text-center"
            >
              <div className="flex flex-col items-center justify-center gap-1 py-2 px-2">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white text-gray-700`}>
                  <FaEllipsisH className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-gray-600">More</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className="md:hidden h-24" />
    </>
  );
};

export default MobileNavbar;