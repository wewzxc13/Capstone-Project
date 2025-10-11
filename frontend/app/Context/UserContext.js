"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API } from '@/config/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Important: Do NOT read localStorage during the initial render to avoid
  // server/client hydration mismatches. We initialize with empty values and
  // populate from localStorage within useEffect via refreshUser().
  const [userData, setUserData] = useState({
    fullName: "",
    role: "",
    userId: null,
    user_photo: ""
  });

  // Global state for all users' photos to enable real-time updates
  const [allUsersPhotos, setAllUsersPhotos] = useState(new Map());

  // Global state for unread message counts
  const [unreadCounts, setUnreadCounts] = useState({
    users: 0,
    groups: 0,
    total: 0
  });

  // Normalize any photo value to a usable URL
  // - Accepts plain filename (e.g., "img_xyz.png")
  // - Accepts already-prefixed path ("/php/Uploads/img_xyz.png" or full backend URL)
  // - Accepts absolute URLs (http/https) and blob URLs
  const normalizePhotoUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return "";

    const value = raw.trim();
    if (value.length === 0) return "";

    // If already absolute or blob URL, keep as-is
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:')) {
      return value;
    }

    // If it's a full path with backend-ville, reconstruct using API config
    if (value.includes('backend-ville/Uploads/') || value.includes('backend/Uploads/')) {
      const filename = value.split('/Uploads/').pop();
      return API.uploads.getUploadURL(filename);
    }

    // If already points to our uploads path (legacy format), extract filename and use API
    if (value.startsWith('/php/Uploads/')) {
      const filename = value.replace('/php/Uploads/', '');
      return API.uploads.getUploadURL(filename);
    }
    if (value.startsWith('php/Uploads/')) {
      const filename = value.replace('php/Uploads/', '');
      return API.uploads.getUploadURL(filename);
    }

    // Some records might accidentally store with double prefix; de-dupe and use API
    if (value.startsWith('/php/Uploads/php/Uploads/')) {
      const filename = value.replace('/php/Uploads/php/Uploads/', '');
      return API.uploads.getUploadURL(filename);
    }

    // Otherwise treat it as a filename residing in backend/Uploads and use API
    return API.uploads.getUploadURL(value);
  };

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const updateUserPhoto = (newPhoto) => {
    const fullPhotoUrl = normalizePhotoUrl(newPhoto);
    setUserData(prev => ({ ...prev, user_photo: fullPhotoUrl }));
  };

  // New function: Update any user's photo by ID
  const updateAnyUserPhoto = (userId, newPhoto) => {
    if (!userId) return;
    const photoUrl = normalizePhotoUrl(newPhoto);
    
    console.log('updateAnyUserPhoto called:', {
      userId,
      newPhoto,
      finalPhotoUrl: photoUrl,
      key: userId.toString()
    });
    
    setAllUsersPhotos(prev => {
      const newMap = new Map(prev);
      newMap.set(userId.toString(), photoUrl);
      console.log('Updated photo map for user:', userId, 'New map size:', newMap.size);
      return newMap;
    });
  };

  // New function: Update any student's photo by ID
  const updateAnyStudentPhoto = (studentId, newPhoto) => {
    if (!studentId) return;
    const photoUrl = normalizePhotoUrl(newPhoto);
    
    console.log('updateAnyStudentPhoto called:', {
      studentId,
      newPhoto,
      finalPhotoUrl: photoUrl,
      key: `student_${studentId}`
    });
    
    setAllUsersPhotos(prev => {
      const newMap = new Map(prev);
      newMap.set(`student_${studentId}`, photoUrl);
      console.log('Updated photo map for student:', studentId, 'New map size:', newMap.size);
      return newMap;
    });
  };

  // New function: Update unread message counts
  const updateUnreadCounts = useCallback((newCounts) => {
    setUnreadCounts(prev => {
      const updated = { ...prev, ...newCounts };
      // Calculate total
      updated.total = updated.users + updated.groups;
      return updated;
    });
  }, []);

  // Function to initialize unread counts from backend
  const initializeUnreadCounts = useCallback(async () => {
    try {
      const uid = Number(localStorage.getItem('userId'));
      if (!uid) return;
      
      // Fetch current unread counts from backend
      const [recentRes, groupsRes] = await Promise.all([
        fetch(`${API.communication.getRecentConversations()}?user_id=${uid}`),
        fetch(`${API.communication.getGroups()}?user_id=${uid}`)
      ]);
      
      const recentData = await recentRes.json();
      const groupsData = await groupsRes.json();
      
      const usersUnread = recentData?.success ? 
        (recentData.data || []).reduce((sum, item) => sum + (Number(item.unread_count) || 0), 0) : 0;
      
      const groupsUnread = groupsData?.success ? 
        (groupsData.data || []).reduce((sum, item) => sum + (Number(item.unread_count) || 0), 0) : 0;
      
      updateUnreadCounts({
        users: usersUnread,
        groups: groupsUnread
      });
    } catch (err) {
      console.error('Error initializing unread counts:', err);
    }
  }, [updateUnreadCounts]);

  // New function: Get photo for any user by ID
  const getUserPhoto = (userId) => {
    if (!userId) return "";
    const photo = allUsersPhotos.get(userId.toString()) || "";
    console.log('getUserPhoto called:', {
      userId,
      key: userId.toString(),
      foundPhoto: photo,
      mapSize: allUsersPhotos.size,
      allKeys: Array.from(allUsersPhotos.keys())
    });
    return photo;
  };

  // New function: Get photo for any student by ID
  const getStudentPhoto = (studentId) => {
    if (!studentId) return "";
    const photo = allUsersPhotos.get(`student_${studentId}`) || "";
    console.log('getStudentPhoto called:', {
      studentId,
      key: `student_${studentId}`,
      foundPhoto: photo,
      photoType: typeof photo,
      photoStartsWith: photo ? photo.substring(0, 20) : 'empty',
      mapSize: allUsersPhotos.size,
      allKeys: Array.from(allUsersPhotos.keys())
    });
    return photo;
  };

  // New function: Initialize photos for all users (called when Users page loads)
  const initializeAllUsersPhotos = (users) => {
    const photoMap = new Map();
    
    // Process admin, teacher, and parent users
    ['Admin', 'Teacher', 'Parent'].forEach(role => {
      if (users[role]) {
        users[role].forEach(user => {
          if (user.photo) {
            const finalUrl = normalizePhotoUrl(user.photo);
            photoMap.set(user.id.toString(), finalUrl);
          }
        });
      }
    });
    
    // Process students
    if (users.Student) {
      users.Student.forEach(student => {
        // Check multiple possible photo field names
        const photoField = student.photo || student.stud_photo || student.user_photo;
        if (photoField) {
          const finalUrl = normalizePhotoUrl(photoField);
          photoMap.set(`student_${student.id}`, finalUrl);
          console.log('Student photo processed:', {
            studentId: student.id,
            studentName: student.name,
            photoField: photoField,
            finalUrl: finalUrl
          });
        }
      });
    }
    
    console.log('initializeAllUsersPhotos called:', {
      adminCount: users.Admin?.length || 0,
      teacherCount: users.Teacher?.length || 0,
      parentCount: users.Parent?.length || 0,
      studentCount: users.Student?.length || 0,
      photoMapSize: photoMap.size,
      samplePhotos: {
        admin: users.Admin?.[0]?.photo,
        teacher: users.Teacher?.[0]?.photo,
        parent: users.Parent?.[0]?.photo,
        student: users.Student?.[0]?.photo
      }
    });
    
    setAllUsersPhotos(photoMap);
  };

  // New function: Initialize photos for advisory data (called when AssignedClass page loads)
  const initializeAdvisoryPhotos = (students, parents) => {
    const photoMap = new Map();
    
    // Process students
    if (students) {
      students.forEach(student => {
        if (student.photo) {
          const finalUrl = normalizePhotoUrl(student.photo);
          photoMap.set(`student_${student.student_id}`, finalUrl);
        }
      });
    }
    
    // Process parents
    if (parents) {
      parents.forEach(parent => {
        if (parent.photo) {
          const finalUrl = normalizePhotoUrl(parent.photo);
          photoMap.set(parent.user_id.toString(), finalUrl);
        }
      });
    }
    
    console.log('initializeAdvisoryPhotos called:', {
      studentCount: students?.length || 0,
      parentCount: parents?.length || 0,
      photoMapSize: photoMap.size,
      studentPhotos: students?.map(s => ({ id: s.student_id, photo: s.photo })),
      parentPhotos: parents?.map(p => ({ id: p.user_id, photo: p.photo }))
    });
    
    setAllUsersPhotos(prev => {
      const newMap = new Map([...prev, ...photoMap]);
      console.log('Updated photo map after advisory initialization. New size:', newMap.size);
      return newMap;
    });
  };

  const updateUserName = (newName) => {
    setUserData(prev => ({ ...prev, fullName: newName }));
    // Also update localStorage for persistence
    localStorage.setItem("userFullName", newName);
  };

  // Helper to refresh user data from API/localStorage
  const refreshUser = async () => {
    const lsUserId = localStorage.getItem("userId");
    const lsRole = localStorage.getItem("userRole") || "";
    const lsFullName = localStorage.getItem("userFullName") || "";

    if (!lsUserId) {
      setUserData({ fullName: "", role: "", userId: null });
      return;
    }

    try {
      const response = await fetch(API.user.getUserDetails(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: lsUserId }),
      });

              if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.user) {
            const displayName = lsFullName || data.user.fullName || "";
            const photoUrl = normalizePhotoUrl(data.user.photo || data.user.user_photo || "");
            
            setUserData({
              fullName: displayName,
              role: lsRole || data.user.role || "",
              userId: lsUserId,
              user_photo: photoUrl
            });
            
            // Also update the global photo map for the current user
            if (photoUrl) {
              setAllUsersPhotos(prev => new Map(prev).set(lsUserId.toString(), photoUrl));
            }
            
            // Initialize unread counts after user data is loaded
            initializeUnreadCounts();
            return;
          }
        }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }

    // Fallback to localStorage only
    setUserData({ fullName: lsFullName, role: lsRole, userId: lsUserId, user_photo: "" });
  };

  // Initialize user data on mount and subscribe to auth changes
  useEffect(() => {
    refreshUser();
    const handleUserChanged = () => refreshUser();
    window.addEventListener('userChanged', handleUserChanged);
    return () => window.removeEventListener('userChanged', handleUserChanged);
  }, []);

  return (
    <UserContext.Provider value={{ 
      userData, 
      updateUserData, 
      updateUserName, 
      updateUserPhoto, 
      refreshUser,
      // New functions for global photo management
      updateAnyUserPhoto,
      updateAnyStudentPhoto,
      getUserPhoto,
      getStudentPhoto,
      initializeAllUsersPhotos,
      initializeAdvisoryPhotos,
      allUsersPhotos,
      // Unread message counts
      unreadCounts,
      updateUnreadCounts,
      initializeUnreadCounts
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 