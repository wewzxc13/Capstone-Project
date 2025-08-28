"use client";

import { useState } from "react";
import { FaBell, FaCog, FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";

const initialEvents = [
  {
    day: 20,
    month: "March",
    year: 2025,
    title: "Quarterly Parent-Teacher Consultation",
    time: "9:00 - 10:00 AM",
    color: "bg-pink-400",
  },
  {
    day: 21,
    month: "March",
    year: 2025,
    title: "Academic Performance Discussion",
    time: "9:00 - 10:00 AM",
    color: "bg-orange-400",
  },
  {
    day: 22,
    month: "March",
    year: 2025,
    title: "Collaborative Meeting",
    time: "9:00 - 10:00 AM",
    color: "bg-yellow-300",
  },
  {
    day: 23,
    month: "March",
    year: 2025,
    title: "Student Development Review",
    time: "9:00 - 10:00 AM",
    color: "bg-green-400",
  },
  {
    day: 26,
    month: "March",
    year: 2025,
    title: "Student Development Review",
    time: "9:00 - 10:00 AM",
    color: "bg-blue-400 text-white",
  },
];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const yearRange = Array.from({ length: 11 }, (_, i) => 2020 + i);

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [events, setEvents] = useState(initialEvents);
  const [modalDay, setModalDay] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventColor, setNewEventColor] = useState("bg-blue-400");
  const [showInvite, setShowInvite] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [inviteViewMode, setInviteViewMode] = useState(false);
  const router = useRouter();

  // Helper to get number of days in a month
  const getDaysInMonth = (month, year) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = monthNames.indexOf(month);
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getEventForDay = (day) => events.find((event) => event.day === day);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  const handleDayClick = (day) => {
    setModalDay(day);
    setShowInputModal(true);
    setShowInvite(false);
    setNewEventTitle("");
    setNewEventStartTime("09:00");
    setNewEventEndTime("10:00");
    setNewEventColor("bg-blue-400");
  };

  const handleAddEvent = () => {
    if (!newEventTitle || !newEventStartTime || !newEventEndTime) return;
    setEvents([
      ...events,
      {
        day: modalDay,
        month: selectedMonth,
        year: selectedYear,
        title: newEventTitle,
        time: `${newEventStartTime} - ${newEventEndTime}`,
        color: newEventColor,
      },
    ]);
    setShowInputModal(false);
    setModalDay(null);
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="flex bg-[#eef5ff] min-h-screen">
        <main className="flex-1 p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="flex-1">
              <div className="flex justify-center mb-4 gap-2 sm:gap-4">
                <select
                  className="px-2 sm:px-4 py-2 rounded-full border border-gray-400 text-xs sm:text-sm font-medium bg-white"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  {monthNames.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  className="px-2 sm:px-4 py-2 rounded-full border border-gray-400 text-xs sm:text-sm font-medium bg-white"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {yearRange.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md w-full">
                <div className="grid grid-cols-7 text-center text-gray-500 font-medium text-xs sm:text-sm">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2 sm:mt-4">
                  {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => {
                    const day = i + 1;
                    const event = getEventForDay(day);
                    return (
                      <div
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`h-20 rounded-xl border flex flex-col items-start justify-start p-2 text-sm cursor-pointer hover:bg-blue-50 transition ${
                          event ? event.color : "border-blue-500"
                        }`}
                      >
                        <span className="font-medium text-gray-700">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="w-full lg:w-80 mt-4 lg:mt-0">
              <div className="bg-white p-2 sm:p-6 rounded-xl shadow-md">
                <h2 className="text-base sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-4">
                  Schedule Details
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {events.map((event, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 border-l-4 rounded shadow-sm cursor-pointer hover:bg-blue-100"
                      style={{
                        borderColor: event.color
                          .replace("bg-", "")
                          .replace("-400", ""),
                      }}
                      onClick={() => { setSelectedEvent(event); setShowInputModal(false); setShowInvite(false); }}
                    >
                      <h3 className="font-medium text-gray-800 text-sm">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {event.month} {event.day}, {event.year}
                      </p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
          {selectedEvent && !showInvite && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-0 relative">
                <div className="bg-[#232c67] text-white px-6 py-3 rounded-t-xl font-semibold text-lg">
                  Schedule Details
                </div>
                <div className="p-6 grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-bold mb-1">What:</p>
                    <div className="mb-2">{selectedEvent.title}</div>
                    <p className="font-bold mb-1 mt-4">When:</p>
                    <div>{selectedEvent.month} {selectedEvent.day}, {selectedEvent.year}</div>
                    <div>{selectedEvent.time}</div>
                  </div>
                  <div>
                    <p className="font-bold mb-1 mt-4">Invite:</p>
                    <button
                      className="bg-[#232c67] text-white px-4 py-2 rounded-full text-xs font-semibold w-full mb-6"
                      style={{minWidth: '120px'}}
                      onClick={() => { setShowInvite(true); setInviteViewMode(true); }}
                      type="button"
                    >
                      View Invited List
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-6 pb-4">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-1 border border-[#232c67] text-[#232c67] rounded-full text-sm font-semibold bg-white hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {showInvite ? (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-60">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-lg">
                <div className="px-6 py-3 border-b text-lg font-semibold flex justify-between items-center">
                  Invite
                  <button
                    onClick={() => { setShowInvite(false); setInviteViewMode(false); setSelectedEvent(null); setShowInputModal(false); }}
                    className="text-2xl font-light"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-4">
                  {inviteViewMode ? (
                    <>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Invited List</h4>
                      <div className="mb-4">
                        <div className="font-semibold">Teachers:</div>
                        <ul className="mb-2 ml-4 list-disc text-sm">
                          <li>Christian Ejay Clarino</li>
                          <li>Clyde Parol</li>
                        </ul>
                        <div className="font-semibold">Parents:</div>
                        <ul className="ml-4 list-disc text-sm">
                          <li>Andrea Plamos</li>
                          <li>Margareth Manongdo</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => { setShowInvite(false); setInviteViewMode(false); setSelectedEvent(null); }}
                        className="mt-6 w-full bg-[#1E2A79] text-white py-2 rounded-full"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="relative mb-4">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search here"
                          className="w-full pl-12 pr-4 py-2 rounded-full bg-blue-100 placeholder-gray-600"
                          value={inviteSearch || ""}
                          onChange={e => setInviteSearch(e.target.value)}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700">Teachers</h4>
                        <div className="space-y-2 mb-4">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span>Christian Ejay Clarino</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span>Clyde Parol</span>
                          </label>
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">Parents</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span>Andrea Plamos</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span>Margareth Manongdo</span>
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowInvite(false); setInviteViewMode(false); setSelectedEvent(null); setShowInputModal(false); }}
                        className="mt-6 w-full bg-[#1E2A79] text-white py-2 rounded-full"
                      >
                        Confirm
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            showInputModal && !selectedEvent && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-0 relative">
                  <div className="bg-[#232c67] text-white px-6 py-3 rounded-t-xl font-semibold text-lg">
                    Schedule Details
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="font-bold mb-1">What:</p>
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full mb-2"
                        placeholder="Event Title"
                        value={newEventTitle || ""}
                        onChange={e => setNewEventTitle(e.target.value)}
                      />
                      <p className="font-bold mb-1 mt-4">When:</p>
                      <div className="flex flex-col gap-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={
                            modalDay
                              ? `${selectedYear}-${(monthNames.indexOf(selectedMonth)+1).toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")}`
                              : ""
                          }
                          onChange={e => {
                            const [year, month, day] = e.target.value.split("-");
                            setSelectedYear(Number(year));
                            setSelectedMonth(monthNames[Number(month)-1]);
                            setModalDay(Number(day));
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            className="border rounded px-2 py-1 w-full"
                            value={newEventStartTime || ""}
                            onChange={e => setNewEventStartTime(e.target.value)}
                          />
                          <span className="mx-1">-</span>
                          <input
                            type="time"
                            className="border rounded px-2 py-1 w-full"
                            value={newEventEndTime || ""}
                            onChange={e => setNewEventEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold mb-1 mt-4">Invite:</p>
                      <button
                        className="bg-[#232c67] text-white px-4 py-2 rounded-full text-xs font-semibold w-full mb-6"
                        style={{minWidth: '120px'}}
                        onClick={() => { setShowInputModal(false); setShowInvite(true); }}
                        type="button"
                      >
                        Click to Invite
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 px-6 pb-4">
                    <button
                      onClick={() => { setShowInputModal(false); setModalDay(null); }}
                      className="px-4 py-1 border border-[#232c67] text-[#232c67] rounded-full text-sm font-semibold bg-white hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEvent}
                      className="px-4 py-1 bg-[#232c67] text-white rounded-full text-sm font-semibold hover:bg-[#1a204d]"
                      disabled={!newEventTitle || !newEventStartTime || !newEventEndTime}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
