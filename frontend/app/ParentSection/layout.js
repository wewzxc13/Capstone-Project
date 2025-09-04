"use client";
import React from "react";
import ParentSidebar from "../Sidebar/ParentSidebar";
import Topbar from "../Topbar/Topbar";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../Context/ProtectedRoute";
import { FaBars } from "react-icons/fa";

const pageTitles = {
  dashboard: "Dashboard",
  parentdetails: "Parent Details",
  studentdetails: "Student Details",
  schedule: "Schedule",
  calendar: "Calendar", // Added for Calendar page
  reportcard: "Report Card",
  // message: "Message", // No topbar for message
};

export default function ParentSectionLayout({ children }) {
  const pathname = usePathname();
  const path = pathname?.toLowerCase() || "";
  // Desktop sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  // Debug: Log when Parent layout is rendered
  console.log('ParentSectionLayout: Rendering with pathname:', pathname);
  const isMessagePage = path.includes("/parentsection/message");
  const isChangePassword = path.includes("/changepassword");
  let title = "";
  if (path.includes("/changepassword")) {
    title = "Change Password";
  } else {
    for (const key in pageTitles) {
      if (path.includes(key)) {
        title = pageTitles[key];
        break;
      }
    }
  }
  // Debug
  console.log("Topbar title:", title);

  return (
    <ProtectedRoute role="Parent">
      <div className="flex h-screen bg-[#f4f9ff] overflow-hidden select-none caret-transparent">
        {/* Desktop collapse/expand toggle (hidden on Message and ChangePassword) */}
        {!isChangePassword && !isMessagePage && (
          <button
            className={`hidden md:flex fixed top-6 z-40 ${isSidebarOpen ? "left-64 -translate-x-1/2" : "left-20 -translate-x-1/2"} transform bg-white rounded-full p-2 shadow-lg border border-blue-100 focus:outline-none`}
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FaBars size={20} className="text-[#232c67]" />
          </button>
        )}
        {!isChangePassword && <ParentSidebar isSidebarOpen={isSidebarOpen} />}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-6 select-none caret-transparent">
            {!isMessagePage && !isChangePassword && (
              <Topbar title={title} userName="Parent" userRole="Parent" />
            )}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 