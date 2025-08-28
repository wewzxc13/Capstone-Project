"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaEllipsisV, FaSearch, FaChevronDown, FaUser, FaUsers, FaCalendarAlt, FaFilter, FaMars, FaVenus, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import dynamic from "next/dynamic";
import { useUser } from "../../Context/UserContext";

const StudentStatus = dynamic(() => import("./StudentStatus/page"));
const StudentAssessment = dynamic(() => import("./StudentAssessment/page"));
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import '../../../lib/chart-config.js';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getUserPhoto, getStudentPhoto, updateAnyUserPhoto, updateAnyStudentPhoto, initializeAdvisoryPhotos } = useUser();

  const [allQuarterFeedbacks, setAllQuarterFeedbacks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Assessment");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [scheduleFilter, setScheduleFilter] = useState("All");
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const [studentRisks, setStudentRisks] = useState({});

  // Helper functions
  const getName = (s) => {
    if (s.stud_firstname && s.stud_lastname) {
      return `${s.stud_lastname}, ${s.stud_firstname} ${s.stud_middlename || ''}`.trim();
    }
    return s.name || s.stud_name || 'Unknown';
  };

  const getGender = (s) => s.gender || s.stud_gender || '';
  const getSchedule = (s) => s.schedule || s.stud_schedule_class || '';
  const getAge = (s) => s.age || s.stud_age || '';
  const getRisk = (s) => s.risk || s.stud_risk || s.risk_level || <span className="italic text-gray-400">No Data</span>;

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a different field, set it as primary sort and reset to asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="text-white text-xs" />;
    }
    return sortDirection === "asc" 
      ? <FaSortUp className="text-white text-xs" />
      : <FaSortDown className="text-white text-xs" />;
  };

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsScheduleDropdownOpen(false);
  };

  // Global error handler for images to prevent 404 errors in Network tab
  useEffect(() => {
    const handleImageError = (event) => {
      const img = event.target;
      
      // Hide the broken image and show fallback
      img.style.display = 'none';
      if (img.nextSibling) {
        img.nextSibling.style.display = 'flex';
      }
    };

    // Add global error handler for all images
    document.addEventListener('error', handleImageError, true);

    return () => {
      document.removeEventListener('error', handleImageError, true);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside of dropdown containers
      const isOutsideDropdowns = !event.target.closest('.dropdown-container');
      if (isOutsideDropdowns) {
        closeAllDropdowns();
      }
    };

    // Add event listener if any dropdown is open
    if (isScheduleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScheduleDropdownOpen]);

  // Filter students by active status and schedule
  const filteredStudents = students.filter(s => {
    // First, filter out inactive students
    if (s.stud_school_status === 'Inactive' || s.schoolStatus === 'Inactive') {
      return false;
    }
    
    // Schedule filtering
    if (scheduleFilter === "All") {
      return true;
    }
    
    const studentSchedule = getSchedule(s);
    
    // Map schedule values to filter options
    const scheduleMapping = {
      'Morning': ['Morning', 'AM', 'morning', 'am'],
      'Afternoon': ['Afternoon', 'PM', 'afternoon', 'pm']
    };
    
    if (scheduleFilter === "Morning" || scheduleFilter === "Afternoon") {
      return scheduleMapping[scheduleFilter].includes(studentSchedule);
    }
    
    return true;
  })
  // Filter by search term
  .filter(s => {
    if (!searchTerm) return true;
    const name = getName(s).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Sort filtered students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case "name":
        aValue = getName(a).toLowerCase() || "";
        bValue = getName(b).toLowerCase() || "";
        break;
      case "gender":
        aValue = getGender(a).toLowerCase() || "";
        bValue = getGender(b).toLowerCase() || "";
        break;
      case "session":
        aValue = getSchedule(a).toLowerCase() || "";
        bValue = getSchedule(b).toLowerCase() || "";
        break;
      case "risk":
        aValue = studentRisks[a.student_id] || "nodata";
        bValue = studentRisks[b.student_id] || "nodata";
        break;
      default:
        aValue = getName(a).toLowerCase() || "";
        bValue = getName(b).toLowerCase() || "";
    }
    
    // Ensure values are strings for localeCompare
    aValue = String(aValue);
    bValue = String(bValue);
    
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Use all sorted students for scrolling (no pagination)
  const displayStudents = sortedStudents;

  // Helper to calculate age from birthdate (YYYY-MM-DD)
  function calculateAge(birthdate) {
    if (!birthdate) return null;
    const today = new Date();
    const dob = new Date(birthdate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  // Helper to format teacher name as "Lastname, First Name Middle Name"
  function formatTeacherName(fullName) {
    if (!fullName) return "-";
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) return fullName;
    
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const middleName = nameParts.slice(1, -1).join(' ');
    
    if (middleName) {
      return `${lastName}, ${firstName} ${middleName}`;
    } else {
      return `${lastName}, ${firstName}`;
    }
  }

  // Reset page when search or filter changes
  useEffect(() => {
    // Reset to first page when search or filter changes
  }, [searchTerm, scheduleFilter]);

  // Fetch advisory and students on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      console.log('=== AUTO-DEBUG: Fetching advisory for teacher ID:', userId, '===');
      fetch("http://localhost/capstone-project/backend/Advisory/get_advisory_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: userId })
      })
        .then(res => res.json())
        .then(data => {
          console.log('=== AUTO-DEBUG: Advisory API response ===');
          console.log('Advisory data:', data.advisory);
          console.log('Students data received:', data.students);
          console.log('Students count:', data.students ? data.students.length : 0);
          console.log('=== AUTO-DEBUG: End advisory API response ===');
          
          // Check if teacher has an advisory class
          if (!data.advisory || !data.advisory.advisory_id) {
            setAdvisory(null);
            setStudents([]);
            setLoading(false);
            return;
          }
          
          setAdvisory(data.advisory);
          setStudents(data.students || []);
          
          // Initialize UserContext with advisory photos for real-time updates
          if (data.students && data.parents) {
            initializeAdvisoryPhotos(data.students, data.parents);
          }
          
          setLoading(false);
          
          // Auto-run debug check after loading data
          autoDebugAdvisory();
        })
        .catch((error) => {
          console.error('=== AUTO-DEBUG: Error fetching advisory ===', error);
          setLoading(false);
        });
    } else {
      console.log('=== AUTO-DEBUG: No userId found in localStorage ===');
      setLoading(false);
    }
  }, []);

  // On mount, select student if id param is present
  useEffect(() => {
    if (!students.length) return;
    const id = searchParams.get('id');
    if (id) {
      const found = students.find(s => String(s.student_id) === String(id) || String(s.id) === String(id));
      if (found) handleSelectStudent(found);
    }
  }, [students]);

  // Fetch risk for each student using the new API endpoint
  useEffect(() => {
    if (!advisory || !advisory.advisory_id || students.length === 0) return;
    fetchStudentRisks();
  }, [advisory, students]);

  // Schedule options for dropdown
  const scheduleOptions = ["All", "Morning", "Afternoon"];

  // Risk level mapping
  const riskColorMap = {
    1: "#10B981", // Green for Low
    2: "#F59E0B", // Yellow for Moderate
    3: "#EF4444", // Red for High
    "nodata": "#9CA3AF" // Gray for No Data
  };

  const riskNameMap = {
    1: "Low",
    2: "Moderate", 
    3: "High",
    "nodata": "No Data"
  };

  // Gender/total counts (only active students)
  const maleCount = filteredStudents.filter(s => (s.stud_gender || s.gender || '').toLowerCase() === 'male').length;
  const femaleCount = filteredStudents.filter(s => (s.stud_gender || s.gender || '').toLowerCase() === 'female').length;
  const totalCount = filteredStudents.length;
  
  // Debug: Log inactive student count
  const inactiveStudents = students.filter(s => s.stud_school_status === 'Inactive' || s.schoolStatus === 'Inactive');
  if (inactiveStudents.length > 0) {
    console.log('=== AUTO-DEBUG: Inactive students filtered out ===');
    console.log('Inactive students count:', inactiveStudents.length);
    inactiveStudents.forEach(s => {
      console.log('Inactive student:', s.stud_firstname, s.stud_lastname, 'Status:', s.stud_school_status || s.schoolStatus);
    });
    console.log('=== AUTO-DEBUG: End inactive students ===');
  }

  // Header class name (fallback if missing)
  const levelIdToClassName = {
    1: "Discoverer",
    2: "Explorer",
    3: "Adventurer"
  };
  const className = levelIdToClassName[advisory?.level_id] || advisory?.class_name || advisory?.level_name || "Class";
  const classAge = advisory?.class_age || advisory?.level_age || "2-4 yrs old";

  // Fetch student risks
  const fetchStudentRisks = async () => {
    if (!advisory?.advisory_id || students.length === 0) return;
    
    const risks = {};
    await Promise.all(students.map(async (student) => {
      let risk_id = "nodata";
      try {
        const riskRes = await fetch("http://localhost/capstone-project/backend/Assessment/get_student_risk_status.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            student_id: student.student_id, 
            advisory_id: advisory.advisory_id 
          })
        });
        const riskData = await riskRes.json();
        if (riskData.status === "success" && riskData.risk_id) {
          risk_id = riskData.risk_id;
        }
      } catch (e) {
        console.error('Error fetching risk for student:', student.student_id, e);
        toast.error(`Error loading risk data for student ${student.student_id}`);
      }
      risks[student.student_id] = risk_id;
    }));
    setStudentRisks(risks);
  };

  const refreshStudentRisk = async (studentId) => {
    if (!advisory?.advisory_id) return;
    
    console.log('🔄 Refreshing risk data for student:', studentId);
    
    try {
      const riskRes = await fetch("http://localhost/capstone-project/backend/Assessment/get_student_risk_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          student_id: studentId, 
          advisory_id: advisory.advisory_id 
        })
      });
      const riskData = await riskRes.json();
      if (riskData.status === "success") {
        const newRiskId = riskData.risk_id || "nodata";
        console.log('✅ Risk data updated for student', studentId, ':', newRiskId, riskData.risk_name);
        setStudentRisks(prev => ({
          ...prev,
          [studentId]: newRiskId
        }));
      }
    } catch (e) {
      console.error('❌ Error refreshing risk for student:', studentId, e);
    }
  };

  // Map student data for detail view
  const mapStudentForDetail = (s, extra = {}) => ({
    ...s,
    name: getName(s),
    gender: getGender(s),
    schedule: getSchedule(s),
    age: getAge(s),
    risk: getRisk(s),
    ...extra,
  });

  // Fetch student details and parent info when a student is selected
  const handleSelectStudent = async (s) => {
    setSelectedLoading(true);
    try {
      // Update URL with student id
      router.push(`/TeacherSection/Students?role=Student&id=${s.student_id || s.id}`);
      // Fetch student details
      const res = await fetch("http://localhost/capstone-project/backend/Users/get_student_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: s.student_id || s.id })
      });
      const data = await res.json();
      let studentDetail = {};
      if (data.status === 'success' && data.student) {
        studentDetail = {
          age: data.student.user_birthdate ? calculateAge(data.student.user_birthdate) : '',
          handedness: data.student.handedness || '',
          dob: data.student.user_birthdate || '',
          parent: '',
          parentContact: '',
        };
        // Fetch parent info if parentId exists
        if (data.student.parentId) {
          const parentRes = await fetch("http://localhost/capstone-project/backend/Users/get_user_details.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: data.student.parentId })
          });
          const parentData = await parentRes.json();
          if (parentData.status === 'success' && parentData.user) {
            studentDetail.parent = parentData.user.fullName || '';
            studentDetail.parentContact = parentData.user.contactNo || '';
          }
        }
      }
      setSelected(mapStudentForDetail(s, { ...studentDetail, advisory_id: advisory?.advisory_id }));
    } catch (e) {
      setSelected(mapStudentForDetail(s, { advisory_id: advisory?.advisory_id }));
    }
    setSelectedLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  const autoDebugAdvisory = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.log('Auto-debug: No user ID found in localStorage');
      return;
    }

    try {
      console.log('=== AUTO-DEBUG: Checking advisory assignments ===');
      const response = await fetch("http://localhost/capstone-project/backend/Advisory/fix_advisory_assignments.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      console.log('Auto-debug - Advisory assignments:', data);
      console.log('=== AUTO-DEBUG: End advisory assignments check ===');
    } catch (error) {
      console.error('Auto-debug error:', error);
    }
  };

  const renderChart = (data) => (
    <div className="h-48 w-full">
      <Line
        data={{
          labels: Array.from({ length: 11 }, (_, i) => `Week ${i + 1}`),
          datasets: [
            {
              label: "Performance",
              data,
              borderColor: "#253B80",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              ticks: {
                font: {
                  size: 8,
                },
              },
            },
            y: {
              min: 1,
              max: 5,
              ticks: {
                font: {
                  size: 8,
                },
                callback: (value) =>
                  ["", "Need Help", "Fair", "Good", "Very Good", "Excellent"][
                    value
                  ],
              },
            },
          },
        }}
      />
    </div>
  );

  const renderDetailView = () => {
    if (!selected) return null;
    
    const s = selected;
    
    return (
      <div className="h-full flex flex-col">
        {/* Sticky Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex">
            {["Assessment", "Status"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Student Info Header - show for both Assessment and Status tabs */}
        {(activeTab === "Assessment" || activeTab === "Status") && (
          <div className="bg-[#232c67] px-6 py-4 text-white flex flex-row items-center gap-8 sticky top-0 z-10">
            {/* Back Icon + Icon + Name (horizontal, large) */}
            <div className="flex flex-row items-center justify-center mr-8" style={{ minWidth: '260px' }}>
              <button
                onClick={() => setSelected(null)}
                className="text-white hover:text-blue-200 transition-colors mr-3"
                title="Back to student list"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              {(() => {
                // Get real-time photo from UserContext, fallback to student.photo if not available
                const realTimePhoto = getStudentPhoto(s.student_id) || s.photo;
                
                if (realTimePhoto) {
                  return (
                    <>
                      <img
                        src={realTimePhoto}
                        alt="Profile"
                        className="text-5xl bg-blue-200 rounded-full p-2 mr-4 w-16 h-16 object-cover shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Fallback icon that shows when photo fails to load */}
                      <div className="text-5xl bg-blue-200 rounded-full p-2 mr-4 flex items-center justify-center hidden">
                        <FaUser className="text-blue-600 text-2xl" />
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="text-5xl bg-blue-200 rounded-full p-2 mr-4 flex items-center justify-center">
                      <FaUser className="text-blue-600 text-2xl" />
                    </div>
                  );
                }
              })()}
              <span className="font-bold text-2xl text-left break-words leading-tight">{getName(s) || <span className="italic">No Name</span>}</span>
            </div>
            {/* Info fields (two stacked rows) */}
            <div className="flex flex-col flex-1">
              {/* First row: Schedule, Gender, Handedness */}
              <div className="flex flex-row items-center gap-6 mb-1">
                {/* Schedule */}
                <div className="flex flex-row items-center mx-2">
                  <span className="font-bold text-base text-blue-200 mr-1">Schedule:</span>
                  <span className="text-base font-normal">{getSchedule(s) || <span className="italic">-</span>}</span>
                </div>
                {/* Gender */}
                <div className="flex flex-row items-center mx-2">
                  <span className="font-bold text-base text-blue-200 mr-1">Gender:</span>
                  <span className="text-base font-normal">{getGender(s) || <span className="italic">-</span>}</span>
                </div>
                {/* Handedness */}
                <div className="flex flex-row items-center mx-2">
                  <span className="font-bold text-base text-blue-200 mr-1">Handedness:</span>
                  <span className="text-base font-normal">{s.handedness || <span className="italic">-</span>}</span>
                </div>
              </div>
              {/* Second row: Date of Birth, Parent */}
              <div className="flex flex-row items-center gap-6 mt-1">
                {/* Date of Birth */}
                <div className="flex flex-row items-center mx-2">
                  <span className="font-bold text-base text-blue-200 mr-1">Date of Birth:</span>
                  <span className="text-base font-normal">
                    {s.dob ? new Date(s.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="italic">-</span>}
                  </span>
                </div>
                {/* Parent */}
                <div className="flex flex-row items-center mx-2">
                  <span className="font-bold text-base text-blue-200 mr-1">Parent:</span>
                  <span className="text-base font-normal">{s.parent || <span className="italic">-</span>}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <div className="p-6 flex flex-col bg-white rounded-xl shadow">
            {activeTab === "Status" && (
              <StudentStatus student={s} renderChart={renderChart} onBack={() => setSelected(null)} />
            )}
            {activeTab === "Assessment" && (
              <StudentAssessment 
                student={s} 
                onBack={() => setSelected(null)} 
                onRiskUpdate={() => refreshStudentRisk(s.student_id)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1">
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading student data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
        </div>
      ) : !advisory ? (
        <div className="flex flex-col justify-center items-center h-80 text-center px-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <FaUser className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Advisory Class Assigned</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have an advisory class assigned yet. Please contact your administrator to set up your advisory class before you can manage students.
          </p>
        </div>
      ) : !selected ? (
        <>
          {/* Combined Controls and Class Overview Section */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
              <div className="flex flex-col gap-2">
                {/* Top Row - Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          placeholder="Search by student name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors caret-[#1E2A79]"
                          style={{ minHeight: '2rem' }}
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Clear search"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Session Filter Dropdown */}
                    <div className="relative dropdown-container">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                      <button
                        className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        onClick={() => {
                          setIsScheduleDropdownOpen((open) => !open);
                        }}
                        style={{ minHeight: '2rem' }}
                      >
                        <FaCalendarAlt className="text-gray-400" />
                        <span>{scheduleFilter}</span>
                        <FaChevronDown className={`text-sm transition-transform ${isScheduleDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isScheduleDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            {scheduleOptions.map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setScheduleFilter(option);
                                  closeAllDropdowns();
                                }}
                                className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors ${
                                  scheduleFilter === option ? "bg-blue-50 text-blue-900" : "text-gray-900"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row - Class Overview */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-gray-200">
                  {/* Teachers Info */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Lead Teacher:</span>
                      <span className="text-sm text-gray-900">
                        {advisory?.lead_teacher_name ? formatTeacherName(advisory.lead_teacher_name) : <span className='italic text-gray-400'>None</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Assistant Teacher:</span>
                      <span className="text-sm text-gray-900">
                        {advisory?.assistant_teacher_name ? formatTeacherName(advisory.assistant_teacher_name) : <span className='italic text-gray-400'>None</span>}
                      </span>
                    </div>
                  </div>

                  {/* Class Info Badge */}
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-900">{className}</div>
                    </div>
                  </div>

                  {/* Student Demographics */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full">
                      <FaMars className="text-blue-600 text-sm" />
                      <span className="text-sm font-medium text-blue-900">Male: {maleCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-pink-50 rounded-full">
                      <FaVenus className="text-pink-600 text-sm" />
                      <span className="text-sm font-medium text-pink-900">Female: {femaleCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full">
                      <FaUsers className="text-green-600 text-sm" />
                      <span className="text-sm font-medium text-green-700">Total: {totalCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-80 text-center px-6">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FaUsers className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No Students Match Your Search' : `No Students in ${scheduleFilter} Session`}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {searchTerm 
                    ? `No students found matching "${searchTerm}".`
                    : `There are no students assigned to the ${scheduleFilter.toLowerCase()} session. Try contact your administrator if this is incorrect.`
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full">
                <div className={displayStudents.length > 5 ? "overflow-y-auto" : ""} style={displayStudents.length > 5 ? { maxHeight: '385px' } : {}}>
                  <table className="min-w-full text-sm text-gray-900" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead className={`bg-[#232c67] text-white border-b border-[#1a1f4d] ${displayStudents.length > 5 ? "sticky top-0 z-10" : ""}`}>
                      <tr>
                        <th 
                          className="sticky top-0 z-20 text-left px-6 py-3 font-semibold text-white cursor-pointer hover:bg-[#2b3572] transition-colors bg-[#232c67]" 
                          style={{ width: '35%' }}
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Student Name
                            {getSortIcon("name")}
                          </div>
                        </th>
                        <th 
                          className="sticky top-0 z-20 text-left px-6 py-3 font-semibold text-white cursor-pointer hover:bg-[#2b3572] transition-colors bg-[#232c67]" 
                          style={{ width: '20%' }}
                          onClick={() => handleSort("gender")}
                        >
                          <div className="flex items-center gap-2">
                            Gender
                            {getSortIcon("gender")}
                          </div>
                        </th>
                        <th 
                          className="sticky top-0 z-20 text-left px-6 py-3 font-semibold text-white cursor-pointer hover:bg-[#2b3572] transition-colors bg-[#232c67]" 
                          style={{ width: '25%' }}
                          onClick={() => handleSort("session")}
                        >
                          <div className="flex items-center gap-2">
                            Session
                            {getSortIcon("session")}
                          </div>
                        </th>
                        <th 
                          className="sticky top-0 z-20 text-center px-6 py-3 font-semibold text-white cursor-pointer hover:bg-[#2b3572] transition-colors bg-[#232c67]" 
                          style={{ width: '20%' }}
                          onClick={() => handleSort("risk")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Risk Level
                            {getSortIcon("risk")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayStudents.map((s, idx) => (
                        <tr key={`${s.student_id}-${idx}`} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleSelectStudent(s)}>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {(() => {
                                // Get real-time photo from UserContext, fallback to student.photo if not available
                                const realTimePhoto = getStudentPhoto(s.student_id) || s.photo;
                                
                                if (realTimePhoto) {
                                  return (
                                    <>
                                      <img
                                        src={realTimePhoto}
                                        alt="Profile"
                                        className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      {/* Fallback icon that shows when photo fails to load */}
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 hidden">
                                        <FaUser className="text-sm text-blue-600" />
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                      <FaUser className="text-sm text-blue-600" />
                                    </div>
                                  );
                                }
                              })()}
                              <div className="font-medium text-gray-900 flex-1 min-w-0 truncate">{getName(s)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getGender(s)?.toLowerCase() === "male"
                                ? "bg-blue-100 text-blue-800"
                                : getGender(s)?.toLowerCase() === "female"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {getGender(s) || <span className="italic text-gray-400">No Data</span>}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getSchedule(s) === "Morning" || getSchedule(s) === "AM"
                                ? "bg-blue-100 text-blue-800"
                                : getSchedule(s) === "Afternoon" || getSchedule(s) === "PM"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {getSchedule(s) || <span className="italic text-gray-400">No Data</span>}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: riskColorMap[studentRisks[s.student_id] || "nodata"]
                                }}
                              ></span>
                              <span className="text-sm font-medium text-gray-900">
                                {riskNameMap[studentRisks[s.student_id] || "nodata"]}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="h-[calc(100vh-190px)] overflow-y-auto">
          {selectedLoading ? (
            <div className="flex justify-center items-center h-40 text-blue-900 font-semibold">Loading student details...</div>
          ) : renderDetailView()}
        </div>
      )}
    </main>
  );
}
