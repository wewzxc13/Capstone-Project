"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCalendarAlt, FaChevronDown, FaSearch, FaEdit, FaPlus, FaEye, FaUserPlus, FaTimes, FaCheck, FaSave, FaExclamationTriangle, FaTrash, FaTimesCircle } from "react-icons/fa";
import CalendarMonthCellIcons from '../../../components/ui/CalendarMonthCellIcons';

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Helper to convert event to react-big-calendar format
function toCalendarEvent(event) {
  // event: { day, month, year, title, time, color }
  // time: "9:00 - 10:00 AM"
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIndex = monthNames.indexOf(event.month);
  const [startTime, endTime] = event.time.split(" - ");
  const [startHour, startMinute] = startTime.split(":");
  const [endHour, endMinute] = endTime.split(":");
  // Assume AM/PM is in endTime
  const startDate = new Date(event.year, monthIndex, event.day, parseInt(startHour), parseInt(startMinute));
  const endDate = new Date(event.year, monthIndex, event.day, parseInt(endHour), parseInt(endMinute));
  return {
    ...event,
    title: event.title,
    start: startDate,
    end: endDate,
    allDay: false,
  };
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper functions for capitalization
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to format time to AM/PM
function formatTimeToAMPM(timeStr) {
  // timeStr: "09:00" or "13:30"
  const [hour, minute] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Helper function to format names as "Last Name, First Name Middle Name"
function formatName(firstName, middleName, lastName) {
  const parts = [lastName, firstName];
  if (middleName && middleName.trim()) {
    // Add middle name to the firstName part, not as a separate part
    parts[1] = firstName + ' ' + middleName.trim();
  }
  return parts.join(', ');
}

const meetingColorMap = [
  { name: "blue", hex: "#60a5fa" },
  { name: "pink", hex: "#f472b6" },
  { name: "green", hex: "#34d399" },
  { name: "yellow", hex: "#facc15" },
  { name: "orange", hex: "#fb923c" },
  { name: "purple", hex: "#a78bfa" },
  { name: "teal", hex: "#2dd4bf" }
];

function getColorForMeeting(meetingId) {
  const idx = Math.abs(
    String(meetingId)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % meetingColorMap.length;
  return meetingColorMap[idx].hex;
}

// Move fetchMeetings outside useEffect so it can be reused
async function fetchMeetings(setEvents, userId, setLoading) {
  try {
    const res = await fetch(`/php/Meeting/get_meetings_details.php?user_id=${userId}`);
    const data = await res.json();
    if (data.status === "success" && Array.isArray(data.meetings)) {
      // Map backend meetings to event format
      const mapped = data.meetings.map((m) => {
        const start = new Date(m.meeting_start);
        const end = new Date(m.meeting_end);
        const color = getColorForMeeting(m.meeting_id);
        return {
          id: m.meeting_id,
          title: m.meeting_title,
          agenda: m.meeting_agenda,
          day: start.getDate(),
          month: monthNames[start.getMonth()],
          year: start.getFullYear(),
          time: `${start.toTimeString().slice(0,5)} - ${end.toTimeString().slice(0,5)}`,
          color,
          status: m.meeting_status,
          start,
          end,
          created_by: m.created_by,
          parent_id: m.parent_id,
          student_id: m.student_id
        };
      });
      setEvents(mapped);
    }
  } catch (err) {
    // Optionally handle error
  } finally {
    if (setLoading) {
      setLoading(false);
    }
  }
}

export default function TeacherCalendarPage() {
  // Debug print for localStorage values
  if (typeof window !== 'undefined') {
    console.log('Teacher Calendar DEBUG:', {
      userRole: localStorage.getItem('userRole'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
  }
  const [events, setEvents] = useState([]);
  const calendarEvents = events.map(toCalendarEvent);
  const [modalDay, setModalDay] = useState(null);
  const [modalMonth, setModalMonth] = useState(null);
  const [modalYear, setModalYear] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventColor, setNewEventColor] = useState("bg-blue-400");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInviteSelectModal, setShowInviteSelectModal] = useState(false);
  const [showInviteViewModal, setShowInviteViewModal] = useState(false);
  const [inviteSelectSearch, setInviteSelectSearch] = useState("");
  const [inviteViewSearch, setInviteViewSearch] = useState("");
  const [inviteSelectTab, setInviteSelectTab] = useState("teacher");
  const [inviteModalSearch, setInviteModalSearch] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const allTeachersChecked = teachers.every(t => t.checked);
  const allParentsChecked = parents.every(p => p.checked);
  const [newEventAgenda, setNewEventAgenda] = useState("");
  const [validation, setValidation] = useState({ date: "", time: "", invite: "" });
  const [editMode, setEditMode] = useState(false);
  const [editEventData, setEditEventData] = useState(null);
  const [invitedList, setInvitedList] = useState({ teachers: [], parents: [], students: [], loading: false, error: null });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Scheduled');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  // Add state for current view date
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsStatusDropdownOpen(false);
  };

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
    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);
  // Add state for calendar view
  const [calendarView, setCalendarView] = useState('month');
  // Ref to track if day number was clicked
  const dayNumberClickedRef = useRef(false);
  // Add state to track if invite list has been loaded for the current meeting
  const [inviteListLoaded, setInviteListLoaded] = useState(false);
  // Add state for advisory, parent, and student selection
  const [advisoryId, setAdvisoryId] = useState(null);
  const [advisoryParents, setAdvisoryParents] = useState([]);
  const [advisoryStudents, setAdvisoryStudents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  // Add state for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteStep, setInviteStep] = useState(1); // 1 = parent, 2 = student
  const [tempSelectedParentId, setTempSelectedParentId] = useState(null);
  const [tempSelectedStudentId, setTempSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsUpdateCounter, setEventsUpdateCounter] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Fetch advisory, parents, and students for the teacher on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch('/php/Advisory/get_advisory_details.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: userId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.advisory) {
            setAdvisoryId(data.advisory.advisory_id);
            setAdvisoryParents(data.parents);
            setAdvisoryStudents(data.students);
          }
        });
    }
  }, []);

  // Fetch meetings from backend on mount
  useEffect(() => {
    // Get teacher user_id from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchMeetings(setEvents, userId, setLoading);
    } else {
      setLoading(false);
    }
  }, []);

  // Handle window resize for responsive calendar height
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Move fetchInvitedList here so it can access setInvitedList
  async function fetchInvitedList(meetingId) {
    setInvitedList({ teachers: [], parents: [], students: [], loading: true, error: null });
    
    // Check if the current user created this meeting
    const currentUserId = localStorage.getItem('userId');
    const isTeacherCreated = String(selectedEvent?.created_by) === String(currentUserId);
    
    console.log('Fetching invited list for meeting:', meetingId);
    console.log('Is teacher created:', isTeacherCreated);
    console.log('Current user ID:', currentUserId);
    console.log('Selected event created by:', selectedEvent?.created_by);
    
    try {
      if (isTeacherCreated) {
        // For teacher-created meetings: get parent and student from selectedEvent data
        console.log('Processing teacher-created meeting from selectedEvent:', selectedEvent);
        console.log('Advisory parents:', advisoryParents);
        console.log('Advisory students:', advisoryStudents);
        
        // Get parent and student details from advisory data using selectedEvent
        const parent = advisoryParents.find(p => String(p.user_id) === String(selectedEvent.parent_id));
        const student = advisoryStudents.find(s => String(s.student_id) === String(selectedEvent.student_id));
        
        console.log('Found parent:', parent);
        console.log('Found student:', student);
        console.log('SelectedEvent parent_id:', selectedEvent.parent_id);
        console.log('SelectedEvent student_id:', selectedEvent.student_id);
        console.log('Advisory parents length:', advisoryParents.length);
        console.log('Advisory students length:', advisoryStudents.length);
        
        setInvitedList({
          teachers: [], // No teachers for teacher-created meetings
          parents: parent ? [parent] : [],
          students: student ? [student] : [],
          loading: false,
          error: null
        });
      } else {
        // For admin-created meetings: get teachers and parents from tbl_notification_recipients
        console.log('Fetching admin-created meeting recipients...');
        const res = await fetch(`/php/Meeting/get_notification_recipients.php?meeting_id=${meetingId}`);
        const data = await res.json();
        console.log('Notification recipients response:', data);
        
        if (data.status === 'success') {
          console.log('Fetched invited teachers:', data.teachers);
          console.log('Fetched invited parents:', data.parents);
          setInvitedList({
            teachers: data.teachers || [],
            parents: data.parents || [],
            students: [], // No students for admin-created meetings
            loading: false,
            error: null
          });
        } else {
          console.log('Fetch invited list error:', data.message);
          setInvitedList({ teachers: [], parents: [], students: [], loading: false, error: data.message || 'Failed to fetch invitees' });
        }
      }
    } catch (err) {
      console.log('Fetch invited list error:', err);
      setInvitedList({ teachers: [], parents: [], students: [], loading: false, error: err.message });
    }
  }

  // When a slot is selected in the calendar
  const handleSelectSlot = (slotInfo) => {
    // Only open modal if day number was clicked
    if (!dayNumberClickedRef.current) return;
    dayNumberClickedRef.current = false;
    const date = slotInfo.start;
    setModalDay(date.getDate());
    setModalMonth(monthNames[date.getMonth()]);
    setModalYear(date.getFullYear());
    setShowInputModal(true);
    setNewEventTitle("");
    setNewEventStartTime("09:00");
    setNewEventEndTime("10:00");
    setNewEventColor("bg-blue-400");
    setSelectedEvent(null);
  };

  // When an event is clicked in the calendar
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowInputModal(false);
  };

  // Add new event from modal
  const handleAddEvent = async () => {
    if (!newEventTitle || !newEventStartTime || !newEventEndTime || !selectedParentId || !selectedStudentId || !advisoryId) return;

    // Compose start/end datetime strings
    const monthIndex = monthNames.indexOf(modalMonth) + 1;
    const startDate = `${modalYear}-${monthIndex.toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")} ${newEventStartTime}:00`;
    const endDate = `${modalYear}-${monthIndex.toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")} ${newEventEndTime}:00`;

    // Use actual logged-in userId
    const userId = localStorage.getItem('userId');
    const created_by = userId ? parseInt(userId, 10) : 1;

    // Compose notification message for system logs
    const notif_message = `[ONE ON ONE MEETING] Created the Meeting`;

    // Prepare payload
    const payload = {
      meeting_title: newEventTitle,
      meeting_agenda: newEventAgenda,
      meeting_start: startDate,
      meeting_end: endDate,
      created_by,
      recipients: [], // No parent/teacher invitees for 1-on-1, handled by parent_id/student_id
      parent_id: selectedParentId,
      student_id: selectedStudentId,
      advisory_id: advisoryId,
      notif_message
    };

    try {
      const res = await fetch("/php/Meeting/create_meeting.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "success") {
        // Use userId for fetchMeetings
        await fetchMeetings(setEvents, created_by, setLoading);
        
        // Increment update counter to force calendar re-render
        setEventsUpdateCounter(prev => prev + 1);
        
        setShowInputModal(false);
        setModalDay(null);
        setModalMonth(null);
        setModalYear(null);
        setNewEventAgenda("");
        toast.success("Meeting created and notifications sent!");
      } else {
        toast.error("Failed to create meeting: " + (data.message || "Unknown error") + (data.error ? ("\n" + data.error) : ""));
      }
    } catch (err) {
      toast.error("Error connecting to server: " + err.message);
    }
  };

  // When entering edit mode, pre-fill parent/student and temp values for invite modal
  const handleEditClick = () => {
    setEditMode(true);
    setEditEventData({
      title: selectedEvent.title,
      agenda: selectedEvent.agenda,
      year: selectedEvent.year,
      month: selectedEvent.month,
      day: selectedEvent.day,
      startTime: selectedEvent.time?.split(' - ')[0] || '',
      endTime: selectedEvent.time?.split(' - ')[1] || '',
    });
    
    // Auto-fill the invited list for edit mode based on tbl_meetings data
    console.log('Auto-filling edit mode with selectedEvent:', selectedEvent);
    
    // Set the selected parent and student IDs from the meeting data (tbl_meetings)
    const parentId = selectedEvent.parent_id || null;
    const studentId = selectedEvent.student_id || null;
    
    setSelectedParentId(parentId);
    setSelectedStudentId(studentId);
    setTempSelectedParentId(parentId);
    setTempSelectedStudentId(studentId);
    
    console.log('Auto-filled parent and student IDs from tbl_meetings:', { parentId, studentId });
    console.log('Available advisory parents:', advisoryParents);
    console.log('Available advisory students:', advisoryStudents);
    
    setInviteListLoaded(false);
    toast.info("Edit mode activated");
  };

  // Always use handleOpenInviteModal for opening the invite modal, both in add and edit
  const handleOpenInviteModal = () => {
    console.log('Opening invite modal. Edit mode:', editMode);
    console.log('Current selectedParentId:', selectedParentId);
    console.log('Current selectedStudentId:', selectedStudentId);
    console.log('SelectedEvent data:', selectedEvent);
    
    if (editMode && selectedEvent) {
      // For edit mode: pre-fill with the already set values from handleEditClick
      console.log('Pre-filling edit mode with:', { selectedParentId, selectedStudentId });
      console.log('From tbl_meetings - parent_id:', selectedEvent.parent_id, 'student_id:', selectedEvent.student_id);
      
      // Ensure we use the actual values from selectedEvent for auto-fill
      const parentId = selectedEvent.parent_id || selectedParentId;
      const studentId = selectedEvent.student_id || selectedStudentId;
      
      setTempSelectedParentId(parentId);
      setTempSelectedStudentId(studentId);
      
      console.log('Auto-filled temp values:', { parentId, studentId });
    } else {
      // For add mode: use current selections (which might be empty)
      console.log('Pre-filling add mode with:', { selectedParentId, selectedStudentId });
      setTempSelectedParentId(selectedParentId);
      setTempSelectedStudentId(selectedStudentId);
    }
    setShowInviteModal(true);
  };

  // Before rendering the Invite modal, add debug logs
  if (showInviteSelectModal) {
    console.log("Teachers:", teachers);
    console.log("Parents:", parents);
  }

  function validateFields() {
    let valid = true;
    const newValidation = { date: "", time: "", invite: "" };

    // Date validation
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDate = modalDay && modalMonth && modalYear
      ? new Date(`${modalYear}-${(monthNames.indexOf(modalMonth)+1).toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")}`)
      : null;
    if (!selectedDate || selectedDate < today) {
      newValidation.date = "Date must be today or in the future.";
      valid = false;
    }

    // Time validation (fix logic)
    if (!newEventStartTime || !newEventEndTime) {
      newValidation.time = "Please select both start and end time.";
      valid = false;
    } else {
      const [startHour, startMin] = newEventStartTime.split(":").map(Number);
      const [endHour, endMin] = newEventEndTime.split(":").map(Number);
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;
      if (startHour < 8 || startHour > 17 || endHour < 8 || endHour > 17) {
        newValidation.time = "Time must be between 8:00 AM and 5:00 PM.";
        valid = false;
      } else if (endTotal <= startTotal) {
        newValidation.time = "End time must be after start time.";
        valid = false;
      }
    }

    // Invite validation (for teacher: require parent and student selection)
    if (!selectedParentId || !selectedStudentId) {
      newValidation.invite = "Please select a parent and student to invite.";
      valid = false;
    }

    setValidation(newValidation);
    return valid;
  }

  useEffect(() => {
    validateFields();
    // eslint-disable-next-line
  }, [newEventTitle, newEventAgenda, modalDay, modalMonth, modalYear, newEventStartTime, newEventEndTime, teachers, parents]);

  useEffect(() => {
    if (showInviteViewModal && selectedEvent && !editMode) {
      console.log('Fetching invited list for meeting_id:', selectedEvent.id);
      fetchInvitedList(selectedEvent.id);
      
      // Set default tab based on who created the meeting
      if (String(selectedEvent?.created_by) === String(localStorage.getItem('userId'))) {
        // Teacher created the meeting - default to Parent tab
        setInviteSelectTab("parent");
      } else {
        // Admin created the meeting - default to Teacher tab
        setInviteSelectTab("teacher");
      }
    }
    // eslint-disable-next-line
  }, [showInviteViewModal, selectedEvent, editMode]);

  // Add validation for edit mode
  function validateEditFields() {
    let valid = true;
    const newValidation = { date: '', time: '', invite: '' };
    // Date validation
    const today = new Date();
    today.setHours(0,0,0,0);
    const year = editEventData?.year || selectedEvent?.year;
    const month = editEventData?.month || selectedEvent?.month;
    const day = editEventData?.day || selectedEvent?.day;
    const selectedDate = year && month && day
      ? new Date(`${year}-${(monthNames.indexOf(month)+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
      : null;
    if (!selectedDate || selectedDate < today) {
      newValidation.date = 'Date must be today or in the future.';
      valid = false;
    }
    // Time validation
    const startTime = editEventData?.startTime || (selectedEvent?.time?.split(' - ')[0] || '');
    const endTime = editEventData?.endTime || (selectedEvent?.time?.split(' - ')[1] || '');
    if (!startTime || !endTime) {
      newValidation.time = 'Please select both start and end time.';
      valid = false;
    } else {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startTotal = startHour * 60 + startMin;
      const endTotal = endHour * 60 + endMin;
      if (startHour < 8 || startHour > 17 || endHour < 8 || endHour > 17) {
        newValidation.time = 'Time must be between 8:00 AM and 5:00 PM.';
        valid = false;
      } else if (endTotal <= startTotal) {
        newValidation.time = 'End time must be after start time.';
        valid = false;
      }
    }
    // Invite validation (for teacher: require parent and student selection)
    if (!selectedParentId || !selectedStudentId) {
      newValidation.invite = 'Please select a parent and student to invite.';
      valid = false;
    }
    setValidation(newValidation);
    return valid;
  }

  // Add useEffect for edit mode validation
  useEffect(() => {
    if (editMode) validateEditFields();
    // eslint-disable-next-line
  }, [editEventData, teachers, parents, editMode]);

  // Function to handle saving edited event
  const handleSaveEdit = async () => {
    if (!selectedEvent || !editEventData) return;
    
    // Validate fields before saving
    if (!validateEditFields()) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    const monthIndex = monthNames.indexOf(editEventData.month) + 1;
    const startDate = `${editEventData.year}-${monthIndex.toString().padStart(2, "0")}-${editEventData.day.toString().padStart(2, "0")} ${editEventData.startTime}:00`;
    const endDate = `${editEventData.year}-${monthIndex.toString().padStart(2, "0")}-${editEventData.day.toString().padStart(2, "0")} ${editEventData.endTime}:00`;

    const userId = localStorage.getItem('userId');
    const created_by = userId ? parseInt(userId, 10) : 1;

    // Get advisory_id from the current meeting or advisory data
    // For one-on-one meetings, always preserve the existing advisory_id from the meeting
    let advisoryId = selectedEvent.advisory_id;
    if (!advisoryId && selectedEvent.parent_id && selectedEvent.student_id) {
      // If this is a one-on-one meeting but advisory_id is missing, try to get it from advisory data
      advisoryId = advisoryParents.length > 0 ? advisoryParents[0].advisory_id : null;
    }
    // Ensure we have an advisory_id for one-on-one meetings
    if (!advisoryId && selectedParentId && selectedStudentId) {
      // Get current teacher's advisory_id from local storage or advisory data
      const currentUserId = localStorage.getItem('userId');
      advisoryId = advisoryParents.length > 0 ? advisoryParents[0].advisory_id : 2; // fallback to advisory_id 2
    }

    // Check what was changed for notification message
    const originalStart = new Date(selectedEvent.start);
    const originalEnd = new Date(selectedEvent.end);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    const dateTimeChanged = originalStart.getTime() !== newStart.getTime() || originalEnd.getTime() !== newEnd.getTime();
    const titleChanged = selectedEvent.title !== editEventData.title;
    const agendaChanged = selectedEvent.agenda !== editEventData.agenda;
    const inviteesChanged = selectedEvent.parent_id !== selectedParentId || selectedEvent.student_id !== selectedStudentId;
    
    let notif_message;
    if (dateTimeChanged) {
      // Date/time was changed
      if (titleChanged || agendaChanged || inviteesChanged) {
        // Both date/time and other details were changed
        notif_message = "[ONE ON ONE MEETING] Updated and rescheduled the meeting";
      } else {
        // Only date/time was changed
        notif_message = "[ONE ON ONE MEETING] Rescheduled the meeting";
      }
    } else {
      // Only title, agenda, or invitees were changed
      notif_message = "[ONE ON ONE MEETING] Updated the meeting";
    }

    const payload = {
      meeting_id: selectedEvent.id,
      meeting_title: editEventData.title,
      meeting_agenda: editEventData.agenda,
      meeting_start: startDate,
      meeting_end: endDate,
      created_by,
      recipients: [], // No parent/teacher invitees for 1-on-1, handled by parent_id/student_id
      parent_id: selectedParentId,
      student_id: selectedStudentId,
      advisory_id: advisoryId,
      notif_message
    };

    console.log('Sending edit payload:', payload);
    console.log('Individual values:', {
      parent_id: selectedParentId,
      student_id: selectedStudentId,
      advisory_id: advisoryId,
      selectedEvent_advisory_id: selectedEvent.advisory_id,
      advisoryParents_length: advisoryParents.length,
      advisoryParents_first: advisoryParents.length > 0 ? advisoryParents[0] : null
    });
    console.log('Original meeting times:', {
      original_start: selectedEvent.start,
      original_end: selectedEvent.end,
      new_start: startDate,
      new_end: endDate
    });

    try {
      const res = await fetch("/php/Meeting/update_meeting.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "success") {
        // Fetch updated meetings data
        await fetchMeetings(setEvents, created_by, setLoading);
        
        // Increment update counter to force calendar re-render
        setEventsUpdateCounter(prev => prev + 1);
        
        // Clear edit mode and data
        setEditMode(false);
        setEditEventData(null);
        
        // Clear the selected event so the modal closes and shows updated data
        setSelectedEvent(null);
        
        // Show appropriate message based on what was actually changed
        if (dateTimeChanged) {
          // Date/time was changed
          if (titleChanged || agendaChanged || inviteesChanged) {
            // Both date/time and other details were changed
            toast.success("Meeting updated and rescheduled successfully! All invitees have been notified.");
          } else {
            // Only date/time was changed
            toast.success("Meeting rescheduled successfully! All invitees have been notified.");
          }
        } else {
          // Only title, agenda, or invitees were changed
          toast.success("Meeting updated successfully! All invitees have been notified.");
        }
        
        // Reset invitee selections
        setSelectedParentId(null);
        setSelectedStudentId(null);
        setTempSelectedParentId(null);
        setTempSelectedStudentId(null);
      } else {
        toast.error("Failed to update meeting: " + (data.message || "Unknown error") + (data.error ? ("\n" + data.error) : ""));
      }
    } catch (err) {
      toast.error("Error connecting to server: " + err.message);
    }
  };

  // Only reset selectedParentId/selectedStudentId when cancelling edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditEventData(null);
    setSelectedParentId(null);
    setSelectedStudentId(null);
    setTempSelectedParentId(null);
    setTempSelectedStudentId(null);
    toast.info("Edit mode cancelled");
  };

  return (
    <ProtectedRoute role="Teacher">
      <style jsx>{`
        .rbc-agenda-view {
          overflow-x: auto !important;
        }
        .rbc-agenda-view table {
          width: 100% !important;
          table-layout: fixed !important;
        }
        .rbc-agenda-view .rbc-agenda-time-cell {
          width: 30% !important;
          max-width: 30% !important;
          min-width: 120px !important;
        }
        .rbc-agenda-view .rbc-agenda-event-cell {
          width: 70% !important;
          max-width: 70% !important;
          min-width: 200px !important;
        }
        .rbc-agenda-view .rbc-agenda-event-cell > div {
          width: 100% !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          white-space: nowrap !important;
        }
        .rbc-today {
          background-color: transparent !important;
        }
        .rbc-today .rbc-day-bg {
          background-color: transparent !important;
        }
        .rbc-current-time-indicator {
          background-color: transparent !important;
        }
        .rbc-off-range-bg {
          background-color: transparent !important;
        }
        .rbc-toolbar button:hover {
          background-color: transparent !important;
        }
        .rbc-toolbar button:focus {
          background-color: transparent !important;
          box-shadow: none !important;
        }
        .rbc-toolbar button:active {
          background-color: transparent !important;
        }
        .rbc-toolbar button.rbc-active {
          background-color: #232c67 !important;
          color: white !important;
        }
      `}</style>
       <div className="flex-1 p-4 bg-gray-50">
       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Loading calendar data...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the latest meetings</p>
          </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 p-3 lg:p-5">
            <div className="flex-1 order-2 lg:order-1">
                <div className="p-1 sm:p-2 lg:p-4">
                <Calendar
                key={`calendar-${events.length}-${eventsUpdateCounter}`}
                localizer={localizer}
                events={calendarEvents.filter(e => e.status !== 'Cancelled')}
                startAccessor="start"
                endAccessor="end"
                style={{ 
                  height: windowWidth < 640 ? 350 : windowWidth < 1024 ? 400 : 420,
                  minHeight: 350,
                  width: '100%'
                }}
                selectable={false}
                date={currentViewDate}
                onNavigate={date => setCurrentViewDate(date)}
                onSelectEvent={handleSelectEvent}
                popup={false}
                eventPropGetter={event => ({
                  style: {
                    backgroundColor: "transparent",
                    color: event.color,
                    borderRadius: "6px",
                    border: "none",
                    boxShadow: "none",
                    padding: 0,
                  }
                })}
                view={calendarView}
                onView={setCalendarView}
                components={{
                  month: {
                    dateCellWrapper: ({ value }) => {
                      const displayedMonth = currentViewDate.getMonth();
                      const displayedYear = currentViewDate.getFullYear();
                      // Filter out cancelled events for the cell
                      const cellEvents = calendarEvents.filter(e =>
                        e.start.getFullYear() === value.getFullYear() &&
                        e.start.getMonth() === value.getMonth() &&
                        e.start.getDate() === value.getDate() &&
                        e.status !== 'Cancelled'
                      );
                      // Use only year, month, day for comparison
                      const now = new Date();
                      const todayY = now.getFullYear();
                      const todayM = now.getMonth();
                      const todayD = now.getDate();
                      const cellY = value.getFullYear();
                      const cellM = value.getMonth();
                      const cellD = value.getDate();
                      const isToday = cellY === todayY && cellM === todayM && cellD === todayD;
                      const isCurrentMonth = value.getMonth() === displayedMonth && value.getFullYear() === displayedYear;
                      // Only allow add modal for today or future
                      const isFutureOrToday =
                        cellY > todayY ||
                        (cellY === todayY && cellM > todayM) ||
                        (cellY === todayY && cellM === todayM && cellD >= todayD);
                      let dayNumberStyle = {
                        fontWeight: 600,
                        fontSize: windowWidth < 640 ? 14 : 16,
                        borderRadius: 4,
                        padding: windowWidth < 640 ? '1px 4px' : '1px 6px',
                        zIndex: 2,
                        marginBottom: 4,
                        marginTop: 1,
                        marginLeft: 1,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        cursor: isFutureOrToday ? 'pointer' : 'default',
                        userSelect: 'none',
                        alignSelf: 'flex-end',
                        transition: 'background 0.2s, color 0.2s',
                      };
                      let cellBg = 'white';
                      if (!isCurrentMonth) {
                        cellBg = '#f5f5f5';
                        dayNumberStyle.background = 'transparent';
                        dayNumberStyle.color = '#b0b0b0';
                        dayNumberStyle.boxShadow = 'none';
                      } else if (isToday) {
                        cellBg = '#232c67';
                        dayNumberStyle.background = 'transparent';
                        dayNumberStyle.color = '#fff';
                        dayNumberStyle.boxShadow = 'none';
                      } else {
                        cellBg = 'white';
                        dayNumberStyle.background = 'white';
                        dayNumberStyle.color = '#232c67';
                      }
                      return (
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            padding: windowWidth < 640 ? '2px 2px 0 4px' : '4px 4px 0 6px',
                            minHeight: 0,
                            background: cellBg,
                            borderRadius: windowWidth < 640 ? 6 : 8,
                            border: '1px solid #e0e7ef',
                            boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                            margin: windowWidth < 640 ? 0.5 : 1,
                            transition: 'background 0.2s',
                            cursor: 'default',
                          }}
                        >
                          <div
                            style={{
                              ...dayNumberStyle,
                              pointerEvents: 'auto',
                              position: 'absolute',
                              top: windowWidth < 640 ? 2 : 4,
                              right: windowWidth < 640 ? 2 : 4,
                              zIndex: 20, // Lowered from 1000 to 20
                              margin: 0,
                              alignSelf: undefined,
                            }}
                            onClick={e => {
                              if (!isFutureOrToday) return;
                              e.stopPropagation();
                              dayNumberClickedRef.current = true;
                              setModalDay(value.getDate());
                              setModalMonth(monthNames[value.getMonth()]);
                              setModalYear(value.getFullYear());
                              setShowInputModal(true);
                              setNewEventTitle("");
                              setNewEventStartTime("09:00");
                              setNewEventEndTime("10:00");
                              setNewEventColor("bg-blue-400");
                              setSelectedEvent(null);
                            }}
                          >
                            {value.getDate()}
                          </div>
                          <div style={{ 
                            flex: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            minHeight: windowWidth < 640 ? 20 : 28, 
                            pointerEvents: 'auto' 
                          }}>
                            <CalendarMonthCellIcons
                              date={value}
                              events={cellEvents}
                              onEventClick={(event, e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setShowInputModal(false);
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                    dateHeader: () => null
                  },
                  event: ({ event, view }) => (view === 'agenda' ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      width: '100%',
                      padding: '4px 0',
                      whiteSpace: 'nowrap',
                      overflowX: 'auto'
                    }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 20,
                          height: 20,
                          minWidth: 20,
                          minHeight: 20,
                          borderRadius: '50%',
                          backgroundColor: event.color,
                          color: '#fff',
                          marginRight: 6,
                          flexShrink: 0
                        }}
                      >
                        <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
                      </span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        minWidth: 0,
                        flex: 1,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ 
                          fontWeight: 500, 
                          marginRight: event.agenda ? '8px' : '0'
                        }}>
                          {event.title}
                        </span>
                        {event.agenda && (
                          <span style={{ 
                            color: '#555', 
                            fontWeight: 400
                          }}>
                            - {event.agenda}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null),
                  agenda: {
                    event: ({ event }) => (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        width: '100%',
                        padding: '4px 0',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflowX: 'auto'
                      }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            minWidth: 20,
                            minHeight: 20,
                            borderRadius: '50%',
                            backgroundColor: event.color,
                            color: '#fff',
                            marginRight: 6,
                            flexShrink: 0
                          }}
                        >
                          <FaCalendarAlt style={{ color: '#fff', fontSize: 12 }} />
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          minWidth: 0,
                          flex: 1,
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ 
                            fontWeight: 500, 
                            marginRight: event.agenda ? '8px' : '0'
                          }}>
                            {event.title}
                          </span>
                          {event.agenda && (
                            <span style={{ 
                              color: '#555', 
                              fontWeight: 400
                            }}>
                              - {event.agenda}
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                    header: ({ label }) => (
                      label === 'Event' ? <span>Meeting Details</span> : <span>{label}</span>
                    )
                  }
                }}
              />
            </div>
          </div>
          <aside className="w-full lg:w-80 mt-0 lg:mt-0 order-first lg:order-last">
              <div className="bg-gray-50 rounded-xl border border-gray-200">
                <div className="bg-[#232c67] px-3 sm:px-5 py-3 border-b border-gray-200 rounded-t-xl">
                  <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                  Schedule Details
                </h2>
                <div className="relative dropdown-container ml-2 sm:ml-4">
                  <button
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation active:scale-95 min-h-[40px]"
                    onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  >
                    <FaCalendarAlt className="text-xs sm:text-sm text-gray-600" />
                    <span>{statusFilter}</span>
                    <FaChevronDown className={`text-xs sm:text-sm transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-32 sm:w-36 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {['Scheduled', 'Completed', 'Cancelled'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setStatusFilter(option);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors touch-manipulation active:scale-95 min-h-[44px] ${
                              statusFilter === option ? "bg-[#232c67] text-white" : "text-gray-900"
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
                <div className="p-2 sm:p-4">
              <div
                className="space-y-2 overflow-y-auto"
                style={{ 
                  minHeight: "100px",
                  maxHeight: "320px" // Show approximately 4 meetings by default
                }}
              >
                {(events
                  .filter(event => {
                    if (statusFilter === 'Scheduled') {
                      return event.status === 'Scheduled' || event.status === 'Rescheduled';
                    }
                    return event.status === statusFilter;
                  })
                  .sort((a, b) => new Date(b.start) - new Date(a.start))
                  .slice(0, 100)
                  .length === 0 ? (
                  <div className="text-gray-400 italic text-center py-8">
                    {statusFilter === 'Scheduled' && 'No meetings scheduled.'}
                    {statusFilter === 'Completed' && 'No meetings completed.'}
                    {statusFilter === 'Cancelled' && 'No meetings cancelled.'}
                  </div>
                ) : (
                  events
                    .filter(event => {
                      if (statusFilter === 'Scheduled') {
                        return event.status === 'Scheduled' || event.status === 'Rescheduled';
                      }
                      return event.status === statusFilter;
                    })
                    .sort((a, b) => new Date(b.start) - new Date(a.start))
                    .slice(0, 100)
                    .map((event, i) => (
                      <div
                        key={i}
                        className="bg-white p-2 sm:p-3 rounded-lg shadow-sm flex items-start sm:items-center gap-2 border border-gray-200 hover:shadow-md transition cursor-pointer touch-manipulation active:scale-95"
                        style={{
                          borderLeft: `${String(event.created_by) === String(localStorage.getItem('userId')) ? '6px solid #232c67' : '4px solid ' + event.color}`,
                          boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                          marginBottom: 6,
                          background: '#fff',
                          minHeight: '44px', // Minimum touch target size
                        }}
                        onClick={() => { setSelectedEvent(event); setShowInputModal(false); }}
                      >
                        <div className="text-lg sm:text-xl flex-shrink-0 mt-0.5 sm:mt-0" style={{ color: event.color }}>
                          <FaCalendarAlt />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-xs sm:text-sm" style={{ 
                            fontWeight: String(event.created_by) === String(localStorage.getItem('userId')) ? 700 : 500, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 4,
                            wordBreak: 'break-word'
                          }}>
                            <span className="truncate">{event.title}</span>
                            {String(event.created_by) === String(localStorage.getItem('userId')) && (
                              <span style={{
                                background: '#232c67',
                                color: '#fff',
                                borderRadius: '4px',
                                fontSize: '8px',
                                padding: '1px 4px',
                                marginLeft: '2px',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                display: 'inline-block',
                                flexShrink: 0
                              }}>You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="truncate">
                              {event.month} {event.day}, {event.year} | {event.time && (() => {
                                const [start, end] = event.time.split(" - ");
                                return `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                              })()}
                            </div>
                          </div>
                          <span
                            className={`mt-1 inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                              event.status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : event.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : event.status === "Scheduled" || event.status === "Rescheduled"
                                ? "bg-blue-100 text-blue-700"
                                : ""
                            }`}
                          >
                            {event.status || "Scheduled"}
                          </span>
                        </div>
                      </div>
                    ))
                ))}
              </div>
              </div>
            </div>
          </aside>
        </div>
        )}
      </div>
      </div>

      {/* Modal for adding event */}
      {showInputModal && !selectedEvent && !showInviteSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="bg-[#232c67] px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-white">Add Meeting</h2>
                  <button
                    onClick={() => { setShowInputModal(false); setModalDay(null); setModalMonth(null); setModalYear(null); setNewEventAgenda(""); }}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                  <FaTimes className="w-3 h-3" />
                    Close
                  </button>
                </div>
            </div>
                <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-sm max-h-[calc(90vh-80px)] overflow-y-auto">
                  <div>
                    <p className="font-bold mb-1">Title</p>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-full mb-2 caret-[#1E2A79]"
                      placeholder="Event Title"
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(toTitleCase(e.target.value))}
                    />
                    <p className="font-bold mb-1 mt-4">Agenda</p>
                    <textarea
                      className="border rounded px-2 py-1 w-full mb-2 caret-[#1E2A79]"
                      placeholder="Meeting Agenda"
                      value={newEventAgenda}
                      onChange={e => setNewEventAgenda(capitalizeFirst(e.target.value))}
                      rows={2}
                    />
                    <p className="font-bold mb-1 mt-4">When:</p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                        value={
                      modalDay && modalMonth && modalYear
                        ? `${modalYear}-${(monthNames.indexOf(modalMonth)+1).toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")}`
                            : ""
                        }
                        onChange={e => {
                          const [year, month, day] = e.target.value.split("-");
                      setModalYear(Number(year));
                      setModalMonth(monthNames[Number(month)-1]);
                          setModalDay(Number(day));
                        }}
                      />
                      {validation.date && <div className="text-red-500 text-xs mt-1">{validation.date}</div>}
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                          value={newEventStartTime || ""}
                          onChange={e => setNewEventStartTime(e.target.value)}
                        />
                        <span className="mx-1">-</span>
                        <input
                          type="time"
                          className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                          value={newEventEndTime || ""}
                          onChange={e => setNewEventEndTime(e.target.value)}
                        />
                      </div>
                      {validation.time && <div className="text-red-500 text-xs mt-1">{validation.time}</div>}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold mb-1">Invite:</p>
                    <button
                      className="bg-[#232c67] text-white px-3 py-1.5 rounded-full text-xs font-semibold w-full mb-6 flex items-center justify-center gap-1.5"
                      style={{minWidth: '120px'}}
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <FaUserPlus className="w-2.5 h-2.5" />
                      Click to Invite
                    </button>
                                         {selectedParentId && selectedStudentId && (
                       <div className="mb-2">
                         <div className="text-xs text-gray-700">
                           Parent: <b>{(() => {
                            const parent = advisoryParents.find(p => p.user_id === selectedParentId);
                            return parent ? formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname) : '';
                          })()}</b>
                           {editMode && String(selectedEvent?.parent_id) === String(selectedParentId) && (
                             <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1 rounded">(Currently Invited)</span>
                           )}
                         </div>
                         <div className="text-xs text-gray-700">
                           Student: <b>{(() => {
                            const student = advisoryStudents.find(s => s.student_id === selectedStudentId);
                            return student ? formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname) : '';
                          })()}</b>
                           {editMode && String(selectedEvent?.student_id) === String(selectedStudentId) && (
                             <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1 rounded">(Currently Invited)</span>
                           )}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
            {validation.invite && <div className="text-red-500 text-xs mt-1 px-6">{validation.invite}</div>}
            <div className="flex justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={handleAddEvent}
                className="px-4 sm:px-6 py-3 sm:py-2.5 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                    disabled={
                      !newEventTitle ||
                      !newEventAgenda ||
                      !modalDay || !modalMonth || !modalYear ||
                      !newEventStartTime || !newEventEndTime ||
                      !!validation.date || !!validation.time || !!validation.invite ||
                      !selectedParentId || !selectedStudentId
                    }
                  >
                <FaPlus className="w-3 h-3" />
                Create Meeting
                  </button>
                </div>
              </div>
            </div>
      )}
      {/* Modal for viewing event details */}
      {selectedEvent && !showInviteViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="bg-[#232c67] px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  {editMode ? 'Edit Meeting Details' : 'View Meeting Details'}
                </h2>
              <button
                onClick={() => { setSelectedEvent(null); setEditMode(false); setEditEventData(null); }}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                  <FaTimes className="w-3 h-3" />
                Close
              </button>
              </div>
            </div>
            {/* Wrap editMode/viewMode in a fragment to fix linter error */}
            <>
              {editMode ? (
                <>
                  <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-sm max-h-[calc(90vh-80px)] overflow-y-auto">
                    <div>
                      <p className="font-bold mb-1">Title</p>
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full mb-2 caret-[#1E2A79]"
                        value={editEventData?.title || ''}
                        onChange={e => setEditEventData({ ...editEventData, title: toTitleCase(e.target.value) })}
                      />
                      {selectedEvent.agenda && (
                        <>
                          <p className="font-bold mb-1 mt-4">Agenda</p>
                          <textarea
                            className="border rounded px-2 py-1 w-full mb-2 caret-[#1E2A79]"
                            value={editEventData?.agenda || ''}
                            onChange={e => setEditEventData({ ...editEventData, agenda: capitalizeFirst(e.target.value) })}
                            rows={2}
                          />
                        </>
                      )}
                      <p className="font-bold mb-1 mt-4">When:</p>
                      <div className="flex flex-col gap-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                          value={
                            editEventData?.year && editEventData?.month && editEventData?.day
                              ? `${editEventData.year}-${(monthNames.indexOf(editEventData.month)+1).toString().padStart(2, "0")}-${editEventData.day.toString().padStart(2, "0")}`
                              : ''
                          }
                          onChange={e => {
                            const [year, month, day] = e.target.value.split("-");
                            setEditEventData({
                              ...editEventData,
                              year: Number(year),
                              month: monthNames[Number(month)-1],
                              day: Number(day)
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                            value={editEventData?.startTime || ''}
                            onChange={e => setEditEventData({ ...editEventData, startTime: e.target.value })}
                          />
                          <span className="mx-1">-</span>
                          <input
                            type="time"
                            className="border rounded px-2 py-1 w-full caret-[#1E2A79]"
                            value={editEventData?.endTime || ''}
                            onChange={e => setEditEventData({ ...editEventData, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                      {(validation.date || validation.time || validation.invite) && (
                        <div className="pt-2">
                          {validation.date && <div className="text-red-500 text-xs mt-1">{validation.date}</div>}
                          {validation.time && <div className="text-red-500 text-xs mt-1">{validation.time}</div>}
                          {validation.invite && <div className="text-red-500 text-xs mt-1">{validation.invite}</div>}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold mb-1 mt-4">Invite:</p>
                      <button
                        className="bg-[#232c67] text-white px-3 py-1.5 rounded-full text-xs font-semibold w-full mb-6 flex items-center justify-center gap-1.5"
                        style={{minWidth: '120px'}} type="button"
                        onClick={handleOpenInviteModal}
                      >
                        <FaEdit className="w-2.5 h-2.5" />
                        Edit Invite List
                      </button>
                      {selectedParentId && selectedStudentId && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-700">
                            Parent: <b>{(() => {
                              const parent = advisoryParents.find(p => String(p.user_id) === String(selectedParentId));
                              return parent ? formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname) : '';
                            })()}</b>
                          </div>
                          <div className="text-xs text-gray-700">
                            Student: <b>{(() => {
                              const student = advisoryStudents.find(s => String(s.student_id) === String(selectedStudentId));
                              return student ? formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname) : '';
                            })()}</b>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 sm:px-6 py-3 sm:py-2.5 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                      disabled={!!validation.date || !!validation.time || !!validation.invite}
                    >
                      <FaSave className="w-3 h-3" />
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 sm:p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm items-start">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="font-bold mb-1">Title</p>
                        <div className="mb-2">{selectedEvent.title}</div>
                      </div>
                      {selectedEvent.agenda && (
                        <div>
                          <p className="font-bold mb-1 mt-2">Agenda</p>
                          <div className="mb-2 whitespace-pre-line">{selectedEvent.agenda}</div>
                        </div>
                      )}
                      <div>
                        <p className="font-bold mb-1 mt-2">When:</p>
                        <div>{selectedEvent.month} {selectedEvent.day}, {selectedEvent.year}</div>
                        <div>
                          {selectedEvent.time && (() => {
                            const [start, end] = selectedEvent.time.split(" - ");
                            return `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <p className="font-bold mb-1">Invite:</p>
                      <button
                        className="bg-[#232c67] text-white px-3 py-1.5 rounded-full text-xs font-semibold w-full mb-6 flex items-center justify-center gap-1.5"
                        style={{minWidth: '120px'}} type="button"
                        onClick={() => setShowInviteViewModal(true)}
                      >
                        <FaEye className="w-2.5 h-2.5" />
                        View Invite List
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-8">
                    {(selectedEvent.status === 'Completed') ? (
                      <button
                        className="px-4 py-1 bg-green-200 text-green-700 rounded-full text-sm font-semibold cursor-default opacity-80"
                        disabled
                        style={{ pointerEvents: 'none' }}
                      >
                        Completed
                      </button>
                    ) : (selectedEvent.status === 'Cancelled') ? (
                      <button
                        className="px-4 py-1 bg-red-200 text-red-700 rounded-full text-sm font-semibold cursor-default opacity-80"
                        disabled
                        style={{ pointerEvents: 'none' }}
                      >
                        Cancelled
                      </button>
                    ) : (
                      // Only show Edit/Cancel if user is creator
                      (localStorage.getItem('userId') && String(localStorage.getItem('userId')) === String(selectedEvent.created_by)) ? (
                        <>
                          <button
                            onClick={() => {
                              setShowCancelModal(true);
                              toast.info("Cancel meeting confirmation required");
                            }}
                            className="px-4 sm:px-6 py-3 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                          >
                            <FaTimesCircle className="w-3 h-3" />
                            Cancel Meeting
                          </button>
                          <button
                            onClick={handleEditClick}
                            className="px-4 sm:px-6 py-3 sm:py-2.5 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                          >
                            <FaEdit className="w-3 h-3" />
                            Edit
                          </button>
                        </>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </>
          </div>
        </div>
      )}

      {/* Cancel Meeting Confirmation Modal */}
      {showCancelModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Cancel Meeting</h2>
              <p className="text-sm text-gray-600 mb-4">This action cannot be undone</p>
            </div>

            <div className="mx-6 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Are you sure you want to cancel this meeting?
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p><strong>Meeting:</strong> {selectedEvent.title}</p>
                      <p><strong>Date:</strong> {selectedEvent.month} {selectedEvent.day}, {selectedEvent.year}</p>
                      <p><strong>Time:</strong> {selectedEvent.time && (() => {
                        const [start, end] = selectedEvent.time.split(" - ");
                        return `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                      })()}</p>
                    </div>
                        </div>
                          </div>
                      </div>
                </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
                <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 sm:px-6 py-3 sm:py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                >
                <FaTimes className="w-3 h-3" />
                Keep Meeting
                </button>
                <button
                                  onClick={async () => {
                  setCancelLoading(true);
                  try {
                    const userId = localStorage.getItem('userId');
                    const created_by = userId ? parseInt(userId, 10) : 1;
                    
                    const payload = {
                      meeting_id: selectedEvent.id,
                      meeting_status: 'Cancelled',
                      created_by: created_by,
                      notif_message: "[ONE ON ONE MEETING] Cancelled the meeting"
                    };
                    
                    const res = await fetch("/php/Meeting/update_meeting.php", {
                      method: 'POST',
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                      await fetchMeetings(setEvents, created_by, setLoading);
                      setSelectedEvent({ ...selectedEvent, status: 'Cancelled' });
                      toast.success('Meeting cancelled successfully!');
                    } else {
                      toast.error('Failed to cancel meeting: ' + (data.message || 'Unknown error'));
                    }
                  } catch (err) {
                    toast.error('Error connecting to server: ' + err.message);
                  }
                  setCancelLoading(false);
                  setShowCancelModal(false);
                }}
                                className="px-4 sm:px-6 py-3 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 touch-manipulation active:scale-95 min-h-[44px] w-full sm:w-auto justify-center"
                disabled={cancelLoading}
                >
                <FaTimesCircle className="w-3 h-3" />
                {cancelLoading ? 'Cancelling...' : 'Cancel Meeting'}
                </button>
              </div>
              </div>
                </div>
              )}

      {/* Invite modal for view mode */}
      {showInviteViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[200]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Invited List</h2>
              <button
                  onClick={() => setShowInviteViewModal(false)}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                  <FaTimes className="w-3 h-3" />
                  Close
              </button>
            </div>
            </div>
            <div className="p-6">
              {/* Tabs */}
              <div className="flex mb-6">
                {String(selectedEvent?.created_by) !== String(localStorage.getItem('userId')) ? (
                  // For meetings created by Super Admin/Other Admin - show Teacher and Parent
                  <>
                    <button
                      className={`flex-1 py-2 rounded-l-full font-semibold ${inviteSelectTab === "teacher" ? "bg-[#1E2A79] text-white" : "bg-blue-100 text-gray-700"}`}
                      onClick={() => setInviteSelectTab("teacher")}
                    >
                      Teacher
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-r-full font-semibold ${inviteSelectTab === "parent" ? "bg-[#1E2A79] text-white" : "bg-blue-100 text-gray-700"}`}
                      onClick={() => setInviteSelectTab("parent")}
                    >
                      Parent
                    </button>
                  </>
                ) : (
                  // For meetings created by Teacher - show Parent and Student
                  <>
                    <button
                      className={`flex-1 py-2 rounded-l-full font-semibold ${inviteSelectTab === "parent" ? "bg-[#1E2A79] text-white" : "bg-blue-100 text-gray-700"}`}
                      onClick={() => setInviteSelectTab("parent")}
                    >
                      Parent
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-r-full font-semibold ${inviteSelectTab === "student" ? "bg-[#1E2A79] text-white" : "bg-blue-100 text-gray-700"}`}
                      onClick={() => setInviteSelectTab("student")}
                    >
                      Student
                    </button>
                  </>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={inviteViewSearch}
                    onChange={e => setInviteViewSearch(e.target.value)}
                    className="pl-10 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full caret-[#1E2A79]"
                    style={{ minHeight: '2rem' }}
                  />
                  {inviteViewSearch && (
                    <button
                      onClick={() => setInviteViewSearch("")}
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

              {/* Loading state */}
              {invitedList.loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading invited list...</p>
                  </div>
              )}

              {/* Error state */}
              {invitedList.error && (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm">{invitedList.error}</p>
                </div>
              )}

              {/* Content based on tab selection */}
              {!invitedList.loading && !invitedList.error && (() => {
                // Calculate the maximum count across all tabs to determine consistent height
                const maxCount = Math.max(
                  invitedList.teachers?.length || 0,
                  invitedList.parents?.length || 0,
                  invitedList.students?.length || 0
                );
                
                // Calculate minimum height based on content (each item is roughly 44px + spacing)
                const minHeight = Math.max(200, Math.min(320, (maxCount * 48) + 100));
                const shouldScroll = maxCount >= 5;
                
                return (
                  <div className="space-y-4">
                                      {inviteSelectTab === "teacher" && (() => {
                    // Filter teachers based on search
                    const filteredTeachers = invitedList.teachers.filter(teacher => {
                      const teacherName = formatName(teacher.user_firstname, teacher.user_middlename, teacher.user_lastname).toLowerCase();
                      return !inviteViewSearch || teacherName.includes(inviteViewSearch.toLowerCase());
                    });

                    return (
                      <div className="border rounded-lg bg-gray-50" style={{ minHeight: `${minHeight}px` }}>
                        <h3 className="font-medium text-gray-900 p-4 pb-2">Teachers ({filteredTeachers.length})</h3>
                        <div className={`px-4 pb-4 ${shouldScroll ? 'max-h-64 overflow-y-auto' : ''}`}>
                          {(() => {

                          if (invitedList.teachers.length === 0) {
                            return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg font-medium mb-2">No Teachers Invited</div>
                      <div className="text-sm">This meeting has no teacher invitations.</div>
                    </div>
                            );
                          }

                          if (filteredTeachers.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-lg font-medium mb-2">No Teachers Found</div>
                          <div className="text-sm">No teachers match your search "{inviteViewSearch}".</div>
                        </div>
                      );
                    }
                    
                    return (
                            <div className="space-y-2">
                              {filteredTeachers.map((teacher, idx) => (
                                <div key={idx} className="py-2 px-3 border-b border-gray-200 last:border-b-0">
                                  <div className="font-medium text-gray-900">
                                    {formatName(teacher.user_firstname, teacher.user_middlename, teacher.user_lastname)}
                                  </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                  </div>
                    );
                  })()}

                    {inviteSelectTab === "parent" && (() => {
                      // Deduplicate parents by user_id before filtering
                      const uniqueParents = invitedList.parents.reduce((acc, parent) => {
                        if (!acc.find(p => p.user_id === parent.user_id)) {
                          acc.push(parent);
                        }
                        return acc;
                      }, []);
                      
                      // Filter parents based on search
                      const filteredParents = uniqueParents.filter(parent => {
                        const parentName = formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname).toLowerCase();
                        return !inviteViewSearch || parentName.includes(inviteViewSearch.toLowerCase());
                      });

                      return (
                        <div className="border rounded-lg bg-gray-50" style={{ minHeight: `${minHeight}px` }}>
                          <h3 className="font-medium text-gray-900 p-4 pb-2">
                            {String(selectedEvent?.created_by) === String(localStorage.getItem('userId')) 
                              ? `Parent` 
                              : `Parents (${filteredParents.length})`}
                          </h3>
                          <div className={`px-4 pb-4 ${shouldScroll ? 'max-h-64 overflow-y-auto' : ''}`}>
                            {(() => {

                            if (invitedList.parents.length === 0) {
                              return (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg font-medium mb-2">No Parents Invited</div>
                      <div className="text-sm">This meeting has no parent invitations.</div>
                    </div>
                              );
                            }

                            if (filteredParents.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-lg font-medium mb-2">No Parents Found</div>
                          <div className="text-sm">No parents match your search "{inviteViewSearch}".</div>
                        </div>
                      );
                    }
                    
                    return (
                              <div className="space-y-2">
                                {filteredParents.map((parent, idx) => (
                                  <div key={idx} className="py-2 px-3 border-b border-gray-200 last:border-b-0">
                                    <div className="font-medium text-gray-900">
                                      {formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname)}
                                    </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                  </div>
                      );
                    })()}

                    {inviteSelectTab === "student" && (() => {
                      // Deduplicate students by student_id before filtering
                      const uniqueStudents = invitedList.students.reduce((acc, student) => {
                        if (!acc.find(s => s.student_id === student.student_id)) {
                          acc.push(student);
                        }
                        return acc;
                      }, []);
                      
                      // Filter students based on search
                      const filteredStudents = uniqueStudents.filter(student => {
                        const studentName = formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname).toLowerCase();
                        return !inviteViewSearch || studentName.includes(inviteViewSearch.toLowerCase());
                      });

                      return (
                        <div className="border rounded-lg bg-gray-50" style={{ minHeight: `${minHeight}px` }}>
                          <h3 className="font-medium text-gray-900 p-4 pb-2">
                            {String(selectedEvent?.created_by) === String(localStorage.getItem('userId')) 
                              ? `Student` 
                              : `Students (${filteredStudents.length})`}
                          </h3>
                          <div className={`px-4 pb-4 ${shouldScroll ? 'max-h-64 overflow-y-auto' : ''}`}>
                            {(() => {

                            if (invitedList.students.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <div className="text-lg font-medium mb-2">No Students Invited</div>
                                  <div className="text-sm">This meeting has no student invitations.</div>
                                </div>
                              );
                            }

                            if (filteredStudents.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-lg font-medium mb-2">No Students Found</div>
                          <div className="text-sm">No students match your search "{inviteViewSearch}".</div>
                        </div>
                      );
                    }
                    
                    return (
                              <div className="space-y-2">
                                {filteredStudents.map((student, idx) => (
                                  <div key={idx} className="py-2 px-3 border-b border-gray-200 last:border-b-0">
                                    <div className="font-medium text-gray-900">
                                      {formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname)}
                                    </div>
                          </div>
                        ))}
                      </div>
                    );
                            })()}
                    </div>
                </div>
                      );
                    })()}
              </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal for Add/Edit Mode */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[200]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {inviteStep === 1 ? 'Select Parent to Invite' : 'Select Student'}
                </h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteStep(1);
                    setTempSelectedParentId(null);
                    setTempSelectedStudentId(null);
                    setInviteModalSearch("");
                  }}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <FaTimes className="w-3 h-3" />
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Search bar */}
              <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                  placeholder={`Search ${inviteStep === 1 ? 'parents' : 'students'}...`}
                  className="pl-10 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 caret-[#1E2A79]"
                    value={inviteModalSearch}
                  onChange={(e) => setInviteModalSearch(e.target.value)}
                />
              </div>

              {/* Content */}
              <div className="space-y-2 h-64 overflow-y-auto">
                {inviteStep === 1 ? (
                  // Step 1: Parent selection
                  (() => {
                    // Deduplicate parents by user_id before filtering
                    const uniqueParents = advisoryParents.reduce((acc, parent) => {
                      if (!acc.find(p => p.user_id === parent.user_id)) {
                        acc.push(parent);
                      }
                      return acc;
                    }, []);
                    
                    const filteredParents = uniqueParents.filter(parent => 
                      formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname).toLowerCase()
                        .includes(inviteModalSearch.toLowerCase())
                    );
                      
                      if (filteredParents.length === 0) {
                        return (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-lg font-medium mb-2">No Parents Found</div>
                            <div className="text-sm">
                              {inviteModalSearch ? 
                                `No parents match your search "${inviteModalSearch}".` : 
                                'No parents available to invite.'
                              }
                            </div>
                          </div>
                          </div>
                        );
                      }
                      
                    return filteredParents.map((parent) => (
                      <div
                        key={parent.user_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          tempSelectedParentId === parent.user_id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => setTempSelectedParentId(parent.user_id)}
                      >
                        <p className="font-medium">{formatName(parent.user_firstname, parent.user_middlename, parent.user_lastname)}</p>
                        <p className="text-sm text-gray-600">{parent.user_email}</p>
                        </div>
                    ));
                  })()
                ) : (
                  // Step 2: Student selection (filtered by selected parent)
                  (() => {
                    // Deduplicate students by student_id before filtering
                    const uniqueStudents = advisoryStudents.reduce((acc, student) => {
                      if (!acc.find(s => s.student_id === student.student_id)) {
                        acc.push(student);
                      }
                      return acc;
                    }, []);
                    
                    const filteredStudents = uniqueStudents.filter(student => 
                      String(student.parent_id) === String(tempSelectedParentId) &&
                      formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname).toLowerCase()
                        .includes(inviteModalSearch.toLowerCase())
                    );
                      
                      if (filteredStudents.length === 0) {
                        return (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-lg font-medium mb-2">No Students Found</div>
                            <div className="text-sm">
                              {inviteModalSearch ? 
                                `No students match your search "${inviteModalSearch}".` : 
                                'No students available for the selected parent.'
                              }
                            </div>
                          </div>
                          </div>
                        );
                      }
                      
                      return (
                      <div className="space-y-2">
                        {filteredStudents.length > 1 && (
                          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                            💡 This parent has {filteredStudents.length} children in your class. Please select which student to invite.
                          </div>
                        )}
                        {filteredStudents.map((student, index) => (
                          <div
                            key={student.student_id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              tempSelectedStudentId === student.student_id 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'hover:bg-gray-50 border-gray-200'
                            }`}
                            onClick={() => setTempSelectedStudentId(student.student_id)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname)}</p>
                              {filteredStudents.length > 1 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                  Child {index + 1} of {filteredStudents.length}
                                </span>
                              )}
                            </div>
                            {student.grade_level && (
                              <p className="text-sm text-gray-600 mt-1">Grade {student.grade_level}</p>
                            )}
                          </div>
                        ))}
                        </div>
                      );
                  })()
                )}
                  </div>
                  
              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                {inviteStep === 2 && (
                    <button
                      onClick={() => {
                        setInviteStep(1);
                        setTempSelectedStudentId(null);
                      setInviteModalSearch("");
                      }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Back
                    </button>
                )}
                
                <div className="ml-auto">
                  {inviteStep === 1 ? (
                    <button
                      onClick={() => {
                        if (tempSelectedParentId) {
                          setInviteStep(2);
                          setInviteModalSearch("");
                        }
                      }}
                      disabled={!tempSelectedParentId}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (tempSelectedParentId && tempSelectedStudentId) {
                        setSelectedParentId(tempSelectedParentId);
                        setSelectedStudentId(tempSelectedStudentId);
                        setShowInviteModal(false);
                        setInviteStep(1);
                          setTempSelectedParentId(null);
                          setTempSelectedStudentId(null);
                        setInviteModalSearch("");
                        }
                      }}
                      disabled={!tempSelectedStudentId}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <FaCheck className="w-3 h-3" />
                      Confirm
                    </button>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}