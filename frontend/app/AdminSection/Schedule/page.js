"use client";

import { useState } from "react";
import { FaBell, FaCog, FaChevronDown } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function SchedulePage() {
  const [selectedSchedule, setSelectedSchedule] = useState(
    "Schedule of 2 yrs. old"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  const schedules = {
    "Schedule of 2 yrs. old": [
      {
        time: "15 minutes",
        monday: "Attendance/Circle time",
        wednesday: "Attendance/Circle time",
        friday: "Attendance/Circle time",
      },
      {
        time: "15 minutes",
        monday: "Early Math/Socio emo",
        wednesday: "Early Math/Socio emo",
        friday: "Science",
      },
      {
        time: "10 minutes",
        monday: "Snack time",
        wednesday: "Snack time",
        friday: "Snack time",
      },
      {
        time: "15 minutes",
        monday: "Literacy",
        wednesday: "Literacy",
        friday: "Basic life skills/ Physical activities",
      },
      {
        time: "3 minutes",
        monday: "Story time/ Bubble time",
        wednesday: "Story time/ Bubble time",
        friday: "Story time/ Bubble time",
      },
      {
        time: "2 minutes",
        monday: "Wrapping up/Goodbye",
        wednesday: "Wrapping up/Goodbye",
        friday: "Wrapping up/Goodbye",
      },
    ],
    "Schedule of 3 yrs. old": [], // Add 3 yrs old schedule here
    "Schedule of 4 yrs. old": [], // Add 4 yrs old schedule here
  };

  const scheduleData = schedules[selectedSchedule];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
            <h2 className="text-base sm:text-xl font-bold text-[#2c3e50]">
              Class {selectedSchedule}
            </h2>

            <div className="relative inline-block text-left">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="border border-[#2c3e50] text-[#2c3e50] px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm"
              >
                Sort By <FaChevronDown className="text-xs" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1 text-xs sm:text-sm">
                    <p className="px-4 py-2 text-gray-400 border-b">Sort By</p>
                    {Object.keys(schedules).map((label) => (
                      <button
                        key={label}
                        onClick={() => {
                          setSelectedSchedule(label);
                          setDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-[#2c3e50] hover:bg-gray-100"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="min-w-full text-xs sm:text-sm text-left text-gray-800 border-separate border-spacing-0">
              <thead className="bg-white text-[#2c3e50]">
                <tr>
                  <th className="border border-[#c5d5e4] px-6 py-4 text-base">
                    Time
                  </th>
                  <th className="border border-[#c5d5e4] px-6 py-4 text-base">
                    Monday
                    <div className="text-xs font-normal text-[#7b8fa1]">
                      10:30 AM - 11:30 PM / 1:30 PM - 2:30 PM
                    </div>
                  </th>
                  <th className="border border-[#c5d5e4] px-6 py-4 text-base">
                    Wednesday
                    <div className="text-xs font-normal text-[#7b8fa1]">
                      10:30 AM - 11:30 PM / 1:30 PM - 2:30 PM
                    </div>
                  </th>
                  <th className="border border-[#c5d5e4] px-6 py-4 text-base">
                    Friday
                    <div className="text-xs font-normal text-[#7b8fa1]">
                      10:30 AM - 11:30 PM / 1:30 PM - 2:30 PM
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.length > 0 ? (
                  scheduleData.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-[#f9fbff]" : "bg-white"}
                    >
                      <td className="border border-[#c5d5e4] px-6 py-4 font-semibold text-sm">
                        {item.time}
                      </td>
                      <td className="border border-[#c5d5e4] px-6 py-4 text-sm">
                        {item.monday}
                      </td>
                      <td className="border border-[#c5d5e4] px-6 py-4 text-sm">
                        {item.wednesday}
                      </td>
                      <td className="border border-[#c5d5e4] px-6 py-4 text-sm">
                        {item.friday}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      No schedule available for this age group.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
