"use client";
import React, { useState, useMemo, useEffect } from "react";
import { FaArrowLeft, FaUser, FaMale, FaFemale, FaUsers, FaChalkboardTeacher, FaMars, FaVenus, FaChartBar, FaTable, FaExclamationTriangle, FaComments, FaSave, FaEdit, FaTimes, FaCheckCircle, FaRegClock, FaPlusCircle, FaChartLine, FaSearch, FaChevronDown, FaLock } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import '../../../../lib/chart-config.js';
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../../Context/UserContext";

export default function StudentProgress({ formData: initialFormData }) {
  const [activeTab, setActiveTab] = useState("Class Overview");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const router = useRouter();
  const { getUserPhoto, getStudentPhoto, initializeAdvisoryPhotos } = useUser();

  // State for class and session selection
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);

  // State for teaching staff
  const [leadTeacher, setLeadTeacher] = useState("");
  const [assistantTeacher, setAssistantTeacher] = useState("");
  const [advisory, setAdvisory] = useState(null);

  // State for student data
  const [studentData, setStudentData] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");

  // Assessment data states
  const [visualFeedback, setVisualFeedback] = useState([]);
  const [riskLevels, setRiskLevels] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [quarterFeedback, setQuarterFeedback] = useState([]);
  const [progressCards, setProgressCards] = useState([]);
  const [quartersData, setQuartersData] = useState([]);
  const [finalSubjectProgress, setFinalSubjectProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  
  // Status data states
  const [statusLoading, setStatusLoading] = useState(false);
  const [overallRisk, setOverallRisk] = useState({ risk: null });
  const [visualFeedbackMap, setVisualFeedbackMap] = useState({});
  const [quarterlyPerformance, setQuarterlyPerformance] = useState([]);
  const [milestoneSummary, setMilestoneSummary] = useState("");
  const [milestoneOverallSummary, setMilestoneOverallSummary] = useState("");
  const [milestoneRecordedAt, setMilestoneRecordedAt] = useState(null);
  const [milestoneId, setMilestoneId] = useState(null);

  // Tooltip states for Status tab
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const quarters = [
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ];

  // Load classes and sessions on component mount
  useEffect(() => {
    loadClasses();
    loadSessions();
  }, []);

  // Load students when class or session changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudent(null);
      setLeadTeacher("");
      setAssistantTeacher("");
      setAdvisory(null);
    }
  }, [selectedClass, selectedSession]);

  // Auto-switch to Assessment tab when student is selected
  useEffect(() => {
    if (selectedStudent && activeTab === "Class Overview") {
      setActiveTabSafely("Assessment");
    }
  }, [selectedStudent]);

  // Reset selected student when switching back to Class Overview tab
  useEffect(() => {
    if (activeTab === "Class Overview") {
      setSelectedStudent(null);
    }
  }, [activeTab]);

  // Auto-switch to Assessment tab if Status is active but no progress data is available
  useEffect(() => {
    if (activeTab === "Status" && selectedStudent && !hasOverallProgress()) {
      
      setActiveTabSafely("Assessment");
    }
  }, [activeTab, selectedStudent, overallProgress, quarterlyPerformance]);



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (classDropdownOpen && !event.target.closest('.class-dropdown')) {
        setClassDropdownOpen(false);
      }
      if (sessionDropdownOpen && !event.target.closest('.session-dropdown')) {
        setSessionDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [classDropdownOpen, sessionDropdownOpen]);

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

  // Fetch assessment data when student is selected
  useEffect(() => {
    if (!selectedStudent || !selectedStudent.student_id) return;
    
    // Check if we have the required advisory_id
    if (!selectedStudent.advisory_id) {
      console.log('No advisory_id found for student:', selectedStudent);
      setAssessmentLoading(false);
      return;
    }
    
    setAssessmentLoading(true);
    
    const fetchAssessmentData = async () => {
      try {
        const promises = [
          fetch("/php/Assessment/get_visual_feedback.php"),
          fetch("/php/Assessment/get_risk_levels.php"),
          fetch(`/php/Assessment/get_comments.php?student_id=${selectedStudent.student_id}`),
          fetch("/php/Advisory/get_attendance.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              advisory_id: selectedStudent.advisory_id,
              student_id: selectedStudent.student_id 
            })
          }),
          fetch(`/php/Assessment/get_subjects_by_advisory.php?advisory_id=${selectedStudent.advisory_id}`),
          fetch(`/php/Assessment/get_student_quarter_feedback.php?student_id=${selectedStudent.student_id}`),
          fetch(`/php/Assessment/get_student_progress_cards.php?student_id=${selectedStudent.student_id}&advisory_id=${selectedStudent.advisory_id}`),
          fetch('/php/Assessment/get_quarters.php'),
          fetch(`/php/Assessment/get_subject_overall_progress.php?student_id=${selectedStudent.student_id}&advisory_id=${selectedStudent.advisory_id}`),
          fetch('/php/Assessment/get_overall_progress.php?student_id=' + selectedStudent.student_id + '&advisory_id=' + selectedStudent.advisory_id)
        ];

        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(res => res.json()));

        // Process visual feedback
        if (data[0].status === 'success') {
          setVisualFeedback(data[0].feedback);
        }

        // Process risk levels
        if (data[1].status === 'success') {
          setRiskLevels(data[1].risk_levels || []);
        }

        // Process comments
        if (data[2].status === 'success') {
          setComments(data[2].comments || []);
        }

        // Process attendance data
        if (data[3].status === 'success') {
          setAttendanceData(data[3].attendance || []);
        }

        // Process subjects
        if (data[4].status === 'success' && Array.isArray(data[4].subjects)) {
          const subjectNames = data[4].subjects.map(subject => subject.subject_name);
          setSubjects(subjectNames);
        }

        // Process quarter feedback
        if (data[5].status === 'success') {
          setQuarterFeedback(data[5].feedback || []);
        }

        // Process progress cards
        if (data[6].status === 'success' && Array.isArray(data[6].cards)) {
          setProgressCards(data[6].cards);
        }

        // Process quarters data
        if (Array.isArray(data[7])) {
          setQuartersData(data[7]);
        }

        // Process subject overall progress
        if (data[8].status === 'success') {
          setFinalSubjectProgress(data[8].progress || []);
        }

        // Process overall progress
        if (data[9].status === 'success' && data[9].progress) {
                  setOverallProgress(data[9].progress);
      }


        
        setAssessmentLoading(false);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        toast.error('Failed to load assessment data. Please try again.');
        setAssessmentLoading(false);
      }
    };

    
    
    // Clear previous data first to avoid showing wrong data
    setVisualFeedback([]);
    setRiskLevels([]);
    setComments([]);
    setAttendanceData([]);
    setSubjects([]);
    setQuarterFeedback([]);
    setProgressCards([]);
    setQuartersData([]);
    setFinalSubjectProgress([]);
    setOverallProgress(null);
    
    fetchAssessmentData();
  }, [selectedStudent]);

  // Fetch status data when student is selected
  useEffect(() => {
    if (!selectedStudent || !selectedStudent.student_id) return;
    
    // Check if we have the required advisory_id
    if (!selectedStudent.advisory_id) {
      console.log('No advisory_id found for student:', selectedStudent);
      setStatusLoading(false);
      return;
    }
    
    setStatusLoading(true);
    
    const fetchStatusData = async () => {
      try {
        const promises = [
          fetch(`/php/Assessment/get_subject_overall_progress.php?student_id=${selectedStudent.student_id}&advisory_id=${selectedStudent.advisory_id}`),
          fetch(`/php/Assessment/get_overall_progress.php?student_id=${selectedStudent.student_id}&advisory_id=${selectedStudent.advisory_id}`),
          fetch("/php/Assessment/get_visual_feedback.php"),
          fetch(`/php/Assessment/get_student_progress_cards.php?student_id=${selectedStudent.student_id}&advisory_id=${selectedStudent.advisory_id}`),
          fetch(`/php/Assessment/get_milestone_interpretation.php?student_id=${selectedStudent.student_id}`)
        ];

        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(res => res.json()));

        // Process subject progress
        if (data[0].status === 'success') {
          setFinalSubjectProgress(data[0].progress || []);
        }

        // Process overall risk
        if (data[1].status === 'success' && data[1].progress && data[1].progress.risk_id) {
          setOverallRisk({ risk: data[1].progress.risk_id });
        }

        // Process visual feedback
        if (data[2].status === 'success' && Array.isArray(data[2].feedback)) {
          const map = {};
          data[2].feedback.forEach(fb => {
            map[fb.visual_feedback_id] = fb.visual_feedback_description;
          });
          setVisualFeedbackMap(map);
        }

        // Process progress cards
        if (data[3].status === 'success' && Array.isArray(data[3].cards)) {
                  setQuarterlyPerformance(data[3].cards);
      }

        // Process milestone interpretation
        if (data[4].status === 'success' && data[4].milestone) {
          setMilestoneSummary(data[4].milestone.summary);
          setMilestoneOverallSummary(data[4].milestone.overall_summary);
          setMilestoneRecordedAt(data[4].milestone.recorded_at);
          setMilestoneId(data[4].milestone.milestone_id);
        }



        setStatusLoading(false);
      } catch (err) {
        console.error('Error fetching status data:', err);
        toast.error('Failed to load status data. Please try again.');
        setStatusLoading(false);
      }
    };

    
    
    // Clear previous data first to avoid showing wrong data
    setQuarterlyPerformance([]);
    setMilestoneSummary(null);
    setMilestoneOverallSummary(null);
    setMilestoneRecordedAt(null);
    setMilestoneId(null);
    setFinalSubjectProgress([]);
    setOverallRisk({});
    
    fetchStatusData();
  }, [selectedStudent]);

  const loadClasses = async () => {
    try {
      const response = await fetch("/php/Advisory/list_class_levels.php");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === "success") {
        setClasses(data.levels || []);
      } else {
        console.error("Failed to fetch classes:", data.message);
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes. Please check your connection.");
      setClasses([]);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch("/php/Advisory/get_available_sessions.php");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === "success") {
        setSessions(data.sessions || []);
      } else {
        console.error("Failed to fetch sessions:", data.message);
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions. Please check your connection.");
      setSessions([]);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      // Use the same API endpoint as AssignedClass to get consistent photo data
      const response = await fetch("/php/Advisory/get_advisory_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_id: selectedClass
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.advisory !== undefined) {
        // Filter students by session if a specific session is selected
        let filteredStudents = data.students || [];
        if (selectedSession && selectedSession !== "") {
          filteredStudents = filteredStudents.filter(student => 
            student.stud_schedule_class === selectedSession
          );
        }
        
        // Check for duplicate student IDs
        const studentIds = filteredStudents.map(s => s.student_id);
        const duplicateIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          console.warn('⚠️ DUPLICATE STUDENT IDs DETECTED in StudentProgress:', duplicateIds);
          console.warn('This may cause React rendering issues. Check backend API for duplicate records.');
        }
        

        
        // Fetch parent information for each student (like Teacher section does)
        const studentsWithParents = await Promise.all(
          filteredStudents.map(async (student) => {
            if (student.parent_id) {
              try {
                const parentRes = await fetch("/php/Users/get_user_details.php", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ user_id: student.parent_id })
                });
                const parentData = await parentRes.json();
                
                if (parentData.status === 'success' && parentData.user) {
                  return {
                    ...student,
                    parent_firstname: parentData.user.firstName || '',
                    parent_middlename: parentData.user.middleName || '',
                    parent_lastname: parentData.user.lastName || ''
                  };
                }
              } catch (error) {
                console.error(`Error fetching parent info for student ${student.student_id}:`, error);
              }
            }
            
            // Return student without parent info if fetch failed or no parent_id
            return {
              ...student,
              parent_firstname: null,
              parent_middlename: null,
              parent_lastname: null
            };
          })
        );
        

        
        setStudents(studentsWithParents);
        setAdvisory(data.advisory);
        
        // Initialize UserContext with student and parent photos for real-time updates
        if (studentsWithParents.length > 0 || (data.parents && data.parents.length > 0)) {
          initializeAdvisoryPhotos(studentsWithParents, data.parents || []);
        }
        
        // Set teacher information from advisory data
        if (data.advisory?.lead_teacher_name) {
          setLeadTeacher(data.advisory.lead_teacher_name);
        } else {
          setLeadTeacher("");
        }
        
        if (data.advisory?.assistant_teacher_name) {
          setAssistantTeacher(data.advisory.assistant_teacher_name);
        } else {
          setAssistantTeacher("");
        }
        
        // Reset selected student when loading new data
        setSelectedStudent(null);
      } else {
        console.error("Failed to fetch advisory data:", data.message);
        setStudents([]);
        setLeadTeacher("");
        setAssistantTeacher("");
      }
    } catch (error) {
      console.error("Error fetching advisory data:", error);
      toast.error("Failed to load students. Please check your connection.");
      setStudents([]);
      setLeadTeacher("");
      setAssistantTeacher("");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  function formatDateOfBirth(dateStr) {
    if (!dateStr) return <span className="italic text-gray-400">-</span>;
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const getDisplayName = (key) => {
    if (key === "Socio") return "Socio Emotional";
    if (key === "Literacy") return "Literacy/English";
    if (key === "Math") return "Mathematical Skills";
    if (key === "Physical Activities") return "Physical Activities";
    return key;
  };

  const getRiskLevelColor = (riskId) => {
    if (riskId === 1 || riskId === '1') return '#22c55e'; // green
    if (riskId === 2 || riskId === '2') return '#fbbf24'; // yellow
    if (riskId === 3 || riskId === '3') return '#ef4444'; // red
    return '#9ca3af'; // gray
  };

  // Helper to determine risk status color and text from risk_id
  const getRiskInfo = (riskId) => {
    if (!riskId) return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
    if (riskId === 1 || riskId === '1') return { text: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
    if (riskId === 2 || riskId === '2') return { text: 'Moderate', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    if (riskId === 3 || riskId === '3') return { text: 'High', color: 'bg-red-500', textColor: 'text-red-700' };
    return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
  };

  // Helper to check if student has overall progress across multiple quarters
  /**
   * STRICT: Only returns true if student has a record in tbl_overall_progress
   * This ensures that sections are ONLY displayed when there's actual overall progress data
   */
  function hasOverallProgress() {
    // Don't show progress while data is loading
    if (assessmentLoading || statusLoading) {
      return false;
    }
    
            // Check if there's overall progress data from the database
        if (overallProgress && Object.keys(overallProgress).length > 0) {
          return true;
        }
        
        // Fallback: also check if there's milestone interpretation data
        if (milestoneSummary || milestoneOverallSummary) {
          return true;
        }
        
        return false;
  }

  /**
   * Helper to check if student has any progress at all (at least 1 quarter)
   * Used to determine which fallback message to show
   */
  function hasAnyProgress() {
    // Don't show progress while data is loading
    if (assessmentLoading || statusLoading) {
      return false;
    }
    
    if (!quarterlyPerformance || quarterlyPerformance.length === 0) {
      return false;
    }
    
    // Check if there's at least 1 quarter with data
    const quartersWithData = quarterlyPerformance.filter(card => 
      card.quarter_visual_feedback_id && card.quarter_visual_feedback_id > 0
    ).length;
    
    return quartersWithData >= 1;
  }

  // Safe tab setting function to prevent setting Status tab when locked
  const setActiveTabSafely = (tab) => {
    if (tab === "Status" && !hasOverallProgress()) {
      
      return;
    }
    setActiveTab(tab);
  };

  // Tooltip functions for Status tab
  const handleStatusMouseEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowStatusTooltip(true);
  };

  const handleStatusMouseLeave = () => {
    setShowStatusTooltip(false);
  };

  const getStatusTooltipMessage = () => {
    if (!hasOverallProgress() && !hasAnyProgress()) {
      return "No Assessment Data Available - No quarterly assessments have been completed yet. Assessment data is required to generate progress analysis.";
    }
    if (!hasOverallProgress()) {
      return "Progress Assessment Pending - To view the student's Final Risk Status, Performance Summary, Quarterly Performance Trend Chart, and Final Subject Averages, overall progress data is required.";
    }
    return "";
  };

  // Helper to render status chart
  function renderStatusChart() {
    // Y-axis: Excellent, Very Good, Good, Need Help, Not Met
    const yLabels = ["Excellent", "Very Good", "Good", "Need Help", "Not Met"];
    // CORRECT mapping based on visual_feedback_id:
    // visual_feedback_id = 1 → "Excellent" (score = 5)
    // visual_feedback_id = 2 → "Very Good" (score = 4)
    // visual_feedback_id = 3 → "Good" (score = 3)
    // visual_feedback_id = 4 → "Need Help" (score = 2)
    // visual_feedback_id = 5 → "Not Met" (score = 1)
    const yMap = { 'Excellent': 5, 'Very Good': 4, 'Good': 3, 'Need Help': 2, 'Not Met': 1 };
    const xLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    // Map progress cards to y values
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });
    
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <FaChartLine className="text-4xl mb-4 text-gray-300" />
          <p className="text-lg font-medium">No chart data available</p>
          <p className="text-sm text-gray-500 mt-2">Quarterly performance data will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="h-64 w-full bg-white rounded-lg border border-gray-200 p-4">
        <Line
          data={{
            labels: xLabels,
            datasets: [
              {
                label: "Performance",
                data: dataPoints,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: "#2563eb",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                spanGaps: true,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#2563eb',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                  label: function(context) {
                    const val = context.parsed.y;
                    const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                    return `Performance: ${labels[Math.round(val)] || 'N/A'}`;
                  }
                }
              }
            },
            scales: {
              y: {
                min: 0.5,
                max: 5.5,
                ticks: {
                  stepSize: 1,
                  callback: function(value) {
                    const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                    return labels[Math.round(value)] || '';
                  },
                  font: { size: 12, weight: '500' },
                  color: '#6b7280',
                },
                grid: { 
                  color: '#e5e7eb',
                  drawBorder: false,
                },
                title: {
                  display: true,
                  text: 'Performance Level',
                  font: { size: 14, weight: '600' },
                  color: '#374151',
                  padding: { top: 10, bottom: 10 }
                }
              },
              x: {
                ticks: { 
                  font: { size: 12, weight: '500' },
                  color: '#6b7280',
                },
                grid: { 
                  color: '#e5e7eb',
                  drawBorder: false,
                },
                title: {
                  display: true,
                  text: 'Quarter',
                  font: { size: 14, weight: '600' },
                  color: '#374151',
                  padding: { top: 10, bottom: 10 }
                }
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          }}
        />
      </div>
    );
  }

  // Add shapeColorMap for consistent coloring
  const shapeColorMap = {
    '❤️': '#ef4444', // red
    '⭐': '#fbbf24', // yellow
    '🔷': '#2563eb', // blue
    '▲': '#f59e42', // orange
    '🟡': '#facc15'  // gold/yellow
  };

  // Helper to check if all subjects have feedback for a given quarter
  function allSubjectsHaveFeedbackForQuarter(qid) {
    return subjects.length > 0 && quarterFeedback.filter(fb => Number(fb.quarter_id) === qid).length === subjects.length;
  }

  function getAttendanceSummary() {
    if (!attendanceData) return null;
    
    const months = [7,8,9,10,11,0,1,2,3]; // Aug-Apr
    const monthLabels = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const summary = monthLabels.map((label, idx) => {
      const month = months[idx];
      const studentMonth = attendanceData.filter(a => new Date(a.attendance_date).getMonth() === month);
      
      // Get unique dates for this month
      const uniqueDates = [...new Set(studentMonth.map(a => a.attendance_date))];
      
      // For each unique date, determine if student was present or absent
      const dateStatuses = uniqueDates.map(date => {
        const recordsForDate = studentMonth.filter(a => a.attendance_date === date);
        // If any record for this date shows "Present", count as present
        const hasPresent = recordsForDate.some(a => a.attendance_status === 'Present');
        return hasPresent ? 'Present' : 'Absent';
      });
      
      return {
        label,
        total: uniqueDates.length,
        present: dateStatuses.filter(status => status === 'Present').length,
        absent: dateStatuses.filter(status => status === 'Absent').length
      };
    });
    const totalSchoolDays = summary.reduce((a, b) => a + b.total, 0);
    const totalPresent = summary.reduce((a, b) => a + b.present, 0);
    const totalAbsent = summary.reduce((a, b) => a + b.absent, 0);
    
    return { summary, totalSchoolDays, totalPresent, totalAbsent };
  }

  // Empty chart data
  const emptyChartData = {
    labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
    datasets: [
      {
        label: "Performance",
        data: [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        spanGaps: true,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#2563eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const val = context.parsed.y;
            const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
            return `Performance: ${labels[Math.round(val)] || 'N/A'}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0.5,
        max: 5.5,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
            return labels[Math.round(value)] || '';
          },
          font: { size: 12, weight: '500' },
          color: '#6b7280',
        },
        grid: { 
          color: '#e5e7eb',
          drawBorder: false,
        },
        title: {
          display: true,
          text: 'Performance Level',
          font: { size: 14, weight: '600' },
          color: '#374151',
          padding: { top: 10, bottom: 10 }
        }
      },
      x: {
        ticks: { 
          font: { size: 12, weight: '500' },
          color: '#6b7280',
        },
        grid: { 
          color: '#e5e7eb',
          drawBorder: false,
        },
        title: {
          display: true,
          text: 'Quarter',
          font: { size: 14, weight: '600' },
          color: '#374151',
          padding: { top: 10, bottom: 10 }
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    toast.success("Changes saved successfully!");
  };

  const handleDelete = () => {
    // Delete logic here (UI only)
    router.push("/SuperAdminSection/Users");
  };

  // Calculate student counts (filtered by search)
  const filteredStudents = students.filter(s => 
    (`${s.stud_lastname}, ${s.stud_firstname} ${s.stud_middlename || ''}`.toLowerCase().includes(studentSearch.toLowerCase()))
  );
  const maleCount = filteredStudents.filter(s => s.stud_gender === "Male").length;
  const femaleCount = filteredStudents.filter(s => s.stud_gender === "Female").length;
  const totalCount = filteredStudents.length;

  return (
    <ProtectedRoute role="Super Admin">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/SuperAdminSection/Users')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Users</span>
            </button>
          <h2 className="text-lg font-bold text-gray-900">Student Progress Management</h2>
        </div>

          {/* Tab Navigation */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTabSafely("Class Overview")}
              className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors ${
                activeTab === "Class Overview"
                  ? "border-[#2c2f6f]"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              Class Overview
            </button>
            {selectedStudent && (
              <>
                <button
                  onClick={() => setActiveTabSafely("Assessment")}
                  className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors ${
                    activeTab === "Assessment"
                      ? "border-[#2c2f6f]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  Assessment
                </button>
                <div
                  onMouseEnter={handleStatusMouseEnter}
                  onMouseLeave={handleStatusMouseLeave}
                  className="relative"
                >
                  <button
                    onClick={() => setActiveTabSafely("Status")}
                    disabled={!hasOverallProgress()}
                    className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors flex items-center gap-2 ${
                      activeTab === "Status"
                        ? "border-[#2c2f6f]"
                        : "border-transparent hover:border-gray-300"
                    } ${
                      !hasOverallProgress()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Status
                    {!hasOverallProgress() && (
                      <FaLock className="text-sm text-gray-500" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Tooltip for Status Tab */}
      {showStatusTooltip && !hasOverallProgress() && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg"
          style={{
            left: tooltipPosition.x - 100,
            top: tooltipPosition.y,
            width: '200px',
            textAlign: 'center'
          }}
        >
          <div className="text-center">
            {getStatusTooltipMessage()}
          </div>
          {/* Arrow pointing up */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {activeTab === "Class Overview" ? (
        /* Class Overview Tab - Contains header and student selection */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Class, Session Selection and Student List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Dropdowns and Teaching Staff */}
          <div className="space-y-6">
            {/* Dropdowns */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="font-semibold text-gray-700 mb-1 block text-sm">Select Class</label>
                <div className="relative class-dropdown">
                  <button
                    type="button"
                    onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                    disabled={loading}
                    className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {selectedClass ? classes.find(cls => cls.level_id == selectedClass)?.level_name : "Select a class"}
                    </span>
                    <FaChevronDown className={`text-xs transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {classDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden max-h-48 overflow-y-auto">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedClass("");
                            setClassDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 transition-colors text-gray-700 hover:bg-blue-50"
                        >
                          <div className="font-medium">Select a class</div>
                        </button>
                        {classes.map(cls => (
                          <button
                            key={cls.level_id}
                            onClick={() => {
                              setSelectedClass(cls.level_id);
                              setClassDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 transition-colors ${
                              selectedClass == cls.level_id 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            <div className="font-medium">{cls.level_name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="font-semibold text-gray-700 mb-1 block text-sm">Select Session</label>
                <div className="relative session-dropdown">
                  <button
                    type="button"
                    onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
                    disabled={loading || !selectedClass}
                    className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {selectedSession || "All Sessions"}
                    </span>
                    <FaChevronDown className={`text-xs transition-transform ${sessionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {sessionDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden max-h-48 overflow-y-auto">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedSession("");
                            setSessionDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 transition-colors ${
                            !selectedSession 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'text-gray-700 hover:bg-blue-50'
                          }`}
                        >
                          <div className="font-medium">All Sessions</div>
                        </button>
                        {sessions.map(session => (
                          <button
                            key={session}
                            onClick={() => {
                              setSelectedSession(session);
                              setSessionDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 transition-colors ${
                              selectedSession === session 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            <div className="font-medium">{session}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Teaching Staff */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Teaching Staff</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {advisory?.lead_teacher_photo ? (
                    <img
                      src={advisory.lead_teacher_photo}
                      alt="Lead Teacher"
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  {/* Fallback icon that shows when photo fails to load */}
                  <div className={`w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-sm ${advisory?.lead_teacher_photo ? 'hidden' : 'flex'}`}>
                    <FaChalkboardTeacher />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lead Teacher</p>
                    <p className="text-sm text-gray-600">{leadTeacher || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {advisory?.assistant_teacher_photo ? (
                    <img
                      src={advisory.assistant_teacher_photo}
                      alt="Assistant Teacher"
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  {/* Fallback icon that shows when photo fails to load */}
                  <div className={`w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm ${advisory?.assistant_teacher_photo ? 'hidden' : 'flex'}`}>
                    <FaChalkboardTeacher />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assistant Teacher</p>
                    <p className="text-sm text-gray-600">{assistantTeacher || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Student List Header and List */}
          <div className="space-y-4">
            {/* Student List Header with Counts */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Student List</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full">
                  <FaMars className="text-blue-600 text-sm" />
                  <span className="text-sm font-medium text-blue-900">Male: {maleCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 rounded-full">
                  <FaVenus className="text-pink-600 text-sm" />
                  <span className="text-sm font-medium text-pink-900">Female: {femaleCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
                  <FaUsers className="text-green-600 text-sm" />
                  <span className="text-sm font-medium text-green-900">Total: {totalCount}</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search Students by Name..."
                className={`w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pl-10 ${studentSearch ? 'pr-10' : ''} caret-[#232c67]`}
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
            </div>

            {/* Student List */}
               <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                 {loading ? (
                   <div className="flex flex-col items-center justify-center h-full">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                     <p className="text-sm text-gray-500">Loading students...</p>
                   </div>
                 ) : students.length > 0 ? (
                <div className="space-y-2">
                     {(() => {
                       const filtered = filteredStudents;
                       
                       if (filtered.length === 0) {
                         return (
                           <div className="flex flex-col items-center justify-center h-full text-center">
                             <FaSearch className="text-4xl text-gray-300 mb-2" />
                             <p className="text-gray-500">
                               {studentSearch ? `No students found matching "${studentSearch}"` : "No students available"}
                             </p>
                           </div>
                         );
                       }
                       
                       // Remove duplicate students by student_id to prevent React key conflicts
                       const uniqueStudents = filtered.filter((student, index, self) => 
                         index === self.findIndex(s => s.student_id === student.student_id)
                       );
                       
                       // Sort alphabetically by last name, then first name
                       const sorted = [...uniqueStudents].sort((a, b) => {
                         const lastA = (a.stud_lastname || '').toLowerCase();
                         const lastB = (b.stud_lastname || '').toLowerCase();
                         if (lastA < lastB) return -1;
                         if (lastA > lastB) return 1;
                         const firstA = (a.stud_firstname || '').toLowerCase();
                         const firstB = (b.stud_firstname || '').toLowerCase();
                         return firstA.localeCompare(firstB);
                       });
                       
                       return sorted.map((student, index) => (
                         <div 
                           key={`${student.student_id}-${index}`} 
                           className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => setSelectedStudent(student)}
                         >
                           {(() => {
                             // Get real-time photo from UserContext, fallback to student.photo if not available
                             const realTimePhoto = getStudentPhoto(student.student_id) || student.photo;
                             
                             if (realTimePhoto) {
                               return (
                                 <>
                                   <img
                                     src={realTimePhoto}
                                     alt="Profile"
                                     className="w-10 h-10 rounded-full object-cover shadow-sm"
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       if (e.target.nextSibling) {
                                         e.target.nextSibling.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   {/* Fallback icon that shows when photo fails to load */}
                                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hidden">
                                     <FaUser className="text-blue-600 text-sm" />
                                   </div>
                                 </>
                               );
                             } else {
                               return (
                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                   <FaUser className="text-blue-600 text-sm" />
                                 </div>
                               );
                             }
                           })()}
                           <div className="flex-1">
                             <p className="text-sm font-medium text-gray-900">
                               {student.stud_lastname}, {student.stud_firstname} {student.stud_middlename || ''}
                             </p>
                             <p className="text-sm text-gray-500">
                               {student.stud_schedule_class || "No session"}
                             </p>
                           </div>
                           {student.stud_gender === "Male" ? (
                             <FaMars className="text-blue-600 text-sm" />
                           ) : (
                             <FaVenus className="text-pink-600 text-sm" />
                           )}
                         </div>
                       ));
                     })()}
                </div>
              ) : (
                   <div className="flex flex-col items-center justify-center h-full">
                     <FaUsers className="text-4xl text-gray-300 mb-4" />
                     <p className="text-gray-500 font-medium">
                       {selectedClass ? "No students found" : "Select a class to view students"}
                     </p>
                     <p className="text-sm text-gray-400 mt-1">
                       {selectedClass ? "No students are assigned to this class/session" : "Choose a class from the dropdown above"}
                     </p>
                </div>
              )}
          </div>
        </div>
      </div>

                                          {/* Selected Student Info - Only show on Assessment/Status tabs, not on Class Overview */}
           {selectedStudent && activeTab !== "Class Overview" && (
             <div className="bg-[#232c67] flex flex-row items-center w-full px-8 py-6 gap-10 rounded-lg">
               {/* Left side with avatar and name - 40% */}
               <div className="flex items-center gap-4 w-[40%]">
                 {(() => {
                   // Get real-time photo from UserContext, fallback to student.photo if not available
                   const realTimePhoto = getStudentPhoto(selectedStudent.student_id) || selectedStudent.photo;
                   
                   if (realTimePhoto) {
                     return (
                       <>
                         <img
                           src={realTimePhoto}
                           alt="Profile"
                           className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white"
                           onError={(e) => {
                             e.target.style.display = 'none';
                             if (e.target.nextSibling) {
                               e.target.nextSibling.style.display = 'flex';
                             }
                           }}
                         />
                         {/* Fallback icon that shows when photo fails to load */}
                         <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center hidden">
                           <FaUser className="text-white text-2xl" />
                         </div>
                       </>
                     );
                   } else {
                     return (
                       <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                         <FaUser className="text-white text-2xl" />
                       </div>
                     );
                   }
                 })()}
                 <span className="font-bold text-white text-3xl whitespace-nowrap">
                   {selectedStudent ? 
                     `${selectedStudent.stud_lastname}, ${selectedStudent.stud_firstname} ${selectedStudent.stud_middlename || ''}` : 
                     "Select a student to view progress"
                   }
                 </span>
               </div>
               
               {/* Right side with student details in two rows - 60% */}
               <div className="flex flex-col gap-4 w-[60%]">
                 {/* First row - Schedule, Gender, Handedness */}
                 <div className="flex items-center gap-8">
                   <span className="text-white text-lg font-bold">
                     <span className="text-white">Schedule:</span> <span className="font-normal ml-2">{selectedStudent.stud_schedule_class || "N/A"}</span>
                   </span>
                   <span className="text-white text-lg font-bold">
                     <span className="text-white">Gender:</span> <span className="font-normal ml-2">{selectedStudent.stud_gender || "N/A"}</span>
                   </span>
                   <span className="text-white text-lg font-bold">
                     <span className="text-white">Handedness:</span> <span className="font-normal ml-2">{selectedStudent.stud_handedness || "N/A"}</span>
                   </span>
                 </div>
                 
                 {/* Second row - Date of Birth and Parent */}
                 <div className="flex items-center gap-8">
                   <span className="text-white text-lg font-bold">
                     <span className="text-white">Date of Birth:</span> <span className="font-normal ml-2">{formatDateOfBirth(selectedStudent.stud_birthdate)}</span>
                   </span>
                   <span className="text-white text-lg font-bold">
                     <span className="text-white">Parent:</span> <span className="font-normal ml-2">
                       {selectedStudent.parent_lastname && selectedStudent.parent_firstname ? 
                         `${selectedStudent.parent_lastname}, ${selectedStudent.parent_firstname} ${selectedStudent.parent_middlename || ''}`.trim() : 
                         'Not assigned'
                       }
                     </span>
                   </span>
                 </div>
               </div>
             </div>
           )}
        </div>
      ) : (
        /* Assessment and Status Tabs - Show data without header */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     {/* Sticky Student Info Section for Assessment/Status tabs */}
           {selectedStudent && (
             <div className="bg-[#232c67] flex flex-row items-center w-full px-6 py-4 gap-6 sticky top-0 z-10">
               {/* Left side with avatar and name - 40% */}
               <div className="flex items-center gap-3 w-[40%]">
                 {(() => {
                   // Get real-time photo from UserContext, fallback to student.photo if not available
                   const realTimePhoto = getStudentPhoto(selectedStudent.student_id) || selectedStudent.photo;
                   
                   if (realTimePhoto) {
                     return (
                       <>
                         <img
                           src={realTimePhoto}
                           alt="Profile"
                           className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white"
                           onError={(e) => {
                             e.target.style.display = 'none';
                             if (e.target.nextSibling) {
                               e.target.nextSibling.style.display = 'flex';
                             }
                           }}
                         />
                         {/* Fallback icon that shows when photo fails to load */}
                         <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center hidden">
                           <FaUser className="text-white text-lg" />
                         </div>
                       </>
                     );
                   } else {
                     return (
                       <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                         <FaUser className="text-white text-lg" />
                       </div>
                     );
                   }
                 })()}
                 <span className="font-bold text-white text-xl whitespace-nowrap">
                   {selectedStudent ? 
                     `${selectedStudent.stud_lastname}, ${selectedStudent.stud_firstname} ${selectedStudent.stud_middlename || ''}` : 
                     "Select a student to view progress"
                   }
                 </span>
               </div>
               
               {/* Right side with student details in two rows - 60% */}
               <div className="flex flex-col gap-2 w-[60%]">
                 {/* First row - Schedule, Gender, Handedness */}
                 <div className="flex items-center gap-6">
                   <span className="text-white text-base font-bold">
                     <span className="text-white">Schedule:</span> <span className="font-normal ml-2">{selectedStudent.stud_schedule_class || "N/A"}</span>
                   </span>
                   <span className="text-white text-base font-bold">
                     <span className="text-white">Gender:</span> <span className="font-normal ml-2">{selectedStudent.stud_gender || "N/A"}</span>
                   </span>
                   <span className="text-white text-base font-bold">
                     <span className="text-white">Handedness:</span> <span className="font-normal ml-2">{selectedStudent.stud_handedness || "N/A"}</span>
                   </span>
                 </div>
                 
                 {/* Second row - Date of Birth and Parent */}
                 <div className="flex items-center gap-6">
                   <span className="text-white text-sm font-bold">
                     <span className="text-white">Date of Birth:</span> <span className="font-normal ml-2">{formatDateOfBirth(selectedStudent.stud_birthdate)}</span>
                   </span>
                   <span className="text-white text-sm font-bold">
                     <span className="text-white">Parent:</span> <span className="font-normal ml-2">
                       {selectedStudent.parent_lastname && selectedStudent.parent_firstname ? 
                         `${selectedStudent.parent_lastname}, ${selectedStudent.parent_middlename || ''} ${selectedStudent.parent_firstname}`.trim() : 
                         'Not assigned'
                       }
                     </span>
                   </span>
                 </div>
               </div>
             </div>
           )}

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {/* Main Content Grid */}
          <div className="grid grid-cols-5 gap-8 bg-white px-8 pt-8 pb-8">
            {activeTab === "Assessment" ? (
              assessmentLoading ? (
                <div className="col-span-5 flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-lg font-medium text-gray-700">Loading assessment data...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest information</p>
                </div>
              ) : (
                <>
                  {/* Left: Quarterly Assessment and Attendance (3 columns) */}
                  <div className="col-span-3 space-y-8">
                  {/* Quarterly Assessment Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 border border-blue-100">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaTable className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Quarterly Assessment</h3>
                        <p className="text-sm text-gray-600">Subject performance across quarters</p>
                      </div>
                    </div>
                    
                      {/* Assessment Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-1.5 bg-gray-50 text-left font-semibold text-gray-700">Subjects</th>
                              {quarters.map(q => (
                                <th key={q.id} className="border-b border-gray-200 px-4 py-1.5 bg-gray-50 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600">{q.name}</span>
                      </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.length > 0 ? (
                              [...subjects].sort((a, b) => a.localeCompare(b)).map((subject, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-gray-900">{subject}</td>
                                                          {quarters.map(q => {
                          if (q.id === 5) {
                            const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                            const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                            return (
                              <td key={q.id} className="px-4 py-3 text-center">
                                {vf ? (
                                  <span 
                                    style={{ color: shapeColorMap[vf.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}
                                    className="inline-block hover:scale-110 transition-transform"
                                  >
                                    {vf.visual_feedback_shape}
                                  </span>
                                ) : (
                                  <span></span>
                                )}
                              </td>
                            );
                          }
                          
                          // For quarters 1-4, only show shapes if quarter is finalized
                          const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                          if (card) {
                            // If quarter is finalized, show individual subject feedback
                            const fb = quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === q.id);
                            return (
                              <td key={q.id} className="px-4 py-3 text-center">
                                {fb ? (
                                  <span 
                                    style={{ color: shapeColorMap[fb.shape] || 'inherit', fontSize: '1.5em' }}
                                    className="inline-block hover:scale-110 transition-transform"
                                  >
                                    {fb.shape}
                                  </span>
                                ) : (
                                  <span></span>
                                )}
                              </td>
                            );
                          } else {
                            // If quarter is not finalized, show placeholder
                            return (
                              <td key={q.id} className="px-4 py-3 text-center">
                                <span></span>
                              </td>
                            );
                          }
                        })}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={quarters.length + 1} className="px-4 py-8 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <FaTable className="text-4xl text-gray-300" />
                                    <p className="text-gray-500 font-medium">No subjects found for this class</p>
                                    <p className="text-sm text-gray-400">Subject data will appear here</p>
                    </div>
                                </td>
                              </tr>
                            )}
                            
                            {/* Quarter Result Row */}
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                              <td className="px-4 py-3 font-semibold text-blue-900">Quarter Result</td>
                              {quarters.map(q => {
                                if (q.id === 5) {
                                  // For Final column, check if all quarters are finalized
                                  const allQuartersFinalized = [1, 2, 3, 4].every(quarterId => 
                                    progressCards.some(pc => Number(pc.quarter_id) === quarterId)
                                  );
                                  
                                  if (overallProgress && overallProgress.visual_shape && allQuartersFinalized) {
                                    let riskColor = '';
                                    if (overallProgress.risk_id == 1) riskColor = '#22c55e';
                                    else if (overallProgress.risk_id == 2) riskColor = '#fbbf24';
                                    else if (overallProgress.risk_id == 3) riskColor = '#ef4444';
                                    return (
                                      <td key={q.id} className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <span
                                            className="w-4 h-4 rounded-full shadow-sm"
                                            style={{ backgroundColor: riskColor || '#f1f5fd' }}
                                          ></span>
                                          <span 
                                            style={{ color: shapeColorMap[overallProgress.visual_shape] || '#222', fontSize: '1.5em', fontWeight: 'bold' }}
                                            className="inline-block hover:scale-110 transition-transform"
                                          >
                                            {overallProgress.visual_shape}
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return <td key={q.id} className="px-4 py-3 text-center"></td>;
                                  }
                                }
                                
                                // For quarters 1-4, only show if quarter is finalized
                                const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                                if (card) {
                                  const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                                  const shape = vf ? vf.visual_feedback_shape : '';
                                  let riskColor = '';
                                  if (card.risk_id == 1) riskColor = '#22c55e';
                                  else if (card.risk_id == 2) riskColor = '#fbbf24';
                                  else if (card.risk_id == 3) riskColor = '#ef4444';
                                  
                                  return (
                                    <td key={q.id} className="px-4 py-3 text-center">
                                      {shape ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <span
                                            className="w-4 h-4 rounded-full shadow-sm"
                                            style={{ backgroundColor: riskColor || '#f1f5fd' }}
                                          ></span>
                                          <span 
                                            style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 'bold' }}
                                            className="inline-block hover:scale-110 transition-transform"
                                          >
                                            {shape}
                                          </span>
                                        </div>
                                      ) : (
                                        <span></span>
                                      )}
                                    </td>
                                  );
                                                                  } else {
                                    // Quarter not finalized
                                    return <td key={q.id} className="px-4 py-3 text-center"></td>;
                                  }
                              })}
                            </tr>
                            

                          </tbody>
                        </table>
                      </div>
                  </div>

                  {/* Attendance Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaChartBar className="text-green-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Record of Attendance</h3>
                        <p className="text-sm text-gray-600">Monthly attendance tracking</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-green-50">
                              <th className="border-b border-gray-200 px-2 py-3 text-left font-semibold text-gray-700 w-[120px]">Category</th>
                              {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((month) => (
                                <th key={month} className="border-b border-gray-200 px-1 py-3 text-center font-semibold text-gray-700">{month}</th>
                              ))}
                              <th className="border-b border-gray-200 px-2 py-3 text-center font-semibold text-gray-700 bg-blue-50">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const att = getAttendanceSummary();
                              if (!att) return (
                                <tr>
                                  <td colSpan={11} className="px-4 py-8 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <FaChartBar className="text-4xl text-gray-300" />
                                      <p className="text-gray-500 font-medium">Loading attendance...</p>
                      </div>
                                  </td>
                                </tr>
                              );
                              return [
                                <tr key="schooldays" className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-3 font-medium text-gray-900">No. of School Days</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-gray-700">{m.total}</td>)}
                                  <td className="px-2 py-3 text-center font-bold text-blue-600 bg-blue-50">{att.totalSchoolDays}</td>
                                </tr>,
                                <tr key="present" className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-3 font-medium text-gray-900">No. of Days Present</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-green-600">{m.present}</td>)}
                                  <td className="px-2 py-3 text-center font-bold text-green-600 bg-blue-50">{att.totalPresent}</td>
                                </tr>,
                                <tr key="absent" className="hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-3 font-medium text-gray-900">No. of Days Absent</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-3 text-center text-red-600">{m.absent}</td>)}
                                  <td className="px-2 py-3 text-center font-bold text-red-600 bg-blue-50">{att.totalAbsent}</td>
                                </tr>
                              ];
                            })()}
                          </tbody>
                        </table>
                    </div>
                  </div>
                </div>

                {/* Right: Legend and Comments (2 columns) */}
                <div className="col-span-2 space-y-8">
                  {/* Legend Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FaTable className="text-purple-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assessment Legend</h3>
                        <p className="text-sm text-gray-600">Performance indicators and meanings</p>
                      </div>
                    </div>
                    
                    <div className="overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Shapes</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Descriptions</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visualFeedback.length > 0 ? (
                              visualFeedback.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <span 
                                      style={{ color: shapeColorMap[item.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}
                                      className="inline-block hover:scale-110 transition-transform"
                                    >
                                      {item.visual_feedback_shape}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">- {item.visual_feedback_description}</td>
                                  <td className="px-4 py-3 text-gray-700">- {item.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <FaTable className="text-4xl text-gray-300" />
                                    <p className="text-gray-500 font-medium">Loading legend data...</p>
                      </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                    </div>
                  </div>

                  {/* Risk Level Legend */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Risk Level</h3>
                        <p className="text-sm text-gray-600">Performance risk indicators</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="space-y-3">
                        {riskLevels.length > 0 ? (
                          riskLevels.map((risk, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span 
                                className="w-4 h-4 rounded-full border-2 shadow-sm"
                                style={{ 
                                  backgroundColor: getRiskLevelColor(risk.risk_id),
                                  borderColor: getRiskLevelColor(risk.risk_id)
                                }}
                              ></span>
                              <span className="text-sm font-medium text-gray-900">{risk.risk_name} Risk</span>
                        </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <FaExclamationTriangle className="text-2xl text-gray-300" />
                            <p className="text-gray-500 font-medium">Loading risk levels...</p>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaComments className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                        <p className="text-sm text-gray-600">Teacher feedback and observations</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      {comments.length > 0 ? (
                        <div className="space-y-4">
                          {comments.map((comment, idx) => (
                            <div key={comment.comment_id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="text-sm text-gray-800 mb-2 leading-relaxed">
                                {comment.comment}
                      </div>
                              
                              <div className="flex items-center justify-between text-xs text-blue-600 font-medium mb-2">
                                <span>{comment.commentor_name ? `— ${comment.commentor_name}` : ''}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {comment.quarter_name && (
                                  <span className="font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {comment.quarter_name}
                                  </span>
                                )}
                                {comment.created_at && (
                                  <span>
                                    {new Date(comment.created_at).toLocaleString("en-US", { 
                                      month: "short", 
                                      day: "numeric", 
                                      year: "numeric", 
                                      hour: "numeric", 
                                      minute: "2-digit", 
                                      hour12: true 
                                    })}
                                  </span>
                                )}
                                {comment.updated_at && comment.updated_at !== comment.created_at && (
                                  <span className="italic text-gray-400">
                                    (Edited {new Date(comment.updated_at).toLocaleString("en-US", { 
                                      month: "short", 
                                      day: "numeric", 
                                      year: "numeric", 
                                      hour: "numeric", 
                                      minute: "2-digit", 
                                      hour12: true 
                                    })})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <FaComments className="text-4xl text-gray-300" />
                          <p className="text-gray-500 font-medium">No comments available</p>
                          <p className="text-sm text-gray-400">Comments from teachers will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
              )
            ) : statusLoading ? (
              <div className="col-span-5 flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Loading status data...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest information</p>
              </div>
            ) : (
              <>
                {/* Left: Progress Circles (2 columns) */}
                <div className="col-span-2 space-y-8">
                  {/* Final Subject Averages Section - Only show when there's overall progress */}
                  {(() => {
                    const hasOverall = hasOverallProgress();
                            return hasOverall;
                  })() && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaChartLine className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Final Subject Averages</h3>
                        <p className="text-sm text-gray-600">Overall performance across all subjects</p>
                      </div>
                    </div>
                    
                    {finalSubjectProgress.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {[...finalSubjectProgress].sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || '')).map((row, idx) => {
                          const percent = Math.round(Number(row.finalsubj_avg_score));
                          const uniqueColors = [
                            { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }, // yellow
                            { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }, // red
                            { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }, // blue
                            { bg: '#e9d5ff', border: '#8b5cf6', text: '#5b21b6' }, // purple
                            { bg: '#d1fae5', border: '#10b981', text: '#065f46' }, // green
                            { bg: '#fce7f3', border: '#ec4899', text: '#be185d' }, // pink
                            { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8' }, // light blue
                            { bg: '#fed7aa', border: '#f97316', text: '#c2410c' }  // orange
                          ];
                          const color = uniqueColors[idx % uniqueColors.length];
                          return (
                            <div key={row.subject_id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className="relative w-16 h-16">
                                <svg className="absolute top-0 left-0 w-full h-full">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="#e5e7eb"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke={color.border}
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${(2 * Math.PI * 28 * percent) / 100} ${2 * Math.PI * 28}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 32 32)"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-900">{percent}%</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-semibold text-gray-900">{row.subject_name}</span>
                                <div className="mt-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300" 
                                      style={{ 
                                        width: `${percent}%`, 
                                        backgroundColor: color.border 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaChartLine className="text-gray-400 text-xl" />
                        </div>
                        <p className="text-gray-500 font-medium">No scores available</p>
                        <p className="text-sm text-gray-400 mt-1">Subject averages will appear here</p>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Risk Status Section - Only show when there's overall progress */}
                  {hasOverallProgress() && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-600 text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Final Risk Status</h3>
                        <p className="text-sm text-gray-600">Overall assessment of student progress</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      {hasOverallProgress() ? (
                        (() => {
                          const { text: riskText, color: riskColor, textColor: riskTextColor } = getRiskInfo(overallRisk.risk);
                          return (
                            <>
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${riskColor} shadow-sm`}></div>
                                <span className={`font-semibold ${riskTextColor}`}>
                                  {riskText === 'No Data'
                                    ? <span className="italic text-gray-400">{riskText}</span>
                                    : riskText
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                {riskText === 'Low' && 'Student is performing well and meeting expectations.'}
                                {riskText === 'Moderate' && 'Student may need additional support in some areas.'}
                                {riskText === 'High' && 'Student requires immediate attention and intervention.'}
                                {riskText === 'No Data' && 'Risk assessment data is not available.'}
                              </p>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-gray-400 shadow-sm"></div>
                            <span className="font-semibold text-gray-600">No Assessment Data</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Risk assessment requires quarterly assessment grades to be available.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  )}
                </div>
                
                {/* Right: Chart and Summary (3 columns) */}
                <div className="col-span-3 flex flex-col h-full space-y-6">
                  {/* Message for students without overall progress - Centered */}
                  {(() => {
                    const hasOverall = hasOverallProgress();
                            return !hasOverall;
                  })() && (
                    <div className="col-span-5 flex justify-center">
                      <div className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaChartLine className="text-yellow-600 text-xl" />
                          </div>
                          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                            {hasAnyProgress() ? 'Progress Assessment Pending' : 'No Assessment Data Available'}
                          </h3>
                                                  <p className="text-yellow-700 mb-4">
                          {hasAnyProgress() 
                            ? 'To view your Final Risk Status, Performance Summary, Quarterly Performance Trend Chart, and Final Subject Averages, you need to have overall progress data. Currently, you only have individual quarter assessments.'
                            : 'No quarterly assessments have been completed yet. Assessment data is required to generate progress analysis.'
                          }
                        </p>
                          <div className="bg-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
                                                      {hasAnyProgress() ? (
                            <>
                              <p><strong>Current Status:</strong> You have individual quarter assessments but no overall progress data.</p>
                              <p><strong>Next Step:</strong> Overall progress data needs to be generated to unlock all progress analysis sections.</p>
                              <p><strong>What You'll See:</strong> Final Risk Status, Performance Summary, Chart, and Subject Averages.</p>
                              <p><strong>Note:</strong> Sections are only displayed when there's actual overall progress data in the system.</p>
                            </>
                          ) : (
                            <>
                              <p><strong>Current Status:</strong> No quarterly assessments completed.</p>
                              <p><strong>Next Step:</strong> Complete Quarter 1 assessments to begin progress tracking.</p>
                            </>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Chart Section - Only show when there's overall progress */}
                  {hasOverallProgress() && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FaChartLine className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Quarterly Performance Trend</h3>
                          <p className="text-sm text-gray-600">Performance progression across quarters</p>
                        </div>
                      </div>
                      
                      {renderStatusChart()}
                    </div>
                  )}

                  {/* Summary Section - Only show when there's overall progress */}
                  {hasOverallProgress() && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaCheckCircle className="text-green-600 text-lg" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
                          <p className="text-sm text-gray-600">Detailed analysis and recommendations</p>
                        </div>
                      </div>
                    </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        {hasOverallProgress() ? (
                        milestoneSummary || milestoneOverallSummary ? (
                          <div className="space-y-4">
                            {milestoneSummary && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Summary</h4>
                                <p className="text-gray-800 leading-relaxed">{milestoneSummary}</p>
                              </div>
                            )}
                            {milestoneOverallSummary && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Overall Assessment</h4>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="font-semibold text-blue-900">{milestoneOverallSummary}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FaCheckCircle className="text-gray-400 text-xl" />
                            </div>
                            <p className="text-gray-500 font-medium">No summary available</p>
                            <p className="text-sm text-gray-400 mt-1">Performance summary will appear here</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-gray-400 text-xl" />
                          </div>
                          <p className="text-gray-500 font-medium">No Assessment Data</p>
                          <p className="text-sm text-gray-400 mt-1">Performance summary requires quarterly assessment grades to be available</p>
                        </div>
                      )}
                      
                      {milestoneRecordedAt && (milestoneSummary || milestoneOverallSummary) && hasOverallProgress() && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-right">
                            Last Updated: {new Date(milestoneRecordedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </ProtectedRoute>
  );
} 