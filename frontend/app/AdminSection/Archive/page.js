"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaEye, FaUsers, FaArchive, FaFilter, FaSort, FaSortUp, FaSortDown, FaChild, FaUserTie, FaUser, FaCheckSquare, FaSquare, FaChevronDown } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../Context/UserContext";
import { API } from '@/config/api';

export default function AdminArchivePage() {
  const [archivedUsers, setArchivedUsers] = useState({
    Admin: [],
    Teacher: [],
    Parent: [],
    Student: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Teacher");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const searchParams = useSearchParams();
  const { getUserPhoto, getStudentPhoto, initializeAllUsersPhotos, normalizePhotoUrl, updateAnyUserPhoto } = useUser();
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false);
  const [bulkStatusMode, setBulkStatusMode] = useState("Archive"); // "Archive" or "Restore"
  const [selectedParents, setSelectedParents] = useState([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [activeParentsForBulkArchive, setActiveParentsForBulkArchive] = useState([]);
  const [archivedParentsForRestore, setArchivedParentsForRestore] = useState([]);
  const [loadingActiveParents, setLoadingActiveParents] = useState(false);
  const [selectedClassLevel, setSelectedClassLevel] = useState("All");
  const [filteredParentsForBulkArchive, setFilteredParentsForBulkArchive] = useState([]);
  const [isClassLevelOpen, setIsClassLevelOpen] = useState(false);

 
  // Format phone number for display: +63 918 123 4567 (3-3-4)
  function formatPhoneForDisplay(phoneNumber) {
    if (!phoneNumber) return "";
    const digits = phoneNumber.replace(/\D/g, "");
    let cleanDigits = "";
    if (digits.startsWith("009")) {
      cleanDigits = digits.substring(3);
    } else if (digits.startsWith("09")) {
      cleanDigits = digits.substring(1);
    } else if (digits.startsWith("9")) {
      cleanDigits = digits;
    } else {
      cleanDigits = digits;
    }
    if (cleanDigits.length === 10 && cleanDigits.startsWith("9")) {
      return `+63 ${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3, 6)} ${cleanDigits.substring(6)}`;
    } else if (cleanDigits.length > 0) {
      return `+63 ${cleanDigits}`;
    }
    return "";
  }

  // Fetch archived users on component mount and when refresh parameter is present
  useEffect(() => {
    fetchArchivedUsers();
    
    // Check if we need to refresh data (e.g., after restore)
    const refresh = searchParams.get('refresh');
    if (refresh === 'true') {
      // Remove the refresh parameter from URL
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('refresh');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

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

  const fetchArchivedUsers = async () => {
    try {
      const response = await fetch(API.user.getArchivedUsers(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        setArchivedUsers(data.users);
        
        // Initialize UserContext with all archived users' photos for real-time updates
        if (data.users) {
          console.log('Initializing archived users photos:', {
            adminCount: data.users.Admin?.length || 0,
            teacherCount: data.users.Teacher?.length || 0,
            parentCount: data.users.Parent?.length || 0,
            studentCount: data.users.Student?.length || 0
          });
          
          // Debug: Log sample photo data
          if (data.users.Admin?.length > 0) {
            console.log('Sample Admin photo data:', data.users.Admin[0]);
          }
          if (data.users.Teacher?.length > 0) {
            console.log('Sample Teacher photo data:', data.users.Teacher[0]);
          }
          if (data.users.Parent?.length > 0) {
            console.log('Sample Parent photo data:', data.users.Parent[0]);
          }
          if (data.users.Student?.length > 0) {
            console.log('Sample Student photo data:', data.users.Student[0]);
          }
          
          initializeAllUsersPhotos(data.users);
        }
      } else {
        setError(data.message || "Failed to fetch archived users");
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError("Failed to fetch archived users");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId, role) => {
    router.push(`/AdminSection/Users/ViewUser?id=${userId}&role=${role}`);
  };

  // Sorting function
  const handleSort = (field) => {
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

  // Filter function for search
  const filterUsers = (users) => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.contactNo && user.contactNo.includes(searchTerm))
    );
  };

  // Separate staff and parent users
  const staffOnlyUsers = [
    // Admins are hidden from Admin view
    ...archivedUsers.Teacher.map(user => ({ ...user, role: 'Teacher' }))
  ];
  const parentOnlyUsers = archivedUsers.Parent.map(user => ({ ...user, role: 'Parent' }));

  const filteredStaffOnlyUsers = filterUsers(staffOnlyUsers);
  const filteredParentOnlyUsers = filterUsers(parentOnlyUsers);
  const filteredStudents = filterUsers(archivedUsers.Student);

  // Sort filtered users
  function buildSortableName(user) {
    const last = (user.lastName || user.last_name || "").toString().trim();
    const first = (user.firstName || user.first_name || "").toString().trim();
    const middle = (user.middleName || user.middle_name || "").toString().trim();
    if (last || first || middle) {
      return `${last}|${first}|${middle}`.toLowerCase();
    }
    const raw = (user.name || "").toString().trim();
    if (!raw) return "";
    const str = raw.toLowerCase();
    if (str.includes(',')) {
      const [ln, rest] = str.split(',');
      return `${ln.trim()}|${(rest || '').trim()}`;
    }
    const parts = str.split(/\s+/);
    if (parts.length >= 2) {
      const ln = parts[parts.length - 1];
      const fn = parts.slice(0, parts.length - 1).join(' ');
      return `${ln}|${fn}`;
    }
    return str;
  }

  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case "name":
          aValue = buildSortableName(a);
          bValue = buildSortableName(b);
          break;
        case "role":
          aValue = (a.role || "").toLowerCase();
          bValue = (b.role || "").toLowerCase();
          break;
        case "email":
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
        case "contact":
          aValue = (a.contactNo || "").toLowerCase();
          bValue = (b.contactNo || "").toLowerCase();
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
          aValue = buildSortableName(a);
          bValue = buildSortableName(b);
      }
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  };

  const sortedStaffUsers = sortUsers(filteredStaffOnlyUsers);
  const sortedParentUsers = sortUsers(filteredParentOnlyUsers);
  const sortedStudentUsers = sortUsers(filteredStudents);

  // Show 5 users initially, rest will be scrollable
  const paginatedStaff = sortedStaffUsers;
  const paginatedParents = sortedParentUsers;
  const paginatedStudents = sortedStudentUsers;

  // Bulk Archive Handlers (Admin)
  const handleToggleParentSelection = (parentId) => {
    setSelectedParents(prev => {
      if (prev.includes(parentId)) {
        return prev.filter(id => id !== parentId);
      } else {
        return [...prev, parentId];
      }
    });
  };

  const handleSelectAllParents = () => {
    const parentsToSelect = filteredParentsForBulkArchive;
    if (parentsToSelect.length === 0) return;
    const allDisplayedSelected = parentsToSelect.every(p => selectedParents.includes(p.id));
    if (allDisplayedSelected) {
      const displayedIds = parentsToSelect.map(p => p.id);
      setSelectedParents(prev => prev.filter(id => !displayedIds.includes(id)));
    } else {
      const displayedIds = parentsToSelect.map(p => p.id);
      setSelectedParents(prev => {
        const newSelection = [...prev];
        displayedIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleBulkArchive = async () => {
    const parentsToArchive = selectedParents.filter(id => 
      filteredParentsForBulkArchive.some(p => p.id === id)
    );
    if (parentsToArchive.length === 0) {
      return;
    }
    setBulkArchiving(true);
    try {
      const editorId = localStorage.getItem("userId");
      const response = await fetch(API.user.bulkArchiveParents(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_ids: parentsToArchive, editor_id: editorId }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setShowBulkArchiveModal(false);
        setSelectedParents([]);
        fetchArchivedUsers();
      }
    } catch (err) {
      console.error('Bulk archive error:', err);
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleBulkRestore = async () => {
    const parentsToRestore = selectedParents.filter(id => 
      filteredParentsForBulkArchive.some(p => p.id === id)
    );
    if (parentsToRestore.length === 0) {
      return;
    }
    setBulkArchiving(true);
    try {
      const editorId = localStorage.getItem("userId");
      const response = await fetch(API.user.bulkRestoreParents(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_ids: parentsToRestore, editor_id: editorId }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setShowBulkArchiveModal(false);
        setSelectedParents([]);
        fetchArchivedUsers();
      }
    } catch (err) {
      console.error('Bulk restore error:', err);
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleCloseBulkArchiveModal = () => {
    setShowBulkArchiveModal(false);
    setSelectedParents([]);
    setActiveParentsForBulkArchive([]);
    setArchivedParentsForRestore([]);
    setBulkStatusMode("Archive");
    setSelectedClassLevel("All");
  };

  // Fetch parents when modal opens
  useEffect(() => {
    if (showBulkArchiveModal) {
      if (bulkStatusMode === "Archive") {
        fetchActiveParents();
      } else if (bulkStatusMode === "Restore") {
        fetchArchivedParentsForRestore();
      }
    }
  }, [showBulkArchiveModal, bulkStatusMode]);

  const fetchArchivedParentsForRestore = async () => {
    setLoadingActiveParents(true);
    try {
      const response = await fetch(API.user.getArchivedUsers(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.status === "success" && data.users && data.users.Parent) {
        const archivedParents = data.users.Parent || [];
        const archivedStudents = data.users.Student || [];
        const studentsByParent = {};
        archivedStudents.forEach(student => {
          const parentId = student.parent_id || student.parentId;
          if (parentId) {
            if (!studentsByParent[parentId]) studentsByParent[parentId] = [];
            studentsByParent[parentId].push(student);
          }
        });
        const parentsWithLevels = archivedParents.map(parent => {
          const parentStudents = studentsByParent[parent.id] || [];
          const levelIds = [...new Set(
            parentStudents
              .map(s => s.levelId || s.level_id)
              .filter(id => id !== null && id !== undefined && id !== '')
          )];
        const levelNames = levelIds.map(levelId => {
          const numLevelId = parseInt(levelId);
          switch(numLevelId) {
            case 1: return 'Discoverer';
            case 2: return 'Explorer';
            case 3: return 'Adventurer';
            default: return `Level ${numLevelId}`;
          }
        });
        return {
          ...parent,
          studentLevelIds: levelIds.map(id => parseInt(id)),
          studentLevelNames: levelNames,
          hasStudents: parentStudents.length > 0,
          studentCount: parentStudents.length
        };
        });
        if (parentsWithLevels.length > 0) {
          parentsWithLevels.forEach(parent => {
            if (parent.photo && normalizePhotoUrl && updateAnyUserPhoto) {
              const photoUrl = normalizePhotoUrl(parent.photo);
              if (photoUrl) updateAnyUserPhoto(parent.id, photoUrl);
            }
          });
        }
        setArchivedParentsForRestore(parentsWithLevels);
        setSelectedParents([]);
        setSelectedClassLevel("All");
      } else {
        setArchivedParentsForRestore([]);
        setFilteredParentsForBulkArchive([]);
      }
    } catch (err) {
      console.error('Error fetching archived parents:', err);
      setArchivedParentsForRestore([]);
      setFilteredParentsForBulkArchive([]);
    } finally {
      setLoadingActiveParents(false);
    }
  };

  const fetchActiveParents = async () => {
    setLoadingActiveParents(true);
    try {
      const response = await fetch(API.user.getAllUsers(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.status === "success" && data.users) {
        const parents = data.users.Parent || [];
        const students = data.users.Student || [];
        const studentsByParent = {};
        students.forEach(student => {
          const parentId = student.parent_id || student.parentId;
          if (parentId) {
            if (!studentsByParent[parentId]) studentsByParent[parentId] = [];
            studentsByParent[parentId].push(student);
          }
        });
        const parentsWithLevels = parents.map(parent => {
          const parentStudents = studentsByParent[parent.id] || [];
          const levelIds = [...new Set(
            parentStudents
              .map(s => {
                let levelId = s.levelId;
                if (levelId !== null && levelId !== undefined && levelId !== '') return parseInt(levelId);
                if (s.level_id !== null && s.level_id !== undefined && s.level_id !== '') return parseInt(s.level_id);
                return null;
              })
              .filter(id => id !== null)
          )];
          const levelNames = levelIds.map(levelId => {
            const numLevelId = parseInt(levelId);
            switch(numLevelId) {
              case 1: return 'Discoverer';
              case 2: return 'Explorer';
              case 3: return 'Adventurer';
              default: return `Level ${numLevelId}`;
            }
          });
          return {
            ...parent,
            studentLevelIds: levelIds.map(id => parseInt(id)),
            studentLevelNames: levelNames,
            hasStudents: parentStudents.length > 0,
            studentCount: parentStudents.length
          };
        });
        if (parentsWithLevels.length > 0) {
          parentsWithLevels.forEach(parent => {
            if (parent.photo && normalizePhotoUrl && updateAnyUserPhoto) {
              const photoUrl = normalizePhotoUrl(parent.photo);
              if (photoUrl) updateAnyUserPhoto(parent.id, photoUrl);
            }
          });
        }
        setActiveParentsForBulkArchive(parentsWithLevels);
        setSelectedParents([]);
        setSelectedClassLevel("All");
      } else {
        setActiveParentsForBulkArchive([]);
        setFilteredParentsForBulkArchive([]);
      }
    } catch (err) {
      console.error('Error fetching active parents:', err);
      setActiveParentsForBulkArchive([]);
      setFilteredParentsForBulkArchive([]);
    } finally {
      setLoadingActiveParents(false);
    }
  };

  // Filter parents based on selected class level and mode
  useEffect(() => {
    const parentsToFilter = bulkStatusMode === "Archive" 
      ? activeParentsForBulkArchive 
      : archivedParentsForRestore;
    if (!parentsToFilter || parentsToFilter.length === 0) {
      setFilteredParentsForBulkArchive([]);
      return;
    }
    if (selectedClassLevel === "All") {
      setFilteredParentsForBulkArchive(parentsToFilter);
    } else {
      const levelIdMap = { "Discoverer": 1, "Explorer": 2, "Adventurer": 3 };
      const targetLevelId = levelIdMap[selectedClassLevel];
      if (!targetLevelId) {
        setFilteredParentsForBulkArchive(parentsToFilter);
        return;
      }
      const filtered = parentsToFilter.filter(parent => parent.studentLevelIds && parent.studentLevelIds.includes(targetLevelId));
      setFilteredParentsForBulkArchive(filtered);
    }
    setSelectedParents([]);
  }, [selectedClassLevel, activeParentsForBulkArchive, archivedParentsForRestore, bulkStatusMode]);

  if (loading) {
    return (
      <ProtectedRoute role="Admin">
        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">Loading archived users...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest records</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute role="Admin">
        <div className="flex flex-col justify-center items-center h-64 text-center px-6">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <FaArchive className="text-4xl text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-6 max-w-md">{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Admin">
      <div className="flex-1 p-4">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="px-5 py-2 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Teacher', icon: <FaUserTie className="text-sm" /> },
                { name: 'Parent', icon: <FaUsers className="text-sm" /> },
                { name: 'Student', icon: <FaChild className="text-sm" /> }
              ].map(tab => (
                <button
                  key={tab.name}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-medium border-2 transition-colors duration-150 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center sm:justify-start ${
                    activeTab === tab.name 
                      ? 'bg-[#232c67] text-white border-[#232c67]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    setActiveTab(tab.name);
                  }}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or contact number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full caret-[#232c67]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
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

              {/* Summary Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                  <FaArchive className="text-gray-600 text-sm" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Archived: {staffOnlyUsers.length + parentOnlyUsers.length + archivedUsers.Student.length}
                  </span>
                </div>
                {activeTab === 'Parent' && (
                  <button
                    onClick={() => {
                      setBulkStatusMode("Archive");
                      setShowBulkArchiveModal(true);
                    }}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <FaArchive className="text-sm" />
                    Bulk Parent Status
                  </button>
                )}
              </div>
            </div>
          </div>

        {/* Tab Content */}
        {activeTab === 'Teacher' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Archived Teachers
                  </h2>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Teacher: {staffOnlyUsers.length}</span>
                  </div>
                </div>
              </div>
              {paginatedStaff.length === 0 ? (
                 <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                     <FaUsers className="text-4xl text-gray-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
                     {searchTerm ? 'No Staff Match Your Search' : 'No Archived Staff'}
                   </h3>
                   <p className="text-gray-600 mb-6 max-w-md">
                     {searchTerm 
                       ? `No archived staff found matching "${searchTerm}".`
                       : "There are no archived staff members at the moment."
                     }
                   </p>
                   {searchTerm && (
                     <button
                       onClick={() => setSearchTerm("")}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       Clear Search
                     </button>
                   )}
               </div>
            ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[320px] overflow-y-auto custom-thin-scroll">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '8%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Full Name
                              {getSortIcon("name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("role")}
                          >
                            <div className="flex items-center gap-2">
                              User Type
                              {getSortIcon("role")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("email")}
                          >
                            <div className="flex items-center gap-2">Email {getSortIcon("email")}</div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("contact")}
                          >
                            <div className="flex items-center gap-2">
                              Contact Number
                              {getSortIcon("contact")}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedStaff.map((user) => (
                    <tr key={`${user.role}-${user.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            // Get real-time photo from UserContext, fallback to user.photo if not available
                            const realTimePhoto = getUserPhoto(user.id) || user.photo;
                            
                            if (realTimePhoto) {
                              return (
                                <>
                                  <img
                                    src={realTimePhoto}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  {/* Fallback icon that shows when photo fails to load */}
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hidden">
                                    <FaUser className="text-blue-600 text-sm" />
                                  </div>
                                </>
                              );
                            } else {
                              return (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FaUser className="text-blue-600 text-sm" />
                                </div>
                              );
                            }
                          })()}
                          <span className="font-medium text-gray-900 text-sm">
                            {user.lastName && user.firstName 
                              ? `${user.lastName}, ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                              : user.name || 'Not specified'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'Admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{user.email || "Not specified"}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.contactNo ? formatPhoneForDisplay(user.contactNo) : "Not specified"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewUser(user.id, user.role)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center p-2 rounded-lg hover:bg-blue-50 transition-colors mx-auto"
                          title="View Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
            </>
        )}

        {activeTab === 'Parent' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Archived Parents
                  </h2>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">Parent: {parentOnlyUsers.length}</span>
                  </div>
                </div>
              </div>
              {paginatedParents.length === 0 ? (
                 <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                     <FaUsers className="text-4xl text-gray-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
                     {searchTerm ? 'No Parents Match Your Search' : 'No Archived Parents'}
                   </h3>
                   <p className="text-gray-600 mb-6 max-w-md">
                     {searchTerm 
                       ? `No archived parents found matching "${searchTerm}".`
                       : "There are no archived parent accounts at the moment."
                     }
                   </p>
                   {searchTerm && (
                     <button
                       onClick={() => setSearchTerm("")}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       Clear Search
                     </button>
                   )}
               </div>
            ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[320px] overflow-y-auto custom-thin-scroll">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '40%' }} />
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '8%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Full Name
                              {getSortIcon("name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("email")}
                          >
                            <div className="flex items-center gap-2">Email {getSortIcon("email")}</div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("contact")}
                          >
                            <div className="flex items-center gap-2">
                              Contact Number
                              {getSortIcon("contact")}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedParents.map((user) => (
                    <tr key={`parent-${user.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            // Get real-time photo from UserContext, fallback to user.photo if not available
                            const realTimePhoto = getUserPhoto(user.id) || user.photo;
                            
                            if (realTimePhoto) {
                              return (
                                <>
                                  <img
                                    src={realTimePhoto}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  {/* Fallback icon that shows when photo fails to load */}
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hidden">
                                    <FaUser className="text-green-600 text-sm" />
                                  </div>
                                </>
                              );
                            } else {
                              return (
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FaUser className="text-green-600 text-sm" />
                                </div>
                              );
                            }
                          })()}
                          <span className="font-medium text-gray-900 text-sm">
                            {user.lastName && user.firstName 
                              ? `${user.lastName}, ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                              : user.name || 'Not specified'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{user.email || "Not specified"}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.contactNo ? formatPhoneForDisplay(user.contactNo) : "Not specified"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewUser(user.id, user.role)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center p-2 rounded-lg hover:bg-blue-50 transition-colors mx-auto"
                          title="View Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
            </>
        )}

        {activeTab === 'Student' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Archived Students
                  </h2>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Student: {archivedUsers.Student.length}</span>
                  </div>
                </div>
              </div>
              {paginatedStudents.length === 0 ? (
                 <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                     <FaUsers className="text-4xl text-gray-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
                     {searchTerm ? 'No Students Match Your Search' : 'No Archived Students'}
                   </h3>
                   <p className="text-gray-600 mb-6 max-w-md">
                     {searchTerm 
                       ? `No archived students found matching "${searchTerm}".`
                       : "There are no archived student accounts at the moment."
                     }
                   </p>
                   {searchTerm && (
                     <button
                       onClick={() => setSearchTerm("")}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       Clear Search
                     </button>
                   )}
               </div>
            ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[320px] overflow-y-auto custom-thin-scroll">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '8%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Full Name
                              {getSortIcon("name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("birthdate")}
                          >
                            <div className="flex items-center gap-2">
                              Birthdate
                              {getSortIcon("birthdate")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("gender")}
                          >
                            <div className="flex items-center gap-2">Gender {getSortIcon("gender")}</div>
                          </th>
                          <th className="px-6 py-4 font-semibold text-white text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                    <tr key={`student-${student.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            // Get real-time photo from UserContext, fallback to student.photo if not available
                            const realTimePhoto = getStudentPhoto(student.id) || student.photo;
                            
                            if (realTimePhoto) {
                              return (
                                <>
                                  <img
                                    src={realTimePhoto}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  {/* Fallback icon that shows when photo fails to load */}
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center hidden">
                                    <FaUser className="text-purple-600 text-sm" />
                                  </div>
                                </>
                              );
                            } else {
                              return (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FaUser className="text-purple-600 text-sm" />
                                </div>
                              );
                            }
                          })()}
                          <span className="font-medium text-gray-900 text-sm">
                            {student.lastName && student.firstName 
                              ? `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName}` : ''}`
                              : student.name || 'Not specified'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {student.birthdate ? new Date(student.birthdate).toLocaleDateString() : "Not specified"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.gender?.toLowerCase() === "male"
                            ? "bg-blue-100 text-blue-800"
                            : student.gender?.toLowerCase() === "female"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {student.gender || "Not specified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewUser(student.id, 'Student')}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center p-2 rounded-lg hover:bg-blue-50 transition-colors mx-auto"
                          title="View Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
            </>
          )}
        </div>
      </div>
      {/* Bulk Parent Status Modal */}
      {showBulkArchiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6 w-full sm:w-[700px] sm:max-w-[90vw] h-[92vh] sm:h-[85vh] flex flex-col border border-gray-100">
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Bulk Parent Status</h3>
              <p className="text-gray-600 text-sm">
                {bulkStatusMode === "Archive" 
                  ? "Select active parents to archive. Their linked students will be automatically archived"
                  : "Select archived parents to restore. Their linked students will be automatically restored"}
              </p>
              <div className="mt-4 flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => { setBulkStatusMode("Archive"); setSelectedClassLevel("All"); setSelectedParents([]); }}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    bulkStatusMode === "Archive" ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Archive
                </button>
                <button
                  onClick={() => { setBulkStatusMode("Restore"); setSelectedClassLevel("All"); setSelectedParents([]); }}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    bulkStatusMode === "Restore" ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Restore
                </button>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class Level:</label>
                <div className="relative">
                  <select
                    value={selectedClassLevel}
                    onChange={(e) => setSelectedClassLevel(e.target.value)}
                    onFocus={() => setIsClassLevelOpen(true)}
                    onBlur={() => setIsClassLevelOpen(false)}
                    className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="All">All Levels</option>
                    <option value="Discoverer">Discoverer</option>
                    <option value="Explorer">Explorer</option>
                    <option value="Adventurer">Adventurer</option>
                  </select>
                  <FaChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-transform duration-200 ${isClassLevelOpen ? 'rotate-180' : 'rotate-0'}`} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden mb-4">
              {loadingActiveParents ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 text-sm">
                    {bulkStatusMode === "Archive" ? "Loading active parents..." : "Loading archived parents..."}
                  </p>
                </div>
              ) : filteredParentsForBulkArchive.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <FaUsers className="text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-600 text-sm font-medium">
                    {bulkStatusMode === "Archive" 
                      ? (selectedClassLevel === "All" ? "No active parents available" : `No parents found for ${selectedClassLevel} level`)
                      : (selectedClassLevel === "All" ? "No archived parents available" : `No archived parents found for ${selectedClassLevel} level`)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedClassLevel === "All" 
                      ? (bulkStatusMode === "Archive" ? "All parents are already archived" : "All parents are already active")
                      : "Try selecting a different class level"}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                    <button onClick={handleSelectAllParents} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                      {selectedParents.length === filteredParentsForBulkArchive.length && 
                       filteredParentsForBulkArchive.every(p => selectedParents.includes(p.id)) ? (
                        <FaCheckSquare className={bulkStatusMode === "Archive" ? "text-blue-600" : "text-green-600"} />
                      ) : (
                        <FaSquare className="text-gray-400" />
                      )}
                      <span>
                        {selectedParents.length === filteredParentsForBulkArchive.length && 
                         filteredParentsForBulkArchive.every(p => selectedParents.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </span>
                      <span className="text-gray-500">
                        ({selectedParents.filter(id => filteredParentsForBulkArchive.some(p => p.id === id)).length} of {filteredParentsForBulkArchive.length} selected)
                      </span>
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200 flex-1 overflow-y-auto custom-thin-scroll">
                    {filteredParentsForBulkArchive.map((parent) => {
                      const isSelected = selectedParents.includes(parent.id);
                      return (
                        <div key={`parent-${parent.id}`} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleToggleParentSelection(parent.id)}>
                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <FaCheckSquare className={`${bulkStatusMode === "Archive" ? "text-blue-600" : "text-green-600"} flex-shrink-0`} />
                            ) : (
                              <FaSquare className="text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {(() => {
                                const realTimePhoto = getUserPhoto(parent.id) || parent.photo;
                                return realTimePhoto ? (
                                  <>
                                    <img src={realTimePhoto} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) { e.target.nextSibling.style.display = 'flex'; } }} />
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hidden flex-shrink-0"></div>
                                  </>
                                ) : (
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"></div>
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{parent.lastName && parent.firstName ? `${parent.lastName}, ${parent.firstName}${parent.middleName ? ` ${parent.middleName}` : ''}` : parent.name || 'Not specified'}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{parent.email || "No email"}</div>
                                {parent.studentLevelNames && parent.studentLevelNames.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {parent.studentLevelNames.map((levelName, idx) => (
                                      <span key={idx} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        levelName === 'Discoverer' ? 'bg-blue-100 text-blue-800' :
                                        levelName === 'Explorer' ? 'bg-yellow-100 text-yellow-800' :
                                        levelName === 'Adventurer' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {levelName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
              <button onClick={handleCloseBulkArchiveModal} disabled={bulkArchiving} className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
              <button onClick={bulkStatusMode === "Archive" ? handleBulkArchive : handleBulkRestore} disabled={bulkArchiving || selectedParents.length === 0} className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${bulkStatusMode === "Archive" ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {bulkArchiving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {bulkStatusMode === "Archive" ? 'Archiving...' : 'Restoring...'}
                  </>
                ) : (
                  <>
                    <FaArchive className="text-sm" />
                    {bulkStatusMode === "Archive" 
                      ? `Archive Selected (${selectedParents.filter(id => filteredParentsForBulkArchive.some(p => p.id === id)).length})`
                      : `Restore Selected (${selectedParents.filter(id => filteredParentsForBulkArchive.some(p => p.id === id)).length})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

// Modal for Bulk Parent Status (Admin)