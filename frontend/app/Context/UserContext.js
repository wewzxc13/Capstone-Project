"use client";

import { createContext, useContext, useState, useEffect } from 'react';

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

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const updateUserPhoto = (newPhoto) => {
    if (!newPhoto) {
      setUserData(prev => ({ ...prev, user_photo: "" }));
      return;
    }
    
    // If it's already a full URL, use as is
    if (newPhoto.startsWith('http://') || newPhoto.startsWith('https://')) {
      setUserData(prev => ({ ...prev, user_photo: newPhoto }));
      return;
    }
    
    // If it's just a filename, construct the full backend URL
    const fullPhotoUrl = `http://localhost/capstone-project/backend/Uploads/${newPhoto}`;
    setUserData(prev => ({ ...prev, user_photo: fullPhotoUrl }));
  };

  // New function: Update any user's photo by ID
  const updateAnyUserPhoto = (userId, newPhoto) => {
    if (!userId) return;
    
    let photoUrl = "";
    if (newPhoto) {
      // If it's already a full URL, use as is
      if (newPhoto.startsWith('http://') || newPhoto.startsWith('https://')) {
        photoUrl = newPhoto;
      } else {
        // If it's just a filename, construct the full backend URL
        photoUrl = `http://localhost/capstone-project/backend/Uploads/${newPhoto}`;
      }
    }
    
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
    
    let photoUrl = "";
    if (newPhoto) {
      // If it's already a full URL, use as is
      if (newPhoto.startsWith('http://') || newPhoto.startsWith('https://')) {
        photoUrl = newPhoto;
      } else {
        // If it's just a filename, construct the full backend URL
        photoUrl = `http://localhost/capstone-project/backend/Uploads/${newPhoto}`;
      }
    }
    
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
            photoMap.set(user.id.toString(), user.photo);
          }
        });
      }
    });
    
    // Process students
    if (users.Student) {
      users.Student.forEach(student => {
        if (student.photo) {
          photoMap.set(`student_${student.id}`, student.photo);
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
          photoMap.set(`student_${student.student_id}`, student.photo);
        }
      });
    }
    
    // Process parents
    if (parents) {
      parents.forEach(parent => {
        if (parent.photo) {
          photoMap.set(parent.user_id.toString(), parent.photo);
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
      const response = await fetch("http://localhost/capstone-project/backend/Users/get_user_details.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: lsUserId }),
      });

              if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.user) {
            const displayName = lsFullName || data.user.fullName || "";
            const photoUrl = (() => {
              const photo = data.user.photo || data.user.user_photo || "";
              if (!photo) return "";
              
              // If it's already a full URL, return as is
              if (photo.startsWith('http://') || photo.startsWith('https://')) {
                return photo;
              }
              
              // If it's just a filename, construct the full backend URL
              return `http://localhost/capstone-project/backend/Uploads/${photo}`;
            })();
            
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
      allUsersPhotos
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