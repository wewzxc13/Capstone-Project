"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaArrowLeft, FaUser, FaMale, FaFemale, FaUsers, FaChalkboardTeacher, FaMars, FaVenus, FaChartBar, FaTable, FaExclamationTriangle, FaComments, FaSave, FaEdit, FaTimes, FaCheckCircle, FaRegClock, FaPlusCircle, FaChartLine, FaSearch, FaChevronDown, FaLock, FaPrint } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import '../../../../lib/chart-config.js';
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../../Context/UserContext";
import jsPDF from 'jspdf';
import { API } from '@/config/api';

// Helper function to construct full photo URL from filename
// Now uses API.uploads.getUploadURL() for proper production URL resolution
function getPhotoUrl(filename) {
  if (!filename) {
    return null;
  }
  
  // If it's already a full URL (like a blob URL for preview), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('blob:')) {
    return filename;
  }
  
  // Use API.uploads.getUploadURL() to construct proper backend URL for production
  return API.uploads.getUploadURL(filename);
}

export default function StudentProgress({ formData: initialFormData }) {
  const [activeTab, setActiveTab] = useState("Class Overview");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const router = useRouter();
  const { getUserPhoto, getStudentPhoto, initializeAdvisoryPhotos } = useUser();
  
  // Refs for printable content
  const assessmentRef = useRef(null);
  const printRef = useRef(null);
  const [showPrintLayout, setShowPrintLayout] = useState(false);

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
  const [parentProfile, setParentProfile] = useState(null);
  const [studentLevelData, setStudentLevelData] = useState(null);

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
      setAssessmentLoading(false);
      return;
    }
    
    setAssessmentLoading(true);
    
    const fetchAssessmentData = async () => {
      try {
        const promises = [
          fetch(API.assessment.getVisualFeedback()),
          fetch(API.assessment.getRiskLevels()),
          fetch(API.assessment.getComments(selectedStudent.student_id)),
          fetch(API.advisory.getAttendance(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              advisory_id: selectedStudent.advisory_id,
              student_id: selectedStudent.student_id 
            })
          }),
          fetch(API.assessment.getSubjectsByAdvisory(selectedStudent.advisory_id)),
          fetch(API.assessment.getStudentQuarterFeedback(selectedStudent.student_id)),
          fetch(API.assessment.getStudentProgressCards(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.assessment.getQuarters()),
          fetch(API.assessment.getSubjectOverallProgress(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.assessment.getOverallProgress(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.user.getUserProfile(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: selectedStudent.parent_id }) }),
          fetch(API.user.getStudentDetails(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_id: selectedStudent.student_id }) })
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

        // Process parent profile for socio-demographic print
        if (data[10] && data[10].status === 'success') {
          setParentProfile(data[10].user || data[10].profile || data[10]);
        } else {
        }

        // Process student details for level information
        if (data[11] && data[11].status === 'success') {
          // Store level data in a separate state to avoid infinite loop
          if (data[11].student) {
            setStudentLevelData(data[11].student);
          }
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
    setParentProfile(null);
    setStudentLevelData(null);
    
    fetchAssessmentData();
  }, [selectedStudent]);

  // Fetch status data when student is selected
  useEffect(() => {
    if (!selectedStudent || !selectedStudent.student_id) return;
    
    // Check if we have the required advisory_id
    if (!selectedStudent.advisory_id) {
      setStatusLoading(false);
      return;
    }
    
    setStatusLoading(true);
    
    const fetchStatusData = async () => {
      try {
        const promises = [
          fetch(API.assessment.getSubjectOverallProgress(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.assessment.getOverallProgress(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.assessment.getVisualFeedback()),
          fetch(API.assessment.getStudentProgressCards(selectedStudent.student_id, selectedStudent.advisory_id)),
          fetch(API.assessment.getMilestoneInterpretation(selectedStudent.student_id))
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
      const response = await fetch(API.advisory.listClassLevels());
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
      const response = await fetch(API.advisory.getAvailableSessions());
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
      const response = await fetch(API.advisory.getAdvisoryDetails(), {
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
                const parentRes = await fetch(API.user.getUserDetails(), {
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

  const handleExportAssessment = async () => {
    try {
      // Show loading toast
      toast.info("Generating PDF...", { autoClose: 5000 });

      // Debug: Log the data being used for PDF generation
      console.log("PDF Generation Debug:", {
        selectedStudent: selectedStudent,
        advisory: advisory,
        parentProfile: parentProfile,
        leadTeacher: advisory?.lead_teacher_name,
        assistantTeacher: advisory?.assistant_teacher_name,
        fatherName: buildParentName(parentProfile, 'father'),
        motherName: buildParentName(parentProfile, 'mother'),
        fatherAge: getParentAge(parentProfile, 'father'),
        motherAge: getParentAge(parentProfile, 'mother'),
        fatherOccupation: getParentOccupation(parentProfile, 'father'),
        motherOccupation: getParentOccupation(parentProfile, 'mother')
      });

      // Create PDF directly using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      let currentY = 20;

      // Set UTF-8 encoding to support Unicode symbols
      pdf.setLanguage("en-US");
      pdf.setProperties({
        title: 'Student Progress Report',
        creator: 'Learners Ville',
        producer: 'jsPDF'
      });

      // Try to load Unicode font for symbols
      let canRenderSymbols = false;
      const ensureUnicodeFont = async () => {
        try {
          const res = await fetch('/fonts/DejaVuSans.ttf');
          if (!res.ok) return;
          const blob = await res.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          const base64 = String(dataUrl).split(',')[1];
          pdf.addFileToVFS('DejaVuSans.ttf', base64);
          pdf.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
          pdf.setFont('DejaVuSans', 'normal');
          canRenderSymbols = true;
        } catch (e) {
          canRenderSymbols = false;
        }
      };
      await ensureUnicodeFont();

      // Helper function to convert shapes to Unicode symbols
      const toUnicodeShape = (raw) => {
        const s = (raw ?? '').toString().trim();
        if (!s) return '';
        if (['♥','❤','❤️','★','⭐','◆','🔷','▲','⬤','●','■','⬢'].includes(s)) {
          if (s === '●') return '⬤';
          if (s === '❤️' || s === '♥') return '❤';
          if (s === '⭐') return '★';
          if (s === '🔷') return '◆';
          return s;
        }
        const map = {
          '&': '❤', '%Ï': '❤', '%Ã\u0017' : '❤', '%C1%8F': '❤',
          '&e': '★', '&E': '★',
          '%Æ': '◆', '%Ã†': '◆', '%Â†': '◆', '&c': '◆',
          '%²': '▲', '%2': '▲', '%?': '▲', '%C2%B2': '▲', '&t': '▲',
          '%I': '⬤', '%1': '⬤', '%l': '⬤', '+$': '⬤', '+S': '⬤', '+s': '⬤', '+5': '⬤', '&o': '⬤',
          '%25': '■', '%5B%5D': '■', '[]': '■', '%': '■',
          '+^': '⬢', '+"': '⬢'
        };
        if (map[s]) return map[s];
        if (s.includes('%')) return '■';
        if (s.includes('+')) return '⬢';
        return s;
      };

      // PDF color map for symbols
      const pdfShapeColorMap = {
        '❤️': [244, 67, 54], '❤': [244, 67, 54], '♥': [244, 67, 54],
        '■': [0, 188, 212], '⭐': [255, 152, 0], '★': [255, 152, 0],
        '⬢': [205, 220, 57], '🔷': [33, 150, 243], '◆': [33, 150, 243],
        '▲': [76, 175, 80], '🟡': [255, 235, 59], '●': [255, 235, 59], '⬤': [255, 235, 59],
      };

      // Helper function to render symbols
      const renderSymbol = (symbol, x, y, fontSize = 12) => {
        if (!symbol) return;
        const finalSymbol = toUnicodeShape(symbol);
        const rgb = pdfShapeColorMap[finalSymbol] || [0, 0, 0];
        
        if (canRenderSymbols && finalSymbol !== '❤' && finalSymbol !== '⬢' && finalSymbol !== '⬤') {
          pdf.setFont('DejaVuSans', 'normal');
          pdf.setFontSize(fontSize);
          pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
          pdf.text(finalSymbol, x, y, { align: 'center' });
        return;
      }

        // Vector fallbacks
        const size = fontSize * 0.8;
        const r = size / 3.2;
        const cx = x;
        const cy = y - size / 4.5;
        pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
        pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        pdf.setLineWidth(0.6);
        switch (finalSymbol) {
          case '⬤':
            pdf.circle(cx, cy, r * 1.25, 'F');
            break;
          case '▲': {
            const h = r * 2.1;
            pdf.triangle(cx, cy - h / 1.3, cx - r * 1.2, cy + h / 2.2, cx + r * 1.2, cy + h / 2.2, 'F');
            break;
          }
          case '❤': {
            const cyh = cy - r * 0.05;
            const lobeRadius = r * 0.75;
            const lobeOffsetX = r * 0.55;
            const lobeOffsetY = r * 0.25;
            pdf.circle(cx - lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
            pdf.circle(cx + lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
            const baseY = cyh + r * 0.2;
            const baseHalfWidth = lobeRadius * 1.2;
            const pointDepth = r * 1.2;
            pdf.triangle(cx - baseHalfWidth, baseY, cx + baseHalfWidth, baseY, cx, cyh + pointDepth, 'F');
            break;
          }
          case '◆': {
            const w = r * 1.6;
            const h = r * 1.6;
            pdf.triangle(cx, cy - h, cx - w, cy, cx + w, cy, 'F');
            pdf.triangle(cx, cy + h, cx - w, cy, cx + w, cy, 'F');
            break;
          }
          case '★': {
            try {
              const points = 5;
              const outer = r * 1.4;
              const inner = outer * 0.5;
              const coords = [];
              for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points;
                const radius = i % 2 === 0 ? outer : inner;
                coords.push([cx + radius * Math.cos(angle - Math.PI / 2), cy + radius * Math.sin(angle - Math.PI / 2)]);
              }
              
              pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
              pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
              pdf.setLineWidth(0.3);
              
              // Draw star by connecting points with lines
              for (let i = 1; i < coords.length; i++) {
                pdf.line(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
              }
              // Close the star
              pdf.line(coords[coords.length - 1][0], coords[coords.length - 1][1], coords[0][0], coords[0][1]);
              
              // Simple fill approach - draw triangles from center to each point
              for (let i = 0; i < coords.length - 1; i++) {
                pdf.triangle(cx, cy, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1], 'F');
              }
              pdf.triangle(cx, cy, coords[coords.length - 1][0], coords[coords.length - 1][1], coords[0][0], coords[0][1], 'F');
            } catch (error) {
              // Fallback to simple circle if star rendering fails
              pdf.circle(cx, cy, r * 0.8, 'F');
            }
            break;
          }
          case '■': {
            // Reduce square size to visually match other shapes
            const w = r * 1.3; // side = 2.6r (smaller than previous 3.2r)
            pdf.rect(cx - w, cy - w, w * 2, w * 2, 'F');
            break;
          }
          case '⬢': {
            try {
              // Increase hexagon size slightly to match other shapes
              const scale = 1.35;
              const radius = r * scale;
              const points = 6;
              const coords = [];
              for (let i = 0; i < points; i++) {
                const angle = (i * 2 * Math.PI) / points;
                coords.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
              }
              
              pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
              pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
              pdf.setLineWidth(0.3);
              
              // Draw hexagon by connecting points with lines
              for (let i = 1; i < coords.length; i++) {
                pdf.line(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
              }
              // Close the hexagon
              pdf.line(coords[coords.length - 1][0], coords[coords.length - 1][1], coords[0][0], coords[0][1]);
              
              // Fill by drawing triangles from center to each edge
              for (let i = 0; i < coords.length - 1; i++) {
                pdf.triangle(cx, cy, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1], 'F');
              }
              pdf.triangle(cx, cy, coords[coords.length - 1][0], coords[coords.length - 1][1], coords[0][0], coords[0][1], 'F');
            } catch (error) {
              // Fallback to simple circle if hexagon rendering fails
              pdf.circle(cx, cy, r * 0.8, 'F');
            }
            break;
          }
          default:
            pdf.circle(cx, cy, r * 0.8, 'F');
            break;
        }
      };

      // Helper functions for layout
      const addNewPage = (bgColor) => {
        pdf.addPage();
        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = 20;
      };

      const startWhiteBox = (boxHeight = 60) => {
        const footerTopY = pageHeight - 30;
        if ((currentY - 5) + boxHeight > footerTopY) {
          addNewPage('#eef5ff');
        }
        const boxStartY = currentY - 5;
        const boxEndY = boxStartY + boxHeight;
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'S');
        
        return { boxStartY, boxEndY };
      };

      const endWhiteBox = (boxEndY) => {
        currentY = boxEndY + 8;
      };

      // Add header with logo
      const addHeader = async (title) => {
        if (currentY > 250) addNewPage('#eef5ff');
        
        const logoX = 20;
        const logoY = currentY + 15;
        const logoSize = 30;
        const logoRadius = 15;
        
        try {
          const logoResponse = await fetch('/assets/image/villelogo.png');
          if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(logoBlob);
            });
            
            pdf.setFillColor(255, 255, 255);
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F');
            pdf.setDrawColor(200, 200, 200);
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S');
            
            pdf.addImage(logoDataUrl, 'PNG', logoX + 2, logoY - logoRadius + 2, logoSize - 4, logoSize - 4);
          }
        } catch (error) {
          pdf.setFillColor(255, 255, 255);
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F');
          pdf.setDrawColor(200, 200, 200);
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S');
        }
        
        pdf.setTextColor(35, 44, 103);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LEARNERS\' VILLE', pageWidth / 2, logoY + 2, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines', pageWidth / 2, logoY + 10, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`SY ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth - 20, logoY + 2, { align: 'right' });
        
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.5);
        pdf.line(10, logoY + 20, pageWidth - 10, logoY + 20);
        
        currentY = logoY + 30;
      };

      // Helper functions for layout
      const addText = (text, x, y, maxWidth = pageWidth - 40) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 5);
      };

      // Set first page background color
      pdf.setFillColor(238, 245, 255); // Light blue
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Page 1: School & Learner Info
      await addHeader('Learner\'s Information');
      
      // Learner's Information Card
      const learnerBox = startWhiteBox(80);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Learner\'s Information', 15, learnerBox.boxStartY + 15);
      
      // Student details
      const studentName = selectedStudent ? 
        `${selectedStudent.stud_lastname || ''}, ${selectedStudent.stud_firstname || ''} ${selectedStudent.stud_middlename || ''}`.trim() : 
        '____________________________';
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Left Column
      const leftX = 15;
      const rightX = 100;
      const startY = learnerBox.boxStartY + 30;
      const lineHeight = 10;
      
      // Name (Left Column)
      pdf.setTextColor(100, 100, 100);
      pdf.text('Name:', leftX, startY);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(studentName, leftX + 15, startY);
      
      // Level (Left Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Level:', leftX, startY + lineHeight);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      const levelDisplay = studentLevelData?.level_name || studentLevelData?.levelName || studentLevelData?.level?.level_name || selectedStudent?.level_name || selectedStudent?.levelName || selectedStudent?.level?.level_name || selectedStudent?.stud_level || (studentLevelData?.levelId ? (classes.find(c => c.level_id == studentLevelData.levelId)?.level_name || `Level ${studentLevelData.levelId}`) : '');
      pdf.text(levelDisplay || '________________________', leftX + 15, startY + lineHeight);
      
      // Lead Teacher (Left Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Lead Teacher:', leftX, startY + (lineHeight * 2));
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(advisory?.lead_teacher_name ? formatName(advisory.lead_teacher_name) : '________________________', leftX + 30, startY + (lineHeight * 2));
      
      // Right Column
      // Sex (Right Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sex:', rightX, startY);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedStudent?.stud_gender || '________________________', rightX + 10, startY);
      
      // Date of Birth (Right Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Date of Birth:', rightX, startY + lineHeight);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      const birthDate = formatDateOfBirth(selectedStudent?.stud_birthdate);
      pdf.text(birthDate, rightX + 28, startY + lineHeight);
      
      // Assistant Teacher (Right Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Assistant Teacher:', rightX, startY + (lineHeight * 2));
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(advisory?.assistant_teacher_name ? formatName(advisory.assistant_teacher_name) : '________________________', rightX + 40, startY + (lineHeight * 2));
      
      endWhiteBox(learnerBox.boxEndY);

      // Sociodemographic Profile Card
      const socioBox = startWhiteBox(100);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sociodemographic Profile', 15, socioBox.boxStartY + 15);
      
      // Handedness
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Handedness:', 15, socioBox.boxStartY + 30);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedStudent?.stud_handedness || '________________________', 43, socioBox.boxStartY + 30);
      
      // Parent Details - Two Column Layout
      const parentStartY = socioBox.boxStartY + 45;
      const parentLeftX = 15;
      const parentRightX = 100;
      const parentLineHeight = 8;
      
      // Father's Details (Left Column)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Father\'s Details', parentLeftX, parentStartY);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Name:', parentLeftX, parentStartY + 15);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(buildParentName(parentProfile, 'father') || '________________________', parentLeftX + 15, parentStartY + 15);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Age:', parentLeftX, parentStartY + 25);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getParentAge(parentProfile, 'father') || '________________________', parentLeftX + 15, parentStartY + 25);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Occupation:', parentLeftX, parentStartY + 35);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getParentOccupation(parentProfile, 'father') || '________________________', parentLeftX + 27, parentStartY + 35);
      
      // Mother's Details (Right Column)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mother\'s Details', parentRightX, parentStartY);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Name:', parentRightX, parentStartY + 15);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(buildParentName(parentProfile, 'mother') || '________________________', parentRightX + 15, parentStartY + 15);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Age:', parentRightX, parentStartY + 25);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getParentAge(parentProfile, 'mother') || '________________________', parentRightX + 13, parentStartY + 25);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Occupation:', parentRightX, parentStartY + 35);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getParentOccupation(parentProfile, 'mother') || '________________________', parentRightX + 27, parentStartY + 35);
      
      endWhiteBox(socioBox.boxEndY);

      // Page 2: Record of Attendance
      addNewPage('#eaf7f1'); // Light green
      currentY = 20;
      
      const attendanceBox = startWhiteBox(120);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Record of Attendance', 15, attendanceBox.boxStartY + 15);
      
      // Create attendance table with actual data
      const attendanceSummary = getAttendanceSummary();
      let attendanceData;
      
      if (attendanceSummary && attendanceSummary.summary && Array.isArray(attendanceSummary.summary)) {
        const summary = attendanceSummary.summary;
        attendanceData = [
          ['Category', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Total'],
          ['No. of\nSchool Days', ...summary.map(m => m.total.toString()), attendanceSummary.totalSchoolDays.toString()],
          ['No. of Days\nPresent', ...summary.map(m => m.present.toString()), attendanceSummary.totalPresent.toString()],
          ['No. of Days\nAbsent', ...summary.map(m => m.absent.toString()), attendanceSummary.totalAbsent.toString()]
        ];
      } else {
        attendanceData = [
          ['Category', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Total'],
          ['No. of\nSchool Days', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
          ['No. of Days\nPresent', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
          ['No. of Days\nAbsent', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        ];
      }
      
      // Draw table with custom column widths
      const tableStartY = attendanceBox.boxStartY + 30;
      const tableWidth = pageWidth - 30;
      const categoryWidth = tableWidth * 0.30;
      const monthWidth = tableWidth * 0.07;
      const rowHeight = 14;
      
      // Header row
      pdf.setFillColor(235, 246, 249); 
      pdf.rect(15, tableStartY, tableWidth, rowHeight, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      // Calculate column positions
      const colPositions = [15];
      colPositions.push(colPositions[0] + categoryWidth);
      for (let i = 1; i <= 10; i++) {
        colPositions.push(colPositions[i] + monthWidth);
      }
      
      attendanceData[0].forEach((header, colIndex) => {
        const x = colPositions[colIndex];
        const width = colIndex === 0 ? categoryWidth : monthWidth;
        pdf.text(header, x + (width / 2), tableStartY + 6, { align: 'center' });
      });
      
      // Data rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      for (let rowIndex = 1; rowIndex < attendanceData.length; rowIndex++) {
        const y = tableStartY + (rowIndex * rowHeight);
        attendanceData[rowIndex].forEach((cell, colIndex) => {
          const x = colPositions[colIndex];
          const width = colIndex === 0 ? categoryWidth : monthWidth;
          
          if (colIndex === 0) {
            const lines = cell.split('\n');
            lines.forEach((line, lineIndex) => {
              pdf.text(line, x + 2, y + 6 + (lineIndex * 4));
            });
          } else {
            pdf.text(cell, x + (width / 2), y + 6, { align: 'center' });
          }
        });
      }
      
      // Draw grid lines
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      
      for (let row = 0; row <= attendanceData.length; row++) {
        const y = tableStartY + (row * rowHeight);
        pdf.line(15, y, 15 + tableWidth, y);
      }
      
      for (let col = 0; col <= attendanceData[0].length; col++) {
        const x = colPositions[col];
        pdf.line(x, tableStartY, x, tableStartY + (attendanceData.length * rowHeight));
      }
      
      endWhiteBox(attendanceBox.boxEndY);

      // Parent/Guardian Signatures section
      const signatureBox = startWhiteBox(120);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Parent/Guardian Signatures', 15, signatureBox.boxStartY + 15);
      
      // Quarters with proper layout
      const quarterNames = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
      const availableHeight = signatureBox.boxEndY - (signatureBox.boxStartY + 40);
      const quarterSpacing = availableHeight / 4;
      
      quarterNames.forEach((quarter, index) => {
        const startY = signatureBox.boxStartY + 35 + (index * quarterSpacing);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(quarter, 15, startY);
        
        const quarterWidth = pdf.getTextWidth(quarter);
        const underlineStartX = 15 + quarterWidth + 5;
        const underlineEndX = underlineStartX + 100;
        
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(underlineStartX, startY + 2, underlineEndX, startY + 2);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('(Parent/Guardian Signature)', underlineEndX + 5, startY + 2);
        
        const commentY = startY + 10;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Teacher Comment:', 15, commentY);
        
        const quarterComment = getQuarterCommentText(index + 1);
        if (quarterComment && quarterComment.length > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(quarterComment, 60, commentY);
        } else {
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.5);
          pdf.line(60, commentY + 2, 120, commentY + 2);
        }
      });
      
      endWhiteBox(signatureBox.boxEndY);

      // Page 3: Quarterly Assessment
      addNewPage('#fff7e6'); // Light yellow
      currentY = 20;
      
      const assessmentBox = startWhiteBox(140);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quarterly Assessment', 15, assessmentBox.boxStartY + 15);
      
      const pdfSubjects = Array.isArray(subjects) ? [...subjects].sort((a,b) => {
        const nameA = typeof a === 'string' ? a : (a?.subject_name || '');
        const nameB = typeof b === 'string' ? b : (b?.subject_name || '');
        return nameA.localeCompare(nameB);
      }) : [];
      const assessmentQuarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Final'];
      
      if (pdfSubjects.length === 0) {
        toast.error('Assessment data not available. Please try again later.');
        return;
      }

      const assessmentTableStartY = assessmentBox.boxStartY + 30;
      const tableMarginX = 15; // Consistent left margin (same gap on both sides)
      const assessmentTableWidth = pageWidth - (tableMarginX * 2); // Full width: 210mm - 30mm margins = 180mm
      // Optimize column widths to better utilize the available space
      const subjectsColWidth = assessmentTableWidth * 0.40; // Wider for subject names
      const quarterColWidth = assessmentTableWidth * 0.12; // Quarter columns
      
      // Debug logging for table layout
      console.log('PDF Table Layout Debug:', {
        pageWidth,
        tableMarginX,
        assessmentTableWidth,
        subjectsColWidth,
        quarterColWidth,
        totalTableWidth: subjectsColWidth + (5 * quarterColWidth),
        leftMargin: tableMarginX,
        rightMargin: pageWidth - (tableMarginX + subjectsColWidth + (5 * quarterColWidth))
      });
      const assessmentRowHeight = 12;
      
      // Headers
      const headers = ['Subjects', ...assessmentQuarters];
      headers.forEach((header, colIndex) => {
        let x, colWidth;
        if (colIndex === 0) {
          x = tableMarginX;
          colWidth = subjectsColWidth;
        } else {
          x = tableMarginX + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
          colWidth = quarterColWidth;
        }
        
        pdf.setFillColor(235, 246, 249);
        pdf.rect(x, assessmentTableStartY, colWidth, assessmentRowHeight, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(x, assessmentTableStartY, colWidth, assessmentRowHeight, 'S');
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(header, x + (colWidth / 2), assessmentTableStartY + 8, { align: 'center' });
      });
      
      // Subject rows
      pdf.setFont('helvetica', 'normal');
      pdfSubjects.forEach((subject, rowIndex) => {
        const y = assessmentTableStartY + ((rowIndex + 1) * assessmentRowHeight);
        
        // Draw grid lines for each row
        headers.forEach((header, colIndex) => {
          let x, colWidth;
          if (colIndex === 0) {
            x = tableMarginX;
            colWidth = subjectsColWidth;
          } else {
            x = tableMarginX + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
            colWidth = quarterColWidth;
          }
          
          pdf.setFillColor(255, 255, 255);
          pdf.rect(x, y, colWidth, assessmentRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, colWidth, assessmentRowHeight, 'S');
        });
        
        // Subject name
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const subjectName = typeof subject === 'string' ? subject : (subject?.subject_name || 'Unknown Subject');
        pdf.text(subjectName, tableMarginX + 2, y + 8);
        
        // Assessment symbols for each quarter
        assessmentQuarters.forEach((quarter, colIndex) => {
          const quarterId = colIndex + 1;
          const x = tableMarginX + subjectsColWidth + (colIndex * quarterColWidth);
          let shape = '';
          let riskId = null;
          
          if (quarterId === 5) {
            // Final column - per subject: use finalSubjectProgress mapping
            const subjProgress = Array.isArray(finalSubjectProgress)
              ? finalSubjectProgress.find(row => (row.subject_name || row.subject) === subjectName)
              : null;
            if (subjProgress && subjProgress.finalsubj_visual_feedback_id) {
              const vf = Array.isArray(visualFeedback)
                ? visualFeedback.find(v => v.visual_feedback_id == subjProgress.finalsubj_visual_feedback_id)
                : null;
              shape = vf?.visual_feedback_shape || '';
            }
            // Fallback: use Q4 subject feedback when final not available
            if (!shape) {
              const fbQ4 = Array.isArray(quarterFeedback)
                ? quarterFeedback.find(f => f.subject_name === subjectName && Number(f.quarter_id) === 4)
                : null;
              shape = fbQ4?.shape || '';
            }
          } else {
            // Quarter columns (1-4): only show when the quarter is finalized (has a progress card)
            const card = progressCards.find(pc => Number(pc.quarter_id) === quarterId);
            if (card) {
              // Quarter is finalized; use subject-level feedback shape for that quarter
              const fb = quarterFeedback.find(f => f.subject_name === subjectName && Number(f.quarter_id) === quarterId);
              if (fb) {
                shape = fb.shape || '';
              }
            }
          }
          
          if (shape && typeof shape === 'string') {
            // normalize DB variants to renderable Unicode
            const normalized = shape === '🔷' ? '◆' : (shape === '●' ? '⬤' : (shape === '❤️' ? '❤' : (shape === '⭐' ? '★' : shape)));
            renderSymbol(normalized, x + (quarterColWidth / 2), y + 8, 12);
          }
        });
      });
      
      // Add Quarter Result row
      const quarterResultY = assessmentTableStartY + ((pdfSubjects.length + 1) * assessmentRowHeight);
      
      // Draw grid lines for Quarter Result row
      headers.forEach((header, colIndex) => {
        let x, colWidth;
        if (colIndex === 0) {
          x = tableMarginX;
          colWidth = subjectsColWidth;
        } else {
          x = tableMarginX + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
          colWidth = quarterColWidth;
        }
        
        pdf.setFillColor(255, 255, 255); // White background
        pdf.rect(x, quarterResultY, colWidth, assessmentRowHeight, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(x, quarterResultY, colWidth, assessmentRowHeight, 'S');
      });
      
      // Quarter Result label
      pdf.setTextColor(0, 0, 0); // Dark text to match ReportCard text-blue-900
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quarter Result', tableMarginX + 2, quarterResultY + 8);
      pdf.setTextColor(0, 0, 0); // Reset to black for other text
      
      // Quarter Result symbols for each quarter
      assessmentQuarters.forEach((quarter, colIndex) => {
        const quarterId = colIndex + 1;
        const x = tableMarginX + subjectsColWidth + (colIndex * quarterColWidth);
        let shape = '';
        let riskId = null;
        
        if (quarterId === 5) {
          // Final column - use overallProgress when all quarters finalized
          const allQuartersFinalized = [1,2,3,4].every(qId => progressCards.some(pc => Number(pc.quarter_id) === qId));
          if (overallProgress && overallProgress.visual_shape && allQuartersFinalized) {
            shape = overallProgress.visual_shape;
            riskId = overallProgress.risk_id ?? null;
          }
        } else {
          // Quarter columns - derive shape from visual_feedback_id and risk from card.risk_id
          const card = progressCards.find(pc => Number(pc.quarter_id) === quarterId);
          if (card) {
            const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
            shape = vf?.visual_feedback_shape || '';
            riskId = card.risk_id ?? null;
          }
        }
        
        // Draw risk color dot if available
        if (riskId === 1 || riskId === '1') {
          pdf.setFillColor(34, 197, 94); // green
          pdf.circle(x + (quarterColWidth / 2) - 6, quarterResultY + 8, 1.8, 'F');
        } else if (riskId === 2 || riskId === '2') {
          pdf.setFillColor(251, 191, 36); // yellow
          pdf.circle(x + (quarterColWidth / 2) - 6, quarterResultY + 8, 1.8, 'F');
        } else if (riskId === 3 || riskId === '3') {
          pdf.setFillColor(239, 68, 68); // red
          pdf.circle(x + (quarterColWidth / 2) - 6, quarterResultY + 8, 1.8, 'F');
        }
        
        if (shape && typeof shape === 'string') {
          // normalize DB variants to renderable Unicode
          const normalized = shape === '🔷' ? '◆' : (shape === '●' ? '⬤' : (shape === '❤️' ? '❤' : (shape === '⭐' ? '★' : shape)));
          renderSymbol(normalized, x + (quarterColWidth / 2) + 3, quarterResultY + 8, 12);
        }
      });
      
      endWhiteBox(assessmentBox.boxEndY);

      // Assessment Legend and Risk Levels - Mirror ReportCard layout: grid grid-cols-2 gap-6
      const legendStartY = currentY;
      const marginX = tableMarginX; // Same 15mm margin as quarterly assessment table
      const tableTotalWidth = pageWidth - 30; // Same calculation as quarterly assessment: (210 - 30) = 180mm
      const gapBetweenBoxes = 6; // Match ReportCard gap-6 (24px = 6mm approximately)
      const boxWidth = (tableTotalWidth - gapBetweenBoxes) / 2; // Each box width: (180-6)/2 = 87mm
      const boxHeight = 100;
      
      // Layout: 15mm margin | 87mm legend | 6mm gap | 87mm risk | 15mm margin = 210mm total
      // This mirrors the ReportCard: grid-cols-2 with equal 50% width boxes minus gap
      
      // Debug logging
      console.log('PDF Legend Layout Debug:', {
        pageWidth,
        marginX,
        tableTotalWidth,
        gapBetweenBoxes,
        boxWidth,
        leftBoxStart: marginX,
        leftBoxEnd: marginX + boxWidth,
        rightBoxStart: marginX + boxWidth + gapBetweenBoxes,
        rightBoxEnd: marginX + boxWidth + gapBetweenBoxes + boxWidth,
        rightMargin: pageWidth - (marginX + boxWidth + gapBetweenBoxes + boxWidth)
      });
      
      // Assessment Legend Box - Left side
      const legendBoxStartY = legendStartY - 5;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(marginX, legendBoxStartY, boxWidth, boxHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(marginX, legendBoxStartY, boxWidth, boxHeight, 'S');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Assessment Legend', marginX + 5, legendBoxStartY + 15);
      
      // Legend table structure
      const legendTableStartY = legendBoxStartY + 25;
      const legendRowHeight = 12;
      const legendHeaderHeight = 10;
      
      // Draw Assessment Legend table headers
      const availableWidth = boxWidth - 10; // Subtract 5mm margin on each side
      const colWidths = [availableWidth * 0.20, availableWidth * 0.60, availableWidth * 0.20];
      let x = marginX + 5;
      
      // Header row
      const headerY = legendTableStartY;
      colWidths.forEach((width, colIndex) => {
        pdf.setFillColor(235, 246, 249); // Same light blue background as quarterly assessment table header
        pdf.rect(x, headerY, width, legendHeaderHeight, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(x, headerY, width, legendHeaderHeight, 'S');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        const headerText = ['Shapes', 'Descriptions', 'Remarks'][colIndex];
        pdf.text(headerText, x + (width / 2), headerY + 6, { align: 'center' });
        
        x += width;
      });
      
      // Legend data
      const legendData = (Array.isArray(visualFeedback) && visualFeedback.length > 0)
        ? visualFeedback
            .sort((a,b) => Number(a.visual_feedback_id) - Number(b.visual_feedback_id))
            .map((vf) => [
              // use actual shape from DB, but normalize blue diamond
              (vf.visual_feedback_shape === '🔷' ? '◆' : vf.visual_feedback_shape) || '',
              vf.visual_feedback_description || '',
              (vf.visual_feedback_description === 'Not Met') ? 'Failed' : 'Passed'
            ])
        : [
            ['❤', 'Excellent', 'Passed'],
            ['★', 'Very Good', 'Passed'],
            ['◆', 'Good', 'Passed'],
            ['▲', 'Need Help', 'Passed'],
            ['⬤', 'Not Met', 'Failed']
          ];
      
      legendData.forEach((row, index) => {
        const y = legendTableStartY + legendHeaderHeight + (index * legendRowHeight);
        
        // Draw grid lines - adjusted for compressed box with 5mm margins on both sides
        const availableWidth = boxWidth - 10; // Subtract 5mm margin on each side
        const colWidths = [availableWidth * 0.20, availableWidth * 0.60, availableWidth * 0.20];
        let x = marginX + 5;
        
        colWidths.forEach((width, colIndex) => {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(x, y, width, legendRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, width, legendRowHeight, 'S');
          
          if (colIndex === 0) {
            if (row[0] && typeof row[0] === 'string') {
              renderSymbol(row[0], x + (width / 2), y + 8, 10);
            }
          } else {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const text = row[colIndex] || '';
            if (typeof text === 'string') {
              pdf.text(text, x + (width / 2), y + 8, { align: 'center' });
            }
          }
          
          x += width;
        });
      });
      
      // Risk Levels Box - Right side
      const riskBoxStartY = legendStartY - 5;
      const riskBoxX = marginX + boxWidth + gapBetweenBoxes;
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(riskBoxX, riskBoxStartY, boxWidth, boxHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(riskBoxX, riskBoxStartY, boxWidth, boxHeight, 'S');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Levels', riskBoxX + 5, riskBoxStartY + 15);
      
      // Risk levels table
      const riskTableStartY = riskBoxStartY + 25;
      const riskRowHeight = 15;
      const riskHeaderHeight = 10;
      
      // Draw Risk Levels table headers
      const riskAvailableWidth = boxWidth - 10; // Subtract 5mm margin on each side
      const riskColWidths = [riskAvailableWidth * 0.40, riskAvailableWidth * 0.60]; // Increased level column width
      let riskX = riskBoxX + 5;
      
      // Header row
      const riskHeaderY = riskTableStartY;
      riskColWidths.forEach((width, colIndex) => {
        pdf.setFillColor(235, 246, 249); // Same light blue background as quarterly assessment table header
        pdf.rect(riskX, riskHeaderY, width, riskHeaderHeight, 'F');
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(riskX, riskHeaderY, width, riskHeaderHeight, 'S');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        const headerText = ['Level', 'Meaning'][colIndex];
        pdf.text(headerText, riskX + (width / 2), riskHeaderY + 6, { align: 'center' });
        
        riskX += width;
      });
      
      const riskData = [
        { color: [34, 197, 94], label: 'Low', description: 'Meeting Expectations' },
        { color: [251, 191, 36], label: 'Moderate', description: 'Needs Some Support' },
        { color: [239, 68, 68], label: 'High', description: 'Needs Close Attention' }
      ];
      
      riskData.forEach((risk, index) => {
        const y = riskTableStartY + riskHeaderHeight + (index * riskRowHeight);
        
        // Draw grid lines - adjusted for compressed box with 5mm margins on both sides
        const availableWidth = boxWidth - 10; // Subtract 5mm margin on each side
        const colWidths = [availableWidth * 0.40, availableWidth * 0.60]; // Increased level column width
        let x = riskBoxX + 5;
        
        colWidths.forEach((width, colIndex) => {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(x, y, width, riskRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, width, riskRowHeight, 'S');
          
          if (colIndex === 0) {
            // Color circle
            pdf.setFillColor(risk.color[0], risk.color[1], risk.color[2]);
            pdf.circle(x + 6, y + 8, 3.5, 'F');
            
            // Label
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(risk.label, x + 12, y + 10);
          } else {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(risk.description, x + (width / 2), y + 10, { align: 'center' });
          }
          
          x += width;
        });
      });
      
      currentY = Math.max(legendBoxStartY + boxHeight, riskBoxStartY + boxHeight) + 15;

      // Only include Page 4 when overall progress exists
      const includeStatusPage = hasOverallProgress();
      if (includeStatusPage) {
        // Page 4: Quarterly Performance Trend
        addNewPage('#ffeef2'); // Light pink
        
        const trendBox = startWhiteBox(130);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Quarterly Performance Trend', 15, trendBox.boxStartY + 15);
        
        // Simple line chart grid and labels
        const chartStartY = trendBox.boxStartY + 30;
        const chartHeight = 60;
        const marginXConsistent = 15;
        const gridLeft = marginXConsistent + 40;
        const gridRight = pageWidth - marginXConsistent;
        const chartWidth = gridRight - gridLeft;
        
        // Draw grid
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        for (let i = 0; i <= 4; i++) {
          const y = chartStartY + (i * (chartHeight / 4));
          pdf.line(gridLeft, y, gridLeft + chartWidth, y);
        }
        
        // Y-axis labels (Excellent at top, Not Met at bottom)
        const perfLevels = ['Excellent', 'Very Good', 'Good', 'Need Help', 'Not Met'];
        perfLevels.forEach((level, index) => {
          const y = chartStartY + (index * (chartHeight / 4));
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(level, marginXConsistent, y + 2.5);
        });
        
        // X-axis labels
        const xLabelOrdinals = ['1st', '2nd', '3rd', '4th'];
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        xLabelOrdinals.forEach((ord, i) => {
          const x = gridLeft + (i * (chartWidth / 3));
          const bottomY = chartStartY + chartHeight + 8;
          const align = i === 0 ? 'left' : i === 3 ? 'right' : 'center';
          pdf.text(ord, x, bottomY, { align });
          pdf.text('Quarter', x, bottomY + 5, { align });
        });
        
        // Axis titles
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Performance Level', marginXConsistent, chartStartY - 6);
        pdf.text('Quarter', gridLeft + chartWidth / 2, chartStartY + chartHeight + 18, { align: 'center' });
        
        // Draw performance points/line using dynamic data
        const yMap = {
          'Excellent': 0, 'Very Good': 1, 'Good': 2, 'Need Help': 3, 'Not Met': 4
        };
        
        const xs = (idx) => gridLeft + (idx * (chartWidth / 3));
        const ys = (val) => chartStartY + (val * (chartHeight / 4));
        
        // Get dynamic data from quarterlyPerformance and visualFeedbackMap
        const dataPoints = [1,2,3,4].map((qid) => {
          const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
          const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
          return desc && yMap.hasOwnProperty(desc) ? yMap[desc] : null;
        });
        
        // Check if we have any data points
        const hasData = dataPoints.some(v => v !== null);
        
        if (hasData) {
          // Draw line
          pdf.setDrawColor(96, 165, 250);
          pdf.setLineWidth(2);
          let prev = null;
          dataPoints.forEach((v, i) => {
            if (v === null) return;
            const x = xs(i);
            const y = ys(v); // Use v directly since yMap now has correct order
            if (prev) {
              pdf.line(prev.x, prev.y, x, y);
            }
            prev = { x, y };
            pdf.setFillColor(96, 165, 250);
            pdf.circle(x, y, 2.5, 'F');
          });
        } else {
          // Show "No data available" message
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(128, 128, 128);
          pdf.text('No chart data available', gridLeft + chartWidth / 2, chartStartY + chartHeight / 2, { align: 'center' });
        }
        
        endWhiteBox(trendBox.boxEndY);
        
        // Performance Summary (unified style for detailed and overall assessment)
        // Precompute height needed to keep everything on a single page
        const summaryParts = [];
        if (milestoneSummary && String(milestoneSummary).trim()) summaryParts.push(String(milestoneSummary).trim());
        if (milestoneOverallSummary && String(milestoneOverallSummary).trim()) summaryParts.push(String(milestoneOverallSummary).trim());
        const combinedSummary = summaryParts.length ? summaryParts.join('\n\n') : 'No summary available.';
        const summaryLines = pdf.splitTextToSize(combinedSummary, pageWidth - 30);
        const estimatedTextHeight = summaryLines.length * 5; // 5px per line from addText
        const riskBarAllowance = 22; // bar + spacing
        const basePadding = 40; // title + top/bottom padding
        const dynamicSummaryHeight = Math.min(110, Math.max(60, basePadding + estimatedTextHeight + riskBarAllowance));
        const summaryBox = startWhiteBox(dynamicSummaryHeight);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Performance Summary', 15, summaryBox.boxStartY + 15);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const afterSummaryY = addText(combinedSummary, 15, summaryBox.boxStartY + 30, pageWidth - 30);
        
        // Replace green bar with compact risk info box (web-style)
        const finalRiskId = (overallRisk && overallRisk.risk) || (overallProgress && overallProgress.risk_id);
        let barColor = [96, 165, 250];
        let riskLabel = 'No Data';
        let riskDesc = 'Risk assessment data is not available.';
        
        if (finalRiskId) {
          if (finalRiskId == 1) {
            barColor = [34, 197, 94]; // green
            riskLabel = 'Low';
            riskDesc = 'Student requires immediate attention and intervention.';
          } else if (finalRiskId == 2) {
            barColor = [251, 191, 36]; // yellow
            riskLabel = 'Moderate';
            riskDesc = 'Student may need additional support in some areas.';
          } else if (finalRiskId == 3) {
            barColor = [239, 68, 68]; // red
            riskLabel = 'High';
            riskDesc = 'Student requires immediate attention and intervention.';
          }
        }
        
        // Risk status box with centered content - positioned within Performance Summary box
        const riskBoxY = Math.max(afterSummaryY + 10, summaryBox.boxStartY + dynamicSummaryHeight - 25);
        const riskBoxHeight = 25; // Reduced height for tighter fit
        
        // Ensure the risk box stays within the Performance Summary white box boundaries
        const maxRiskBoxY = summaryBox.boxStartY + dynamicSummaryHeight - 5; // Leave 5mm margin from bottom of summary box
        const adjustedRiskBoxY = Math.min(riskBoxY, maxRiskBoxY - riskBoxHeight);
        const centerY = adjustedRiskBoxY + (riskBoxHeight / 2); // Center position for content
        
        pdf.setFillColor(255, 255, 255); // White background for risk status box
        pdf.rect(15, adjustedRiskBoxY, pageWidth - 30, riskBoxHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(15, adjustedRiskBoxY, pageWidth - 30, riskBoxHeight, 'S');
        
        // Left-aligned positioning with padding
        const leftPadding = 35; // Increased padding from left edge of box
        
        // Risk circle - left-aligned with padding
        pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
        pdf.circle(leftPadding, centerY, 3.5, 'F');
        
        // Risk label - left-aligned next to circle
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(riskLabel, leftPadding + 10, centerY + 1);
        
        // Risk description - left-aligned after label
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(riskDesc, leftPadding + 40, centerY + 1);
        
        // The gap space is now inside the box - no additional external spacing needed
        const finalBoxEndY = adjustedRiskBoxY + riskBoxHeight;
        
        endWhiteBox(finalBoxEndY);
      }

      // Add footer to each page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} | School Year ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      }

      // Generate filename (consistent): Report_Card_{Last}_{First}_{Middle}_{YYYY-MM-DD}{HH-mm-ss-SSSZ}
      const last = (selectedStudent?.stud_lastname || selectedStudent?.lastName || '').toString().replace(/\s+/g, '');
      const first = (selectedStudent?.stud_firstname || selectedStudent?.firstName || '').toString().replace(/\s+/g, '');
      const middleRaw = (selectedStudent?.stud_middlename || selectedStudent?.middleName || '').toString().replace(/\s+/g, '');
      const parts = [last, first].filter(Boolean);
      if (middleRaw) parts.push(middleRaw);
      const namePart = (parts.length ? parts.join('_') : 'Student');
      const iso = new Date().toISOString();
      const [dPart, tPart] = iso.split('T');
      const [hhmmss, msZ] = tPart.split('.');
      const timePart = `${hhmmss.replace(/:/g, '-')}-${msZ}`;
      const filename = `Report_Card_${namePart}_${dPart}${timePart}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
      toast.success("PDF downloaded successfully!", { autoClose: 3000 });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
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
    
    // Check if we're on mobile (screen width < 640px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const performanceLabel = isMobile ? 'Perform Lvl' : 'Performance Level';
    // Map progress cards to y values
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });
    
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 p-4">
          <FaChartLine className="text-3xl md:text-4xl mb-4 text-gray-300" />
          <p className="text-base md:text-lg font-medium text-center">No chart data available</p>
          <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">Quarterly performance data will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="h-48 md:h-64 w-full bg-white rounded-lg border border-gray-200 p-2 md:p-4">
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
          options={getChartOptions()}
        />
      </div>
    );
  }

  // Add shapeColorMap for consistent coloring
  const shapeColorMap = {
    '♥': '#ef4444',      // Heart - red
    '★': '#f59e0b',      // Star - orange  
    '◆': '#1e40af',     // Diamond - dark blue
    '▲': '#10b981',      // Triangle - green
    '⬤': '#fef08a',      // Circle - light yellow
    '■': '#06b6d4',      // Square - light blue
    '⬢': '#def244'       // Hexagon - light green
  };

  // Printable SVG line chart (for print layout)
  function renderPrintStatusChartSVG() {
    const yMap = { 'Excellent': 5, 'Very Good': 4, 'Good': 3, 'Need Help': 2, 'Not Met': 1 };
    const xLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    
    // Check if we're on mobile (screen width < 640px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const performanceLabel = isMobile ? 'Perform Lvl' : 'Performance Level';
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });

    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white p-4">
          <FaChartLine className="text-3xl mb-2 text-gray-300" />
          <span className="text-base">No chart data available</span>
        </div>
      );
    }

    const width = 700;
    const height = 240;
    const margin = { top: 20, right: 50, bottom: 42, left: 70 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    const innerPadX = 12;
    const innerPadY = 12;
    const plotLeft = margin.left + innerPadX;
    const plotRight = margin.left + chartW - innerPadX;
    const plotTop = margin.top + innerPadY;
    const plotBottom = margin.top + chartH - innerPadY;
    const xs = (i) => plotLeft + ((plotRight - plotLeft) / 3) * i;
    const ys = (v) => plotBottom - ((v - 1) / 4) * (plotBottom - plotTop);

    let path = '';
    dataPoints.forEach((v, i) => {
      if (v == null) return;
      const cmd = path ? 'L' : 'M';
      path += `${cmd}${xs(i)},${ys(v)} `;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {[1,2,3,4,5].map((lvl) => (
            <g key={lvl}>
              <line x1={plotLeft} y1={ys(lvl)} x2={plotRight} y2={ys(lvl)} stroke="#e5e7eb" strokeWidth="1" />
              <text x={plotLeft - 12} y={ys(lvl) + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                {['','Not Met','Need Help','Good','Very Good','Excellent'][lvl]}
              </text>
            </g>
          ))}
          <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke="#9ca3af" strokeWidth="1" />
          <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#9ca3af" strokeWidth="1" />
          <path d={path.trim()} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {dataPoints.map((v, i) => v == null ? null : (
            <circle key={i} cx={xs(i)} cy={ys(v)} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          ))}
          {xLabels.map((lbl, i) => {
            const isFirst = i === 0;
            const isLast = i === xLabels.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            const xOffset = isFirst ? 4 : isLast ? -4 : 0;
            return (
              <text key={i} x={xs(i) + xOffset} y={plotBottom + 20} textAnchor={anchor} fontSize="13" fill="#6b7280">{lbl}</text>
            );
          })}
          <text x={(plotLeft + plotRight)/2} y={height - 6} textAnchor="middle" fontSize="12" fill="#374151">Quarter</text>
          <text x={16} y={margin.top - 6} textAnchor="start" fontSize="13" fill="#374151">{performanceLabel}</text>
        </svg>
      </div>
    );
  }

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

  // General helpers for printable data fallbacks
  function displayOrLine(value, line = '____________________________') {
    if (value === 0) return '0';
    if (value === false) return 'No';
    const str = typeof value === 'string' ? value.trim() : value;
    return str ? String(str) : line;
  }

  function computeAge(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const diff = Date.now() - d.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  function buildParentName(profile, prefix) {
    if (!profile) return '';
    // Check for direct field first
    const direct = profile?.[`${prefix}_name`];
    if (direct && String(direct).trim()) return String(direct).trim();
    
    // Check for individual name parts
    const first = profile?.[`${prefix}_firstname`] || profile?.[`${prefix}_first_name`] || profile?.[`${prefix}_first`] || profile?.[`${prefix}_fname`];
    const middle = profile?.[`${prefix}_middlename`] || profile?.[`${prefix}_middle_name`] || profile?.[`${prefix}_mname`];
    const last = profile?.[`${prefix}_lastname`] || profile?.[`${prefix}_last_name`] || profile?.[`${prefix}_lname`];
    
    const parts = [first, middle, last].filter(Boolean).map(v => String(v).trim());
    return parts.join(' ');
  }

  function getParentAge(profile, prefix) {
    if (!profile) return '';
    const age = profile?.[`${prefix}_age`];
    if (age) return String(age);
    const bday = profile?.[`${prefix}_birthdate`] || profile?.[`${prefix}_dob`];
    const computed = computeAge(bday);
    return Number.isFinite(computed) ? String(computed) : '';
  }

  function getParentOccupation(profile, prefix) {
    if (!profile) return '';
    return profile?.[`${prefix}_occupation`] || '';
  }

  function formatDateOfBirth(dateStr) {
    if (!dateStr) return '________________________';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to format names as "Lastname, Firstname Middlename"
  function formatName(fullName) {
    if (!fullName) return '';
    
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

  // Helper: Get latest teacher comment text for a given quarter (1-4)
  function getQuarterCommentText(quarterId) {
    if (!Array.isArray(comments) || comments.length === 0) return "";
    const matches = comments.filter((c) => {
      const qid = Number(c.quarter_id ?? c.quarterId);
      if (!isNaN(qid)) return qid === Number(quarterId);
      if (c.quarter_name && typeof c.quarter_name === 'string') {
        const suffix = quarterId === 1 ? 'st' : quarterId === 2 ? 'nd' : quarterId === 3 ? 'rd' : 'th';
        return c.quarter_name.toLowerCase().startsWith(`${quarterId}${suffix} quarter`.toLowerCase());
      }
      return false;
    });
    if (matches.length === 0) return "";
    const getTime = (c) => {
      const t = c.updated_at || c.created_at || c.comment_date;
      const d = t ? new Date(t) : null;
      return d && !isNaN(d) ? d.getTime() : 0;
    };
    const latest = matches.sort((a, b) => getTime(a) - getTime(b))[matches.length - 1];
    const text = latest.comment_text || latest.feedback || latest.comment || "";
    return (typeof text === 'string' ? text.trim() : '') || "";
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

  // Function to get chart options with responsive performance label
  const getChartOptions = () => {
    // Check if we're on mobile (screen width < 640px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const performanceLabel = isMobile ? 'Perform Lvl' : 'Performance Level';
    
    return {
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
            text: performanceLabel,
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
    router.push("/AdminSection/Users");
  };

  // Calculate student counts (filtered by search)
  const filteredStudents = students.filter(s => 
    (`${s.stud_lastname}, ${s.stud_firstname} ${s.stud_middlename || ''}`.toLowerCase().includes(studentSearch.toLowerCase()))
  );
  const maleCount = filteredStudents.filter(s => s.stud_gender === "Male").length;
  const femaleCount = filteredStudents.filter(s => s.stud_gender === "Female").length;
  const totalCount = filteredStudents.length;

  return (
    <ProtectedRoute role="Admin">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/AdminSection/Users')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Users</span>
            </button>
          <h2 className="text-lg font-bold text-gray-900">Student Progress Management</h2>
        </div>

          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <button
                onClick={() => setActiveTabSafely("Class Overview")}
                className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors text-sm sm:text-base ${
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
                    className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors text-sm sm:text-base ${
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
                      className={`text-[#2c2f6f] border-b-2 font-semibold pb-2 transition-colors flex items-center gap-2 text-sm sm:text-base ${
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
                        <FaLock className="text-xs sm:text-sm text-gray-500" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Download PDF Button - Better mobile positioning */}
            {selectedStudent && (activeTab === "Assessment" || activeTab === "Status") && (
              <button
                onClick={handleExportAssessment}
                className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 bg-[#2c2f6f] text-white px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-lg hover:opacity-90 transition-opacity font-semibold text-sm sm:text-base"
                title="Download Student Progress Report as PDF"
              >
                <FaPrint className="text-sm sm:text-base" />
                <span className="font-semibold">Download PDF</span>
              </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    // Get photo from UserContext (properly normalized, includes default placeholders)
                    const contextPhoto = getUserPhoto(advisory?.lead_teacher_id);
                    // Construct full URL for API photo (including default placeholders)
                    const apiPhoto = advisory?.lead_teacher_photo
                      ? (advisory.lead_teacher_photo.startsWith('http') ? advisory.lead_teacher_photo : API.uploads.getUploadURL(advisory.lead_teacher_photo))
                      : null;
                    const realTimePhoto = contextPhoto || apiPhoto;
                    
                    if (realTimePhoto) {
                      return (
                        <>
                          <img
                            src={realTimePhoto}
                            alt="Lead Teacher"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          {/* Fallback icon that shows when photo fails to load */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm shadow-sm hidden flex-shrink-0">
                            <FaChalkboardTeacher />
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm shadow-sm flex-shrink-0">
                          <FaChalkboardTeacher />
                        </div>
                      );
                    }
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Lead Teacher</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{leadTeacher || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    // Get photo from UserContext (properly normalized, includes default placeholders)
                    const contextPhoto = getUserPhoto(advisory?.assistant_teacher_id);
                    // Construct full URL for API photo (including default placeholders)
                    const apiPhoto = advisory?.assistant_teacher_photo
                      ? (advisory.assistant_teacher_photo.startsWith('http') ? advisory.assistant_teacher_photo : API.uploads.getUploadURL(advisory.assistant_teacher_photo))
                      : null;
                    const realTimePhoto = contextPhoto || apiPhoto;
                    
                    if (realTimePhoto) {
                      return (
                        <>
                          <img
                            src={realTimePhoto}
                            alt="Assistant Teacher"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          {/* Fallback icon that shows when photo fails to load */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs sm:text-sm shadow-sm hidden flex-shrink-0">
                            <FaChalkboardTeacher />
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs sm:text-sm shadow-sm flex-shrink-0">
                          <FaChalkboardTeacher />
                        </div>
                      );
                    }
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Assistant Teacher</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{assistantTeacher || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Student List Header and List */}
          <div className="space-y-4">
            {/* Student List Header with Counts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <h4 className="text-sm font-semibold text-gray-700">Student List</h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-blue-50 rounded-full">
                  <FaMars className="text-blue-600 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-blue-900">Male: {maleCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-pink-50 rounded-full">
                  <FaVenus className="text-pink-600 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-pink-900">Female: {femaleCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-green-50 rounded-full">
                  <FaUsers className="text-green-600 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-green-900">Total: {totalCount}</span>
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
                           className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
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
                                     className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       if (e.target.nextSibling) {
                                         e.target.nextSibling.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   {/* Fallback icon that shows when photo fails to load */}
                                   <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center hidden flex-shrink-0">
                                     <FaUser className="text-blue-600 text-xs sm:text-sm" />
                                   </div>
                                 </>
                               );
                             } else {
                               return (
                                 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                   <FaUser className="text-blue-600 text-xs sm:text-sm" />
                                 </div>
                               );
                             }
                           })()}
                           <div className="flex-1 min-w-0">
                             <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                               {student.stud_lastname}, {student.stud_firstname} {student.stud_middlename || ''}
                             </p>
                             <p className="text-xs sm:text-sm text-gray-500 truncate">
                               {student.stud_schedule_class || "No session"}
                             </p>
                           </div>
                           <div className="flex-shrink-0">
                             {student.stud_gender === "Male" ? (
                               <FaMars className="text-blue-600 text-xs sm:text-sm" />
                             ) : (
                               <FaVenus className="text-pink-600 text-xs sm:text-sm" />
                             )}
                           </div>
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
             <div className="bg-[#232c67] flex flex-col md:flex-row items-start md:items-center w-full px-4 md:px-8 py-3 md:py-6 gap-3 md:gap-10 rounded-lg">
               {/* Left side with avatar and name - 40% */}
               <div className="flex items-center gap-3 md:gap-4 w-full md:w-[40%]">
                 {(() => {
                   // Get real-time photo from UserContext, fallback to student.photo if not available
                   const realTimePhoto = getStudentPhoto(selectedStudent.student_id) || selectedStudent.photo;
                   
                   if (realTimePhoto) {
                     return (
                       <>
                         <img
                           src={realTimePhoto}
                           alt="Profile"
                           className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover shadow-md border-2 border-white"
                           onError={(e) => {
                             e.target.style.display = 'none';
                             if (e.target.nextSibling) {
                               e.target.nextSibling.style.display = 'flex';
                             }
                           }}
                         />
                         {/* Fallback icon that shows when photo fails to load */}
                         <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-200 rounded-full flex items-center justify-center hidden">
                           <FaUser className="text-white text-lg md:text-2xl" />
                         </div>
                       </>
                     );
                   } else {
                     return (
                       <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-200 rounded-full flex items-center justify-center">
                         <FaUser className="text-white text-lg md:text-2xl" />
                       </div>
                     );
                   }
                 })()}
                 <span className="font-bold text-white text-lg md:text-3xl whitespace-nowrap truncate max-w-[220px] md:max-w-none">
                   {selectedStudent ? 
                     `${selectedStudent.stud_lastname}, ${selectedStudent.stud_firstname} ${selectedStudent.stud_middlename || ''}` : 
                     "Select a student to view progress"
                   }
                 </span>
               </div>
               
               {/* Right side with student details in two rows - 60% */}
               <div className="flex flex-col gap-2 md:gap-4 w-full md:w-[60%]">
                 {/* First row - Schedule, Gender, Handedness */}
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-8">
                   <span className="text-white text-sm md:text-lg font-bold">
                     <span className="text-white">Schedule:</span> <span className="font-normal ml-2">{selectedStudent.stud_schedule_class || "N/A"}</span>
                   </span>
                   <span className="text-white text-sm md:text-lg font-bold">
                     <span className="text-white">Gender:</span> <span className="font-normal ml-2">{selectedStudent.stud_gender || "N/A"}</span>
                   </span>
                   <span className="text-white text-sm md:text-lg font-bold">
                     <span className="text-white">Handedness:</span> <span className="font-normal ml-2">{selectedStudent.stud_handedness || "N/A"}</span>
                   </span>
                 </div>
                 
                 {/* Second row - Date of Birth and Parent */}
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-8">
                   <span className="text-white text-sm md:text-lg font-bold">
                     <span className="text-white">Date of Birth:</span> <span className="font-normal ml-2">{formatDateOfBirth(selectedStudent.stud_birthdate)}</span>
                   </span>
                   <span className="text-white text-sm md:text-lg font-bold">
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
             <div className="bg-[#232c67] flex flex-col sm:flex-row items-start sm:items-center w-full px-2 sm:px-6 py-2 sm:py-4 gap-2 sm:gap-6 sticky top-0 z-10">
               {/* Left side with avatar and name - 40% */}
               <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-[40%]">
                 {(() => {
                   // Get real-time photo from UserContext, fallback to student.photo if not available
                   const realTimePhoto = getStudentPhoto(selectedStudent.student_id) || selectedStudent.photo;
                   
                   if (realTimePhoto) {
                     return (
                       <>
                         <img
                           src={realTimePhoto}
                           alt="Profile"
                           className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-md border-2 border-white"
                           onError={(e) => {
                             e.target.style.display = 'none';
                             if (e.target.nextSibling) {
                               e.target.nextSibling.style.display = 'flex';
                             }
                           }}
                         />
                         {/* Fallback icon that shows when photo fails to load */}
                         <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full flex items-center justify-center hidden">
                           <FaUser className="text-white text-lg sm:text-xl" />
                         </div>
                       </>
                     );
                   } else {
                     return (
                       <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full flex items-center justify-center">
                         <FaUser className="text-white text-lg sm:text-xl" />
                       </div>
                     );
                   }
                 })()}
                 <span className="font-bold text-white text-lg sm:text-xl whitespace-nowrap truncate max-w-[200px] sm:max-w-none">
                   {selectedStudent ? 
                     `${selectedStudent.stud_lastname}, ${selectedStudent.stud_firstname} ${selectedStudent.stud_middlename || ''}` : 
                     "Select a student to view progress"
                   }
                 </span>
               </div>
               
               {/* Right side with student details in two rows - 60% */}
               <div className="flex flex-col gap-2 w-full sm:w-[60%]">
                 {/* First row - Schedule, Gender, Handedness */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                   <span className="text-white text-sm sm:text-base font-bold">
                     <span className="text-white">Schedule:</span> <span className="font-normal ml-2">{selectedStudent.stud_schedule_class || "N/A"}</span>
                   </span>
                   <span className="text-white text-sm sm:text-base font-bold">
                     <span className="text-white">Gender:</span> <span className="font-normal ml-2">{selectedStudent.stud_gender || "N/A"}</span>
                   </span>
                   <span className="text-white text-sm sm:text-base font-bold">
                     <span className="text-white">Handedness:</span> <span className="font-normal ml-2">{selectedStudent.stud_handedness || "N/A"}</span>
                   </span>
                 </div>
                 
                 {/* Second row - Date of Birth and Parent */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
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
        <div ref={activeTab === "Assessment" || activeTab === "Status" ? assessmentRef : null} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {/* Print Layout - hidden on screen; shown via print CSS */}
          <div ref={printRef} className="hidden print:block" style={{margin: 0, padding: 0}}>
            {/* Page 1: Learner info */}
            <div className="print-page p-10 pastel-blue border-soft rounded-xl text-[15px]" style={{margin: 0}}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-[72px] h-[72px] rounded-full bg-white/80 border border-white/70 p-2 flex items-center justify-center">
                    <img src="/assets/image/villelogo.png" alt="School Logo" className="w-16 h-16 object-contain" />
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold tracking-tight text-[#232c67] leading-tight">LEARNERS' VILLE</div>
                    <div className="text-lg text-gray-700">6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines</div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="inline-flex items-center px-5 py-2 rounded-full bg-white/80 border border-white/70 text-[#232c67] font-semibold text-base">
                    SY {new Date().getFullYear()} - {new Date().getFullYear()+1}
                  </div>
                </div>
              </div>
              <div className="h-0.5 w-full bg-white/70 rounded-full mb-8" />

              <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-7">
                <div className="section-title text-3xl font-bold text-gray-900 mb-5">Learner's Information</div>
                <div className="grid grid-cols-2 gap-5 text-lg leading-relaxed">
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Name</div>
                    <div className="text-gray-900 font-semibold text-lg">
                      {selectedStudent ? `${selectedStudent.stud_lastname || ''}, ${selectedStudent.stud_firstname || ''} ${selectedStudent.stud_middlename || ''}` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Sex</div>
                    <div className="text-gray-900 font-semibold text-lg">{selectedStudent?.stud_gender || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Level</div>
                    <div className="text-gray-900 font-semibold text-lg">{displayOrLine(studentLevelData?.level_name || studentLevelData?.levelName || studentLevelData?.level?.level_name || selectedStudent?.level_name || selectedStudent?.levelName || selectedStudent?.level?.level_name || (studentLevelData?.levelId ? (classes.find(c => c.level_id == studentLevelData.levelId)?.level_name || `Level ${studentLevelData.levelId}`) : ''))}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Date of Birth</div>
                    <div className="text-gray-900 font-semibold text-lg">{formatDateOfBirth(selectedStudent?.stud_birthdate) || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Lead Teacher</div>
                    <div className="text-gray-900 font-semibold text-lg">{displayOrLine(advisory?.lead_teacher_name ? formatName(advisory.lead_teacher_name) : '')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Assistant Teacher</div>
                    <div className="text-gray-900 font-semibold text-lg">{displayOrLine(advisory?.assistant_teacher_name ? formatName(advisory.assistant_teacher_name) : '')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7">
                <div className="section-title text-3xl font-bold text-gray-900 mb-5">Sociodemographic Profile</div>
                <div className="grid grid-cols-2 gap-6 text-lg leading-relaxed">
                  <div>
                    <div className="text-gray-600 font-semibold text-base">Handedness</div>
                    <div className="text-gray-900 font-semibold text-lg">{displayOrLine(selectedStudent?.stud_handedness)}</div>
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <div className="text-gray-800 font-semibold text-xl">Father's Details</div>
                    <div className="grid grid-cols-3 gap-4 text-gray-900">
                      <div className="col-span-3"><span className="text-gray-600">Name</span>: <span className="font-semibold">{displayOrLine(buildParentName(parentProfile, 'father'))}</span></div>
                      <div><span className="text-gray-600">Age</span>: <span className="font-semibold">{displayOrLine(getParentAge(parentProfile, 'father'))}</span></div>
                      <div className="col-span-2"><span className="text-gray-600">Occupation</span>: <span className="font-semibold">{displayOrLine(getParentOccupation(parentProfile, 'father'))}</span></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-800 font-semibold text-xl">Mother's Details</div>
                    <div className="grid grid-cols-3 gap-4 text-gray-900">
                      <div className="col-span-3"><span className="text-gray-600">Name</span>: <span className="font-semibold">{displayOrLine(buildParentName(parentProfile, 'mother'))}</span></div>
                      <div><span className="text-gray-600">Age</span>: <span className="font-semibold">{displayOrLine(getParentAge(parentProfile, 'mother'))}</span></div>
                      <div className="col-span-2"><span className="text-gray-600">Occupation</span>: <span className="font-semibold">{displayOrLine(getParentOccupation(parentProfile, 'mother'))}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2: Attendance + Parent Signatures */}
            <div className="print-page p-10 pastel-green border-soft rounded-xl text-[15px]" style={{margin: 0}}>
              <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
                <div className="section-title text-3xl font-bold text-gray-900 mb-5">Record of Attendance</div>
                {(() => {
                  const attendanceSummary = getAttendanceSummary();
                  return attendanceSummary ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <table className="w-full text-lg no-break border-collapse table-fixed" style={{tableLayout: 'fixed'}}>
                        <colgroup>
                          <col style={{ width: '18%' }} />
                          {attendanceSummary.summary.map((_, idx) => (
                            <col key={idx} style={{ width: '8%' }} />
                          ))}
                          <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                          <tr className="pastel-blue">
                            <th className="px-4 py-3 text-left font-semibold text-gray-900 border-soft">Category</th>
                            {attendanceSummary.summary.map((m, idx) => (
                              <th key={idx} className="px-2 py-3 text-center font-semibold text-gray-900 border-soft">{m.label}</th>
                            ))}
                            <th className="px-2 py-3 text-center font-semibold text-gray-900 border-soft whitespace-nowrap min-w-[64px]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-800">
                          <tr>
                            <td className="px-4 py-3 border-soft font-medium bg-white">No. of School Days</td>
                            {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.total}</td>))}
                            <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalSchoolDays}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border-soft font-medium bg-white">No. of Days Present</td>
                            {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.present}</td>))}
                            <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalPresent}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border-soft font-medium bg-white">No. of Days Absent</td>
                            {attendanceSummary.summary.map((m, idx) => (<td key={idx} className="px-2 py-3 text-center border-soft bg-white">{m.absent}</td>))}
                            <td className="px-2 py-3 text-center border-soft font-semibold whitespace-nowrap bg-white">{attendanceSummary.totalAbsent}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-600 italic">No attendance data available</div>
                  );
                })()}
              </div>

              <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7">
                <div className="section-title text-3xl font-bold text-gray-900 mb-5">Parent/Guardian Signatures</div>
                <div className="grid grid-cols-1 gap-5 text-lg leading-relaxed">
                  {[1, 2, 3, 4].map((q) => {
                    const suffix = q===1?'st':q===2?'nd':q===3?'rd':'th';
                    const quarterComment = getQuarterCommentText(q);
                    return (
                      <div key={q} className="no-break">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-[380px]">
                            <span className="font-semibold text-gray-800">{`${q}${suffix} Quarter`}</span>
                            <span className="h-px bg-gray-400 flex-1" style={{ minWidth: '240px' }}></span>
                          </div>
                          <div className="text-gray-600 text-base whitespace-nowrap">(Parent/Guardian Signature)</div>
                        </div>
                        <div className="mt-2 text-gray-800">
                          <span className="text-gray-600 font-semibold text-base">Teacher Comment:</span>{' '}
                          <span className="font-semibold">{quarterComment && quarterComment.length > 0 ? quarterComment : '____________________________'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Page 3: Quarterly Assessment & Legend */}
            <div className="print-page p-10 pastel-yellow border-soft rounded-xl text-[15px]" style={{margin: 0}}>
              <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
                <div className="section-title text-3xl font-bold text-gray-900 mb-5">Quarterly Assessment</div>
                <div className="no-break">
                  <table className="w-full text-lg border-soft">
                    <thead>
                      <tr className="bg-white">
                        <th className="px-4 py-2 text-left border-soft">Subjects</th>
                        {quarters.map(q => (
                          <th key={q.id} className="px-3 py-2 text-center border-soft">{q.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...subjects].sort((a,b)=>a.localeCompare(b)).map((subject, i)=> (
                        <tr key={i}>
                          <td className="px-4 py-1 border-soft font-medium text-gray-900">{subject}</td>
                          {quarters.map(q => {
                            if (q.id === 5) {
                              const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                              const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                              const shape = vf?.visual_feedback_shape || '';
                              return (
                                <td key={q.id} className="px-3 py-1 text-center border-soft bg-[#fffaf0]">
                                  {shape ? (
                                    <span style={{ color: shapeColorMap[shape] || 'inherit', fontSize: '1.5em' }}>{shape}</span>
                                  ) : ''}
                                </td>
                              );
                            }
                            const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                            if (card) {
                              const fb = quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === q.id);
                              const shape = fb?.shape || '';
                              return (
                                <td key={q.id} className="px-3 py-1 text-center border-soft bg-[#fffaf0]">
                                  {shape ? (
                                    <span style={{ color: shapeColorMap[shape] || 'inherit', fontSize: '1.5em' }}>{shape}</span>
                                  ) : ''}
                                </td>
                              );
                            }
                            return <td key={q.id} className="px-3 py-1 text-center border-soft"></td>;
                          })}
                        </tr>
                      ))}
                      <tr className="bg-white">
                        <td className="px-4 py-1 font-semibold border-soft">Quarter Result</td>
                        {quarters.map(q => {
                          if (q.id === 5) {
                            const allQuartersFinalized = [1,2,3,4].every(quarterId => progressCards.some(pc => Number(pc.quarter_id) === quarterId));
                            const shape = overallProgress && overallProgress.visual_shape && allQuartersFinalized ? overallProgress.visual_shape : '';
                            const riskId = overallProgress?.risk_id;
                            const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                            return (
                              <td key={q.id} className="px-3 py-1 text-center border-soft">
                                {shape ? (
                                  <div className="inline-flex items-center gap-2">
                                    {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                                    <span style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 700 }}>{shape}</span>
                                  </div>
                                ) : ''}
                              </td>
                            );
                          }
                          const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                          if (card) {
                            const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                            const shape = vf?.visual_feedback_shape || '';
                            const riskId = card?.risk_id;
                            const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                            return (
                              <td key={q.id} className="px-3 py-1 text-center border-soft">
                                {shape ? (
                                  <div className="inline-flex items-center gap-2">
                                    {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                                    <span style={{ color: shapeColorMap[shape] || '#222', fontSize: '1.5em', fontWeight: 700 }}>{shape}</span>
                                  </div>
                                ) : ''}
                              </td>
                            );
                          }
                          return <td key={q.id} className="px-3 py-1 text-center border-soft"></td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-5">
                  <div className="section-title text-2xl font-bold text-gray-900 mb-4">Assessment Legend</div>
                  <table className="w-full text-base border-soft">
                    <thead>
                      <tr className="bg-white">
                        <th className="text-left px-4 py-2 border-soft">Shapes</th>
                        <th className="text-left px-4 py-2 border-soft">Descriptions</th>
                        <th className="text-left px-4 py-2 border-soft">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(visualFeedback) && visualFeedback.length > 0
                        ? visualFeedback
                        : [
                            { visual_feedback_id: 1, visual_feedback_shape: '❤️', visual_feedback_description: 'Excellent' },
                            { visual_feedback_id: 2, visual_feedback_shape: '⭐', visual_feedback_description: 'Very Good' },
                            { visual_feedback_id: 3, visual_feedback_shape: '🔷', visual_feedback_description: 'Good' },
                            { visual_feedback_id: 4, visual_feedback_shape: '▲', visual_feedback_description: 'Need Help' },
                            { visual_feedback_id: 5, visual_feedback_shape: '●', visual_feedback_description: 'Not Met' }
                          ]
                      ).map((item) => (
                        <tr key={item.visual_feedback_id} className="border-soft">
                          <td className="px-4 py-2 border-soft">
                            <span style={{ color: shapeColorMap[item.visual_feedback_shape] || 'inherit', fontSize: '1.5em' }}>
                              {item.visual_feedback_shape}
                            </span>
                          </td>
                          <td className="px-4 py-2 border-soft">{item.visual_feedback_description}</td>
                          <td className="px-4 py-2 border-soft">{item.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-5">
                  <div className="section-title text-2xl font-bold text-gray-900 mb-4">Risk Levels</div>
                  <table className="w-full text-base border-soft">
                    <thead>
                      <tr className="bg-white">
                        <th className="text-left px-4 py-2 border-soft">Level</th>
                        <th className="text-left px-4 py-2 border-soft">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(riskLevels) && riskLevels.length > 0 ? riskLevels : [
                        { risk_id: 1 },
                        { risk_id: 2 },
                        { risk_id: 3 }
                      ]).map((risk, idx) => {
                        const info = getRiskInfo(risk.risk_id);
                        const color = String(risk.risk_id) === '1' ? '#10B981' : String(risk.risk_id) === '2' ? '#F59E0B' : '#EF4444';
                        const meaning = info.text === 'Low' ? 'Meeting Expectations' : info.text === 'Moderate' ? 'Needs Some Support' : info.text === 'High' ? 'Needs Close Attention' : '';
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-2 border-soft">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                                <span className="font-medium">{info.text}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 border-soft">{meaning}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Page 4: Performance Overview (only if overall progress) */}
            {hasOverallProgress() && (
              <div className="print-page p-10 pastel-pink border-soft rounded-xl text-[15px]" style={{margin: 0}}>
                <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
                  <div className="section-title text-3xl font-bold text-gray-900 mb-5">Quarterly Performance Trend</div>
                  <div className="no-break">{renderPrintStatusChartSVG()}</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-6">
                    <div className="section-title text-2xl font-bold text-gray-900 mb-4">Performance Summary</div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-base leading-relaxed">
                      {milestoneSummary || milestoneOverallSummary ? (
                        <>
                          {milestoneSummary && <p className="mb-3">{milestoneSummary}</p>}
                          {milestoneOverallSummary && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="font-semibold text-blue-900">{milestoneOverallSummary}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="italic text-gray-600">No summary available</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-6">
                    <div className="section-title text-2xl font-bold text-gray-900 mb-4">Risk Level</div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-base">
                      {hasOverallProgress() ? (
                        (() => {
                          const riskId = String(overallRisk?.risk || '');
                          let label = 'No Data';
                          let color = '';
                          let description = 'Risk assessment data is not available.';
                          if (riskId === '1') { label = 'Low'; color = '#22c55e'; description = 'Student is performing well and meeting expectations.'; }
                          else if (riskId === '2') { label = 'Moderate'; color = '#fbbf24'; description = 'Student may need additional support in some areas.'; }
                          else if (riskId === '3') { label = 'High'; color = '#ef4444'; description = 'Student requires immediate attention and intervention.'; }
                          return (
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                                <span className="font-semibold">{label}</span>
                              </div>
                              <p className="text-gray-700">{description}</p>
                            </>
                          );
                        })()
                      ) : (
                        <div className="text-gray-600 italic">No Assessment Data</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 bg-white px-2 md:px-8 pt-2 md:pt-8 pb-2 md:pb-8">
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
                        <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm min-w-[600px]">
                          <thead>
                            <tr>
                              <th className="border-b border-gray-200 px-2 sm:px-4 py-1.5 bg-gray-50 text-left font-semibold text-gray-700 text-xs sm:text-sm">Subjects</th>
                              {quarters.map(q => (
                                <th key={q.id} className="border-b border-gray-200 px-1 sm:px-4 py-1.5 bg-gray-50 text-center">
                                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <span className="text-xs font-medium text-gray-600 leading-tight">{q.name}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.length > 0 ? (
                              [...subjects].sort((a, b) => a.localeCompare(b)).map((subject, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">{subject}</td>
                                                          {quarters.map(q => {
                          if (q.id === 5) {
                            const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                            const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                            return (
                              <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center">
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
                              <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center">
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
                              <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center">
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
                              <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-blue-900 text-xs sm:text-sm">Quarter Result</td>
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
                                      <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center">
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
                                    return <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center"></td>;
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
                                    <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center">
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
                                    return <td key={q.id} className="px-1 sm:px-4 py-2 sm:py-3 text-center"></td>;
                                  }
                              })}
                            </tr>
                            

                          </tbody>
                        </table>
                        </div>
                      </div>
                  </div>

                  {/* Attendance Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-2 md:p-4 border border-green-100">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaChartBar className="text-green-600 text-sm md:text-lg" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Record of Attendance</h3>
                        <p className="text-xs md:text-sm text-gray-600">Monthly attendance tracking</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm min-w-[600px]">
                          <thead>
                            <tr className="bg-green-50">
                              <th className="border-b border-gray-200 px-2 py-2 sm:py-3 text-left font-semibold text-gray-700 w-[120px] text-xs sm:text-sm">Category</th>
                              {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((month) => (
                                <th key={month} className="border-b border-gray-200 px-1 py-2 sm:py-3 text-center font-semibold text-gray-700 text-xs sm:text-sm">{month}</th>
                              ))}
                              <th className="border-b border-gray-200 px-2 py-2 sm:py-3 text-center font-semibold text-gray-700 bg-blue-50 text-xs sm:text-sm">Total</th>
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
                                  <td className="px-2 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">No. of School Days</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{m.total}</td>)}
                                  <td className="px-2 py-2 sm:py-3 text-center font-bold text-blue-600 bg-blue-50 text-xs sm:text-sm">{att.totalSchoolDays}</td>
                                </tr>,
                                <tr key="present" className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">No. of Days Present</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-2 sm:py-3 text-center text-green-600 text-xs sm:text-sm">{m.present}</td>)}
                                  <td className="px-2 py-2 sm:py-3 text-center font-bold text-green-600 bg-blue-50 text-xs sm:text-sm">{att.totalPresent}</td>
                                </tr>,
                                <tr key="absent" className="hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">No. of Days Absent</td>
                                  {att.summary.map((m, idx) => <td key={idx} className="px-1 py-2 sm:py-3 text-center text-red-600 text-xs sm:text-sm">{m.absent}</td>)}
                                  <td className="px-2 py-2 sm:py-3 text-center font-bold text-red-600 bg-blue-50 text-xs sm:text-sm">{att.totalAbsent}</td>
                                </tr>
                              ];
                            })()}
                          </tbody>
                        </table>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Right: Legend and Comments (2 columns) */}
                <div className="col-span-1 md:col-span-2 space-y-4 md:space-y-8">
                  {/* Legend Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FaTable className="text-purple-600 text-sm md:text-lg" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Assessment Legend</h3>
                        <p className="text-xs md:text-sm text-gray-600">Performance indicators and meanings</p>
                      </div>
                    </div>
                    
                    <div className="overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold text-gray-700 w-16 text-xs sm:text-sm">Shapes</th>
                              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold text-gray-700 text-xs sm:text-sm">Descriptions</th>
                              <th className="border-b border-gray-200 px-2 py-2 text-left font-semibold text-gray-700 w-20 text-xs sm:text-sm">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visualFeedback.length > 0 ? (
                              visualFeedback.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-2 py-2">
                                    <span 
                                      style={{ color: shapeColorMap[item.visual_feedback_shape] || 'inherit', fontSize: '1.2em' }}
                                      className="inline-block hover:scale-110 transition-transform"
                                    >
                                      {item.visual_feedback_shape}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-gray-700 text-xs sm:text-sm">{item.visual_feedback_description}</td>
                                  <td className="px-2 py-2 text-gray-700 text-xs sm:text-sm">{item.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'}</td>
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
                  </div>

                  {/* Risk Level Legend */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-2 md:p-4 border border-red-100">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-600 text-sm md:text-lg" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Risk Level</h3>
                        <p className="text-xs md:text-sm text-gray-600">Performance risk indicators</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                    fill="none"
                                  />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke={color.border}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeDasharray={`${(2 * Math.PI * 20 * percent) / 100} ${2 * Math.PI * 20}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 24 24)"
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