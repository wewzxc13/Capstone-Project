"use client";

import { useState } from "react";
import { FaBell, FaCog, FaEllipsisV, FaSearch } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

const allData = [
  { name: "Andrew Nerona", type: "Student", gender: "Male", status: "Transferred", date: "July 07, 2024" },
  { name: "Clyde Parol", type: "Teacher", gender: "Male", status: "Resigned", date: "July 07, 2024" },
  { name: "Christian Ejay", type: "Teacher", gender: "Male", status: "Resigned", date: "July 07, 2024" },
  { name: "Kristopher Dichos", type: "Student", gender: "Male", status: "Graduated", date: "July 07, 2024" },
  { name: "Junel Baterna", type: "Student", gender: "Male", status: "Transferred", date: "July 07, 2024" },
  { name: "Elmer Amorin", type: "Parent", gender: "Male", status: "Graduated", date: "July 07, 2024" },
  { name: "Jessa Decena", type: "Student", gender: "Female", status: "Transferred", date: "July 07, 2024" },
  { name: "User 8", type: "Admin", gender: "Female", status: "Graduated", date: "July 07, 2024" },
  { name: "User 9", type: "Student", gender: "Male", status: "Transferred", date: "July 07, 2024" },
  { name: "User 10", type: "Teacher", gender: "Female", status: "Resigned", date: "July 07, 2024" },
  { name: "User 11", type: "Parent", gender: "Female", status: "Graduated", date: "July 07, 2024" },
  { name: "User 12", type: "Student", gender: "Male", status: "Transferred", date: "July 07, 2024" },
  { name: "User 13", type: "Teacher", gender: "Male", status: "Resigned", date: "July 07, 2024" },
  { name: "User 14", type: "Parent", gender: "Male", status: "Graduated", date: "July 07, 2024" },
  { name: "User 15", type: "Admin", gender: "Female", status: "Transferred", date: "July 07, 2024" },
];

export default function ArchivePage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const router = useRouter();

  // Filtering logic
  const filteredData = allData.filter(item =>
    (userType === '' || userType === 'User List' || item.type === userType) &&
    (status === '' || status === 'Status Filter' || item.status === status)
  );

  // Pagination logic
  const usersPerPage = page === 1 ? 8 : 7;
  const startIdx = page === 1 ? 0 : 8;
  const endIdx = startIdx + usersPerPage;
  const paginatedData = filteredData.slice(startIdx, endIdx);
  const totalPages = Math.ceil(filteredData.length <= 8 ? 1 : (filteredData.length - 8) / 7 + 1);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4 gap-2 sm:gap-0">
            <div className="relative w-full sm:w-1/3">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-12 pr-4 py-2 rounded-full bg-[#d4ebfd] placeholder-gray-700 text-xs sm:text-sm w-full"
              />
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* User List Dropdown */}
              <select value={userType} onChange={e => { setUserType(e.target.value); setPage(1); }} className="px-3 sm:px-4 py-2 border rounded-full text-xs sm:text-sm text-[#2c3e50] border-[#2c3e50] bg-white">
                <option>User List</option>
                <option>Student</option>
                <option>Teacher</option>
                <option>Parent</option>
                <option>Admin</option>
              </select>
              {/* Status Filter Dropdown */}
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm text-white bg-[#2c3e50]" style={{color: '#2c3e50', backgroundColor: '#d4ebfd'}}>
                <option>Status Filter</option>
                <option>Transferred</option>
                <option>Resigned</option>
                <option>Graduated</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm text-left text-gray-700">
              <thead className="bg-[#cde8fb] text-[#2c3e50]">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">User Type</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date Archived</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-[#f3faff]">
                    <td className="px-6 py-4 font-semibold text-[#2c3e50]">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">{item.type}</td>
                    <td className="px-6 py-4">{item.gender}</td>
                    <td className="px-6 py-4">{item.status}</td>
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 text-right">
                      <FaEllipsisV className="text-gray-400 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 text-xs sm:text-sm text-gray-600 gap-2 sm:gap-0">
              <span>Showing {startIdx + 1}–{Math.min(endIdx, filteredData.length)} from {filteredData.length} data</span>
              <div className="flex gap-2 items-center">
                <button className="bg-[#60a5fa] p-1 rounded" aria-label="Previous" onClick={() => setPage(page > 1 ? page - 1 : 1)} disabled={page === 1}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-[#2c2f6f] ${page === i + 1 ? 'bg-[#2c2f6f] text-white' : 'bg-white text-[#2c2f6f]'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="bg-[#60a5fa] p-1 rounded" aria-label="Next" onClick={() => setPage(page < totalPages ? page + 1 : totalPages)} disabled={page === totalPages}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
