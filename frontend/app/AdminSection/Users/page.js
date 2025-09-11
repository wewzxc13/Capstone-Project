"use client";

import { useState, useEffect, useRef } from "react";
import { FaUser, FaSearch, FaTimes, FaUsers, FaClipboardCheck, FaCalendarAlt, FaChevronDown, FaUserShield, FaUserTie, FaChalkboardTeacher, FaChild, FaSort, FaSortUp, FaSortDown, FaTable, FaThLarge } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useUser } from "../../Context/UserContext";

// This page only displays Teacher, Parent, and Student users
// Admin users cannot see other admin information for security reasons
const roles = ["Teacher", "Parent", "Student"];

export default function AdminUsersPage() {
  // This page displays only active users (status = 'active' for users, stud_school_status = 'Active' for students)
  // Admin users cannot see other admin information - only Teacher, Parent, and Student roles are displayed
  const [selectedCategory, setSelectedCategory] = useState("Teacher");
  const [studentLevelFilter, setStudentLevelFilter] = useState("All");
  const [studentLevelDropdownOpen, setStudentLevelDropdownOpen] = useState(false);
  const [users, setUsers] = useState({
    Teacher: [],
    Parent: [],
    Student: []
  });
  const [filteredUsers, setFilteredUsers] = useState({
    Teacher: [],
    Parent: [],
    Student: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { updateAnyUserPhoto, updateAnyStudentPhoto, getUserPhoto, getStudentPhoto, initializeAllUsersPhotos } = useUser();
  const router = useRouter();




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

  // View toggle state
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  
  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

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
        const response = await fetch('/php/Users/get_all_users.php', {
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
          // Filter out Admin users - admin users cannot see other admin information
          const filteredData = { ...data.users };
          delete filteredData.Admin;
          
          // Debug: Log the user data to see photo fields
          console.log('=== USERS API RESPONSE DEBUG ===');
          console.log('Teacher users:', filteredData.Teacher?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('Parent users:', filteredData.Parent?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('Student users:', filteredData.Student?.map(u => ({ id: u.id, name: u.name, photo: u.photo })));
          console.log('=== END USERS DEBUG ===');
          
                    // Fetch advisory data to get teacher assignments
          const advisoryResponse = await fetch('/php/Advisory/get_all_advisory_details.php', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (advisoryResponse.ok) {
            const advisoryData = await advisoryResponse.json();
            
            if (advisoryData.status === 'success' && advisoryData.advisories && Array.isArray(advisoryData.advisories)) {
              // Map advisory data to teachers
              const updatedUsers = { ...filteredData };
              
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
              
              // Fetch children names for parents
              if (updatedUsers.Parent && Array.isArray(updatedUsers.Parent)) {
                const parentsWithChildren = await Promise.all(
                  updatedUsers.Parent.map(async (parent) => {
                    try {
                      const childrenResponse = await fetch(`/php/Users/get_parent_students.php?parent_id=${parent.id}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      if (childrenResponse.ok) {
                        const childrenData = await childrenResponse.json();
                        if (childrenData.status === 'success' && childrenData.data.students) {
                          const childrenNames = childrenData.data.students
                            .filter(student => student.school_status === 'Active')
                            .map(student => student.full_name)
                            .join(', ');
                          
                          return {
                            ...parent,
                            childrenName: childrenNames || "No children linked"
                          };
                        }
                      }
                      
                      return {
                        ...parent,
                        childrenName: "No children linked"
                      };
                    } catch (error) {
                      console.error(`Error fetching children for parent ${parent.id}:`, error);
                      return {
                        ...parent,
                        childrenName: "Error loading children"
                      };
                    }
                  })
                );
                
                updatedUsers.Parent = parentsWithChildren;
              }
              
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              
              // Initialize UserContext with all active users' photos for real-time updates
              console.log('Initializing all active users photos (with advisory data):', {
                teacherCount: updatedUsers.Teacher?.length || 0,
                parentCount: updatedUsers.Parent?.length || 0,
                studentCount: updatedUsers.Student?.length || 0,
                samplePhotos: {
                  teacher: updatedUsers.Teacher?.[0]?.photo,
                  parent: updatedUsers.Parent?.[0]?.photo,
                  student: updatedUsers.Student?.[0]?.photo
                }
              });
              initializeAllUsersPhotos(updatedUsers);
            } else {
              // If advisory data is not available, set teachers with default assignedClass
              const updatedUsers = { ...filteredData };
              if (updatedUsers.Teacher && Array.isArray(updatedUsers.Teacher)) {
                updatedUsers.Teacher = updatedUsers.Teacher.map(teacher => ({
                  ...teacher,
                  assignedClass: null
                }));
              }
              
              // Fetch children names for parents even without advisory data
              if (updatedUsers.Parent && Array.isArray(updatedUsers.Parent)) {
                const parentsWithChildren = await Promise.all(
                  updatedUsers.Parent.map(async (parent) => {
                    try {
                      const childrenResponse = await fetch(`/php/Users/get_parent_students.php?parent_id=${parent.id}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      if (childrenResponse.ok) {
                        const childrenData = await childrenResponse.json();
                        if (childrenData.status === 'success' && childrenData.data.students) {
                          const childrenNames = childrenData.data.students
                            .filter(student => student.school_status === 'Active')
                            .map(student => student.full_name)
                            .join(', ');
                          
                          return {
                            ...parent,
                            childrenName: childrenNames || "No children linked"
                          };
                        }
                      }
                      
                      return {
                        ...parent,
                        childrenName: "No children linked"
                      };
                    } catch (error) {
                      console.error(`Error fetching children for parent ${parent.id}:`, error);
                      return {
                        ...parent,
                        childrenName: "Error loading children"
                      };
                    }
                  })
                );
                
                updatedUsers.Parent = parentsWithChildren;
              }
              
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              
              // Initialize UserContext with all active users' photos for real-time updates
              initializeAllUsersPhotos(updatedUsers);
            }
          } else {
            // If advisory API fails, set teachers with default assignedClass
            const updatedUsers = { ...filteredData };
            if (updatedUsers.Teacher && Array.isArray(updatedUsers.Teacher)) {
              updatedUsers.Teacher = updatedUsers.Teacher.map(teacher => ({
                ...teacher,
                assignedClass: null
              }));
            }
            
            // Fetch children names for parents even without advisory data
            if (updatedUsers.Parent && Array.isArray(updatedUsers.Parent)) {
              const parentsWithChildren = await Promise.all(
                updatedUsers.Parent.map(async (parent) => {
                  try {
                    const childrenResponse = await fetch(`/php/Users/get_parent_students.php?parent_id=${parent.id}`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (childrenResponse.ok) {
                      const childrenData = await childrenResponse.json();
                      if (childrenData.status === 'success' && childrenData.data.students) {
                        const childrenNames = childrenData.data.students
                          .filter(student => student.school_status === 'Active')
                          .map(student => student.full_name)
                          .join(', ');
                        
                        return {
                          ...parent,
                          childrenName: childrenNames || "No children linked"
                        };
                      }
                    }
                    
                    return {
                      ...parent,
                      childrenName: "No children linked"
                    };
                  } catch (error) {
                    console.error(`Error fetching children for parent ${parent.id}:`, error);
                    return {
                      ...parent,
                      childrenName: "Error loading children"
                    };
                  }
                })
              );
              
              updatedUsers.Parent = parentsWithChildren;
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
      
      Object.keys(users).forEach(role => {
        if (role === selectedCategory) {
          let roleUsers = (users[role] || []).filter(user => 
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
          
          // Sort users based on current sort field and direction
          roleUsers.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
              case "name":
                // Sort by last name first, then first name
                const lastA = (a.lastName || a.last_name || '').toLowerCase();
                const lastB = (b.lastName || b.last_name || '').toLowerCase();
                if (lastA !== lastB) {
                  return sortDirection === "asc" ? lastA.localeCompare(lastB) : lastB.localeCompare(lastA);
                }
                // If last names are the same, sort by first name
                const firstA = (a.firstName || a.first_name || '').toLowerCase();
                const firstB = (b.firstName || b.first_name || '').toLowerCase();
                return sortDirection === "asc" ? firstA.localeCompare(firstB) : firstB.localeCompare(firstA);
              case "email":
                aValue = (a.email || "").toLowerCase();
                bValue = (b.email || "").toLowerCase();
                break;
              case "assignedClass":
                aValue = (a.assignedClass || "").toLowerCase();
                bValue = (b.assignedClass || "").toLowerCase();
                break;
              case "childrenName":
                aValue = (a.childrenName || "").toLowerCase();
                bValue = (b.childrenName || "").toLowerCase();
                break;
              case "birthdate":
                aValue = a.birthdate || "";
                bValue = b.birthdate || "";
                break;
              case "gender":
                aValue = (a.gender || "").toLowerCase();
                bValue = (b.gender || "").toLowerCase();
                break;
              default:
                // Default sorting by name (last name, then first name)
                const lastDefaultA = (a.lastName || a.last_name || '').toLowerCase();
                const lastDefaultB = (b.lastName || b.last_name || '').toLowerCase();
                if (lastDefaultA !== lastDefaultB) {
                  return sortDirection === "asc" ? lastDefaultA.localeCompare(lastDefaultB) : lastDefaultB.localeCompare(lastDefaultA);
                }
                const firstDefaultA = (a.firstName || a.first_name || '').toLowerCase();
                const firstDefaultB = (b.firstName || b.first_name || '').toLowerCase();
                return sortDirection === "asc" ? firstDefaultA.localeCompare(firstDefaultB) : firstDefaultB.localeCompare(firstDefaultA);
            }
            
            if (sortDirection === "asc") {
              return aValue.localeCompare(bValue);
            } else {
              return bValue.localeCompare(aValue);
            }
          });
          
          filtered[role] = roleUsers;
        } else {
          filtered[role] = [];
        }
      });
      
      setFilteredUsers(filtered);
      
      // Reset pagination when filtering (only for card view)
      const newPageByRole = {};
      Object.keys(pageByRole).forEach(role => {
        newPageByRole[role] = 1;
      });
      setPageByRole(newPageByRole);
    };

    filterUsers();
  }, [searchTerm, selectedCategory, studentLevelFilter, users, sortField, sortDirection]);

  const handleTabClick = (category) => {
    setSelectedCategory(category);
  };

  const handleAddUser = () => {
            router.push("/AdminSection/Users/AddUser");
  };

  const handleViewUser = (user) => {
            router.push(`/AdminSection/Users/ViewUser?role=${user.role}&id=${user.id}`);
  };

  // Sorting function
  const handleSort = (field) => {
    console.log(`Sorting by ${field}, current direction: ${sortDirection}`);
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="text-gray-400 text-xs" />;
    }
    return sortDirection === "asc" 
      ? <FaSortUp className="text-blue-600 text-xs" />
      : <FaSortDown className="text-blue-600 text-xs" />;
  };

  const handleArchiveUser = async (user) => {
    if (!confirm(`Are you sure you want to archive ${user.name}?`)) {
      return;
    }

    setArchiving(prev => ({ ...prev, [user.id]: true }));
    
    try {
      const response = await fetch("/php/Users/archive_user.php", {
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
          await fetch("/php/Logs/create_system_log.php", {
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
          action = `Archived a ${user.role.toLowerCase()} account.`;
          await fetch("/php/Logs/create_system_log.php", {
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
        const refreshResponse = await fetch('/php/Users/get_all_users.php', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.status === 'success') {
            // Filter out Admin users again
            const filteredRefreshData = { ...refreshData.users };
            delete filteredRefreshData.Admin;
            setUsers(filteredRefreshData);
            setFilteredUsers(filteredRefreshData);
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

  // Pagination state per role (only for card view)
  const [pageByRole, setPageByRole] = useState({ Teacher: 1, Student: 1, Parent: 1 });
  const CARDS_PER_PAGE = 4;

  // Helper for teacher dropdowns (prototype)
  const teacherOptions = filteredUsers.Teacher.map(t => ({ id: t.id, name: t.name }));

  const handlePageChange = (role, newPage) => {
    setPageByRole((prev) => ({ ...prev, [role]: newPage }));
  };

  // Helper function to generate smart pagination
  const generatePaginationItems = (currentPage, totalPages, maxVisible = 7) => {
    const items = [];
    
    if (totalPages <= maxVisible) {
      // If total pages is less than max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', page: i });
      }
    } else {
      // Always show first page
      items.push({ type: 'page', page: 1 });
      
      if (currentPage <= 4) {
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
      } else if (currentPage >= totalPages - 3) {
        // Near the end: show first page + ellipsis + last 5 pages
        items.push({ type: 'ellipsis' });
        for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
          items.push({ type: 'page', page: i });
        }
      } else {
        // In the middle: show first + ellipsis + current±2 + ellipsis + last
        items.push({ type: 'ellipsis' });
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          items.push({ type: 'page', page: i });
        }
        items.push({ type: 'ellipsis' });
        items.push({ type: 'page', page: totalPages });
      }
    }
    
    return items;
  };

  if (loading) {
    return (
      <ProtectedRoute role="Admin">
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
      <ProtectedRoute role="Admin">
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
    <ProtectedRoute role="Admin">
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

        {/* Display users for selected role */}
        <div className="bg-white rounded-xl shadow">
          {(() => {
            const roleUsers = filteredUsers[selectedCategory] || [];
            // Calculate pagination only for card view
            const totalPages = Math.ceil(roleUsers.length / CARDS_PER_PAGE);
            const currentPage = pageByRole[selectedCategory] || 1;
            const paginatedUsers = roleUsers.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);
            
            return (
              <div>
                {/* Header with role tabs and action buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 min-h-[60px] border-t border-gray-200">
                  {/* Role Selector Tabs */}
                  <div className="flex gap-2">
                    {roles.map((role) => {
                      // Get the appropriate icon for each role
                      const getIcon = (userRole) => {
                        switch (userRole) {
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center gap-2 mr-4">
                      <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                          viewMode === "table"
                            ? 'bg-[#232c67] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <FaTable className="text-sm" />
                        Table
                      </button>
                      <button
                        onClick={() => setViewMode("cards")}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                          viewMode === "cards"
                            ? 'bg-[#232c67] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <FaThLarge className="text-sm" />
                        Cards
                      </button>
                    </div>
                    {selectedCategory === "Teacher" && (
                      <button
                        onClick={() => router.push("/AdminSection/Users/AssignedClass")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#232c67] text-white rounded-lg text-sm font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                      >
                        <FaCalendarAlt className="text-sm" />
                        View Assigned Class
                      </button>
                    )}
                    {selectedCategory === "Parent" && (
                      <button
                        onClick={() => router.push("/AdminSection/Users/ViewLinkedStudent")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#232c67] text-white rounded-lg text-sm font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                      >
                        <FaUsers className="text-sm" />
                        View Linked Students
                      </button>
                    )}
                    {selectedCategory === "Student" && (
                      <>
                        <div className="relative student-level-dropdown">
                          <button
                            type="button"
                            onClick={() => setStudentLevelDropdownOpen(!studentLevelDropdownOpen)}
                            className="flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md w-[180px]"
                          >
                            <span className="truncate">{studentLevelFilter}</span>
                            <FaChevronDown className={`text-sm transition-transform ${studentLevelDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {studentLevelDropdownOpen && (
                            <div className="absolute top-full left-0 w-[180px] mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
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
                          onClick={() => { window.location.href = "/AdminSection/Users/StudentProgress"; }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#232c67] text-white rounded-lg text-sm font-semibold hover:bg-[#1a1f4d] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                        >
                          <FaClipboardCheck className="text-sm" />
                          View Student Progress
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Users Display - Table or Cards */}
                <div className="p-4">
                  {roleUsers.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-48 text-center px-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FaUsers className="text-2xl text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active {selectedCategory}s Found</h3>
                      <p className="text-gray-600 max-w-md">
                        {searchTerm ? `No active ${selectedCategory}s found matching "${searchTerm}"` : `No active ${selectedCategory}s found in the system.`}
                      </p>
                    </div>
                  ) : viewMode === "table" ? (
                    /* Table View */
                    <div>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                          <colgroup>
                            <col style={{ width: '80px' }} />
                            <col style={{ width: '200px' }} />
                            {selectedCategory === "Teacher" && <col style={{ width: '250px' }} />}
                            {selectedCategory === "Parent" && <col style={{ width: '250px' }} />}
                            {selectedCategory === "Student" && <col style={{ width: '120px' }} />}
                            {selectedCategory === "Teacher" && <col style={{ width: '180px' }} />}
                            {selectedCategory === "Parent" && <col style={{ width: '200px' }} />}
                            {selectedCategory === "Student" && <col style={{ width: '120px' }} />}
                          </colgroup>
                          <thead className="bg-[#232c67] text-white border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 font-semibold text-white text-left">
                                Photo
                              </th>
                              <th 
                                className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                onClick={() => handleSort("name")}
                              >
                                <div className="flex items-center gap-2">
                                  Full Name
                                  {getSortIcon("name")}
                                </div>
                              </th>
                              {selectedCategory === "Teacher" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("email")}
                                >
                                  <div className="flex items-center gap-2">
                                    Email
                                    {getSortIcon("email")}
                                  </div>
                                </th>
                              )}
                              {selectedCategory === "Parent" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("email")}
                                >
                                  <div className="flex items-center gap-2">
                                    Email
                                    {getSortIcon("email")}
                                  </div>
                                </th>
                              )}
                              {selectedCategory === "Student" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("birthdate")}
                                >
                                  <div className="flex items-center gap-2">
                                    Birthdate
                                    {getSortIcon("birthdate")}
                                  </div>
                                </th>
                              )}
                              {selectedCategory === "Teacher" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("assignedClass")}
                                >
                                  <div className="flex items-center gap-2">
                                    Assigned Class
                                    {getSortIcon("assignedClass")}
                                  </div>
                                </th>
                              )}
                              {selectedCategory === "Parent" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("childrenName")}
                                >
                                  <div className="flex items-center gap-2">
                                    Children Name
                                    {getSortIcon("childrenName")}
                                  </div>
                                </th>
                              )}
                              {selectedCategory === "Student" && (
                                <th 
                                  className="px-6 py-4 font-semibold text-white cursor-pointer text-left"
                                  onClick={() => handleSort("gender")}
                                >
                                  <div className="flex items-center gap-2">
                                    Gender
                                    {getSortIcon("gender")}
                                  </div>
                                </th>
                              )}
                            </tr>
                          </thead>
                                                
                        </table>
                        <div className="max-h-[280px] overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 table-fixed">
                            <colgroup>
                              <col style={{ width: '80px' }} />
                              <col style={{ width: '200px' }} />
                              {selectedCategory === "Teacher" && <col style={{ width: '250px' }} />}
                              {selectedCategory === "Parent" && <col style={{ width: '250px' }} />}
                              {selectedCategory === "Student" && <col style={{ width: '120px' }} />}
                              {selectedCategory === "Teacher" && <col style={{ width: '180px' }} />}
                              {selectedCategory === "Parent" && <col style={{ width: '200px' }} />}
                              {selectedCategory === "Student" && <col style={{ width: '120px' }} />}
                            </colgroup>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {roleUsers.map((user, idx) => (
                                <tr 
                                  key={user.id || idx} 
                                  className="hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleViewUser(user)}
                                >
                                    <td className="px-6 py-2 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                          {(() => {
                                            const realTimePhoto = user.role === 'Student' 
                                              ? getStudentPhoto(user.id) || user.photo
                                              : getUserPhoto(user.id) || user.photo;
                                            
                                            if (realTimePhoto) {
                                              return (
                                                <img
                                                  src={realTimePhoto}
                                                  alt="Profile"
                                                  className="h-8 w-8 rounded-full object-cover"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    if (e.target.nextSibling) {
                                                      e.target.nextSibling.style.display = 'flex';
                                                    }
                                                  }}
                                                />
                                              );
                                            } else {
                                              return (
                                                <div className="h-8 w-8 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67]">
                                                  <FaUser className="text-sm" />
                                                </div>
                                              );
                                            }
                                          })()}
                                          {/* Fallback icon */}
                                          <div className="h-8 w-8 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] hidden">
                                            <FaUser className="text-sm" />
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.lastName && user.firstName 
                                          ? `${user.lastName}, ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                                          : user.name || 'Not specified'
                                        }
                                      </div>
                                    </td>
                                    {selectedCategory === "Teacher" && (
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {user.email || "Not specified"}
                                      </td>
                                    )}
                                    {selectedCategory === "Parent" && (
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {user.email || "Not specified"}
                                      </td>
                                    )}
                                    {selectedCategory === "Student" && (
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : "Not specified"}
                                      </td>
                                    )}
                                                                      {selectedCategory === "Teacher" && (
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        user.assignedClass === "Discoverer"
                                          ? "bg-blue-100 text-blue-800"
                                          : user.assignedClass === "Explorer"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : user.assignedClass === "Adventurer"
                                          ? "bg-pink-100 text-pink-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}>
                                        {user.assignedClass || "Non Advisory"}
                                      </span>
                                    </td>
                                  )}
                                    {selectedCategory === "Parent" && (
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {user.childrenName || "Not specified"}
                                      </td>
                                    )}
                                    {selectedCategory === "Student" && (
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          user.gender?.toLowerCase() === "male"
                                            ? "bg-blue-100 text-blue-800"
                                            : user.gender?.toLowerCase() === "female"
                                            ? "bg-pink-100 text-pink-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}>
                                          {user.gender || "Not specified"}
                                        </span>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                   
                                      ) : (
                      /* Cards View */
                      <div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {selectedCategory} Users ({roleUsers.length})
                            </h3>
                          </div>
                        </div>
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
                                
                                if (realTimePhoto) {
                                  return (
                                    <>
                                      <img
                                        src={realTimePhoto}
                                        alt="Profile"
                                        className="w-14 h-14 rounded-full object-cover shadow-md border-4 border-white"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
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
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.assignedClass === "Discoverer"
                                    ? "bg-blue-100 text-blue-800"
                                    : user.assignedClass === "Explorer"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : user.assignedClass === "Adventurer"
                                    ? "bg-pink-100 text-pink-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {user.assignedClass || "Non Advisory"}
                                </span>
                              </p>
                            )}
                            {user.role === "Parent" && (
                              <p className="text-xs text-gray-400 mt-1">
                                {user.childrenName || "No children linked"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination controls - only for cards view */}
                    {roleUsers.length > 0 && (
                      <div className="flex items-center p-4 border-t border-gray-200 mt-4 relative">
                        {/* Pagination buttons - absolutely centered */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                          <button
                            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                            onClick={() => handlePageChange(selectedCategory, Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                          >
                            <span className="text-lg">&lt;</span>
                          </button>
                          
                          {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                            if (item.type === 'page') {
                              const isActive = item.page === currentPage;
                              return (
                                <button
                                  key={`page-${item.page}`}
                                  onClick={() => handlePageChange(selectedCategory, item.page)}
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
                          })}
                          
                          <button
                            className="w-10 h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2"
                            onClick={() => handlePageChange(selectedCategory, Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                          >
                            <span className="text-lg">&gt;</span>
                          </button>
                        </div>
                        
                        {/* User count info - right side */}
                        <span className="text-sm text-gray-500 ml-auto">
                          Showing {paginatedUsers.length} of {roleUsers.length} users
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                </div>


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
