"use client";

import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaUser } from "react-icons/fa";
import { useUser } from "../../Context/UserContext";

// Helper function to construct full photo URL from filename
function getPhotoUrl(filename) {
  if (!filename) return null;
  
  // If it's already a full URL (like a blob URL for preview), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('blob:')) {
    return filename;
  }
  
  // If it already starts with /php/Uploads/, return as is
  if (filename.startsWith('/php/Uploads/')) {
    return filename;
  }
  
  // If it's a filename, construct the full backend URL
  return `/php/Uploads/${filename}`;
}

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

function getClassInfo(level_name) {
  if (/Discoverer/i.test(level_name)) return { label: "Class Schedule of Discoverer", days: ["Monday", "Wednesday", "Friday"], time: "10:30 AM - 11:30 AM/1:30 PM - 2:30 PM" };
  if (/Explorer/i.test(level_name)) return { label: "Class Schedule of Explorer", days: ["Monday", "Wednesday", "Friday"], time: "9:30 AM - 11:00 AM/1:30 PM - 3:00 PM" };
  if (/Adventurer/i.test(level_name)) return { label: "Class Schedule of Adventurer", days: ["Tuesday", "Thursday", "Friday"], time: "9:30 AM - 11:00 AM/1:30 PM - 3:00 PM" };
  return { label: `Class Schedule of ${level_name}`, days: ["Monday", "Wednesday", "Friday"], time: "" };
}

export default function Schedule() {
  const { getStudentPhoto, initializeAllUsersPhotos } = useUser();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [classInfo, setClassInfo] = useState({ label: '', days: [], time: '' });
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Debug logging
  console.log('🔍 Schedule Component Render:', {
    selectedStudentId: selectedStudent?.id,
    selectedStudentName: selectedStudent?.name,
    studentsCount: students.length,
    scheduleExists: !!schedule,
    scheduleLoading
  });

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const parentId = localStorage.getItem("userId");
        if (!parentId) {
          setLoading(false);
          return;
        }

        const response = await fetch("/php/Users/get_all_users.php");
        const data = await response.json();

        if (data.status === "success" && data.users && data.users.Student) {
          const myStudents = data.users.Student.filter(s => String(s.parent_id) === String(parentId));
          const sortedStudents = myStudents.sort((a, b) => (parseInt(a.levelId || a.level_id) || 0) - (parseInt(b.levelId || b.level_id) || 0));
          
          console.log('📚 Fetched students:', sortedStudents.map(s => ({ id: s.id, name: s.name, level: s.levelName })));
          
          setStudents(sortedStudents);
          
          if (sortedStudents.length > 0) {
            // Auto-select first active student
            const activeStudents = sortedStudents.filter(s => s.schoolStatus === 'Active');
            const firstStudent = activeStudents.length > 0 ? activeStudents[0] : sortedStudents[0];
            console.log('🎯 Setting first student as default:', firstStudent.name, 'ID:', firstStudent.id);
            setSelectedStudent(firstStudent);
            // Only initialize photos once, not on every render
            if (data.users) {
              initializeAllUsersPhotos(data.users);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []); // Remove initializeAllUsersPhotos dependency to prevent infinite loop

  // Fetch schedule when selected student changes
  useEffect(() => {
    if (!selectedStudent) return;

    console.log('🔄 Fetching schedule for student:', selectedStudent.name, 'ID:', selectedStudent.id);

    const fetchSchedule = async () => {
      setScheduleLoading(true);
      try {
        const response = await fetch("/php/Schedule/get_schedule.php");
        const data = await response.json();

        if (data.status === "success") {
          const studentLevelId = selectedStudent.levelId || selectedStudent.level_id;
          const studentSchedule = data.schedules.find(s => s.level_id == studentLevelId);
          
          console.log('📅 Found schedule for level:', studentLevelId, 'Schedule:', studentSchedule?.level_name);
          
          if (studentSchedule) {
            setSchedule(studentSchedule);
            setClassInfo(getClassInfo(studentSchedule.level_name));
            console.log('✅ Schedule set successfully for:', selectedStudent.name);
          } else {
            setSchedule(null);
            setClassInfo({ label: '', days: [], time: '' });
            console.log('❌ No schedule found for level:', studentLevelId);
          }
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setSchedule(null);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedStudent?.id]);

  const handleStudentTabClick = (student) => {
    // Only update if it's a different student
    if (selectedStudent?.id !== student.id) {
      console.log('🎯 Switching to student:', student.name, 'ID:', student.id);
      // Clear previous schedule immediately
      setSchedule(null);
      setClassInfo({ label: '', days: [], time: '' });
      // Update selected student
      setSelectedStudent(student);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 bg-gray-50">
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading students...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 p-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaUser className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-500 text-center max-w-md">
              You don't have any students linked to your account yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 bg-gray-50">
             {/* Student Tabs - Only show if parent has 2+ active students */}
               {students.filter(s => s.schoolStatus === 'Active').length > 1 && (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4">
           <div className="px-2 sm:px-4 py-2 border-b border-gray-200 overflow-x-auto pb-2">
            <div className="flex gap-2 sm:gap-3">
                              {students.filter(s => s.schoolStatus === 'Active').map((student) => (
                 <button
                   key={student.id}
                   className={`px-2 sm:px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 flex items-center gap-1 sm:gap-2 min-w-[140px] sm:min-w-[170px] flex-shrink-0 ${
                     selectedStudent?.id === student.id
                       ? 'bg-[#2c2f6f] text-white shadow-lg transform scale-105'
                       : 'bg-white text-[#2c2f6f] border-2 border-gray-200 hover:border-[#2c2f6f] hover:bg-[#f3f7fd] hover:shadow-md'
                   }`}
                   onClick={() => handleStudentTabClick(student)}
                 >
                   {/* Student Photo */}
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ${
                     selectedStudent?.id === student.id ? 'bg-white' : 'bg-[#2c2f6f]'
                   }`}>
                     {student.photo ? (
                       <img
                         src={getPhotoUrl(student.photo)}
                         alt="Profile"
                         className="w-full h-full object-cover rounded-full"
                         onError={(e) => {
                           e.target.style.display = 'none';
                           if (e.target.nextSibling) {
                             e.target.nextSibling.style.display = 'flex';
                           }
                         }}
                       />
                     ) : null}
                     <FaUser className={`w-3 h-3 ${selectedStudent?.id === student.id ? 'text-[#2c2f6f]' : 'text-white'}`} style={{ display: student.photo ? 'none' : 'flex' }} />
                   </div>

                   {/* Student Info */}
                   <div className="text-left">
                    <div className="font-semibold text-[11px] sm:text-xs truncate max-w-[100px] sm:max-w-none">
                       {student.lastName ? `${student.lastName}, ${student.firstName} ${student.middleName || ''}`.trim() : student.name}
                     </div>
                    <div className="text-[11px] sm:text-xs opacity-80 truncate max-w-[100px] sm:max-w-none">
                       {student.levelName || 'Class N/A'}
                     </div>
                   </div>
                 </button>
               ))}
             </div>
           </div>
         </div>
       )}

             {/* Schedule Content - Always show when there's a selected student */}
       {selectedStudent && (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                       {/* Class Name Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-blue-600 text-m" />
                </div>
                <div>
                  <h2 className="text-m font-bold text-gray-900">
                    {classInfo.label || `Class Schedule of ${selectedStudent.levelName || 'Unknown Class'}`}
                  </h2>
                </div>
              </div>
            </div>
           
           <div className="p-6">
             {scheduleLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                 <p className="text-lg font-medium">Loading schedule...</p>
               </div>
             ) : !schedule || !schedule.schedule ? (
               <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <FaCalendarAlt className="text-3xl text-gray-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-700 mb-2">No Schedule Available</h3>
                 <p className="text-gray-500 text-center max-w-md">
                   No schedule data has been configured for this class level yet.
                 </p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm text-left text-gray-800">
                   <thead className="bg-[#232c67] text-white">
                     <tr>
                      <th className="px-3 sm:px-5 py-3 text-sm sm:text-base font-semibold border-r border-[#1a1f4d]">
                         <div className="flex items-center gap-2">
                           <FaCalendarAlt className="text-sm" />
                           Time
                         </div>
                       </th>
                       {classInfo.days.map((day) => (
                        <th key={day} className="px-3 sm:px-5 py-3 text-sm sm:text-base font-semibold border-r border-[#1a1f4d] last:border-r-0">
                           <div className="text-center">
                             <div className="font-bold">{day}</div>
                             <div className="text-xs font-normal text-[#a8b0e0] mt-1">
                               {(() => {
                                 if (!classInfo.time) return '-';
                                 const [morning, afternoon] = classInfo.time.split("/").map(s => s.trim());
                                 const session = selectedStudent?.scheduleClass;
                                 if (session === 'Afternoon') {
                                   return afternoon || '-';
                                 } else if (session === 'Morning') {
                                   return morning || '-';
                                 }
                                 return classInfo.time;
                               })()}
                             </div>
                           </div>
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {groupByTime(schedule.schedule, classInfo.days).length === 0 ? (
                       <tr>
                         <td colSpan={classInfo.days.length + 1} className="px-6 py-8 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-500">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                               <FaCalendarAlt className="text-2xl text-gray-400" />
                             </div>
                             <h4 className="text-lg font-medium text-gray-700 mb-2">Empty Schedule</h4>
                             <p className="text-gray-500 text-center max-w-sm">
                               This class schedule is empty.
                             </p>
                           </div>
                         </td>
                       </tr>
                     ) : (
                       groupByTime(schedule.schedule, classInfo.days).map((row, idx) => (
                         <tr key={idx} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                          <td className="px-3 sm:px-5 py-3 font-semibold text-xs sm:text-sm border-r border-gray-200 bg-gray-100">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-[#232c67] rounded-full"></div>
                               {row.time}
                             </div>
                           </td>
                           {classInfo.days.map((day) => (
                            <td key={day} className="px-3 sm:px-5 py-3 text-xs sm:text-sm border-r border-gray-200 last:border-r-0">
                               <div className="text-center">
                                 <span className="font-medium">
                                   {(Array.isArray(row[day]) && row[day].length > 0)
                                     ? [...new Set(row[day].map(x => x && x.name ? x.name : '').filter(Boolean))].join(' / ')
                                     : "-"}
                                 </span>
                               </div>
                             </td>
                           ))}
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  );
}
