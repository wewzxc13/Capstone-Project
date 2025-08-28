"use client";
import ParentSidebar from "../Sidebar/ParentSidebar";
import Topbar from "../Topbar/Topbar";
import { usePathname } from "next/navigation";
import ProtectedRoute from "../Context/ProtectedRoute";

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
        {!isChangePassword && <ParentSidebar />}
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