"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FaClipboardCheck, FaUsers, FaCalendarAlt, FaChevronDown, FaPlus, FaTimes, FaEdit, FaSave, FaEye, FaUser, FaClipboardList, FaPlusSquare } from "react-icons/fa";
import { useUser } from "../../Context/UserContext";

const activities = Array.from({ length: 22 }, (_, i) => `Activity ${i + 1}`);

const options = [
  { icon: "❤️", label: "Excellent" },
  { icon: "⭐", label: "Very Good" },
  { icon: "🔷", label: "Good" },
  { icon: "▲", label: "Need Help" },
  { icon: "🟡", label: "Not Met" },
];

const scheduleOptions = ["Morning", "Afternoon"];

// Add this color map for shapes
const shapeColorMap = {
  '❤️': '#ef4444', // red
  '⭐': '#fbbf24', // yellow
  '🔷': '#2563eb', // blue
  '▲': '#f59e42', // orange
  '🟡': '#facc15'  // gold/yellow
};

export default function AssessmentPage() {
  const { getUserPhoto, getStudentPhoto, updateAnyUserPhoto, updateAnyStudentPhoto, initializeAdvisoryPhotos } = useUser();
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  // Change modal state to use activityId
  const [modal, setModal] = useState({ show: false, student: "", activityId: null });
  const [selectedIcon, setSelectedIcon] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("Morning");
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const [isQuarterDropdownOpen, setIsQuarterDropdownOpen] = useState(false);
  const [levelId, setLevelId] = useState(null);
  const [loading, setLoading] = useState(true);
  // Add Activity Modal state
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  // Add Activity modal subject/session state (ensure defined before use)
  const [newActivitySubject, setNewActivitySubject] = useState("");
  const [newActivitySession, setNewActivitySession] = useState("");
  // Add Activity modal dropdown animation states
  const [isAddActivitySubjectDropdownOpen, setIsAddActivitySubjectDropdownOpen] = useState(false);
  const [isAddActivitySessionDropdownOpen, setIsAddActivitySessionDropdownOpen] = useState(false);
  // Keep subject/session in sync with options
  useEffect(() => {
    if (subjectOptions.length > 0) setNewActivitySubject(subjectOptions[0]);
  }, [subjectOptions]);
  useEffect(() => {
    if (scheduleOptions.length > 0) setNewActivitySession(scheduleOptions[0]);
  }, [scheduleOptions]);

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsSubjectDropdownOpen(false);
    setIsScheduleDropdownOpen(false);
    setIsQuarterDropdownOpen(false);
    setIsAddActivitySubjectDropdownOpen(false);
    setIsAddActivitySessionDropdownOpen(false);
  };

  // Function to validate current form state and show toast messages
  const validateCurrentFormState = async () => {
    // Validate activity name
    if (newActivityName.trim() === "") {
      return false;
    }
    
    // Validate date against quarter ranges
    if (quarters && quarters.length > 0) {
      const quarter1 = quarters.find(q => q.quarter_id === 1);
      const quarter4 = quarters.find(q => q.quarter_id === 4);
      
      if (quarter1 && quarter4) {
        const startDate = quarter1.start_date;
        const endDate = quarter4.end_date;
        
        // Convert dates to Date objects for proper comparison
        const inputDate = parseDate(newActivityDate);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (inputDate < startDateObj || inputDate > endDateObj) {
          // Don't show toast here - it's already shown in real-time validation
          return false;
        }
      }
    }
    
    // Check for duplicate dates using the new business rule validation
    const hasDuplicate = await checkDuplicateDate(newActivityDate, newActivityName);
    if (hasDuplicate) {
      // Don't show toast here - it's already shown in real-time validation
      return false;
    }
    
    return true;
  };

  // Function to check for duplicate dates based on business rule:
  // Same advisory + same subject + same date = duplicate (rejected)
  // Same advisory + different subject + same date = allowed (accepted)
  // Different advisory + same subject + same date = allowed (accepted)
  const checkDuplicateDate = async (activityDate, activityName, excludeActivityId = null) => {
    console.log('checkDuplicateDate called with:', { activityDate, activityName, excludeActivityId });
    console.log('Current state:', { advisoryId, newActivitySubject, levelId });
    
    if (!advisoryId || !newActivitySubject || !levelId) {
      console.log('Missing required data, returning false');
      return false;
    }
    
    try {
      // Get subject_id for the current modal subject selection
      let currentSubjectId = null;
      console.log('Fetching schedule data...');
      const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
      const data = await res.json();
      console.log('Schedule data:', data);
      
      const sched = data.schedules.find((s) => s.level_id == levelId);
      console.log('Found schedule for level:', sched);
      
      if (sched && sched.schedule) {
        Object.values(sched.schedule).forEach((dayArr) => {
          dayArr.forEach((item) => {
            if (item.subject === newActivitySubject && item.subject_id) currentSubjectId = item.subject_id;
            if (item.subject_name_2 === newActivitySubject && item.subject_id_2) currentSubjectId = item.subject_id_2;
          });
        });
      }
      
      console.log('Found subject ID:', currentSubjectId);
      
      if (!currentSubjectId) {
        console.log('No subject ID found, returning false');
        return false;
      }
      
      // Now check if there's already an activity with the same date for the same advisory + subject combination
      console.log('Calling check_duplicate_activity.php with:', {
        advisory_id: advisoryId,
        subject_id: currentSubjectId,
        activity_date: activityDate,
        exclude_activity_id: excludeActivityId
      });
      
      const checkRes = await fetch("http://localhost/capstone-project/backend/Assessment/check_duplicate_activity.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisory_id: advisoryId,
          subject_id: currentSubjectId,
          activity_date: activityDate,
          exclude_activity_id: excludeActivityId
        }),
      });
      
      const checkResult = await checkRes.json();
      console.log('API response:', checkResult);
      
      return checkResult.has_duplicate || false;
      
    } catch (error) {
      console.error('Error checking for duplicate dates:', error);
      return false;
    }
  };

  // Function to check for duplicate dates specifically for edit mode
  const checkDuplicateDateForEdit = async (activityDate, activityName, excludeActivityId = null) => {
    console.log('checkDuplicateDateForEdit called with:', { activityDate, activityName, excludeActivityId });
    console.log('Current edit state:', { advisoryId, editActivitySubject, levelId });
    
    if (!advisoryId || !editActivitySubject || !levelId) {
      console.log('Missing required data for edit, returning false');
      return false;
    }
    
    try {
      // Get subject_id for the edit modal subject selection
      let currentSubjectId = null;
      console.log('Fetching schedule data for edit...');
      const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
      const data = await res.json();
      console.log('Schedule data for edit:', data);
      
      const sched = data.schedules.find((s) => s.level_id == levelId);
      console.log('Found schedule for edit level:', sched);
      
      if (sched && sched.schedule) {
        Object.values(sched.schedule).forEach((dayArr) => {
          dayArr.forEach((item) => {
            if (item.subject === editActivitySubject && item.subject_id) currentSubjectId = item.subject_id;
            if (item.subject_name_2 === editActivitySubject && item.subject_id_2) currentSubjectId = item.subject_id_2;
          });
        });
      }
      
      console.log('Found subject ID for edit:', currentSubjectId);
      
      if (!currentSubjectId) {
        console.log('No subject ID found for edit, returning false');
        return false;
      }
      
      // Now check if there's already an activity with the same date for the same advisory + subject combination
      console.log('Calling check_duplicate_activity.php for edit with:', {
        advisory_id: advisoryId,
        subject_id: currentSubjectId,
        activity_date: activityDate,
        exclude_activity_id: excludeActivityId
      });
      
      const checkRes = await fetch("http://localhost/capstone-project/backend/Assessment/check_duplicate_activity.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisory_id: advisoryId,
          subject_id: currentSubjectId,
          activity_date: activityDate,
          exclude_activity_id: excludeActivityId
        }),
      });
      
      const checkResult = await checkRes.json();
      console.log('API response for edit:', checkResult);
      
      return checkResult.has_duplicate || false;
      
    } catch (error) {
      console.error('Error checking for duplicate dates in edit:', error);
      return false;
    }
  };

  // Function to validate date in real-time and update UI state
  const validateDateInRealTime = async (date) => {
    console.log('validateDateInRealTime called with date:', date);
    
    if (!date || !quarters || quarters.length === 0) {
      console.log('No date or quarters, setting neutral');
      setDateValidationStatus("neutral");
      return "neutral";
    }

    const quarter1 = quarters.find(q => q.quarter_id === 1);
    const quarter4 = quarters.find(q => q.quarter_id === 4);
    
    if (!quarter1 || !quarter4) {
      console.log('No quarter data, setting neutral');
      setDateValidationStatus("neutral");
      return "neutral";
    }

    const startDate = quarter1.start_date;
    const endDate = quarter4.end_date;
    
    console.log('Quarter range:', startDate, 'to', endDate);
    
    // Convert dates to Date objects for proper comparison
    // The date input returns YYYY-MM-DD format, so we can use new Date() directly
    const inputDate = new Date(date);
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Check if the parsed date is valid
    if (!inputDate || isNaN(inputDate.getTime())) {
      console.log('Invalid date parsed, setting invalid');
      setDateValidationStatus("invalid");
      return "invalid";
    }
    
    console.log('Original date string:', date);
    console.log('Parsed input date:', inputDate);
    console.log('Start date object:', startDateObj);
    console.log('End date object:', endDateObj);
    console.log('Input date timestamp:', inputDate.getTime());
    console.log('Start date timestamp:', startDateObj.getTime());
    console.log('End date timestamp:', endDateObj.getTime());
    
    // Check if date is within quarter range using Date objects
    if (inputDate < startDateObj || inputDate > endDateObj) {
      console.log('Date out of range, setting invalid');
      console.log('Comparison result:', {
        'inputDate < startDateObj': inputDate < startDateObj,
        'inputDate > endDateObj': inputDate > endDateObj
      });
      setDateValidationStatus("invalid");
      return "invalid";
    }

    // Check for duplicate dates using backend validation
    if (advisoryId && newActivitySubject && levelId) {
      console.log('Backend duplicate check with:', { advisoryId, newActivitySubject, levelId });
      try {
        const hasDuplicate = await checkDuplicateDate(date, newActivityName);
        console.log('Backend duplicate check result:', hasDuplicate);
        if (hasDuplicate) {
          console.log('Backend duplicate found, setting duplicate status');
          setDateValidationStatus("duplicate");
          return "duplicate";
        }
      } catch (error) {
        console.error('Error in backend duplicate check:', error);
        // If backend check fails, we'll still allow the date but log the error
      }
    } else {
      console.log('Missing required data for backend duplicate check:', { advisoryId, newActivitySubject, levelId });
    }

    // If we get here, the date is valid
    console.log('Date is valid, setting valid status');
    setDateValidationStatus("valid");
    return "valid";
  };

  // Function to validate edit activity date in real-time
  const validateEditDateInRealTime = async (date) => {
    console.log('validateEditDateInRealTime called with date:', date);
    
    if (!date || !quarters || quarters.length === 0) {
      console.log('No date or quarters, setting neutral');
      setEditDateValidationStatus("neutral");
      return "neutral";
    }

    const quarter1 = quarters.find(q => q.quarter_id === 1);
    const quarter4 = quarters.find(q => q.quarter_id === 4);
    
    if (!quarter1 || !quarter4) {
      console.log('No quarter data, setting neutral');
      setEditDateValidationStatus("neutral");
      return "neutral";
    }

    const startDate = quarter1.start_date;
    const endDate = quarter4.end_date;
    
    console.log('Quarter range:', startDate, 'to', endDate);
    
    // Convert dates to Date objects for proper comparison
    const inputDate = new Date(date);
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Check if the parsed date is valid
    if (!inputDate || isNaN(inputDate.getTime())) {
      console.log('Invalid date parsed, setting invalid');
      setEditDateValidationStatus("invalid");
      return "invalid";
    }
    
    // Check if date is within quarter range using Date objects
    if (inputDate < startDateObj || inputDate > endDateObj) {
      console.log('Date out of range, setting invalid');
      setEditDateValidationStatus("invalid");
      return "invalid";
    }

    // Check for duplicate dates using backend validation (excluding current activity)
    if (advisoryId && editActivitySubject && levelId && editActivityIndex !== null) {
      console.log('Backend duplicate check for edit with:', { advisoryId, editActivitySubject, levelId, editActivityIndex });
      try {
        // Get the actual activity_id from the activities array
        const currentActivity = activities[editActivityIndex];
        const activityId = currentActivity ? currentActivity.activity_id : null;
        
        if (activityId) {
          const hasDuplicate = await checkDuplicateDateForEdit(date, editActivityName, activityId);
          console.log('Backend duplicate check result for edit:', hasDuplicate);
          if (hasDuplicate) {
            console.log('Backend duplicate found for edit, setting duplicate status');
            setEditDateValidationStatus("duplicate");
            return "duplicate";
          }
        } else {
          console.log('No activity_id found for current activity');
        }
      } catch (error) {
        console.error('Error in backend duplicate check for edit:', error);
        // If backend check fails, we'll still allow the date but log the error
      }
    } else {
      console.log('Missing required data for backend duplicate check in edit:', { advisoryId, editActivitySubject, levelId, editActivityIndex });
    }

    // If we get here, the date is valid
    console.log('Edit date is valid, setting valid status');
    setEditDateValidationStatus("valid");
    return "valid";
  };

  // Function to validate edit form state
  const validateEditFormState = async () => {
    // Validate activity name
    if (editActivityName.trim() === "") {
      return false;
    }
    
    // Use the real-time validation status instead of re-validating
    if (editDateValidationStatus === "invalid" || editDateValidationStatus === "duplicate") {
      return false;
    }
    
    // If validation status is neutral, perform a quick validation
    if (editDateValidationStatus === "neutral" && editActivityDate) {
      await validateEditDateInRealTime(editActivityDate);
      if (editDateValidationStatus === "invalid" || editDateValidationStatus === "duplicate") {
        return false;
      }
    }
    
    // Additional safety check: ensure we have all required data
    if (!editActivityDate || !editActivitySubject || !advisoryId || editActivityIndex === null) {
      return false;
    }
    
    return true;
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
    if (isSubjectDropdownOpen || isScheduleDropdownOpen || isQuarterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSubjectDropdownOpen, isScheduleDropdownOpen, isQuarterDropdownOpen]);
  // Set default date to today in yyyy-mm-dd format
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;
    console.log('getToday() called, returning:', todayString);
    return todayString;
  };
  const [newActivityDate, setNewActivityDate] = useState(getToday()); // Default to today
  const [newActivityName, setNewActivityName] = useState(""); // Default to blank
  const [dateValidationStatus, setDateValidationStatus] = useState("neutral"); // "neutral", "valid", "invalid", "duplicate"
  const [nameValidationStatus, setNameValidationStatus] = useState("neutral"); // "neutral", "valid", "invalid"
  const [lastToastStatus, setLastToastStatus] = useState("neutral"); // Track last toast shown to prevent duplicates
  // Add debounce timer for date validation
  const [dateValidationTimer, setDateValidationTimer] = useState(null);
  // Edit Activity Modal state
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editActivityIndex, setEditActivityIndex] = useState(null);
  const [editActivityDate, setEditActivityDate] = useState(getToday());
  const [editActivityName, setEditActivityName] = useState("");
  const [advisoryId, setAdvisoryId] = useState(null);
  const [activities, setActivities] = useState([]); // dynamic activities from DB
  const [tracking, setTracking] = useState([]); // tracking data from DB
  // Add state for modal view/edit mode and selected activity
  const [activityModalMode, setActivityModalMode] = useState('view'); // 'view' or 'edit'
  const [editActivitySubject, setEditActivitySubject] = useState('');
  const [editActivitySession, setEditActivitySession] = useState('');
  // Add state for edit activity validation
  const [editDateValidationStatus, setEditDateValidationStatus] = useState("neutral"); // "neutral", "valid", "invalid", "duplicate"
  // Add state for saving
  const [savingEdit, setSavingEdit] = useState(false);
  // Add state for saving rating
  const [savingRating, setSavingRating] = useState(false);
  // Pagination state for activities
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 10;
  // Quarters state: null = loading, [] = loaded but empty, [..] = loaded
  const [quarters, setQuarters] = useState(null);
  const [selectedQuarterId, setSelectedQuarterId] = useState(null);

  useEffect(() => {
    fetch('http://localhost/capstone-project/backend/Assessment/get_quarters.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuarters(data);
          if (data.length > 0) setSelectedQuarterId(data[0].quarter_id);
        } else {
          setQuarters([]);
        }
      })
      .catch(() => setQuarters([]));
  }, []);

  // Filter activities by selected quarter's date range
  const selectedQuarter = quarters ? quarters.find(q => q.quarter_id === selectedQuarterId) : null;
  const filteredActivities = selectedQuarter && activities.length > 0
    ? activities.filter(act => {
        const actDate = new Date(act.activity_date);
        const start = new Date(selectedQuarter.start_date);
        const end = new Date(selectedQuarter.end_date);
        return actDate >= start && actDate <= end;
      })
    : activities;
  // Reset page if activities change
  useEffect(() => {
    setActivityPage(1);
  }, [activities.length]);





  // Fetch students and advisory
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dateValidationTimer) {
        clearTimeout(dateValidationTimer);
      }
    };
  }, [dateValidationTimer]);

  useEffect(() => {
    const teacher_id = localStorage.getItem("userId");
    if (!teacher_id) return;
    setLoading(true);
    fetch("http://localhost/capstone-project/backend/Advisory/get_advisory_details.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Check if teacher has an advisory class
        if (!data.advisory || !data.advisory.advisory_id) {
          setStudents([]);
          setLevelId(null);
          setAdvisoryId(null);
          setLoading(false);
          return;
        }
        
        // Filter out inactive students
        const activeStudents = (data.students || []).filter(student => 
          student.stud_school_status !== 'Inactive'
        );
        
        console.log('=== AUTO-DEBUG: Assessment Students ===');
        console.log('Total students in advisory:', data.students?.length || 0);
        console.log('Active students:', activeStudents.length);
        console.log('Inactive students filtered out:', (data.students?.length || 0) - activeStudents.length);
        console.log('Active students list:', activeStudents.map(s => ({ 
          name: `${s.stud_firstname} ${s.stud_lastname}`, 
          status: s.stud_school_status 
        })));
        console.log('=== AUTO-DEBUG: End Assessment Students ===');
        
        setStudents(activeStudents);
        setLevelId(data.advisory?.level_id || null);
        setAdvisoryId(data.advisory?.advisory_id || null);
        
        // Initialize UserContext with advisory photos for real-time updates
        if (data.students && data.parents) {
          initializeAdvisoryPhotos(data.students, data.parents);
        }
        
        // Initialize scores for each active student
        const scoreData = {};
        activeStudents.forEach((s) => {
          scoreData[s.student_id] = Array.from({ length: 22 }, () => "");
        });
        setScores(scoreData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch schedule and subjects
  useEffect(() => {
    if (!levelId) return;
    fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php")
      .then((res) => res.json())
      .then((data) => {
        const sched = data.schedules.find((s) => s.level_id == levelId);
        // Extract unique subjects from schedule
        const subjects = new Set();
        if (sched && sched.schedule) {
          Object.values(sched.schedule).forEach((dayArr) => {
            dayArr.forEach((item) => {
              if (item.subject && item.subject_id) subjects.add(item.subject);
              if (item.subject_name_2 && item.subject_id_2) subjects.add(item.subject_name_2);
            });
          });
        }
        const subjectArr = [...subjects];
        setSubjectOptions(subjectArr);
        setSelectedSubject(subjectArr[0] || "");
      });
  }, [levelId]);

  // Update openModal to accept activityId
  const openModal = (student, activityId) => {
    setModal({ show: true, student, activityId });
    const t = tracking.find(tr => tr.student_id === student.student_id && tr.activity_id === activityId);
    setSelectedIcon(t && t.visual_feedback_shape ? t.visual_feedback_shape : '');
  };

  const saveRating = () => {
    setScores((prev) => {
      const updated = { ...prev };
      updated[modal.student.student_id][modal.activityId] = selectedIcon;
      return updated;
    });
    setModal({ show: false, student: "", activityId: null });
  };

  // Fetch assessment table data
  const fetchAssessmentTable = async (advisoryId, subjectId, session) => {
    if (!advisoryId || !subjectId || !session) return;
    setLoading(true);
    try {
      const resp = await fetch("http://localhost/capstone-project/backend/Assessment/get_assessment_table.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisory_id: advisoryId,
          subject_id: subjectId,
          session_class: session,
        }),
      });
      const data = await resp.json();
      if (data.status === "success") {
        // API now returns only active students, no need for additional filtering
        console.log('=== AUTO-DEBUG: Assessment Table Data ===');
        console.log('Active students from API:', data.students?.length || 0);
        console.log('Activities count:', data.activities?.length || 0);
        console.log('Activities data:', data.activities);
        console.log('Tracking records:', data.tracking?.length || 0);
        console.log('=== AUTO-DEBUG: End Assessment Table Data ===');
        
        setStudents(data.students || []);
        setActivities(data.activities || []);
        setTracking(data.tracking || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch table data when advisoryId, selectedSubject, or selectedSchedule changes
  useEffect(() => {
    let ignore = false;
    const getSubjectId = async () => {
      if (!advisoryId || !selectedSubject || !levelId) return;
      // Find subject_id from schedule API
      let foundSubjectId = null;
      try {
        const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
        const data = await res.json();
        const sched = data.schedules.find((s) => s.level_id == levelId);
        if (sched && sched.schedule) {
          Object.values(sched.schedule).forEach((dayArr) => {
            dayArr.forEach((item) => {
              if (item.subject === selectedSubject && item.subject_id) foundSubjectId = item.subject_id;
              if (item.subject_name_2 === selectedSubject && item.subject_id_2) foundSubjectId = item.subject_id_2;
            });
          });
        }
      } catch (e) {}
      if (foundSubjectId && !ignore) {
        fetchAssessmentTable(advisoryId, foundSubjectId, selectedSchedule);
      }
    };
    getSubjectId();
    return () => { ignore = true; };
  }, [advisoryId, selectedSubject, selectedSchedule, levelId]);

  // Validate date when dependencies change
  useEffect(() => {
    if (newActivityDate && quarters && quarters.length > 0 && advisoryId && newActivitySubject && levelId) {
      validateDateInRealTime(newActivityDate).then(validationResult => {
        // Don't show toast here - let the onChange/onBlur handlers show it
        // This useEffect is just for updating the validation status
      });
    }
  }, [newActivityDate, quarters, advisoryId, newActivitySubject, levelId]);

  // Update name validation status when name changes
  useEffect(() => {
    if (newActivityName.trim() === "") {
      setNameValidationStatus("invalid");
    } else {
      setNameValidationStatus("valid");
    }
  }, [newActivityName]);

  // Reset validation status when subject changes or modal opens
  useEffect(() => {
    if (showAddActivityModal) {
      setDateValidationStatus("neutral");
      setNameValidationStatus("neutral");
    }
  }, [showAddActivityModal]);

  // Re-validate date when subject changes in the modal
  useEffect(() => {
    if (showAddActivityModal && newActivityDate && newActivitySubject) {
      console.log('Subject changed in modal, re-validating date:', { newActivitySubject, newActivityDate });
      // Re-validate the existing date with the new subject
      validateDateInRealTime(newActivityDate);
    }
  }, [newActivitySubject, showAddActivityModal]);

  // After adding activity, re-fetch table data
  const handleAddActivity = async () => {
    // Use the comprehensive validation function
    if (!(await validateCurrentFormState())) {
      return;
    }
    // Find advisory_id and subject_id
    const teacher_id = localStorage.getItem("userId");
    if (!teacher_id || !levelId) {
      toast.error('Missing teacher or advisory information.');
      return;
    }
    // Use advisoryId from state
    if (!advisoryId) {
      toast.error('No advisory found for this teacher.');
      return;
    }
    let subject_id = null;
    let foundSubjectId = null;
    try {
      const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
      const data = await res.json();
      const sched = data.schedules.find((s) => s.level_id == levelId);
      if (sched && sched.schedule) {
        Object.values(sched.schedule).forEach((dayArr) => {
          dayArr.forEach((item) => {
            if (item.subject === newActivitySubject && item.subject_id) foundSubjectId = item.subject_id;
            if (item.subject_name_2 === newActivitySubject && item.subject_id_2) foundSubjectId = item.subject_id_2;
          });
        });
      }
    } catch (e) {}
    if (!foundSubjectId) {
      toast.error('Could not determine subject ID.');
      return;
    }
    subject_id = foundSubjectId;
    // Call backend
    try {
      const resp = await fetch("http://localhost/capstone-project/backend/Assessment/add_activity.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisory_id: advisoryId,
          subject_id,
          session_class: newActivitySession,
          activity_name: newActivityName,
          activity_date: newActivityDate,
          quarter_id: selectedQuarterId, // <-- include quarter_id
        }),
      });
      const result = await resp.json();
      if (result.status === "success") {
        toast.success('Activity added successfully!');
        setShowAddActivityModal(false);
        // Reset form fields and validation status when closing modal
        // Clear any existing validation timer
        if (dateValidationTimer) {
          clearTimeout(dateValidationTimer);
          setDateValidationTimer(null);
        }
        setNewActivityName("");
        setNewActivityDate(getToday()); // Default to today's date
        setNewActivitySubject(subjectOptions[0] || "");
        setNewActivitySession(scheduleOptions[0] || "");
        setSelectedQuarterId(quarters && quarters.length > 0 ? quarters[0].quarter_id : null);
        setDateValidationStatus("neutral");
        setNameValidationStatus("neutral");
        setLastToastStatus("neutral");
        // Re-fetch table data
        fetchAssessmentTable(advisoryId, subject_id, newActivitySession);
      } else {
        toast.error(result.message || 'Failed to add activity.');
      }
    } catch (e) {
      toast.error('Network or server error.');
    }
  };

  // Helper to get tracking value for a student/activity
  const getTrackingShape = (studentId, activityId) => {
    const t = tracking.find(
      (tr) => tr.student_id === studentId && tr.activity_id === activityId
    );
    return t ? t.visual_feedback_shape : '';
  };

  // Visual feedback state
  const [visualFeedback, setVisualFeedback] = useState([]);
  useEffect(() => {
    fetch("http://localhost/capstone-project/backend/Assessment/get_visual_feedback.php")
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && Array.isArray(data.feedback)) {
          setVisualFeedback(data.feedback);
        }
      });
  }, []);
  // Helper to format date as 'Month Day, Year'
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Helper to parse date strings consistently (handles MM/DD/YYYY format)
  function parseDate(dateStr) {
    if (!dateStr) return null;
    
    if (dateStr.includes('/')) {
      // Parse MM/DD/YYYY format
      const [month, day, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle other formats (YYYY-MM-DD, etc.)
      return new Date(dateStr);
    }
  }

  // Helper to get quarter date ranges
  const getQuarterDateRanges = () => {
    if (!quarters || quarters.length === 0) return { startDate: null, endDate: null };
    
    const quarter1 = quarters.find(q => q.quarter_id === 1);
    const quarter4 = quarters.find(q => q.quarter_id === 4);
    
    if (!quarter1 || !quarter4) return { startDate: null, endDate: null };
    
    return {
      startDate: quarter1.start_date,
      endDate: quarter4.end_date
    };
  };

  // Open modal for activity details (view mode)
  const openActivityModal = (activityIdx) => {
    const act = activities[activityIdx];
    setEditActivityIndex(activityIdx);
    setEditActivityDate(act.activity_date);
    setEditActivityName(act.activity_name);
    setEditActivitySubject(selectedSubject);
    setEditActivitySession(selectedSchedule);
    setActivityModalMode('view');
    setEditDateValidationStatus("neutral"); // Reset validation status
    setShowEditActivityModal(true);
  };

  // Save edited activity
  const handleSaveEditActivity = async () => {
    // Use the comprehensive validation function
    if (!(await validateEditFormState())) {
      return;
    }
    setSavingEdit(true);
    try {
      const activity = activities[editActivityIndex];
      const resp = await fetch('http://localhost/capstone-project/backend/Assessment/update_activity.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activity.activity_id,
          activity_name: editActivityName,
          activity_date: editActivityDate
        })
      });
      const result = await resp.json();
      if (result.status === 'success') {
        toast.success('Activity updated successfully!');
        setShowEditActivityModal(false);
        setEditDateValidationStatus("neutral"); // Reset validation status
        // Refresh table
        let foundSubjectId = null;
        try {
          const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
          const data = await res.json();
          const sched = data.schedules.find((s) => s.level_id == levelId);
          if (sched && sched.schedule) {
            Object.values(sched.schedule).forEach((dayArr) => {
              dayArr.forEach((item) => {
                if (item.subject === selectedSubject && item.subject_id) foundSubjectId = item.subject_id;
                if (item.subject_name_2 === selectedSubject && item.subject_id_2) foundSubjectId = item.subject_id_2;
              });
            });
          }
        } catch (e) {}
        if (foundSubjectId) {
          fetchAssessmentTable(advisoryId, foundSubjectId, selectedSchedule);
        }
      } else {
        toast.error(result.message || 'Failed to update activity.');
      }
    } catch (e) {
      toast.error('Network or server error.');
    }
    setSavingEdit(false);
    setActivityModalMode('view');
  };

  // Save student rating (shape) - auto-save when shape is clicked
  const handleSaveRating = async (selectedShape) => {
    if (!selectedShape || !modal.student || !modal.activityId) return;
    setSavingRating(true);
    try {
      const student_id = modal.student.student_id;
      const activity_id = modal.activityId;
      // Find visual_feedback_id for selectedShape
      const feedback = visualFeedback.find(fb => fb.visual_feedback_shape === selectedShape);
      if (!feedback) return;
      const visual_feedback_id = feedback.visual_feedback_id;
      const resp = await fetch('http://localhost/capstone-project/backend/Assessment/save_rating.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, activity_id, visual_feedback_id })
      });
      const result = await resp.json();
      if (result.status === 'success') {
        toast.success('Rating saved successfully!');
        // Optimistically update tracking state
        setTracking(prev => {
          const updated = prev.filter(tr => !(tr.student_id === student_id && tr.activity_id === activity_id));
          updated.push({
            student_id,
            activity_id,
            visual_feedback_shape: selectedShape
          });
          return updated;
        });
        setModal({ show: false, student: '', activityId: null });
        // Auto-update quarter feedback summary for this student/activity/subject/quarter
        const activity = activities.find(a => a.activity_id === activity_id);
        let subject_id = activity ? activity.subject_id : undefined;
        // Fallback: if subject_id is missing, use the subject_id from the current table view
        if (!subject_id) {
          // Try to get subject_id from selectedSubject and schedule
          let foundSubjectId = null;
          try {
            const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
            const data = await res.json();
            const sched = data.schedules.find((s) => s.level_id == levelId);
            if (sched && sched.schedule) {
              Object.values(sched.schedule).forEach((dayArr) => {
                dayArr.forEach((item) => {
                  if (item.subject === selectedSubject && item.subject_id) foundSubjectId = item.subject_id;
                  if (item.subject_name_2 === selectedSubject && item.subject_id_2) foundSubjectId = item.subject_id_2;
                });
              });
            }
          } catch (e) {}
          subject_id = foundSubjectId;
        }
        const quarter_id = activity && activity.quarter_id ? activity.quarter_id : 1; // Default to 1 if not present
        // Add logging for the payload
        console.log('Sending to update_quarter_feedback.php:', { student_id, quarter_id, subject_id });
        if (!student_id || !subject_id || !quarter_id) {
          console.error('Missing parameters for quarterly feedback:', { student_id, quarter_id, subject_id });
          toast.error('Failed to update quarterly feedback: missing data.');
        } else {
          try {
            const resp = await fetch('http://localhost/capstone-project/backend/Assessment/update_quarter_feedback.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student_id,
                quarter_id,
                subject_id
              })
            });
            const result = await resp.json();
            if (result.status !== 'success') {
              toast.error(result.message || 'Failed to update quarterly feedback.');
            }
          } catch (err) {
            toast.error('Network or server error (quarter feedback).');
            console.error('Error calling update_quarter_feedback.php:', err);
          }
        }
        // Refresh table
        let foundSubjectId = null;
        try {
          const res = await fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php");
          const data = await res.json();
          const sched = data.schedules.find((s) => s.level_id == levelId);
          if (sched && sched.schedule) {
            Object.values(sched.schedule).forEach((dayArr) => {
              dayArr.forEach((item) => {
                if (item.subject === selectedSubject && item.subject_id) foundSubjectId = item.subject_id;
                if (item.subject_name_2 === selectedSubject && item.subject_id_2) foundSubjectId = item.subject_id_2;
              });
            });
          }
        } catch (e) {}
        if (foundSubjectId) {
          fetchAssessmentTable(advisoryId, foundSubjectId, selectedSchedule);
        }
      } else {
        toast.error(result.message || 'Failed to save rating.');
      }
    } catch (e) {
      toast.error('Network or server error.');
    }
    setSavingRating(false);
  };

  // Sort activities by date descending so newest appear first across pagination
  const activitiesByDateDesc = [...filteredActivities].sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date));
  const totalPages = Math.ceil(activitiesByDateDesc.length / activitiesPerPage);
  const start = (activityPage - 1) * activitiesPerPage;
  const end = start + activitiesPerPage;
  const paginatedActivities = activitiesByDateDesc.slice(start, end);

  return (
    <main className="flex-1">
      {/* Controls Section */}
      {advisoryId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Subjects Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <button
                  className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-[#232c67] focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-all duration-200"
                  onClick={() => {
                    setIsSubjectDropdownOpen((open) => !open);
                    setIsScheduleDropdownOpen(false);
                    setIsQuarterDropdownOpen(false);
                  }}
                  disabled={subjectOptions.length === 0}
                  style={{ minHeight: '2rem' }}
                >
                  <FaClipboardCheck className="text-gray-400" />
                  <span>{selectedSubject || "None"}</span>
                  <FaChevronDown className={`text-sm transition-transform duration-200 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSubjectDropdownOpen && subjectOptions.length > 0 && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      {subjectOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedSubject(option);
                            closeAllDropdowns();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-[#232c67] hover:text-white transition-all duration-150 ${
                            selectedSubject === option ? "bg-[#232c67] text-white" : "text-gray-900"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <button
                  className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-[#232c67] focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-all duration-200"
                  onClick={() => {
                    setIsScheduleDropdownOpen((open) => !open);
                    setIsSubjectDropdownOpen(false);
                    setIsQuarterDropdownOpen(false);
                  }}
                  style={{ minHeight: '2rem' }}
                >
                  <FaCalendarAlt className="text-gray-400" />
                  <span>{selectedSchedule}</span>
                  <FaChevronDown className={`text-sm transition-transform duration-200 ${isScheduleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isScheduleDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      {scheduleOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedSchedule(option);
                            closeAllDropdowns();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-[#232c67] hover:text-white transition-all duration-150 ${
                            selectedSchedule === option ? "bg-[#232c67] text-white" : "text-gray-900"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quarter Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                <button
                  className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-[#232c67] focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-all duration-200"
                  onClick={() => {
                    setIsQuarterDropdownOpen((open) => !open);
                    setIsSubjectDropdownOpen(false);
                    setIsScheduleDropdownOpen(false);
                  }}
                  disabled={!quarters || quarters.length === 0}
                  style={{ minHeight: '2rem' }}
                >
                  <FaClipboardCheck className="text-gray-400" />
                  <span>
                    {quarters === null
                      ? "Loading..."
                      : quarters.length === 0
                        ? "No quarters"
                        : quarters.find(q => q.quarter_id === selectedQuarterId)?.quarter_name || "Select Quarter"}
                  </span>
                  <FaChevronDown className={`text-sm transition-transform duration-200 ${isQuarterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isQuarterDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      {quarters === null ? (
                        <div className="px-3 py-2 text-gray-400 text-sm">Loading...</div>
                      ) : quarters.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400 text-sm">No quarters found</div>
                      ) : (
                        quarters.map((q) => (
                          <button
                            key={q.quarter_id}
                            onClick={() => {
                              setSelectedQuarterId(q.quarter_id);
                              closeAllDropdowns();
                            }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-[#232c67] hover:text-white transition-all duration-150 ${
                              selectedQuarterId === q.quarter_id ? 'bg-[#232c67] text-white' : 'text-gray-900'
                            }`}
                          >
                            {q.quarter_name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Student Count Badge */}
              <div className="flex items-center gap-2 px-2 py-0.5 bg-[#232c67]/10 rounded-full">
                <FaUsers className="text-blue-600 text-sm" />
                <span className="text-sm font-medium text-[#232c67]">
                  {students.length} {students.length === 1 ? 'Student' : 'Students'}
                </span>
              </div>
            </div>

            {/* Add Activity Button */}
            <button
              className="flex items-center gap-2 px-6 py-1.5 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
              onClick={() => {
                setShowAddActivityModal(true);
                closeAllDropdowns();
                // Reset form fields and validation status when opening modal
                const todayDate = getToday();
                console.log('Opening modal, setting date to:', todayDate);
                // Clear any existing validation timer
                if (dateValidationTimer) {
                  clearTimeout(dateValidationTimer);
                  setDateValidationTimer(null);
                }
                setNewActivityName("");
                setNewActivityDate(todayDate); // Default to today's date
                setNewActivitySubject(subjectOptions[0] || "");
                setNewActivitySession(scheduleOptions[0] || "");
                setSelectedQuarterId(quarters && quarters.length > 0 ? quarters[0].quarter_id : null);
                setDateValidationStatus("neutral");
                setNameValidationStatus("neutral");
                setLastToastStatus("neutral");
              }}
            >
              <FaClipboardList className="text-sm" />
              Add Activity
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#232c67] mb-4"></div>
            <p className="text-lg font-medium">Loading assessment data...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
          </div>
        ) : !advisoryId ? (
          <div className="flex flex-col justify-center items-center h-80 text-center px-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FaUsers className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Advisory Class Assigned</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              You don't have an advisory class assigned yet. Please contact your administrator to set up your advisory class before you can manage assessments.
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-80 text-center px-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FaClipboardCheck className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students in {selectedSchedule} Session</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              There are no students assigned to the {selectedSchedule.toLowerCase()} session. Try contact your administrator if this is incorrect.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className={students.length > 6 ? "overflow-y-auto" : ""} style={students.length > 6 ? { maxHeight: 'calc(100vh - 400px)' } : {}}>
              <table className="min-w-full text-sm text-gray-900" style={{ width: '100%', tableLayout: 'fixed' }}>
                                  <thead className={`bg-[#232c67] text-white border-b border-[#1a1f4d] ${students.length > 6 ? "sticky top-0 z-10" : ""}`}>
                  <tr>
                    <th
                      className="sticky top-0 left-0 text-left px-6 py-3 font-semibold text-white z-20 bg-[#232c67]"
                      style={{ width: '50%' }}
                    >
                      Student Name
                    </th>
                    {paginatedActivities.map((act, idx) => (
                      <th
                        key={act.activity_id}
                        className="sticky top-0 px-4 py-3 whitespace-nowrap font-medium text-white bg-[#232c67] border-l border-[#1a1f4d] text-center cursor-pointer relative group hover:bg-[#2b3572] transition-colors z-10"
    
                        style={{ width: '20%' }}
                        onClick={() => openActivityModal(activities.indexOf(act))}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-semibold text-white">Activity {act.activity_num}</span>
                          <span className="text-xs text-white">{formatDate(act.activity_date)}</span>
                        </div>
                        <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          View details
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students
                    .sort((a, b) => {
                      // Sort by last name alphabetically
                      const lastA = (a.stud_lastname || '').toLowerCase();
                      const lastB = (b.stud_lastname || '').toLowerCase();
                      if (lastA < lastB) return -1;
                      if (lastA > lastB) return 1;
                      // If last names are equal, sort by first name
                      const firstA = (a.stud_firstname || '').toLowerCase();
                      const firstB = (b.stud_firstname || '').toLowerCase();
                      return firstA.localeCompare(firstB);
                    })
                    .map((student, sIdx) => {
                    const name = student.stud_lastname + ', ' + student.stud_firstname + (student.stud_middlename ? ' ' + student.stud_middlename : '');
                    return (
                      <tr key={sIdx} className="hover:bg-gray-50 transition-colors">
                        <td
                          className={`sticky left-0 bg-white px-6 font-medium whitespace-nowrap z-0 border-r border-gray-200 ${students.length > 6 ? 'py-2' : 'py-3'}`}
                          style={{ width: '50%' }}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              // Get real-time photo from UserContext, fallback to student.photo if not available
                              const realTimePhoto = getStudentPhoto(student.student_id) || student.photo;
                              
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
                            <div className="font-medium text-gray-900 flex-1 min-w-0 truncate">{name}</div>
                          </div>
                        </td>
                        {paginatedActivities.map((act) => (
                          <td key={act.activity_id} className={`px-4 text-center border-l border-gray-200 ${students.length > 6 ? 'py-2' : 'py-3'}`} style={{ width: '20%' }}>
                            <div
                              className={`w-8 h-8 rounded-lg border border-gray-300 flex justify-center items-center mx-auto text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                                getTrackingShape(student.student_id, act.activity_id) ? "bg-white" : "bg-gray-100"
                              }`}
                              onClick={() => openModal(student, act.activity_id)}
                            >
                              {getTrackingShape(student.student_id, act.activity_id) && (
                                <span style={{ color: shapeColorMap[getTrackingShape(student.student_id, act.activity_id)] || 'inherit' }}>
                                  {getTrackingShape(student.student_id, act.activity_id)}
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {students.length > 0 && totalPages > 0 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          {/* Left Arrow */}
          <button
            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
            disabled={activityPage === 1}
            aria-label="Previous page"
          >
            <span className="text-lg">&lt;</span>
          </button>
          
          {/* Smart Pagination with Ellipsis */}
          {(() => {
            const maxVisible = 7;
            const items = [];
            
            if (totalPages <= maxVisible) {
              // If total pages is less than max visible, show all pages
              for (let i = 1; i <= totalPages; i++) {
                items.push({ type: 'page', page: i });
              }
            } else {
              // Always show first page
              items.push({ type: 'page', page: 1 });
              
              if (activityPage <= 4) {
                // Near the beginning: show first 5 pages + ellipsis + last page
                for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                  items.push({ type: 'page', page: i });
                }
                if (totalPages > 5) {
                  items.push({ type: 'ellipsis' });
                }
                if (totalPages > 1) {
                  items.push({ type: 'page', page: totalPages });
                }
              } else if (activityPage >= totalPages - 3) {
                // Near the end: show first page + ellipsis + last 5 pages
                items.push({ type: 'ellipsis' });
                for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
                  items.push({ type: 'page', page: i });
                }
              } else {
                // In the middle: show first + ellipsis + current page ±2 + ellipsis + last
                items.push({ type: 'ellipsis' });
                for (let i = activityPage - 2; i <= activityPage + 2; i++) {
                  items.push({ type: 'page', page: i });
                }
                items.push({ type: 'ellipsis' });
                items.push({ type: 'page', page: totalPages });
              }
            }
            
            return items.map((item, index) => {
              if (item.type === 'page') {
                const isActive = item.page === activityPage;
                return (
                  <button
                    key={`page-${item.page}`}
                    onClick={() => setActivityPage(item.page)}
                    className={
                      isActive
                        ? "w-10 h-10 rounded-lg bg-[#232c67] text-white text-sm font-semibold flex items-center justify-center"
                        : "w-10 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
                    }
                    disabled={isActive}
                  >
                    {item.page}
                  </button>
                );
              } else if (item.type === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 text-sm font-medium"
                  >
                    ...
                  </span>
                );
              }
              return null;
            });
          })()}
          
          {/* Right Arrow */}
          <button
            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:ring-2 focus:ring-[#232c67]"
            onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
            disabled={activityPage === totalPages || filteredActivities.length === 0}
            aria-label="Next page"
          >
            <span className="text-lg">&gt;</span>
          </button>
        </div>
      )}

      {modal.show && (() => {
        const modalActivity = activities.find(a => a.activity_id === modal.activityId);
        return (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-30 p-2 sm:p-0">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
                              <div className="bg-[#232c67] text-white px-6 py-4 font-bold text-xl">
                  Rate the Student
                </div>
              <div className="p-6">
                <div className="mb-3 flex items-center">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mr-2">Student Name:</span>
                  <span className="text-sm font-medium text-[#232c67]">
                    {modal.student.stud_lastname}, {modal.student.stud_firstname}{modal.student.stud_middlename ? ' ' + modal.student.stud_middlename : ''}
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mr-2">Activity:</span>
                    <span className="text-sm font-medium text-[#232c67]">
                      {modalActivity ? modalActivity.activity_name : ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mr-2">Date:</span>
                    <span className="text-sm font-medium text-[#232c67]">
                      {modalActivity ? formatDate(modalActivity.activity_date) : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {visualFeedback.map((fb) => (
                    <div
                      key={fb.visual_feedback_id}
                      className={`flex flex-col items-center justify-center cursor-pointer p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#232c67]/40 transition-all duration-150 ${
                        selectedIcon === fb.visual_feedback_shape ? "ring-2 ring-[#232c67] bg-[#232c67]/5 border-[#232c67]" : ""
                      }`}
                      onClick={() => {
                        setSelectedIcon(fb.visual_feedback_shape);
                        handleSaveRating(fb.visual_feedback_shape);
                      }}
                    >
                      <div className="text-xl sm:text-2xl mb-1.5" style={{ color: shapeColorMap[fb.visual_feedback_shape] || 'inherit' }}>{fb.visual_feedback_shape}</div>
                      <div className="text-xs font-medium text-gray-600 text-center leading-tight">{fb.visual_feedback_description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="flex justify-end gap-2">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                    onClick={() => {
                      setModal({ show: false, student: '', activityId: null });
                      closeAllDropdowns();
                    }}
                    disabled={savingRating}
                  >
                    <FaTimes className="text-sm" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-[#232c67] text-white px-6 py-4 font-bold text-2xl">
              Add Activity
            </div>
            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Subject</label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-[#232c67] font-medium focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-all duration-200 cursor-pointer hover:border-[#232c67] text-left flex items-center justify-between"
                    onClick={() => setIsAddActivitySubjectDropdownOpen(!isAddActivitySubjectDropdownOpen)}
                  >
                    <span>{newActivitySubject || "Select Subject"}</span>
                    <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${isAddActivitySubjectDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isAddActivitySubjectDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-200">
                      {subjectOptions.map((subject, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-[#232c67] hover:text-white transition-all duration-150 ${
                            newActivitySubject === subject ? 'bg-[#232c67] text-white' : 'text-gray-900'
                          }`}
                          onClick={async () => {
                            setNewActivitySubject(subject);
                            setIsAddActivitySubjectDropdownOpen(false);
                            
                            // Re-validate the date when subject changes to check for duplicates
                            if (newActivityDate && newActivityDate.length === 10) {
                              const validationResult = await validateDateInRealTime(newActivityDate);
                              if (validationResult === "duplicate") {
                                setDateValidationStatus("duplicate");
                                setLastToastStatus("duplicate");
                              } else if (validationResult === "invalid") {
                                setDateValidationStatus("invalid");
                                setLastToastStatus("invalid");
                              } else if (validationResult === "valid") {
                                setDateValidationStatus("valid");
                                setLastToastStatus("valid");
                              }
                            }
                          }}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Session</label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-[#232c67] font-medium focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-all duration-200 cursor-pointer hover:border-[#232c67] text-left flex items-center justify-between"
                    onClick={() => setIsAddActivitySessionDropdownOpen(!isAddActivitySessionDropdownOpen)}
                  >
                    <span>{newActivitySession || "Select Session"}</span>
                    <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${isAddActivitySessionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isAddActivitySessionDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-200">
                      {scheduleOptions.map((session, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-[#232c67] hover:text-white transition-all duration-150 ${
                            newActivitySession === session ? 'bg-[#232c67] text-white' : 'text-gray-900'
                          }`}
                          onClick={async () => {
                            setNewActivitySession(session);
                            setIsAddActivitySessionDropdownOpen(false);
                            
                            // Re-validate the date when session changes to check for duplicates
                            if (newActivityDate && newActivityDate.length === 10) {
                              const validationResult = await validateDateInRealTime(newActivityDate);
                              if (validationResult === "duplicate") {
                                setDateValidationStatus("duplicate");
                                setLastToastStatus("duplicate");
                              } else if (validationResult === "invalid") {
                                setDateValidationStatus("invalid");
                                setLastToastStatus("invalid");
                              } else if (validationResult === "valid") {
                                setDateValidationStatus("valid");
                                setLastToastStatus("valid");
                              }
                            }
                          }}
                        >
                          {session}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity Name</label>
                <input
                  type="text"
                  className={`w-full bg-white border-2 rounded-lg shadow-sm px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 transition-all duration-200 caret-[#232c67] ${
                    (() => {
                      switch (nameValidationStatus) {
                        case "valid":
                          return "border-green-500 focus:ring-green-200";
                        case "invalid":
                          return "border-red-500 focus:ring-red-200";
                        default:
                          return "border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]";
                      }
                    })()
                  }`}
                  placeholder="Enter activity name"
                  value={newActivityName}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length === 0) {
                      setNewActivityName("");
                      setNameValidationStatus("invalid");
                    } else {
                      setNewActivityName(val.charAt(0).toUpperCase() + val.slice(1));
                      setNameValidationStatus("valid");
                    }
                  }}
                  onBlur={() => {
                    // Update validation status when user leaves the field
                    if (newActivityName.trim() === "") {
                      setNameValidationStatus("invalid");
                    } else {
                      setNameValidationStatus("valid");
                    }
                  }}
                />
                
                {/* Error message for empty activity name - INSIDE the modal */}
                {nameValidationStatus === "invalid" && newActivityName.trim() === "" && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Activity name cannot be empty.
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity Date</label>
                <input
                  type="date"
                  className={`w-full bg-white border-2 rounded-lg shadow-sm px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 transition-all duration-200 caret-[#232c67] ${
                    (() => {
                      switch (dateValidationStatus) {
                        case "valid":
                          return "border-green-500 focus:ring-green-200";
                        case "invalid":
                          return "border-red-500 focus:ring-red-200";
                        case "duplicate":
                          return "border-red-500 focus:ring-red-200";
                        default:
                          return "border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]";
                      }
                    })()
                  }`}
                  value={newActivityDate}
                  onChange={async (e) => {
                    const newDate = e.target.value;
                    setNewActivityDate(newDate);
                    
                    console.log('Date changed to:', newDate);
                    
                    // Clear any existing timer
                    if (dateValidationTimer) {
                      clearTimeout(dateValidationTimer);
                    }
                    
                    // Only validate if the date is complete (has 10 characters: YYYY-MM-DD)
                    if (newDate.length === 10) {
                      // Validate date immediately for complete dates
                      const validationResult = await validateDateInRealTime(newDate);
                      console.log('Validation result for complete date:', validationResult);
                      
                      // Update validation status for UI display (no more toasts)
                      if (validationResult === "duplicate") {
                        setDateValidationStatus("duplicate");
                        setLastToastStatus("duplicate");
                      } else if (validationResult === "invalid") {
                        setDateValidationStatus("invalid");
                        setLastToastStatus("invalid");
                      } else if (validationResult === "valid") {
                        setDateValidationStatus("valid");
                        setLastToastStatus("valid");
                      }
                    } else {
                      // For incomplete dates, set a timer to validate after user stops typing
                      const timer = setTimeout(async () => {
                        if (newDate.length === 10) { // Double-check it's still complete
                          const validationResult = await validateDateInRealTime(newDate);
                          console.log('Debounced validation result:', validationResult);
                          
                          // Update validation status for UI display (no more toasts)
                          if (validationResult === "duplicate") {
                            setDateValidationStatus("duplicate");
                            setLastToastStatus("duplicate");
                          } else if (validationResult === "invalid") {
                            setDateValidationStatus("invalid");
                            setLastToastStatus("invalid");
                          } else if (validationResult === "valid") {
                            setDateValidationStatus("valid");
                            setLastToastStatus("valid");
                          }
                        }
                      }, 500); // Wait 500ms after user stops typing
                      
                      setDateValidationTimer(timer);
                    }
                  }}
                  onBlur={async () => {
                    // Additional validation on blur if needed
                    // Main validation is now handled in onChange for immediate feedback
                  }}
                  min={getQuarterDateRanges().startDate || "2025-08-01"}
                  max={getQuarterDateRanges().endDate || "2026-04-30"}
                />


                {/* Error message display for date validation - INSIDE the modal */}
                {dateValidationStatus === "invalid" && newActivityDate && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {(() => {
                        if (quarters && quarters.length > 0) {
                          const quarter1 = quarters.find(q => q.quarter_id === 1);
                          const quarter4 = quarters.find(q => q.quarter_id === 4);
                          
                          if (quarter1 && quarter4) {
                            const startFormatted = new Date(quarter1.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                            const endFormatted = new Date(quarter4.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                            return `Date must be between ${startFormatted} and ${endFormatted}.`;
                          }
                        }
                        return "Date is outside the allowed school year range.";
                      })()}
                    </div>
                  </div>
                )}

                {/* Duplicate date error message - INSIDE the modal */}
                {dateValidationStatus === "duplicate" && newActivityDate && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      An activity already exists on this date for this subject in this advisory.
                    </div>
                  </div>
                )}

              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-4 pt-8 pb-6 px-6">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setShowAddActivityModal(false);
                  closeAllDropdowns();
                  // Reset form fields and validation status when closing modal
                  // Clear any existing validation timer
                  if (dateValidationTimer) {
                    clearTimeout(dateValidationTimer);
                    setDateValidationTimer(null);
                  }
                  setNewActivityName("");
                  setNewActivityDate(getToday()); // Default to today's date
                  setNewActivitySubject(subjectOptions[0] || "");
                  setNewActivitySession(scheduleOptions[0] || "");
                  setSelectedQuarterId(quarters && quarters.length > 0 ? quarters[0].quarter_id : null);
                  setDateValidationStatus("neutral");
                  setNameValidationStatus("neutral");
                  setLastToastStatus("neutral");
                }}
              >
                <FaTimes className="text-sm" />
                Close
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow transition-colors ${
                  newActivityName.trim() === '' ||
                  !getQuarterDateRanges().startDate ||
                  !getQuarterDateRanges().endDate ||
                  newActivityDate < getQuarterDateRanges().startDate ||
                  newActivityDate > getQuarterDateRanges().endDate ||
                  dateValidationStatus === "duplicate" ||
                  dateValidationStatus === "invalid"
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-[#232c67] text-white hover:bg-[#1a1f4d] cursor-pointer"
                }`}
                onClick={() => {
                  if (validateCurrentFormState()) {
                    handleAddActivity();
                  }
                }}
                disabled={
                  newActivityName.trim() === '' ||
                  !getQuarterDateRanges().startDate ||
                  !getQuarterDateRanges().endDate ||
                  newActivityDate < getQuarterDateRanges().startDate ||
                  newActivityDate > getQuarterDateRanges().endDate ||
                  dateValidationStatus === "duplicate" ||
                  dateValidationStatus === "invalid"
                }
              >
                <FaPlusSquare className="text-sm" />
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/View Activity Modal */}
      {showEditActivityModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-30 p-2 sm:p-0">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-[#232c67] text-white px-6 py-4 font-bold text-xl">
              {activityModalMode === 'view' ? 'View Activity Details' : 'Edit Activity'}
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Subject</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-base font-medium text-[#232c67]">{editActivitySubject}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Session</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-base font-medium text-[#232c67]">{editActivitySession}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity Name</label>
                {activityModalMode === 'view' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-base font-medium text-[#232c67]">{editActivityName}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    className={`w-full bg-white border-2 rounded-lg shadow-sm px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 transition-all duration-200 caret-[#232c67] ${
                      editActivityName.trim() === "" 
                        ? "border-red-500 focus:ring-red-200" 
                        : "border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]"
                    }`}
                    value={editActivityName}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.length === 0) {
                        setEditActivityName("");
                      } else {
                        setEditActivityName(val.charAt(0).toUpperCase() + val.slice(1));
                      }
                      
                      // Note: Real-time toast validation removed to prevent false errors
                      // Validation now only happens on form submission
                    }}
                    onFocus={() => {
                      // Show validation immediately when user focuses on the field
                      if (editActivityName.trim() === "") {
                        // The visual feedback (red border and status) will show immediately
                        // No toast needed here, just visual feedback
                      }
                    }}
                  />
                )}
                {/* Error message for empty activity name - INSIDE the modal */}
                {activityModalMode === 'edit' && editActivityName.trim() === "" && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Activity name cannot be empty.
                    </div>
                  </div>
                )}
                {/* Error display for edit activity name */}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Activity Date</label>
                {activityModalMode === 'view' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-base font-medium text-[#232c67]">{formatDate(editActivityDate)}</span>
                  </div>
                ) : (
                  <input
                    type="date"
                    className={`w-full bg-white border-2 rounded-lg shadow-sm px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 transition-all duration-200 caret-[#232c67] ${
                      (() => {
                        switch (editDateValidationStatus) {
                          case "valid":
                            return "border-green-500 focus:ring-green-200";
                          case "invalid":
                            return "border-red-500 focus:ring-red-200";
                          case "duplicate":
                            return "border-red-500 focus:ring-red-200";
                          default:
                            return "border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]";
                        }
                      })()
                    }`}
                    value={editActivityDate}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setEditActivityDate(newDate);
                      
                      // Validate date in real-time for edit mode
                      if (newDate && newDate.length === 10) {
                        await validateEditDateInRealTime(newDate);
                      }
                    }}
                    min={getQuarterDateRanges().startDate || "2025-08-01"}
                    max={getQuarterDateRanges().endDate || "2026-04-30"}
                  />
                )}
                {/* Error message for edit activity date - INSIDE the modal */}
                {activityModalMode === 'edit' && editDateValidationStatus === "invalid" && editActivityDate && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Date is outside the allowed school year range.
                    </div>
                  </div>
                )}
                {/* Error display for edit activity date */}
              </div>
              
              {/* Duplicate date error message for edit activity - INSIDE the modal */}
              {activityModalMode === 'edit' && editDateValidationStatus === "duplicate" && editActivityDate && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    An activity with the same date already exists for this subject in this advisory.
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setShowEditActivityModal(false);
                  setEditDateValidationStatus("neutral"); // Reset validation status
                  closeAllDropdowns();
                }}
              >
                <FaTimes className="text-sm" />
                Close
              </button>
              {activityModalMode === 'view' ? (
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-full font-semibold hover:bg-[#1a1f4d] shadow transition-colors"
                  onClick={() => {
                    setActivityModalMode('edit');
                    setEditDateValidationStatus("neutral"); // Reset validation status when switching to edit mode
                    // Trigger validation for the current date if it exists
                    if (editActivityDate) {
                      setTimeout(() => validateEditDateInRealTime(editActivityDate), 100);
                    }
                  }}
                >
                  <FaEdit className="text-sm" />
                  Edit Activity
                </button>
              ) : (
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow transition-colors ${
                    editActivityName.trim() === '' ||
                    !getQuarterDateRanges().startDate ||
                    !getQuarterDateRanges().endDate ||
                    editActivityDate < getQuarterDateRanges().startDate ||
                    editActivityDate > getQuarterDateRanges().endDate ||
                    editDateValidationStatus === "duplicate" ||
                    savingEdit
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-[#232c67] text-white hover:bg-[#1a1f4d] cursor-pointer"
                  }`}
                  onClick={() => {
                    if (validateEditFormState()) {
                      handleSaveEditActivity();
                    }
                  }}
                  disabled={
                    editActivityName.trim() === '' ||
                    !getQuarterDateRanges().startDate ||
                    !getQuarterDateRanges().endDate ||
                    editActivityDate < getQuarterDateRanges().startDate ||
                    editActivityDate > getQuarterDateRanges().endDate ||
                    editDateValidationStatus === "duplicate" ||
                    savingEdit
                  }
                >
                  {savingEdit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="text-sm" />
                      Save
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}