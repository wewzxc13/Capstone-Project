"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar from "../Sidebar/AdminSidebar";
import Topbar from "../Topbar/Topbar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const showTopbar = !pathname.includes("/Message");

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
    const pathMap = {
      '/AdminSection': 'Dashboard',
      '/AdminSection/Dashboard': 'Dashboard',
      '/AdminSection/Users': 'Users',
      '/AdminSection/Calendar': 'Calendar',
      '/AdminSection/Report': 'Report',
      '/AdminSection/Schedule': 'Schedule',
      '/AdminSection/Message': 'Message',
      '/AdminSection/Archive': 'Archive'
    };
    return pathMap[path] || 'Dashboard';
  };
  const title = getPageTitle(pathname);

  return (
    <div className="flex h-screen bg-[#f4f9ff] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-6">
          {showTopbar && (
            <Topbar title={title} userName={userName} userRole={userRole} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
} 