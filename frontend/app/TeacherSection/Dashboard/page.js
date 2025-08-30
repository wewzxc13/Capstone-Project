"use client";

import { FaBell, FaCog, FaPhone, FaEnvelope, FaUser, FaCalendarAlt, FaChartLine, FaUsers, FaBook, FaExclamationTriangle } from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import '../../../lib/chart-config.js';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "../../Context/UserContext";

export default function TeacherDashboard() {
  const router = useRouter();
  const { getUserPhoto, updateAnyUserPhoto } = useUser();
  
  // Show any queued toast from previous page (e.g., after password change)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("next_toast");
      if (raw) {
        const { message, type, duration } = JSON.parse(raw);
        if (message) {
          const fn = (type === 'error' ? console.error : console.log);
          // Use toast if available lazily via dynamic import
          import('react-toastify').then(({ toast }) => {
            if (type === 'error') toast.error(message, { autoClose: duration || 3000 });
            else toast.success(message, { autoClose: duration || 3000 });
          }).catch(() => fn(message));
        }
        localStorage.removeItem("next_toast");
      }
    } catch (_) { /* no-op */ }
  }, []);
  
  // State for subjects chart data
  const [subjectsData, setSubjectsData] = useState({
    labels: [],
    datasets: [{
      label: "Subjects",
      data: [],
      backgroundColor: [],
      borderRadius: 8,
    }]
  });
  
  // State for quarterly performance data
  const [progressData, setProgressData] = useState({
    labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
    datasets: [
      {
        label: "Class Performance",
        data: [null, null, null, null],
        borderColor: "#232c67",
        backgroundColor: "#232c67",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        spanGaps: true,
      },
    ],
  });

  // State for advisory, schedule, and teacher info
  const [advisory, setAdvisory] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [classInfo, setClassInfo] = useState({ label: '', days: [], time: '' });
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState({ fullName: '', contactNo: '', email: '' });
  const [studentStats, setStudentStats] = useState({ total: 0, active: 0, risk: 0, inactive: 0 });
  const [meetings, setMeetings] = useState([]);
  const [formattedMeetings, setFormattedMeetings] = useState([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [quarterlyLoading, setQuarterlyLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [teacher_id, setTeacherId] = useState(null);

  // Array of possible border color classes for meetings
  const meetingBorderColors = [
    'border-blue-400',
    'border-green-400',
    'border-orange-400',
    'border-yellow-400',
    'border-purple-400',
    'border-pink-400',
    'border-red-400',
    'border-teal-400',
  ];

  // Helper to get class info label/days/time
  function getClassInfo(level_name) {
    if (/Discoverer/i.test(level_name)) return { label: "Class Schedule of Discoverer", days: ["Monday", "Wednesday", "Friday"], time: "10:30 AM - 11:30 AM/1:30 PM - 2:30 PM" };
    if (/Explorer/i.test(level_name)) return { label: "Class Schedule of Explorer", days: ["Monday", "Wednesday", "Friday"], time: "9:30 AM - 11:00 AM/1:30 PM - 3:00 PM" };
    if (/Adventurer/i.test(level_name)) return { label: "Class Schedule of Adventurer", days: ["Tuesday", "Thursday", "Friday"], time: "9:30 AM - 11:00 AM/1:30 PM - 3:00 PM" };
    return { label: `Class Schedule of ${level_name}`, days: ["Monday", "Wednesday", "Friday"], time: "" };
  }

  // Helper to group by time slot for selected days
  function groupByTime(schedule, days) {
    const result = {};
    days.forEach((day) => {
      if (!schedule[day]) return;
      schedule[day].forEach((item) => {
        const startVal = item.start_minutes;
        const endVal = item.end_minutes;
        const minutesVal = item.minutes;
        const key = `${startVal}_${endVal}`;
        if (!result[key]) {
          const row = {
            time: minutesVal ? `${minutesVal} minutes` : '',
            start: startVal,
            end: endVal,
            minutes: minutesVal,
          };
          days.forEach((d) => (row[d] = []));
          result[key] = row;
        }
        if (item.subject_id) {
          result[key][day].push({ id: item.subject_id, type: 'subject', name: item.subject_name || item.name });
        }
        if (item.subject_id_2) {
          result[key][day].push({ id: item.subject_id_2, type: 'subject', name: item.subject_name_2 || item.name });
        }
        if (item.routine_id) {
          result[key][day].push({ id: item.routine_id, type: 'routine', name: item.routine_name || item.name });
        }
        if (item.routine_id_2) {
          result[key][day].push({ id: item.routine_id_2, type: 'routine', name: item.routine_name_2 || item.name });
        }
      });
    });
    return Object.values(result).sort((a, b) => (a.start - b.start));
  }

  // Helper to format name as "Lastname, First Name Middle Name"
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

  // Fetch teacher info, advisory, and schedule on mount
  useEffect(() => {
    const teacher_id = localStorage.getItem('userId');
    if (!teacher_id) return;
    
    setTeacherId(teacher_id);
    
    // Global error handler for images to prevent 404 errors in Network tab
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

    // Fetch teacher info
    fetch("http://localhost/capstone-project/backend/Users/get_user_details.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: teacher_id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.user) {
          setTeacherInfo({
            fullName: formatTeacherName(data.user.fullName),
            contactNo: data.user.contactNo,
            email: data.user.email
          });
          
          // Update UserContext with teacher's photo for real-time updates
          if (data.user.photo) {
            updateAnyUserPhoto(teacher_id, data.user.photo);
          }
        }
      });
    
    // Fetch subjects data for the chart
    setSubjectsLoading(true);
    fetch(`http://localhost/capstone-project/backend/Assessment/get_advisory_subject_averages.php?teacher_id=${teacher_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setSubjectsData({
            labels: data.data.labels,
            datasets: [{
              label: "Subjects",
              data: data.data.scores,
              backgroundColor: data.data.colors,
              borderRadius: 8,
            }]
          });
        }
        setSubjectsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching subjects data:', error);
        setSubjectsLoading(false);
      });
    
    // Fetch quarterly performance data for the chart
    setQuarterlyLoading(true);
    fetch(`http://localhost/capstone-project/backend/Assessment/get_class_quarterly_performance.php?teacher_id=${teacher_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          const quarterData = [null, null, null, null];
          data.data.scores.forEach((score, index) => {
            if (score > 0) {
              const roundedScore = Math.round(score);
              quarterData[index] = roundedScore;
            }
          });
          
          setProgressData({
            labels: ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            datasets: [{
              label: "Class Performance",
              data: quarterData,
              borderColor: "#232c67",
              backgroundColor: "#232c67",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              spanGaps: true,
            }]
          });
        }
        setQuarterlyLoading(false);
      })
      .catch(error => {
        console.error('Error fetching quarterly performance data:', error);
        setQuarterlyLoading(false);
      });

    setLoadingSchedule(true);
    // Fetch advisory
    fetch("http://localhost/capstone-project/backend/Advisory/get_advisory_details.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.advisory && data.advisory.level_id) {
          setAdvisory(data.advisory);
          // Fetch schedule for this level
          fetch("http://localhost/capstone-project/backend/Schedule/get_schedule.php")
            .then(res => res.json())
            .then(schedData => {
              if (schedData.status === "success") {
                const sched = schedData.schedules.find(s => s.level_id == data.advisory.level_id);
                setSchedule(sched);
                setClassInfo(getClassInfo(sched.level_name));
                setClassName(sched.level_name || "");
              }
              setLoadingSchedule(false);
            });
          
          // Fetch students for this specific advisory
          fetch("http://localhost/capstone-project/backend/Advisory/get_advisory_details.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id })
          })
            .then(advisoryRes => advisoryRes.json())
            .then(advisoryData => {
              if (advisoryData.students && Array.isArray(advisoryData.students)) {
                const students = advisoryData.students;
                const total = students.length;
                const active = students.filter(stu => stu.stud_school_status === 'Active').length;
                // NEW LOGIC: Only count inactive students WITH parent linking
                const inactive = students.filter(stu => 
                  stu.stud_school_status === 'Inactive' && stu.parent_id !== null
                ).length;
                
                // Also fetch inactive students count with parent linking for this level
                fetch(`http://localhost/capstone-project/backend/Advisory/get_inactive_students_count.php?level_id=${data.advisory.level_id}`)
                  .then(levelRes => levelRes.json())
                  .then(levelData => {
                    if (levelData.status === 'success') {
                      const levelInactive = levelData.inactive_count;
                      
                      if (levelInactive > 0) {
                        setStudentStats(prevStats => ({ ...prevStats, inactive: levelInactive }));
                      }
                    }
                  })
                  .catch(error => {
                    console.error('Error fetching level students:', error);
                  });
                
                setStudentStats({ total, active, risk: 0, inactive });
                
                // Fetch risk count using the new API endpoint
                setRiskLoading(true);
                fetch("http://localhost/capstone-project/backend/Assessment/get_students_at_risk_count.php", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    teacher_id: teacher_id
                  })
                })
                .then(res => res.json())
                .then(riskData => {
                  if (riskData.status === 'success') {
                    setStudentStats(prevStats => ({ ...prevStats, risk: riskData.count }));
                  }
                  setRiskLoading(false);
                })
                .catch(error => {
                  console.error('Error fetching risk count:', error);
                  setRiskLoading(false);
                });
              } else {
                setStudentStats({ total: 0, active: 0, risk: 0, inactive: 0 });
              }
            })
            .catch(error => {
              console.error('Error fetching advisory students:', error);
              setStudentStats({ total: 0, active: 0, risk: 0, inactive: 0 });
            });
        } else {
          setLoadingSchedule(false);
        }
      });

    // Fetch meetings for this teacher and format them for client only
    fetch(`http://localhost/capstone-project/backend/Meeting/get_meetings_details.php?user_id=${teacher_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const filtered = (data.meetings || []).filter(
            m => m.meeting_status === 'Scheduled' || m.meeting_status === 'Rescheduled'
          );
          filtered.sort((a, b) => new Date(a.meeting_start) - new Date(b.meeting_start));
          
          const formatted = filtered.map((m, i) => {
            const start = new Date(m.meeting_start);
            const end = new Date(m.meeting_end);
            const options = { month: 'short', day: '2-digit', year: 'numeric' };
            const dateStr = `${start.toLocaleString('en-US', options)}`;
            const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const endTime = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            let colorIndex = i;
            if (m.meeting_id && !isNaN(parseInt(m.meeting_id))) {
              colorIndex = parseInt(m.meeting_id, 10) % meetingBorderColors.length;
            } else {
              colorIndex = i % meetingBorderColors.length;
            }
            const borderColor = meetingBorderColors[colorIndex];
            return {
              ...m,
              formattedDate: `${dateStr} ${startTime} - ${endTime}`,
              borderColor,
            };
          });
          setFormattedMeetings(formatted);
        }
      })
      .finally(() => {
        setLoading(false);
      });
      
      // Cleanup function for event listeners
      return () => {
        document.removeEventListener('error', handleImageError, true);
      };
  }, []);

  return (
         <div >
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading dashboard data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch your information</p>
        </div>
      ) : (
        <>
          

          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Left Column: Profile/Schedule and Meetings */}
            <div className="flex flex-col gap-4 lg:w-1/2 w-full">
                             {/* Profile Card */}
               <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 min-h-[180px] w-full relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
                 <div className="relative z-10">
                                 <div className="flex items-center space-x-2 mb-2">
                   {(() => {
                     // Get real-time photo from UserContext, fallback to generic icon if not available
                     const realTimePhoto = getUserPhoto(teacher_id);
                     
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
                           <div className="w-10 h-10 bg-[#e6f7ff] rounded-full flex items-center justify-center text-lg text-[#1e2a79] hidden">
                             <FaUser />
                           </div>
                         </>
                       );
                     } else {
                       return (
                         <div className="w-10 h-10 bg-[#e6f7ff] rounded-full flex items-center justify-center text-lg text-[#1e2a79]">
                           <FaUser />
                         </div>
                       );
                     }
                   })()}
                  <div>
                    <h2 className="font-bold text-base text-[#1e2a79]">{teacherInfo.fullName || "-"}</h2>
                    <p className="text-gray-600 text-xs">Class Teacher</p>
                  </div>
                </div>
                
                  <div className="flex items-center gap-3 mb-2">
                   <div className="flex items-center gap-3 text-sm text-gray-600">
                     <FaPhone className="text-blue-500" />
                     <span>{teacherInfo.contactNo || "No contact number available"}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-gray-600">
                     <FaEnvelope className="text-blue-500" />
                     <span>{teacherInfo.email || "No email available"}</span>
                   </div>
                 </div>

                  <div className="border-t border-gray-200 pt-1">
                   <h3 className="font-bold text-xs text-[#1e2a79] mb-1">{advisory ? (classInfo.label || "Class Schedule") : "Class Schedule"}</h3>
                   
                                                                               {/* Dynamic Schedule Table */}
                                       {loadingSchedule ? (
                      <div className="text-xs text-gray-500 py-0.5">Loading schedule...</div>
                     ) : advisory && schedule && schedule.schedule ? (
                       <div className="overflow-x-auto w-full">
                         <table className="min-w-full text-xs text-left text-gray-800">
                                                   <thead className="bg-[#232c67] text-white">
                             <tr>
                               <th className="px-1 py-0.5 text-xs font-semibold border-r border-[#1a1f4d]">
                                 <div className="flex items-center gap-1">
                                   <FaCalendarAlt className="text-xs" />
                                   Time
                                 </div>
                               </th>
                               {classInfo.days.map(day => (
                                 <th key={day} className="px-1 py-0.5 text-xs font-semibold border-r border-[#1a1f4d] last:border-r-0">
                                   <div className="text-center">
                                     <div className="font-bold text-xs">{day}</div>
                                     <div className="text-xs font-normal text-[#a8b0e0] mt-0">{classInfo.time}</div>
                                   </div>
                                 </th>
                               ))}
                             </tr>
                           </thead>
                           <tbody>
                             {groupByTime(schedule.schedule, classInfo.days).length === 0 ? (
                               <tr>
                                 <td colSpan={classInfo.days.length + 1} className="px-2 py-0.5 text-center">
                                     <div className="flex flex-col items-center justify-center text-gray-500">
                                       <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center mb-0.5">
                                         <FaCalendarAlt className="text-xs text-gray-400" />
                                       </div>
                                       <h4 className="text-xs font-medium text-gray-700 mb-0.5">Empty Schedule</h4>
                                                            <p className="text-gray-500 text-xs text-center max-w-sm">
                         This class schedule is empty.
                       </p>
                     </div>
                   </td>
                 </tr>
               ) : (
                 groupByTime(schedule.schedule, classInfo.days).map((row, idx) => (
                   <tr key={idx} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                     <td className="px-1 py-0.5 font-semibold text-xs border-r border-gray-200 bg-gray-100">
                       <div className="flex items-center gap-1">
                         <div className="w-1 h-1 bg-[#232c67] rounded-full"></div>
                         {row.time}
                       </div>
                     </td>
                     {classInfo.days.map(day => (
                       <td key={day} className="px-1 py-0.5 text-xs border-r border-gray-200 last:border-r-0">
                         <div className="font-medium text-center">
                           {(Array.isArray(row[day]) && row[day].length > 0)
                             ? [...new Set(row[day].map(x => x && x.name ? x.name : '').filter(Boolean))].join(' / ')
                             : "-"}
                         </div>
                       </td>
                     ))}
                   </tr>
                 ))
               )}
             </tbody>
          </table>
                       </div>
                     ) : !advisory ? (
                       <div className="flex flex-col items-center justify-center py-4">
                         <div className="relative mb-3">
                           <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                             <FaCalendarAlt className="text-xl text-blue-400" />
                           </div>
                           <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                             <span className="text-white text-xs font-bold">!</span>
                           </div>
                         </div>
                         <h4 className="text-xs font-semibold text-gray-700 mb-1 text-center">
                           No Advisory Class Assigned
                         </h4>
                         <p className="text-gray-500 text-xs text-center leading-relaxed px-2">
                           Contact the school administration to assign you to an advisory class
                         </p>
                         <div className="mt-2 flex gap-1">
                           <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                           <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                         </div>
                       </div>
                     ) : (
                       <div className="text-xs text-gray-500 py-0.5">No schedule available for this class.</div>
                     )}
                  </div>
                </div>
              </div>

                                                                                                          {/* Meetings Card */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-h-[100px] w-full relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-12 translate-x-12 opacity-60 group-hover:scale-110 transition-transform duration-300"></div>
                   <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full translate-y-8 -translate-x-8 opacity-40 group-hover:scale-110 transition-transform duration-300"></div>
                   
                   <button 
                     onClick={() => router.push('/TeacherSection/Calendar')}
                     className="flex items-center justify-between h-full relative z-10 hover:scale-105 transition-all duration-300 cursor-pointer w-full"
                   >
                     <div className="flex items-center gap-4">
                       <div className="relative">
                         <div className="w-16 h-16 bg-gradient-to-r from-[#1e2a79] to-[#232c67] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                           <FaCalendarAlt className="text-white text-2xl" />
                         </div>
                         <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-xs font-bold">{formattedMeetings.length}</span>
                         </div>
                       </div>
                       
                       <div className="flex flex-col">
                         <h3 className="font-bold text-lg text-[#1e2a79] group-hover:text-[#232c67] transition-colors duration-300">
                           Upcoming Meetings
                         </h3>
                         <span className="text-sm text-gray-500 font-medium">
                           {formattedMeetings.length === 1 ? 'Meeting' : 'Meetings'} Total
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-end text-right">
                       <span className="text-4xl font-bold text-[#1e2a79] block">
                         {formattedMeetings.length}
                       </span>
                       <div className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         Click to view calendar →
                       </div>
                     </div>
                   </button>
                 </div>
            </div>

            {/* Right Column: Stats and Charts */}
            <div className="flex flex-col gap-3 lg:w-1/2 w-full">
                              {/* Student Stats Grid */}
              <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-3 min-h-[64px] w-full">
                {/* Total Students */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm min-h-[72px] flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    <FaUsers className="text-blue-500 text-lg" />
                  </div>
                  <div className="flex flex-col justify-center leading-tight text-left">
                    <span className="text-xs text-gray-500 font-medium">Total Students</span>
                 
                    <span className="text-xl font-bold text-[#1e2a79]">{studentStats.total}</span>
                  </div>
                </div>

                {/* Active Students */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm min-h-[72px] flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                    <span className="w-3 h-3 bg-green-500 rounded-full block"></span>
                  </div>
                  <div className="flex flex-col justify-center leading-tight text-left">
                    <span className="text-xs text-gray-500 font-medium">Active Students</span>
              
                    <span className="text-xl font-bold text-[#1e2a79]">{studentStats.active}</span>
                  </div>
                </div>

                {/* Students at Risk */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm min-h-[72px] flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                    <FaExclamationTriangle className="text-red-500 text-lg" />
                  </div>
                  <div className="flex flex-col justify-center leading-tight text-left">
                    <span className="text-xs text-gray-500 font-medium">Students at Risk</span>
                 
                    <span className="text-xl font-bold text-[#1e2a79]">{riskLoading ? '...' : studentStats.risk}</span>
                  </div>
                </div>

                {/* Inactive Students */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm min-h-[72px] flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <span className="w-3 h-3 bg-gray-400 rounded-full block"></span>
                  </div>
                  <div className="flex flex-col justify-center leading-tight text-left">
                    <span className="text-xs text-gray-500 font-medium">Inactive Students</span>
                    <span className="text-xl font-bold text-[#1e2a79]">{studentStats.inactive}</span>
                  </div>
                </div>
              </div>

              {/* Charts Container */}
              <div className="bg-white shadow-lg rounded-xl p-3 flex flex-col gap-3 min-h-[360px] w-full">
                {/* Subjects Chart */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                    <h3 className="text-base font-bold text-[#1e2a79]">Subjects Performance</h3>
                
                    {subjectsData.labels.length > 0 && subjectsData.datasets[0].data.some(score => score > 0) && (
                      <span className="text-xs font-bold text-[#1e2a79] bg-blue-50 px-2 py-0.5 rounded-full">
                        Overall Average: {(subjectsData.datasets[0].data.filter(score => score > 0).reduce((a, b) => a + b, 0) / subjectsData.datasets[0].data.filter(score => score > 0).length || 0).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="h-[130px]">
                    {subjectsLoading ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading subjects data...
                      </div>
                    ) : subjectsData.labels.length > 0 && subjectsData.datasets[0].data.some(score => score > 0) ? (
                      <Bar
                        data={subjectsData}
                        options={{
                          plugins: { legend: { display: false } },
                          maintainAspectRatio: false,
                          responsive: true,
                          scales: {
                            y: {
                              beginAtZero: true,
                              min: 0,
                              max: 100,
                              ticks: {
                                stepSize: 50,
                                maxTicksLimit: 3,
                                callback: function(value) {
                                  return `${Number(value).toFixed(0)}%`;
                                },
                                font: { size: 11 }
                              },
                              grid: { color: 'rgba(0,0,0,0.1)' }
                            },
                            x: {
                              ticks: {
                                maxRotation: 45,
                                minRotation: 0,
                                autoSkip: false,
                                font: { size: 10 }
                              },
                              categoryPercentage: 0.8,
                              barPercentage: 0.6,
                              grid: { display: false }
                            },
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Average: ${context.parsed.y.toFixed(2)}%`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="relative mb-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                            <FaBook className="text-3xl text-blue-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">?</span>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 text-center">
                          {advisory ? 'No Performance Data Yet' : 'No Advisory Class Assigned'}
                        </h4>
                        <p className="text-xs text-gray-500 text-center leading-relaxed px-2">
                          {advisory 
                            ? 'Performance data will appear here once students complete assessments'
                            : 'Contact the school administration to assign you to an advisory class'
                          }
                        </p>
                        <div className="mt-3 flex gap-1">
                          <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                                 {/* Quarterly Progress Chart */}
                 <div className="flex-1">
                   <h3 className="font-bold text-base text-[#1e2a79] mb-2">
                     {advisory ? `Progress of Class ${className}` : 'Progress Tracking'}
                   </h3>
                
                  <div className="h-[190px]">
                    {quarterlyLoading ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading quarterly data...
                      </div>
                    ) : progressData.datasets[0].data.some(score => score !== null && score > 0) ? (
                      <Line 
                        data={progressData} 
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                           layout: {
                             padding: { top: 24, bottom: 24, left: 24, right: 24 }
                           },
                          plugins: { 
                            legend: { 
                              display: true,
                              position: 'top',
                              labels: {
                                font: { size: 11 },
                                usePointStyle: true
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const val = context.parsed.y;
                                  const labels = ["", "Not Met", "Need Help", "Good", "Very Good", "Excellent"];
                                  const performanceLevel = labels[Math.round(val)] || '';
                                  return `${context.dataset.label}: ${performanceLevel}`;
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
                                  return labels[value] || '';
                                },
                                font: { size: 10 },
                                autoSkip: false,
                                maxTicksLimit: 5,
                                beginAtZero: false
                              },
                              grid: { color: '#e5e7eb' },
                              title: {
                                display: true,
                                text: 'Performance Level',
                                font: { size: 11, weight: 'bold' },
                                color: '#1e2a79'
                              }
                            },
                             x: {
                              ticks: { 
                                font: { size: 10 },
                                maxRotation: 0,
                                autoSkip: false
                              },
                              grid: { color: '#e5e7eb' },
                              title: {
                                display: true,
                                text: 'Quarter',
                                font: { size: 11, weight: 'bold' },
                                color: '#1e2a79'
                              }
                            },
                          },
                        }} 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="relative mb-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                            <FaChartLine className="text-3xl text-green-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">📊</span>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 text-center">
                          {advisory ? 'No Quarterly Data Yet' : 'No Advisory Class Assigned'}
                        </h4>
                        <p className="text-xs text-gray-500 text-center leading-relaxed px-2">
                          {advisory 
                            ? 'Progress tracking will begin once quarterly assessments are completed'
                            : 'Contact the school administration to assign you to an advisory class'
                          }
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          Ready to track progress! 🚀
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 