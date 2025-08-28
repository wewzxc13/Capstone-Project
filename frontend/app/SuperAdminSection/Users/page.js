"use client";

import { useState, useEffect, useRef } from "react";
import { FaUser, FaSearch, FaTimes, FaUsers, FaClipboardCheck, FaCalendarAlt, FaChevronDown, FaUserShield, FaUserTie, FaChalkboardTeacher, FaChild } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useUser } from "../../Context/UserContext";

const roles = ["Admin", "Teacher", "Parent", "Student"];

export default function SuperAdminUsersPage() {
  // This page displays only active users (status = 'active' for users, stud_school_status = 'Active' for students)
  const [selectedCategory, setSelectedCategory] = useState("Admin");
  const [studentLevelFilter, setStudentLevelFilter] = useState("All");
  const [studentLevelDropdownOpen, setStudentLevelDropdownOpen] = useState(false);
  const [users, setUsers] = useState({
    Admin: [],
    Teacher: [],
    Parent: [],
    Student: []
  });
  const [filteredUsers, setFilteredUsers] = useState({
    Admin: [],
    Teacher: [],
    Parent: [],
    Student: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { updateAnyUserPhoto, updateAnyStudentPhoto, getUserPhoto, getStudentPhoto, initializeAllUsersPhotos } = useUser();
  const router = useRouter();


  // Pagination state per role
  const [pageByRole, setPageByRole] = useState({ Teacher: 1, Student: 1, Parent: 1, Admin: 1 });
  const CARDS_PER_PAGE = 4;

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [leadTeacher, setLeadTeacher] = useState("");
  const [assistantTeacher, setAssistantTeacher] = useState("");

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const [archiving, setArchiving] = useState({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentLevelDropdownOpen && !event.target.closest('.student-level-dropdown')) {
        setStudentLevelDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [studentLevelDropdownOpen]);

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

  // Fetch active users from API (only users with status = 'active')
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost/capstone-project/backend/Users/get_all_users.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          // Debug: Log the user data to see photo fields
          console.log('=== USERS API RESPONSE DEBUG ===');
          console.log('Admin users:', data.users.Admin?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('Teacher users:', data.users.Teacher?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('Parent users:', data.users.Parent?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('Student users:', data.users.Student?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('=== END USERS DEBUG ===');
          
          // Fetch advisory data to get teacher assignments
          const advisoryResponse = await fetch('http://localhost/capstone-project/backend/Advisory/get_all_advisory_details.php', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (advisoryResponse.ok) {
            const advisoryData = await advisoryResponse.json();
            
            if (advisoryData.status === 'success' && advisoryData.advisories && Array.isArray(advisoryData.advisories)) {
              // Map advisory data to teachers
              const updatedUsers = { ...data.users };
              
              // Update teachers with their assigned classes
              if (updatedUsers.Teacher && Array.isArray(updatedUsers.Teacher)) {
                updatedUsers.Teacher = updatedUsers.Teacher.map(teacher => {
                  // Find if this teacher is assigned as lead or assistant
                  const leadAssignment = advisoryData.advisories.find(adv => adv.lead_teacher_id == teacher.id);
                  const assistantAssignment = advisoryData.advisories.find(adv => adv.assistant_teacher_id == teacher.id);
                  
                  let assignedClass = null;
                  if (leadAssignment && leadAssignment.level_name) {
                    assignedClass = leadAssignment.level_name;
                  } else if (assistantAssignment && assistantAssignment.level_name) {
                    assignedClass = assistantAssignment.level_name;
                  }
                  
                  return {
                    ...teacher,
                    assignedClass: assignedClass
                  };
                });
              }
              
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              
              // Initialize UserContext with all active users' photos for real-time updates
              console.log('Initializing all active users photos (with advisory data):', {
                adminCount: updatedUsers.Admin?.length || 0,
                teacherCount: updatedUsers.Teacher?.length || 0,
                parentCount: updatedUsers.Parent?.length || 0,
                studentCount: updatedUsers.Student?.length || 0,
                samplePhotos: {
                  admin: updatedUsers.Admin?.[0]?.photo,
                  teacher: updatedUsers.Teacher?.[0]?.photo,
                  parent: updatedUsers.Parent?.[0]?.photo,
                  student: updatedUsers.Student?.[0]?.photo
                }
              });
              initializeAllUsersPhotos(updatedUsers);
            } else {
              // If advisory data is not available, set teachers with default assignedClass
              const updatedUsers = { ...data.users };
              if (updatedUsers.Teacher && Array.isArray(updatedUsers.Teacher)) {
                updatedUsers.Teacher = updatedUsers.Teacher.map(teacher => ({
                  ...teacher,
                  assignedClass: null
                }));
              }
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              
              // Initialize UserContext with all active users' photos for real-time updates
              initializeAllUsersPhotos(updatedUsers);
            }
          } else {
            // If advisory API fails, set teachers with default assignedClass
            const updatedUsers = { ...data.users };
            if (updatedUsers.Teacher && Array.isArray(updatedUsers.Teacher)) {
              updatedUsers.Teacher = updatedUsers.Teacher.map(teacher => ({
                ...teacher,
                assignedClass: null
              }));
            }
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
            
                          // Initialize UserContext with all active users' photos for real-time updates
              initializeAllUsersPhotos(updatedUsers);
          }
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term and selected category
  useEffect(() => {
    const filterUsers = () => {
      const filtered = {};
      
      // Sort users first
      const sortedUsers = {};
      for (const role of roles) {
        sortedUsers[role] = (users[role] || []).slice().sort((a, b) => {
          const lastA = (a.lastName || a.last_name || '').toLowerCase();
          const lastB = (b.lastName || b.last_name || '').toLowerCase();
          if (lastA < lastB) return -1;
          if (lastA > lastB) return 1;
          const firstA = (a.firstName || a.first_name || '').toLowerCase();
          const firstB = (b.firstName || b.first_name || '').toLowerCase();
          return firstA.localeCompare(firstB);
        });
      }
      
      Object.keys(users).forEach(role => {
        if (role === selectedCategory) {
          let roleUsers = sortedUsers[role].filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Apply student level filter if category is Student
          if (role === "Student" && studentLevelFilter !== "All") {
            roleUsers = roleUsers.filter(user => {
              // Use the levelName that comes from the API (which already determines "Not Assigned Yet")
              const userLevel = user.levelName;
              
              if (studentLevelFilter === "Not Assigned Yet") {
                // Match the exact values that the API returns for unassigned students
                return userLevel === "Not Assigned Yet" || userLevel === "Not assigned yet";
              }
              return userLevel === studentLevelFilter;
            });
          }
          
          filtered[role] = roleUsers;
        } else {
          filtered[role] = [];
        }
      });
      
      setFilteredUsers(filtered);
      
      // Reset pagination when filtering
      const newPageByRole = {};
      Object.keys(pageByRole).forEach(role => {
        newPageByRole[role] = 1;
      });
      setPageByRole(newPageByRole);
    };

    filterUsers();
  }, [searchTerm, selectedCategory, studentLevelFilter, users]);

  const handleTabClick = (category) => {
    setSelectedCategory(category);
  };

  const handleAddUser = () => {
    router.push("/SuperAdminSection/Users/AddUser");
  };

  const handleViewUser = (user) => {
    router.push(`/SuperAdminSection/Users/ViewUser?role=${user.role}&id=${user.id}`);
  };

  const handleArchiveUser = async (user) => {
    if (!confirm(`Are you sure you want to archive ${user.name}?`)) {
      return;
    }

    setArchiving(prev => ({ ...prev, [user.id]: true }));
    
    try {
      const response = await fetch("http://localhost/capstone-project/backend/Users/archive_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          role: user.role
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        setToastMessage(data.message || `${user.name} archived successfully!`);
        setToastError(false);
        setShowToast(true);
        
        // Log system action
        const editorId = localStorage.getItem("userId");
        let action = "";
        if (user.role === "Student") {
          action = "Archived a student profile.";
          await fetch("http://localhost/capstone-project/backend/Logs/create_system_log.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: editorId,
              target_user_id: null,
              target_student_id: user.id,
              action,
            }),
          });
        } else {
          let article = (user.role === "Admin") ? "an" : "a";
          action = `Archived ${article} ${user.role.toLowerCase()} account.`;
          await fetch("http://localhost/capstone-project/backend/Logs/create_system_log.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: editorId,
              target_user_id: user.id,
              target_student_id: null,
              action,
            }),
          });
        }
        
        // Refresh the user list
        const refreshResponse = await fetch('http://localhost/capstone-project/backend/Users/get_all_users.php', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.status === 'success') {
            setUsers(refreshData.users);
            setFilteredUsers(refreshData.users);
          }
        }
        
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(data.message || "Failed to archive user");
        setToastError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error('Archive error:', err);
      setToastMessage("Failed to archive user");
      setToastError(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setArchiving(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handlePageChange = (role, newPage) => {
    setPageByRole((prev) => ({ ...prev, [role]: newPage }));
  };

  // Helper for teacher dropdowns (prototype)
  const teacherOptions = filteredUsers.Teacher.map(t => ({ id: t.id, name: t.name }));

  if (loading) {
    return (
      <ProtectedRoute role="Super Admin">
        <main className="flex-1">
          <div className="flex flex-col justify-center items-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Loading users...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute role="Super Admin">
        <main className="flex-1">
          <div className="flex flex-col justify-center items-center h-64 text-center px-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FaUsers className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-6 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#232c67] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Super Admin">
      <main className="flex-1">
        {/* Toast Notification */}
        {showToast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            toastError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span>{toastMessage}</span>
              <button 
                onClick={() => setShowToast(false)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors caret-[#232c67]"
                  style={{ minWidth: '300px' }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
              </div>

              {/* User Count Badge */}
              <div className="flex items-center gap-2 px-2 py-0.5 bg-[#f0f3fa] rounded-full">
                <FaUsers className="text-[#232c67] text-sm" />
                <span className="text-sm font-medium text-[#1a1f4d]">
                  {filteredUsers[selectedCategory]?.length || 0} {selectedCategory}{filteredUsers[selectedCategory]?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

          

            {/* Add User Button */}
            <button
              className="flex items-center gap-2 px-6 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
              onClick={handleAddUser}
            >
              <FaClipboardCheck className="text-sm" />
              Add User
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex gap-2">
            {roles.map((role) => {
              // Get the appropriate icon for each role
              const getIcon = (userRole) => {
                switch (userRole) {
                  case "Admin":
                    return <FaUserTie className="text-sm" />;
                  case "Teacher":
                    return <FaChalkboardTeacher className="text-sm" />;
                  case "Parent":
                    return <FaUsers className="text-sm" />;
                  case "Student":
                    return <FaChild className="text-sm" />;
                  default:
                    return <FaUser className="text-sm" />;
                }
              };

              return (
                <button
                  key={role}
                  onClick={() => handleTabClick(role)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                    selectedCategory === role
                      ? 'bg-[#232c67] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getIcon(role)}
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display users for selected role */}
        <div className="bg-white rounded-xl shadow">
          {(() => {
            const roleUsers = filteredUsers[selectedCategory] || [];
            const totalPages = Math.ceil(roleUsers.length / CARDS_PER_PAGE);
            const currentPage = pageByRole[selectedCategory] || 1;
            const paginatedUsers = roleUsers.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
            
            return (
              <div>
                {/* Header with action buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 min-h-[60px]">
                 
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      {selectedCategory} Users ({roleUsers.length})
                    </h2>
                    
                 
                  <div className="flex gap-2 flex-wrap">
                    {selectedCategory === "Teacher" && (
                      <button
                        onClick={() => router.push("/SuperAdminSection/Users/AssignedClass")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232c67] text-white rounded-lg text-xs font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                      >
                        <FaCalendarAlt className="text-xs" />
                        View Assigned Class
                      </button>
                    )}
                    {selectedCategory === "Parent" && (
                      <button
                        onClick={() => router.push("/SuperAdminSection/Users/ViewLinkedStudent")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232c67] text-white rounded-lg text-xs font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                      >
                        <FaUsers className="text-xs" />
                        View Linked Students
                      </button>
                    )}
                    {selectedCategory === "Student" && (
                      <>
                        <div className="relative student-level-dropdown">
                          <button
                            type="button"
                            onClick={() => setStudentLevelDropdownOpen(!studentLevelDropdownOpen)}
                            className="flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow-md w-[160px]"
                          >
                            <span className="truncate">{studentLevelFilter}</span>
                            <FaChevronDown className={`text-xs transition-transform ${studentLevelDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {studentLevelDropdownOpen && (
                            <div className="absolute top-full left-0 w-[160px] mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                              <div className="py-1">
                                {['All', 'Discoverer', 'Explorer', 'Adventurer', 'Not Assigned Yet'].map((level) => (
                                  <button
                                    key={level}
                                    onClick={() => {
                                      setStudentLevelFilter(level);
                                      setStudentLevelDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 transition-colors ${
                                      level === studentLevelFilter 
                                        ? 'bg-[#e8ecf7] text-[#232c67]' 
                                        : 'text-gray-700 hover:bg-[#f0f3fa]'
                                    }`}
                                  >
                                    <div className="font-medium truncate">{level}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { window.location.href = "http://localhost:3000/SuperAdminSection/Users/StudentProgress"; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232c67] text-white rounded-lg text-xs font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                        >
                          <FaClipboardCheck className="text-xs" />
                          View Student Progress
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Users Grid */}
                <div className="p-4">
                  {paginatedUsers.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-48 text-center px-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FaUsers className="text-2xl text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active {selectedCategory}s Found</h3>
                      <p className="text-gray-600 max-w-md">
                        {searchTerm ? `No active ${selectedCategory}s found matching "${searchTerm}"` : `No active ${selectedCategory}s found in the system.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {paginatedUsers.map((user, idx) => (
                        <div 
                          key={user.id || idx} 
                          className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-0 flex flex-col items-center min-h-[200px] max-w-xs w-full mx-auto cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleViewUser(user)}
                        >
                          <div className="w-full h-16 bg-[#232c67] rounded-t-xl flex items-center justify-center relative">
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                              {(() => {
                                // Get real-time photo from UserContext, fallback to user.photo if not available
                                const realTimePhoto = user.role === 'Student' 
                                  ? getStudentPhoto(user.id) || user.photo
                                  : getUserPhoto(user.id) || user.photo;
                                
                                // Debug logging for photo retrieval
                                console.log('Photo retrieval for user:', user.id, {
                                  userName: user.name || `${user.lastName}, ${user.firstName}`,
                                  userRole: user.role,
                                  realTimePhoto: user.role === 'Student' ? getStudentPhoto(user.id) : getUserPhoto(user.id),
                                  fallbackPhoto: user.photo,
                                  finalPhoto: realTimePhoto
                                });
                                
                                if (realTimePhoto) {
                                  return (
                                    <>
                                      <img
                                        src={realTimePhoto}
                                        alt="Profile"
                                        className="w-14 h-14 rounded-full object-cover shadow-md border-4 border-white"
                                        onError={(e) => {
                                          console.log('Photo failed to load for user:', user.name, 'Photo URL:', realTimePhoto);
                                          e.target.style.display = 'none';
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
                                        }}
                                        onLoad={() => {
                                          console.log('Photo loaded successfully for user:', user.name, 'Photo URL:', realTimePhoto);
                                        }}
                                      />
                                      {/* Fallback icon that shows when photo fails to load */}
                                      <div className="w-14 h-14 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-2xl shadow-md border-4 border-white hidden">
                                        <FaUser />
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <div className="w-14 h-14 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-2xl shadow-md border-4 border-white">
                                      <FaUser />
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                          <div className="pt-12 pb-4 px-3 text-center w-full">
                            <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
                              {user.lastName && user.firstName 
                                ? `${user.lastName}, ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                                : user.name || 'Not specified'
                              }
                            </h3>
                            <p className="text-sm text-gray-500">{user.role}</p>
                            {user.role === "Student" && (
                              <p className="text-xs text-gray-400 mt-1">
                                {user.levelName || "Not Assigned Yet"}
                              </p>
                            )}
                            {user.role === "Teacher" && (
                              <p className="text-xs text-gray-400 mt-1">
                                {user.assignedClass || "Non Advisory"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination controls */}
                {roleUsers.length > 0 && (
                  <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200">
                    <button
                      className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
                      onClick={() => handlePageChange(selectedCategory, Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <span className="text-lg">&lt;</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(selectedCategory, pageNum)}
                          className={
                            isActive
                              ? "w-10 h-10 rounded-lg bg-[#232c67] text-white text-sm font-semibold flex items-center justify-center"
                              : "w-10 h-10 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold flex items-center justify-center bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
                          }
                          disabled={isActive}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67]"
                      onClick={() => handlePageChange(selectedCategory, Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <span className="text-lg">&gt;</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Assign Modal for Teacher */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 min-w-[400px] max-w-xl relative">
              {/* Header */}
              <div className="bg-[#232c67] text-white px-4 py-2 rounded-t-md font-bold text-xl mb-4 -mx-6 -mt-6 rounded-b-none">
                Assign to Class
              </div>
              {/* Body */}
              <div className="flex flex-col gap-6 mt-2">
                <div>
                  <span className="block text-base font-semibold mb-1">Assign to Class:</span>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#e8ecf7]"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    <option value="1">Discoverer</option>
                    <option value="2">Explorer</option>
                    <option value="3">Adventurer</option>
                  </select>
                </div>
                <div>
                  <span className="block text-base font-semibold mb-1">Lead Teacher:</span>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#e8ecf7]"
                    value={leadTeacher}
                    onChange={e => setLeadTeacher(e.target.value)}
                  >
                    <option value="">Select Lead Teacher</option>
                    {teacherOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-base font-semibold mb-1">Assistant Teacher:</span>
                  <select
                    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-base text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#e8ecf7]"
                    value={assistantTeacher}
                    onChange={e => setAssistantTeacher(e.target.value)}
                  >
                    <option value="">Select Assistant Teacher (optional)</option>
                    {teacherOptions.filter(opt => String(opt.id) !== String(leadTeacher)).map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Footer */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] shadow transition-colors"
                  onClick={() => setShowAssignModal(false)}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
} 
