"use client";
import React, { useState, useMemo, useEffect } from "react";
import { FaArrowLeft, FaUser, FaMale, FaFemale, FaUsers, FaChalkboardTeacher, FaMars, FaVenus, FaChartBar, FaTable, FaExclamationTriangle, FaComments, FaTimes, FaCheckCircle, FaRegClock, FaPlusCircle, FaChartLine, FaSearch, FaChevronDown, FaLock } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useAuth } from "../../Context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../Context/UserContext";

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

  // Tooltip state
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  const getStatusTooltipMessage = () => {
    if (!hasOverallProgress() && !hasAnyProgress()) {
      return "No Assessment Data Available - No quarterly assessments have been completed yet. Assessment data is required to generate progress analysis.";
    }
    if (!hasOverallProgress()) {
      return "Progress Assessment Pending - To view the student's Final Risk Status, Performance Summary, Quarterly Performance Trend Chart, and Final Subject Averages, overall progress data is required.";
    }
    return "";
  };

  // Add shapeColorMap for consistent coloring
  const shapeColorMap = {
    '❤️': '#ef4444', // red
    '⭐': '#fbbf24', // yellow
    '🔷': '#2563eb', // blue
    '▲': '#f59e42', // orange
    '🟡': '#facc15'  // gold/yellow
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

  // Helper to render status chart
  function renderStatusChart() {
    const yLabels = ["Excellent", "Very Good", "Good", "Need Help", "Not Met"];
    const yMap = { 'Excellent': 5, 'Very Good': 4, 'Good': 3, 'Need Help': 2, 'Not Met': 1 };
    const xLabels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
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
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 bg-white px-1 sm:px-1 pt-1 pb-1">
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
                                      <svg className="absolute top-0 left-0 w-full h-full">
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