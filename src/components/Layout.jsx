import React, { useState, createContext, useContext } from "react";
import Sidebar from "./common/Sidebar";
import MobileNavbar from "./MobileNavbar";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

const Layout = ({ children, userRole, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex">
        <Sidebar userRole={userRole} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Content wrapper that shifts depending on sidebar */}
        <main
          className={`flex-1 min-h-screen transition-all duration-300 p-4 md:p-6 pb-28
          ${collapsed ? "md:ml-20" : "md:ml-64"}`}
        >
          {children}
        </main>
      </div>

      {/* mobile nav at bottom */}
      <MobileNavbar />
    </SidebarContext.Provider>
  );
};

export default Layout;