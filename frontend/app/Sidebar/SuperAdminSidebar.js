"use client";

import React from "react";
import Link from "next/link";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaClipboardList,
  FaArchive,
  FaCommentDots,
  FaBars,
  FaTimes,
  FaHistory,
  FaTools,
} from "react-icons/fa";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", icon: FaHome, href: "/SuperAdminSection/Dashboard" },
  { name: "Users", icon: FaUsers, href: "/SuperAdminSection/Users" },
  { name: "Schedule", icon: FaClipboardList, href: "/SuperAdminSection/Schedule" },
  { name: "Calendar", icon: FaCalendarAlt, href: "/SuperAdminSection/Calendar" },
  { name: "Report", icon: FaChartBar, href: "/SuperAdminSection/Report" },
  { name: "Logs", icon: FaHistory, href: "/SuperAdminSection/Logs" },
  { name: "Archive", icon: FaArchive, href: "/SuperAdminSection/Archive" },
  { name: "Configuration", icon: FaTools, href: "/SuperAdminSection/Configuration" }, 
  { name: "Message", icon: FaCommentDots, href: "/SuperAdminSection/Message" },
];

const SuperAdminSidebar = ({ isSidebarOpen: desktopSidebarOpen }) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [messageUnread, setMessageUnread] = React.useState(0);

  // Poll unread totals for Messages (users + groups)
  React.useEffect(() => {
    let timer;
    const fetchCounts = async () => {
      try {
        const uid = Number(localStorage.getItem("userId"));
        if (!uid) {
          setMessageUnread(0);
          return;
        }
        const [recentRes, groupsRes] = await Promise.all([
          fetch(`http://localhost/capstone-project/backend/Communication/get_recent_conversations.php?user_id=${uid}`).then((r) => r.json()).catch(() => null),
          fetch(`http://localhost/capstone-project/backend/Communication/get_groups.php?user_id=${uid}`).then((r) => r.json()).catch(() => null),
        ]);
        const usersUnread = Array.isArray(recentRes?.data)
          ? recentRes.data.reduce((s, it) => s + (Number(it.unread_count) || 0), 0)
          : 0;
        const groupsUnread = Array.isArray(groupsRes?.data)
          ? groupsRes.data.reduce((s, it) => s + (Number(it.unread_count) || 0), 0)
          : 0;
        setMessageUnread(usersUnread + groupsUnread);
      } catch {
        // noop
      }
    };
    fetchCounts();
    timer = setInterval(fetchCounts, 30000);
    return () => timer && clearInterval(timer);
  }, []);

  const SidebarContent = ({ isSidebarOpen, onNavClick }) => (
    <div
      className={`bg-gradient-to-b from-[#E9F3FF] to-[#CFE3FC] min-h-[100dvh] flex flex-col border-r border-blue-100 transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center h-20 border-b border-blue-200 transition-all duration-300 cursor-pointer hover:bg-[#E8F2FF] select-none ${
          isSidebarOpen ? "px-6" : "justify-center px-0"
        }`}
        onClick={() => (window.location.href = "/SuperAdminSection/Dashboard")}
        aria-label="Go to Dashboard"
      >
        <img
          src="/assets/image/villelogo.png"
          alt="Learners' Ville Logo"
          className={`h-10 w-auto transition-all duration-300 ${
            isSidebarOpen ? "mr-3" : ""
          }`}
        />
        {isSidebarOpen && (
          <span className="text-xl font-extrabold text-[#1B3764] tracking-tight transition-all duration-300 select-none">
            LEARNERS' <span className="text-[#FFD600]">VILLE</span>
          </span>
        )}
      </div>
      {/* Navigation Items */}
      <nav
        aria-label="Primary"
        className={`flex-1 py-8 space-y-2 ${isSidebarOpen ? "px-4" : "px-0"}`}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.name}
              onClick={onNavClick}
              aria-current={isActive ? "page" : undefined}
              title={!isSidebarOpen ? item.name : undefined}
              className={`flex items-center select-none transition font-medium text-lg rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232c67]/50 active:scale-[0.99] ${
                isSidebarOpen
                  ? `gap-4 px-5 py-3.5 border-l-4 ${
                      isActive
                        ? "bg-white shadow-md text-black border-[#232c67]"
                        : "text-black hover:bg-white/80 hover:shadow border-transparent hover:border-[#232c67]/40"
                    }`
                  : `justify-center py-3.5 border-l-4 ${
                      isActive
                        ? "bg-white shadow-md text-black border-[#232c67]"
                        : "text-black hover:bg-white/80 hover:shadow border-transparent hover:border-[#232c67]/40"
                    }`
              }`}
            >
              <span className="relative">
                <item.icon size={24} className="text-[#232c67] shrink-0" aria-hidden="true" />
                {item.name === "Message" && messageUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {messageUnread > 99 ? "99+" : messageUnread}
                  </span>
                )}
              </span>
              {isSidebarOpen && <span className="tracking-wide">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow-lg border border-blue-100 focus:outline-none"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <FaBars size={24} className="text-[#232c67]" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative z-50 w-64 max-w-full h-full">
            <button
              className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow border border-blue-100 focus:outline-none"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <FaTimes size={22} className="text-[#232c67]" />
            </button>
            <SidebarContent
              isSidebarOpen={true}
              onNavClick={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarContent isSidebarOpen={desktopSidebarOpen ?? true} />
      </div>
    </>
  );
};

export default SuperAdminSidebar; 