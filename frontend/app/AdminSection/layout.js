"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "../Sidebar/AdminSidebar";
import { usePathname } from "next/navigation";
import Topbar from "../Topbar/Topbar";
import ProtectedRoute from "../Context/ProtectedRoute";
import { FaBars } from "react-icons/fa";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  
  // Debug: Log when Admin layout is rendered
  console.log('AdminLayout: Rendering with pathname:', pathname);
  const showTopbar = !pathname.includes("/Message") && 
                     !pathname.includes("/AddUser") && 
                     !pathname.includes("/LinkedStudent") && 
                     !pathname.includes("/ViewLinkedStudent") && 
                     !pathname.includes("/StudentProgress") && 
                     !pathname.includes("/AssignedClass") && 
                     !pathname.includes("/ViewUser") &&
                     !pathname.includes("/ViewOwnUser") &&
                     !pathname.includes("/ChangePassword"); // Exclude Topbar for ChangePassword and its subpages

  const showSidebar = !pathname.includes("/Message") && 
                      !pathname.includes("/LinkedStudent") && 
                      !pathname.includes("/ChangePassword");

  // Dynamic user name and role
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  // Desktop sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("userFullName") || "");
      setUserRole(localStorage.getItem("userRole") || "");
    }
  }, []);

  const getPageTitle = (path) => {
    if (path.includes("/ViewOwnUser")) return "My Profile";
    if (path.includes("/ViewLinkedStudent")) return "View Linked Student";
    const pathMap = {
      '/AdminSection': 'Dashboard',
      '/AdminSection/Dashboard': 'Dashboard',
      '/AdminSection/Users': 'Users',
      '/AdminSection/Calendar': 'Calendar',
      '/AdminSection/Report': 'Report',
      '/AdminSection/Schedule': 'Schedule',
      '/AdminSection/Message': 'Message',
      '/AdminSection/Archive': 'Archive',
      '/AdminSection/Logs': 'System Logs'
    };
    return pathMap[path] || 'Dashboard';
  };
  const title = getPageTitle(pathname);

  return (
    <ProtectedRoute role="Admin">
      <div className="flex h-screen bg-[#f4f9ff] overflow-hidden select-none caret-transparent">
        {/* Desktop collapse/expand toggle */}
        {showSidebar && (
          <button
            className={`hidden md:flex fixed top-6 z-40 ${isSidebarOpen ? "left-64 -translate-x-1/2" : "left-20 -translate-x-1/2"} transform bg-white rounded-full p-2 shadow-lg border border-blue-100 focus:outline-none`}
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FaBars size={20} className="text-[#232c67]" />
          </button>
        )}
        {showSidebar && <AdminSidebar isSidebarOpen={isSidebarOpen} />}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-6 select-none caret-transparent">
            {showTopbar && (
              <Topbar title={title} userName={userName} userRole={userRole} />
            )}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 