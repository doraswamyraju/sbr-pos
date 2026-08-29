// src/App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Leads from './pages/Leads';
import LoginPage from './pages/LoginPage';
import SalesManagement from './pages/SalesManagement';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';
import EditSale from './pages/EditSale';
import Projects from './pages/Projects';
import ProjectDetailsLayout from './pages/ProjectDetailsLayout'; // Parent layout
import ProjectDetails from './pages/ProjectDetails'; // Overview page
import TaskManagement from './pages/TaskManagement'; // ToDo page
import './index.css';
import MobileNavbar from './components/MobileNavbar';

function App() {
  const location = useLocation();
  const isSalesPage = location.pathname === '/sales';

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const normalizeUser = (u) => {
    if (!u) return null;
    return {
      id: u.id ?? u.user_id ?? u.userId ?? null,
      role: (u.role ?? u.user_type ?? 'user').toString(),
      is_admin: !!(u.is_admin ?? u.isAdmin ?? false),
      ...u
    };
  };
  const currentUser = normalizeUser(user);

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('pos_user', JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save user to localStorage", e);
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('pos_user'); } catch {}
  };

  const isAdminRole = (() => {
    const r = (currentUser?.role ?? '').toString().toLowerCase();
    return !!currentUser?.is_admin || r.includes('admin') || r.includes('super');
  })();

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const AdminRoute = ({ children }) => {
    if (!isAdminRole) return <Navigate to="/" replace />;
    return children;
  };

  const getRoutes = () => {
    const publicRoutes = [
      <Route key="inventory" path="/inventory" element={<Inventory currentUser={currentUser} />} />,
      <Route key="sales" path="/sales" element={<Sales />} />,
      <Route key="customers" path="/customers" element={<Customers />} />,
      <Route key="leads" path="/leads" element={<Leads currentUser={currentUser} />} />,
      <Route key="purchases" path="/purchases" element={<Purchases />} />,
      <Route key="sales-management" path="/sales-management" element={<SalesManagement />} />,
      <Route key="edit-sale" path="/edit-sale/:id" element={<EditSale />} />,
      <Route key="projects-list" path="/projects" element={<Projects />} />,
      <Route key="project-details" path="/projects/:id" element={<ProjectDetailsLayout />} >
        <Route index element={<ProjectDetails />} />
        <Route path="overview" element={<ProjectDetails />} />
        <Route path="todo" element={<TaskManagement />} />
     </Route>,
      <Route key="home" path="/" element={<Navigate to="/inventory" replace />} />,
      <Route key="404" path="*" element={<div>Page Not Found</div>} />
    ];

    const adminRoutes = [
      <Route key="settings" path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />,
      <Route key="users" path="/users" element={<AdminRoute><Users /></AdminRoute>} />
    ];

    return isAdminRole ? [...publicRoutes, ...adminRoutes] : publicRoutes;
  };

  const mainMarginClass = !isSalesPage ? (sidebarExpanded ? 'md:pl-64' : 'md:pl-20') : '';

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 w-full overflow-x-hidden">
      {!isSalesPage && (
        <div className="hidden md:block">
          <Sidebar
            userRole={currentUser?.role}
            onLogout={handleLogout}
            expanded={sidebarExpanded}
            setExpanded={setSidebarExpanded}
          />
        </div>
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 w-full ${mainMarginClass}`}>
        {!isSalesPage && <Header user={currentUser} onLogout={handleLogout} sidebarExpanded={sidebarExpanded} />}
        <main className={`flex-grow w-full ${isSalesPage ? 'p-0' : 'p-4 md:p-6'}`}>
          <div className={isSalesPage ? "w-full" : "max-w-7xl mx-auto w-full"}>
            <Routes>{getRoutes()}</Routes>
          </div>
        </main>
      </div>

      <MobileNavbar isAdmin={isAdminRole} />
    </div>
  );
}

export default App;