"use client";

import React, { useEffect, useState } from "react";
import TeacherSidebar from "../Sidebar/TeacherSidebar";
import Topbar from "../Topbar/Topbar";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../Context/ProtectedRoute";

export default function TeacherLayout({ children }) {
  const pathname = usePathname();
  const showTopbar = !pathname.includes("/Messages") && !pathname.includes("/ViewOwnUser") && !pathname.includes("/ChangePassword");
  const showSidebar = !pathname.includes("/ChangePassword");

  // Dynamic user name and role
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

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
      <div className="flex min-h-screen bg-[#f4f9ff] select-none caret-transparent">
        {showSidebar && <TeacherSidebar />}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-auto select-none caret-transparent">
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
