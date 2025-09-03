"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { FaCalendarAlt, FaChevronDown, FaTimes, FaTimesCircle, FaTrash, FaExclamationTriangle } from "react-icons/fa";
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
  // timeStr: "09:00" or "13:30" or "9:00 AM - 10:00 AM"
  if (!timeStr) return "";
  
  // If it's already in AM/PM format, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  
  // Handle 24-hour format
  try {
    const [hour, minute] = timeStr.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) return timeStr;
    
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (error) {
    console.error('Error formatting time:', timeStr, error);
    return timeStr;
  }
}

// Color mapping for meetings (same as Super Admin)
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

export default function ParentCalendarPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [statusFilter, setStatusFilter] = useState('Scheduled');
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Add userId state for SSR safety
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'));
    }
  }, []);

  // Convert events to react-big-calendar format
  const calendarEventsAll = events
    .filter(e => {
      const status = e.status || e.meeting_status;
      return status === 'Scheduled' || status === 'Rescheduled' || status === 'Completed';
    })
    .map(event => {
      // The events already have start and end dates from the fetchParentMeetings function
      // Just return them as is for react-big-calendar
      return {
        ...event,
        title: event.title || event.meeting_title,
        start: event.start,
        end: event.end,
        allDay: false
      };
    });
  const calendarEvents = calendarEventsAll;

  // Handle calendar view change
  const handleViewChange = (newView) => {
    setCalendarView(newView);
  };

  // Handle date navigation
  const handleNavigate = (newDate) => {
    setCurrentViewDate(newDate);
  };

  // Fetch meetings for this parent only
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) return;
    async function fetchParentMeetings() {
      try {
        // Fetch meetings with advisor and student details
        const res = await fetch(`/php/Meeting/get_meetings_details.php?user_id=${userId}&parent_only=1`);
        const data = await res.json();
        console.log('Raw meetings data:', data);
        
        if (data.status === "success" && Array.isArray(data.meetings)) {
          // Map backend meetings to event format expected by react-big-calendar
          const events = data.meetings.map(meeting => {
            console.log('Processing meeting:', meeting);
            console.log('Meeting start:', meeting.meeting_start);
            console.log('Meeting end:', meeting.meeting_end);
            
            // Parse dates properly - handle different date formats
            let startDate, endDate;
            
            try {
              // Try parsing as ISO string first
              startDate = new Date(meeting.meeting_start);
              endDate = new Date(meeting.meeting_end);
              
              // If that fails, try parsing as MySQL datetime
              if (isNaN(startDate.getTime())) {
                console.log('Trying alternative date parsing for start');
                startDate = new Date(meeting.meeting_start.replace(' ', 'T'));
              }
              if (isNaN(endDate.getTime())) {
                console.log('Trying alternative date parsing for end');
                endDate = new Date(meeting.meeting_end.replace(' ', 'T'));
              }
              
              // Final validation
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('All date parsing methods failed for meeting:', meeting.meeting_id);
                console.error('Start date string:', meeting.meeting_start);
                console.error('End date string:', meeting.meeting_end);
                return null;
              }
            } catch (error) {
              console.error('Error parsing dates for meeting:', meeting.meeting_id, error);
              return null;
            }
            
            console.log('Parsed start date:', startDate);
            console.log('Parsed end date:', endDate);
            
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
            
            const eventData = {
              ...meeting,
              // react-big-calendar required fields
              id: meeting.meeting_id,
              title: meeting.meeting_title,
              start: startDate,
              end: endDate,
              // Display fields for the modal
              date: `${month} ${day}, ${year}`,
              time: `${startTime} - ${endTime}`,
              // Meeting type detection fields
              advisory_id: meeting.advisory_id,
              student_id: meeting.student_id,
              parent_id: meeting.parent_id,
              created_by: meeting.created_by, // Important for fetching teacher info
              // Additional fields
              agenda: meeting.meeting_agenda,
              status: meeting.meeting_status,
              // Color for calendar display
              color: getColorForMeeting(meeting.meeting_id)
            };
            
            console.log('Created event data:', eventData);
            return eventData;
          }).filter(Boolean); // Remove null entries
          
          console.log('Final processed events:', events);
          setEvents(events);
        } else {
          console.error('Failed to fetch meetings:', data);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setEvents([]);
      }
    }
    fetchParentMeetings();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Function to fetch additional meeting details if needed
  const fetchMeetingDetails = async (meetingId, advisoryId, studentId) => {
    if (!advisoryId && !studentId) return null;
    
    try {
      let leadTeacherName = null;
      let assistantTeacherName = null;
      let studentName = null;
      
      console.log('Fetching meeting details for:', { meetingId, advisoryId, studentId });
      
      // Preferred approach: fetch all advisory details and look up by advisory_id
      if (advisoryId) {
        try {
          const allAdvisoryRes = await fetch('/php/Advisory/get_all_advisory_details.php');
          const allAdvisoryData = await allAdvisoryRes.json();
          if (allAdvisoryData.status === 'success' && Array.isArray(allAdvisoryData.advisories)) {
            const adv = allAdvisoryData.advisories.find(a => String(a.advisory_id) === String(advisoryId));
            if (adv) {
              // Fetch lead teacher name if present
              if (adv.lead_teacher_id) {
                try {
                  const leadRes = await fetch('/php/Users/get_user_details.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: adv.lead_teacher_id })
                  });
                  const leadData = await leadRes.json();
                  if (leadData.status === 'success' && leadData.user) {
                    leadTeacherName = formatName(leadData.user.firstName, leadData.user.middleName, leadData.user.lastName);
                  }
                } catch (e) {
                  console.error('Failed to fetch lead teacher details:', e);
                }
              }
              // Fetch assistant teacher name if present
              if (adv.assistant_teacher_id) {
                try {
                  const asstRes = await fetch('/php/Users/get_user_details.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: adv.assistant_teacher_id })
                  });
                  const asstData = await asstRes.json();
                  if (asstData.status === 'success' && asstData.user) {
                    assistantTeacherName = formatName(asstData.user.firstName, asstData.user.middleName, asstData.user.lastName);
                  }
                } catch (e) {
                  console.error('Failed to fetch assistant teacher details:', e);
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch all advisory details:', e);
        }
      }
      
      // Fallback: meeting creator as lead if still missing
      if (!leadTeacherName && advisoryId) {
        console.log('Lead teacher not found via advisory; will fall back to meeting creator if available later');
      }
      
      // Fetch student name if student_id exists
      if (studentId) {
        try {
          const studentRes = await fetch('/php/Users/get_student_details.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId })
          });
          const studentData = await studentRes.json();
          if (studentData.status === 'success' && studentData.student) {
            studentName = formatName(studentData.student.firstName, studentData.student.middleName, studentData.student.lastName);
          }
        } catch (error) {
          console.error('Error fetching student details:', error);
        }
      }
      
      console.log('Final fetched details:', { leadTeacherName, assistantTeacherName, studentName });
      return { leadTeacherName, assistantTeacherName, studentName };
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      return null;
    }
  };

  // Handle event selection with additional details fetching
  const handleSelectEvent = async (event) => {
    console.log('Selected event:', event);
    console.log('Event advisory_id:', event.advisory_id);
    console.log('Event student_id:', event.student_id);
    console.log('Event created_by:', event.created_by);
    
    setSelectedEvent(event);
    
    // If this is a Class Advisory Meeting, fetch additional details
    if (event.advisory_id || event.student_id) {
      console.log('Fetching details for Class Advisory Meeting');
      const details = await fetchMeetingDetails(event.meeting_id, event.advisory_id, event.student_id);
      console.log('Fetched details:', details);
      
      // If we couldn't get teacher names from advisory, try to get the meeting creator
      let finalTeacherName = details?.leadTeacherName;
      if (!finalTeacherName && event.created_by) {
        try {
          const creatorRes = await fetch(`/php/Users/get_user_details.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: event.created_by })
          });
          const creatorData = await creatorRes.json();
          if (creatorData.status === "success" && creatorData.user) {
            finalTeacherName = formatName(creatorData.user.firstName, creatorData.user.middleName, creatorData.user.lastName);
            console.log('Using meeting creator as teacher:', finalTeacherName);
          }
        } catch (error) {
          console.error('Error fetching meeting creator:', error);
        }
      }
      
      if (details || finalTeacherName) {
        setSelectedEvent(prev => ({
          ...prev,
          lead_teacher_name: finalTeacherName || details?.leadTeacherName || prev.lead_teacher_name,
          assistant_teacher_name: details?.assistantTeacherName || prev.assistant_teacher_name,
          student_name: details?.studentName || prev.student_name
        }));
      }
    } else {
      console.log('This is a General Meeting - no teacher/student details needed');
    }
  };

  const formatName = (firstName, middleName, lastName) => {
    if (!firstName && !lastName) return "Not specified";
    
    const parts = [];
    if (lastName) parts.push(lastName);
    if (firstName) parts.push(firstName);
    if (middleName) parts.push(middleName);
    
    return parts.join(", ");
  };

  return (
    <ProtectedRoute role="Parent">
      <div className="flex-1 p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 p-3 lg:p-5">
            <div className="flex-1">
              <div className="p-2 sm:p-4">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents.filter(event => 
                    (event.status !== 'Cancelled' && event.meeting_status !== 'Cancelled')
                  )}
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
                      color: event.color || getColorForMeeting(event.id),
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
                        const cellEvents = calendarEvents.filter(e =>
                          e.start.getFullYear() === value.getFullYear() &&
                          e.start.getMonth() === value.getMonth() &&
                          e.start.getDate() === value.getDate() &&
                          e.status !== 'Cancelled' && e.meeting_status !== 'Cancelled'
                        );
                        const now = new Date();
                        const todayY = now.getFullYear();
                        const todayM = now.getMonth();
                        const todayD = now.getDate();
                        const cellY = value.getFullYear();
                        const cellM = value.getMonth();
                        const cellD = value.getDate();
                        const isToday = cellY === todayY && cellM === todayM && cellD === todayD;
                        const isCurrentMonth = value.getMonth() === displayedMonth && value.getFullYear() === displayedYear;
                        
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
                                pointerEvents: 'none',
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                zIndex: 20,
                                margin: 0,
                                alignSelf: undefined,
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
                                  handleSelectEvent(event);
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
                            backgroundColor: event.color || getColorForMeeting(event.id),
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
                              backgroundColor: event.color || getColorForMeeting(event.id),
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
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                          return event.status === 'Scheduled' || event.status === 'Rescheduled' || event.meeting_status === 'Scheduled' || event.meeting_status === 'Rescheduled';
                        }
                        return event.status === statusFilter || event.meeting_status === statusFilter;
                      })
                      .sort((a, b) => new Date(b.start || b.meeting_start) - new Date(a.start || a.meeting_start))
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
                            return event.status === 'Scheduled' || event.status === 'Rescheduled' || event.meeting_status === 'Scheduled' || event.meeting_status === 'Rescheduled';
                          }
                          return event.status === statusFilter || event.meeting_status === statusFilter;
                        })
                        .sort((a, b) => new Date(b.start || b.meeting_start) - new Date(a.start || a.meeting_start))
                        .slice(0, 100)
                        .map((event, i) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-2 border border-gray-200 hover:shadow-md transition cursor-pointer"
                          style={{
                            borderLeft: `${String(event.created_by) === String(userId) ? '6px solid #232c67' : '4px solid ' + (event.color || getColorForMeeting(event.id))}`,
                            boxShadow: '0 1px 3px rgba(60,60,100,0.06)',
                            marginBottom: 6,
                            background: '#fff',
                          }}
                          onClick={() => handleSelectEvent(event)}
                        >
                          <div className="text-xl" style={{ color: event.color || getColorForMeeting(event.id) }}>
                            <FaCalendarAlt />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-xs" style={{ fontWeight: String(event.created_by) === String(userId) ? 700 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {event.title || event.meeting_title}
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
                              {(event.date) ? event.date : ''}
                              {event.time && (() => {
                                // If time is already in the correct format (e.g., "9:00 AM - 10:00 AM"), use it directly
                                if (event.time.includes('AM') || event.time.includes('PM')) {
                                  return ` | ${event.time}`;
                                }
                                
                                // Otherwise, try to format it
                                try {
                                  const [start, end] = event.time.split(" - ");
                                  if (start && end) {
                                    return ` | ${formatTimeToAMPM(start)} - ${formatTimeToAMPM(end)}`;
                                  }
                                  return ` | ${event.time}`;
                                } catch (error) {
                                  console.error('Error formatting time:', event.time, error);
                                  return ` | ${event.time}`;
                                }
                              })()}
                            </div>
                            <span
                              className={`mt-1 inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                                (event.status === "Completed" || event.meeting_status === "Completed")
                                  ? "bg-green-100 text-green-700"
                                  : (event.status === "Cancelled" || event.meeting_status === "Cancelled")
                                  ? "bg-red-100 text-red-700"
                                  : (event.status === "Scheduled" || event.status === "Rescheduled" || event.meeting_status === "Scheduled" || event.meeting_status === "Rescheduled")
                                  ? "bg-blue-100 text-blue-700"
                                  : ""
                              }`}
                            >
                              {event.status || event.meeting_status || "Scheduled"}
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
      {/* Modal for viewing event details */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#232c67] px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Meeting Details</h2>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8 text-sm items-start">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="font-bold mb-1">Title</p>
                    <div className="mb-2">{selectedEvent.title || selectedEvent.meeting_title}</div>
                  </div>
                  {(selectedEvent.agenda || selectedEvent.meeting_agenda) && (
                    <div>
                      <p className="font-bold mb-1 mt-2">Agenda</p>
                      <div className="mb-2 whitespace-pre-line">{selectedEvent.agenda || selectedEvent.meeting_agenda}</div>
                    </div>
                  )}
                  <div>
                    <p className="font-bold mb-1 mt-2">When:</p>
                    <div>
                      {selectedEvent.date
                        ? selectedEvent.date
                        : (() => {
                            try {
                              const d = new Date(selectedEvent.start);
                              const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]; 
                              return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                            } catch { return ""; }
                          })()}
                    </div>
                    <div>
                      {selectedEvent.time
                        ? selectedEvent.time
                        : (() => {
                            try {
                              const start = new Date(selectedEvent.start);
                              const end = new Date(selectedEvent.end);
                              const s = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                              const e = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                              return `${s} - ${e}`;
                            } catch { return ""; }
                          })()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="font-bold mb-1">Meeting Type</p>
                    <div className="mb-2 text-gray-600">
                      {selectedEvent.advisory_id && selectedEvent.student_id ? 'Class Advisory Meeting' : 'General Meeting'}
                    </div>
                  </div>
                  
                  {/* Only show Advisory and Student labels for Class Advisory Meetings */}
                  {selectedEvent.advisory_id && selectedEvent.student_id && (
                    <>
                      <div>
                        <p className="font-bold mb-1">Lead Teacher</p>
                        <div className="mb-2 text-gray-600">
                          {selectedEvent.lead_teacher_name || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold mb-1">Assistant Teacher</p>
                        <div className="mb-2 text-gray-600">
                          {selectedEvent.assistant_teacher_name || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold mb-1">Student</p>
                        <div className="mb-2 text-gray-600">
                          {selectedEvent.student_name || "Not specified"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Status Label and Close Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                      selectedEvent.status === "Completed" || selectedEvent.meeting_status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : selectedEvent.status === "Cancelled" || selectedEvent.meeting_status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedEvent.status || selectedEvent.meeting_status || "Scheduled"}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <FaTimes className="text-sm" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
    </ProtectedRoute>
  );
}
