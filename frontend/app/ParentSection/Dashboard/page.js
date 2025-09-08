"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUserCircle,
  FaChild,
  FaCalendarAlt,
  FaClipboardList,
  FaAward,
  FaCommentDots,
  FaBell,
  FaChartLine,
  FaBookOpen,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaGraduationCap,
  FaCheckDouble,
  FaUser,
} from "react-icons/fa";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';

const Dashboard = () => {
  // API base goes through Next.js rewrite for LAN and localhost
  const API_BASE_URL = '/php';
    
  const [parentData, setParentData] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [visible, setVisible] = useState({});
  const [error, setError] = useState(null);
  const [childrenAtRisk, setChildrenAtRisk] = useState(0);
  const [childrenRiskDetails, setChildrenRiskDetails] = useState([]);
  const [progressData, setProgressData] = useState({
    labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
    datasets: []
  });

  useEffect(() => {
    // Show any queued toast from previous page (e.g., after login)
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

    const fetchParentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get parent ID from localStorage (assuming it's stored there after login)
        const parentId = localStorage.getItem('userId') || '23'; // Fallback to test ID
        
        // Fetch parent students data
        const response = await fetch(`${API_BASE_URL}/Users/get_parent_students.php?parent_id=${parentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setStudents(data.data.students);
          
          // Initialize visibility state for each student
          const visibilityState = {};
          data.data.students.forEach(student => {
            visibilityState[student.student_id] = true;
          });
          setVisible(visibilityState);
          
          // Initialize progress chart visibility state
          const progressVisibilityState = {};
          data.data.students.forEach(student => {
            const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim();
            progressVisibilityState[fullName] = true;
          });
          setVisible(prev => ({ ...prev, ...progressVisibilityState }));
          
          // Also initialize visibility for any existing progress data
          if (progressData.datasets.length > 0) {
            const existingProgressVisibility = {};
            progressData.datasets.forEach(dataset => {
              existingProgressVisibility[dataset.label] = true;
            });
            setVisible(prev => ({ ...prev, ...existingProgressVisibility }));
          }
          
          // Set parent data
          setParentData({
            parent_id: data.data.parent_id,
            total_children: data.data.total_children,
            active_students: data.data.active_students
          });
        } else {
          throw new Error(data.message || 'Failed to fetch parent data');
        }
      } catch (error) {
        console.error('Error fetching parent data:', error);
        
        // Check if it's a network/API error vs other errors
        if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
          setError('API endpoint not found. Please ensure the backend server is running.');
        } else {
          setError(error.message);
        }
        
        // Fallback to mock data if API fails
        setStudents([
          {
            student_id: 1,
            first_name: "Sarah",
            last_name: "Doe",
            full_name: "Sarah Doe",
            level_name: "Grade 10",
            school_status: "Active",
            gender: "Female",
            age: 15
          }
        ]);
        setParentData({
          parent_id: 23,
          total_children: 1,
          active_students: 1
        });
      } finally {
        setLoading(false);
        setProgressLoading(false);
      }
    };

    const fetchMeetings = async () => {
      try {
        setMeetingsLoading(true);
        
        // Get parent ID from localStorage
        const parentId = localStorage.getItem('userId');
        
        // Use the same API as calendar page with parent_only=1 parameter
        const response = await fetch(`${API_BASE_URL}/Meeting/get_meetings_details.php?user_id=${parentId}&parent_only=1`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.meetings)) {
          // Filter only upcoming meetings (Scheduled/Rescheduled) and format them
          const upcomingMeetings = data.meetings
            .filter(meeting => {
              const status = meeting.meeting_status;
              return status === 'Scheduled' || status === 'Rescheduled';
            })
            .filter(meeting => {
              // Only show meetings that haven't started yet
              const meetingStart = new Date(meeting.meeting_start);
              return meetingStart > new Date();
            })
            .sort((a, b) => new Date(b.meeting_start) - new Date(a.meeting_start))
            .map(meeting => {
              // Parse and format dates
              const startDate = new Date(meeting.meeting_start);
              const endDate = new Date(meeting.meeting_end);
              
              // Format date and time for display
              const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];
              const month = monthNames[startDate.getMonth()];
              const day = startDate.getDate();
              const year = startDate.getFullYear();
              const startTime = startDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              });
              const endTime = endDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              });
              
              return {
                id: meeting.meeting_id,
                title: meeting.meeting_title,
                date: `${month} ${day}, ${year}`,
                time: `${startTime} - ${endTime}`,
                agenda: meeting.meeting_agenda,
                created_by: meeting.created_by,
                status: meeting.meeting_status,
                parent_id: meeting.parent_id,
                student_id: meeting.student_id,
                advisory_id: meeting.advisory_id,
                // Use consistent colors from calendar page
                color: (() => {
                  const meetingColorMap = [
                    { name: "purple", hex: "#a78bfa" },
                    { name: "pink", hex: "#f472b6" },
                    { name: "green", hex: "#34d399" },
                    { name: "yellow", hex: "#facc15" },
                    { name: "orange", hex: "#fb923c" },
                    { name: "teal", hex: "#2dd4bf" },
                    { name: "indigo", hex: "#818cf8" }
                  ];
                  const colorIndex = meeting.meeting_id % meetingColorMap.length;
                  return meetingColorMap[colorIndex].hex;
                })()
              };
            });
          
          setUpcomingMeetings(upcomingMeetings);
        } else {
          console.error('Failed to fetch meetings:', data.message || 'Unknown error');
          setUpcomingMeetings([]);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setUpcomingMeetings([]);
      } finally {
        setMeetingsLoading(false);
      }
    };

    const fetchChildrenAtRisk = async () => {
      try {
        const parentId = localStorage.getItem('userId');
        if (!parentId) return;
        
        const response = await fetch(`${API_BASE_URL}/Users/get_parent_children_risk.php?parent_id=${parentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setChildrenAtRisk(data.data.children_at_risk_count);
          setChildrenRiskDetails(data.data.children_details);
        } else {
          console.error('Failed to fetch children risk data:', data.message);
          setChildrenAtRisk(0);
          setChildrenRiskDetails([]);
        }
      } catch (error) {
        console.error('Error fetching children risk data:', error);
        setChildrenAtRisk(0);
        setChildrenRiskDetails([]);
      }
    };

    const fetchProgressData = async () => {
      try {
        const parentId = localStorage.getItem('userId');
        if (!parentId) {
          console.log('No parent ID found, setting empty progress data');
          // Set empty data to indicate no parent ID
          setProgressData({
            labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            datasets: []
          });
          return;
        }
        
        console.log('Fetching progress data for parent ID:', parentId);
        const response = await fetch(`${API_BASE_URL}/Users/get_parent_children_progress.php?parent_id=${parentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Progress data response:', data);
        
        if (data.status === 'success' && data.data && data.data.datasets && data.data.datasets.length > 0) {
          console.log('Setting progress data:', data.data);
          // Map colors using the same palette as meetings, deterministically by label
          const meetingColorMap = [
            { name: "purple", hex: "#a78bfa" },
            { name: "pink", hex: "#f472b6" },
            { name: "green", hex: "#34d399" },
            { name: "yellow", hex: "#facc15" },
            { name: "orange", hex: "#fb923c" },
            { name: "teal", hex: "#2dd4bf" },
            { name: "indigo", hex: "#818cf8" }
          ];
          const hashLabel = (label) => {
            let h = 0;
            for (let i = 0; i < label.length; i++) {
              h = (h * 31 + label.charCodeAt(i)) >>> 0;
            }
            return h;
          };
          const coloredDatasets = data.data.datasets.map(ds => {
            const idx = hashLabel(String(ds.label || '')) % meetingColorMap.length;
            const color = meetingColorMap[idx].hex;
            return {
              ...ds,
              borderColor: color,
              backgroundColor: color + '20',
              pointBorderColor: color,
              pointBackgroundColor: color,
            };
          });
          setProgressData({ labels: data.data.labels, datasets: coloredDatasets });
        } else if (data.status === 'success' && data.data && data.data.datasets && data.data.datasets.length === 0) {
          // Parent has no children assigned - this is a valid state, not an error
          console.log('Parent has no children assigned yet');
          setProgressData({
            labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            datasets: []
          });
        } else {
          console.error('Failed to fetch progress data:', data.message || 'Unknown error');
          // Set fallback data to ensure chart displays
          setProgressData({
            labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            datasets: [
              {
                label: "Error Loading Data",
                data: [null, null, null, null],
                borderColor: "#EF4444",
                backgroundColor: "#EF444420",
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBorderWidth: 2,
                pointBorderColor: "#EF4444",
                pointBackgroundColor: "#EF4444",
                spanGaps: true,
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
        // Set fallback data to ensure chart displays
        setProgressData({
          labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
          datasets: [
            {
              label: "Error Loading Data",
              data: [null, null, null, null],
              borderColor: "#EF4444",
              backgroundColor: "#EF444420",
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBorderWidth: 2,
              pointBorderColor: "#EF4444",
              pointBackgroundColor: "#EF4444",
              spanGaps: true,
            }
          ]
        });
      }
    };

    const fetchNotifications = async () => {
      try {
        // Mock notifications for now - replace with actual API call later
        const mockNotifications = [
          {
            notification_id: 1,
            title: "New Grade Posted",
            message: "Math quiz grade has been posted",
            created_at: "2024-01-10T10:30:00",
            is_read: false
          },
          {
            notification_id: 2,
            title: "Upcoming Event",
            message: "Parent-Teacher Conference next week",
            created_at: "2024-01-09T14:15:00",
            is_read: false
          }
        ];
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchParentData();
    fetchMeetings();
    fetchNotifications();
    fetchChildrenAtRisk();
    fetchProgressData();
  }, []);

  // Update visibility states when progress data changes
  useEffect(() => {
    if (progressData.datasets && progressData.datasets.length > 0) {
      const newVisibilityState = {};
      progressData.datasets.forEach(dataset => {
        newVisibilityState[dataset.label] = true; // Show all datasets by default
      });
      setVisible(prev => ({ ...prev, ...newVisibilityState }));
    }
  }, [progressData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'passed':
      case 'completed':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'good':
      case 'satisfactory':
        return 'text-blue-600 bg-blue-100';
      case 'needs improvement':
      case 'failed':
      case 'inactive':
        return 'text-red-600 bg-red-100';
      case 'pending':
      case 'in progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'passed':
      case 'completed':
      case 'active':
        return <FaCheckCircle className="text-green-600" />;
      case 'needs improvement':
      case 'failed':
      case 'inactive':
        return <FaTimesCircle className="text-red-600" />;
      case 'pending':
      case 'in progress':
        return <FaClock className="text-yellow-600" />;
      default:
        return <FaExclamationTriangle className="text-gray-600" />;
    }
  };

  const toggleLine = (studentId) => {
    setVisible((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#232c67] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#232c67] text-white rounded-lg hover:bg-[#1a1f4d] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Parent-specific stats based on actual data
  const stats = [
    {
      label: "Total Children",
      value: parentData?.total_children || 0,
      color: "bg-blue-100 text-blue-700",
      iconBg: "bg-blue-200",
      icon: <FaChild className="text-blue-500 text-xl" />,
    },
    {
      label: "Active Students",
      value: parentData?.active_students || 0,
      color: "bg-green-100 text-green-700",
      iconBg: "bg-green-200",
      icon: <FaCheckDouble className="text-green-500 text-xl" />,
    },
    {
      label: "Children at Risk",
      value: childrenAtRisk,
      color: "bg-red-100 text-red-700",
      iconBg: "bg-red-200",
      icon: <FaExclamationTriangle className="text-red-500 text-xl" />,
    },
    {
      label: "Upcoming Meetings",
      value: upcomingMeetings.length,
      color: "bg-orange-100 text-orange-700",
      iconBg: "bg-orange-200",
      icon: <FaCalendarAlt className="text-orange-500 text-xl" />,
    },
  ];

  return (
    <div className="px-2 sm:px-0">
      {/* Stat Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {/* Navy blue accent bar on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#232c67]"></div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`rounded-full p-1.5 sm:p-2 ${stat.iconBg} border-2 border-[#232c67]/20`}>
                <div className="text-sm sm:text-base">
                  {stat.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#232c67] mb-0.5 truncate">{stat.label}</p>
                <h2 className="text-lg sm:text-xl font-bold text-[#232c67]">
                  {stat.value}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </section>  

     

      {/* Main Content Container - Chart and Meetings Combined */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3">
        {/* Content Row - Chart and Meetings content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Progress Chart Content */}
          <div className="col-span-1 lg:col-span-2">
            {/* Chart Header */}
            <div className="mb-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">Progress of Children</h3>
              <p className="text-xs sm:text-sm text-gray-600">Quarterly performance overview</p>
              
              {/* Chart Controls */}
              {progressData.datasets.length > 0 ? (
                <div className="flex justify-center mt-3">
                  <div className="flex flex-wrap items-center px-2 sm:px-3 py-1.5 gap-1.5 sm:gap-3 border border-gray-200 bg-gray-50 rounded-lg max-w-full overflow-x-auto">
                    {progressData.datasets.map((dataset) => (
                      <span
                        key={dataset.label}
                        className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm select-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                          visible[dataset.label]
                            ? "text-white font-medium bg-[#232c67] shadow-sm border border-[#232c67]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => toggleLine(dataset.label)}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: dataset.borderColor
                          }}
                        />
                        <span className="truncate max-w-16 sm:max-w-none">
                          {dataset.label.split(' ')[0]} {/* Show first name only */}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mt-3">
                  <div className="text-center text-xs sm:text-sm text-gray-500 px-2">
                    {students.length > 0 ? (
                      <>
                        <p className="font-medium text-gray-700">Children are linked but inactive</p>
                        <p className="text-xs mt-1 text-gray-500">Your children's accounts are currently inactive. Contact the school administration for assistance.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-700">No children assigned to your account yet</p>
                        <p className="text-xs mt-1 text-gray-500">Contact the school administration to link children to your account</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chart Container */}
            <div className="h-64 sm:h-72">
              {progressLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c2f6f] mr-3"></div>
                  <span className="text-sm">Loading progress data...</span>
                </div>
              ) : progressData.datasets.length > 0 ? (
                <Line 
                  data={{
                    labels: progressData.labels,
                    datasets: progressData.datasets.filter(dataset => {
                      return visible[dataset.label];
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
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                                      <div className="flex flex-col items-center justify-center p-4 sm:p-6">
                      <div className="relative mb-3 sm:mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#1e2a79] to-[#232c67] rounded-full flex items-center justify-center">
                          <FaChild className="text-2xl sm:text-3xl text-white" />
                        </div>
                      </div>
                      {students.length > 0 ? (
                        <>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 text-center">Children Linked But Inactive</h4>
                          <p className="text-xs text-gray-500 text-center max-w-40 sm:max-w-48 leading-relaxed px-2">
                            Your children are linked to your account but their accounts are currently inactive
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 text-center">No Children Assigned Yet</h4>
                          <p className="text-xs text-gray-500 text-center max-w-40 sm:max-w-48 leading-relaxed px-2">
                            Once children are linked to your account, their progress will appear here
                          </p>
                        </>
                      )}
                      <div className="mt-2 sm:mt-3 flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-200 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Meetings Content */}
          <div className="mt-4 lg:mt-0">
            {/* Meetings Header with Navy Blue Background */}
            <div className="bg-[#232c67] p-2 sm:p-3 rounded-t-lg -mt-2 sm:-mt-3 -mx-2 sm:-mx-3 mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-1.5 sm:gap-2">
                  <FaCalendarAlt className="text-white text-sm sm:text-lg" />
                  <span className="hidden sm:inline">Upcoming Meetings</span>
                  <span className="sm:hidden">Meetings</span>
                </h3>
                {!meetingsLoading && upcomingMeetings.length > 0 && (
                  <span className="text-xs text-white bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium border border-white/30">
                    {upcomingMeetings.length} Meeting{upcomingMeetings.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1 sm:pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {meetingsLoading ? (
                // Loading skeleton for meetings
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-2 sm:p-3 rounded-lg border border-gray-100">
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
                    onClick={() => window.location.href = '/ParentSection/Calendar'}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-100`}
                    style={{
                      borderLeft: `${String(meeting.created_by) === String(localStorage.getItem('userId') || '1') ? '4px solid #232c67' : '3px solid ' + meeting.color}`,
                      boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                      marginBottom: 6,
                      background: '#fff',
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#2c2f6f] leading-tight pr-2">
                        {meeting.title}
                      </h4>
                      {String(meeting.created_by) === String(localStorage.getItem('userId') || '1') && (
                        <span className="inline-block px-1.5 sm:px-2 py-0.5 text-xs rounded-md bg-[#232c67] text-white font-medium flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className="text-xs text-gray-600">{meeting.date}</span>
                      <span className="hidden sm:inline text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">{meeting.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{meeting.agenda}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 sm:p-4 rounded-lg border border-gray-200 text-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <FaBell className="text-gray-400 text-xs sm:text-sm" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    No upcoming meetings
                  </h4>
                  <p className="text-xs text-gray-400">No scheduled or rescheduled meetings found</p>
                  <button
                    onClick={() => window.location.href = '/ParentSection/Calendar'}
                    className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#232c67] bg-[#232c67]/5 hover:bg-[#232c67]/10 border border-[#232c67]/20 rounded-lg transition-colors duration-200"
                  >
                    View Calendar
                  </button>
                </div>
              )}
            </div>
            
            {/* View All Meetings Button */}
            {upcomingMeetings.length > 0 && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                <button
                  onClick={() => window.location.href = '/ParentSection/Calendar'}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#232c67] bg-[#232c67]/5 hover:bg-[#232c67]/10 border border-[#232c67]/20 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <FaCalendarAlt className="text-xs sm:text-sm" />
                  <span className="hidden sm:inline">View All Meetings in Calendar</span>
                  <span className="sm:hidden">View Calendar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
