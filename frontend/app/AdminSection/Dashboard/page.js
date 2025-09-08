"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUserShield,
  FaUsers,
  FaUserTie,
  FaChalkboardTeacher,
  FaChild,
  FaBell,
  FaCog,
  FaCalendarAlt,
} from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";

import { Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';

export default function AdminDashboard() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [visible, setVisible] = useState({
    discoverer: true,
    explorer: true,
    adventurer: true,
  });

  const [userCounts, setUserCounts] = useState({
    admin: 0,
    teachers: 0,
    parents: 0,
    students: 0
  });
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();
  // Show any queued toast from previous page (e.g., after password change)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("next_toast");
      if (raw) {
        const { message, type, duration } = JSON.parse(raw);
        if (message) {
          if (type === 'error') toast.error(message, { autoClose: duration || 3000 });
          else toast.success(message, { autoClose: duration || 3000 });
        }
        localStorage.removeItem("next_toast");
      }
    } catch (_) { /* no-op */ }
  }, []);

  const fetchUserCounts = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/php/Users/get_user_counts.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setUserCounts(data.counts);
        } else {
          setError('Failed to fetch user counts');
        }
      } else {
        setError('Failed to fetch user counts');
      }
    } catch (error) {
      console.error('Error fetching user counts:', error);
      setError('Failed to fetch user counts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const response = await fetch('/php/Meeting/get_upcoming_meetings.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Filter to only show Scheduled and Rescheduled meetings
          const activeMeetings = data.meetings.filter(meeting => 
            meeting.status === 'Scheduled' || meeting.status === 'Rescheduled'
          );
          // Sort by date descending (latest first) - API already returns DESC but ensure frontend consistency
          const sortedMeetings = activeMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
          // API now returns created_by in each meeting (via tbl_notifications subquery)
          setUpcomingMeetings(sortedMeetings);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const fetchProgressData = async () => {
    try {
      setProgressLoading(true);
      const response = await fetch('/php/Assessment/get_all_classes_quarterly_performance.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          // Process datasets for performance levels (1-5 scale) using visual feedback
          const processedDatasets = data.data.classes.map(classData => ({
            label: classData.class_name,
            data: classData.data.map(score => {
              if (score === null || score === undefined) return null;
              
              // The API returns performance levels (1-5) based on quarter_visual_feedback_id
              // Just round to nearest integer for proper mapping
              return Math.round(score);
            }),
            borderColor: classData.color,
            backgroundColor: classData.color + '20', // Add transparency
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 5, // Show points for all data
            pointHoverRadius: 7,
            pointBorderWidth: 2,
            pointBorderColor: classData.color,
            pointBackgroundColor: classData.color,
            spanGaps: true,
          }));

          console.log('Raw class data:', data.data.classes); // Debug log
          setProgressData({
            labels: data.data.labels,
            datasets: processedDatasets
          });
        }
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userRole = localStorage.getItem("userRole");
    if (!isAuthenticated || userRole !== "Admin") {
      localStorage.clear();
      router.replace("/LoginSection");
    }
  }, []);

  // Fetch user counts, upcoming meetings, and progress data from API
  useEffect(() => {
    fetchUserCounts();
    fetchUpcomingMeetings();
    fetchProgressData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  const toggleLine = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stats = [
    {
      label: "Active Admin",
      value: userCounts.admin,
      color: "bg-purple-100 text-purple-700",
      iconBg: "bg-purple-200",
      icon: <FaUserTie className="text-purple-500 text-xl" />,
    },
    {
      label: "Active Teachers",
      value: userCounts.teachers,
      color: "bg-red-100 text-red-700",
      iconBg: "bg-red-200",
      icon: <FaChalkboardTeacher className="text-red-500 text-xl" />,
    },
    {
      label: "Active Parents",
      value: userCounts.parents,
      color: "bg-yellow-100 text-yellow-700",
      iconBg: "bg-yellow-200",
      icon: <FaUsers className="text-yellow-500 text-xl" />,
    },
    {
      label: "Active Students", // Only students linked to parents
      value: userCounts.students,
      color: "bg-blue-100 text-blue-700",
      iconBg: "bg-blue-200",
      icon: <FaChild className="text-blue-500 text-xl" />,
    },
  ];

  const [progressData, setProgressData] = useState({
    labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
    datasets: []
  });

  // Use real upcoming meetings data instead of hardcoded events

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.notification-dropdown') && isNotificationOpen) {
        setIsNotificationOpen(false);
      }
      if (!event.target.closest('.profile-dropdown') && isProfileOpen) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen, isProfileOpen]);

  return (
            <ProtectedRoute role="Admin">
      <div className="flex flex-col md:flex-row w-full overflow-x-hidden">
        <main className="flex-1 p-1 sm:p-2 md:p-3 min-w-0">


          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={fetchUserCounts}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stat Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Navy blue accent bar on top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#232c67]"></div>
                
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${stat.iconBg} border-2 border-[#232c67]/20`}>
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#232c67] mb-0.5">{stat.label}</p>
                    <h2 className="text-lg sm:text-xl font-bold text-[#232c67]">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                      ) : error ? (
                        <span className="text-red-500 text-sm">Error</span>
                      ) : (
                        stat.value
                      )}
                    </h2>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Main Content Container - Chart and Meetings Combined */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 overflow-hidden">
            {/* Content Row - Chart and Meetings content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Progress Chart Content */}
              <div className="col-span-2 min-w-0">
                {/* Chart Header */}
                <div className="mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">Progress of Classes</h3>
                  <p className="text-sm text-gray-600">Quarterly performance overview</p>
                  
                  {/* Chart Controls */}
                  <div className="flex justify-center mt-3">
                    <div className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 gap-1.5 sm:gap-3 border border-gray-200 bg-gray-50 rounded-lg overflow-x-auto whitespace-nowrap flex-nowrap">
                      {["discoverer", "explorer", "adventurer"].map((key, idx) => (
                        <span
                          key={key}
                          className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm select-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                            visible[key]
                              ? "text-white font-medium bg-[#232c67] shadow-sm border border-[#232c67]"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          onClick={() => setVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{
                              backgroundColor:
                                key === "discoverer"
                                  ? "#5C9EFF"
                                  : key === "explorer"
                                    ? "#FDCB44"
                                    : "#FF7B7B",
                            }}
                          />
                          {key === "discoverer" ? "Discoverer" : key === "explorer" ? "Explorer" : "Adventurer"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-56 sm:h-64 md:h-72">
                  {progressLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c2f6f] mr-3"></div>
                      <span className="text-sm">Loading progress data...</span>
                    </div>
                  ) : (
                    <Line 
                      data={{
                        labels: progressData.labels,
                        datasets: progressData.datasets.filter(dataset => {
                          const className = dataset.label.toLowerCase();
                          return visible[className];
                        })
                      }} 
                      options={{ 
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                          padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                          }
                        },
                        plugins: { 
                          legend: { 
                            display: false
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(44, 47, 111, 0.95)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: '#2c2f6f',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                              title: function(context) {
                                return context[0].label;
                              },
                              label: function(context) {
                                const val = context.parsed.y;
                                const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                                const performanceLevel = labels[val] || 'No data';
                                return `${context.dataset.label}: ${performanceLevel}`;
                              }
                            }
                          }
                        },
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        scales: {
                          y: {
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                              stepSize: 1,
                              callback: function(value) {
                                const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                                return labels[value] || '';
                              },
                              font: { size: 12, weight: '500' },
                              autoSkip: false,
                              maxTicksLimit: 5,
                              beginAtZero: false,
                              color: '#6b7280'
                            },
                            grid: { 
                              color: '#f3f4f6',
                              drawBorder: false
                            },
                            title: {
                              display: true,
                              text: 'Performance Level',
                              font: { size: 14, weight: '600' },
                              color: '#2c2f6f',
                              padding: { top: 10 }
                            }
                          },
                          x: {
                            ticks: { 
                              font: { size: 12, weight: '500' },
                              maxRotation: 45,
                              minRotation: 45,
                              padding: 10,
                              color: '#6b7280'
                            },
                            grid: { 
                              color: '#f3f4f6',
                              drawBorder: false
                            },
                            title: {
                              display: true,
                              text: 'Quarter',
                              font: { size: 14, weight: '600' },
                              color: '#2c2f6f',
                              padding: { top: 28 }
                            }
                          },
                        },
                      }} 
                      plugins={[]}
                    />
                  )}
                </div>
              </div>

              {/* Upcoming Meetings Content */}
              <div className="min-w-0">
                {/* Meetings Header with Navy Blue Background */}
                <div className="bg-[#232c67] p-3 rounded-t-lg -mt-3 -mx-3 mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FaCalendarAlt className="text-white text-lg" />
                      Upcoming Meetings
                    </h3>
                    {!meetingsLoading && upcomingMeetings.length > 0 && (
                      <span className="text-xs text-white bg-white/20 px-3 py-1.5 rounded-full font-medium border border-white/30">
                        {upcomingMeetings.length} Meeting{upcomingMeetings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-60 md:max-h-72 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {meetingsLoading ? (
                    // Loading skeleton for meetings
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-gray-100">
                        <div className="animate-pulse">
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))
                  ) : upcomingMeetings.length > 0 ? (
                    upcomingMeetings.map((meeting, idx) => (
                      <div
                        key={meeting.id}
                        onClick={() => router.push('/AdminSection/Calendar')}
                        className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-100`}
                        style={{
                          borderLeft: `${String(meeting.created_by) === String(localStorage.getItem('userId')) ? '6px solid #232c67' : '4px solid ' + (() => {
                            // Use random colors from the same palette as calendar page
                            const meetingColorMap = [
                              { name: "purple", hex: "#a78bfa" },
                              { name: "pink", hex: "#f472b6" },
                              { name: "green", hex: "#34d399" },
                              { name: "yellow", hex: "#facc15" },
                              { name: "orange", hex: "#fb923c" },
                              { name: "teal", hex: "#2dd4bf" },
                              { name: "indigo", hex: "#818cf8" }
                            ];
                            // Use meeting ID to get consistent color for each meeting
                            const colorIndex = meeting.id % meetingColorMap.length;
                            return meetingColorMap[colorIndex].hex;
                          })()}`,
                          boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                          marginBottom: 6,
                          background: '#fff',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-[#2c2f6f]">
                            {meeting.title}
                          </h4>
                          {String(meeting.created_by) === String(localStorage.getItem('userId')) && (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-md bg-[#232c67] text-white font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-600">{meeting.date}</span>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-500">{meeting.time}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{meeting.agenda}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-lg border border-gray-200 text-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <FaBell className="text-gray-400 text-sm" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        No upcoming meetings
                      </h4>
                      <p className="text-xs text-gray-400">No scheduled or rescheduled meetings found</p>
                    </div>
                  )}
                </div>
                
                {/* View All Meetings Button */}
                {upcomingMeetings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push('/AdminSection/Calendar')}
                      className="w-full px-3 py-2 text-sm font-medium text-[#232c67] bg-[#232c67]/5 hover:bg-[#232c67]/10 border border-[#232c67]/20 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <FaCalendarAlt className="text-sm" />
                      View All Meetings in Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
