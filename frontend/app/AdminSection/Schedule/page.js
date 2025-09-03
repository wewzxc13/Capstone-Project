"use client";

import { useState, useEffect } from "react";
import { FaChevronDown, FaCalendarAlt } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function AdminSchedulePage() {
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch("/php/Schedule/get_schedule.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setScheduleData(data.schedules);
          if (data.schedules.length > 0) {
            setSelectedLevelId(data.schedules[0].level_id);
          }
        } else {
          setError("Failed to load schedule");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load schedule");
        setLoading(false);
      });
  }, []);

  const selectedSchedule = scheduleData.find((s) => s.level_id === selectedLevelId);

  // Map level_name to class info
  const getClassInfo = (level_name) => {
    if (/Discoverer/i.test(level_name)) return { label: "Class Schedule of Discoverer", days: ["Monday", "Wednesday", "Friday"], time: "10:30 AM - 11:30 PM/1:30 PM - 2:30 PM" };
    if (/Explorer/i.test(level_name)) return { label: "Class Schedule of Explorer", days: ["Monday", "Wednesday", "Friday"], time: "9:30 AM - 11:00 PM/1:30 PM - 3:00 PM" };
    if (/Adventurer/i.test(level_name)) return { label: "Class Schedule of Adventurer", days: ["Tuesday", "Thursday", "Friday"], time: "9:30 AM - 11:00 PM/1:30 PM - 3:00 PM" };
    return { label: `Class Schedule of ${level_name}`, days: ["Monday", "Wednesday", "Friday"], time: "" };
  };

  const dropdownOptions = scheduleData.map((s) => {
    const info = getClassInfo(s.level_name);
    return {
      label: info.label,
      value: s.level_id,
      days: info.days,
      time: info.time,
      level_name: s.level_name,
    };
  });

  const selectedClassInfo = selectedSchedule ? getClassInfo(selectedSchedule.level_name) : { days: [], time: "" };

  // Helper to group by time slot (start_time-end_time) for selected days, always showing subject if available
  const groupByTime = (schedule, days) => {
    const result = {};
    days.forEach((day) => {
      if (!schedule[day]) return;
      schedule[day].forEach((item) => {
        // Group by start and end only (not type)
        const startVal = item.start_minutes;
        const endVal = item.end_minutes;
        const minutesVal = item.minutes;
        const key = `${startVal}_${endVal}`;
        if (!result[key]) {
          const row = {
            time: minutesVal ? `${minutesVal} minutes` : '',
            start: startVal,
            end: endVal,
            minutes: minutesVal,
          };
          days.forEach((d) => (row[d] = []));
          result[key] = row;
        }
        // Always collect both subjects and routines for this cell
        if (item.subject_id) {
          result[key][day].push({ id: item.subject_id, type: 'subject', name: item.subject_name || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.subject_id_2) {
          result[key][day].push({ id: item.subject_id_2, type: 'subject', name: item.subject_name_2 || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.routine_id) {
          result[key][day].push({ id: item.routine_id, type: 'routine', name: item.routine_name || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.routine_id_2) {
          result[key][day].push({ id: item.routine_id_2, type: 'routine', name: item.routine_name_2 || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
      });
    });
    // For each cell, prefer subjects if present, otherwise routines
    Object.values(result).forEach(row => {
      days.forEach(day => {
        if (row[day] && row[day].length > 0) {
          const subjects = row[day].filter(x => x.type === 'subject');
          if (subjects.length > 0) {
            row[day] = subjects;
          } else {
            const routines = row[day].filter(x => x.type === 'routine');
            row[day] = routines;
          }
        }
      });
    });
    return Object.values(result).sort((a, b) => (a.start - b.start));
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex-1 p-6 bg-gray-50">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#232c67] rounded-md shadow-sm">
                <FaCalendarAlt className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                  {selectedClassInfo.label}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <FaCalendarAlt className="text-sm" />
                  Select Class
                  <FaChevronDown className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">Available Classes</p>
                    </div>
                    <div className="py-2 max-h-60 overflow-y-auto">
                      {dropdownOptions.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaCalendarAlt className="text-xl text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">No Classes Available</p>
                          <p className="text-xs text-gray-500">No class levels have been configured yet.</p>
                        </div>
                      ) : (
                        dropdownOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSelectedLevelId(opt.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            selectedLevelId === opt.value 
                              ? 'bg-[#232c67] text-white hover:bg-gray-100 hover:text-black' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                          }`}
                        >
                          <div className="font-medium">{opt.label}</div>
                        </button>
                        ))
                        )}
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Table Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Loading schedule...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the data</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">Failed to load schedule</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : selectedSchedule ? (
            <>
              <div className="overflow-auto">
                <table className="min-w-full text-sm text-left text-gray-800">
                  <thead className="bg-[#232c67] text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-base font-semibold border-r border-[#1a1f4d]">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-sm" />
                          Time
                        </div>
                      </th>
                      {selectedClassInfo.days.map((day) => (
                        <th key={day} className="px-6 py-4 text-base font-semibold border-r border-[#1a1f4d] last:border-r-0">
                          <div className="text-center">
                            <div className="font-bold">{day}</div>
                            <div className="text-xs font-normal text-[#a8b0e0] mt-1">{selectedClassInfo.time}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="overflow-y-auto">
                    {groupByTime(selectedSchedule.schedule, selectedClassInfo.days).length === 0 ? (
                      <tr>
                        <td colSpan={selectedClassInfo.days.length + 1} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <FaCalendarAlt className="text-2xl text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-700 mb-2">Empty Schedule</h4>
                            <p className="text-gray-500 text-center max-w-sm">
                              This class schedule is empty. 
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      groupByTime(selectedSchedule.schedule, selectedClassInfo.days).map((row, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 font-semibold text-sm border-r border-gray-200 bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#232c67] rounded-full"></div>
                            {row.time}
                          </div>
                        </td>
                        {selectedClassInfo.days.map((day) => (
                          <td
                            key={day}
                            className="px-6 py-4 text-sm border-r border-gray-200 last:border-r-0"
                          >
                            <div className="font-medium">
                              {(Array.isArray(row[day]) && row[day].length > 0)
                                ? [...new Set(row[day].map(x => x && x.name ? x.name : '').filter(Boolean))].join(' / ')
                                : "-"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaCalendarAlt className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Schedule Available</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">
                No schedule data has been configured for this class level yet. 
                Please contact the administrator to set up the class schedule.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Select a different class or check back later</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
