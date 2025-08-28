"use client";
import React, { useEffect, useState } from "react";
import { FaUser, FaArrowLeft, FaSearch, FaTimes, FaTimesCircle, FaUsers, FaChevronDown } from "react-icons/fa";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "react-toastify";
import { useUser } from "../../../Context/UserContext";

// Helper function to format names as "Lastname, Firstname Middlename"
const formatName = (name) => {
  if (!name) return '';
  
  // Split the name by spaces
  const nameParts = name.trim().split(' ');
  
  if (nameParts.length === 1) {
    return nameParts[0]; // Single name
  } else if (nameParts.length === 2) {
    // "Firstname Lastname" -> "Lastname, Firstname"
    return `${nameParts[1]}, ${nameParts[0]}`;
  } else {
    // "Firstname Middlename Lastname" -> "Lastname, Firstname Middlename"
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    const middleName = nameParts.slice(1, -1).join(' ');
    return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}`;
  }
};

// Format phone number for display: +63 920 384 7563 (simple format)
const formatPhoneForDisplay = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats and convert to simple +63 format
  let cleanDigits = '';
  if (digits.startsWith('009')) {
    // If starts with 009, remove it
    cleanDigits = digits.substring(3);
  } else if (digits.startsWith('09')) {
    // If starts with 09, remove the 0 prefix to get 9XXXXXXXXX
    cleanDigits = digits.substring(1);
  } else if (digits.startsWith('9')) {
    // If starts with 9, use as is
    cleanDigits = digits;
  } else {
    // For any other case, use as is
    cleanDigits = digits;
  }
  
  // Ensure we have a valid 10-digit number and format with spaces
  if (cleanDigits.length === 10 && cleanDigits.startsWith('9')) {
    // Format as +63 920 384 7563 (3-3-4)
    return `+63 ${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3, 6)} ${cleanDigits.substring(6)}`;
  } else if (cleanDigits.length > 0) {
    return `+63 ${cleanDigits}`;
  } else {
    return '';
  }
};

export default function ViewLinkedStudentPage() {
  // This page displays parents with linked students, sorted by priority:
  // 1. Parents with active students (alphabetically by last name)
  // 2. Parents with mixed status students (alphabetically by last name) 
  // 3. Parents with only inactive students (alphabetically by last name) - displayed last
  const [parentStudentList, setParentStudentList] = useState([]);
  const [filteredParentList, setFilteredParentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParent, setModalParent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const router = useRouter();
  const [parentView, setParentView] = useState('linked'); // 'linked', 'unlinked', or 'inactive-only'
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [parentViewDropdownOpen, setParentViewDropdownOpen] = useState(false);
  const [collapsedParents, setCollapsedParents] = useState(new Set()); // Track collapsed parents
  const { getUserPhoto, getStudentPhoto, initializeAllUsersPhotos } = useUser();

  useEffect(() => {
    async function fetchLinked() {
      setLoading(true);
      setError(null);
      try {
        // Fetch active users
        const res = await fetch("http://localhost/capstone-project/backend/Users/get_all_users.php");
        const data = await res.json();
        
        // Fetch archived users
        const archivedRes = await fetch("http://localhost/capstone-project/backend/Users/get_archived_users.php");
        const archivedData = await archivedRes.json();
        
        if (data.status === "success" && data.users) {
          const parents = data.users.Parent || [];
          const activeStudents = data.users.Student || [];
          const archivedStudents = archivedData.status === "success" ? (archivedData.users.Student || []) : [];
          
          // Combine active and archived students and remove duplicates
          const allStudents = [...activeStudents, ...archivedStudents];
          
          // Remove duplicates based on student ID
          const uniqueStudents = allStudents.filter((student, index, self) => 
            index === self.findIndex(s => s.id === student.id)
          );
          
          // Create a map of students by parentId for quick lookup
          const studentsByParentId = {};
          uniqueStudents.forEach(student => {
            if (student.parent_id) {
              if (!studentsByParentId[student.parent_id]) {
                studentsByParentId[student.parent_id] = [];
              }
              studentsByParentId[student.parent_id].push(student);
            }
          });
          
          // Map all parents, add their students (may be empty)
          const parentsWithStudents = parents.map(parent => ({
            ...parent,
            linkedStudents: studentsByParentId[parent.id] || []
          }));
          setParentStudentList(parentsWithStudents);
          setFilteredParentList(parentsWithStudents);
          setAllStudents(uniqueStudents);
          
          // Initialize UserContext with all users' photos for real-time updates
          if (parents.length > 0 || uniqueStudents.length > 0) {
            console.log('Initializing photos in ViewLinkedStudent:', {
              parentCount: parents.length,
              studentCount: uniqueStudents.length
            });
            initializeAllUsersPhotos({
              Parent: parents,
              Student: uniqueStudents
            });
          }
        } else {
          setError("No data found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchLinked();
  }, []);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParentList(parentStudentList);
    } else {
      const filtered = parentStudentList.filter(parent =>
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (parent.contactNo && parent.contactNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParentList(filtered);
    }
  }, [searchTerm, parentStudentList]);

  // Filter available students (no parent_id)
  const availableStudents = allStudents.filter(
    s => !s.parent_id || s.parent_id === '' || s.parent_id === null
  ).filter(s => s.name && s.name.toLowerCase().includes(search.toLowerCase()));

  const handleBack = () => {
    router.push("/SuperAdminSection/Users");
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Handler for linking student to parent
  const handleLinkStudent = async () => {
    if (!selectedStudent || !modalParent) return;
    try {
      const res = await fetch("http://localhost/capstone-project/backend/Users/link_student_to_parent.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          parent_id: modalParent.id,
          parent_profile_id: modalParent.parent_profile_id
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        // Refresh the parent/student list to update class name
        setIsModalOpen(false);
        toast.success("Student successfully linked to parent!");
        // Re-fetch all users to update UI
        try {
          const res = await fetch("http://localhost/capstone-project/backend/Users/get_all_users.php");
          const data = await res.json();
          
          // Fetch archived users
          const archivedRes = await fetch("http://localhost/capstone-project/backend/Users/get_archived_users.php");
          const archivedData = await archivedRes.json();
          
          if (data.status === "success" && data.users) {
            const parents = data.users.Parent || [];
            const activeStudents = data.users.Student || [];
            const archivedStudents = archivedData.status === "success" ? (archivedData.users.Student || []) : [];
            
            // Combine active and archived students and remove duplicates
            const allStudents = [...activeStudents, ...archivedStudents];
            
            // Remove duplicates based on student ID
            const uniqueStudents = allStudents.filter((student, index, self) => 
              index === self.findIndex(s => s.id === student.id)
            );
            
            // Create a map of students by parentId for quick lookup
            const studentsByParentId = {};
            uniqueStudents.forEach(student => {
               if (student.parent_id) {
                 if (!studentsByParentId[student.parent_id]) {
                   studentsByParentId[student.parent_id] = [];
                 }
                 studentsByParentId[student.parent_id].push(student);
               }
             });
            // Map all parents, add their students (may be empty)
            const parentsWithStudents = parents.map(parent => ({
              ...parent,
              linkedStudents: studentsByParentId[parent.id] || []
            }));
            setParentStudentList(parentsWithStudents);
            setFilteredParentList(parentsWithStudents);
            setAllStudents(uniqueStudents);
          }
        } catch (err) {
          // fallback: just close modal and show toast
        }
        setSelectedStudent(null);
        setModalParent(null);
      } else {
        toast.error(data.message || "Failed to link student.");
      }
    } catch (err) {
      toast.error("Failed to link student.");
    }
  };

  // Handler for remove/unlink icon click
  const handleRemoveStudent = (student) => {
    setStudentToRemove(student);
    setShowRemoveModal(true);
  };

  // Confirm unlink student
  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    setRemoving(true);
    try {
      const res = await fetch('http://localhost/capstone-project/backend/Users/unlink_student_from_parent.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentToRemove.id
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setShowRemoveModal(false);
        toast.success("Student successfully unlinked from parent!");
        // Refresh parent/student list
        try {
          const res = await fetch("http://localhost/capstone-project/backend/Users/get_all_users.php");
          const data = await res.json();
          
          // Fetch archived users
          const archivedRes = await fetch("http://localhost/capstone-project/backend/Users/get_archived_users.php");
          const archivedData = await archivedRes.json();
          
          if (data.status === "success" && data.users) {
            const parents = data.users.Parent || [];
            const activeStudents = data.users.Student || [];
            const archivedStudents = archivedData.status === "success" ? (archivedData.users.Student || []) : [];
            
            // Combine active and archived students
            const allStudents = [...activeStudents, ...archivedStudents];
            
            // Remove duplicates based on student ID
            const uniqueStudents = allStudents.filter((student, index, self) => 
              index === self.findIndex(s => s.id === student.id)
            );
            
            const studentsByParentId = {};
            uniqueStudents.forEach(student => {
               if (student.parent_id) {
                 if (!studentsByParentId[student.parent_id]) {
                   studentsByParentId[student.parent_id] = [];
                 }
                 studentsByParentId[student.parent_id].push(student);
               }
             });
            const parentsWithStudents = parents.map(parent => ({
              ...parent,
              linkedStudents: studentsByParentId[parent.id] || []
            }));
            setParentStudentList(parentsWithStudents);
            setFilteredParentList(parentsWithStudents);
            setAllStudents(uniqueStudents);
          }
        } catch (err) {}
        setStudentToRemove(null);
      } else {
        toast.error(data.message || 'Failed to remove student.');
      }
    } catch (err) {
      toast.error('Failed to remove student.');
    }
    setRemoving(false);
  };

  // Split parents into those with and without linked students
  const parentsWithLinked = filteredParentList.filter(p => p.linkedStudents && p.linkedStudents.length > 0);
  const parentsWithoutLinked = filteredParentList.filter(p => !p.linkedStudents || p.linkedStudents.length === 0);

  // Further split parents with linked students based on student status
  const parentsWithActiveStudents = parentsWithLinked.filter(p => p.linkedStudents.some(student => student.schoolStatus === 'Active'));
  const parentsWithOnlyInactiveStudents = parentsWithLinked.filter(p => p.linkedStudents.every(student => student.schoolStatus !== 'Active'));

  // Sort parents with active students based on student status priority
  const sortedParentsWithActiveStudents = parentsWithActiveStudents.sort((a, b) => {
    // Check if parent has only inactive students
    const aHasOnlyInactiveStudents = a.linkedStudents.every(student => student.schoolStatus !== 'Active');
    const bHasOnlyInactiveStudents = b.linkedStudents.every(student => student.schoolStatus !== 'Active');
    
    // Priority 1: Parents with only inactive students come last
    if (aHasOnlyInactiveStudents && !bHasOnlyInactiveStudents) return 1;
    if (!aHasOnlyInactiveStudents && bHasOnlyInactiveStudents) return -1;
    
    // Priority 2: If both have same status priority, sort alphabetically by last name
    const lastA = (formatName(a.name).split(',')[0] || '').toLowerCase();
    const lastB = (formatName(b.name).split(',')[0] || '').toLowerCase();
    return lastA.localeCompare(lastB);
  });

  // Sort parents with only inactive students alphabetically by last name
  const sortedParentsWithOnlyInactiveStudents = parentsWithOnlyInactiveStudents.sort((a, b) => {
    const lastA = (formatName(a.name).split(',')[0] || '').toLowerCase();
    const lastB = (formatName(b.name).split(',')[0] || '').toLowerCase();
    return lastA.localeCompare(lastB);
  });

  // Sort parents without linked students alphabetically by last name
  const sortedParentsWithoutLinked = parentsWithoutLinked.sort((a, b) => {
    const lastA = (formatName(a.name).split(',')[0] || '').toLowerCase();
    const lastB = (formatName(b.name).split(',')[0] || '').toLowerCase();
    return lastA.localeCompare(lastB);
  });

  // Sort students within each parent alphabetically by last name
  const sortStudentsAlphabetically = (students) => {
    return students.sort((a, b) => {
      const lastA = (formatName(a.name).split(',')[0] || '').toLowerCase();
      const lastB = (formatName(b.name).split(',')[0] || '').toLowerCase();
      return lastA.localeCompare(lastB);
    });
  };

  const handleViewStudent = (student) => {
    console.log('handleViewStudent called with:', student);
    console.log('Navigating to student profile:', `/SuperAdminSection/Users/ViewUser?id=${student.id}&role=Student`);
    router.push(`/SuperAdminSection/Users/ViewUser?id=${student.id}&role=Student`);
  };

  // Toggle collapsed state for parent cards
  const toggleParentCollapse = (parentId) => {
    setCollapsedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parentViewDropdownOpen && !event.target.closest('.parent-view-dropdown')) {
        setParentViewDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [parentViewDropdownOpen]);

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

  if (loading) {
    return (
      <ProtectedRoute role="Super Admin">
        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading linked students data...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
        </div>
      </ProtectedRoute>
    );
  }

       return (
    <ProtectedRoute role="Super Admin">
        {/* Combined Header and Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-0 flex-shrink-0 z-10 fixed top-0 left-64 right-0">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Users</span>
            </button>
            <h2 className="text-lg font-bold text-gray-900">Linked Students Management</h2>
          </div>

          {/* Search and Filter Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search parents by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors caret-[#232c67]"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1 bg-[#e8ecf7] rounded-full">
                <FaUsers className="text-[#232c67] text-sm" />
                <span className="text-sm font-medium text-[#232c67]">
                  {filteredParentList.length} {filteredParentList.length === 1 ? 'Parent' : 'Parents'}
                </span>
              </div>
              
              <div className="relative parent-view-dropdown">
                <button
                  type="button"
                  onClick={() => setParentViewDropdownOpen(!parentViewDropdownOpen)}
                  className="flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md min-w-[200px]"
                >
                  <span>
                    {parentView === 'linked' ? 'Parents with Linked Students' : parentView === 'unlinked' ? 'Parents with No Linked Students' : 'Parents with Only Inactive Students'}
                  </span>
                  <FaChevronDown className={`text-xs transition-transform ml-2 ${parentViewDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {parentViewDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                    <div className="py-1">
                      {[
                        { value: 'linked', label: 'Parents with Linked Students' },
                        { value: 'unlinked', label: 'Parents with No Linked Students' },
                        { value: 'inactive-only', label: 'Parents with Only Inactive Students' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setParentView(option.value);
                            setParentViewDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 transition-colors text-sm ${
                            parentView === option.value 
                              ? 'bg-[#e8ecf7] text-[#232c67]' 
                              : 'text-gray-700 hover:bg-[#f0f3fa]'
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="text-sm text-gray-600 mb-1">
              Found {filteredParentList.length} parent{filteredParentList.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
        </div>

        {error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-shrink-0 mt-32">
            <div className="flex flex-col justify-center items-center h-48 text-center">
              <p className="text-red-600 mb-4 text-lg font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[#232c67] text-white px-6 py-2 rounded-lg hover:bg-[#1a1f4d] transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-32 h-[550px] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-1">
            {filteredParentList.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="flex flex-col justify-center items-center text-center">
                  <FaUsers className="text-4xl text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-500">No parents found</p>
                  <p className="text-sm text-gray-400 mt-2">Parents will appear here once they are added to the system.</p>
                </div>
              </div>
            ) : (
              <>
                                 {parentView === 'linked' ? (
                   sortedParentsWithActiveStudents.length === 0 ? (
                     <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                       <div className="flex flex-col justify-center items-center text-center">
                         <FaUsers className="text-4xl text-gray-300 mb-4" />
                         <p className="text-lg font-medium text-gray-500">No parents with active students found</p>
                       </div>
                     </div>
                   ) : (
                                           sortedParentsWithActiveStudents.map((parent) => {
                      const hasOnlyInactiveStudents = parent.linkedStudents.every(student => student.schoolStatus !== 'Active');
                      const isCollapsed = collapsedParents.has(parent.id);
                      
                      return (
                       <div key={parent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/SuperAdminSection/Users/ViewUser?id=${parent.id}&role=Parent`)}>
                        {/* Parent Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              // Get real-time photo from UserContext, fallback to parent.photo if not available
                              const realTimePhoto = getUserPhoto(parent.id) || parent.photo;
                              
                              if (realTimePhoto) {
                                return (
                                  <>
                                    <img
                                      src={realTimePhoto}
                                      alt="Profile"
                                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    {/* Fallback icon that shows when photo fails to load */}
                                    <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm hidden">
                                      <FaUser />
                                    </div>
                                  </>
                                );
                              } else {
                                return (
                                  <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm">
                                    <FaUser />
                                  </div>
                                );
                              }
                            })()}
                            <div>
                              <div className="font-semibold text-gray-900">{formatName(parent.name)}</div>
                              <div className="text-sm text-gray-600">{parent.email}</div>
                              {parent.contactNo && (
                                <div className="text-sm text-gray-600">{formatPhoneForDisplay(parent.contactNo)}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 shadow-sm text-sm"
                              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setModalParent(parent); setSearch(""); setSelectedStudent(null); }}
                            >
                              <FaUsers className="text-sm" />
                              Link Student
                            </button>
                          </div>
                        </div>

                        {/* Linked Students */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FaUsers className="text-green-600 text-sm" />
                            <span className="text-sm font-semibold text-gray-700">
                              {parent.linkedStudents.length === 1 ? 'Child (1)' : `Children (${parent.linkedStudents.length})`}
                            </span>
                          </div>
                          
                          {/* Show students only if not collapsed (for parents with only inactive students) */}
                          {(!hasOnlyInactiveStudents || !isCollapsed) && (
                            <div className={`${parent.linkedStudents.length > 1 ? 'max-h-24 overflow-y-auto' : ''}`}>
                              <div className="space-y-2">
                                {sortStudentsAlphabetically([...parent.linkedStudents]).map((student, index) => (
                                  <div key={`${student.id}-${student.schoolStatus}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewStudent(student); }}>
                                    <div 
                                      className="flex items-center gap-3 flex-1"
                                    >
                                      {(() => {
                                        // Get real-time photo from UserContext, fallback to student.photo if not available
                                        const realTimePhoto = getStudentPhoto(student.id) || student.photo;
                                        
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
                                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm hidden">
                                                <FaUser />
                                              </div>
                                            </>
                                          );
                                        } else {
                                          return (
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm">
                                              <FaUser />
                                            </div>
                                          );
                                        }
                                      })()}
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{formatName(student.name)}</div>
                                        <div className="text-sm text-gray-500">
                                          {student.levelName && `${student.levelName} • `}
                                          {student.scheduleClass && `${student.scheduleClass} • `}
                                          {student.gender}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <button
                                        className="text-red-500 hover:text-red-700 focus:outline-none p-1"
                                        title="Unlink Student"
                                        onClick={e => { e.stopPropagation(); handleRemoveStudent(student); }}
                                      >
                                        <FaTimesCircle className="text-lg" />
                                      </button>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        student.schoolStatus === 'Active' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {student.schoolStatus}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show collapsed message for parents with only inactive students */}
                          {hasOnlyInactiveStudents && isCollapsed && (
                            <div className="text-sm text-gray-500 italic">
                              Students hidden (click "Show" to expand)
                            </div>
                          )}
                        </div>
                      </div>
                    )})
                  )
                                 ) : parentView === 'inactive-only' ? (
                   sortedParentsWithOnlyInactiveStudents.length === 0 ? (
                     <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                       <div className="flex flex-col justify-center items-center text-center">
                         <FaUsers className="text-4xl text-gray-300 mb-4" />
                         <p className="text-lg font-medium text-gray-500">No parents with only inactive students found</p>
                       </div>
                     </div>
                   ) : (
                     sortedParentsWithOnlyInactiveStudents.map((parent) => {
                       const isCollapsed = collapsedParents.has(parent.id);
                       
                       return (
                         <div key={parent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/SuperAdminSection/Users/ViewUser?id=${parent.id}&role=Parent`)}>
                          {/* Parent Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {(() => {
                                // Get real-time photo from UserContext, fallback to parent.photo if not available
                                const realTimePhoto = getUserPhoto(parent.id) || parent.photo;
                                
                                if (realTimePhoto) {
                                  return (
                                    <>
                                      <img
                                        src={realTimePhoto}
                                        alt="Profile"
                                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      {/* Fallback icon that shows when photo fails to load */}
                                      <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm hidden">
                                        <FaUser />
                                      </div>
                                    </>
                                  );
                                } else {
                                  return (
                                    <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm">
                                      <FaUser />
                                    </div>
                                  );
                                }
                              })()}
                              <div>
                                <div className="font-semibold text-gray-900">{formatName(parent.name)}</div>
                                <div className="text-sm text-gray-600">{parent.email}</div>
                                {parent.contactNo && (
                                  <div className="text-sm text-gray-600">{formatPhoneForDisplay(parent.contactNo)}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 shadow-sm text-sm"
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setModalParent(parent); setSearch(""); setSelectedStudent(null); }}
                              >
                                <FaUsers className="text-sm" />
                                Link Student
                              </button>
                            </div>
                          </div>

                          {/* Linked Students */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FaUsers className="text-orange-600 text-sm" />
                              <span className="text-sm font-semibold text-gray-700">
                                {parent.linkedStudents.length === 1 ? 'Child (1)' : `Children (${parent.linkedStudents.length})`}
                              </span>
                            
                            </div>
                            
                            {/* Show students only if not collapsed */}
                            {!isCollapsed && (
                              <div className={`${parent.linkedStudents.length > 1 ? 'max-h-24 overflow-y-auto' : ''}`}>
                                <div className="space-y-2">
                                  {sortStudentsAlphabetically([...parent.linkedStudents]).map((student, index) => (
                                    <div key={`${student.id}-${student.schoolStatus}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewStudent(student); }}>
                                     <div 
                                       className="flex items-center gap-3 flex-1"
                                     >
                                        {(() => {
                                          // Get real-time photo from UserContext, fallback to student.photo if not available
                                          const realTimePhoto = getStudentPhoto(student.id) || student.photo;
                                          
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
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm hidden">
                                                  <FaUser />
                                                </div>
                                              </>
                                            );
                                          } else {
                                            return (
                                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm">
                                                <FaUser />
                                              </div>
                                            );
                                          }
                                        })()}
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900">{formatName(student.name)}</div>
                                          <div className="text-sm text-gray-500">
                                            {student.levelName && `${student.levelName} • `}
                                            {student.scheduleClass && `${student.scheduleClass} • `}
                                            {student.gender}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <button
                                          className="text-red-500 hover:text-red-700 focus:outline-none p-1"
                                          title="Unlink Student"
                                          onClick={e => { e.stopPropagation(); handleRemoveStudent(student); }}
                                        >
                                          <FaTimesCircle className="text-lg" />
                                        </button>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          student.schoolStatus === 'Active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {student.schoolStatus}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Show collapsed message */}
                            {isCollapsed && (
                              <div className="text-sm text-gray-500 italic">
                                Students hidden (click "Show" to expand)
                              </div>
                            )}
                          </div>
                        </div>
                      )})
                    )
                                 ) : (
                   sortedParentsWithoutLinked.length === 0 ? (
                     <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                       <div className="flex flex-col justify-center items-center text-center">
                         <FaUsers className="text-4xl text-gray-300 mb-4" />
                         <p className="text-lg font-medium text-gray-500">All parents have linked students</p>
                       </div>
                     </div>
                   ) : (
                                           sortedParentsWithoutLinked.map((parent) => (
                       <div key={parent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/SuperAdminSection/Users/ViewUser?id=${parent.id}&role=Parent`)}>
                        {/* Parent Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              // Get real-time photo from UserContext, fallback to parent.photo if not available
                              const realTimePhoto = getUserPhoto(parent.id) || parent.photo;
                              
                              if (realTimePhoto) {
                                return (
                                  <>
                                    <img
                                      src={realTimePhoto}
                                      alt="Profile"
                                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    {/* Fallback icon that shows when photo fails to load */}
                                    <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm hidden">
                                      <FaUser />
                                    </div>
                                  </>
                                );
                              } else {
                                return (
                                  <div className="w-12 h-12 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-lg shadow-sm">
                                    <FaUser />
                                  </div>
                                );
                              }
                            })()}
                            <div>
                              <div className="font-semibold text-gray-900">{formatName(parent.name)}</div>
                              <div className="text-sm text-gray-600">{parent.email}</div>
                              {parent.contactNo && (
                                <div className="text-sm text-gray-600">{formatPhoneForDisplay(parent.contactNo)}</div>
                              )}
                            </div>
                          </div>
                          <button
                            className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 shadow-sm text-sm"
                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setModalParent(parent); setSearch(""); setSelectedStudent(null); }}
                          >
                            <FaUsers className="text-sm" />
                            Link Student
                          </button>
                        </div>

                        {/* No students message */}
                        <div className="flex flex-col justify-center items-center text-center py-8">
                          <FaUsers className="text-4xl text-gray-300 mb-2" />
                          <p className="text-gray-500">No students linked to this parent</p>
                        </div>
                      </div>
                    ))
                  )
                )}
              </>
            )}

            {/* Modal for Link to Student */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Link Student to Parent</h3>
                    <p className="text-gray-600 text-sm">Select a student to link to {formatName(modalParent?.name)}</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors caret-[#232c67]"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {availableStudents.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-32 text-center">
                        <FaUsers className="text-4xl text-gray-300 mb-2" />
                        <p className="text-gray-500">No available students to link</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {availableStudents.map((student, idx) => (
                          <div
                            key={student.id || idx}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                              selectedStudent === student ? 'bg-[#e8ecf7]' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedStudent(student)}
                          >
                            {(() => {
                              // Get real-time photo from UserContext, fallback to student.photo if not available
                              const realTimePhoto = getStudentPhoto(student.id) || student.photo;
                              
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
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm hidden">
                                      <FaUser />
                                    </div>
                                  </>
                                );
                              } else {
                                return (
                                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm">
                                    <FaUser />
                                  </div>
                                );
                              }
                            })()}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{formatName(student.name)}</div>
                              <div className="text-sm text-gray-500">
                                {student.levelName && `${student.levelName} • `}
                                {student.scheduleClass && `${student.scheduleClass} • `}
                                {student.gender}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                    <button 
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                      onClick={() => setIsModalOpen(false)} 
                    >
                      <FaTimes className="text-sm" />
                      Close
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                        !selectedStudent
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                          : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                      }`}
                      disabled={!selectedStudent}
                      onClick={handleLinkStudent}
                    >
                      <FaUsers className="text-sm" />
                      Link Student
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Remove Confirmation Modal */}
            {showRemoveModal && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Remove Linked Student</h3>
                    <p className="text-gray-600 text-sm">Are you sure you want to unlink this student?</p>
                  </div>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {(() => {
                        // Get real-time photo from UserContext, fallback to student.photo if not available
                        const realTimePhoto = getStudentPhoto(studentToRemove?.id) || studentToRemove?.photo;
                        
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
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm hidden">
                                <FaUser />
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm">
                              <FaUser />
                            </div>
                          );
                        }
                      })()}
                      <div>
                        <div className="font-medium text-gray-900">{formatName(studentToRemove?.name)}</div>
                        <div className="text-sm text-gray-500">Student will be unlinked from parent</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button 
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                      onClick={() => { setShowRemoveModal(false); setStudentToRemove(null); }} 
                      disabled={removing}
                    >
                      <FaTimes className="text-sm" />
                      Close
                    </button>
                    <button 
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                        removing
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                          : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
                      }`}
                      disabled={removing}
                      onClick={confirmRemoveStudent}
                    >
                      {removing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Removing...
                        </div>
                      ) : (
                        <>
                          <FaTimesCircle className="text-sm" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
    </ProtectedRoute>
  );
}
