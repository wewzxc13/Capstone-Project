"use client";

import { useState } from "react";
import { FaUser, FaSearch, FaEllipsisV, FaTimes } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

const allUsers = [
  { name: "Christine Bacsarsa", role: "Teacher" },
  { name: "Kristopher Dichos", role: "Teacher" },
  { name: "Christian Clarino", role: "Teacher" },
  { name: "Maria Santos", role: "Teacher" },
  { name: "John Doe", role: "Teacher" },
  { name: "Jane Smith", role: "Teacher" },
  { name: "Alex Turner", role: "Teacher" },
  { name: "Liza Garing", role: "Parent" },
  { name: "Carlos Dela Cruz", role: "Parent" },
  { name: "Martha Reyes", role: "Parent" },
  { name: "Peter Tan", role: "Parent" },
  { name: "Grace Uy", role: "Parent" },
  { name: "Mariz Santos", role: "Student" },
  { name: "Alex Rivera", role: "Student" },
  { name: "Anna Cruz", role: "Student" },
  { name: "Brian Lee", role: "Student" },
  { name: "Samantha Lim", role: "Student" },
];

// Mock data for assigned classes
const assignedClassesData = {
  "Christine Bacsarsa": {
    class: "Age 2",
    students: [
      { name: "Mariz Santos", parent: "Liza Garing" },
      { name: "Paul Rivera", parent: "Carlos Dela Cruz" },
    ],
    parents: [
      { name: "Liza Garing", children: ["Mariz Santos"] },
      { name: "Carlos Dela Cruz", children: ["Paul Rivera"] },
    ]
  },
  "Kristopher Dichos": {
    class: "Age 3",
    students: [
      { name: "Anna Cruz", parent: "Martha Reyes" },
      { name: "Brian Lee", parent: "Peter Tan" },
    ],
    parents: [
      { name: "Martha Reyes", children: ["Anna Cruz"] },
      { name: "Peter Tan", children: ["Brian Lee"] },
    ]
  },
  "Christian Clarino": {
    class: "Age 4",
    students: [
      { name: "Samantha Lim", parent: "Grace Uy" },
    ],
    parents: [
      { name: "Grace Uy", children: ["Samantha Lim"] },
    ]
  },
  "Maria Santos": {
    class: "Age 2",
    students: [],
    parents: []
  },
  "John Doe": {
    class: "Age 3",
    students: [],
    parents: []
  },
  "Jane Smith": {
    class: "Age 4",
    students: [],
    parents: []
  },
  "Alex Turner": {
    class: "Age 2",
    students: [],
    parents: []
  }
};

const roles = ["Teacher", "Parent", "Student"];

export default function UsersPage() {
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const router = useRouter();

  // Pagination state per role
  const [pageByRole, setPageByRole] = useState({ Teacher: 1, Student: 1, Parent: 1 });
  const CARDS_PER_PAGE = 4;

  const handleSort = (category) => {
    setSelectedCategory(category);
    setSortOpen(false);
  };

  const handleAddUser = () => {
    router.push("/AdminSection/Users/AddUser");
  };

  const handleMenuClick = (index) => {
    setMenuOpenIndex(menuOpenIndex === index ? null : index);
  };

  const handleMenuAction = (action, user) => {
    setMenuOpenIndex(null);
    if (action === "view") {
      router.push(`/AdminSection/Users/ViewUser/${user.role}`);
    } else if (action === "edit") {
      router.push(`/AdminSection/Users/ViewUser/${user.role}`); // You can route to edit page if you have one
    } else if (action === "archive") {
      // Archive logic here
      alert(`Archived ${user.name}`);
    } else if (action === "viewAssignedClass") {
      router.push(`/AdminSection/Users/AssignedClass`);
    } else if (action === "manageDetails" || action === "manageStudentDetails" || action === "manageParentDetails") {
      router.push(`/AdminSection/Users/ViewUser?role=${user.role}`);
    } else if (action === "linkToStudent") {
      router.push(`/AdminSection/Users/LinkedStudent`);
    } else if (action === "viewStudentProgress") {
      router.push(`/AdminSection/Users/StudentProgress`);
    }
  };

  // Group users by role
  const groupedUsers = roles.reduce((acc, role) => {
    acc[role] = allUsers.filter((user) => user.role === role);
    return acc;
  }, {});

  // Filter by selected category if not All
  const displayedRoles = selectedCategory === "All" ? roles : [selectedCategory];

  const handlePageChange = (role, newPage) => {
    setPageByRole((prev) => ({ ...prev, [role]: newPage }));
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4 gap-2 sm:gap-0 relative">
            <div className="relative w-full sm:w-1/3">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-12 pr-4 py-2 rounded-full bg-[#E1F3FF] placeholder-gray-600 w-full text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-2 items-center mt-2 sm:mt-0">
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="px-3 sm:px-4 py-2 rounded-full border border-blue-700 text-xs sm:text-sm text-blue-700 font-medium flex items-center gap-2"
                >
                  {selectedCategory === "All" ? "All Users" : selectedCategory}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded w-32 text-xs sm:text-sm z-50">
                    <button onClick={() => handleSort("All")} className="w-full px-4 py-2 hover:bg-gray-100 text-left">All Users</button>
                    {roles.map((role) => (
                      <button key={role} onClick={() => handleSort(role)} className="w-full px-4 py-2 hover:bg-gray-100 text-left">{role}</button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddUser}
                className="bg-[#3B4CE8] text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-[#2c2f6f] transition-colors"
              >
                + Add User
              </button>
            </div>
          </div>

          {/* Grouped by role, boxes/cards layout */}
          <div className="space-y-8">
            {displayedRoles.map((role) => {
              const users = groupedUsers[role];
              const totalPages = Math.ceil(users.length / CARDS_PER_PAGE);
              const currentPage = pageByRole[role] || 1;
              const paginatedUsers = users.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
              return (
                <div key={role}>
                  <h2 className="text-lg font-bold text-[#1E2A79] mb-3">{role}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {paginatedUsers.length === 0 && (
                      <div className="text-gray-400 italic">No {role}s found.</div>
                    )}
                    {paginatedUsers.map((user, idx) => (
                      <div key={idx} className="relative bg-white rounded-2xl shadow p-0 flex flex-col items-center min-h-[170px] max-w-xs w-full mx-auto">
                        <div className="w-full h-16 bg-[#2c2f6f] rounded-t-2xl flex items-center justify-center relative">
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-white text-2xl shadow-md border-4 border-white">
                              <FaUser className="text-[#2c2f6f]" />
                            </div>
                          </div>
                          <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
                            onClick={() => handleMenuClick(`${role}-${idx}`)}
                          >
                            <FaEllipsisV />
                          </button>
                          {menuOpenIndex === `${role}-${idx}` && (
                            <div className="absolute top-8 right-3 bg-white border rounded shadow-lg z-50 w-40">
                              {user.role === "Teacher" ? (
                                <>
                                  <button onClick={() => handleMenuAction("viewAssignedClass", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">View Assigned Class</button>
                                  <button onClick={() => handleMenuAction("manageDetails", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Manage Details</button>
                                </>
                              ) : user.role === "Student" ? (
                                <>
                                  <button onClick={() => handleMenuAction("viewStudentProgress", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">View Student Progress</button>
                                  <button onClick={() => handleMenuAction("manageStudentDetails", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Manage Details</button>
                                </>
                              ) : user.role === "Parent" ? (
                                <>
                                  <button onClick={() => handleMenuAction("linkToStudent", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Link to Student</button>
                                  <button onClick={() => handleMenuAction("manageParentDetails", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Manage Details</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleMenuAction("view", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">View Details</button>
                                  <button onClick={() => handleMenuAction("edit", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Edit Details</button>
                                  <button onClick={() => handleMenuAction("archive", user)} className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-xs">Archive</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="pt-12 pb-4 px-3 text-center w-full">
                          <h3 className="font-semibold text-[#1E2A79] text-base mb-1 truncate">{user.name}</h3>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        className="text-gray-400 hover:text-[#2c2f6f] px-2"
                        onClick={() => handlePageChange(role, Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        &#x25C0;
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(role, i + 1)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentPage === i + 1 ? 'bg-[#2c2f6f] text-white' : 'border-[#b3b0c6] text-[#b3b0c6] bg-white'} text-base font-semibold transition`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="text-gray-400 hover:text-[#2c2f6f] px-2"
                        onClick={() => handlePageChange(role, Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        &#x25B6;
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 
