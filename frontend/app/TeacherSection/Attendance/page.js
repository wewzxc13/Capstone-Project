"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FaBell, FaCog, FaChevronDown, FaCalendarAlt, FaUsers, FaClipboardCheck, FaCheck, FaTimes, FaUser } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../Context/UserContext";

// Add a simple modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 w-full max-w-[500px] max-h-[85vh] md:max-h-[95vh] overflow-y-auto relative border border-gray-100">
        {children}
      </div>
    </div>
  );
}

// Custom date input component for better UX
const CustomDateInput = React.memo(function CustomDateInput({ value, onChange, min, max, isValid }) {
  // Ensure the value is always in YYYY-MM-DD format
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse other formats and convert to YYYY-MM-DD
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Ensure the onChange receives the value in YYYY-MM-DD format
    if (inputValue) {
      const formattedDate = formatDateForInput(inputValue);
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  // Determine border color based on validation status
  const getBorderColor = () => {
    if (isValid === undefined) return 'border-gray-300'; // Default state
    if (isValid === null) return 'border-gray-300'; // No validation yet
    return isValid ? 'border-green-500' : 'border-red-500';
  };

  // Determine focus ring color based on validation status
  const getFocusRingColor = () => {
    if (isValid === undefined) return 'focus:ring-[#232c67] focus:border-[#232c67]'; // Default state
    if (isValid === null) return 'focus:ring-[#232c67] focus:border-[#232c67]'; // No validation yet
    return isValid ? 'focus:ring-green-500 focus:border-green-500' : 'focus:ring-red-500 focus:border-red-500';
  };

  return (
    <input
      type="date"
      className={`w-full border rounded-lg px-4 py-3 text-gray-700 focus:ring-2 transition-colors shadow-sm hover:shadow-md ${getBorderColor()} ${getFocusRingColor()}`}
      value={formatDateForInput(value) || ''}
      onChange={handleChange}
      min={min}
      max={max}
      placeholder="YYYY-MM-DD"
    />
  );
});

// Add this component at the top level of the file
const StudentCheckboxList = React.memo(function StudentCheckboxList({ students, checkedStudents, handleCheckStudent, modalSession, getStudentPhoto }) {
  const filtered = students.filter(student => {
    if (!student.stud_schedule_class) return true;
    return (
      (modalSession === 'Morning' && student.stud_schedule_class === 'Morning') ||
      (modalSession === 'Afternoon' && student.stud_schedule_class === 'Afternoon')
    );
  });
  
  if (!modalSession || modalSession === '') {
    return <div className="flex items-center justify-center h-full p-4 text-gray-500 italic">Select a session to view students.</div>;
  }
  
  if (filtered.length === 0) {
    return <div className="flex items-center justify-center h-full p-4 text-gray-500 italic">No students in this session.</div>;
  }
  
  return (
    <div className="divide-y divide-gray-200 h-full min-h-[80px]">
      {filtered.map((student, idx) => {
        const key = student.student_id;
        const name = student.stud_lastname + ', ' + student.stud_firstname + (student.stud_middlename ? ' ' + student.stud_middlename : '');
        const checked = Boolean(checkedStudents[key]);
        return (
          <div key={key} className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 transition-colors">
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
                        className="w-6 h-6 rounded-full object-cover shadow-sm shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Fallback icon that shows when photo fails to load */}
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 hidden">
                        <FaUser className="text-xs text-blue-600" />
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <FaUser className="text-xs text-blue-600" />
                    </div>
                  );
                }
              })()}
              <span className="font-medium text-gray-800">{name}</span>
            </div>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleCheckStudent(key)}
              className="w-5 h-5 border border-gray-300 rounded focus:ring-2 focus:ring-[#232c67] text-[#232c67]"
              style={{ accentColor: '#232c67' }}
            />
          </div>
        );
      })}
    </div>
  );
});

export default function AttendancePage() {
  const { getUserPhoto, getStudentPhoto, updateAnyUserPhoto, updateAnyStudentPhoto, initializeAdvisoryPhotos } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  // Restore session state for filtering students by schedule class
  const [session, setSession] = useState("Morning");
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const router = useRouter();

  // New state for students and loading
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advisoryId, setAdvisoryId] = useState(null);

  // New state for dynamic dates and attendance
  const [dates, setDates] = useState([]); // array of date strings
  const [attendanceRecords, setAttendanceRecords] = useState([]); // raw attendance from API

  // Quarters state for dynamic date validation
  const [quarters, setQuarters] = useState(null);

  // Track if user has manually changed the date
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Remove showDateValidation state since we don't need it anymore
  // const [showDateValidation, setShowDateValidation] = useState(false);

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsScheduleDropdownOpen(false);
    setIsSessionDropdownOpen(false);
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
      const isOutsideDropdowns = !event.target.closest('.dropdown-container') && !event.target.closest('.session-dropdown');
      if (isOutsideDropdowns) {
        closeAllDropdowns();
      }
    };

    // Add event listener if any dropdown is open
    if (isScheduleDropdownOpen || isSessionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScheduleDropdownOpen]);

  // Fetch quarters data for dynamic date validation
  useEffect(() => {
    fetch('/php/Assessment/get_quarters.php')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuarters(data);
        } else if (data.status === 'success' && data.quarters) {
          setQuarters(data.quarters);
        } else {
          console.error('Failed to fetch quarters:', data.message || 'Unknown error');
          setQuarters([]);
        }
      })
      .catch(error => {
        console.error('Error fetching quarters:', error);
        setQuarters([]);
      });
  }, []);

  // Helper function to get quarter date ranges
  const quarterDateRanges = useMemo(() => {
    if (!quarters || quarters.length === 0) {
      return { startDate: null, endDate: null };
    }
    
    // Find Quarter 1 (start date) and Quarter 4 (end date) by quarter_id
    const quarter1 = quarters.find(q => q.quarter_id === 1);
    const quarter4 = quarters.find(q => q.quarter_id === 4);
    
    if (!quarter1 || !quarter4) {
      return { startDate: null, endDate: null };
    }
    
    return {
      startDate: quarter1.start_date,
      endDate: quarter4.end_date
    };
  }, [quarters]);

  // Fetch students and attendance on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // 1. Get advisory_id for this teacher
      fetch("/php/Advisory/get_advisory_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: userId })
      })
        .then(res => res.json())
        .then(data => {
          // Check if teacher has an advisory class
          if (!data.advisory || !data.advisory.advisory_id) {
            setAdvisoryId(null);
            setStudents([]);
            setAttendanceRecords([]);
            setDates([]);
            setLoading(false);
            return;
          }
          
          setAdvisoryId(data.advisory.advisory_id);
          
          // Initialize UserContext with advisory photos for real-time updates
          if (data.students && data.parents) {
            initializeAdvisoryPhotos(data.students, data.parents);
          }
          
          // API now returns only active students, so no need to filter on frontend
          console.log('=== AUTO-DEBUG: Students from API ===');
          console.log('Total active students in advisory:', data.students?.length || 0);
          console.log('Students list:', data.students?.map(s => ({ 
            name: `${s.stud_firstname} ${s.stud_lastname}`, 
            status: s.stud_school_status 
          })));
          console.log('=== AUTO-DEBUG: End Attendance Students ===');
          
          setStudents(data.students || []);
          // 2. Get ALL attendance records for this advisory
          fetch("/php/Advisory/get_attendance.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ advisory_id: data.advisory.advisory_id })
          })
            .then(res2 => res2.json())
            .then(attData => {
              setAttendanceRecords(attData.attendance || []);
              // Extract unique dates from attendance records
              const uniqueDates = Array.from(new Set((attData.attendance || []).map(a => a.attendance_date)))
                .sort((a, b) => new Date(b) - new Date(a));
              setDates(uniqueDates);
            });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Attendance state: keyed by student_id (or name fallback)
  const [attendance, setAttendance] = useState({});

  // Initialize attendance state when students are loaded
  useEffect(() => {
    if (students.length > 0) {
      const initial = {};
      students.forEach((student) => {
        // Use student_id as key if available, else name
        const key = student.student_id || (student.stud_lastname + ', ' + student.stud_firstname + (student.stud_middlename ? ' ' + student.stud_middlename : ''));
        initial[key] = dates.map(() => false);
      });
      setAttendance(initial);
    }
  }, [students]);

  const toggleAttendance = (studentKey, index) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      updated[studentKey][index] = !updated[studentKey][index];
      return updated;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  // Filter students by selected session (API now returns only active students)
  const filteredStudents = students.filter(student => {
    if (!student.stud_schedule_class) return true;
    return (
      (session === "Morning" && student.stud_schedule_class === "Morning") ||
      (session === "Afternoon" && student.stud_schedule_class === "Afternoon")
    );
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(''); // default to empty for mark mode
  const [modalDate, setModalDate] = useState("");
  const [checkedStudents, setCheckedStudents] = useState({});
  const [editCheckedStudents, setEditCheckedStudents] = useState({});
  const [editMode, setEditMode] = useState(false); // New state for edit mode



  // When modal session changes, reset checked students
  useEffect(() => {
    if (modalOpen) {
      // Filter students by session (API now returns only active students)
      const filtered = students.filter(student => {
        if (!student.stud_schedule_class) return true;
        return (
          (modalSession === 'Morning' && student.stud_schedule_class === 'Morning') ||
          (modalSession === 'Afternoon' && student.stud_schedule_class === 'Afternoon')
        );
      });
      const initialChecked = {};
      filtered.forEach(student => {
        if (student.student_id) {
          initialChecked[student.student_id] = false;
        }
      });
      setCheckedStudents(initialChecked);
    }
  }, [modalOpen, modalSession, students]);

  const handleCheckStudent = useCallback((studentId) => {
    setCheckedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }, []);

  // Validation for modal date
  const isDateValid = () => {
    if (!modalDate) return false;
    const { startDate, endDate } = quarterDateRanges;
    
    // If no quarters data, allow any date (fallback for development/testing)
    if (!startDate || !endDate) {
      return true;
    }
    
    // Check if date is within quarter range
    const isWithinRange = modalDate >= startDate && modalDate <= endDate;
    
    // Also check if there's no duplicate attendance for this date
    const hasNoDuplicate = !isDuplicateAttendance;
    
    return isWithinRange && hasNoDuplicate;
  };
  
  // Remove isDateInputComplete function since we don't need it anymore
  // const isDateInputComplete = (dateString) => {
  //   if (!dateString) return false;
  //   // Check if the date string has the complete format YYYY-MM-DD
  //   const dateParts = dateString.split('-');
  //   return dateParts.length === 3 && 
  //          dateParts[0].length === 4 && 
  //          dateParts[1].length === 2 && 
  //          dateParts[2].length === 2;
  // };

  // Show toast messages for date validation feedback
  useEffect(() => {
    if (modalDate && hasUserInteracted) {
      if (!isDateValid()) {
        // Show error message for invalid dates
        const { startDate, endDate } = quarterDateRanges;
        if (!startDate || !endDate) {
          toast.error('Unable to validate date range. Please check quarter settings.');
        } else {
          const startDateFormatted = new Date(startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
          const endDateFormatted = new Date(endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
          toast.error(`Please select a date between ${startDateFormatted} and ${endDateFormatted}.`);
        }
      }
    }
  }, [modalDate, quarterDateRanges, hasUserInteracted]);

  // Handle date change with validation feedback
  const handleDateChange = (newDate) => {
    setModalDate(newDate);
    // Clear any previous toast messages to prevent multiple toasts
    toast.dismiss();
    
    // Don't show success message here - let the useEffect handle validation feedback
  };

  // Update the date change handler to track user interaction
  const handleUserDateChange = (newDate) => {
    setHasUserInteracted(true);
    handleDateChange(newDate);
  };

  // Save attendance handler (edit mode aware)
  const handleSaveAttendance = async () => {
    // Show validation errors when user tries to save
    // setShowDateValidation(true); // This line is removed
    
    // Check if date is valid before proceeding
    if (!isDateValid()) {
      const { startDate, endDate } = quarterDateRanges;
      if (!startDate || !endDate) {
        toast.error('Unable to validate date range. Please check quarter settings.');
      } else {
        const startDateFormatted = new Date(startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const endDateFormatted = new Date(endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        toast.error(`Please select a date between ${startDateFormatted} and ${endDateFormatted}.`);
      }
      return;
    }
    
    if (editMode) {
      // Edit mode: update existing records only, but also allow creating new ones
      console.log('DEBUG: modalDate', modalDate);
      console.log('DEBUG: attendanceRecords', attendanceRecords);
      const recordsToUpdate = [];
      const recordsToInsert = [];
      Object.entries(editCheckedStudents).forEach(([student_id, checked]) => {
        const rec = attendanceRecords.find(a => a.student_id == student_id && a.attendance_date === modalDate);
        console.log('DEBUG: student_id', student_id, 'found record:', rec, 'intended status:', checked ? 'Present' : 'Absent');
        if (rec && rec.attendance_id) {
          recordsToUpdate.push({
            attendance_id: rec.attendance_id,
            student_id: rec.student_id,
            attendance_date: rec.attendance_date,
            attendance_status: checked ? 'Present' : 'Absent',
          });
        } else {
          recordsToInsert.push({
            student_id,
            recorded_by: localStorage.getItem('userId'),
            attendance_date: modalDate,
            attendance_status: checked ? 'Present' : 'Absent',
          });
        }
      });
      console.log('recordsToUpdate', recordsToUpdate);
      console.log('recordsToInsert', recordsToInsert);
      if (recordsToUpdate.length === 0 && recordsToInsert.length === 0) {
        toast.error('No attendance records to update or insert.');
        setModalOpen(false);
        return;
      }
      try {
        // 1. Update existing records
        let updatePromise = Promise.resolve({ updated: 0, errors: [] });
        if (recordsToUpdate.length > 0) {
          updatePromise = fetch('/php/Advisory/update_attendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: recordsToUpdate }),
          }).then(res => res.json());
        }
        // 2. Insert new records
        let insertPromise = Promise.resolve({ status: 'success' });
        if (recordsToInsert.length > 0) {
          insertPromise = fetch('/php/Advisory/create_attendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: recordsToInsert }),
          }).then(res => res.json());
        }
        Promise.all([updatePromise, insertPromise]).then(([updateRes, insertRes]) => {
          console.log('DEBUG: updateRes', updateRes);
          console.log('DEBUG: insertRes', insertRes);
          let successMsg = '';
          if ((updateRes.updated > 0) || (recordsToInsert.length > 0 && insertRes.status === 'success')) {
            successMsg = 'Attendance has been successfully updated.';
          }
          if (successMsg) {
            toast.success(successMsg);
            setAttendanceSuccessfullyCreated(true); // Mark that attendance was successfully updated
            // Update attendanceRecords and dates in state so table updates immediately
            setAttendanceRecords(prev => {
              // Remove any existing records for this date/session for these students (for update)
              let updated = prev.map(a => {
                const upd = recordsToUpdate.find(r => r.attendance_id === a.attendance_id);
                return upd ? { ...a, attendance_status: upd.attendance_status, recorded_at: new Date().toISOString() } : a;
              });
              // Add new records (for insert)
              if (Array.isArray(insertRes.inserted) && insertRes.inserted.length > 0) {
                updated = [...updated, ...insertRes.inserted];
              } else if (recordsToInsert.length > 0) {
                // Fallback: if API doesn't return inserted, add manually
                updated = [...updated, ...recordsToInsert];
              }
              return updated;
            });
            setDates(prev => prev.includes(modalDate) ? prev.sort((a, b) => new Date(b) - new Date(a)) : [...prev, modalDate].sort((a, b) => new Date(b) - new Date(a)));
          } else {
            toast.error('No records updated or inserted.');
          }
          setModalOpen(false);
        });
      } catch (e) {
        toast.error('Failed to update/insert attendance.');
        setModalOpen(false);
      }
      return;
    }
    // Prepare records for API
    const records = Object.entries(checkedStudents).map(([student_id, checked]) => {
      return {
        student_id,
        recorded_by: localStorage.getItem('userId'),
        attendance_date: modalDate,
        attendance_status: checked ? 'Present' : 'Absent',
      };
    }).filter(r => !!r.student_id);
    if (records.length === 0) {
      toast.error('No students to mark attendance for.');
      setModalOpen(false);
      return;
    }
    try {
      const res = await fetch('/php/Advisory/create_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success('Attendance saved successfully.');
        setAttendanceSuccessfullyCreated(true); // Mark that attendance was successfully created
        // Refetch latest attendance records from backend
        const userId = localStorage.getItem('userId');
        if (userId) {
          fetch('/php/Advisory/get_advisory_details.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacher_id: userId })
          })
            .then(res => res.json())
            .then(data => {
              setStudents(data.students || []);
              if (data.advisory && data.advisory.advisory_id) {
                fetch('/php/Advisory/get_attendance.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ advisory_id: data.advisory.advisory_id })
                })
                  .then(res2 => res2.json())
                  .then(attData => {
                    setAttendanceRecords(attData.attendance || []);
                    const uniqueDates = Array.from(new Set((attData.attendance || []).map(a => a.attendance_date)))
                      .sort((a, b) => new Date(b) - new Date(a));
                    setDates(uniqueDates);
                  });
              } else {
                setAttendanceRecords([]);
                setDates([]);
              }
            });
        }
      } else {
        toast.error(data.message || 'Failed to save attendance.');
      }
    } catch (e) {
      toast.error('Failed to save attendance.');
    }
    setModalOpen(false);
  };

  // Helper to get attendance status for a student/date
  const getAttendanceStatus = (studentId, date) => {
    const rec = attendanceRecords.find(a => a.student_id == studentId && a.attendance_date === date);
    return rec ? rec.attendance_status : null;
  };

  // Pagination state for date columns
  const [datePage, setDatePage] = useState(1);
  const datesPerPage = 5;
  
  // Sort dates: newest first (descending order) and paginate keeping newest-to-oldest within each page
  const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
  const totalDatePages = Math.ceil(sortedDates.length / datesPerPage);
  const startIndex = (datePage - 1) * datesPerPage;
  const endIndex = startIndex + datesPerPage;
  const paginatedDates = sortedDates.slice(startIndex, endIndex); // keep descending order within page
  
  // For mobile: show all dates, for desktop: show paginated dates
  const displayDates = sortedDates; // Mobile shows all dates
  const desktopDates = paginatedDates; // Desktop shows paginated dates

  // Mobile-only dynamic width for the Student Name column to avoid trailing blank space
  const mobileNameWidthClass = useMemo(() => {
    const count = Math.min(3, displayDates.length || 0);
    if (count <= 1) return 'w-[85vw]';
    if (count === 2) return 'w-[70vw]';
    return 'w-[55vw]';
  }, [displayDates.length]);

  const handleEditDate = (date) => {
    setModalDate(date);
    setModalSession(session); // Set modal session to current page session
    setEditMode(true); // Set to edit mode
    // Pre-fill editCheckedStudents based on attendanceRecords for this date
    // Filter students by current session (API now returns only active students)
    const sessionStudents = students.filter(student => {
      if (!student.stud_schedule_class) return true;
      return (
        (session === 'Morning' && student.stud_schedule_class === 'Morning') ||
        (session === 'Afternoon' && student.stud_schedule_class === 'Afternoon')
      );
    });
    const initialChecked = {};
    sessionStudents.forEach(student => {
      if (student.student_id) {
        const rec = attendanceRecords.find(a => a.student_id == student.student_id && a.attendance_date === date);
        initialChecked[student.student_id] = rec ? rec.attendance_status === 'Present' : false;
      }
    });
    setEditCheckedStudents(initialChecked);
    setModalOpen(true); // Open modal immediately
    setHasUserInteracted(false); // Reset user interaction flag
    setAttendanceSuccessfullyCreated(false); // Reset success flag for fresh duplicate checking
    // setShowDateValidation(false); // Reset validation display // This line is removed
  };

  const [isDuplicateAttendance, setIsDuplicateAttendance] = useState(false);
  const [uniqueError, setUniqueError] = useState('');
  const [attendanceSuccessfullyCreated, setAttendanceSuccessfullyCreated] = useState(false);

  // Check for duplicate attendance and set error state
  useEffect(() => {
    if (modalDate && modalSession && !editMode) {
      const filtered = students.filter(student => {
        if (!student.stud_schedule_class) return true;
        return (
          (modalSession === 'Morning' && student.stud_schedule_class === 'Morning') ||
          (modalSession === 'Afternoon' && student.stud_schedule_class === 'Afternoon')
        );
      });
      // Check if any student already has a record for this date
      const duplicate = filtered.some(student =>
        attendanceRecords.some(a => a.student_id == student.student_id && a.attendance_date === modalDate)
      );
      setIsDuplicateAttendance(duplicate);
      
      // Only show error if there's a duplicate AND user has interacted AND attendance wasn't just successfully created
      if (duplicate && hasUserInteracted && !attendanceSuccessfullyCreated) {
        toast.error('Attendance for this date already exists for one or more students.');
      }
      
      // Clear any previous uniqueError state since we're using toast now
      setUniqueError('');
    } else {
      setIsDuplicateAttendance(false);
      setUniqueError('');
    }
  }, [modalDate, modalSession, editMode, attendanceRecords.length, students.length, hasUserInteracted, attendanceSuccessfullyCreated]);

  const allCheckboxRef = useRef(null);
  useEffect(() => {
    if (allCheckboxRef.current) {
      if (editMode) {
        const values = Object.values(editCheckedStudents);
        allCheckboxRef.current.indeterminate = values.some(Boolean) && !values.every(Boolean);
      } else {
        const values = Object.values(checkedStudents);
        allCheckboxRef.current.indeterminate = values.some(Boolean) && !values.every(Boolean);
      }
    }
  }, [editMode, checkedStudents, editCheckedStudents]);

  // Helper function to check if there are students for the selected session
  const hasStudentsForSession = (session) => {
    const filtered = students.filter(student => {
      if (!student.stud_schedule_class) return true;
      return (
        (session === 'Morning' && student.stud_schedule_class === 'Morning') ||
        (session === 'Afternoon' && student.stud_schedule_class === 'Afternoon')
      );
    });
    return filtered.length > 0;
  };

  // Calculate the maximum number of students across all sessions for consistent height
  const getMaxStudentsCount = () => {
    const morningCount = students.filter(student => 
      !student.stud_schedule_class || student.stud_schedule_class === 'Morning'
    ).length;
    const afternoonCount = students.filter(student => 
      !student.stud_schedule_class || student.stud_schedule_class === 'Afternoon'
    ).length;
    return Math.max(morningCount, afternoonCount);
  };

  return (
    <main className="flex-1">
      <div className="flex-1 flex flex-col w-full min-w-0">

        {/* Controls Section */}
        {advisoryId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-4">
                <div className="relative dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <button
                    onClick={() => {
                      setIsScheduleDropdownOpen((open) => !open);
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    style={{ minHeight: '2rem' }}
                  >
                    <FaCalendarAlt className="text-gray-400" />
                    <span>{session}</span>
                    <FaChevronDown className={`text-sm transition-transform ${isScheduleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isScheduleDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-40">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSession("Morning");
                            closeAllDropdowns();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors ${
                            session === "Morning" ? "bg-[#232c67] text-white" : "text-gray-900"
                          }`}
                        >
                          Morning
                        </button>
                        <button
                          onClick={() => {
                            setSession("Afternoon");
                            closeAllDropdowns();
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors ${
                            session === "Afternoon" ? "bg-[#232c67] text-white" : "text-gray-900"
                          }`}
                        >
                          Afternoon
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Student Count Badge */}
                <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 rounded-full">
                  <FaUsers className="text-blue-600 text-sm" />
                  <span className="text-sm font-medium text-blue-900">
                    {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
                  </span>
                </div>
              </div>

              {/* Mark Attendance Button */}
               <button
                className="flex items-center gap-2 px-6 py-1.5 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                onClick={() => {
                  // Set today's date when opening modal
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  setModalDate(`${yyyy}-${mm}-${dd}`);
                  setModalSession('');
                  setEditMode(false); // Set to new mode
                  setModalOpen(true);
                  setHasUserInteracted(false); // Reset user interaction flag
                  setAttendanceSuccessfullyCreated(false); // Reset success flag for fresh duplicate checking
                  // setShowDateValidation(false); // Reset validation display // This line is removed
                  closeAllDropdowns();
                }}
              >
                <FaClipboardCheck className="text-sm" />
                Mark Attendance
              </button>
            </div>
          </div>
        )}

        {/* Modal for Mark/Edit Attendance */}
        <Modal key={modalDate + '-' + modalSession + '-' + editMode} open={modalOpen} onClose={() => {
          setModalOpen(false);
          setAttendanceSuccessfullyCreated(false); // Reset success flag when modal is closed
          // setShowDateValidation(false); // This line is removed
          closeAllDropdowns();
        }}>
                   <div className="flex flex-col gap-3">
                          <div className="mb-4 bg-[#232c67] text-white p-3 rounded-t-lg -mt-6 -mx-6 relative">
                <h2 className="text-xl font-bold text-white mb-1">{editMode ? 'Edit Attendance' : 'Mark Attendance'}</h2>
              </div>
            <div className="mb-2 md:mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              {editMode ? (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed">
                  {new Date(modalDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              ) : (
                <>
                  <CustomDateInput
                    value={modalDate}
                    onChange={handleUserDateChange}
                    min={quarterDateRanges.startDate || undefined}
                    max={quarterDateRanges.endDate || undefined}
                    isValid={isDateValid()}
                  />
                 
                </>
              )}
              
            </div>
            <div className="mb-2 md:mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Session <span className="text-red-500">*</span>
              </label>
              {editMode ? (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 cursor-not-allowed">
                  {modalSession}
                </div>
              ) : (
                              <div className="relative session-dropdown">
                <button
                  type="button"
                  onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <span>{modalSession || 'Select session...'}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSessionDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isSessionDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setModalSession('Morning');
                          setIsSessionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          modalSession === 'Morning' 
                            ? 'bg-[#232c67] text-white' 
                            : 'text-gray-700 hover:bg-[#232c67] hover:bg-opacity-10 hover:text-[#232c67]'
                        }`}
                      >
                        <div className="font-medium">Morning</div>
                      </button>
                      <button
                        onClick={() => {
                          setModalSession('Afternoon');
                          setIsSessionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          modalSession === 'Afternoon' 
                            ? 'bg-[#232c67] text-white' 
                            : 'text-gray-700 hover:bg-[#232c67] hover:bg-opacity-10 hover:text-[#232c67]'
                        }`}
                      >
                        <div className="font-medium">Afternoon</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}
              {/* Removed inline error display - now using toast messages */}

            </div>
            <div className="mb-2 md:mb-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <h4 className="text-base md:text-lg font-semibold text-gray-700">
                  Student Selection
                </h4>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <span>Select All</span>
                  <input
                    type="checkbox"
                    ref={allCheckboxRef}
                    checked={editMode
                      ? Object.values(editCheckedStudents).length > 0 && Object.values(editCheckedStudents).every(Boolean)
                      : Object.values(checkedStudents).length > 0 && Object.values(checkedStudents).every(Boolean)
                    }
                    onChange={e => {
                      const allChecked = e.target.checked;
                      if (editMode) {
                        setEditCheckedStudents(prev => {
                          const updated = {};
                          Object.keys(prev).forEach(k => { updated[k] = allChecked; });
                          return updated;
                        });
                      } else {
                        setCheckedStudents(prev => {
                          const updated = {};
                          Object.keys(prev).forEach(k => { updated[k] = allChecked; });
                          return updated;
                        });
                      }
                    }}
                    className="w-5 h-5 border border-gray-300 rounded focus:ring-2 focus:ring-[#232c67] text-[#232c67]"
                    style={{ accentColor: '#232c67' }}
                  />
                </label>
              </div>
                <div className={`overflow-y-auto border border-gray-200 rounded-lg ${getMaxStudentsCount() >= 3 ? 'h-32 md:h-48' : 'h-auto'}`}>
                  <StudentCheckboxList
                    students={students}
                    checkedStudents={editMode ? editCheckedStudents : checkedStudents}
                    handleCheckStudent={editMode ? (studentId => setEditCheckedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }))) : handleCheckStudent}
                    modalSession={modalSession}
                    getStudentPhoto={getStudentPhoto}
                  />
                </div>
            </div>
            {/* Bottom right buttons */}
            <div className="flex justify-end gap-2 md:gap-3 pt-2 md:pt-3 border-t border-gray-200">
              <button
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                onClick={() => {
                  setModalOpen(false);
                  closeAllDropdowns();
                  setIsSessionDropdownOpen(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors bg-[#232c67] text-white hover:bg-[#1a1f4d]"
                onClick={handleSaveAttendance}
                disabled={!isDateValid() || isDuplicateAttendance || modalSession === '' || !hasStudentsForSession(modalSession)}
                style={{ 
                  opacity: (!isDateValid() || isDuplicateAttendance || modalSession === '' || !hasStudentsForSession(modalSession)) ? 0.5 : 1, 
                  cursor: (!isDateValid() || isDuplicateAttendance || modalSession === '' || !hasStudentsForSession(modalSession)) ? 'not-allowed' : 'pointer' 
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </Modal>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Loading attendance data...</p>
              <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
            </div>
          ) : !advisoryId ? (
            <div className="flex flex-col justify-center items-center h-80 text-center px-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <FaUsers className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Advisory Class Assigned</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                You don't have an advisory class assigned yet. Please contact your administrator to set up your advisory class before you can manage attendance.
              </p>
            </div>
          ) : dates.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-80 text-center px-6">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <FaClipboardCheck className="text-4xl text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Attendance Records Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Start tracking attendance for your {session.toLowerCase()} session. Click the "Mark Attendance" button above to begin recording student attendance.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-80 text-center px-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <FaUsers className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students in {session} Session</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                There are no students assigned to the {session.toLowerCase()} session. Try contact your administrator if this is incorrect.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <div className={`overflow-x-auto md:overflow-x-visible ${filteredStudents.length > 6 ? 'overflow-y-auto' : ''}`} style={students.length > 6 ? { maxHeight: 'calc(100vh - 400px)' } : {}}>
                <table className="min-w-full text-sm text-gray-900" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead className="sticky top-0 z-20 bg-[#232c67] text-white border-b border-[#1a1f4d]">
                    <tr>
                      <th className={`sticky top-0 left-0 text-left px-6 py-3 font-semibold text-white bg-[#232c67] z-30 md:w-1/2 ${mobileNameWidthClass}`}>
                        Student Name
                      </th>
                      {/* Mobile: show all dates */}
                      {displayDates.map((date, idx) => (
                        <th
                          key={`mobile-${idx}`}
                          className="md:hidden sticky top-0 px-2 py-3 whitespace-nowrap font-medium text-white bg-[#232c67] border-l border-[#1a1f4d] text-center cursor-pointer relative group hover:bg-[#2b3572] transition-colors z-20 w-[15vw]"
                          onClick={() => handleEditDate(date)}
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-xs font-semibold text-white">
                              {(() => {
                                const d = new Date(date);
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                const yy = String(d.getFullYear()).slice(-2);
                                return `${mm}/${dd}/${yy}`;
                              })()}
                            </span>
                          </div>
                          <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Edit attendance
                          </div>
                        </th>
                      ))}
                      {/* Desktop: show paginated dates */}
                      {desktopDates.map((date, idx) => (
                        <th
                          key={`desktop-${idx}`}
                          className="hidden md:table-cell sticky top-0 px-4 py-3 whitespace-nowrap font-medium text-white bg-[#232c67] border-l border-[#1a1f4d] text-center cursor-pointer relative group hover:bg-[#2b3572] transition-colors z-20"
                          style={{ width: `${50 / desktopDates.length}%` }}
                          onClick={() => handleEditDate(date)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-white">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span className="text-xs text-white">{new Date(date).toLocaleDateString(undefined, { year: 'numeric' })}</span>
                          </div>
                          <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Edit attendance
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const key = student.student_id;
                      const name = student.stud_lastname + ', ' + student.stud_firstname + (student.stud_middlename ? ' ' + student.stud_middlename : '');
                      return (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <td className={`sticky left-0 bg-white px-6 font-medium whitespace-nowrap z-10 border-r border-gray-200 ${filteredStudents.length > 6 ? 'py-2' : 'py-3'} md:w-1/2 ${mobileNameWidthClass}`}>
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
                            <div className="font-medium text-gray-900 flex-1 min-w-0">
                              <span className="hidden md:inline truncate">
                                {name}
                              </span>
                              <span className="md:hidden block w-full truncate">
                                {name}
                              </span>
                            </div>
                            </div>
                          </td>
                          {/* Mobile: show all dates */}
                          {displayDates.map((date, dIdx) => {
                            const status = getAttendanceStatus(key, date);
                            return (
                              <td key={`mobile-${dIdx}`} className={`md:hidden px-2 text-center border-l border-gray-200 ${filteredStudents.length > 6 ? 'py-2' : 'py-3'} w-[15vw]`}>
                                <div className="flex items-center justify-center">
                                  {status === 'Present' ? (
                                    <>
                                      {/* Mobile: icon box only */}
                                      <div className="w-6 h-6 rounded-md bg-green-100 border border-green-300 flex items-center justify-center">
                                        <FaCheck className="text-green-600 text-sm" />
                                      </div>
                                    </>
                                  ) : status === 'Absent' ? (
                                    <>
                                      {/* Mobile: icon box only */}
                                      <div className="w-6 h-6 rounded-md bg-red-100 border border-red-300 flex items-center justify-center">
                                        <FaTimes className="text-red-600 text-sm" />
                                      </div>
                                    </>
                                  ) : (
                                    <input type="checkbox" checked={false} readOnly className="w-4 h-4 rounded border-gray-300 bg-white disabled:opacity-70 focus:ring-2 focus:ring-blue-500" style={{ pointerEvents: 'none', accentColor: '#2563eb' }} />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          {/* Desktop: show paginated dates */}
                          {desktopDates.map((date, dIdx) => {
                            const status = getAttendanceStatus(key, date);
                            return (
                          <td key={`desktop-${dIdx}`} className={`hidden md:table-cell px-4 text-center border-l border-gray-200 ${filteredStudents.length > 6 ? 'py-2' : 'py-3'}`} style={{ width: `${50 / desktopDates.length}%` }}>
                                <div className="flex items-center justify-center">
                                  {status === 'Present' ? (
                                    <>
                                      <FaCheck className="text-xl text-green-600" />
                                      <span className="ml-2 text-xs text-green-600 font-medium">Present</span>
                                    </>
                                  ) : status === 'Absent' ? (
                                    <>
                                      <FaTimes className="text-xl text-red-600" />
                                      <span className="ml-2 text-xs text-red-600 font-medium">Absent</span>
                                    </>
                                  ) : (
                                    <input type="checkbox" checked={false} readOnly className="w-5 h-5 rounded border-gray-300 bg-white disabled:opacity-70 focus:ring-2 focus:ring-blue-500" style={{ pointerEvents: 'none', accentColor: '#2563eb' }} />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination for date columns */}
        {filteredStudents.length > 0 && totalDatePages > 0 && (
          <div className="hidden md:flex justify-center items-center mt-6 gap-2">
            {/* Left Arrow */}
            <button
              className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
              onClick={() => setDatePage((p) => Math.max(1, p - 1))}
              disabled={datePage === 1}
              aria-label="Previous page"
            >
              <span className="text-lg">&lt;</span>
            </button>
            
            {/* Smart Pagination with Ellipsis */}
            {(() => {
              const maxVisible = 7;
              const items = [];
              
              if (totalDatePages <= maxVisible) {
                // If total pages is less than max visible, show all pages
                for (let i = 1; i <= totalDatePages; i++) {
                  items.push({ type: 'page', page: i });
                }
              } else {
                // Always show first page
                items.push({ type: 'page', page: 1 });
                
                if (datePage <= 4) {
                  // Near the beginning: show first 5 pages + ellipsis + last page
                  for (let i = 2; i <= Math.min(5, totalDatePages - 1); i++) {
                    items.push({ type: 'page', page: i });
                  }
                  if (totalDatePages > 5) {
                    items.push({ type: 'ellipsis' });
                  }
                  if (totalDatePages > 1) {
                    items.push({ type: 'page', page: totalDatePages });
                  }
                } else if (datePage >= totalDatePages - 3) {
                  // Near the end: show first page + ellipsis + last 5 pages
                  items.push({ type: 'ellipsis' });
                  for (let i = Math.max(2, totalDatePages - 4); i <= totalDatePages; i++) {
                    items.push({ type: 'page', page: i });
                  }
                } else {
                  // In the middle: show first + ellipsis + current page ±2 + ellipsis + last
                  items.push({ type: 'ellipsis' });
                  for (let i = datePage - 2; i <= datePage + 2; i++) {
                    items.push({ type: 'page', page: i });
                  }
                  items.push({ type: 'ellipsis' });
                  items.push({ type: 'page', page: totalDatePages });
                }
              }
              
              return items.map((item, index) => {
                if (item.type === 'page') {
                  const isActive = item.page === datePage;
                  return (
                    <button
                      key={`page-${item.page}`}
                      onClick={() => setDatePage(item.page)}
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
              className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
              onClick={() => setDatePage((p) => Math.min(totalDatePages, p + 1))}
              disabled={datePage === totalDatePages}
              aria-label="Next page"
            >
              <span className="text-lg">&gt;</span>
            </button>
          </div>
        )}
      </div>

    </main>
  );
}

