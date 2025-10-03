"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaArrowLeft, FaUser, FaMale, FaFemale, FaUsers, FaChalkboardTeacher, FaMars, FaVenus, FaChartBar, FaTable, FaExclamationTriangle, FaComments, FaTimes, FaCheckCircle, FaRegClock, FaPlusCircle, FaChartLine, FaSearch, FaChevronDown, FaLock, FaPrint, FaDownload } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useAuth } from "../../Context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../Context/UserContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function StudentProgress({ formData: initialFormData }) {
  const { getUserPhoto, getStudentPhoto, updateAnyUserPhoto, updateAnyStudentPhoto, initializeAllUsersPhotos } = useUser();
  const [activeTab, setActiveTab] = useState("Assessment");
  const router = useRouter();
  const auth = useAuth();

  // State for parent's children
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parentProfile, setParentProfile] = useState(null);

  // State for student data
  const [statusData, setStatusData] = useState(null);

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
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  
  // Status data states
  const [statusLoading, setStatusLoading] = useState(false);
  const [overallRisk, setOverallRisk] = useState({ risk: null });
  const [visualFeedbackMap, setVisualFeedbackMap] = useState({});
  const [quarterlyPerformance, setQuarterlyPerformance] = useState([]);
  const [milestoneSummary, setMilestoneSummary] = useState("");
  const [milestoneOverallSummary, setMilestoneOverallSummary] = useState("");
  const [milestoneRecordedAt, setMilestoneRecordedAt] = useState(null);
  const [milestoneId, setMilestoneId] = useState(null);

  // Color mapping for visual feedback shapes
  const shapeColorMap = {
    '❤️': '#f44336',      // Red heart for Excellent
    '❤': '#f44336',       // Red heart for Excellent (variant)
    '♥': '#f44336',        // Red heart for Excellent (variant)
    '■': '#00BCD4',        // Turquoise square for Excellent
    '⭐': '#ff9800',       // Orange star for Very Good
    '★': '#ff9800',        // Orange star for Very Good (variant)
    '⬢': '#CDDC39',       // Lime green hexagon for Very Good
    '🔷': '#2196f3',      // Blue diamond for Good
    '◆': '#2196f3',        // Blue diamond for Good (variant)
    '▲': '#4caf50',       // Green triangle for Need Help
    '🟡': '#ffeb3b',      // Yellow circle for Not Met
    '●': '#ffeb3b',        // Yellow circle for Not Met (variant)
    '⬤': '#ffeb3b',       // Yellow circle for Not Met (variant)
  };

  // Tooltip state
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Refs for printable content
  const assessmentRef = useRef(null);
  const printRef = useRef(null);
  const [showPrintLayout, setShowPrintLayout] = useState(false);

  const quarters = [
    { id: 1, name: '1st Quarter' },
    { id: 2, name: '2nd Quarter' },
    { id: 3, name: '3rd Quarter' },
    { id: 4, name: '4th Quarter' },
    { id: 5, name: 'Final' },
  ];

  // Helper function to construct full photo URL from filename
  function getPhotoUrl(filename) {
    if (!filename) {
      console.log('🔍 getPhotoUrl: No filename provided');
      return null;
    }
    
    // If it's already a full URL (like a blob URL for preview), return as is
    if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('blob:')) {
      console.log('🔍 getPhotoUrl: Already a full URL:', filename);
      return filename;
    }
    
    // If it already starts with /php/Uploads/, return as is
    if (filename.startsWith('/php/Uploads/')) {
      console.log('🔍 getPhotoUrl: Already has /php/Uploads/ prefix:', filename);
      return filename;
    }
    
    // If it's a filename, construct the full backend URL
    const fullUrl = `/php/Uploads/${filename}`;
    console.log('🔍 getPhotoUrl: Converting filename to full URL:', {
      filename: filename,
      fullUrl: fullUrl
    });
    return fullUrl;
  }

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

  // Debug: Monitor UserContext photos
  useEffect(() => {
    console.log('ReportCard: UserContext photos updated. Current students:', students);
    if (students.length > 0) {
      students.forEach((student, index) => {
        const photoFromContext = getStudentPhoto(student.id);
        console.log(`Student ${index + 1} photo check:`, {
          id: student.id,
          name: student.name,
          photoFromContext,
          hasPhotoInContext: !!photoFromContext,
          studentPhoto: student.photo
        });
      });
    }
  }, [students, getStudentPhoto]);

  // Load parent's children on component mount
  useEffect(() => {
    console.log("ReportCard: Component mounted, checking authentication...");
    console.log("localStorage userId:", localStorage.getItem('userId'));
    console.log("localStorage isAuthenticated:", localStorage.getItem('isAuthenticated'));
    console.log("localStorage userRole:", localStorage.getItem('userRole'));
    
    // Check authentication status
    if (auth.checkAuthStatus) {
      const isAuthValid = auth.checkAuthStatus();
      console.log("ReportCard: Auth check result:", isAuthValid);
      
      if (!isAuthValid) {
        console.warn("ReportCard: Authentication check failed");
        toast.error("Authentication failed. Please log in again.");
        router.push("/LoginSection");
        return;
      }
    }
    
    loadParentChildren();
  }, [auth, router]);

  // Custom setActiveTab function that prevents setting Status tab when there's no data
  const setActiveTabSafely = (tab) => {
    if (tab === "Status" && !hasOverallProgress()) {
      console.log('🚫 Blocked attempt to set Status tab - no progress data available');
      return; // Don't allow setting Status tab when there's no data
    }
    console.log(`✅ Setting active tab to: ${tab}`);
    setActiveTab(tab);
  };

  // Auto-switch to Assessment tab if Status becomes locked
  useEffect(() => {
    console.log('=== Auto-switch useEffect Debug ===');
    console.log('activeTab:', activeTab);
    console.log('hasOverallProgress():', hasOverallProgress());
    console.log('hasAnyProgress():', hasAnyProgress());
    console.log('assessmentLoading:', assessmentLoading);
    console.log('statusLoading:', statusLoading);
    
    if (activeTab === "Status" && !hasOverallProgress()) {
      console.log('🔄 Auto-switching from Status to Assessment tab - no progress data');
      setActiveTabSafely("Assessment");
    }
  }, [activeTab, overallProgress, quarterlyPerformance, milestoneSummary, milestoneOverallSummary, finalSubjectProgress, assessmentLoading, statusLoading]);

  // Additional safety: Ensure Status tab is never active when there's no data
  useEffect(() => {
    if (activeTab === "Status" && !hasOverallProgress() && !assessmentLoading && !statusLoading) {
      console.log('🛡️ Safety check: Forcing switch from Status to Assessment tab');
      setActiveTabSafely("Assessment");
    }
  }, [activeTab, hasOverallProgress, hasAnyProgress, assessmentLoading, statusLoading]);

  // Load parent's children
  const loadParentChildren = async () => {
    setLoading(true);
    try {
      // Get current user ID from localStorage or context
      const parentId = localStorage.getItem('userId');
      console.log("ReportCard: Loading children for parent ID:", parentId);
      
      if (!parentId) {
        console.warn("ReportCard: No userId found in localStorage");
        toast.error("User not authenticated");
        setLoading(false);
        return;
      }

      // Fetch all users to get students
      const usersRes = await fetch("/php/Users/get_all_users.php");
      const usersData = await usersRes.json();
      
      // Check if the API response has the expected structure
      if (!usersData.users || !usersData.users.Student) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      // Filter students for this parent
      let myStudents = usersData.users.Student.filter(s => String(s.parent_id) === String(parentId));
      console.log("ReportCard: All students from API:", usersData.users.Student);
      console.log("ReportCard: Filtered students for parent:", myStudents);
      
      // Debug: Log photo information for each student
      myStudents.forEach((student, index) => {
        console.log(`Student ${index + 1}:`, {
          id: student.id,
          name: student.name,
          photo: student.photo,
          hasPhoto: !!student.photo,
          levelId: student.levelId,
          level_id: student.level_id,
          advisory_id: student.advisory_id,
          levelName: student.levelName
        });
      });
      
      // Sort students by level
      myStudents = myStudents.sort((a, b) => (parseInt(a.levelId) || 0) - (parseInt(b.levelId) || 0));
      
      setStudents(myStudents);
      
      // Initialize UserContext with all users' photos for real-time updates
      if (usersData.users) {
        console.log("ReportCard: Initializing UserContext with users data:", {
          adminCount: usersData.users.Admin?.length || 0,
          teacherCount: usersData.users.Teacher?.length || 0,
          parentCount: usersData.users.Parent?.length || 0,
          studentCount: usersData.users.Student?.length || 0,
          sampleStudentPhoto: usersData.users.Student?.[0]?.photo
        });
        initializeAllUsersPhotos(usersData.users);
      }
      
                      if (myStudents.length > 0) {
            // Auto-select first active student
            const activeStudents = myStudents.filter(s => s.schoolStatus === 'Active');
            if (activeStudents.length > 0) {
              setSelectedStudentId(activeStudents[0].id);
            } else {
              // If no active students, select the first student anyway
              setSelectedStudentId(myStudents[0].id);
            }
          }
      
      // Fetch parent profile information
      const parentRes = await fetch("/php/Users/get_user_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parentId })
      });
      const parentData = await parentRes.json();
      
      if (parentData.status === "success") {
        // Fetch full parent profile (father/mother details)
        const parentProfileRes = await fetch("/php/Users/get_user_profile.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parentId })
        });
        const parentProfileData = await parentProfileRes.json();
        setParentProfile({ ...parentData.user, ...parentProfileData.user });
      }
    } catch (error) {
      console.error("Error loading parent's children:", error);
      toast.error("Failed to load children. Please check your connection.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load selected student details
  useEffect(() => {
    if (!selectedStudentId) return;
    
    console.log("=== SWITCHING STUDENT ===");
    console.log("Previous student ID:", selectedStudent?.id);
    console.log("New student ID:", selectedStudentId);
    
    // Reset all assessment and status data when switching students
    setSubjects([]);
    setQuarterFeedback([]);
    setProgressCards([]);
    setQuarterlyPerformance([]);
    setFinalSubjectProgress([]);
    setOverallProgress({});
    setVisualFeedback([]);
    setRiskLevels([]);
    setComments([]);
    setAttendanceData([]);
    setQuartersData([]);
    setMilestoneSummary(null);
    setMilestoneOverallSummary(null);
    setMilestoneRecordedAt(null);
    setMilestoneId(null);
    setOverallRisk({});
    
    const selectedStudentData = students.find(s => s.id === selectedStudentId);
    if (selectedStudentData) {
      console.log("Selected student data:", selectedStudentData);
      setSelectedStudent(selectedStudentData);
      // Load detailed student information first, then assessment data
      loadStudentDetails(selectedStudentData.id);
    }
  }, [selectedStudentId, students]);

  // Load detailed student information
  const loadStudentDetails = async (studentId) => {
    setStudentDetailsLoading(true);
    try {
      // Fetch student details
      const res = await fetch("/php/Users/get_student_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        // Get the current student data to find the advisory ID
        const currentStudent = students.find(s => s.id === studentId);
        
        // Try multiple possible fields for advisory ID
        let advisoryId = currentStudent?.levelId || currentStudent?.advisory_id || currentStudent?.level_id;
        
        console.log('=== Teacher Data Fetching Debug ===');
        console.log('Current student:', currentStudent);
        console.log('Advisory ID from levelId:', currentStudent?.levelId);
        console.log('Advisory ID from advisory_id:', currentStudent?.advisory_id);
        console.log('Advisory ID from level_id:', currentStudent?.level_id);
        console.log('Final advisory ID to use:', advisoryId);
        
        let teacherData = {};
        
        // Always try to fetch teacher information using student_id
        try {
          console.log('Fetching advisory data for student ID:', studentId);
          console.log('Student levelName (advisory assignment):', currentStudent?.levelName);
          console.log('Student levelId:', currentStudent?.levelId);
          
          const advisoryRes = await fetch("/php/Advisory/get_advisory_details.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: studentId })
          });
          
          if (advisoryRes.ok) {
            const advisoryData = await advisoryRes.json();
            console.log('Advisory API response:', advisoryData);
            
            if (advisoryData.advisory) {
              teacherData = {
                lead_teacher_name: advisoryData.advisory.lead_teacher_name || "Not assigned",
                assistant_teacher_name: advisoryData.advisory.assistant_teacher_name || "Not assigned"
              };
              console.log('Teacher data extracted:', teacherData);
            } else {
              console.log('No advisory object in response - student may not be assigned to an advisory');
              // Check if there's debug info in the response
              if (advisoryData.debug_info) {
                console.log('Debug info from API:', advisoryData.debug_info);
              }
              teacherData = {
                lead_teacher_name: "Not assigned",
                assistant_teacher_name: "Not assigned"
              };
            }
          } else {
            console.log('Advisory API request failed with status:', advisoryRes.status);
            // Try to get error details
            try {
              const errorData = await advisoryRes.text();
              console.log('Error response body:', errorData);
            } catch (e) {
              console.log('Could not read error response body');
            }
            teacherData = {
              lead_teacher_name: "Not assigned",
              assistant_teacher_name: "Not assigned"
            };
          }
        } catch (advisoryError) {
          console.error('Error fetching advisory data:', advisoryError);
          // Set default values if there's an error
          teacherData = {
            lead_teacher_name: "Not assigned",
            assistant_teacher_name: "Not assigned"
          };
        }
        
        // Merge the detailed student data with the existing student data
        setSelectedStudent(prevStudent => {
          const updatedStudent = {
            ...prevStudent,
            ...data.student,
            ...teacherData,
            // Map the API response fields to match the expected format
            stud_firstname: data.student.firstName,
            stud_middlename: data.student.middleName,
            stud_lastname: data.student.lastName,
            stud_birthdate: data.student.user_birthdate,
            stud_gender: data.student.gender,
            stud_handedness: data.student.handedness,
            stud_schedule_class: data.student.scheduleClass,
            stud_enrollment_date: data.student.enrollmentDate
          };
          
          console.log('=== Final Student Data Structure ===');
          console.log('Teacher data fetched:', teacherData);
          console.log('Student details from API:', data.student);
          console.log('Previous student state:', prevStudent);
          console.log('Final updated student data:', updatedStudent);
          console.log('Teacher names in final data:', {
            lead_teacher_name: updatedStudent.lead_teacher_name,
            assistant_teacher_name: updatedStudent.assistant_teacher_name
          });
          
          // Now load assessment and status data with the complete student information
          // Pass the updated student data directly to avoid state timing issues
          loadAssessmentData(updatedStudent.id, updatedStudent);
          loadStatusData(updatedStudent.id, updatedStudent);
          
          return updatedStudent;
        });
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error("Failed to load detailed student information");
    } finally {
      setStudentDetailsLoading(false);
    }
  };

  // Load assessment data for selected student
  const loadAssessmentData = async (studentId, studentData = null) => {
    console.log("=== CALLING loadAssessmentData ===");
    console.log("Student ID:", studentId);
    console.log("Student Data Parameter:", studentData);
    console.log("Current selectedStudent State:", selectedStudent);
    
    setAssessmentLoading(true);
    try {
      // Use the passed studentData if available, otherwise fall back to selectedStudent state
      const currentStudentData = studentData || selectedStudent;
      const advisoryId = currentStudentData?.levelId;
      
      console.log("=== DEBUG: loadAssessmentData ===");
      console.log("Student ID:", studentId);
      console.log("Current Student Data:", currentStudentData);
      console.log("Advisory ID (using levelId):", advisoryId);
      
      if (!advisoryId) {
        console.warn("No level ID found for student. Student data:", currentStudentData);
        setAssessmentLoading(false);
        return;
      }

      // Fetch all assessment data
      const promises = [
        fetch("/php/Assessment/get_visual_feedback.php"),
        fetch("/php/Assessment/get_risk_levels.php"),
        fetch(`/php/Assessment/get_comments.php?student_id=${studentId}`),
        fetch("/php/Advisory/get_attendance.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            advisory_id: advisoryId,
            student_id: studentId 
          })
        }),
        fetch(`/php/Assessment/get_subjects_by_advisory.php?advisory_id=${advisoryId}`),
        fetch(`/php/Assessment/get_student_quarter_feedback.php?student_id=${studentId}`),
        fetch(`/php/Assessment/get_student_progress_cards.php?student_id=${studentId}&advisory_id=${advisoryId}`),
        fetch('/php/Assessment/get_quarters.php'),
        fetch(`/php/Assessment/get_subject_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`),
        fetch(`/php/Assessment/get_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`)
      ];

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(res => res.json()));

      console.log("=== API Response Data ===");
      console.log("Visual Feedback:", data[0]);
      console.log("Risk Levels:", data[1]);
      console.log("Comments:", data[2]);
      console.log("Attendance:", data[3]);
      console.log("Subjects:", data[4]);
      console.log("Quarter Feedback:", data[5]);
      console.log("Progress Cards:", data[6]);
      console.log("Quarters:", data[7]);
      console.log("Subject Overall Progress:", data[8]);
      console.log("Overall Progress:", data[9]);

      // Process visual feedback
      if (data[0].status === 'success') {
        setVisualFeedback(data[0].feedback);
        const feedbackMap = {};
        data[0].feedback.forEach(feedback => {
          feedbackMap[feedback.visual_feedback_id] = feedback.visual_feedback_description;
        });
        setVisualFeedbackMap(feedbackMap);
      }

      // Process other data...
      if (data[1].status === 'success') setRiskLevels(data[1].risk_levels || []);
      if (data[2].status === 'success') setComments(data[2].comments || []);
      if (data[3].status === 'success') setAttendanceData(data[3].attendance || []);
      if (data[4].status === 'success' && Array.isArray(data[4].subjects)) {
        const subjectNames = data[4].subjects.map(subject => subject.subject_name);
        setSubjects(subjectNames);
        console.log("Set subjects:", subjectNames);
      }
      if (data[5].status === 'success') {
        setQuarterFeedback(data[5].feedback || []);
        console.log("Set quarter feedback:", data[5].feedback || []);
      }
      if (data[6].status === 'success' && Array.isArray(data[6].cards)) {
        setProgressCards(data[6].cards);
        setQuartersData(data[6].cards);
        setQuarterlyPerformance(data[6].cards);
        console.log("Set progress cards:", data[6].cards);
        console.log("Set quarterly performance:", data[6].cards);
      }
      if (Array.isArray(data[7])) setQuartersData(data[7]);
      if (data[8].status === 'success') setFinalSubjectProgress(data[8].progress || []);
      if (data[9].status === 'success' && data[9].progress) {
        setOverallProgress(data[9].progress);
      }

      console.log("=== Final State Values ===");
      console.log("Subjects:", subjects);
      console.log("Quarter Feedback:", quarterFeedback);
      console.log("Progress Cards:", progressCards);
      console.log("Quarterly Performance:", quarterlyPerformance);
      console.log("=== END DEBUG ===");

    } catch (error) {
      console.error("Error loading assessment data:", error);
      toast.error("Failed to load assessment data");
    } finally {
      setAssessmentLoading(false);
    }
  };

  // Load status data for selected student
  const loadStatusData = async (studentId, studentData = null) => {
    setStatusLoading(true);
    try {
      // Use the passed studentData if available, otherwise fall back to selectedStudent state
      const currentStudentData = studentData || selectedStudent;
      const advisoryId = currentStudentData?.levelId;
      
      if (!advisoryId) {
        console.warn("No advisory ID found for student");
        setStatusLoading(false);
        return;
      }

      const promises = [
        fetch(`/php/Assessment/get_subject_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`),
        fetch(`/php/Assessment/get_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`),
        fetch("/php/Assessment/get_visual_feedback.php"),
        fetch(`/php/Assessment/get_student_progress_cards.php?student_id=${studentId}&advisory_id=${advisoryId}`),
        fetch(`/php/Assessment/get_milestone_interpretation.php?student_id=${studentId}`)
      ];

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(res => res.json()));

      console.log('=== Status Data API Responses ===');
      console.log('Subject Overall Progress:', data[0]);
      console.log('Overall Progress:', data[1]);
      console.log('Visual Feedback:', data[2]);
      console.log('Progress Cards:', data[3]);
      console.log('Milestone Interpretation:', data[4]);

      if (data[0].status === 'success') setFinalSubjectProgress(data[0].progress || []);
      if (data[1].status === 'success' && data[1].progress) {
        console.log('Setting overallProgress:', data[1].progress);
        setOverallProgress(data[1].progress);
        if (data[1].progress.risk_id) {
          setOverallRisk({ risk: data[1].progress.risk_id });
        }
      }
      if (data[2].status === 'success' && Array.isArray(data[2].feedback)) {
        const map = {};
        data[2].feedback.forEach(fb => {
          map[fb.visual_feedback_id] = fb.visual_feedback_description;
        });
        setVisualFeedbackMap(map);
      }
      if (data[3].status === 'success' && Array.isArray(data[3].cards)) {
        console.log('Setting quarterlyPerformance:', data[3].cards);
        setQuarterlyPerformance(data[3].cards);
      }
      if (data[4].status === 'success' && data[4].milestone) {
        const milestoneData = data[4].milestone;
        if (milestoneData.summary) setMilestoneSummary(milestoneData.summary);
        if (milestoneData.overall_summary) setMilestoneOverallSummary(milestoneData.overall_summary);
        if (milestoneData.recorded_at) setMilestoneRecordedAt(milestoneData.recorded_at);
        if (milestoneData.milestone_id) setMilestoneId(milestoneData.milestone_id);
      }

      console.log('=== Final State Values ===');
      console.log('Final Subject Progress:', finalSubjectProgress);
      console.log('Overall Progress:', overallProgress);
      console.log('Quarterly Performance:', quarterlyPerformance);
      console.log('Milestone Summary:', milestoneSummary);
      console.log('Milestone Overall Summary:', milestoneOverallSummary);

    } catch (error) {
      console.error("Error loading status data:", error);
      toast.error("Failed to load status data");
    } finally {
      setStatusLoading(false);
    }
  };

  // Helper functions
  function formatDateOfBirth(dateStr) {
    if (!dateStr) return <span className="italic text-gray-400">-</span>;
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to format names as "Lastname, Firstname Middlename"
  function formatName(fullName) {
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

  function getStudentAddressString() {
    const candidates = [
      selectedStudent?.address,
      selectedStudent?.stud_address,
      parentProfile?.address,
      parentProfile?.home_address,
      parentProfile?.residential_address
    ];
    const found = candidates.find(v => v && String(v).trim());
    return found ? String(found).trim() : '';
  }

  function buildParentName(profile, prefix) {
    if (!profile) return '';
    const direct = profile[`${prefix}_name`] || profile[`${prefix}Name`];
    const first = profile[`${prefix}_firstname`] || profile[`${prefix}_first_name`] || profile[`${prefix}_first`] || profile[`${prefix}_fname`] || profile[`${prefix}FirstName`];
    const middle = profile[`${prefix}_middlename`] || profile[`${prefix}_middle_name`] || profile[`${prefix}_mname`] || profile[`${prefix}MiddleName`];
    const last = profile[`${prefix}_lastname`] || profile[`${prefix}_last_name`] || profile[`${prefix}_lname`] || profile[`${prefix}LastName`];
    if (direct && String(direct).trim()) return String(direct).trim();
    const parts = [first, middle, last].filter(Boolean).map(v => String(v).trim());
    return parts.join(' ');
  }

  function getParentAge(profile, prefix) {
    if (!profile) return '';
    const age = profile[`${prefix}_age`] || profile[`${prefix}Age`];
    if (age) return String(age);
    const bday = profile[`${prefix}_birthdate`] || profile[`${prefix}_dob`] || profile[`${prefix}Birthdate`];
    const computed = computeAge(bday);
    return Number.isFinite(computed) ? String(computed) : '';
  }

  function getParentOccupation(profile, prefix) {
    if (!profile) return '';
    return (
      profile[`${prefix}_occupation`] ||
      profile[`${prefix}Occupation`] ||
      ''
    );
  }

  const getDisplayName = (key) => {
    if (key === "Socio") return "Socio Emotional";
    if (key === "Literacy") return "Literacy/English";
    if (key === "Math") return "Mathematical Skills";
    if (key === "Physical Activities") return "Physical Activities";
    return key;
  };

  // Helper to determine risk status color and text from risk_id
  const getRiskInfo = (riskId) => {
    if (!riskId) return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
    if (riskId === 1 || riskId === '1') return { text: 'Low', color: 'bg-green-500', textColor: 'text-green-700' };
    if (riskId === 2 || riskId === '2') return { text: 'Moderate', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    if (riskId === 3 || riskId === '3') return { text: 'High', color: 'bg-red-500', textColor: 'text-red-700' };
    return { text: 'No Data', color: 'bg-gray-400', textColor: 'text-gray-600' };
  };

  // Helper to check if student has overall progress
  function hasOverallProgress() {
    // Don't check progress while data is still loading
    if (assessmentLoading || statusLoading) {
      console.log('⏳ Data still loading, returning false for hasOverallProgress');
      return false;
    }
    
    console.log('hasOverallProgress check:', {
      overallProgress,
      milestoneSummary,
      milestoneOverallSummary,
      finalSubjectProgress: finalSubjectProgress.length
    });
    
    // Check if there's overall progress data from the database
    if (overallProgress && Object.keys(overallProgress).length > 0) {
      console.log('✅ Has overall progress data:', overallProgress);
      return true;
    }
    
    // Fallback: also check if there's milestone interpretation data
    if (milestoneSummary || milestoneOverallSummary) {
      console.log('✅ Has milestone data:', { milestoneSummary, milestoneOverallSummary });
      return true;
    }
    
    // Fallback: check if there's final subject progress data
    if (finalSubjectProgress && finalSubjectProgress.length > 0) {
      console.log('✅ Has final subject progress data:', finalSubjectProgress.length, 'subjects');
      return true;
    }
    
    console.log('❌ No overall progress or milestone data');
    return false;
  }

  // Helper to check if student has any progress at all
  function hasAnyProgress() {
    // Don't check progress while data is still loading
    if (assessmentLoading || statusLoading) {
      console.log('⏳ Data still loading, returning false for hasAnyProgress');
      return false;
    }
    
    console.log('hasAnyProgress check:', {
      quarterlyPerformance,
      quarterlyPerformanceLength: quarterlyPerformance?.length,
      quartersWithData: quarterlyPerformance?.filter(card => 
        card.quarter_visual_feedback_id && card.quarter_visual_feedback_id > 0
      ).length
    });
    
    if (!quarterlyPerformance || quarterlyPerformance.length === 0) {
      console.log('❌ No quarterly performance data');
      return false;
    }
    
    // Check if there's at least 1 quarter with meaningful data
    const quartersWithData = quarterlyPerformance.filter(card => {
      // Check if the card has a valid visual feedback ID
      const hasVisualFeedback = card.quarter_visual_feedback_id && card.quarter_visual_feedback_id > 0;
      
      // Also check if there are actual subject scores or meaningful data
      const hasSubjectData = card.subjects && Array.isArray(card.subjects) && card.subjects.length > 0;
      
      console.log('Card analysis:', {
        cardId: card.id,
        quarterId: card.quarter_id,
        hasVisualFeedback,
        hasSubjectData,
        subjects: card.subjects
      });
      
      return hasVisualFeedback && hasSubjectData;
    });
    
    console.log('Quarters with meaningful data:', quartersWithData);
    const hasData = quartersWithData.length >= 1;
    console.log(`✅ hasAnyProgress result: ${hasData} (${quartersWithData.length} quarters with meaningful data)`);
    
    return hasData;
  }

  // Tooltip functions
  const handleStatusMouseEnter = (event) => {
    console.log('=== Status Tab Hover Debug ===');
    console.log('Mouse entered Status tab wrapper');
    console.log('hasOverallProgress():', hasOverallProgress());
    console.log('hasAnyProgress():', hasAnyProgress());
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowStatusTooltip(true);
    console.log('Tooltip should now be visible');
  };

  const handleStatusMouseLeave = () => {
    console.log('=== Status Tab Hover Debug ===');
    console.log('Mouse left Status tab wrapper');
    setShowStatusTooltip(false);
  };

  // Download PDF: Generate and download PDF with report card layout
  const handleExportAssessment = async () => {
    try {
      // Show loading toast
      toast.info("Generating PDF...", { autoClose: 5000 });

      // Create PDF directly using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      let currentY = 20;

      // Set UTF-8 encoding to support Unicode symbols
      pdf.setLanguage("en-US");
      pdf.setProperties({
        title: 'Student Assessment Report',
        creator: 'Learners Ville',
        producer: 'jsPDF'
      });

      // Try to load ONE simple Unicode font (place DejaVuSans.ttf at /public/fonts)
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
          // If font missing or fails, vector shapes will be used as fallback
          canRenderSymbols = false;
        }
      };
      await ensureUnicodeFont();

      // Preload emoji-style icons for better visual parity with web UI
      const emojiIcons = { heart: null };
      const preloadIcons = async () => {
        // Heart icon
        const heartCandidates = [
          '/assets/pdf/heart.png', // project-local override if available
          'https://twemoji.maxcdn.com/v/latest/72x72/2764.png' // Twemoji fallback
        ];
        for (const url of heartCandidates) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const blob = await res.blob();
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            emojiIcons.heart = dataUrl;
            break;
          } catch (e) {
            // try next source
          }
        }
      };
      await preloadIcons();

      // Helper: convert any stored/encoded shape into its real Unicode symbol
      const toUnicodeShape = (raw, id = null, description = null) => {
        // Do not hardcode shapes based on IDs or descriptions; use whatever is stored
        const s = (raw ?? '').toString().trim();
        if (!s) return '';

        // Already a real shape
        if (['♥','❤','❤️','★','⭐','◆','🔷','▲','⬤','●','■','⬢'].includes(s)) {
          // Normalize variants
          if (s === '●') return '⬤';
          if (s === '❤️' || s === '♥') return '❤';
          if (s === '⭐') return '★';
          if (s === '🔷') return '◆';
          return s;
        }

        // Common encodings seen from DB exports
        const map = {
          // Hearts
          '&': '❤', '%Ï': '❤', '%Ã\u0017' : '❤', '%C1%8F': '❤',
          // Stars
          '&e': '★', '&E': '★',
          // Diamonds
          '%Æ': '◆', '%Ã†': '◆', '%Â†': '◆', '&c': '◆',
          // Triangles
          '%²': '▲', '%2': '▲', '%?': '▲', '%C2%B2': '▲', '&t': '▲',
          // Circles
          '%I': '⬤', '%1': '⬤', '%l': '⬤', '+$': '⬤', '+S': '⬤', '+s': '⬤', '+5': '⬤', '&o': '⬤',
          // Squares (observed variants)
          '%25': '■', '%5B%5D': '■', '[]': '■', '%': '■',
          // Hexagon (observed plus-prefixed variants)
          '+^': '⬢', '+"': '⬢'
        };
        if (map[s]) return map[s];

        // Heuristic fallbacks
        if (s.includes('%')) return '■';
        if (s.includes('+')) return '⬢';

        return s; // Return as-is; renderSymbol will still try to draw it
      };

      // PDF color map (RGB) aligned with UI shapeColorMap
      const pdfShapeColorMap = {
        // Colors matching the UI shapeColorMap
        '❤️': [244, 67, 54],       // Red heart for Excellent
        '❤': [244, 67, 54],        // Red heart for Excellent (variant)
        '♥': [244, 67, 54],         // Red heart for Excellent (variant)
        '■': [0, 188, 212],         // Turquoise square for Excellent
        '⭐': [255, 152, 0],        // Orange star for Very Good
        '★': [255, 152, 0],         // Orange star for Very Good (variant)
        '⬢': [205, 220, 57],       // Lime green hexagon for Very Good
        '🔷': [33, 150, 243],      // Blue diamond for Good
        '◆': [33, 150, 243],        // Blue diamond for Good (variant)
        '▲': [76, 175, 80],         // Green triangle for Need Help
        '🟡': [255, 235, 59],      // Yellow circle for Not Met
        '●': [255, 235, 59],        // Yellow circle for Not Met (variant)
        '⬤': [255, 235, 59],       // Yellow circle for Not Met (variant)
      };

      // Helper function to render symbols properly (uses Unicode font if available; vector fallback otherwise)
      const renderSymbol = (symbol, x, y, fontSize = 12, options = {}) => {
        if (!symbol) return;

        const finalSymbol = toUnicodeShape(symbol, options?.id, options?.description);
        const rgb = pdfShapeColorMap[finalSymbol] || [0, 0, 0];

        if (canRenderSymbols && finalSymbol !== '❤' && finalSymbol !== '⬢' && finalSymbol !== '⬤') {
          pdf.setFont('DejaVuSans', 'normal');
          pdf.setFontSize(fontSize);
          pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
          pdf.text(finalSymbol, x, y, { align: 'center' });
          return;
        }

        // Vector fallbacks for when Unicode font is unavailable
        const size = fontSize * 0.8; // visual tuning
        const r = size / 3.2;
        const cx = x;
        const cy = y - size / 4.5;
        pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
        pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        pdf.setLineWidth(0.6);
        switch (finalSymbol) {
          case '⬤': // circle
            pdf.circle(cx, cy, r * 1.25, 'F');
            break;
          case '▲': { // triangle up
            const h = r * 2.1;
            pdf.triangle(cx, cy - h / 1.3, cx - r * 1.2, cy + h / 2.2, cx + r * 1.2, cy + h / 2.2, 'F');
            break;
          }
          case '❤': { 
            // Adjusted geometry for smoother, fuller heart
            const cyh = cy - r * 0.05;   // slight vertical lift
            const lobeRadius = r * 0.75; // smaller lobes for better proportion
            const lobeOffsetX = r * 0.55; // bring lobes closer together
            const lobeOffsetY = r * 0.25; // vertical position of lobes
        
            // Left lobe
            pdf.circle(cx - lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
            // Right lobe
            pdf.circle(cx + lobeOffsetX, cyh - lobeOffsetY, lobeRadius, 'F');
        
           // Bottom point (wider base, softer point)
           const baseY = cyh + r * 0.2;
           const baseHalfWidth = lobeRadius * 1.2;
           const pointDepth = r * 1.2; // not too deep
           pdf.triangle(
               cx - baseHalfWidth, baseY,
               cx + baseHalfWidth, baseY,
               cx, cyh + pointDepth,
               'F'
           );
           break;
          }
          case '◆': { // diamond as two triangles
            const w = r * 1.6;
            const h = r * 1.6;
            // Top triangle
            pdf.triangle(cx, cy - h, cx - w, cy, cx + w, cy, 'F');
            // Bottom triangle
            pdf.triangle(cx, cy + h, cx - w, cy, cx + w, cy, 'F');
            break;
          }
          case '★': { // star (simple 5-point)
            const points = 5;
            const outer = r * 1.4;
            const inner = outer * 0.5;
            const coords = [];
            for (let i = 0; i < points * 2; i++) {
              const radius = i % 2 === 0 ? outer : inner;
              const angle = (Math.PI / points) * i - Math.PI / 2;
              coords.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
            }
            // Close path
            coords.push(coords[0]);
            for (let i = 1; i < coords.length; i++) {
              pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
              pdf.line(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
            }
            pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
            // Simple fill by drawing small triangles to center
            for (let i = 0; i < coords.length - 1; i++) {
              pdf.triangle(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1], cx, cy, 'F');
            }
            break;
          }
          case '■': { // square
            const side = r * 2.2;
            pdf.rect(cx - side / 2, cy - side / 2, side, side, 'F');
            break;
          }
          case '⬢': { // hexagon solid fill
            const radius = r * 1.6;
            const pts = [];
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i - Math.PI / 2;
              pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
            }
            pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
            for (let i = 0; i < 6; i++) {
              const j = (i + 1) % 6;
              pdf.triangle(cx, cy, pts[i][0], pts[i][1], pts[j][0], pts[j][1], 'F');
            }
            break;
          }
          default: // last resort, draw text with base font
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
            pdf.text(finalSymbol, x, y, { align: 'center' });
        }
      };

      // Helper function to add text with word wrap
      const addText = (text, x, y, maxWidth = pageWidth - 40) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 5);
      };

      // Helper function to add a new page with colored background
      const addNewPage = (bgColor) => {
        pdf.addPage();
        // Fill entire page with background color
        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = 20;
      };

      // Helper function to add header with logo
      const addHeader = async (title) => {
        if (currentY > 250) addNewPage('#eef5ff');
        
        // Logo positioning - left side with proper alignment
        const logoX = 20;
        const logoY = currentY + 15;
        const logoSize = 30;
        const logoRadius = 15;
        
        try {
          // Try to load and add the school logo
          const logoResponse = await fetch('/assets/image/villelogo.png');
          if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(logoBlob);
            });
            
            // Draw circular background for logo
            pdf.setFillColor(255, 255, 255);
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F');
            pdf.setDrawColor(200, 200, 200);
            pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S');
            
            // Add logo centered in the circle
            pdf.addImage(logoDataUrl, 'PNG', logoX + 2, logoY - logoRadius + 2, logoSize - 4, logoSize - 4);
          }
        } catch (error) {
          console.log('Could not load logo, using text fallback');
          // Draw empty circle if logo fails to load
          pdf.setFillColor(255, 255, 255);
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'F');
          pdf.setDrawColor(200, 200, 200);
          pdf.circle(logoX + logoRadius, logoY, logoRadius, 'S');
        }
        
        // School name - centered on page, aligned with logo center
        pdf.setTextColor(35, 44, 103);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LEARNERS\' VILLE', pageWidth / 2, logoY + 2, { align: 'center' });
        
        // Address - centered below school name
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines', pageWidth / 2, logoY + 10, { align: 'center' });
        
        // School Year - right side
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`SY ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, pageWidth - 20, logoY + 2, { align: 'right' });
        
        // Separator line
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.5);
        pdf.line(10, logoY + 20, pageWidth - 10, logoY + 20);
        
        currentY = logoY + 30;
      };

      // Helper function to start a white box
      const startWhiteBox = (boxHeight = 60) => {
        const footerTopY = pageHeight - 30;
        if ((currentY - 5) + boxHeight > footerTopY) {
          addNewPage('#eef5ff');
        }
        const boxStartY = currentY - 5;
        const boxEndY = boxStartY + boxHeight;
        
        // Draw white background box
        pdf.setFillColor(255, 255, 255);
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'F');
        
        // Draw border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(8, boxStartY, pageWidth - 16, boxHeight, 'S');
        
        return { boxStartY, boxEndY };
      };

      // Helper function to end a white box
      const endWhiteBox = (boxEndY) => {
        currentY = boxEndY + 8;
      };

      // Set first page background color
      pdf.setFillColor(238, 245, 255); // Light blue
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Page 1: School & Learner Info (refined UI for readability)
      await addHeader('Learner\'s Information');
      
      // Learner's Information Card
      const learnerBox = startWhiteBox(80);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Learner\'s Information', 15, learnerBox.boxStartY + 15);
      
      // Student details
      const studentName = selectedStudent ? 
        `${selectedStudent.lastName || selectedStudent.stud_lastname || ''}, ${selectedStudent.firstName || selectedStudent.stud_firstname || ''} ${selectedStudent.middleName || selectedStudent.stud_middlename || ''}`.trim() : 
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
      pdf.text(selectedStudent?.levelName || '________________________', leftX + 15, startY + lineHeight);
      
      // Lead Teacher (Left Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Lead Teacher:', leftX, startY + (lineHeight * 2));
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedStudent?.lead_teacher_name ? formatName(selectedStudent.lead_teacher_name) : '________________________', leftX + 30, startY + (lineHeight * 2));
      
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
      pdf.text(formatDateOfBirth(selectedStudent?.stud_birthdate) || '________________________', rightX + 28, startY + lineHeight);
      
      // Assistant Teacher (Right Column)
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Assistant Teacher:', rightX, startY + (lineHeight * 2));
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedStudent?.assistant_teacher_name ? formatName(selectedStudent.assistant_teacher_name) : '________________________', rightX + 40, startY + (lineHeight * 2));
      
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
      // No header for this page - just content
      
      // Start content higher since no header
      currentY = 20;
      const attendanceBox = startWhiteBox(120);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Record of Attendance', 15, attendanceBox.boxStartY + 15);
      
      // Create attendance table with actual data
      const attendanceSummary = getAttendanceSummary();
      let attendanceData;
      
      if (attendanceSummary && attendanceSummary.summary && Array.isArray(attendanceSummary.summary)) {
        // Use actual data - getAttendanceSummary() returns { summary: [...], totalSchoolDays, totalPresent, totalAbsent }
        const summary = attendanceSummary.summary;
        attendanceData = [
          ['Category', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Total'],
          ['No. of\nSchool Days', ...summary.map(m => m.total.toString()), attendanceSummary.totalSchoolDays.toString()],
          ['No. of Days\nPresent', ...summary.map(m => m.present.toString()), attendanceSummary.totalPresent.toString()],
          ['No. of Days\nAbsent', ...summary.map(m => m.absent.toString()), attendanceSummary.totalAbsent.toString()]
        ];
      } else {
        // Fallback data if no actual data available
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
      const categoryWidth = tableWidth * 0.30; // 30% for category
      const monthWidth = tableWidth * 0.07; // 7% for each month/total
      const rowHeight = 14; // Increased to accommodate multi-line text
      
      // Header row
      pdf.setFillColor(235, 246, 249); 
      pdf.rect(15, tableStartY, tableWidth, rowHeight, 'F');
      pdf.setTextColor(0, 0, 0); // Dark black text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      // Calculate column positions
      const colPositions = [15]; // Start position
      colPositions.push(colPositions[0] + categoryWidth); // Category end
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
          
          // Center align numbers, left align text
          if (colIndex === 0) {
            // Handle multi-line category names
            const lines = cell.split('\n');
            lines.forEach((line, lineIndex) => {
              pdf.text(line, x + 2, y + 6 + (lineIndex * 4)); // Left align category names with line spacing
            });
          } else {
            pdf.text(cell, x + (width / 2), y + 6, { align: 'center' }); // Center align numbers
          }
        });
      }
      
      // Draw grid lines
      pdf.setDrawColor(0, 0, 0); // Black lines
      pdf.setLineWidth(0.5);
      
      // Draw horizontal lines
      for (let row = 0; row <= attendanceData.length; row++) {
        const y = tableStartY + (row * rowHeight);
        pdf.line(15, y, 15 + tableWidth, y);
      }
      
      // Draw vertical lines
      for (let col = 0; col <= attendanceData[0].length; col++) {
        const x = colPositions[col];
        pdf.line(x, tableStartY, x, tableStartY + (attendanceData.length * rowHeight));
      }
      
      endWhiteBox(attendanceBox.boxEndY);

      // Parent/Guardian Signatures section - fill the white box properly
      const signatureBox = startWhiteBox(120); // Increased height to fill properly
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Parent/Guardian Signatures', 15, signatureBox.boxStartY + 15);
      
      // Quarters with proper layout using same quarters array as web page
      const quarterNames = quarters.filter(q => q.id <= 4).map(q => q.name);
      const availableHeight = signatureBox.boxEndY - (signatureBox.boxStartY + 40); // Available space
      const quarterSpacing = availableHeight / 4; // Equal spacing for 4 quarters
      
      quarterNames.forEach((quarter, index) => {
        const startY = signatureBox.boxStartY + 35 + (index * quarterSpacing);
        
        // Quarter label and signature line on same line
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(quarter, 15, startY);
        
        // Get actual teacher comment for this quarter
        const actualComment = getQuarterCommentText(index + 1); // Quarter IDs are 1-4
        
        // Signature line starting after quarter label
        const quarterWidth = pdf.getTextWidth(quarter);
        const underlineStartX = 15 + quarterWidth + 5; // 5px gap after quarter
        const underlineEndX = underlineStartX + 100; // Medium-width underline
        
        pdf.setDrawColor(0, 0, 0); // Black line
        pdf.setLineWidth(0.5);
        pdf.line(underlineStartX, startY + 2, underlineEndX, startY + 2);
        
        // Signature label at the end of the line
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('(Parent/Guardian Signature)', underlineEndX + 5, startY + 2);
        
        // Teacher Comment section below quarter/signature line
        const commentY = startY + 10; // Space between signature line and comment
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Teacher Comment:', 15, commentY);
        
        // Comment text
        if (actualComment && actualComment.trim()) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(actualComment, 60, commentY); // On the line
        } else {
          // Draw underline for empty comment - shorter line
          pdf.setDrawColor(200, 200, 200); // Light gray line
          pdf.setLineWidth(0.5);
          pdf.line(60, commentY + 2, 120, commentY + 2); // Shorter line
        }
      });
      
      endWhiteBox(signatureBox.boxEndY);

      // Page 3: Quarterly Assessment - No header
      addNewPage('#fff7e6'); // Light yellow
      // No header for this page - just content
      
      // Start content higher since no header
      currentY = 20;
      
      // Quarterly Assessment Box - Full width
      const assessmentBox = startWhiteBox(140); // Further increased height to accommodate all rows including Quarter Result
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quarterly Assessment', 15, assessmentBox.boxStartY + 15);
      
      // Get actual assessment data from backend - use same quarters array as web page
      const pdfSubjects = Array.isArray(subjects) ? [...subjects].sort((a,b)=>a.localeCompare(b)) : [];
      const assessmentQuarters = quarters.map(q => q.name); // Use same quarters array as web page
      
      
      // If no data from backend, don't generate PDF
      if (pdfSubjects.length === 0 || assessmentQuarters.length === 0) {
        console.error('No subjects or quarters data available from backend');
        toast.error('Assessment data not available. Please try again later.');
        return;
      }
      
      
      // Determine which quarters are finalized (have a progress card with visual feedback)
      const finalizedQuarterSet = new Set(
        (Array.isArray(progressCards) ? progressCards : [])
          .filter(pc => pc && Number(pc.quarter_id) > 0 && pc.quarter_visual_feedback_id)
          .map(pc => Number(pc.quarter_id))
      );
      
      const assessmentTableStartY = assessmentBox.boxStartY + 30; // Better spacing from title
      
      // Column widths: 35% subjects, 13% for each quarter (5 quarters = 65%) - match reference proportions
      const subjectsColWidth = (pageWidth - 30) * 0.35; // 35% for subjects
      const quarterColWidth = (pageWidth - 30) * 0.13; // 13% for each quarter
      const assessmentRowHeight = 12; // Row height for better readability
      
      // Header row with grid lines
      const headers = ['Subjects', ...assessmentQuarters];
      headers.forEach((header, colIndex) => {
        let x, colWidth;
        if (colIndex === 0) {
          // Subjects column - 35%
          x = 15;
          colWidth = subjectsColWidth;
        } else {
          // Quarter columns - 13% each
          x = 15 + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
          colWidth = quarterColWidth;
        }
        
        // Fill background first
        pdf.setFillColor(235, 246, 249); // Light blue header background
        pdf.rect(x, assessmentTableStartY, colWidth, assessmentRowHeight, 'F');
        
        // Then draw border
        pdf.setDrawColor(0, 0, 0); // Black border
        pdf.rect(x, assessmentTableStartY, colWidth, assessmentRowHeight, 'S');
        
        // Add text with proper color
        pdf.setTextColor(0, 0, 0); // Dark black text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        // Safety check for header text
        const headerText = header && typeof header === 'string' ? header : `Column ${colIndex + 1}`;
        pdf.text(headerText, x + (colWidth / 2), assessmentTableStartY + 8, { align: 'center' });
      });
      
      // Subject rows with actual data and grid lines
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      pdfSubjects.forEach((subject, rowIndex) => {
        const y = assessmentTableStartY + ((rowIndex + 1) * assessmentRowHeight);
        
        // Draw grid lines for each row
        headers.forEach((header, colIndex) => {
          let x, colWidth;
          if (colIndex === 0) {
            x = 15;
            colWidth = subjectsColWidth;
          } else {
            x = 15 + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
            colWidth = quarterColWidth;
          }
          
          pdf.setFillColor(255, 255, 255); // White background
          pdf.rect(x, y, colWidth, assessmentRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0); // Black border
          pdf.rect(x, y, colWidth, assessmentRowHeight, 'S');
        });
        
        // Subject name - left aligned
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(subject, 15 + 2, y + 8);
        
        // Add actual assessment symbols based on real data or fallback demo data
        assessmentQuarters.forEach((quarter, colIndex) => {
          const x = 15 + subjectsColWidth + (colIndex * quarterColWidth);
          
          // Only show for quarters 1-4 when the quarter is finalized (consistent with web)
          if (colIndex < 4 && !finalizedQuarterSet.has(colIndex + 1)) {
            return; // leave blank until quarter has a progress card
          }
          
          // Handle Final column using finalSubjectProgress per subject (same logic as web page)
          if (colIndex === 4) { // Final column is at index 4 (quarters[4] = { id: 5, name: 'Final' })
            // Final column per subject: show if finalSubjectProgress provides a visual feedback
            const subjProgress = Array.isArray(finalSubjectProgress)
              ? finalSubjectProgress.find(row => row && row.subject_name === subject)
              : null;
            
            let finalShape = '';
            if (subjProgress && subjProgress.finalsubj_visual_feedback_id) {
              const vf = Array.isArray(visualFeedback)
                ? visualFeedback.find(v => v.visual_feedback_id == subjProgress.finalsubj_visual_feedback_id)
                : null;
              finalShape = vf?.visual_feedback_shape || '';
            }
            // Fallback: use Quarter 4 subject feedback shape if final is missing
            if (!finalShape) {
              const fbQ4 = Array.isArray(quarterFeedback)
                ? quarterFeedback.find(f => f.subject_name === subject && Number(f.quarter_id) === 4)
                : null;
              finalShape = fbQ4?.shape || '';
            }
            
            if (finalShape) {
              renderSymbol(finalShape, x + (quarterColWidth/2), y + 8, 12);
            }
            return; // final column done
          }
          
          // Get actual assessment symbol for this subject and quarter
          let symbol = getAssessmentSymbol(subject, colIndex + 1, progressCards);
          
          // If no real data, try to get actual visual feedback symbols from quarter feedback
          if (!symbol) {
            // Look for individual subject feedback for this quarter
            const subjectFeedback = quarterFeedback.find(fb => 
              fb.subject_name === subject && Number(fb.quarter_id) === colIndex + 1
            );
            
            if (subjectFeedback && subjectFeedback.shape) {
              symbol = toUnicodeShape(subjectFeedback.shape);
            }
            
            // If still no symbol and quarter is finalized, use quarter-level visual feedback
            if (!symbol && colIndex < 4) {
              const card = progressCards.find(pc => Number(pc.quarter_id) === colIndex + 1);
              if (card && card.quarter_visual_feedback_id) {
                const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                if (vf && vf.visual_feedback_shape) {
                  symbol = toUnicodeShape(vf.visual_feedback_shape);
                }
              }
            }
            
            // Leave symbol empty (blank) if no data found
          }
          
          if (symbol) {
            renderSymbol(symbol, x + (quarterColWidth/2), y + 8, 12);
          }
        });
      });
      
      // Add Quarter Result row separately
      const quarterResultY = assessmentTableStartY + ((subjects.length + 1) * assessmentRowHeight);
      
      // Draw grid lines for Quarter Result row
      headers.forEach((header, colIndex) => {
        let x, colWidth;
        if (colIndex === 0) {
          x = 15;
          colWidth = subjectsColWidth;
        } else {
          x = 15 + subjectsColWidth + ((colIndex - 1) * quarterColWidth);
          colWidth = quarterColWidth;
        }
        
        pdf.setFillColor(255, 255, 255); // White background
        pdf.rect(x, quarterResultY, colWidth, assessmentRowHeight, 'F');
        pdf.setDrawColor(0, 0, 0); // Black border
        pdf.rect(x, quarterResultY, colWidth, assessmentRowHeight, 'S');
      });
      
      // Quarter Result row label (bold)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Quarter Result', 15 + 2, quarterResultY + 8);
      
      // Quarter Result row symbols with colored circles
      assessmentQuarters.forEach((quarter, colIndex) => {
        const x = 15 + subjectsColWidth + (colIndex * quarterColWidth);
        
        // Get actual quarter result data
        let symbol = '';
        let riskColor = [34, 197, 94]; // Default green
        
        if (colIndex < 4) { // Quarters 1-4
          const card = progressCards.find(pc => Number(pc.quarter_id) === colIndex + 1);
          if (card && card.quarter_visual_feedback_id) {
            const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
            if (vf && vf.visual_feedback_shape) {
              symbol = toUnicodeShape(vf.visual_feedback_shape);
            }
            
            // Get risk color based on risk level
            if (card.risk_id == 1) riskColor = [34, 197, 94];  // Green - Low
            else if (card.risk_id == 2) riskColor = [251, 191, 36]; // Yellow - Moderate
            else if (card.risk_id == 3) riskColor = [239, 68, 68];  // Red - High
          }
        } else { // Final column
          // Require: all quarters finalized AND overall progress has final visual shape
          const allQuartersFinalized = [1, 2, 3, 4].every(q => progressCards.some(pc => Number(pc.quarter_id) === q));
          const hasFinalOverall = !!(overallProgress && overallProgress.visual_shape);
          if (allQuartersFinalized && hasFinalOverall) {
            symbol = toUnicodeShape(overallProgress.visual_shape);
            // Overall risk color
            if (overallProgress.risk_id == 1) riskColor = [34, 197, 94];
            else if (overallProgress.risk_id == 2) riskColor = [251, 191, 36];
            else if (overallProgress.risk_id == 3) riskColor = [239, 68, 68];
          } else {
            symbol = '';
          }
        }
        
        // Only draw if there's actual data (symbol found)
        if (symbol) {
          // Draw colored circle first
          pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
          pdf.circle(x + (quarterColWidth/2) - 8, quarterResultY + 6, 2, 'F');
          
          // Then add the symbol using renderSymbol helper
          renderSymbol(symbol, x + (quarterColWidth/2), quarterResultY + 8, 12);
        }
        // If no symbol, leave the cell blank (no circle, no symbol)
      });
      
      // Update the assessment box end to include the Quarter Result row
      const updatedAssessmentBoxEndY = quarterResultY + assessmentRowHeight + 10; // Add padding
      
      endWhiteBox(updatedAssessmentBoxEndY);
      
      // Update currentY to the end of the assessment box with proper spacing
      currentY = updatedAssessmentBoxEndY + 10; // Add 10px spacing between sections

      // Legend and Risk Levels - Side by side
      const legendStartY = currentY;
      const marginX = 15; // match Quarterly Assessment left/right margin
      const gapX = 10; // small gap between the two boxes
      const boxWidth = (pageWidth - marginX * 2 - gapX) / 2; // symmetric margins
      const boxHeight = 100; // Height for both boxes
      
      // Assessment Legend Box - Left side
      const legendBoxStartY = legendStartY - 5;
      let legendBoxEndY; // will set after dynamic height is computed
      
      // Box width stored for later rect drawing
      const legendBoxWidth = boxWidth; // Use calculated box width
      pdf.setFillColor(255, 255, 255); // White
      pdf.rect(marginX, legendBoxStartY, legendBoxWidth, boxHeight, 'F');
      pdf.setDrawColor(200, 200, 200); // Light gray border
      pdf.rect(marginX, legendBoxStartY, legendBoxWidth, boxHeight, 'S');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Assessment Legend', 20, legendBoxStartY + 15);
      
      // Legend table structure with grid lines - match reference exactly
      // Column widths: 25% shapes, 50% description, 25% remarks - match reference
      const innerPadLeft = 3; // reduced, symmetric padding
      const innerPadRight = 3;
      const legendTableWidth = legendBoxWidth - (innerPadLeft + innerPadRight);
      const shapesColWidth = legendTableWidth * 0.25;
      const descriptionColWidth = legendTableWidth * 0.50;
      const remarksColWidth = legendTableWidth * 0.25;
      const legendTableStartY = legendBoxStartY + 25;
      const legendRowHeight = 12; // Row height for better readability
      
      // Legend headers with table structure - use Shapes to show real symbols
      const legendHeaders = ['Shapes', 'Descriptions', 'Remarks'];
      const legendColWidths = [shapesColWidth, descriptionColWidth, remarksColWidth];
      
      legendHeaders.forEach((header, index) => {
        let x = marginX + innerPadLeft; // symmetric left padding
        for (let i = 0; i < index; i++) {
          x += legendColWidths[i];
        }
        
        const colWidth = legendColWidths[index];
        
        // Fill background first
        pdf.setFillColor(235, 246, 249); // Light blue header background
        pdf.rect(x, legendTableStartY, colWidth, legendRowHeight, 'F');
        // Then draw border
        pdf.setDrawColor(0, 0, 0); // Black border
        pdf.rect(x, legendTableStartY, colWidth, legendRowHeight, 'S');
        // Add text
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Dark black text
        // Center align the header text
        pdf.text(header, x + (colWidth / 2), legendTableStartY + 8, { align: 'center' });
      });
      
      // Legend data with table structure and grid lines - use actual shapes
      const legendData = visualFeedback && Array.isArray(visualFeedback) ? 
        visualFeedback.map(feedback => {
          return [
            feedback.visual_feedback_shape || 'Unknown',
            feedback.visual_feedback_description || 'Unknown',
            feedback.visual_feedback_description === 'Not Met' ? 'Failed' : 'Passed'
          ];
        }) : [];
      
      legendData.forEach((row, index) => {
        const y = legendTableStartY + ((index + 1) * legendRowHeight);
        
        // Draw grid lines for each row
        legendHeaders.forEach((header, colIndex) => {
          let x = marginX + innerPadLeft; // symmetric left padding
          for (let i = 0; i < colIndex; i++) {
            x += legendColWidths[i];
          }
          
          const colWidth = legendColWidths[colIndex];
          pdf.setFillColor(255, 255, 255); // White background
          pdf.rect(x, y, colWidth, legendRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0); // Black border
          pdf.rect(x, y, colWidth, legendRowHeight, 'S');
        });
        
        // Add content to cells with proper alignment
        pdf.setFontSize(10); // Consistent font size
        
        // Shapes column (25%) - draw using renderSymbol (true shapes when font available)
        let x = marginX + innerPadLeft; // symmetric left padding
        pdf.setFont('helvetica', 'bold');
        renderSymbol(row[0], x + (shapesColWidth / 2), y + 8, 10);
        
        // Description column (50%)
        x += shapesColWidth;
        pdf.setFont('helvetica', 'normal');
        pdf.text(row[1], x + (descriptionColWidth / 2), y + 8, { align: 'center' });
        
        // Remarks column (25%)
        x += descriptionColWidth;
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[2], x + (remarksColWidth / 2), y + 8, { align: 'center' });
      });
      
      // Legend table ends here - no allowance row needed

      // Risk Levels Box - Right side (same line as legend)
      const riskBoxStartY = legendStartY - 5;
      let riskBoxEndY; // will set after dynamic height is computed
      const riskBoxX = marginX + legendBoxWidth + gapX; // symmetric layout
      
      // Risk box width
      const riskBoxWidth = boxWidth; // Match legend box width
      pdf.setFillColor(255, 255, 255); // White
      pdf.rect(riskBoxX, riskBoxStartY, riskBoxWidth, boxHeight, 'F');
      pdf.setDrawColor(200, 200, 200); // Light gray border
      pdf.rect(riskBoxX, riskBoxStartY, riskBoxWidth, boxHeight, 'S');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Levels', riskBoxX + 5, riskBoxStartY + 15);
      
      // Risk levels table structure with grid lines - match reference exactly
      // Column widths: 40% level, 60% meaning - match reference
      const riskTableWidth = riskBoxWidth - 10; // Same margins as legend table (10px total: 5px left + 5px right)
      const levelColWidth = riskTableWidth * 0.40;
      const meaningColWidth = riskTableWidth * 0.60;
      const riskTableStartY = riskBoxStartY + 25;
      const riskRowHeight = 15; // Row height for better readability
      
      // Risk levels headers with table structure
      const riskHeaders = ['Level', 'Meaning'];
      const riskColWidths = [levelColWidth, meaningColWidth];
      
      riskHeaders.forEach((header, index) => {
        let x = riskBoxX + 5; // 5px left margin to match legend spacing
        for (let i = 0; i < index; i++) {
          x += riskColWidths[i];
        }
        
        const colWidth = riskColWidths[index];
        
        // Fill background first
        pdf.setFillColor(235, 246, 249); // Light blue header background
        pdf.rect(x, riskTableStartY, colWidth, riskRowHeight, 'F');
        // Then draw border
        pdf.setDrawColor(0, 0, 0); // Black border
        pdf.rect(x, riskTableStartY, colWidth, riskRowHeight, 'S');
        // Add text
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Dark black text
        // Center align the header text
        pdf.text(header, x + (colWidth / 2), riskTableStartY + 10, { align: 'center' });
      });
      
      // Get actual risk level for the student
      const studentRiskLevel = getStudentRiskLevel(progressCards);
      
      const riskData = [
        { color: [34, 197, 94], label: 'Low', description: 'Meeting Expectations' },
        { color: [251, 191, 36], label: 'Moderate', description: 'Needs Some Support' },
        { color: [239, 68, 68], label: 'High', description: 'Needs Close Attention' }
      ];
      
      riskData.forEach((risk, index) => {
        const y = riskTableStartY + ((index + 1) * riskRowHeight);
        
        // Draw grid lines for each row
        riskHeaders.forEach((header, colIndex) => {
          let x = riskBoxX + 5; // 5px left margin to match legend spacing
          for (let i = 0; i < colIndex; i++) {
            x += riskColWidths[i];
          }
          
          const colWidth = riskColWidths[colIndex];
          pdf.setFillColor(255, 255, 255); // White background
          pdf.rect(x, y, colWidth, riskRowHeight, 'F');
          pdf.setDrawColor(0, 0, 0); // Black border
          pdf.rect(x, y, colWidth, riskRowHeight, 'S');
        });
        
        // Level column (40%)
        let x = riskBoxX + 5; // 5px left margin to match legend spacing
        
        // Color circle - positioned properly with the text
        pdf.setFillColor(risk.color[0], risk.color[1], risk.color[2]);
        pdf.circle(x + 6, y + 8, 3.5, 'F'); // Larger circle to match shape sizes
        
        // Label and description with proper alignment
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10); // Consistent font size
        pdf.setFont('helvetica', 'bold');
        
        // Level text - positioned after the circle
        pdf.text(risk.label, x + 12, y + 10); // tighter spacing next to circle
        
        // Meaning column (60%)
        x += levelColWidth;
        pdf.setFont('helvetica', 'normal');
        // Meaning text - center aligned in second column
        pdf.text(risk.description, x + (meaningColWidth / 2), y + 10, { align: 'center' });
      });
      
      // Update currentY for next content - better spacing
      currentY = Math.max(legendBoxEndY, riskBoxEndY) + 15;

      // Only include Page 4 when overall progress exists
      const includeStatusPage = hasOverallProgress();
      if (includeStatusPage) {
        // Page 4: Quarterly Performance Trend (no header per requirement)
        addNewPage('#ffeef2'); // Light pink
        
        const trendBox = startWhiteBox(130); // increased to fully contain two-line x-axis labels and axis title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Quarterly Performance Trend', 15, trendBox.boxStartY + 15);
        
        // Simple line chart grid and labels (consistent left/right margins)
        const chartStartY = trendBox.boxStartY + 30;
        const chartHeight = 60;
        const marginXConsistent = 15; // same visual margin on both sides
        // Measure Y-label width to prevent overlap with the first point/line
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const perfLevels = visualFeedback && Array.isArray(visualFeedback) 
          ? visualFeedback.map(f => f.visual_feedback_description).reverse()
          : ['Not Met', 'Need Help', 'Good', 'Very Good', 'Excellent'];
        const yLabelMaxWidth = Math.max(...perfLevels.map(lbl => pdf.getTextWidth(lbl))) + 6; // padding
        const gridLeft = marginXConsistent + yLabelMaxWidth;
        const gridRight = pageWidth - marginXConsistent;
        const chartWidth = gridRight - gridLeft;
        // Draw grid first so labels stay on top
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        for (let i = 0; i <= 4; i++) {
          const y = chartStartY + (i * (chartHeight / 4));
          pdf.line(gridLeft, y, gridLeft + chartWidth, y);
        }
        // Y-axis labels (draw on top of grid, vertically centered on each grid line)
        perfLevels.forEach((level, index) => {
          const y = chartStartY + (index * (chartHeight / 4));
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(level, marginXConsistent, y + 2.5); // tiny offset so text clears the line
        });
        // X-axis labels (quarters) with two-line layout and smart alignment to avoid clipping
        const xLabelOrdinals = ['1st', '2nd', '3rd', '4th'];
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        xLabelOrdinals.forEach((ord, i) => {
          const x = gridLeft + (i * (chartWidth / 3));
          const bottomY = chartStartY + chartHeight + 8;
          const align = i === 0 ? 'left' : i === 3 ? 'right' : 'center';
          // First line: ordinal (e.g., 1st)
          pdf.text(ord, x, bottomY, { align });
          // Second line: the word "Quarter"
          pdf.text('Quarter', x, bottomY + 5, { align });
        });
        // Axis titles
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Performance Level', marginXConsistent, chartStartY - 6);
        pdf.text('Quarter', gridLeft + chartWidth / 2, chartStartY + chartHeight + 18, { align: 'center' });
        
        // Draw performance points/line using available quarter-level feedback
        const yMap = {};
        if (visualFeedback && Array.isArray(visualFeedback)) {
          visualFeedback.forEach((f, index) => {
            const description = f.visual_feedback_description;
            yMap[description] = visualFeedback.length - 1 - index; // Reverse order for chart
          });
        } else {
          yMap['Not Met'] = 0; yMap['Need Help'] = 1; yMap['Good'] = 2; yMap['Very Good'] = 3; yMap['Excellent'] = 4;
        }
        const xs = (idx) => gridLeft + (idx * (chartWidth / 3)); // 4 quarters => 3 segments
        const ys = (val) => chartStartY + (val * (chartHeight / 4));
        const dataPoints = [1,2,3,4].map((qid) => {
          const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
          const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
          return desc && yMap.hasOwnProperty(desc) ? yMap[desc] : null;
        });
        // line (ensure it stays inside grid bounds and does not touch labels)
        pdf.setDrawColor(96, 165, 250);
        pdf.setLineWidth(2);
        let prev = null;
        dataPoints.forEach((v, i) => {
          if (v === null) return;
          const x = xs(i);
          const y = ys(4 - v); // invert so 4 (Excellent) is at top grid line
          if (prev) {
            pdf.line(prev.x, prev.y, x, y);
          }
          prev = { x, y };
          pdf.setFillColor(96, 165, 250);
          pdf.circle(x, y, 2.5, 'F');
        });
        
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
        if (String(finalRiskId) === '1') {
          barColor = [34, 197, 94];
          riskLabel = 'Low';
          riskDesc = 'Student is performing well and meeting expectations.';
        } else if (String(finalRiskId) === '2') {
          barColor = [251, 191, 36];
          riskLabel = 'Moderate';
          riskDesc = 'Student may need additional support in some areas.';
        } else if (String(finalRiskId) === '3') {
          barColor = [239, 68, 68];
          riskLabel = 'High';
          riskDesc = 'Student requires immediate attention and intervention.';
        }
        const infoBoxHeight = 26;
        const infoBoxY = Math.min(afterSummaryY + 8, summaryBox.boxStartY + dynamicSummaryHeight - infoBoxHeight - 6);
        // Box background and border
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, infoBoxY, pageWidth - 30, infoBoxHeight, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(15, infoBoxY, pageWidth - 30, infoBoxHeight, 'S');
        // Inline: dot, label, then description on the same baseline
        const contentLeft = 15;
        const contentWidth = pageWidth - 30;
        const dotX = contentLeft + contentWidth * 0.10;
        const rowY = infoBoxY + 18;
        pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
        pdf.circle(dotX, rowY - 2, 3, 'F');
        // Label "Low/Moderate/High"
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const labelX = dotX + 8;
        pdf.text(riskLabel, labelX, rowY);
        // Description starts right after the label
        const labelWidth = pdf.getTextWidth(riskLabel);
        const descX = labelX + labelWidth + 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(riskDesc, descX, rowY);
        
        endWhiteBox(summaryBox.boxEndY);
        // Removed the separate Final Risk Status card and subtitle per request
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

      // Download the PDF
      const studentNameForFile = selectedStudent ? 
        `${selectedStudent.lastName || selectedStudent.stud_lastname || ''}_${selectedStudent.firstName || selectedStudent.stud_firstname || ''}`.trim() : 
        'Student';
      const fileName = `Report_Card_${studentNameForFile}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF downloaded successfully!");
      
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error("Failed to download. Please try again.");
    }
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

  // Helper: Get assessment symbol for a subject and quarter
  function getAssessmentSymbol(subject, quarterId, progressCards) {
    if (!progressCards || !Array.isArray(progressCards)) {
      return ''; // Return blank if no data
    }
    
    // Find assessment for this subject and quarter
    const assessment = progressCards.find(a => 
      a.subject_name === subject && a.quarter_id === quarterId
    );
    
    if (!assessment || assessment.assessment_value === null || assessment.assessment_value === undefined) {
      return ''; // Return blank if no assessment found
    }
    
    // Map assessment values to symbols with proper Unicode
    const value = assessment.assessment_value;
    if (value >= 90) return '♥'; // Excellent - Heart
    if (value >= 80) return '★'; // Very Good - Star
    if (value >= 70) return '◆'; // Good - Diamond
    if (value >= 60) return '▲'; // Need Help - Triangle
    return '⬤'; // Not Met - Circle (using solid circle instead of ⬤)
  }

  // Helper: Get student's overall risk level
  function getStudentRiskLevel(progressCards) {
    if (!progressCards || !Array.isArray(progressCards)) {
      return 'High'; // Default to High risk if no data
    }
    
    // Calculate average assessment value
    const validAssessments = progressCards.filter(a => 
      a.assessment_value !== null && a.assessment_value !== undefined
    );
    
    if (validAssessments.length === 0) {
      return 'High'; // High risk if no valid assessments
    }
    
    const average = validAssessments.reduce((sum, a) => sum + a.assessment_value, 0) / validAssessments.length;
    
    if (average >= 80) return 'Low';
    if (average >= 60) return 'Moderate';
    return 'High';
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

  // Helper to render status chart
  function renderStatusChart() {
        // Get performance levels from backend visual feedback data - use descriptions
        const yLabels = visualFeedback && Array.isArray(visualFeedback) 
          ? visualFeedback.map(f => f.visual_feedback_description).reverse()
          : ["Excellent", "Very Good", "Good", "Need Help", "Not Met"];
    
    const yMap = {};
    if (visualFeedback && Array.isArray(visualFeedback)) {
      visualFeedback.forEach((f, index) => {
        const description = f.visual_feedback_description;
        yMap[description] = visualFeedback.length - index; // Reverse order for chart
      });
    } else {
      yMap['Excellent'] = 5; yMap['Very Good'] = 4; yMap['Good'] = 3; yMap['Need Help'] = 2; yMap['Not Met'] = 1;
    }
    
    const xLabels = quarters.filter(q => q.id <= 4).map(q => q.name); // Use same quarters array as web page
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });
    
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 p-4">
          <FaChartLine className="text-3xl sm:text-4xl mb-4 text-gray-300" />
          <p className="text-base sm:text-lg font-medium text-center">No chart data available</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">Quarterly performance data will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="h-48 sm:h-64 w-full bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
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

  // Printable SVG line chart (works even when print layout is hidden on screen)
  function renderPrintStatusChartSVG() {
    // Get performance levels from backend visual feedback data - use descriptions
    const yMap = {};
    if (visualFeedback && Array.isArray(visualFeedback)) {
      visualFeedback.forEach((f, index) => {
        const description = f.visual_feedback_description;
        yMap[description] = visualFeedback.length - index; // Reverse order for chart
      });
    } else {
      yMap['Excellent'] = 5; yMap['Very Good'] = 4; yMap['Good'] = 3; yMap['Need Help'] = 2; yMap['Not Met'] = 1;
    }
    
    const xLabels = quarters.filter(q => q.id <= 4).map(q => q.name); // Use same quarters array as web page
    const dataPoints = [1,2,3,4].map(qid => {
      const card = quarterlyPerformance.find(c => Number(c.quarter_id) === qid);
      const desc = card && visualFeedbackMap[card.quarter_visual_feedback_id];
      return yMap[desc] || null;
    });

    // Show placeholder when there's no data
    if (dataPoints.every(v => v === null)) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white p-4">
          <FaChartLine className="text-3xl mb-2 text-gray-300" />
          <span className="text-base">No chart data available</span>
        </div>
      );
    }

    const width = 700; // px
    const height = 240; // px
    // Extra padding to keep line and points inside the inner chart rectangle
    const margin = { top: 20, right: 50, bottom: 42, left: 70 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;
    const innerPadX = 12;
    const innerPadY = 12;
    const plotLeft = margin.left + innerPadX;
    const plotRight = margin.left + chartW - innerPadX;
    const plotTop = margin.top + innerPadY;
    const plotBottom = margin.top + chartH - innerPadY;
    const xs = (i) => plotLeft + ((plotRight - plotLeft) / 3) * i; // 0..3
    const ys = (v) => plotBottom - ((v - 1) / 4) * (plotBottom - plotTop); // 1..5

    // Build path with gaps for nulls
    let path = '';
    dataPoints.forEach((v, i) => {
      if (v == null) return;
      const cmd = path ? 'L' : 'M';
      path += `${cmd}${xs(i)},${ys(v)} `;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines and axes */}
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

          {/* Line path */}
          <path d={path.trim()} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {/* Points */}
          {dataPoints.map((v, i) => v == null ? null : (
            <circle key={i} cx={xs(i)} cy={ys(v)} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          ))}

          {/* X labels */}
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
          <text x={16} y={margin.top - 6} textAnchor="start" fontSize="13" fill="#374151">Performance Level</text>
        </svg>
      </div>
    );
  }

  return (
    <ProtectedRoute role="Parent">
      {/* Student Selection Tabs - Only show if parent has 2+ active students */}
                {students.filter(s => s.schoolStatus === 'Active').length > 1 && (
        <div className="bg-white px-2 sm:px-4 py-1 border-b border-gray-200">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                            {students.filter(s => s.schoolStatus === 'Active').map(s => (
              <button
                key={s.id}
                className={`px-2 sm:px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 flex items-center gap-1 sm:gap-2 min-w-[140px] sm:min-w-[170px] flex-shrink-0 ${
                  selectedStudentId === s.id 
                    ? 'bg-[#2c2f6f] text-white shadow-lg transform scale-105' 
                    : 'bg-white text-[#2c2f6f] border-2 border-gray-200 hover:border-[#2c2f6f] hover:bg-[#f3f7fd] hover:shadow-md'
                }`}
                onClick={() => setSelectedStudentId(s.id)}
              >
                {/* Left side - Student photo or FaUser icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${selectedStudentId === s.id ? 'bg-white' : 'bg-[#2c2f6f]'}`}>
                  {(() => {
                    // TEMPORARY: Use direct photo first, then fallback to UserContext
                    const directPhoto = s.photo || s.stud_photo || s.user_photo;
                    const realTimePhoto = getStudentPhoto(s.id) || s.photo || s.stud_photo || s.user_photo;
                    
                    // Debug logging for photo retrieval
                    console.log('Student tab photo rendering for student:', s.id, {
                      studentName: s.name,
                      directPhoto,
                      realTimePhoto: getStudentPhoto(s.id),
                      fallbackPhoto: s.photo,
                      finalPhoto: realTimePhoto
                    });
                    
                    // Use direct photo first for testing
                    if (directPhoto) {
                      return (
                        <img
                          src={getPhotoUrl(directPhoto)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Direct photo failed to load for student:', s.name, 'Photo URL:', getPhotoUrl(directPhoto));
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                          onLoad={() => {
                            console.log('Direct photo loaded successfully for student:', s.name, 'Photo URL:', getPhotoUrl(directPhoto));
                          }}
                        />
                      );
                    } else if (realTimePhoto) {
                      return (
                        <img
                          src={getPhotoUrl(realTimePhoto)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Real-time photo failed to load for student:', s.name, 'Photo URL:', getPhotoUrl(realTimePhoto));
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                          onLoad={() => {
                            console.log('Real-time photo loaded successfully for student:', s.name, 'Photo URL:', getPhotoUrl(realTimePhoto));
                          }}
                        />
                      );
                    } else {
                      return (
                        <FaUser className={`w-3 h-3 ${selectedStudentId === s.id ? 'text-[#2c2f6f]' : 'text-white'}`} />
                      );
                    }
                  })()}
                  {/* Fallback icon that shows when photo fails to load */}
                  <FaUser className={`w-3 h-3 ${selectedStudentId === s.id ? 'text-[#2c2f6f]' : 'text-white'}`} style={{ display: 'none' }} />
                </div>
                
                {/* Right side - Student name and class level */}
                <div className="flex flex-col items-start text-left">
                  <div className="font-semibold text-xs leading-tight truncate max-w-[100px] sm:max-w-none">
                    {s.lastName ? `${s.lastName}, ${s.firstName} ${s.middleName || ''}`.trim() : s.name}
                  </div>
                  <div className="text-xs opacity-80 leading-tight truncate max-w-[100px] sm:max-w-none">
                    {s.levelName || 'Class N/A'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student Info Blue Header - Show when a student is selected */}
      {selectedStudent && (
        <div className="bg-[#232c67] flex flex-col sm:flex-row items-start sm:items-center w-full px-2 sm:px-4 py-2 sm:py-1.5 gap-2 sm:gap-4 rounded-lg mx-2 sm:mx-4 mb-4">
          {/* Left side with avatar and name - 40% */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-[40%]">
            {(() => {
              // Get real-time photo from UserContext, fallback to student photo fields if not available
              const realTimePhoto = getStudentPhoto(selectedStudent.id) || selectedStudent.photo || selectedStudent.stud_photo || selectedStudent.user_photo;
              
              // Debug logging for photo retrieval
              console.log('Main header photo rendering for student:', selectedStudent.id, {
                studentName: selectedStudent.name,
                realTimePhoto: getStudentPhoto(selectedStudent.id),
                fallbackPhoto: selectedStudent.photo,
                finalPhoto: realTimePhoto,
                realTimePhotoType: typeof realTimePhoto,
                realTimePhotoStartsWith: realTimePhoto ? realTimePhoto.substring(0, 20) : 'null'
              });
              
              if (realTimePhoto) {
                const finalPhotoUrl = getPhotoUrl(realTimePhoto);
                console.log('🔍 BLUE HEADER PHOTO DEBUG:', {
                  studentId: selectedStudent.id,
                  studentName: selectedStudent.name,
                  realTimePhoto: realTimePhoto,
                  finalPhotoUrl: finalPhotoUrl,
                  realTimePhotoType: typeof realTimePhoto,
                  realTimePhotoLength: realTimePhoto ? realTimePhoto.length : 0
                });
                
                return (
                  <>
                    <img
                      src={finalPhotoUrl}
                      alt="Profile"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-sm border-2 sm:border-4 border-white"
                      onError={(e) => {
                        console.log('❌ BLUE HEADER PHOTO FAILED:', {
                          student: selectedStudent.name,
                          originalPhoto: realTimePhoto,
                          finalUrl: finalPhotoUrl,
                          error: e
                        });
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ BLUE HEADER PHOTO SUCCESS:', {
                          student: selectedStudent.name,
                          originalPhoto: realTimePhoto,
                          finalUrl: finalPhotoUrl
                        });
                      }}
                    />
                    {/* Fallback icon that shows when photo fails to load */}
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full hidden">
                      <FaUser className="text-white text-lg sm:text-xl" />
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full">
                    <FaUser className="text-white text-lg sm:text-xl" />
                  </div>
                );
              }
            })()}
            <span className="font-bold text-white text-lg sm:text-2xl whitespace-nowrap truncate max-w-[200px] sm:max-w-none">
              {selectedStudent ? (
                studentDetailsLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading student details...</span>
                  </div>
                ) : (
                  `${selectedStudent.lastName || selectedStudent.stud_lastname}, ${selectedStudent.firstName || selectedStudent.stud_firstname} ${selectedStudent.middleName || selectedStudent.stud_middlename || ''}`
                )
              ) : (
                "Select a student to view progress"
              )}
            </span>
          </div>
          
                     {/* Right side with student details in two rows - 60% */}
           <div className="flex flex-col gap-2 w-full sm:w-[60%]">
             {/* First row - Schedule, Gender, Handedness, Date of Birth */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Schedule:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     selectedStudent.stud_schedule_class || "N/A"
                   )}
                 </span>
               </span>
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Gender:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     selectedStudent.stud_gender || "N/A"
                   )}
                 </span>
               </span>
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Handedness:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     selectedStudent.stud_handedness || "N/A"
                   )}
                 </span>
               </span>
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Date of Birth:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     formatDateOfBirth(selectedStudent.stud_birthdate)
                   )}
                 </span>
               </span>
             </div>
             
             {/* Second row - Lead Teacher and Assistant Teacher */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Lead Teacher:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     selectedStudent.lead_teacher_name ? formatName(selectedStudent.lead_teacher_name) : "Not assigned"
                   )}
                 </span>
               </span>
               <span className="text-white text-sm sm:text-base font-bold">
                 <span className="text-white">Assistant Teacher:</span> <span className="font-normal ml-2">
                   {studentDetailsLoading ? (
                     <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                   ) : (
                     selectedStudent.assistant_teacher_name ? formatName(selectedStudent.assistant_teacher_name) : "Not assigned"
                   )}
                 </span>
               </span>
             </div>
           </div>
        </div>
      )}

      {/* Assessment/Status Navigation Tabs */}
      {selectedStudent && (
        <div className="bg-white px-2 sm:px-4 py-1 border-b border-gray-200">
          <div className="flex gap-3 sm:gap-5">
            <button
              onClick={() => setActiveTabSafely("Assessment")}
              className={`text-[#2c2f6f] border-b-2 font-semibold pb-1 transition-colors ${
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
                onClick={() => {
                  console.log('=== Status Tab Click Debug ===');
                  console.log('hasOverallProgress():', hasOverallProgress());
                  console.log('hasAnyProgress():', hasAnyProgress());
                  console.log('quarterlyPerformance:', quarterlyPerformance);
                  console.log('overallProgress:', overallProgress);
                  console.log('milestoneSummary:', milestoneSummary);
                  console.log('milestoneOverallSummary:', milestoneOverallSummary);
                  console.log('finalSubjectProgress:', finalSubjectProgress);
                  
                  // Only allow click if there's overall progress data
                  if (hasOverallProgress()) {
                    console.log('✅ Allowing navigation to Status tab');
                    setActiveTabSafely("Status");
                  } else {
                    console.log('❌ Blocking navigation to Status tab - no overall progress data');
                    // Don't do anything - tab should remain locked
                  }
                }}
                disabled={!hasOverallProgress()}
                className={`border-b-2 font-semibold pb-1 transition-colors flex items-center gap-2 ${
                  activeTab === "Status"
                    ? "text-[#2c2f6f] border-[#2c2f6f]"
                    : hasOverallProgress()
                    ? "text-[#2c2f6f] border-transparent hover:border-gray-300 cursor-pointer"
                    : "text-gray-400 border-transparent cursor-not-allowed opacity-50"
                }`}
              >
                Status
                {!hasOverallProgress() && (
                  <FaLock className="text-sm" />
                )}
              </button>
            </div>

            {(activeTab === "Assessment" || activeTab === "Status") && (
              <button
                onClick={handleExportAssessment}
                className="ml-auto inline-flex items-center gap-2 bg-[#2c2f6f] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                title="Print or Save Assessment as PDF"
              >
                <FaDownload />
                <span className="font-semibold">Download PDF</span>
              </button>
            )}

            {/* Custom Tooltip for Status Tab */}
            {showStatusTooltip && !hasOverallProgress() && (
              <div
                className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
                style={{
                  left: tooltipPosition.x - 100,
                  top: tooltipPosition.y,
                  width: '200px',
                  textAlign: 'center'
                }}
              >
                {getStatusTooltipMessage()}
                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -top-1 left-1/2 -ml-1"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Students...</h3>
            <p className="text-gray-500">Please wait while we fetch your children's information</p>
          </div>
        </div>
      ) : !selectedStudent ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <FaUser className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-500">You don't have any students linked to your account yet.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Scrollable Content Area */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
            {/* Print Layout - kept hidden on screen; print CSS reveals it without touching app layout */}
            <div ref={printRef} className="hidden print:block" style={{margin: 0, padding: 0}}>
              {/* Page 1: School & Learner Info (refined UI for readability) */}
              <div className="print-page p-10 pastel-blue border-soft rounded-xl text-[15px]" style={{margin: 0}}>
                {/* Header */}
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

                {/* Learner Information Card */}
                <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-7">
                  <div className="section-title text-3xl font-bold text-gray-900 mb-5">Learner's Information</div>
                  <div className="grid grid-cols-2 gap-5 text-lg leading-relaxed">
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Name</div>
                      <div className="text-gray-900 font-semibold text-lg">
                        {selectedStudent ? `${selectedStudent.lastName || selectedStudent.stud_lastname || ''}, ${selectedStudent.firstName || selectedStudent.stud_firstname || ''} ${selectedStudent.middleName || selectedStudent.stud_middlename || ''}` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Sex</div>
                      <div className="text-gray-900 font-semibold text-lg">{selectedStudent?.stud_gender || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Level</div>
                      <div className="text-gray-900 font-semibold text-lg">{selectedStudent?.levelName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Date of Birth</div>
                      <div className="text-gray-900 font-semibold text-lg">{formatDateOfBirth(selectedStudent?.stud_birthdate) || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Lead Teacher</div>
                      <div className="text-gray-900 font-semibold text-lg">{displayOrLine(selectedStudent?.lead_teacher_name ? formatName(selectedStudent.lead_teacher_name) : '')}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-semibold text-base">Assistant Teacher</div>
                      <div className="text-gray-900 font-semibold text-lg">{displayOrLine(selectedStudent?.assistant_teacher_name ? formatName(selectedStudent.assistant_teacher_name) : '')}</div>
                    </div>
                  </div>
                </div>

                {/* Socio-demographic Card */}
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

              {/* Page 2: Attendance + Parent Signatures (refined UI) */}
              <div className="print-page p-10 pastel-green border-soft rounded-xl text-[15px]" style={{margin: 0}}>
                {/* Attendance Card */}
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

                {/* Parent Signatures Card */}
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

              

              {/* Page 3: Learning Progress & Assessment (refined UI) */}
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
                              const description = vf?.visual_feedback_description || '';
                              return (
                                <td key={q.id} className="px-3 py-1 text-center border-soft bg-[#fffaf0]">
                                  {description ? (
                                    <span className="text-sm font-medium text-gray-700">{description}</span>
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
                            const vf = overallProgress && overallProgress.visual_shape && allQuartersFinalized 
                              ? visualFeedback.find(v => v.visual_feedback_shape === overallProgress.visual_shape)
                              : null;
                            const description = vf ? vf.visual_feedback_description : '';
                            const riskId = overallProgress?.risk_id;
                            const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                            return (
                              <td key={q.id} className="px-3 py-1 text-center border-soft">
                                {description ? (
                                  <div className="inline-flex items-center gap-2">
                                    {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                                    <span className="text-sm font-medium text-gray-700">{description}</span>
                                  </div>
                                ) : ''}
                              </td>
                            );
                          }
                          const card = progressCards.find(pc => Number(pc.quarter_id) === q.id);
                          if (card) {
                            const vf = visualFeedback.find(v => v.visual_feedback_id == card.quarter_visual_feedback_id);
                            const description = vf?.visual_feedback_description || '';
                            const riskId = card?.risk_id;
                            const riskColor = String(riskId) === '1' ? '#22c55e' : String(riskId) === '2' ? '#fbbf24' : String(riskId) === '3' ? '#ef4444' : '';
                            return (
                              <td key={q.id} className="px-3 py-1 text-center border-soft">
                                {description ? (
                                  <div className="inline-flex items-center gap-2">
                                    {riskColor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }}></span>}
                                    <span className="text-sm font-medium text-gray-700">{description}</span>
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
                  {/* Left: Assessment Legend */}
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
                                      <span 
                                        className="text-2xl font-medium"
                                        style={{ color: shapeColorMap[item.visual_feedback_shape] || '#6b7280' }}
                                      >
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

                  {/* Right: Risk Levels Table */}
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

              {/* Page 4: Performance Overview (refined UI) */}
              {hasOverallProgress() && (
                <div className="print-page p-10 pastel-pink border-soft rounded-xl text-[15px]" style={{margin: 0}}>
                  {/* Trend Card */}
                  <div className="bg-white/80 border border-white/70 rounded-xl shadow-sm p-7 mb-8">
                    <div className="section-title text-3xl font-bold text-gray-900 mb-5">Quarterly Performance Trend</div>
                    <div className="no-break">
                      {renderPrintStatusChartSVG()}
                    </div>
                  </div>

                  {/* Summary & Risk Side-by-side */}
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
                            if (riskId === '1') {
                              label = 'Low';
                              color = '#22c55e';
                              description = 'Student is performing well and meeting expectations.';
                            } else if (riskId === '2') {
                              label = 'Moderate';
                              color = '#fbbf24';
                              description = 'Student may need additional support in some areas.';
                            } else if (riskId === '3') {
                              label = 'High';
                              color = '#ef4444';
                              description = 'Student requires immediate attention and intervention.';
                            }
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
            <div ref={activeTab === "Assessment" ? assessmentRef : null} className="grid grid-cols-1 lg:grid-cols-5 gap-2 bg-white px-1 sm:px-1 pt-1 pb-1">
              {activeTab === "Assessment" ? (
                assessmentLoading ? (
                  <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading assessment data...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest information</p>
                  </div>
                ) : (
                  <>
                    {/* Left: Quarterly Assessment and Attendance (3 columns) */}
                    <div className="col-span-1 lg:col-span-3 space-y-4">
                      {/* Quarterly Assessment Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 border border-blue-100">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaTable className="text-blue-600 text-sm sm:text-lg" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quarterly Assessment</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Subject performance across quarters</p>
                          </div>
                        </div>
                        
                        {/* Assessment Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[600px]">
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
                                {(() => {
                                  console.log("=== DEBUG: Assessment Table Rendering ===");
                                  console.log("Subjects:", subjects);
                                  console.log("Quarter Feedback:", quarterFeedback);
                                  console.log("Progress Cards:", progressCards);
                                  console.log("Final Subject Progress:", finalSubjectProgress);
                                  console.log("Visual Feedback:", visualFeedback);
                                  console.log("=== END DEBUG ===");
                                  
                                  return subjects.length > 0 ? (
                                  [...subjects].sort((a, b) => a.localeCompare(b)).map((subject, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 font-medium text-gray-900">{subject}</td>
                                      {quarters.map(q => {
                                        if (q.id === 5) {
                                          const subjProgress = finalSubjectProgress.find(row => row.subject_name === subject);
                                          const vf = visualFeedback.find(v => v.visual_feedback_id == subjProgress?.finalsubj_visual_feedback_id);
                                          const shape = vf?.visual_feedback_shape || '';
                                          return (
                                            <td key={q.id} className="px-4 py-3 text-center">
                                              {shape ? (
                                                <span 
                                                  style={{ color: shapeColorMap[shape] || 'inherit', fontSize: '1.5em' }}
                                                  className="inline-block hover:scale-110 transition-transform"
                                                >
                                                  {shape}
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
                              );
                            })()}
                            
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
                      </div>
                      {/* Attendance Section */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-2 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FaChartBar className="text-green-600 text-sm sm:text-lg" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Record of Attendance</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Monthly attendance tracking</p>
                          </div>
                        </div>
                        
                        {(() => {
                          const attendanceSummary = getAttendanceSummary();
                          return attendanceSummary ? (
                             <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[500px]">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border-b border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                                    {attendanceSummary.summary.map((month, idx) => (
                                      <th key={idx} className="border-b border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-600">
                                        {month.label}
                                      </th>
                                    ))}
                                    <th className="border-b border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-700">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-4 py-2 text-sm font-medium text-gray-700">No. of School Days</td>
                                    {attendanceSummary.summary.map((month, idx) => (
                                      <td key={idx} className="px-2 py-2 text-center text-sm text-gray-600">
                                        {month.total}
                                      </td>
                                    ))}
                                    <td className="px-2 py-2 text-center text-sm font-semibold text-blue-600">
                                      {attendanceSummary.totalSchoolDays}
                                    </td>
                                  </tr>
                                  <tr className="border-b border-gray-100">
                                    <td className="px-4 py-2 text-sm font-medium text-gray-700">No. of Days Present</td>
                                    {attendanceSummary.summary.map((month, idx) => (
                                      <td key={idx} className="px-2 py-2 text-center text-sm text-gray-600">
                                        {month.present}
                                      </td>
                                    ))}
                                    <td className="px-2 py-2 text-center text-sm font-semibold text-green-600">
                                      {attendanceSummary.totalPresent}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-700">No. of Days Absent</td>
                                    {attendanceSummary.summary.map((month, idx) => (
                                      <td key={idx} className="px-2 py-2 text-center text-sm text-gray-600">
                                        {month.absent}
                                      </td>
                                    ))}
                                    <td className="px-2 py-2 text-center text-sm font-semibold text-red-600">
                                      {attendanceSummary.totalAbsent}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaChartBar className="text-gray-400 text-xl" />
                              </div>
                              <p className="text-gray-500 font-medium">No attendance data available</p>
                              <p className="text-sm text-gray-400 mt-1">Attendance records will appear here</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Right: Assessment Legend, Risk Level, and Comments (2 columns) */}
                    <div className="col-span-1 lg:col-span-2 space-y-4">
                      {/* Assessment Legend Section */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FaTable className="text-purple-600 text-sm sm:text-lg" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Assessment Legend</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Performance indicators and meanings</p>
                          </div>
                        </div>
                        
                        <div className="overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[400px]">
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
                                        className="text-2xl font-medium"
                                        style={{ color: shapeColorMap[item.visual_feedback_shape] || '#6b7280' }}
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
                      </div>

                      {/* Risk Level Section */}
                      {riskLevels.length > 0 && (
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-2 border border-red-100">
                          <div className="flex items-center gap-2 mb-2">
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
                              {riskLevels.map((risk, index) => {
                                const hex = String(risk.risk_id) === '1' ? '#10B981' : String(risk.risk_id) === '2' ? '#F59E0B' : '#EF4444';
                                const label = getRiskInfo(risk.risk_id).text;
                                return (
                                  <div key={index} className="flex items-center gap-3">
                                    <span
                                      className="w-4 h-4 rounded-full border-2 shadow-sm"
                                      style={{ backgroundColor: hex, borderColor: hex }}
                                    ></span>
                                    <span className="text-sm font-medium text-gray-900">{label} Risk</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comments Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
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
                              {comments.map((comment, index) => (
                                <div key={comment.comment_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                  <div className="text-sm text-gray-800 mb-2 leading-relaxed">
                                    {comment.comment_text || comment.feedback || comment.comment}
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
                                    {comment.comment_date && (
                                      <span>
                                        {new Date(comment.comment_date).toLocaleString("en-US", { 
                                          month: "short", 
                                          day: "numeric", 
                                          year: "numeric", 
                                          hour: "numeric", 
                                          minute: "2-digit", 
                                          hour12: true 
                                        })}
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
              ) : activeTab === "Status" ? (
                statusLoading ? (
                  <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading status data...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest information</p>
                  </div>
                ) : (
                  <>
                    {/* Left: Progress Circles (2 columns) */}
                    <div className="col-span-1 lg:col-span-2 space-y-8">
                      {/* Final Subject Averages Section - Only show when there's overall progress */}
                      {(() => {
                        const hasOverall = hasOverallProgress();
                        console.log('Rendering Final Subject Averages - hasOverallProgress():', hasOverall);
                        return hasOverall;
                      })() && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  <div key={row.subject_id} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="relative w-12 h-12 sm:w-16 sm:h-16">
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
                                        <span className="text-xs sm:text-sm font-bold text-gray-900">{percent}%</span>
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
                    <div className="col-span-1 lg:col-span-3 flex flex-col h-full space-y-4">
                      {/* Message for students without overall progress - Centered */}
                      {(() => {
                        const hasOverall = hasOverallProgress();
                        console.log('Rendering message section - hasOverallProgress():', hasOverall);
                        return !hasOverall;
                      })() && (
                        <div className="flex items-center justify-center min-h-[300px] w-full">
                          <div className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-8 border border-yellow-100 shadow-lg">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <FaChartLine className="text-yellow-600 text-2xl" />
                              </div>
                              <h3 className="text-xl font-bold text-yellow-900 mb-4">
                                {hasAnyProgress() ? 'Progress Assessment Pending' : 'No Assessment Data Available'}
                              </h3>
                              <p className="text-yellow-700 mb-6 text-base leading-relaxed">
                                {hasAnyProgress() 
                                  ? 'To view your Final Risk Status, Performance Summary, Quarterly Performance Trend Chart, and Final Subject Averages, you need to have overall progress data. Currently, you only have individual quarter assessments.'
                                  : 'No quarterly assessments have been completed yet. Assessment data is required to generate progress analysis.'
                                }
                              </p>
                              <div className="bg-yellow-100 rounded-lg p-4 text-sm text-yellow-800 space-y-2">
                                {hasAnyProgress() ? (
                                  <>
                                    <p className="text-left"><strong>Current Status:</strong> You have individual quarter assessments but no overall progress data.</p>
                                    <p className="text-left"><strong>Next Step:</strong> Overall progress data needs to be generated to unlock all progress analysis sections.</p>
                                    <p className="text-left"><strong>What You'll See:</strong> Final Risk Status, Performance Summary, Chart, and Subject Averages.</p>
                                    <p className="text-left"><strong>Note:</strong> Sections are only displayed when there's actual overall progress data in the system.</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-left"><strong>Current Status:</strong> No quarterly assessments completed.</p>
                                    <p className="text-left"><strong>Next Step:</strong> Complete Quarter 1 assessments to begin progress tracking.</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Chart Section - Only show when there's overall progress */}
                      {hasOverallProgress() && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
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
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-2 border border-green-100">
                          <div className="flex items-center justify-between mb-2">
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
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}