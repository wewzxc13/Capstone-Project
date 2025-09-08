"use client";

import React, { useEffect, useState } from "react";
import TeacherSidebar from "../Sidebar/TeacherSidebar";
import Topbar from "../Topbar/Topbar";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../Context/ProtectedRoute";
import { FaBars } from "react-icons/fa";

export default function TeacherLayout({ children }) {
  const pathname = usePathname();
  const showTopbar = !pathname.includes("/Message") && !pathname.includes("/ViewOwnUser") && !pathname.includes("/ChangePassword");
  const showSidebar = !pathname.includes("/Message") && !pathname.includes("/ChangePassword");

  // Dynamic user name and role
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  // Desktop sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Signal to programmatically open mobile sidebar from Topbar
  const [mobileSidebarOpenTick, setMobileSidebarOpenTick] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("userFullName") || "");
      setUserRole(localStorage.getItem("userRole") || "");
    }
  }, []);

  // Optionally, set a title based on the path
  const getPageTitle = (path) => {
    if (path.includes("/ChangePassword")) return "Change Password";
    if (path.includes("/ViewOwnUser")) return "My Profile";
    const pathMap = {
      '/TeacherSection': 'Dashboard',
      '/TeacherSection/Dashboard': 'Dashboard',
      '/TeacherSection/Students': 'Students',
      '/TeacherSection/Calendar': 'Calendar',
      '/TeacherSection/Attendance': 'Attendance',
      '/TeacherSection/Assessment': 'Assessment'
    };
    return pathMap[path] || 'Dashboard';
  };
  const title = getPageTitle(pathname);

  if (typeof window !== 'undefined') {
    console.log('Teacher Layout DEBUG:', window.location.pathname);
  }

  return (
    <ProtectedRoute role="Teacher">
      <div className="flex h-screen bg-[#f4f9ff] overflow-hidden select-none caret-transparent">
        {/* Desktop collapse/expand toggle */}
        {showSidebar && (
          <button
            className={`hidden md:flex fixed top-6 z-[200] ${isSidebarOpen ? "left-64 -translate-x-1/2" : "left-20 -translate-x-1/2"} transform bg-white rounded-full p-2 shadow-lg border border-blue-100 focus:outline-none`}
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FaBars size={20} className="text-[#232c67]" />
          </button>
        )}
        {showSidebar && <TeacherSidebar isSidebarOpen={isSidebarOpen} mobileOpenSignal={mobileSidebarOpenTick} showInternalHamburger={false} />}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-6 select-none caret-transparent">
            {showTopbar && (
              <Topbar 
                title={title} 
                userName={userName} 
                userRole={userRole}
                onOpenSidebar={() => setMobileSidebarOpenTick((t) => t + 1)}
              />
            )}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
