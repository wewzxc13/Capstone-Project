"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

// Helper function to compare arrays for equality
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const meetingColorMap = [
  { name: "purple", hex: "#a78bfa" },
  { name: "pink", hex: "#f472b6" },
  { name: "green", hex: "#34d399" },
  { name: "yellow", hex: "#facc15" },
  { name: "orange", hex: "#fb923c" },
  { name: "teal", hex: "#2dd4bf" },
  { name: "indigo", hex: "#818cf8" }
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
async function fetchMeetings(setEvents) {
  try {
    const res = await fetch("http://localhost/capstone-project/backend/Meeting/get_meetings_details.php");
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
          student_id: m.student_id,
          advisory_id: m.advisory_id
        };
      });
      setEvents(mapped);
    } else {
      toast.error("Failed to load meetings");
    }
  } catch (err) {
    toast.error("Error loading meetings");
  }
}

export default function SuperAdminCalendarPage() {
  const [events, setEvents] = useState([]);
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
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [newEventAgenda, setNewEventAgenda] = useState("");
  const [validation, setValidation] = useState({ date: "", time: "", invite: "" });
  const [editMode, setEditMode] = useState(false);
  const [editEventData, setEditEventData] = useState(null);
  const [invitedList, setInvitedList] = useState({ teachers: [], parents: [], loading: false, error: null });
  const [originalInvitees, setOriginalInvitees] = useState({ teachers: [], parents: [] });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Scheduled');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [meetingCreator, setMeetingCreator] = useState(null);
  // Add state for current view date
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  // Add state for calendar view
  const [calendarView, setCalendarView] = useState('month');
  // Ref to track if day number was clicked
  const dayNumberClickedRef = useRef(false);

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
  // Add state to track if invite list has been loaded for the current meeting
  const [inviteListLoaded, setInviteListLoaded] = useState(false);
  // Add userId state for SSR safety
  const [userId, setUserId] = useState(null);
  // Add state for class advisory functionality
  const [studentLevels, setStudentLevels] = useState([
    { level_id: 1, level_name: "Discoverer" },
    { level_id: 2, level_name: "Explorer" },
    { level_id: 3, level_name: "Adventurer" }
  ]);
  const [advisoryData, setAdvisoryData] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  // Add state for advisory parents and students for one-on-one meetings
  const [advisoryParents, setAdvisoryParents] = useState([]);
  const [advisoryStudents, setAdvisoryStudents] = useState([]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'));
    }
  }, []);

  // Convert events to react-big-calendar format
  const calendarEvents = events.map(toCalendarEvent);

  // Fetch all users (teachers/parents) on mount
  useEffect(() => {
    async function fetchUsers() {
      console.log("🚀 Starting user data fetch...");
      setUsersLoading(true);
      try {
        console.log("📡 Making API request...");
        const res = await fetch(`http://localhost/capstone-project/backend/Users/get_all_users.php`, {
          method: 'GET',
          cache: 'no-cache'
        });
        console.log("📡 Response status:", res.status, res.statusText);
        console.log("📡 Response headers:", Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("🔄 API Response received:", data);
        
        if (data.status === "success") {
          console.log("✅ API Success - starting data processing");
          
          // Teachers - API already filters for active users only
          const rawTeachers = data.users?.Teacher || [];
          const teacherData = rawTeachers.map(u => ({ 
            id: u.id, 
            name: u.name, 
            firstName: u.firstName,
            middleName: u.middleName,
            lastName: u.lastName,
            checked: false 
          }));
          setTeachers(teacherData);
          console.log("✅ Teachers state set:", teacherData.length, "teachers");

          // Parents and Students - API already filters for active users only
          const parents = data.users.Parent || [];
          const students = data.users.Student || [];

          // Map active students by parent_id
          const studentsByParentId = {};
          students.forEach(student => {
            if (student.parent_id) {
              if (!studentsByParentId[student.parent_id]) {
                studentsByParentId[student.parent_id] = [];
              }
              studentsByParentId[student.parent_id].push(student);
            }
          });

          // Only active parents with at least one linked active student
          const parentsWithStudents = parents
            .filter(parent => studentsByParentId[parent.id])
            .map(parent => ({
              id: parent.id,
              name: parent.name,
              firstName: parent.firstName,
              middleName: parent.middleName,
              lastName: parent.lastName,
              checked: false,
              linkedStudents: studentsByParentId[parent.id]
            }));

          setParents(parentsWithStudents);
          console.log("✅ Parents state set:", parentsWithStudents.length, "parents");
          console.log("🏁 Setting usersLoading to false");
          
          // Small delay to ensure state updates have propagated
          setTimeout(() => {
            setUsersLoading(false);
          }, 100);
        } else {
          console.error("API returned non-success status:", data);
          toast.error("Failed to load users data");
          setUsersLoading(false);
        }
      } catch (err) {
        console.error("❌ Error loading users data:", err);
        toast.error("Error loading users data: " + err.message);
        console.log("🏁 Setting usersLoading to false due to error");
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Fetch student levels and advisory data
  useEffect(() => {
    async function fetchLevelsAndAdvisory() {
      try {
        // Fetch student levels
        const levelsRes = await fetch("http://localhost/capstone-project/backend/Advisory/get_student_levels.php");
        const levelsData = await levelsRes.json();
        console.log("Student levels response:", levelsData);
        if (levelsData.status === "success") {
          setStudentLevels(levelsData.levels || []);
          console.log("Set student levels:", levelsData.levels);
        } else {
          toast.error("Failed to load student levels");
        }

        // Fetch advisory data
        const advisoryRes = await fetch("http://localhost/capstone-project/backend/Advisory/get_all_advisory_details.php");
        const advisoryData = await advisoryRes.json();
        console.log("Advisory data response:", advisoryData);
        if (advisoryData.status === "success") {
          setAdvisoryData(advisoryData.advisories || []);
          console.log("Set advisory data:", advisoryData.advisories);
          
          // Extract students from advisory data - only active students
          const allStudents = [];
          
          advisoryData.advisories?.forEach(advisory => {
            // Add students from this advisory
            if (advisory.students) {
              advisory.students.forEach(student => {
                // API already filters for active students, just avoid duplicates
                if (!allStudents.find(s => s.student_id === student.student_id)) {
                  allStudents.push(student);
                }
              });
            }
          });
          
          setAdvisoryStudents(allStudents);
          console.log("Extracted students from advisory data:", allStudents);
        } else {
          toast.error("Failed to load advisory data");
        }
      } catch (err) {
        console.error("Error fetching levels and advisory data:", err);
        toast.error("Error loading advisory data");
      }
    }
    fetchLevelsAndAdvisory();
  }, []);

  // Fetch meetings from backend on mount
  useEffect(() => {
    fetchMeetings(setEvents);
  }, []);

  // Move fetchInvitedList here so it can access setInvitedList
  // Function to fetch meeting creator details
  async function fetchMeetingCreator(createdBy) {
    if (!createdBy) return null;
    
    try {
      const response = await fetch('http://localhost/capstone-project/backend/Users/get_user_details.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: createdBy }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        return data.user;
      }
    } catch (error) {
      console.error('Error fetching meeting creator details:', error);
    }
    return null;
  }

  // Function to fetch meeting creator details
  async function fetchMeetingCreator(createdBy) {
    if (!createdBy) return null;
    
    try {
      const response = await fetch('http://localhost/capstone-project/backend/Users/get_user_details.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: createdBy }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        return data.user;
      }
    } catch (error) {
      console.error('Error fetching meeting creator details:', error);
    }
    return null;
  }

  async function fetchInvitedList(meetingId) {
    console.log("🔄 fetchInvitedList called with meetingId:", meetingId);
    console.log("🔄 Current invitedList state before fetch:", invitedList);
    setInvitedList({ teachers: [], parents: [], students: [], loading: true, error: null });
    
    // Fetch meeting creator details if available
    let creator = null;
    if (selectedEvent?.created_by) {
      creator = await fetchMeetingCreator(selectedEvent.created_by);
      setMeetingCreator(creator);
    }
    
    // Check if this is a one-on-one meeting (has parent_id and student_id)
    const isOneOnOne = selectedEvent?.parent_id && selectedEvent?.student_id;
    
    console.log('fetchInvitedList called with meetingId:', meetingId);
    console.log('selectedEvent:', selectedEvent);
    console.log('isOneOnOne:', isOneOnOne);
    console.log('parents length:', parents.length);
    console.log('advisoryStudents length:', advisoryStudents.length);
    
    try {
      if (isOneOnOne) {
        // For one-on-one meetings: get parent and student details from advisory data
        console.log('Processing one-on-one meeting from selectedEvent:', selectedEvent);
        console.log('Looking for parent_id:', selectedEvent.parent_id);
        console.log('Looking for student_id:', selectedEvent.student_id);
        
        // Get parent and student details from the available data
        const parent = parents.find(p => String(p.id) === String(selectedEvent.parent_id));
        const student = advisoryStudents.find(s => String(s.student_id) === String(selectedEvent.student_id));
        
        console.log('Found parent:', parent);
        console.log('Found student:', student);
        console.log('Available parents:', parents.map(p => ({ id: p.id, name: p.name })));
        console.log('Available students:', advisoryStudents.map(s => ({ student_id: s.student_id, name: `${s.stud_firstname} ${s.stud_lastname}` })));
        
        const newInvitedList = {
          teachers: [], // No teachers for one-on-one meetings
          parents: parent ? [parent] : [],
          students: student ? [student] : [],
          loading: false,
          error: null
        };
        console.log("✅ Setting invitedList for one-on-one meeting:", newInvitedList);
        setInvitedList(newInvitedList);
      } else {
        // For group meetings: get teachers and parents from tbl_notification_recipients
        const res = await fetch(`http://localhost/capstone-project/backend/Meeting/get_notification_recipients.php?meeting_id=${meetingId}`);
        const data = await res.json();
        if (data.status === 'success') {
          console.log('Fetched invited teachers:', data.teachers);
          console.log('Fetched invited parents:', data.parents);
          
          // If meeting was created by a teacher, also get student data for the parents
          let students = [];
          if (creator?.role === 'Teacher' && data.parents && data.parents.length > 0) {
            // Get student data for the invited parents
            const parentIds = data.parents.map(p => p.user_id);
            students = advisoryStudents.filter(s => parentIds.includes(s.parent_id));
          }
          
          const newInvitedList = {
            teachers: data.teachers || [],
            parents: data.parents || [],
            students: students,
            loading: false,
            error: null
          };
          console.log("✅ Setting invitedList with new data:", newInvitedList);
          setInvitedList(newInvitedList);
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
    setMeetingCreator(null); // Reset meeting creator when selecting a new event
  };

  // Test function to debug invitee update issues
  const testInviteeUpdate = async (meetingId) => {
    console.log("🧪 Testing invitee update for meeting:", meetingId);
    try {
      const res = await fetch(`http://localhost/capstone-project/test_invitee_update.php?meeting_id=${meetingId}`);
      
      // Log response details for debugging
      console.log("🔍 Response Status:", res.status);
      console.log("🔍 Response Headers:", Object.fromEntries(res.headers.entries()));
      
      // Get raw response text first
      const responseText = await res.text();
      console.log("🔍 Raw Response Text:", responseText);
      
      // Try to parse as JSON
      if (!responseText.trim()) {
        console.error("🧪 Empty response received");
        return null;
      }
      
      const data = JSON.parse(responseText);
      console.log("🧪 Test API Response:", data);
      
      // Log key information
      console.log("📋 Meeting Details:", data.meeting_details);
      console.log("👥 Current Recipients:", data.current_recipients);
      console.log("✅ Available Users:", data.available_users);
      console.log("📊 Debug Info:", data.debug_info);
      
      return data;
    } catch (err) {
      console.error("🧪 Test API Error:", err);
      console.error("🧪 Error details:", err.message);
      return null;
    }
  };

  // Add new event from modal
  const handleAddEvent = async () => {
    if (!newEventTitle || !newEventStartTime || !newEventEndTime) return;

    // Compose start/end datetime strings
    const monthIndex = monthNames.indexOf(modalMonth) + 1;
    const startDate = `${modalYear}-${monthIndex.toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")} ${newEventStartTime}:00`;
    const endDate = `${modalYear}-${monthIndex.toString().padStart(2, "0")}-${modalDay.toString().padStart(2, "0")} ${newEventEndTime}:00`;

    // Gather recipients from checked teachers/parents
    const selectedTeachers = teachers.filter(t => t.checked).map(t => ({ user_id: t.id, recipient_type: "Teacher" }));
    const selectedParents = parents.filter(p => p.checked).map(p => ({ user_id: p.id, recipient_type: "Parent" }));
    const recipients = [...selectedTeachers, ...selectedParents];

    // Get the current user's ID from localStorage
    const created_by = userId ? parseInt(userId, 10) : 1;

    // Compose notification message for system logs
    const notif_message = `[MEETING] Created the Meeting`;

    // Prepare payload
    const payload = {
      meeting_title: newEventTitle,
      meeting_agenda: newEventAgenda,
      meeting_start: startDate,
      meeting_end: endDate,
      created_by,
      recipients,
      parent_id: null, // or set if 1-on-1
      student_id: null, // or set if 1-on-1
      advisory_id: null, // or set if needed
      notif_message
    };

    try {
      const res = await fetch("http://localhost/capstone-project/backend/Meeting/create_meeting.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "success") {
        await fetchMeetings(setEvents);
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

    // Invite validation
    const hasInvite = teachers.some(t => t.checked) || parents.some(p => p.checked);
    if (!hasInvite) {
      newValidation.invite = "  Please select at least one invitee.";
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
      console.log('📋 Opening View Invited List modal - fetching invited list for meeting_id:', selectedEvent.id);
      console.log('📋 inviteListLoaded flag:', inviteListLoaded);
      
      // Always fetch fresh data when opening the modal
      fetchInvitedList(selectedEvent.id);
      
      // Always default to Teacher tab
      setInviteSelectTab("teacher");
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
    // Invite validation
    const hasInvite = teachers.some(t => t.checked) || parents.some(p => p.checked);
    if (!hasInvite) {
      newValidation.invite = '  Please select at least one invitee.';
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

  // Function to handle class level selection and auto-fill teachers/parents
  const handleClassLevelSelection = (levelId) => {
    console.log("handleClassLevelSelection called with levelId:", levelId);
    console.log("Current advisoryData:", advisoryData);
    console.log("Current teachers:", teachers);
    console.log("Current parents:", parents);
    
    let newSelectedLevels;
    if (selectedLevels.includes(levelId)) {
      // Remove level if already selected
      newSelectedLevels = selectedLevels.filter(id => id !== levelId);
    } else {
      // Add level if not selected
      newSelectedLevels = [...selectedLevels, levelId];
    }
    
    setSelectedLevels(newSelectedLevels);
    setAllChecked(false); // Reset all checkbox when selecting specific levels
    
    if (newSelectedLevels.length === 0) {
      // If no levels selected, uncheck all
      setTeachers(teachers.map(t => ({ ...t, checked: false })));
      setParents(parents.map(p => ({ ...p, checked: false })));
      return;
    }

    // Collect all teacher IDs and parent IDs from all selected levels
    const allAdvisorTeacherIds = [];
    const allParentIdsWithChildrenInAdvisory = [];
    
    newSelectedLevels.forEach(levelId => {
      // Find all advisories for this level
      const levelAdvisories = advisoryData.filter(adv => adv.level_id === levelId);
      console.log(`Found levelAdvisories for level ${levelId}:`, levelAdvisories);
      
      levelAdvisories.forEach(advisory => {
        // Add lead teacher
        if (advisory.lead_teacher_id) {
          allAdvisorTeacherIds.push(advisory.lead_teacher_id);
        }
        // Add assistant teacher
        if (advisory.assistant_teacher_id) {
          allAdvisorTeacherIds.push(advisory.assistant_teacher_id);
        }
        
        // Add students' parent IDs
        const studentsInAdvisory = advisory.students || [];
        studentsInAdvisory.forEach(student => {
          if (student.parent_id && !allParentIdsWithChildrenInAdvisory.includes(student.parent_id)) {
            allParentIdsWithChildrenInAdvisory.push(student.parent_id);
          }
        });
      });
    });
    
    console.log("All advisor teacher IDs:", allAdvisorTeacherIds);
    console.log("All parent IDs with children in advisory:", allParentIdsWithChildrenInAdvisory);

    // Update teachers - check those who are advisors for any selected level
    setTeachers(teachers.map(teacher => ({
      ...teacher,
      checked: allAdvisorTeacherIds.includes(parseInt(teacher.id))
    })));

    // Update parents - check those whose children are in any selected level's advisories
    setParents(parents.map(parent => ({
      ...parent,
      checked: allParentIdsWithChildrenInAdvisory.includes(parseInt(parent.id))
    })));
  };

  // Function to handle "All" checkbox toggle
  const handleAllToggle = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);
    
    if (newAllChecked) {
      // Check all class level checkboxes
      const allLevelIds = studentLevels.map(level => level.level_id);
      setSelectedLevels(allLevelIds);
      
      // Check all teachers and parents
      setTeachers(teachers.map(t => ({ ...t, checked: true })));
      setParents(parents.map(p => ({ ...p, checked: true })));
    } else {
      // Uncheck all class level checkboxes
      setSelectedLevels([]);
      
      // Uncheck all teachers and parents
      setTeachers(teachers.map(t => ({ ...t, checked: false })));
      setParents(parents.map(p => ({ ...p, checked: false })));
    }
  };

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex-1 p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 p-3 lg:p-5">
          <div className="flex-1">
              <div className="p-2 sm:p-4">
              <Calendar
                localizer={localizer}
                events={calendarEvents.filter(e => e.status !== 'Cancelled')}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 420 }}
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
                        fontSize: 16,
                        borderRadius: 4,
                        padding: '1px 6px',
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
                            padding: '4px 4px 0 6px',
                            minHeight: 0,
                            background: cellBg,
                            borderRadius: 8,
                            border: '1px solid #e0e7ef',
                            boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                            margin: 1,
                            transition: 'background 0.2s',
                            cursor: 'default',
                          }}
                        >
                          <div
                            style={{
                              ...dayNumberStyle,
                              pointerEvents: 'auto',
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              zIndex: 20, // Lowered from 1000 to 20
                              margin: 0,
                              alignSelf: undefined,
                            }}
                            title={isFutureOrToday ? "Add Meeting" : ""}
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
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 28, pointerEvents: 'auto' }}>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          minWidth: 28,
                          minHeight: 28,
                          borderRadius: '50%',
                          backgroundColor: event.color,
                          color: '#fff',
                          marginRight: 8,
                          marginTop: 2,
                          flexShrink: 0
                        }}
                      >
                        <FaCalendarAlt style={{ color: '#fff', fontSize: 16 }} />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{event.title}</span>
                        {event.agenda && (
                          <span style={{ color: '#555', fontWeight: 400, wordBreak: 'break-word' }}>
                            - {event.agenda}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null),
                  agenda: {
                    event: ({ event }) => (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                            borderRadius: '50%',
                            backgroundColor: event.color,
                            color: '#fff',
                            marginRight: 8,
                            marginTop: 2,
                            flexShrink: 0
                          }}
                        >
                          <FaCalendarAlt style={{ color: '#fff', fontSize: 16 }} />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{event.title}</span>
                          {event.agenda && (
                            <span style={{ color: '#555', fontWeight: 400, wordBreak: 'break-word' }}>
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
            <aside className="w-full lg:w-80 mt-4 lg:mt-0">
              <div className="bg-gray-50 rounded-xl border border-gray-200">
                <div className="bg-[#232c67] px-5 py-3 border-b border-gray-200 rounded-t-xl">
                  <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                  Schedule Details
                </h2>
                <div className="relative dropdown-container ml-4">
                  <button
                    className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  >
                    <FaCalendarAlt className="text-sm text-gray-600" />
                    <span>{statusFilter}</span>
                    <FaChevronDown className={`text-sm transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {['Scheduled', 'Completed', 'Cancelled'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setStatusFilter(option);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                              statusFilter === option 
                                ? "bg-[#232c67] text-white hover:bg-gray-100 hover:text-black" 
                                : "text-gray-900 hover:bg-gray-100 hover:text-black"
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
                <div className="p-4">
              <div
                className="space-y-2 sm:space-y-2 max-h-[320px] overflow-y-auto"
                style={{ minHeight: "100px" }}
              >
                {events
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
                    No meetings scheduled.
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
                        className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-2 border border-gray-200 hover:shadow-md transition cursor-pointer"
                        style={{
                          borderLeft: `${String(event.created_by) === String(userId) ? '6px solid #232c67' : '4px solid ' + event.color}`,
                          boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                          marginBottom: 6,
                          background: '#fff',
                        }}
                        onClick={() => { setSelectedEvent(event); setShowInputModal(false); }}
                      >
                        <div className="text-xl" style={{ color: event.color }}>
                          <FaCalendarAlt />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-xs" style={{ fontWeight: String(event.created_by) === String(userId) ? 700 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {event.title}
                            {String(event.created_by) === String(userId) && (
                              <span style={{
                                background: '#232c67',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '10px',
                                padding: '1px 6px',
                                marginLeft: '3px',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                display: 'inline-block',
                              }}>You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {event.month} {event.day}, {event.year} |
                            {event.time && (() => {
                              const [start, end] = event.time.split(" - ");
                              return ` ${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                            })()}
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
                )}
              </div>
              </div>
            </div>
          </aside>
          </div>
        </div>
      </div>
      {/* Modal for adding event */}
      {showInputModal && !selectedEvent && !showInviteSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Add Meeting</h2>
                <button
                  onClick={() => { setShowInputModal(false); setModalDay(null); setModalMonth(null); setModalYear(null); setNewEventAgenda(""); }}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <FaTimes className="w-3 h-3" />
                  Close
                </button>
              </div>
            </div>
                <div className="p-8 grid grid-cols-2 gap-8 text-sm">
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
                      onClick={() => setShowInviteSelectModal(true)}
                    >
                      <FaUserPlus className="w-2.5 h-2.5" />
                      Click to Invite
                    </button>
                  </div>
                </div>
            {validation.invite && <div className="text-red-500 text-xs mt-1 px-6">{validation.invite}</div>}
            <div className="flex justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                disabled={
                  !newEventTitle ||
                  !newEventAgenda ||
                  !modalDay || !modalMonth || !modalYear ||
                  !newEventStartTime || !newEventEndTime ||
                  !!validation.date || !!validation.time || !!validation.invite
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
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editMode ? 'Edit Meeting Details' : 'View Meeting Details'}
                </h2>
                <button
                  onClick={() => { 
                    setSelectedEvent(null); 
                    setEditMode(false); 
                    setEditEventData(null); 
                    setOriginalInvitees({ teachers: [], parents: [] }); 
                  }}
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
                  <div className="p-8 grid grid-cols-2 gap-8 text-sm">
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
                        onClick={async () => {
                          if (selectedEvent && !inviteListLoaded) {
                            await fetchInvitedList(selectedEvent.id);
                            // After fetching, update teachers and parents checked state
                            setTeachers(prevTeachers => prevTeachers.map(t => ({
                              ...t,
                              checked: (invitedList.teachers || []).some(inv => String(inv.user_id) === String(t.id))
                            })));
                            setParents(prevParents => prevParents.map(p => ({
                              ...p,
                              checked: (invitedList.parents || []).some(inv => String(inv.user_id) === String(p.id))
                            })));
                            setInviteListLoaded(true);
                          }
                          setShowInviteSelectModal(true);
                        }}
                      >
                        <FaEdit className="w-2.5 h-2.5" />
                        Edit Invite List
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 px-4 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        if (!selectedEvent) return;
                        // Compose start/end datetime strings
                        const monthIndex = monthNames.indexOf(editEventData.month) + 1;
                        const startDate = `${editEventData.year}-${monthIndex.toString().padStart(2, "0")}-${editEventData.day.toString().padStart(2, "0")} ${editEventData.startTime}:00`;
                        const endDate = `${editEventData.year}-${monthIndex.toString().padStart(2, "0")}-${editEventData.day.toString().padStart(2, "0")} ${editEventData.endTime}:00`;

                        // Gather recipients from checked teachers/parents
                        const selectedTeachers = teachers.filter(t => t.checked).map(t => ({ user_id: t.id, recipient_type: "Teacher" }));
                        const selectedParents = parents.filter(p => p.checked).map(p => ({ user_id: p.id, recipient_type: "Parent" }));
                        const recipients = [...selectedTeachers, ...selectedParents];

                        // Get the current user's ID from localStorage
                        const created_by = userId ? parseInt(userId, 10) : 1;

                        // Determine what was changed to set the correct notification message
                        const originalStart = selectedEvent.start;
                        const originalEnd = selectedEvent.end;
                        const newStart = new Date(startDate);
                        const newEnd = new Date(endDate);
                        
                        // Check what was changed
                        const dateTimeChanged = originalStart.getTime() !== newStart.getTime() || originalEnd.getTime() !== newEnd.getTime();
                        const titleChanged = selectedEvent.title !== editEventData.title;
                        const agendaChanged = selectedEvent.agenda !== editEventData.agenda;
                        
                        // Check if invitees changed by comparing original vs current
                        const currentTeacherIds = teachers.filter(t => t.checked).map(t => t.id);
                        const currentParentIds = parents.filter(p => p.checked).map(p => p.id);
                        
                        const teachersChanged = !arraysEqual(originalInvitees.teachers.sort(), currentTeacherIds.sort());
                        const parentsChanged = !arraysEqual(originalInvitees.parents.sort(), currentParentIds.sort());
                        const inviteesChanged = teachersChanged || parentsChanged;
                        
                        let notif_message;
                        if (dateTimeChanged) {
                          // Date/time was changed
                          if (titleChanged || agendaChanged || inviteesChanged) {
                            // Both date/time and other details were changed
                            notif_message = "[MEETING] Updated and rescheduled the meeting";
                          } else {
                            // Only date/time was changed
                            notif_message = "[MEETING] Rescheduled the meeting";
                          }
                        } else {
                          // Only title, agenda, or invitees were changed
                          notif_message = "[MEETING] Updated the meeting";
                        }

                        // Prepare payload
                        const payload = {
                          meeting_id: selectedEvent.id,
                          meeting_title: editEventData.title,
                          meeting_agenda: editEventData.agenda,
                          meeting_start: startDate,
                          meeting_end: endDate,
                          created_by,
                          recipients,
                          notif_message
                        };

                        try {
                          const res = await fetch("http://localhost/capstone-project/backend/Meeting/update_meeting.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            await fetchMeetings(setEvents);
                            
                            // Update the selected event with new data from the response
                            if (data.updated_meeting) {
                              setSelectedEvent(data.updated_meeting);
                            } else {
                              // Fallback: update with the data we sent
                              setSelectedEvent({
                                ...selectedEvent,
                                title: editEventData.title,
                                agenda: editEventData.agenda,
                                month: editEventData.month,
                                day: editEventData.day,
                                year: editEventData.year,
                                time: `${editEventData.startTime} - ${editEventData.endTime}`
                              });
                            }
                            
                            // Exit edit mode but keep modal open
                            setEditMode(false);
                            setEditEventData(null);
                            setOriginalInvitees({ teachers: [], parents: [] });
                            
                            // Reset inviteListLoaded to force refresh of invited list
                            setInviteListLoaded(false);
                            
                            // Refresh the invited list to show updated invitees
                            if (inviteesChanged) {
                              console.log("🔄 Invitees changed, refreshing invited list...");
                              await testInviteeUpdate(selectedEvent.id); // Test API call
                              await fetchInvitedList(selectedEvent.id);
                              console.log("✅ Invited list refreshed after invitee changes");
                            } else {
                              console.log("ℹ️ No invitee changes detected, skipping invited list refresh");
                            }
                            
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
                          } else {
                            toast.error("Failed to update meeting: " + (data.message || "Unknown error"));
                          }
                        } catch (err) {
                          toast.error("Error connecting to server: " + err.message);
                        }
                      }}
                      className="px-4 py-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                      disabled={!!validation.date || !!validation.time || !!validation.invite}
                    >
                      <FaSave className="w-3 h-3" />
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8 text-sm items-start">
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
                        className="bg-[#232c67] text-white px-4 py-2 rounded-full text-xs font-semibold w-full max-w-[180px] mb-6"
                        style={{minWidth: '120px'}} type="button"
                        onClick={() => setShowInviteViewModal(true)}
                      >
                        View Invited List
                      </button>
                    </div>
                  </div>
                <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
                    {selectedEvent.status === 'Completed' ? (
                      <div className="flex gap-3 items-center">
                        <button
                          className="px-6 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium cursor-default opacity-80"
                          disabled
                          style={{ pointerEvents: 'none' }}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            toast.info("Delete meeting confirmation required");
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                          <FaTrash className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    ) : selectedEvent.status === 'Cancelled' ? (
                      <div className="flex gap-3 items-center">
                        <button
                          className="px-6 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium cursor-default opacity-80"
                          disabled
                          style={{ pointerEvents: 'none' }}
                        >
                          Cancelled
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            toast.info("Delete meeting confirmation required");
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                          <FaTrash className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    ) : (
                    <div className="flex justify-end gap-3 px-4 py-4 bg-gray-50 border-t border-gray-200">
                                                <button
                            onClick={() => {
                              setShowCancelModal(true);
                              toast.info("Cancel meeting confirmation required");
                            }}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                          >
                            <FaTimesCircle className="w-3 h-3" />
                            Cancel Meeting
                          </button>
                        {/* Only show Edit button if the meeting was created by the current Super Admin */}
                        {String(selectedEvent.created_by) === String(userId) && (
                          <button
                            onClick={async () => {
                              setEditMode(true);
                              toast.info("Edit mode activated");
                              setEditEventData({
                                title: selectedEvent.title,
                                agenda: selectedEvent.agenda,
                                year: selectedEvent.year,
                                month: selectedEvent.month,
                                day: selectedEvent.day,
                                startTime: selectedEvent.time?.split(' - ')[0] || '',
                                endTime: selectedEvent.time?.split(' - ')[1] || '',
                              });
                            
                            // Fetch and auto-fill the invited list
                            try {
                              const res = await fetch(`http://localhost/capstone-project/backend/Meeting/get_notification_recipients.php?meeting_id=${selectedEvent.id}`);
                              const data = await res.json();
                              if (data.status === 'success') {
                                // Get the invited user IDs
                                const invitedTeacherIds = (data.teachers || []).map(t => t.user_id);
                                const invitedParentIds = (data.parents || []).map(p => p.user_id);
                                
                                // Store original invitees for comparison
                                setOriginalInvitees({
                                  teachers: invitedTeacherIds,
                                  parents: invitedParentIds
                                });
                                
                                // Update teachers checkboxes
                                setTeachers(prevTeachers => 
                                  prevTeachers.map(teacher => ({
                                    ...teacher,
                                    checked: invitedTeacherIds.includes(teacher.id)
                                  }))
                                );
                                
                                // Update parents checkboxes
                                setParents(prevParents => 
                                  prevParents.map(parent => ({
                                    ...parent,
                                    checked: invitedParentIds.includes(parent.id)
                                  }))
                                );
                                
                                // Reset class level selections and "All" checkbox
                                setSelectedLevels([]);
                                setAllChecked(false);
                                
                                // Auto-fill class level checkboxes based on invited teachers/parents
                                const invitedTeacherIdsSet = new Set(invitedTeacherIds);
                                const invitedParentIdsSet = new Set(invitedParentIds);
                                
                                // Check which class levels have invited teachers
                                const levelsWithInvitedTeachers = new Set();
                                const levelsWithInvitedParents = new Set();
                                
                                // Check teachers by advisory class
                                advisoryData.forEach(advisory => {
                                  if (invitedTeacherIdsSet.has(advisory.lead_teacher_id) || 
                                      invitedTeacherIdsSet.has(advisory.assistant_teacher_id)) {
                                    levelsWithInvitedTeachers.add(advisory.level_id);
                                  }
                                });
                                
                                // Check parents by their children's advisory class
                                advisoryData.forEach(advisory => {
                                  if (advisory.students) {
                                    advisory.students.forEach(student => {
                                      if (invitedParentIdsSet.has(student.parent_id)) {
                                        levelsWithInvitedParents.add(advisory.level_id);
                                      }
                                    });
                                  }
                                });
                                
                                // Set class level checkboxes based on who was invited
                                const levelsToSelect = new Set([...levelsWithInvitedTeachers, ...levelsWithInvitedParents]);
                                setSelectedLevels(Array.from(levelsToSelect));
                                
                                // Set "All" checkbox if all levels are selected
                                if (levelsToSelect.size === studentLevels.length) {
                                  setAllChecked(true);
                                }
                                
                                console.log('Auto-filled invited list for edit mode');

                              } else {
                                console.log('Failed to fetch invited list for auto-fill:', data.message);

                              }
                            } catch (err) {
                              console.log('Error fetching invited list for auto-fill:', err);
                              
                            }
                          }}
                                                                                    className="px-4 py-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                          >
                            <FaEdit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                    </div>
                    )}
                  </div>
                </div>
              )}
            </>
          </div>
        </div>
      )}
      {/* Invite modal for add/edit mode */}
      {showInviteSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-[200]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#232c67] px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Select to Invite</h2>
                <button
                  onClick={() => {
                    setShowInviteSelectModal(false);
                    setSelectedLevels([]);
                    setAllChecked(false);
                    setTeachers(teachers.map(t => ({ ...t, checked: false })));
                    setParents(parents.map(p => ({ ...p, checked: false })));
                  }}
                  className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <FaTimes className="w-3 h-3" />
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Tabs */}
              <div className="flex mb-4">
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
              </div>
              {/* Search Bar */}
              <div className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={inviteSelectSearch}
                    onChange={e => setInviteSelectSearch(e.target.value)}
                    className="pl-10 pr-8 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full caret-[#1E2A79]"
                    style={{ minHeight: '2rem' }}
                  />
                  {inviteSelectSearch && (
                    <button
                      onClick={() => setInviteSelectSearch("")}
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
                                {/* Teacher List */}
                  {inviteSelectTab === "teacher" && (
                    <div className="mb-6 flex flex-col">
                      {/* Checkboxes Row */}
                      <div className="flex items-center gap-4 mb-6">
                        <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                            checked={allChecked}
                            onChange={handleAllToggle}
                          />
                          <span className="text-sm font-medium">All</span>
                        </label>
                        {studentLevels
                          .sort((a, b) => a.level_name.localeCompare(b.level_name))
                          .map((level) => (
                            <label key={level.level_id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedLevels.includes(level.level_id)}
                                onChange={() => handleClassLevelSelection(level.level_id)}
                              />
                              <span className="text-sm font-medium">{level.level_name}</span>
                            </label>
                          ))}
                      </div>

                      {/* Teacher List Organized by Advisory */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between sticky top-0 bg-white py-2 mb-4">
                          <h3 className="font-semibold text-gray-800 text-lg">Teacher List</h3>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={teachers.some(t => t.checked)}
                              onChange={(e) => {
                            const checked = e.target.checked;
                            setTeachers(teachers.map(t => ({ ...t, checked })));
                                // If checking teachers, uncheck all parents
                                if (checked) {
                                  setParents(parents.map(p => ({ ...p, checked: false })));
                                }
                          }}
                        />
                            <span>Only Teachers</span>
                      </label>
                        </div>
                        
                        {(() => {
                          // Show loading if users are still being loaded
                          if (usersLoading) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-lg font-medium mb-2">Loading Teachers...</div>
                                <div className="text-sm">Please wait while we load the teacher list.</div>
                              </div>
                            );
                          }
                          
                          // Check if any teachers match the search
                          console.log("🔍 SELECT TO INVITE - Teachers state:", teachers);
                          console.log("🔍 SELECT TO INVITE - Teachers length:", teachers.length);
                          console.log("🔍 SELECT TO INVITE - Users loading:", usersLoading);
                          const allFilteredTeachers = teachers.filter(t => {
                            if (!inviteSelectSearch.trim()) return true; // Show all if search is empty
                            const searchLower = inviteSelectSearch.toLowerCase();
                            const fullName = `${t.firstName || ''} ${t.middleName || ''} ${t.lastName || ''}`.toLowerCase();
                            return t.name?.toLowerCase().includes(searchLower) || 
                                   fullName.includes(searchLower);
                          });
                          
                          if (allFilteredTeachers.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-lg font-medium mb-2">No Teachers Found</div>
                                <div className="text-sm">
                                  {inviteSelectSearch.trim() 
                                    ? `No teachers match your search "${inviteSelectSearch}".`
                                    : "No teachers are available for selection."
                                  }
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-4 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                              {/* Discoverer Teachers */}
                              {(() => {
                                const discovererTeachers = teachers.filter(t => {
                                  const isDiscovererAdvisor = advisoryData.some(adv => 
                                    adv.level_id === 1 && 
                                    (adv.lead_teacher_id === parseInt(t.id) || adv.assistant_teacher_id === parseInt(t.id))
                                  );
                                  if (!isDiscovererAdvisor) return false;
                                  if (!inviteSelectSearch.trim()) return true;
                                  const searchLower = inviteSelectSearch.toLowerCase();
                                  const fullName = `${t.firstName || ''} ${t.middleName || ''} ${t.lastName || ''}`.toLowerCase();
                                  return t.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                                });
                                
                                if (discovererTeachers.length === 0) return null;
                                
                                return (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Discoverer</h4>
                                    <div className="ml-4 space-y-1">
                                      {discovererTeachers.map((teacher, idx) => (
                                        <label key={teacher.id} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={teacher.checked}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setTeachers(teachers.map((t, i) =>
                                                t.id === teacher.id ? { ...t, checked } : t
                                              ));
                                            }}
                                          />
                                          <span>{formatName(teacher.firstName, teacher.middleName, teacher.lastName)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Explorer Teachers */}
                              {(() => {
                                const explorerTeachers = teachers.filter(t => {
                                  const isExplorerAdvisor = advisoryData.some(adv => 
                                    adv.level_id === 2 && 
                                    (adv.lead_teacher_id === parseInt(t.id) || adv.assistant_teacher_id === parseInt(t.id))
                                  );
                                  if (!isExplorerAdvisor) return false;
                                  if (!inviteSelectSearch.trim()) return true;
                                  const searchLower = inviteSelectSearch.toLowerCase();
                                  const fullName = `${t.firstName || ''} ${t.middleName || ''} ${t.lastName || ''}`.toLowerCase();
                                  return t.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                                });
                                
                                if (explorerTeachers.length === 0) return null;
                                
                                return (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Explorer</h4>
                                    <div className="ml-4 space-y-1">
                                      {explorerTeachers.map((teacher, idx) => (
                                        <label key={teacher.id} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={teacher.checked}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setTeachers(teachers.map((t, i) =>
                                                t.id === teacher.id ? { ...t, checked } : t
                                              ));
                                            }}
                                          />
                                          <span>{formatName(teacher.firstName, teacher.middleName, teacher.lastName)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Adventurer Teachers */}
                              {(() => {
                                const adventurerTeachers = teachers.filter(t => {
                                  const isAdventurerAdvisor = advisoryData.some(adv => 
                                    adv.level_id === 3 && 
                                    (adv.lead_teacher_id === parseInt(t.id) || adv.assistant_teacher_id === parseInt(t.id))
                                  );
                                  if (!isAdventurerAdvisor) return false;
                                  if (!inviteSelectSearch.trim()) return true;
                                  const searchLower = inviteSelectSearch.toLowerCase();
                                  const fullName = `${t.firstName || ''} ${t.middleName || ''} ${t.lastName || ''}`.toLowerCase();
                                  return t.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                                });
                                
                                if (adventurerTeachers.length === 0) return null;
                                
                                return (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Adventurer</h4>
                                    <div className="ml-4 space-y-1">
                                      {adventurerTeachers.map((teacher, idx) => (
                                        <label key={teacher.id} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={teacher.checked}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setTeachers(teachers.map((t, i) =>
                                                t.id === teacher.id ? { ...t, checked } : t
                                              ));
                                            }}
                                          />
                                          <span>{formatName(teacher.firstName, teacher.middleName, teacher.lastName)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Non Advisory Teachers */}
                              {(() => {
                                const nonAdvisoryTeachers = teachers.filter(t => {
                                  const isAnyAdvisor = advisoryData.some(adv => 
                                    (adv.lead_teacher_id === parseInt(t.id) || adv.assistant_teacher_id === parseInt(t.id))
                                  );
                                  if (isAnyAdvisor) return false;
                                  if (!inviteSelectSearch.trim()) return true;
                                  const searchLower = inviteSelectSearch.toLowerCase();
                                  const fullName = `${t.firstName || ''} ${t.middleName || ''} ${t.lastName || ''}`.toLowerCase();
                                  return t.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                                });
                                
                                if (nonAdvisoryTeachers.length === 0) return null;
                                
                                return (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Non Advisory</h4>
                                    <div className="ml-4 space-y-1">
                                      {nonAdvisoryTeachers.map((teacher, idx) => (
                                        <label key={teacher.id} className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={teacher.checked}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setTeachers(teachers.map((t, i) =>
                                                t.id === teacher.id ? { ...t, checked } : t
                                              ));
                                            }}
                                          />
                                          <span>{formatName(teacher.firstName, teacher.middleName, teacher.lastName)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
              {/* Parent List */}
              {inviteSelectTab === "parent" && (
                <div className="mb-6 flex flex-col">
                  {/* Checkboxes Row */}
                  <div className="flex items-center gap-4 mb-6">
                    <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                        checked={allChecked}
                        onChange={handleAllToggle}
                      />
                      <span className="text-sm font-medium">All</span>
                    </label>
                    {studentLevels
                      .sort((a, b) => a.level_name.localeCompare(b.level_name))
                      .map((level) => (
                        <label key={level.level_id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedLevels.includes(level.level_id)}
                            onChange={() => handleClassLevelSelection(level.level_id)}
                          />
                          <span className="text-sm font-medium">{level.level_name}</span>
                        </label>
                      ))}
                  </div>

                  {/* Parent List Organized by Class */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2 mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">Parent List</h3>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={parents.some(p => p.checked)}
                          onChange={(e) => {
                        const checked = e.target.checked;
                        setParents(parents.map(p => ({ ...p, checked })));
                            // If checking parents, uncheck all teachers
                            if (checked) {
                              setTeachers(teachers.map(t => ({ ...t, checked: false })));
                            }
                      }}
                    />
                        <span>Only Parents</span>
                  </label>
                    </div>
                    
                    {(() => {
                      // Show loading if users are still being loaded
                      if (usersLoading) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">Loading Parents...</div>
                            <div className="text-sm">Please wait while we load the parent list.</div>
                          </div>
                        );
                      }
                      
                      // Check if any parents match the search
                      console.log("🔍 SELECT TO INVITE - Parents state:", parents);
                      console.log("🔍 SELECT TO INVITE - Parents length:", parents.length);
                      const allFilteredParents = parents.filter(p => {
                        if (!inviteSelectSearch.trim()) return true; // Show all if search is empty
                        const searchLower = inviteSelectSearch.toLowerCase();
                        const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.toLowerCase();
                        return p.name?.toLowerCase().includes(searchLower) || 
                               fullName.includes(searchLower);
                      });
                      
                      if (allFilteredParents.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Parents Found</div>
                            <div className="text-sm">
                              {inviteSelectSearch.trim() 
                                ? `No parents match your search "${inviteSelectSearch}".`
                                : "No parents are available for selection."
                              }
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                          {/* Discoverer Parents */}
                          {(() => {
                            const discovererParents = parents.filter(p => {
                              const hasDiscovererChild = advisoryData.some(adv => 
                                adv.level_id === 1 && 
                                adv.students && 
                                adv.students.some(student => 
                                  student.parent_id === parseInt(p.id)
                                )
                              );
                              if (!hasDiscovererChild) return false;
                              if (!inviteSelectSearch.trim()) return true;
                              const searchLower = inviteSelectSearch.toLowerCase();
                              const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.toLowerCase();
                              return p.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                            });
                            
                            if (discovererParents.length === 0) return null;
                            
                            return (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Discoverer</h4>
                                <div className="ml-4 space-y-1">
                                  {discovererParents.map((parent, idx) => (
                                    <label key={parent.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={parent.checked}
                                        onChange={e => {
                                          const checked = e.target.checked;
                                          setParents(parents.map((p, i) =>
                                            p.id === parent.id ? { ...p, checked } : p
                                          ));
                                        }}
                                      />
                                      <span>{formatName(parent.firstName, parent.middleName, parent.lastName)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Explorer Parents */}
                          {(() => {
                            const explorerParents = parents.filter(p => {
                              const hasExplorerChild = advisoryData.some(adv => 
                                adv.level_id === 2 && 
                                adv.students && 
                                adv.students.some(student => 
                                  student.parent_id === parseInt(p.id)
                                )
                              );
                              if (!hasExplorerChild) return false;
                              if (!inviteSelectSearch.trim()) return true;
                              const searchLower = inviteSelectSearch.toLowerCase();
                              const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.toLowerCase();
                              return p.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                            });
                            
                            if (explorerParents.length === 0) return null;
                            
                            return (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Explorer</h4>
                                <div className="ml-4 space-y-1">
                                  {explorerParents.map((parent, idx) => (
                                    <label key={parent.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={parent.checked}
                                        onChange={e => {
                                          const checked = e.target.checked;
                                          setParents(parents.map((p, i) =>
                                            p.id === parent.id ? { ...p, checked } : p
                                          ));
                                        }}
                                      />
                                      <span>{formatName(parent.firstName, parent.middleName, parent.lastName)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Adventurer Parents */}
                          {(() => {
                            const adventurerParents = parents.filter(p => {
                              const hasAdventurerChild = advisoryData.some(adv => 
                                adv.level_id === 3 && 
                                adv.students && 
                                adv.students.some(student => 
                                  student.parent_id === parseInt(p.id)
                                )
                              );
                              if (!hasAdventurerChild) return false;
                              if (!inviteSelectSearch.trim()) return true;
                              const searchLower = inviteSelectSearch.toLowerCase();
                              const fullName = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.toLowerCase();
                              return p.name?.toLowerCase().includes(searchLower) || fullName.includes(searchLower);
                            });
                            
                            if (adventurerParents.length === 0) return null;
                            
                            return (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Adventurer</h4>
                                <div className="ml-4 space-y-1">
                                  {adventurerParents.map((parent, idx) => (
                                    <label key={parent.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={parent.checked}
                                        onChange={e => {
                                          const checked = e.target.checked;
                                          setParents(parents.map((p, i) =>
                                            p.id === parent.id ? { ...p, checked } : p
                                          ));
                                        }}
                                      />
                                      <span>{formatName(parent.firstName, parent.middleName, parent.lastName)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowInviteSelectModal(false);
                  setSelectedLevels([]);
                }}
                disabled={!teachers.some(t => t.checked) && !parents.some(p => p.checked)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  teachers.some(t => t.checked) || parents.some(p => p.checked)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaCheck className="w-3 h-3" />
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Invite modal for view mode */}
      {showInviteViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-[200]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Invited List</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowInviteViewModal(false);
                      setMeetingCreator(null);
                    }}
                    className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <FaTimes className="w-3 h-3" />
                    Close
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* Tabs */}
              <div className="flex mb-6">
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

              {(() => {
                // Calculate the maximum count across all tabs to determine consistent height
                const teacherCount = invitedList.teachers?.length || 0;
                const parentCount = invitedList.parents?.length || 0;
                const maxCount = Math.max(teacherCount, parentCount);
                
                // Calculate minimum height based on content (each item is roughly 44px + spacing)
                const minHeight = Math.max(200, Math.min(320, (maxCount * 48) + 100));
                const shouldScroll = maxCount >= 5;
                
                return (
                  <>
                    {/* Teacher List */}
                    {inviteSelectTab === "teacher" && (() => {
                      // Calculate filtered count for header
                      let filteredTeacherCount = teacherCount;
                      if (inviteViewSearch && invitedList.teachers) {
                        filteredTeacherCount = invitedList.teachers.filter(t => {
                          const name = `${t.user_firstname} ${t.user_middlename} ${t.user_lastname}`.toLowerCase();
                          return name.includes(inviteViewSearch.toLowerCase());
                        }).length;
                      }

                      return (
                        <div className="border rounded-lg bg-gray-50" style={{ minHeight: `${minHeight}px` }}>
                          <h3 className="font-medium text-gray-900 p-4 pb-2">
                            {meetingCreator?.role === 'Teacher' ? 'Advisory Teachers' : `Teachers (${filteredTeacherCount})`}
                          </h3>
                          <div className={`px-4 pb-4 ${shouldScroll ? 'max-h-64 overflow-y-auto' : ''}`}>
                    
                    {(() => {
                    // Check if meeting was created by a teacher
                    const isCreatedByTeacher = meetingCreator?.role === 'Teacher';
                    
                    if (isCreatedByTeacher) {
                      // For meetings created by teachers: show advisory teachers
                      const meetingAdvisory = selectedEvent?.advisory_id 
                        ? advisoryData.find(adv => adv.advisory_id === selectedEvent.advisory_id)
                        : null;
                      
                      if (!meetingAdvisory) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Advisory Information</div>
                            <div className="text-sm">Unable to load advisory details for this meeting.</div>
                          </div>
                        );
                      }
                      
                      // Get the lead teacher and assistant teacher from the advisory
                      const leadTeacher = teachers.find(t => parseInt(t.id) === meetingAdvisory.lead_teacher_id);
                      const assistantTeacher = teachers.find(t => parseInt(t.id) === meetingAdvisory.assistant_teacher_id);
                      
                      if (!leadTeacher && !assistantTeacher) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Teachers Found</div>
                            <div className="text-sm">No teachers assigned to this advisory.</div>
                          </div>
                        );
                      }
                      
                      // Check if any teachers match the search
                      const allTeachers = [leadTeacher, assistantTeacher].filter(Boolean);
                      const filteredTeachers = allTeachers.filter(teacher => {
                        const teacherName = formatName(teacher.firstName, teacher.middleName, teacher.lastName).toLowerCase();
                        return !inviteViewSearch || teacherName.includes(inviteViewSearch.toLowerCase());
                      });
                      
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
                          {filteredTeachers.map(teacher => {
                            const isCreator = teacher && meetingCreator && parseInt(teacher.id) === parseInt(selectedEvent.created_by);
                            const teacherName = formatName(teacher.firstName, teacher.middleName, teacher.lastName);
                            
                            return (
                              <div key={teacher.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="font-medium flex items-center gap-2">
                                  {teacherName}
                                  {isCreator && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                      Creator
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-600 mt-1 text-sm">
                                  Role: {parseInt(teacher.id) === meetingAdvisory.lead_teacher_id ? 'Lead Teacher' : 'Assistant Teacher'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      // For meetings created by Super Admin or Admin: show invited teachers with labels
                      if (invitedList.teachers.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Teachers Invited</div>
                            <div className="text-sm">This meeting has no teacher invitations.</div>
                          </div>
                        );
                      }
                      
                      // Check if any teachers match the search
                      const allFilteredTeachers = invitedList.teachers.filter(t => {
                        const name = `${t.user_firstname} ${t.user_middlename} ${t.user_lastname}`.toLowerCase();
                        return name.includes(inviteViewSearch.toLowerCase());
                      });
                      
                      if (allFilteredTeachers.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Teachers Found</div>
                            <div className="text-sm">No teachers match your search "{inviteViewSearch}".</div>
                          </div>
                        );
                      }
                      
                      // Get all filtered teachers for admin/super admin created meetings
                      
                      return (
                        <div className="space-y-2">
                          {allFilteredTeachers.map(t => {
                            // Determine the teacher's level/role
                            const teacherAdvisory = advisoryData.find(adv => 
                              adv.lead_teacher_id === parseInt(t.user_id) || adv.assistant_teacher_id === parseInt(t.user_id)
                            );
                            
                            let role = 'Non Advisory';
                            if (teacherAdvisory) {
                              const levelNames = { 1: 'Discoverer', 2: 'Explorer', 3: 'Adventurer' };
                              role = levelNames[teacherAdvisory.level_id] || 'Advisory';
                              if (teacherAdvisory.lead_teacher_id === parseInt(t.user_id)) {
                                role += ' (Lead)';
                              } else {
                                role += ' (Assistant)';
                              }
                            }
                            
                            return (
                              <div key={t.user_id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="font-medium">
                                  {formatName(t.user_firstname, t.user_middlename, t.user_lastname)}
                                </div>
                                <div className="text-gray-600 mt-1 text-sm">
                                  Role: {role}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    })()}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Parent List */}
                    {inviteSelectTab === "parent" && (() => {
                      // Calculate filtered count for header
                      let filteredParentCount = parentCount;
                      if (inviteViewSearch && invitedList.parents) {
                        filteredParentCount = invitedList.parents.filter(p => {
                          const name = `${p.user_firstname} ${p.user_middlename} ${p.user_lastname}`.toLowerCase();
                          return name.includes(inviteViewSearch.toLowerCase());
                        }).length;
                      }

                      return (
                        <div className="border rounded-lg bg-gray-50" style={{ minHeight: `${minHeight}px` }}>
                          <h3 className="font-medium text-gray-900 p-4 pb-2">
                            {meetingCreator?.role === 'Teacher' ? 'Parent' : `Parents (${filteredParentCount})`}
                          </h3>
                        <div className={`px-4 pb-4 ${shouldScroll ? 'max-h-64 overflow-y-auto' : ''}`}>
                  
                  {(() => {
                    // Check if meeting was created by a teacher
                    const isCreatedByTeacher = meetingCreator?.role === 'Teacher';
                    
                    if (isCreatedByTeacher) {
                      // For meetings created by teachers: show parent names and student names
                      if (invitedList.parents.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Parents Invited</div>
                            <div className="text-sm">This meeting has no parent invitations.</div>
                          </div>
                        );
                      }
                      
                      // Filter parents and students based on search
                      const filteredParents = invitedList.parents.filter(p => {
                        const parentName = p.user_firstname && p.user_middlename && p.user_lastname 
                          ? `${p.user_firstname} ${p.user_middlename} ${p.user_lastname}`.toLowerCase()
                          : p.name ? p.name.toLowerCase() : '';
                        
                        // Also check if any associated student names match the search
                        const hasMatchingStudent = invitedList.students?.some(s => {
                          if (s.parent_id === parseInt(p.user_id) || s.parent_id === parseInt(p.id)) {
                            const studentName = `${s.stud_firstname} ${s.stud_middlename} ${s.stud_lastname}`.toLowerCase();
                            return studentName.includes(inviteViewSearch.toLowerCase());
                          }
                          return false;
                        });
                        
                        return parentName.includes(inviteViewSearch.toLowerCase()) || hasMatchingStudent;
                      });
                      
                      if (filteredParents.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Parents or Students Found</div>
                            <div className="text-sm">No parents or students match your search "{inviteViewSearch}".</div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {filteredParents.map(p => {
                            // Find the corresponding student for this parent
                            const student = invitedList.students?.find(s => 
                              s.parent_id === parseInt(p.user_id) || s.parent_id === parseInt(p.id)
                            );
                            
                            return (
                              <div key={p.user_id || p.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="font-medium">
                                  {p.user_firstname && p.user_middlename && p.user_lastname 
                                    ? formatName(p.user_firstname, p.user_middlename, p.user_lastname)
                                    : p.name || 'Unknown Parent'
                                  }
                                </div>
                                {student && (
                                  <div className="text-gray-600 mt-1 text-sm">
                                    Student: {formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      // For meetings created by Super Admin or Admin: show parent list as before
                      if (invitedList.parents.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Parents Invited</div>
                            <div className="text-sm">This meeting has no parent invitations.</div>
                          </div>
                        );
                      }
                      
                      // Check if any parents or students match the search
                      const allFilteredParents = invitedList.parents.filter(p => {
                        // Handle both data structures (from get_all_users.php and from notification_recipients)
                        const parentName = p.user_firstname && p.user_middlename && p.user_lastname 
                          ? `${p.user_firstname} ${p.user_middlename} ${p.user_lastname}`.toLowerCase()
                          : p.name ? p.name.toLowerCase() : '';
                        
                        // Also check if any associated student names match the search
                        const hasMatchingStudent = invitedList.students?.some(s => {
                          if (s.parent_id === parseInt(p.user_id) || s.parent_id === parseInt(p.id)) {
                            const studentName = `${s.stud_firstname} ${s.stud_middlename} ${s.stud_lastname}`.toLowerCase();
                            return studentName.includes(inviteViewSearch.toLowerCase());
                          }
                          return false;
                        });
                        
                        return parentName.includes(inviteViewSearch.toLowerCase()) || hasMatchingStudent;
                      });
                    
                      if (allFilteredParents.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-lg font-medium mb-2">No Parents or Students Found</div>
                            <div className="text-sm">No parents or students match your search "{inviteViewSearch}".</div>
                          </div>
                        );
                      }
                      
                      // Check if this is a one-on-one meeting
                      const isOneOnOne = selectedEvent?.parent_id && selectedEvent?.student_id;
                      
                      if (isOneOnOne) {
                        // For one-on-one meetings: show simplified list
                        return (
                          <div className="space-y-2">
                            {allFilteredParents.map(p => {
                              // Find the corresponding student for this parent
                              const student = invitedList.students?.find(s => 
                                s.parent_id === parseInt(p.user_id) || s.parent_id === parseInt(p.id)
                              );
                              
                              return (
                                <div key={p.user_id || p.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="font-medium">
                                    {p.user_firstname && p.user_middlename && p.user_lastname 
                                      ? formatName(p.user_firstname, p.user_middlename, p.user_lastname)
                                      : p.name || 'Unknown Parent'
                                    }
                                  </div>
                                  {student && (
                                    <div className="text-gray-600 mt-1 text-sm">
                                      Student: {formatName(student.stud_firstname, student.stud_middlename, student.stud_lastname)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {allFilteredParents.map(p => {
                            // Determine the parent's child level
                            const parentAdvisory = advisoryData.find(adv => 
                              adv.students && adv.students.some(student => student.parent_id === parseInt(p.user_id))
                            );
                            
                            let childLevel = 'Unknown';
                            if (parentAdvisory) {
                              const levelNames = { 1: 'Discoverer', 2: 'Explorer', 3: 'Adventurer' };
                              childLevel = levelNames[parentAdvisory.level_id] || 'Unknown';
                            }
                            
                            return (
                              <div key={p.user_id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="font-medium">
                                  {formatName(p.user_firstname, p.user_middlename, p.user_lastname)}
                                </div>
                                <div className="text-gray-600 mt-1 text-sm">
                                  Child Level: {childLevel}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    })()}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}
      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[200]">
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
                      <p><strong>Meeting:</strong> {selectedEvent?.title}</p>
                      <p><strong>Date:</strong> {selectedEvent?.month} {selectedEvent?.day}, {selectedEvent?.year}</p>
                      <p><strong>Time:</strong> {selectedEvent?.time && (() => {
                        const [start, end] = selectedEvent.time.split(" - ");
                        return `${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                      })()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  toast.info("Cancel meeting modal closed");
                }}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                disabled={cancelLoading}
              >
                <FaTimes className="w-3 h-3" />
                Keep Meeting
              </button>
              <button
                onClick={async () => {
                  setCancelLoading(true);
                  try {
                    const userId = localStorage.getItem('userId');
                    const res = await fetch('http://localhost/capstone-project/backend/Meeting/update_meeting.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        meeting_id: selectedEvent.id, 
                        meeting_status: 'Cancelled', 
                        created_by: userId,
                        notif_message: "[MEETING] Cancelled the meeting"
                      })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                      await fetchMeetings(setEvents);
                      setSelectedEvent({ ...selectedEvent, status: 'Cancelled' });
                      toast.success('Meeting cancelled successfully!');
                      // No need to handle notification here, backend does it
                    } else {
                      toast.error('Failed to cancel meeting: ' + (data.message || 'Unknown error'));
                    }
                  } catch (err) {
                    toast.error('Error connecting to server: ' + err.message);
                  }
                  setCancelLoading(false);
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                disabled={cancelLoading}
              >
                <FaTimesCircle className="w-3 h-3" />
                {cancelLoading ? 'Cancelling...' : 'Cancel Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[110]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Meeting</h2>
              <p className="text-sm text-gray-600 mb-4">This action cannot be undone</p>
            </div>
            
            <div className="mx-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 mb-1">Warning</h3>
                    <p className="text-sm text-red-700">
                      Are you sure you want to permanently delete "{selectedEvent?.title}"? This will remove all meeting data including notifications and recipient records. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  toast.info("Delete meeting modal closed");
                }}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                disabled={deleteLoading}
              >
                <FaTimes className="w-3 h-3" />
                Close
              </button>
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    const userId = localStorage.getItem('userId');
                    const res = await fetch('http://localhost/capstone-project/backend/Meeting/delete_meeting.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        meeting_id: selectedEvent.id, 
                        created_by: userId
                      })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                      await fetchMeetings(setEvents);
                      setSelectedEvent(null);
                      toast.success('Meeting deleted successfully!');
                    } else {
                      toast.error('Failed to delete meeting: ' + (data.message || 'Unknown error'));
                    }
                  } catch (err) {
                    toast.error('Error connecting to server: ' + err.message);
                  }
                  setDeleteLoading(false);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                disabled={deleteLoading}
              >
                <FaTrash className="w-3 h-3" />
                {deleteLoading ? 'Deleting...' : 'Delete Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
