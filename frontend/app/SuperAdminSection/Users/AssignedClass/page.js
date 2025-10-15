"use client";
import React, { useState, useEffect, Fragment } from "react";
import { toast } from "react-toastify";
import { FaUser, FaSearch, FaChalkboardTeacher, FaMale, FaFemale, FaUsers, FaEllipsisV, FaArrowLeft, FaMars, FaVenus, FaEdit, FaSave, FaTimes, FaChevronDown } from "react-icons/fa";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useUser } from "../../../Context/UserContext";
import { API } from '@/config/api';


const classTabs = [
  { name: "Discoverer", level_id: 1, age: "2 yrs" },
  { name: "Explorer", level_id: 2, age: "3 yrs" },
  { name: "Adventurer", level_id: 3, age: "4 yrs" },
];

// Helper function to check if a photo URL is a default placeholder
const isDefaultPlaceholder = (photoUrl) => {
  if (!photoUrl) return true;
  const defaultImages = [
    'default_teacher.png',
    'default_parent.png',
    'default_boy_student.png',
    'default_girl_student.png',
    'default_admin.png',
    'default_user.png'
  ];
  return defaultImages.some(defaultImg => 
    photoUrl.endsWith(defaultImg) || photoUrl.includes('/' + defaultImg)
  );
};

// Modal component using React Portal
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-[520px] relative border border-gray-100" style={{ overflow: 'visible' }}>
        {children}
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : null
  );
}

export default function AssignedClassPage() {
  // This page displays only active users and students (status = 'Active' for users, stud_school_status = 'Active' for students)
  const [selectedTab, setSelectedTab] = useState(classTabs[0].name);
  const [advisory, setAdvisory] = useState(null);
  const [parents, setParents] = useState([]);
  const [derivedParents, setDerivedParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentSearch, setParentSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentScheduleFilter, setStudentScheduleFilter] = useState("All");
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [selectedClassLevel, setSelectedClassLevel] = useState("");
  const [selectedLead, setSelectedLead] = useState("");
  const [selectedAsst, setSelectedAsst] = useState("");
  const [updating, setUpdating] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [assistantDropdownOpen, setAssistantDropdownOpen] = useState(false);
  const [studentSessionDropdownOpen, setStudentSessionDropdownOpen] = useState(false);
  const router = useRouter();
  const { 
    updateAnyUserPhoto, 
    updateAnyStudentPhoto, 
    getUserPhoto, 
    getStudentPhoto, 
    initializeAdvisoryPhotos 
  } = useUser();



  const selectedClass = classTabs.find(tab => tab.name === selectedTab);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (leadDropdownOpen && !event.target.closest('.lead-dropdown')) {
        setLeadDropdownOpen(false);
      }
      if (assistantDropdownOpen && !event.target.closest('.assistant-dropdown')) {
        setAssistantDropdownOpen(false);
      }
      if (studentSessionDropdownOpen && !event.target.closest('.student-session-dropdown')) {
        setStudentSessionDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [leadDropdownOpen, assistantDropdownOpen, studentSessionDropdownOpen]);

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

  useEffect(() => {
    setLoading(true);
    
    // First check if API is accessible
    fetch(API.auth.healthCheck())
      .then(res => {
        if (!res.ok) {
          throw new Error("API server is not responding");
        }
        return res.json();
      })
      .then(healthData => {
        if (healthData.status !== 'success') {
          throw new Error("Database connection failed");
        }
        // API is healthy, proceed with data fetch
        return fetch(API.advisory.getAdvisoryDetails(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level_id: selectedClass.level_id }),
        });
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
              .then(data => {
          // The API returns data directly without a status field
          if (data.advisory !== undefined) {
            
            setAdvisory(data.advisory);
            const fetchedStudents = data.students || [];
            const fetchedParents = data.parents || [];
            setStudents(fetchedStudents);
            setParents(fetchedParents);
            // Build unified unique parents list
            try {
              const uniqueById = new Map();
              
              // First, collect all required parent IDs from students
              const requiredParentIds = new Set();
              (fetchedStudents || []).forEach((s) => {
                if (s.parent_id) {
                  requiredParentIds.add(String(s.parent_id));
                }
              });
              
              // Seed from backend parents (these should be the authoritative source)
              (fetchedParents || []).forEach((p) => {
                if (p && p.user_id) {
                  const pid = String(p.user_id);
                  if (requiredParentIds.has(pid) && !uniqueById.has(pid)) {
                    uniqueById.set(pid, p);
                  }
                }
              });
              
              // Add any missing parents inferred from students (fallback)
              (fetchedStudents || []).forEach((s) => {
                const pid = String(s.parent_id);
                if (pid && requiredParentIds.has(pid) && !uniqueById.has(pid)) {
                  uniqueById.set(pid, {
                    user_id: s.parent_id,
                    user_firstname: s.parent_firstname || '',
                    user_middlename: s.parent_middlename || '',
                    user_lastname: s.parent_lastname || '',
                    photo: null,
                  });
                }
              });
              
              const derivedList = Array.from(uniqueById.values());
              console.log('Derived parents list:', derivedList);
              console.log('Required parent IDs:', Array.from(requiredParentIds));
              console.log('Backend parents count:', (fetchedParents || []).length);
              console.log('Derived parents count:', derivedList.length);
              
              setDerivedParents(derivedList);
            } catch (e) {
              console.error('Error deriving unique parents:', e);
              setDerivedParents(fetchedParents || []);
            }
            
            // Initialize UserContext with advisory photos for real-time updates (including teacher photos)
            initializeAdvisoryPhotos(fetchedStudents, fetchedParents, data.advisory);
        } else {
          // No advisory found for this level - this is normal for empty classes
          setAdvisory(null);
          setStudents([]);
          setParents([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching advisory details:", error);
        // Only show error toast if it's not a network error (like server down)
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast.error("Network error. Please check your connection and try again.");
        }
        setAdvisory(null);
        setStudents([]);
        setParents([]);
        setLoading(false);
      });
  }, [selectedClass.level_id]);

  // Fetch available teachers and class levels when modal opens
  useEffect(() => {
    if (showEditModal) {
      let teachersLoaded = false;
      let levelsLoaded = false;
      
      const checkAllLoaded = () => {
        if (teachersLoaded && levelsLoaded) {
          setModalLoading(false);
        }
      };

             // Fetch available teachers
       fetch(API.advisory.listTeachersWithoutAdvisory())
         .then(res => {
           if (!res.ok) {
             throw new Error(`HTTP error! status: ${res.status}`);
           }
           return res.json();
         })
         .then(data => {
           if (data.status === "success") {
             setAvailableTeachers(data.teachers || []);
           } else {
             console.error("Failed to fetch available teachers:", data.message);
             setAvailableTeachers([]);
           }
           teachersLoaded = true;
           checkAllLoaded();
         })
         .catch((error) => {
           console.error("Error fetching available teachers:", error);
           setAvailableTeachers([]);
           teachersLoaded = true;
           checkAllLoaded();
         });

             // Fetch class levels
       fetch(API.advisory.listClassLevels())
         .then(res => {
           if (!res.ok) {
             throw new Error(`HTTP error! status: ${res.status}`);
           }
           return res.json();
         })
         .then(data => {
           if (data.status === "success") {
             setClassLevels(data.levels || []);
           } else {
             console.error("Failed to fetch class levels:", data.message);
             setClassLevels([]);
           }
           levelsLoaded = true;
           checkAllLoaded();
         })
         .catch((error) => {
           console.error("Error fetching class levels:", error);
           setClassLevels([]);
           levelsLoaded = true;
           checkAllLoaded();
         });
    }
  }, [showEditModal]);

  const isAnyClassAvailable = classLevels.some(lvl => lvl.assigned_count < lvl.max_teachers);
  const isAnyTeacherAvailable = availableTeachers.length > 0;

  const handleEditClassAssigned = () => {
    setShowEditModal(true);
    setModalLoading(true);
    setShowEllipsisMenu(false);
    setSelectedClassLevel("");
    // Set current teachers as default values
    setSelectedLead(advisory?.lead_teacher_id ? String(advisory.lead_teacher_id) : "");
    setSelectedAsst(advisory?.assistant_teacher_id ? String(advisory.assistant_teacher_id) : "");
  };

  const handleSaveClassAssigned = async () => {
    if (!advisory?.advisory_id) {
      toast.error("No advisory found to update");
      return;
    }
    
    setUpdating(true);
    let success = true;
    let errorMsg = "";
    let updatedAdvisory = { ...advisory };
    
    try {
      // Update class name/level
      if (selectedClassLevel && advisory.level_id !== selectedClassLevel) {
        const res = await fetch(API.advisory.updateAdvisoryClass(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advisory_id: advisory.advisory_id,
            level_id: selectedClassLevel,
            students: students // send current students for re-assignment
          })
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.status !== "success") { 
          errorMsg = data.message || "Failed to update class"; 
          success = false; 
        } else {
          updatedAdvisory.level_id = selectedClassLevel;
        }
      }
      
      // Update lead teacher
      if (selectedLead && advisory.lead_teacher_id !== selectedLead) {
        const res = await fetch(API.advisory.updateAdvisoryTeacher(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advisory_id: advisory.advisory_id,
            teacher_id: selectedLead,
            type: "lead"
          })
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.status !== "success") { 
          errorMsg = data.message || "Failed to update lead teacher"; 
          success = false; 
        } else {
          // Find the teacher name from available teachers
          const teacher = availableTeachers.find(t => String(t.id) === String(selectedLead));
          if (teacher) {
            updatedAdvisory.lead_teacher_id = selectedLead;
            // Format as "Lastname, Firstname Middlename"
            const middleName = teacher.middleName ? ` ${teacher.middleName}` : '';
            updatedAdvisory.lead_teacher_name = `${teacher.lastName}, ${teacher.firstName}${middleName}`;
          }
        }
      }
      
      // Update assistant teacher (can be null/empty for optional assignment)
      if (selectedAsst !== advisory.assistant_teacher_id) {
        console.log('Updating assistant teacher:', { selectedAsst, current: advisory.assistant_teacher_id });
        
        const requestBody = {
          advisory_id: advisory.advisory_id,
          teacher_id: selectedAsst || null, // Allow null for optional assistant
          type: "assistant"
        };
        
        console.log('Request body:', requestBody);
        
        const res = await fetch(API.advisory.updateAdvisoryTeacher(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('API Response:', data);
        
        if (data.status !== "success") { 
          errorMsg = data.message || "Failed to update assistant teacher"; 
          success = false; 
        } else {
          if (selectedAsst) {
            // Find the teacher name from available teachers
            const teacher = availableTeachers.find(t => String(t.id) === String(selectedAsst));
            if (teacher) {
              updatedAdvisory.assistant_teacher_id = selectedAsst;
              // Format as "Lastname, Firstname Middlename"
              const middleName = teacher.middleName ? ` ${teacher.middleName}` : '';
              updatedAdvisory.assistant_teacher_name = `${teacher.lastName}, ${teacher.firstName}${middleName}`;
            }
          } else {
            // Clear assistant teacher
            updatedAdvisory.assistant_teacher_id = null;
            updatedAdvisory.assistant_teacher_name = null;
          }
        }
      }
      
    } catch (error) {
      console.error("Error updating class assignment:", error);
      success = false;
      errorMsg = "Network error occurred. Please check your connection and try again.";
    }
    
    setUpdating(false);
    if (success) {
      setShowEditModal(false);
      setAdvisory(updatedAdvisory);
      toast.success("Class Assignment Updated Successfully!");
      // Reset form values
      setSelectedClassLevel("");
      setSelectedLead("");
      setSelectedAsst("");
    } else {
      toast.error(errorMsg);
    }
  };

  const handleScheduleChange = async (studentId, newSchedule) => {
    // Update local state instantly for UI feedback
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, stud_schedule_class: newSchedule } : s));
    
    try {
      const res = await fetch(API.user.updateStudent(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, stud_schedule_class: newSchedule })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Schedule updated successfully!");
      } else {
        toast.error(data.message || "Failed to update schedule");
        // Revert local state on error
        setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, stud_schedule_class: s.stud_schedule_class } : s));
      }
    } catch (error) {
      console.error("Error updating student schedule:", error);
      toast.error("Failed to update schedule. Please try again.");
      // Revert local state on error
      setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, stud_schedule_class: s.stud_schedule_class } : s));
    }
  };

  // Helper to ensure current teacher is in dropdown
  function getDropdownTeachers(currentId) {
    let teachers = [...availableTeachers];
    if (
      currentId &&
      !teachers.some(t => String(t.id) === String(currentId)) &&
      advisory
    ) {
      // Try to get name from advisory
      let name = '';
      if (String(currentId) === String(advisory.lead_teacher_id)) {
        name = advisory.lead_teacher_name;
      } else if (String(currentId) === String(advisory.assistant_teacher_id)) {
        name = advisory.assistant_teacher_name;
      }
      if (name) {
        const nameParts = name.split(' ');
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          const middleName = nameParts.slice(1, -1).join(' ');
          teachers.push({ id: currentId, firstName, middleName, lastName });
        } else {
          teachers.push({ id: currentId, firstName: name, middleName: '', lastName: '' });
        }
      }
    }
    // Sort alphabetically by last name, then first name
    teachers.sort((a, b) => {
      const lastA = (a.lastName || '').toLowerCase();
      const lastB = (b.lastName || '').toLowerCase();
      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;
      const firstA = (a.firstName || '').toLowerCase();
      const firstB = (b.firstName || '').toLowerCase();
      return firstA.localeCompare(firstB);
    });
    return teachers;
  }



  if (loading) {
    return (
      <ProtectedRoute role="Super Admin">
        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading assigned class data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Super Admin">
      {/* Combined Header and Class Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
           <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
             <button
               onClick={() => router.push('/SuperAdminSection/Users')}
               className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-fit"
             >
               <FaArrowLeft className="text-sm" />
               <span className="text-sm">Back to Users</span>
             </button>
             <h2 className="text-base sm:text-lg font-bold text-gray-900">Assigned Class Management</h2>
           </div>
           
                       {/* Tab Buttons and Ellipsis Menu */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-4 sm:mb-6">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                {classTabs.map(tab => (
                  <button
                    key={tab.name}
                    onClick={() => setSelectedTab(tab.name)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 whitespace-nowrap ${
                      selectedTab === tab.name
                        ? 'bg-[#232c67] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FaUsers className="text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm">{tab.name}</span>
                  </button>
                ))}
              </div>
              
                             <button 
                 onClick={handleEditClassAssigned}
                 className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 shadow-sm w-full sm:w-auto justify-center sm:justify-start"
               >
                 <FaEdit className="text-sm" />
                 <span className="text-sm">Edit Class Assigned</span>
               </button>
            </div>
           
           {/* Teachers and Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Teaching Staff</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    // Get photo from UserContext with fallback to API photo
                    const contextPhoto = getUserPhoto(advisory?.lead_teacher_id);
                    // Construct full URL for API photo (strip /php/Uploads/ prefix to avoid double-pathing)
                    const apiPhoto = advisory?.lead_teacher_photo
                      ? (advisory.lead_teacher_photo.startsWith('http') 
                          ? advisory.lead_teacher_photo 
                          : API.uploads.getUploadURL(advisory.lead_teacher_photo.replace(/^\/php\/Uploads\//, '')))
                      : null;
                    const realTimePhoto = contextPhoto || apiPhoto;
                    
                    if (realTimePhoto) {
                      return (
                        <>
                          <img
                            src={realTimePhoto}
                            alt="Lead Teacher"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          {/* Fallback icon that shows when photo fails to load */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm sm:text-lg shadow-sm hidden flex-shrink-0">
                            <FaChalkboardTeacher />
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm sm:text-lg shadow-sm flex-shrink-0">
                          <FaChalkboardTeacher />
                        </div>
                      );
                    }
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Lead Teacher</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {advisory?.lead_teacher_name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    // Get photo from UserContext with fallback to API photo
                    const contextPhoto = getUserPhoto(advisory?.assistant_teacher_id);
                    // Construct full URL for API photo (strip /php/Uploads/ prefix to avoid double-pathing)
                    const apiPhoto = advisory?.assistant_teacher_photo
                      ? (advisory.assistant_teacher_photo.startsWith('http') 
                          ? advisory.assistant_teacher_photo 
                          : API.uploads.getUploadURL(advisory.assistant_teacher_photo.replace(/^\/php\/Uploads\//, '')))
                      : null;
                    const realTimePhoto = contextPhoto || apiPhoto;
                    
                    if (realTimePhoto) {
                      return (
                        <>
                          <img
                            src={realTimePhoto}
                            alt="Assistant Teacher"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          {/* Fallback icon that shows when photo fails to load */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm sm:text-lg shadow-sm hidden flex-shrink-0">
                            <FaChalkboardTeacher />
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm sm:text-lg shadow-sm flex-shrink-0">
                          <FaChalkboardTeacher />
                        </div>
                      );
                    }
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Assistant Teacher</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {advisory?.assistant_teacher_name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
                         <div className="space-y-3">
               <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Statistics</h4>
               <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                 <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-0.5 bg-blue-50 rounded-full">
                   <FaMars className="text-blue-600 text-xs sm:text-sm" />
                   <span className="text-xs sm:text-sm font-medium text-blue-900">Male: {advisory?.total_male ?? 0}</span>
                 </div>
                 <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-0.5 bg-pink-50 rounded-full">
                   <FaVenus className="text-pink-600 text-xs sm:text-sm" />
                   <span className="text-xs sm:text-sm font-medium text-pink-900">Female: {advisory?.total_female ?? 0}</span>
                 </div>
                 <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-0.5 bg-green-50 rounded-full">
                   <FaUsers className="text-green-600 text-xs sm:text-sm" />
                   <span className="text-xs sm:text-sm font-medium text-green-700">Total: {advisory?.total_students ?? 0}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
             {/* Edit Class Assigned Modal */}
       <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
         {modalLoading ? (
           <div className="flex flex-col items-center justify-center py-8">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p className="text-lg font-medium text-gray-700">Loading teacher data...</p>
             <p className="text-sm text-gray-500">Please wait while we fetch available teachers</p>
           </div>
         ) : (
           <>
             <div className="mb-4 bg-[#232c67] text-white p-3 sm:p-4 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 rounded-t-lg">
               <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Edit Class Assignment</h3>
               <p className="text-[#a8b0e0] text-xs sm:text-sm">Update the teaching staff for this class</p>
             </div>
        
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSaveClassAssigned();
          }}
          className="flex flex-col gap-4"
        >
          {/* Class Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-gray-800 font-medium">{selectedClass.name}</span>
            </div>
          </div>
          
                     {/* Lead Teacher */}
           <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">
               Lead Teacher <span className="text-red-500">*</span>
             </label>
             {!isAnyTeacherAvailable && (
               <div className="text-center text-red-600 font-semibold py-2">No teachers available</div>
             )}
             <div className="relative lead-dropdown">
               <button
                 type="button"
                 onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}
                 className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                 disabled={!isAnyTeacherAvailable}
               >
                 <span>
                   {(() => {
                     if (selectedLead) {
                       const teacher = getDropdownTeachers(advisory?.lead_teacher_id).find(t => String(t.id) === String(selectedLead));
                       return teacher ? `${teacher.lastName}, ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName}` : ''}` : 'Select Lead Teacher';
                     } else if (advisory?.lead_teacher_name) {
                       return advisory.lead_teacher_name;
                     } else {
                       return 'Select Lead Teacher';
                     }
                   })()}
                 </span>
                 <FaChevronDown className={`text-xs transition-transform ${leadDropdownOpen ? 'rotate-180' : ''}`} />
               </button>
               
                               {leadDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden max-h-48 overflow-y-auto">
                   <div className="py-2">
                     
                     {getDropdownTeachers(advisory?.lead_teacher_id).map(t => {
                       const isCurrent = String(t.id) === String(advisory?.lead_teacher_id);
                       const isSelected = String(t.id) === String(selectedLead);
                       return (
                         <button
                           key={t.id}
                           onClick={() => {
                             setSelectedLead(String(t.id));
                             setLeadDropdownOpen(false);
                           }}
                           className={`w-full text-left px-4 py-3 transition-colors ${
                             isSelected 
                               ? 'bg-blue-100 text-blue-700' 
                               : isCurrent 
                                 ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                                 : 'text-gray-700 hover:bg-blue-50'
                           }`}
                         >
                           <div className="font-medium flex items-center justify-between">
                             <span>{t.lastName}, {t.firstName}{t.middleName ? ` ${t.middleName}` : ''}</span>
                             {isCurrent && (
                               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                 Current
                               </span>
                             )}
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
           </div>
          
                     {/* Assistant Teacher */}
           <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">
               Assistant Teacher (Optional)
             </label>
             {!isAnyTeacherAvailable && (
               <div className="text-center text-red-600 font-semibold py-2">No teachers available</div>
             )}
             <div className="relative assistant-dropdown">
               <button
                 type="button"
                 onClick={() => setAssistantDropdownOpen(!assistantDropdownOpen)}
                 className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                 disabled={!isAnyTeacherAvailable}
               >
                                   <span>
                    {(() => {
                      if (selectedAsst) {
                        const teacher = getDropdownTeachers(advisory?.assistant_teacher_id).find(t => String(t.id) === String(selectedAsst));
                        return teacher ? `${teacher.lastName}, ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName}` : ''}` : 'Select Assistant Teacher';
                      } else if (advisory?.assistant_teacher_name && selectedAsst !== "") {
                        return advisory.assistant_teacher_name;
                      } else if (selectedAsst === "") {
                        return 'No Assistant Teacher';
                      } else {
                        return 'Select Assistant Teacher (Optional)';
                      }
                    })()}
                  </span>
                 <FaChevronDown className={`text-xs transition-transform ${assistantDropdownOpen ? 'rotate-180' : ''}`} />
               </button>
               
                               {assistantDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden max-h-48 overflow-y-auto">
                   <div className="py-2">
                                           <button
                        onClick={() => {
                          setSelectedAsst("");
                          setAssistantDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-700 border-l-4 border-red-500"
                      >
                        <div className="font-medium">Remove Assistant Teacher</div>
                      </button>
                     {getDropdownTeachers(advisory?.assistant_teacher_id).map(t => {
                       const isCurrent = String(t.id) === String(advisory?.assistant_teacher_id);
                       const isSelected = String(t.id) === String(selectedAsst);
                       return (
                         <button
                           key={t.id}
                           onClick={() => {
                             setSelectedAsst(String(t.id));
                             setAssistantDropdownOpen(false);
                           }}
                           className={`w-full text-left px-4 py-3 transition-colors ${
                             isSelected 
                               ? 'bg-blue-100 text-blue-700' 
                               : isCurrent 
                                 ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                                 : 'text-gray-700 hover:bg-blue-50'
                           }`}
                         >
                           <div className="font-medium flex items-center justify-between">
                             <span>{t.lastName}, {t.firstName}{t.middleName ? ` ${t.middleName}` : ''}</span>
                             {isCurrent && (
                               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                 Current
                               </span>
                             )}
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
           </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-200">
            <button 
              type="button" 
              className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto" 
              onClick={() => setShowEditModal(false)} 
              disabled={updating}
            >
              <FaTimes className="text-sm" />
              Close
            </button>
            <button 
              type="submit" 
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md w-full sm:w-auto ${
                updating || !selectedLead
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                  : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
              }`}
              disabled={updating || !selectedLead}
            >
              <FaSave className="text-sm" />
              {updating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
                     </div>
         </form>
       </>
     )}
       </Modal>
        {/* Parents & Students Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Parents Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Parents</h3>
                             <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full w-fit">
                 <FaUsers className="text-blue-600 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-medium text-blue-900">
                  {(() => {
                    const list = (derivedParents && derivedParents.length > 0) ? derivedParents : parents;
                    const uniqueCount = (list || []).filter((p, i, self) => self.findIndex(x => String(x.user_id) === String(p.user_id)) === i).length;
                    return `${uniqueCount} ${uniqueCount === 1 ? 'Parent' : 'Parents'}`;
                  })()}
                </span>
               </div>
            </div>
            
                         <div className="mb-4">
               <div className="relative">
                 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                 <input
                   type="text"
                   value={parentSearch}
                   onChange={e => setParentSearch(e.target.value)}
                   placeholder="Search Parents by Name..."
                                       className={`w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors pl-10 ${parentSearch ? 'pr-10' : ''} caret-[#232c67]`}
                 />
                 {parentSearch && (
                   <button
                     onClick={() => setParentSearch("")}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                   >
                     <FaTimes className="text-sm" />
                   </button>
                 )}
               </div>
             </div>
            
                         <div className="space-y-2 h-[200px] sm:h-[240px] overflow-y-auto">
               {parents.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                  <FaUsers className="text-3xl sm:text-4xl text-gray-300 mb-2" />
                  <p className="text-sm sm:text-base text-gray-500">No parents found</p>
                </div>
              ) : (
                                 parents.filter(p =>
                   (`${p.user_lastname}, ${p.user_firstname} ${p.user_middlename || ''}`.toLowerCase().includes(parentSearch.toLowerCase()))
                 ).length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-center">
                    <FaSearch className="text-3xl sm:text-4xl text-gray-300 mb-2" />
                    <p className="text-sm sm:text-base text-gray-500">No parents match your search</p>
                  </div>
                                 ) : (
                  // Use derived unique parents for rendering
                  ((derivedParents && derivedParents.length > 0) ? derivedParents : parents).filter(p =>
                     (`${p.user_lastname}, ${p.user_firstname} ${p.user_middlename || ''}`.toLowerCase().includes(parentSearch.toLowerCase()))
                   ).filter((parent, index, self) => 
                     index === self.findIndex(p => p.user_id === parent.user_id)
                   ).sort((a, b) => {
                     const lastA = (a.user_lastname || '').toLowerCase();
                     const lastB = (b.user_lastname || '').toLowerCase();
                     if (lastA < lastB) return -1;
                     if (lastA > lastB) return 1;
                     const firstA = (a.user_firstname || '').toLowerCase();
                     const firstB = (b.user_firstname || '').toLowerCase();
                     return firstA.localeCompare(firstB);
                   }).map((parent, idx) => {
                    // Find all children (students) for this parent
                    const children = students.filter(s => s.parent_id === parent.user_id);
                                         return (
                       <div 
                         key={`${parent.user_id}-${idx}`}
                         className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                         onClick={() => router.push(`/SuperAdminSection/Users/ViewUser?role=Parent&id=${parent.user_id}`)}
                       >
                                                   {(() => {
                            // Get photo from UserContext with fallback to API photo
                            const contextPhoto = getUserPhoto(parent.user_id);
                            // Construct full URL for API photo (strip /php/Uploads/ prefix to avoid double-pathing)
                            const apiPhoto = parent.photo
                              ? (parent.photo.startsWith('http') 
                                  ? parent.photo 
                                  : API.uploads.getUploadURL(parent.photo.replace(/^\/php\/Uploads\//, '')))
                              : null;
                            const realTimePhoto = contextPhoto || apiPhoto;
                            
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
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm sm:text-lg shadow-sm hidden flex-shrink-0">
                                    <FaUser />
                                  </div>
                                </>
                              );
                            } else {
                              return (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm sm:text-lg shadow-sm flex-shrink-0">
                                  <FaUser />
                                </div>
                              );
                            }
                          })()}
                                                                          <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{parent.user_lastname}, {parent.user_firstname} {parent.user_middlename || ''}</div>
                          {children.length > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                              {children.length === 1 ? 'Child' : 'Children'}: {children.map((child, i) => 
                                `${child.stud_lastname}, ${child.stud_firstname} ${child.stud_middlename || ''}`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                       </div>
                     );
                  })
                )
              )}
            </div>
          </div>
          
          {/* Students Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Students</h3>
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                 <div className="relative student-session-dropdown w-full sm:w-auto">
                   <button
                     type="button"
                     onClick={() => setStudentSessionDropdownOpen(!studentSessionDropdownOpen)}
                     className="flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm hover:shadow-md w-full sm:min-w-[120px]"
                   >
                     <span className="truncate">{studentScheduleFilter}</span>
                     <FaChevronDown className={`text-xs transition-transform flex-shrink-0 ${studentSessionDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {studentSessionDropdownOpen && (
                     <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                       <div className="py-1">
                         {['All', 'Morning', 'Afternoon'].map((session) => (
                           <button
                             key={session}
                             onClick={() => {
                               setStudentScheduleFilter(session);
                               setStudentSessionDropdownOpen(false);
                             }}
                             className={`w-full text-left px-3 py-2 transition-colors ${
                               session === studentScheduleFilter 
                                 ? 'bg-blue-100 text-blue-700' 
                                 : 'text-gray-700 hover:bg-blue-50'
                             }`}
                           >
                             <div className="font-medium text-xs sm:text-sm">{session}</div>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
                                 <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-full w-fit">
                   <FaUsers className="text-green-600 text-xs sm:text-sm" />
                   <span className="text-xs sm:text-sm font-medium text-green-900">
                     {(() => {
                                            const filteredStudents = students
                       .filter(s => {
                         const formattedName = `${s.stud_lastname}, ${s.stud_firstname} ${s.stud_middlename || ''}`;
                         return formattedName.toLowerCase().includes(studentSearch.toLowerCase());
                       })
                       .filter(s => studentScheduleFilter === 'All' || (s.stud_schedule_class || '').toLowerCase() === studentScheduleFilter.toLowerCase());
                       return `${filteredStudents.length} ${filteredStudents.length === 1 ? 'Student' : 'Students'}`;
                     })()}
                   </span>
                 </div>
              </div>
            </div>
            
                         <div className="mb-4">
               <div className="relative">
                 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                 <input
                   type="text"
                   value={studentSearch}
                   onChange={e => setStudentSearch(e.target.value)}
                   placeholder="Search Students by Name..."
                                       className={`w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors pl-10 ${studentSearch ? 'pr-10' : ''} caret-[#232c67]`}
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
             </div>
            
                         <div className="space-y-2 h-[200px] sm:h-[240px] overflow-y-auto">
               {(() => {
                                 const filtered = students
                   .filter(s => {
                     const formattedName = `${s.stud_lastname}, ${s.stud_firstname} ${s.stud_middlename || ''}`;
                     return formattedName.toLowerCase().includes(studentSearch.toLowerCase());
                   })
                   .filter(s => studentScheduleFilter === 'All' || (s.stud_schedule_class || '').toLowerCase() === studentScheduleFilter.toLowerCase());
                
                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col justify-center items-center h-full text-center">
                      <FaUsers className="text-3xl sm:text-4xl text-gray-300 mb-2" />
                      <p className="text-sm sm:text-base text-gray-500">No students found</p>
                    </div>
                  );
                }
                
                                                                   // Remove duplicate students by student_id to prevent React key conflicts
                  const uniqueStudents = filtered.filter((student, index, self) => 
                    index === self.findIndex(s => s.student_id === student.student_id)
                  );
                  
                  // Sort: First by session (Morning, then Afternoon), then alphabetically by last name, then first name
                  const sorted = [...uniqueStudents].sort((a, b) => {
                   // First sort by session
                   const order = { 'morning': 0, 'afternoon': 1 };
                   const sessionA = order[(a.stud_schedule_class || '').toLowerCase()] ?? 2;
                   const sessionB = order[(b.stud_schedule_class || '').toLowerCase()] ?? 2;
                   
                   if (sessionA !== sessionB) {
                     return sessionA - sessionB;
                   }
                   
                   // Then sort alphabetically by last name, then first name
                   const lastA = (a.stud_lastname || '').toLowerCase();
                   const lastB = (b.stud_lastname || '').toLowerCase();
                   if (lastA < lastB) return -1;
                   if (lastA > lastB) return 1;
                   const firstA = (a.stud_firstname || '').toLowerCase();
                   const firstB = (b.stud_firstname || '').toLowerCase();
                   return firstA.localeCompare(firstB);
                 });
                
                                                                   return sorted.map((student, idx) => (
                    <div key={`${student.student_id}-${idx}`} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                     <div 
                       className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer min-w-0"
                       onClick={() => router.push(`/SuperAdminSection/Users/ViewUser?role=Student&id=${student.student_id}`)}
                     >
                                               {(() => {
                            // Get photo from UserContext with fallback to API photo
                            const contextPhoto = getStudentPhoto(student.student_id);
                            // Construct full URL for API photo (strip /php/Uploads/ prefix to avoid double-pathing)
                            const apiPhoto = student.photo
                              ? (student.photo.startsWith('http') 
                                  ? student.photo 
                                  : API.uploads.getUploadURL(student.photo.replace(/^\/php\/Uploads\//, '')))
                              : null;
                            const realTimePhoto = contextPhoto || apiPhoto;
                          
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
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm sm:text-lg shadow-sm hidden flex-shrink-0">
                                  <FaUser />
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm sm:text-lg shadow-sm flex-shrink-0">
                                <FaUser />
                              </div>
                            );
                          }
                        })()}
                                                <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{student.stud_lastname}, {student.stud_firstname} {student.stud_middlename || ''}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            Session: {student.stud_schedule_class || 'Not assigned'}
                          </div>
                        </div>
                     </div>
                                          <div className="relative flex-shrink-0">
                       <button
                         type="button"
                         onClick={() => {
                           // Toggle dropdown for this specific student
                           const studentId = student.student_id;
                           setStudents(prev => prev.map(s => 
                             s.student_id === studentId 
                               ? { ...s, dropdownOpen: !s.dropdownOpen }
                               : { ...s, dropdownOpen: false }
                           ));
                         }}
                         className="flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm hover:shadow-md min-w-[100px] sm:min-w-[140px]"
                       >
                         <span className="truncate">{student.stud_schedule_class || 'Select Session'}</span>
                         <FaChevronDown className={`text-xs transition-transform flex-shrink-0 ${student.dropdownOpen ? 'rotate-180' : ''}`} />
                       </button>
                       
                       {student.dropdownOpen && (
                         <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                           <div className="py-1">
                             {['', 'Morning', 'Afternoon'].map((session) => (
                               <button
                                 key={session}
                                 onClick={() => {
                                   handleScheduleChange(student.student_id, session);
                                   // Close dropdown after selection
                                   setStudents(prev => prev.map(s => 
                                     s.student_id === student.student_id 
                                       ? { ...s, dropdownOpen: false }
                                       : s
                                   ));
                                 }}
                                 className={`w-full text-left px-2 sm:px-3 py-2 transition-colors ${
                                   session === (student.stud_schedule_class || '') 
                                     ? 'bg-blue-100 text-blue-700' 
                                     : 'text-gray-700 hover:bg-blue-50'
                                 }`}
                               >
                                 <div className="font-medium text-xs sm:text-sm">{session || 'Select Session'}</div>
                               </button>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
                ));
              })()}
            </div>
          </div>
                 </div>
    </ProtectedRoute>
  );
}
