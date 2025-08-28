"use client";

import React, { useEffect, useState } from "react";
import SuperAdminSidebar from "../Sidebar/SuperAdminSidebar";
import { usePathname } from "next/navigation";
import Topbar from "../Topbar/Topbar";
import ProtectedRoute from "../Context/ProtectedRoute";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  
  // Debug: Log when SuperAdmin layout is rendered
  console.log('SuperAdminLayout: Rendering with pathname:', pathname);
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
      '/SuperAdminSection': 'Dashboard',
      '/SuperAdminSection/Dashboard': 'Dashboard',
      '/SuperAdminSection/Users': 'Users',
      '/SuperAdminSection/Calendar': 'Calendar',
      '/SuperAdminSection/Report': 'Report',
      '/SuperAdminSection/Schedule': 'Schedule',
      '/SuperAdminSection/Message': 'Message',
      '/SuperAdminSection/Archive': 'Archive',
      '/SuperAdminSection/Logs': 'System Logs'
    };
    return pathMap[path] || 'Dashboard';
  };
  const title = getPageTitle(pathname);

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex h-screen bg-[#f4f9ff] overflow-hidden select-none caret-transparent">
        {showSidebar && <SuperAdminSidebar />}
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