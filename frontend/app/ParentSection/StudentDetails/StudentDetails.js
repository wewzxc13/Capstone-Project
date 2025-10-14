"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FaUser, FaPhone, FaEnvelope, FaTimes, FaEdit, FaCrop, FaCheck, FaUndo } from "react-icons/fa";
import { useUser } from "../../Context/UserContext";
import { useModal } from "../../Context/ModalContext";
import { API, uploadsAPI } from '@/config/api';


// Helper to capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w/g, c => c.toLowerCase());
}
// --- VALIDATION LOGIC (copied and adapted from ParentDetails) ---
const validators = {
  name: (value) => {
    if (!value) return { isValid: false, message: "" };
    const nameRegex = /^[A-Z][a-zA-Z\s]*$/;
    if (!nameRegex.test(value)) {
      return { isValid: false, message: "First letter must be capital, only letters and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Name must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },
  gender: (value) => {
    if (!value) return { isValid: false, message: "Gender is required" };
    if (!["Male", "Female"].includes(value)) return { isValid: false, message: "Invalid gender" };
    return { isValid: true, message: "" };
  },
  date: (value) => {
    if (!value) return { isValid: false, message: "Date is required" };
    const date = new Date(value);
    if (isNaN(date.getTime())) return { isValid: false, message: "Invalid date" };
    return { isValid: true, message: "" };
  },
  handedness: (value) => {
    if (!value) return { isValid: false, message: "Handedness is required" };
    if (!["Right", "Left"].includes(value)) return { isValid: false, message: "Invalid handedness" };
    return { isValid: true, message: "" };
  },
  required: (value) => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "This field is required" };
    }
    return { isValid: true, message: "" };
  },
  age: (value) => {
    if (!value) return { isValid: true, message: "" };
    const num = Number(value);
    if (isNaN(num) || num < 18 || num > 100) return { isValid: false, message: "Age must be between 18 and 100" };
    return { isValid: true, message: "" };
  },
  occupation: (value) => {
    if (!value) return { isValid: true, message: "" };
    // Disallow numbers and special characters, only allow letters and spaces
    const occupationRegex = /^[A-Za-z\s]+$/;
    if (!occupationRegex.test(value)) {
      return { isValid: false, message: "Occupation must only contain letters and spaces" };
    }
    // Allow each word to be either all uppercase (acronym) or capitalized
    const words = value.trim().split(/\s+/); // split on one or more spaces
    for (let word of words) {
      if (!word) continue;
      if (!(word === word.toUpperCase() || (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()))) {
        return { isValid: false, message: "Each word must be capitalized or an acronym (all uppercase)" };
      }
    }
    return { isValid: true, message: "" };
  },
  // Add student DOB validation (2-4 years old)
  studentDob: (value) => {
    if (!value) return { isValid: false, message: "Date of birth is required" };
    // Reference date for age computation (same as update_lvl.php)
    const referenceDate = new Date("2025-08-04");
    const birthDate = new Date(value);
    if (isNaN(birthDate.getTime())) return { isValid: false, message: "Invalid date" };
    // Compute age in years and months as of reference date
    let years = referenceDate.getFullYear() - birthDate.getFullYear();
    let months = referenceDate.getMonth() - birthDate.getMonth();
    if (referenceDate.getDate() < birthDate.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    const age = years + months / 12;
    // Level date ranges (same as update_lvl.php)
    const levelDateRanges = {
      1: { start: new Date("2022-08-05"), end: new Date("2023-11-04") },
      2: { start: new Date("2021-08-05"), end: new Date("2022-08-04") },
      3: { start: new Date("2020-08-05"), end: new Date("2021-08-04") },
    };
    let levelId = null;
    if (age >= 1.8 && age < 3) {
      levelId = 1;
    } else if (age >= 3 && age < 4) {
      levelId = 2;
    } else if (age >= 4 && age < 5) {
      levelId = 3;
    }
    if (!levelId) {
      return { isValid: false, message: "The student must be between 1.8 and 5 years old at the start of class (Level 1: 1.8–3, Level 2: 3–4, Level 3: 4–5)." };
    }
    // Check if birthdate falls within the valid range for the level
    const range = levelDateRanges[levelId];
    if (birthDate < range.start || birthDate > range.end) {
      return { isValid: false, message: `Birthdate must be between ${range.start.toISOString().slice(0,10)} and ${range.end.toISOString().slice(0,10)} for Level ${levelId}` };
    }
    return { isValid: true, message: "" };
  }
};
function getInputClassName(fieldName, errors, value, editing) {
  const baseClass = "border w-full p-2 rounded transition-colors";
  if (editing) {
    if (errors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50 cursor-text caret-[#1E2A79]`;
    } else if (value && !errors[fieldName]) {
      return `${baseClass} border-green-500 bg-green-50 cursor-text caret-[#1E2A79]`;
    }
  }
  return `${baseClass} border-gray-300 ${editing ? 'cursor-text caret-[#1E2A79]' : 'cursor-default'}`;
}
// Helper function to construct full photo URL from filename
function getPhotoUrl(filename) {
  if (!filename) return null;
  
  // If it's already a full URL (like a blob URL for preview), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('blob:')) {
    return filename;
  }
  
  // Use centralized upload URL configuration
  return uploadsAPI.getUploadURL(filename);
}

// --- END VALIDATION LOGIC ---

const StudentDetails = () => {
  const { updateAnyStudentPhoto } = useUser();
  const { openModal, closeModal } = useModal();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editStudentData, setEditStudentData] = useState(null);
  const [editParentProfile, setEditParentProfile] = useState(null);
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Photo selection menu state
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoMenuPosition, setPhotoMenuPosition] = useState({ x: 0, y: 0 });

  // Photo cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropData, setCropData] = useState({
    centerX: 200,
    centerY: 200,
    radius: 100,
    scale: 1,
    rotate: 0
  });
  const [originalImage, setOriginalImage] = useState(null);

  // Mouse interaction state for circular cropping
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move', 'resize'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Photo upload state
  const [selectedPhoto, setSelectedPhoto] = useState(null);



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const parentId = localStorage.getItem("userId");
        
        if (!parentId) {
          setLoading(false);
          return;
        }

        // Fetch all users to get students
        const usersRes = await fetch(API.user.getAllUsers());
        const usersData = await usersRes.json();
        
        // Check if the API response has the expected structure
        if (!usersData.users || !usersData.users.Student) {
          setStudents([]);
          setLoading(false);
          return;
        }
        
        // Filter students for this parent
        let myStudents = usersData.users.Student.filter(s => String(s.parent_id) === String(parentId));
        
        // Sort students by level
        myStudents = myStudents.sort((a, b) => (parseInt(a.levelId) || 0) - (parseInt(b.levelId) || 0));
        
        console.log('Students data from get_all_users:', myStudents); // Debug log
        console.log('First student photo field:', myStudents[0]?.stud_photo || myStudents[0]?.photo); // Debug log
        
        setStudents(myStudents);
        
        if (myStudents.length > 0) {
          // Auto-select first active student
          const activeStudents = myStudents.filter(s => s.schoolStatus === 'Active');
          if (activeStudents.length > 0) {
            setSelectedStudentId(activeStudents[0].id);
          } else {
            // If no active students, select the first student anyway
            setSelectedStudentId(myStudents[0].id);
          }
          
          // Enhance students data with photo information if available
          // This will help the navigation tabs display photos
          myStudents.forEach(async (student) => {
            try {
              const studentRes = await fetch(API.user.getStudentDetails(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: student.id })
              });
              const studentData = await studentRes.json();
              if (studentData.status === "success" && studentData.student) {
                // Update the student in the students array with photo data
                // Only update if we don't already have photo data to avoid overwriting
                setStudents(prevStudents => 
                  prevStudents.map(s => 
                    s.id === student.id && !s.stud_photo && !s.photo
                      ? { ...s, stud_photo: studentData.student.stud_photo || studentData.student.photo }
                      : s
                  )
                );
              }
            } catch (error) {
              console.error(`Error fetching photo for student ${student.id}:`, error);
            }
          });
        }
        
        // Fetch parent profile (with father/mother details)
        const parentRes = await fetch(API.user.getUserDetails(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parentId })
        });
        const parentData = await parentRes.json();
        
        if (parentData.status === "success") {
          // Fetch full parent profile (father/mother details)
          const parentProfileRes = await fetch(API.user.getUserProfile(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: parentId })
          });
          const parentProfileData = await parentProfileRes.json();
          setParentProfile({ ...parentData.user, ...parentProfileData.user });
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    const fetchStudent = async () => {
      setStudentLoading(true);
      try {
        const res = await fetch(API.user.getStudentDetails(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: selectedStudentId })
        });
        const data = await res.json();
        console.log('Student API Response:', data); // Debug log
        if (data.status === "success") {
          console.log('Student data received:', data.student); // Debug log
          console.log('Student photo field:', data.student?.stud_photo || data.student?.photo); // Debug log
          console.log('Setting student data for ID:', selectedStudentId); // Debug log
          setStudentData(data.student);
          
          // Also update the students array to ensure photo data is maintained
          setStudents(prevStudents => 
            prevStudents.map(s => 
              s.id === selectedStudentId 
                ? { ...s, stud_photo: data.student?.stud_photo || data.student?.photo }
                : s
            )
          );
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setStudentLoading(false);
      }
    };
    fetchStudent();
  }, [selectedStudentId]);

  useEffect(() => {
    if (!editing) {
      // Always update edit data when switching students (when not editing)
      // This ensures the photo and other data is properly maintained
      setEditStudentData(studentData);
      setEditParentProfile(parentProfile);
      // Also clear any selected photo when switching students
      setSelectedPhoto(null);
    }
  }, [studentData, parentProfile, editing]);

  // Validation function
  function validateForm(data = editStudentData, parent = editParentProfile) {
    const errors = {};
    // Student fields
    // First and last name required, middle name optional
    if (data && data['firstName']) {
      const v = validators.name(data['firstName']);
      if (!v.isValid) errors['firstName'] = v.message;
    } else {
      errors['firstName'] = 'This field is required';
    }
    if (data && data['lastName']) {
      const v = validators.name(data['lastName']);
      if (!v.isValid) errors['lastName'] = v.message;
    } else {
      errors['lastName'] = 'This field is required';
    }
    // Middle name optional, but if present, must be valid
    if (data && data['middleName']) {
      const v = validators.name(data['middleName']);
      if (!v.isValid) errors['middleName'] = v.message;
    }
    // Gender
    const genderV = validators.gender(data?.gender);
    if (!genderV.isValid) errors.gender = genderV.message;
    // Dates
    // Date of Birth is not editable, so skip validation
    // const dobV = validators.studentDob(data?.user_birthdate);
    // if (!dobV.isValid) errors.user_birthdate = dobV.message;
    const enrollV = validators.date(data?.enrollmentDate);
    if (!enrollV.isValid) errors.enrollmentDate = enrollV.message;
    // Handedness
    const handV = validators.handedness(data?.handedness);
    if (!handV.isValid) errors.handedness = handV.message;
    // Parent fields (not required, but if filled, must be valid)
    ['father_name', 'mother_name'].forEach(f => {
      if (parent && parent[f]) {
        const v = validators.name(parent[f]);
        if (!v.isValid) errors[f] = v.message;
      }
    });
    // Father's/Mother's age/occupation not required, but if filled, must be valid
    ['father_age', 'mother_age'].forEach(f => {
      if (parent && parent[f]) {
        const v = validators.age(parent[f]);
        if (!v.isValid) errors[f] = v.message;
      }
    });
    ['father_occupation', 'mother_occupation'].forEach(f => {
      if (parent && parent[f]) {
        const v = validators.occupation(parent[f]);
        if (!v.isValid) errors[f] = v.message;
      }
    });
    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
    return errors;
  }
  // Validate on edit data change
  useEffect(() => {
    if (editing) validateForm(editStudentData, editParentProfile);
    // eslint-disable-next-line
  }, [editStudentData, editParentProfile, editing]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any blob URLs to prevent memory leaks
      if (editStudentData?.stud_photo && editStudentData.stud_photo.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(editStudentData.stud_photo);
        } catch (error) {
          console.error('Failed to revoke blob URL:', error);
        }
      }
      if (editStudentData?.photo && editStudentData.photo.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(editStudentData.photo);
        } catch (error) {
          console.error('Failed to revoke blob URL:', error);
        }
      }
    };
  }, [editStudentData?.stud_photo, editStudentData?.photo]);

  // Create and cleanup selectedPhoto blob URL when it changes
  const [selectedPhotoBlobUrl, setSelectedPhotoBlobUrl] = useState(null);
  
  useEffect(() => {
    if (selectedPhoto && selectedPhoto instanceof File) {
      // Create blob URL for display
      const blobUrl = URL.createObjectURL(selectedPhoto);
      setSelectedPhotoBlobUrl(blobUrl);
      
      return () => {
        // Cleanup blob URL to prevent memory leaks
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error('Failed to revoke selectedPhoto blob URL:', error);
        }
      };
    } else {
      setSelectedPhotoBlobUrl(null);
    }
  }, [selectedPhoto]);

  // Debug logging for editStudentData changes
  useEffect(() => {
    console.log('=== editStudentData changed ===');
    console.log('editStudentData:', editStudentData);
    console.log('stud_photo field:', editStudentData?.stud_photo);
    console.log('photo field:', editStudentData?.photo);
    console.log('stud_photo type:', typeof editStudentData?.stud_photo);
    console.log('photo type:', typeof editStudentData?.photo);
    console.log('stud_photo length:', editStudentData?.stud_photo ? editStudentData.stud_photo.length : 0);
    console.log('photo length:', editStudentData?.photo ? editStudentData.photo.length : 0);

    if (editStudentData?.stud_photo) {
      console.log('Current stud_photo:', editStudentData.stud_photo);
      console.log('Full photo URL:', getPhotoUrl(editStudentData.stud_photo));
    } else if (editStudentData?.photo) {
      console.log('Current photo:', editStudentData.photo);
      console.log('Full photo URL:', getPhotoUrl(editStudentData.photo));
    } else {
      console.log('No photo found in editStudentData');
    }
  }, [editStudentData]);

  // Debug logging for students array changes (navigation tabs)
  useEffect(() => {
    console.log('=== students array changed ===');
    console.log('students:', students);
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        id: student.id,
        name: student.name || `${student.firstName} ${student.lastName}`,
        stud_photo: student.stud_photo,
        photo: student.photo,
        final_photo: student.stud_photo || student.photo
      });
    });
    console.log('=== END students array debug ===');
  }, [students]);

  // Handlers for editing
  const handleEdit = () => {
    setEditStudentData(studentData);
    setEditParentProfile(parentProfile);
    setEditing(true);
  };
  const handleCancel = () => {
    setEditing(false);
    setSelectedPhoto(null);
    setSelectedPhotoBlobUrl(null);
  };
  // Helper to fetch latest student and parent data
  const fetchLatestData = async (studentId, parentId) => {
    // Fetch student
    if (studentId) {
      const res = await fetch(API.user.getStudentDetails(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId })
      });
      const data = await res.json();
      if (data.status === "success") {
        setStudentData(data.student);
      }
    }
    // Fetch parent profile
    if (parentId) {
      const parentRes = await fetch(API.user.getUserDetails(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parentId })
      });
      const parentData = await parentRes.json();
      if (parentData.status === "success") {
        // Fetch full parent profile (father/mother details)
        const parentProfileRes = await fetch(API.user.getUserProfile(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parentId })
        });
        const parentProfileData = await parentProfileRes.json();
        setParentProfile({ ...parentData.user, ...parentProfileData.user });
      }
    }
  };
  const handleSave = async () => {
    if (!validateForm(editStudentData, editParentProfile) || !isFormValid) return;
    setLoading(true);
    try {
      // Upload photo first if user selected a new photo
      let uploadedPhotoUrl = undefined;
      if (selectedPhoto && typeof selectedPhoto !== 'string') {
        console.log('Photo selected for upload:', selectedPhoto.name); // Debug log
        try {
          const form = new FormData();
          form.append('photo', selectedPhoto);
          const uploadRes = await fetch(API.user.uploadPhoto(), {
            method: 'POST',
            body: form,
          });
          const uploadJson = await uploadRes.json();
          console.log('Upload response:', uploadJson); // Debug log
          if (!uploadRes.ok || uploadJson.status !== 'success') {
            toast.error('Photo upload failed');
            setLoading(false);
            return;
          }
          // Get filename from upload response (don't construct full URL here)
          uploadedPhotoUrl = uploadJson.url; // This is just the filename
          console.log('Photo uploaded successfully, filename:', uploadedPhotoUrl); // Debug log
        } catch (err) {
          console.error('Photo upload error:', err); // Debug log
          toast.error('Photo upload error: ' + err.message);
          setLoading(false);
          return;
        }
      }
      // 1. Update student with correct backend keys
      const studentPayload = {
        student_id: editStudentData.id || selectedStudentId,
        stud_firstname: editStudentData.firstName,
        stud_middlename: editStudentData.middleName,
        stud_lastname: editStudentData.lastName,
        // stud_birthdate: editStudentData.user_birthdate, // Date of Birth is not editable
        stud_gender: editStudentData.gender,
        stud_handedness: editStudentData.handedness,
        stud_enrollment_date: editStudentData.enrollmentDate,
        stud_photo: uploadedPhotoUrl !== undefined
          ? uploadedPhotoUrl
          : (typeof editStudentData.stud_photo === 'string' ? editStudentData.stud_photo : undefined),
      };
      Object.keys(studentPayload).forEach(key => studentPayload[key] === undefined && delete studentPayload[key]);
      const studentRes = await fetch(API.user.updateStudent(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentPayload)
      });
      const studentResult = await studentRes.json();
      if (studentResult.status !== 'success') {
        toast.error(studentResult.message || 'Failed to update student');
        return;
      }
      // 2. Update parent profile (only if parentProfile exists)
      let parentResult = { status: 'success' };
      if (editParentProfile && parentProfile) {
        const parentPayload = {
          user_id: parentProfile.id || parentProfile.user_id,
          father_name: editParentProfile.father_name,
          father_age: editParentProfile.father_age,
          father_occupation: editParentProfile.father_occupation,
          mother_name: editParentProfile.mother_name,
          mother_age: editParentProfile.mother_age,
          mother_occupation: editParentProfile.mother_occupation,
        };
        Object.keys(parentPayload).forEach(key => parentPayload[key] === undefined && delete parentPayload[key]);
        const parentRes = await fetch(API.user.updateUser(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parentPayload)
        });
        parentResult = await parentRes.json();
        if (parentResult.status !== 'success') {
          toast.error(parentResult.message || 'Failed to update parent profile');
          return;
        }
      }
      // Always show toast after both updates succeed
      toast.success('Profile updated successfully!');
      
      // Update the photo in editStudentData if a new photo was uploaded
      if (uploadedPhotoUrl !== undefined) {
        setEditStudentData(prev => ({ ...prev, stud_photo: uploadedPhotoUrl }));
        console.log('Updated editStudentData with new photo filename:', uploadedPhotoUrl); // Debug log
        
        // Update the global photo map for real-time updates across all pages
        if (selectedStudentId) {
          // Construct the full URL for the uploaded photo
          const fullPhotoUrl = `/php/Uploads/${uploadedPhotoUrl}`;
          updateAnyStudentPhoto(selectedStudentId, fullPhotoUrl);
          console.log('Updated global photo map for student:', selectedStudentId, 'with URL:', fullPhotoUrl);
        }
        
        // Also update studentData immediately so the main photo display and names update
        setStudentData(prev => ({ 
          ...prev, 
          stud_photo: uploadedPhotoUrl, 
          photo: uploadedPhotoUrl,
          // Also update name fields if they were changed
          ...(editStudentData.firstName !== undefined ? { firstName: editStudentData.firstName } : {}),
          ...(editStudentData.middleName !== undefined ? { middleName: editStudentData.middleName } : {}),
          ...(editStudentData.lastName !== undefined ? { lastName: editStudentData.lastName } : {})
        }));
        
        // Clear the selectedPhoto and blob URL since it's now uploaded
        setSelectedPhoto(null);
        setSelectedPhotoBlobUrl(null);
      } else {
        // If no photo was uploaded but names were changed, still update studentData
        if (editStudentData.firstName !== undefined || editStudentData.middleName !== undefined || editStudentData.lastName !== undefined) {
          setStudentData(prev => ({ 
            ...prev,
            // Update name fields if they were changed
            ...(editStudentData.firstName !== undefined ? { firstName: editStudentData.firstName } : {}),
            ...(editStudentData.middleName !== undefined ? { middleName: editStudentData.middleName } : {}),
            ...(editStudentData.lastName !== undefined ? { lastName: editStudentData.lastName } : {})
          }));
        }
      }
      
      // Update the students array to reflect both name and photo changes in real-time
      setStudents(prevStudents => {
        const updatedStudents = prevStudents.map(student => 
          student.id === selectedStudentId 
            ? {
                ...student,
                // Update individual name fields for navigation tabs
                ...(editStudentData.firstName !== undefined ? { firstName: editStudentData.firstName } : {}),
                ...(editStudentData.middleName !== undefined ? { middleName: editStudentData.middleName } : {}),
                ...(editStudentData.lastName !== undefined ? { lastName: editStudentData.lastName } : {}),
                // Also update the combined name field for compatibility
                ...(editStudentData.firstName || editStudentData.middleName || editStudentData.lastName ? {
                  name: [editStudentData.firstName, editStudentData.middleName, editStudentData.lastName]
                    .filter(name => name && name.trim())
                    .join(' ')
                    .trim()
                } : {}),
                // Update photo if uploaded
                ...(uploadedPhotoUrl !== undefined ? {
                  stud_photo: uploadedPhotoUrl,
                  photo: uploadedPhotoUrl // Also update the photo field for compatibility
                } : {})
              }
            : student
        );
        
        // Debug logging for updates
        console.log('=== STUDENT UPDATE DEBUG ===');
        if (editStudentData.firstName || editStudentData.middleName || editStudentData.lastName) {
          console.log('Updated students array with new names:', {
            firstName: editStudentData.firstName,
            middleName: editStudentData.middleName,
            lastName: editStudentData.lastName
          });
        }
        if (uploadedPhotoUrl !== undefined) {
          console.log('Updated students array with new photo:', uploadedPhotoUrl);
        }
        console.log('Updated student in array:', updatedStudents.find(s => s.id === selectedStudentId));
        console.log('=== END STUDENT UPDATE DEBUG ===');
        
        return updatedStudents;
      });
      
      // Log the update in system_logs
      const parentId = parentProfile?.id || parentProfile?.user_id;
      const studentId = editStudentData.id || selectedStudentId;
      await fetch(API.logs.createSystemLog(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parentId,
          target_user_id: null,
          target_student_id: studentId,
          action: "Edited the details of their child profile."
        })
      });
      setEditing(false);
      // Fetch latest data from backend so UI reflects changes
      await fetchLatestData(editStudentData.id || selectedStudentId, parentProfile?.id || parentProfile?.user_id);
    } catch (err) {
      toast.error('An error occurred while updating.');
    } finally {
      setLoading(false);
    }
  };
  // Field change handlers
  const handleStudentChange = (e) => {
    const { name, value, type, files } = e.target;
    let processedValue = value;
    // Auto-capitalize for name fields
    if (["firstName", "middleName", "lastName"].includes(name)) {
      processedValue = capitalizeWords(value);
    }
    if (type === 'file') {
      setEditStudentData({ ...editStudentData, photo: files[0] ? Object.assign(files[0], { preview: URL.createObjectURL(files[0]) }) : '' });
    } else {
      setEditStudentData({ ...editStudentData, [name]: processedValue });
    }
  };
  const handleParentChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    // Auto-capitalize for parent name fields
    if (["father_name", "mother_name"].includes(name)) {
      processedValue = capitalizeWords(value);
    }
    // Auto-capitalize for occupation fields
    if (["father_occupation", "mother_occupation"].includes(name)) {
      processedValue = capitalizeWords(value);
    }
    setEditParentProfile({ ...editParentProfile, [name]: processedValue });
  };

  // Photo menu handler
  const handlePhotoClick = (e) => {
    if (!editing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setPhotoMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowPhotoMenu(true);
  };

  // Handle photo click when no photo exists (for first-time upload)
  const handleNoPhotoClick = (e) => {
    if (!editing) return;
    
    // If no photo exists, directly open file input for upload
    fileInputRef.current?.click();
  };

  // Close photo menu
  const closePhotoMenu = () => {
    setShowPhotoMenu(false);
  };

  // Handle photo menu selection
  const handlePhotoMenuSelect = (action) => {
    closePhotoMenu();
    
    if (action === 'crop' && (editStudentData?.stud_photo || editStudentData?.photo)) {
      openCropModal('existing');
    } else if (action === 'upload') {
      fileInputRef.current?.click();
    }
  };

  // Photo cropping functions
  const openCropModal = (imageFile) => {
    if (!imageFile) return;
    
    // Open modal context immediately
    openModal();
    
    // If it's a new file, read it directly
    if (imageFile instanceof File && imageFile.size > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
        setOriginalImage(imageFile);
        setShowCropModal(true);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageFile === 'existing' && (editStudentData?.stud_photo || editStudentData?.photo)) {
      // For existing photos, convert to data URL to avoid cross-origin issues
              const currentPhotoUrl = getPhotoUrl(editStudentData.stud_photo || editStudentData.photo);
      if (currentPhotoUrl) {
        // Convert the image to a data URL to avoid cross-origin issues
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Create a canvas to convert the image to data URL
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // Draw the image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to data URL
          try {
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            setCropImage(dataURL);
            setOriginalImage(null);
            setShowCropModal(true);
          } catch (error) {
            console.error('Failed to convert image to data URL:', error);
            toast.error('Failed to load existing photo for cropping. Please try uploading a new photo instead.');
            closeModal();
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image for conversion');
          toast.error('Failed to load existing photo. Please try uploading a new photo instead.');
          closeModal();
        };
        
        img.src = currentPhotoUrl;
      }
    }
  };

  const handleCropChange = (newCropData) => {
    setCropData(newCropData);
  };

  const applyCrop = () => {
    if (!cropImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to crop dimensions (diameter x diameter)
      const diameter = cropData.radius * 2;
      canvas.width = diameter;
      canvas.height = diameter;
      
      // Get the actual image dimensions from the displayed image
      const displayWidth = window.innerWidth < 640 ? 240 : (window.innerWidth < 1024 ? 300 : 350);
      const displayHeight = displayWidth; // Square image
      
      // Calculate the scale factor between display and actual image
      const scaleX = img.naturalWidth / displayWidth;
      const scaleY = img.naturalHeight / displayHeight;
      
      // Calculate the actual source coordinates in the original image
      // The cropData coordinates are relative to the 400x400 container, but the image is 350x350 centered
      // So we need to adjust for the offset: (400 - 350) / 2 = 25px offset
      const containerOffset = 25; // (400 - 350) / 2
      const adjustedCenterX = cropData.centerX - containerOffset;
      const adjustedCenterY = cropData.centerY - containerOffset;
      
      // Calculate the actual source coordinates in the original image
      const sourceX = (adjustedCenterX - cropData.radius) * scaleX;
      const sourceY = (adjustedCenterY - cropData.radius) * scaleY;
      const sourceWidth = diameter * scaleX;
      const sourceHeight = diameter * scaleY;
      
      // Debug logging for coordinate verification
      console.log('=== CROPPING DEBUG ===');
      console.log('Display dimensions:', displayWidth, 'x', displayHeight);
      console.log('Actual image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
      console.log('Scale factors:', scaleX, scaleY);
      console.log('Container offset:', containerOffset);
      console.log('Original crop data:', cropData);
      console.log('Adjusted coordinates:', { centerX: adjustedCenterX, centerY: adjustedCenterY });
      console.log('Calculated source coordinates:', {
        x: sourceX,
        y: sourceY,
        width: sourceWidth,
        height: sourceHeight
      });
      console.log('Canvas dimensions:', diameter, 'x', diameter);
      console.log('=== END DEBUG ===');
      
      // Apply transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((cropData.rotate * Math.PI) / 180);
      ctx.scale(cropData.scale, cropData.scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, cropData.radius, 0, 2 * Math.PI);
      ctx.clip();
      
      // Draw the cropped image with corrected coordinates
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        diameter,
        diameter
      );
      
      ctx.restore();
      
      // Convert canvas to blob (should work now since we're using data URLs)
      canvas.toBlob((blob) => {
        if (blob) {
          createCroppedFile(blob);
        } else {
          handleCropError('Failed to create cropped image. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => {
      console.error('Failed to load image for cropping');
      handleCropError('Failed to load image for cropping. Please try again.');
    };
    
    img.src = cropImage;
  };

  // Helper function to create cropped file
  const createCroppedFile = (blob) => {
    let croppedFile;
    
    if (originalImage) {
      // For new uploads, create file with original name
      croppedFile = new File([blob], originalImage.name, {
        type: originalImage.type,
        lastModified: Date.now()
      });
    } else {
      // For existing photos, create file with timestamp
      const timestamp = new Date().getTime();
      croppedFile = new File([blob], `cropped_photo_${timestamp}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    }
    
    setSelectedPhoto(croppedFile);
    
    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(blob);
      
      // Update the form data to show the cropped photo immediately
      // Store the preview URL temporarily for display, but the actual file is in selectedPhoto
      // IMPORTANT: This preview URL is NOT stored in the database - only the filename will be stored
      setEditStudentData(prev => ({
        ...prev,
        stud_photo: previewUrl // This is just for preview, not for database storage
      }));
      
      setShowCropModal(false);
      setCropImage(null);
      setOriginalImage(null);
      closeModal();
      toast.success('Photo cropped successfully! Preview updated.');
    } catch (error) {
      console.error('Failed to create preview URL:', error);
      toast.error('Photo cropped but preview failed to load. Please save to see the result.');
      
      // Still close the modal and set the file
      setShowCropModal(false);
      setCropImage(null);
      setOriginalImage(null);
      closeModal();
    }
  };

  // Helper function to handle crop errors
  const handleCropError = (message) => {
    toast.error(message);
    console.error('Crop error:', message);
  };

  const cancelCrop = () => {
    setShowCropModal(false);
    setCropImage(null);
    setOriginalImage(null);
    setCropData({
      centerX: 200,
      centerY: 200,
      radius: 100,
      scale: 1,
      rotate: 0
    });
    setIsDragging(false);
    setDragType(null);
    closeModal();
  };

  // Mouse interaction handlers for circular cropping
  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handle (outer ring)
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - cropData.centerX, 2) + Math.pow(y - cropData.centerY, 2)
    );

    if (Math.abs(distanceFromCenter - cropData.radius) < 20) {
      setDragType('resize');
    } else if (distanceFromCenter < cropData.radius) {
      setDragType('move');
    } else {
      // Outside the circle - no rotation, just ignore
      return;
    }

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (dragType === 'move') {
      // Constrain movement to keep crop circle within the 400x400 container
      setCropData(prev => ({
        ...prev,
        centerX: Math.max(prev.radius, Math.min(400 - prev.radius, prev.centerX + deltaX)),
        centerY: Math.max(prev.radius, Math.min(400 - prev.radius, prev.centerY + deltaY))
      }));
    } else if (dragType === 'resize') {
      const newRadius = Math.max(30, Math.min(160, cropData.radius + (deltaX + deltaY) / 2));
      setCropData(prev => ({
        ...prev,
        radius: newRadius
      }));
    }

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent scrolling and other default behaviors
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Check if touching on resize handle (outer ring)
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - cropData.centerX, 2) + Math.pow(y - cropData.centerY, 2)
    );

    if (Math.abs(distanceFromCenter - cropData.radius) < 30) { // Larger touch target for mobile
      setDragType('resize');
    } else if (distanceFromCenter < cropData.radius) {
      setDragType('move');
    } else {
      // Outside the circle - no rotation, just ignore
      return;
    }

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent scrolling and other default behaviors
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (dragType === 'move') {
      // Constrain movement to keep crop circle within the 400x400 container
      setCropData(prev => ({
        ...prev,
        centerX: Math.max(prev.radius, Math.min(400 - prev.radius, prev.centerX + deltaX)),
        centerY: Math.max(prev.radius, Math.min(400 - prev.radius, prev.centerY + deltaY))
      }));
    } else if (dragType === 'resize') {
      const newRadius = Math.max(30, Math.min(160, cropData.radius + (deltaX + deltaY) / 2));
      setCropData(prev => ({
        ...prev,
        radius: newRadius
      }));
    }

    setDragStart({ x, y });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent default behaviors
    
    setIsDragging(false);
    setDragType(null);
  };

  // Touch event listeners are now handled inline in the JSX

  if (loading) return <div className="p-8">Loading...</div>;
  
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500 mb-4">You don't have any students linked to your account yet.</p>
          
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-0 overflow-hidden">

      

      {/* Tab Navigation for Students - Only show if parent has 2+ active students */}
      {students.filter(s => s.schoolStatus === 'Active').length > 1 && (
        <div className="bg-white px-2 sm:px-4 pt-6 pb-4 border-b border-gray-200 overflow-x-auto pb-2">
          <div className="flex gap-2 sm:gap-3">
            {students.filter(s => s.schoolStatus === 'Active').map(s => (
            <button
              key={s.id}
              className={`px-2 sm:px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 flex items-center gap-1 sm:gap-2 min-w-[140px] sm:min-w-[170px] flex-shrink-0 ${
                selectedStudentId === s.id 
                  ? editing 
                    ? 'bg-[#2c2f6f] text-white shadow-lg transform scale-105 cursor-default' // Selected and editing - no hover effects
                    : 'bg-[#2c2f6f] text-white shadow-lg transform scale-105' // Selected and not editing
                  : editing
                    ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed' // Not selected and editing - disabled
                    : 'bg-white text-[#2c2f6f] border-2 border-gray-200 hover:border-[#2c2f6f] hover:bg-[#f3f7fd] hover:shadow-md' // Not selected and not editing - normal
              }`}
              onClick={editing ? undefined : () => setSelectedStudentId(s.id)}
              disabled={editing}
              title={editing ? 'Cannot switch students while editing' : `Switch to ${s.firstName || s.name}`}
            >
              {/* Left side - Student Photo or Fallback Icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${selectedStudentId === s.id ? 'bg-white' : 'bg-[#2c2f6f]'}`}>
                {/* Debug logging for navigation tab photos */}
                {console.log(`Navigation tab photo for ${s.firstName || s.name}:`, {
                  stud_photo: s.stud_photo,
                  photo: s.photo,
                  final_photo: s.stud_photo || s.photo,
                  photo_url: getPhotoUrl(s.stud_photo || s.photo),
                  is_selected: selectedStudentId === s.id
                })}
                {s.stud_photo || s.photo ? (
                  <img
                    src={getPhotoUrl(s.stud_photo || s.photo)}
                    alt={`${s.firstName || s.name} photo`}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      console.log(`Photo failed to load for ${s.firstName || s.name}:`, s.stud_photo || s.photo); // Debug log
                      // Hide the broken image and show fallback icon
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                    onLoad={() => {
                      console.log(`Photo loaded successfully for ${s.firstName || s.name}:`, s.stud_photo || s.photo); // Debug log
                    }}
                  />
                ) : null}
                {/* Fallback icon that shows when no photo or photo fails to load */}
                <div className={`w-full h-full rounded-full flex items-center justify-center ${selectedStudentId === s.id ? 'bg-white' : 'bg-[#2c2f6f]'} ${s.stud_photo || s.photo ? 'hidden' : ''}`}>
                  <FaUser className={`w-3 h-3 ${selectedStudentId === s.id ? 'text-[#2c2f6f]' : 'text-white'}`} />
                </div>
              </div>
              
              {/* Right side - Student name and class level */}
              <div className="flex flex-col items-start text-left">
                <div className="font-semibold text-xs sm:text-sm leading-tight truncate max-w-[100px] sm:max-w-none">
                  {s.lastName ? `${s.lastName}, ${s.firstName} ${s.middleName || ''}`.trim() : s.name}
                </div>
                <div className="text-xs opacity-80 leading-tight truncate max-w-[100px] sm:max-w-none">
                  {s.levelName || 'Class N/A'}
                  {editing && selectedStudentId === s.id && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Currently Editing
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
      {/* Form Container with Fixed Height and Scrollable Content */}
      <div className="bg-white h-[calc(100vh-280px)] flex flex-col">
        {/* Form Header - Navy Blue */}
        <div className="bg-gradient-to-r from-[#2c2f6f] to-[#1E2A79] text-white px-6 py-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Sociodemographic Profile</h3>
          <p className="text-white/80 text-sm">View and edit student profile information</p>
        </div>
        
        {/* Scrollable Form Content */}
        <div 
          className="p-4 flex-1 overflow-y-auto custom-scrollbar"
          style={{
            scrollbarWidth: '33px',
            scrollbarColor: '#2c2f6f #f3f4f6'
          }}
        >
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 33px !important;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f3f4f6 !important;
              border-radius: 12px !important;
              margin: 4px 0;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background:rgb(54, 55, 65) !important;
              border-radius: 12px !important;
              border: 3px solid #f3f4f6 !important;
              min-height: 40px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background:rgb(76, 77, 85) !important;
            }
            .custom-scrollbar::-webkit-scrollbar-corner {
              background: #f3f4f6 !important;
            }
          `}</style>
          {/* Section 1: Basic Student Information - Always Visible */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-[#2c2f6f] mb-3 border-b border-gray-200 pb-2">Basic Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">First Name</label>
                <input type="text" name="firstName" value={editing ? (editStudentData?.firstName ?? '') : (studentData?.firstName || 'Not specified')} onChange={editing ? handleStudentChange : undefined} readOnly={!editing} className={`${getInputClassName('firstName', validationErrors, editing ? editStudentData?.firstName : studentData?.firstName, editing)} caret-[#1E2A79]`} />
                {validationErrors.firstName && <div className="text-red-500 text-xs mt-1">{validationErrors.firstName}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Middle Name</label>
                <input type="text" name="middleName" value={editing ? (editStudentData?.middleName ?? '') : (studentData?.middleName || 'Not specified')} onChange={editing ? handleStudentChange : undefined} readOnly={!editing} className={`${getInputClassName('middleName', validationErrors, editing ? editStudentData?.middleName : studentData?.middleName, editing)} caret-[#1E2A79]`} />
                {validationErrors.middleName && <div className="text-red-500 text-xs mt-1">{validationErrors.middleName}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Last Name</label>
                <input type="text" name="lastName" value={editing ? (editStudentData?.lastName ?? '') : (studentData?.lastName || 'Not specified')} onChange={editing ? handleStudentChange : undefined} readOnly={!editing} className={`${getInputClassName('lastName', validationErrors, editing ? editStudentData?.lastName : studentData?.lastName, editing)} caret-[#1E2A79]`} />
                {validationErrors.lastName && <div className="text-red-500 text-xs mt-1">{validationErrors.lastName}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Gender</label>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#2c2f6f]">
                  {['Male', 'Female'].map(option => (
                    <label key={option} className={`flex items-center gap-2 px-2 py-1 rounded-md border ${
                      (editing ? 'cursor-pointer' : 'cursor-default')
                    } ${
                      (editing ? 'border-gray-300' : 'border-transparent')
                    }`}>
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={editing ? editStudentData?.gender === option : studentData?.gender === option}
                        onChange={editing ? handleStudentChange : undefined}
                        readOnly={!editing}
                        disabled={!editing && !studentData?.gender}
                        className={(editing ? 'cursor-pointer' : 'cursor-default') + ' accent-[#2c2f6f]'}
                      />
                      {option}
                    </label>
                  ))}
                  {!editing && !studentData?.gender && <span className="text-xs text-gray-400 ml-2">Not specified</span>}
                  {validationErrors.gender && <div className="text-red-500 text-xs mt-1">{validationErrors.gender}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="user_birthdate"
                  value={editing ? (editStudentData?.user_birthdate ?? '') : (studentData?.user_birthdate ? studentData.user_birthdate.split('T')[0] : '')}
                  onChange={editing ? handleStudentChange : undefined}
                  readOnly={true}
                  disabled={true}
                  className="border w-full p-2 rounded transition-colors border-gray-300 bg-gray-100 cursor-not-allowed"
                  placeholder="Not specified"
                />
                {!editing && !studentData?.user_birthdate && <span className="text-xs text-gray-400">Not specified</span>}
                {validationErrors.user_birthdate && <div className="text-red-500 text-xs mt-1">{validationErrors.user_birthdate}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Enrollment Date</label>
                <input
                  type="date"
                  name="enrollmentDate"
                  value={editing ? (editStudentData?.enrollmentDate ?? '') : (studentData?.enrollmentDate ? studentData.enrollmentDate.split('T')[0] : '')}
                  onChange={editing ? handleStudentChange : undefined}
                  readOnly={!editing}
                  className={`${getInputClassName('enrollmentDate', validationErrors, editing ? editStudentData?.enrollmentDate : studentData?.enrollmentDate, editing)} caret-[#1E2A79]`}
                  placeholder="Not specified"
                />
                {!editing && !studentData?.enrollmentDate && <span className="text-xs text-gray-400">Not specified</span>}
                {validationErrors.enrollmentDate && <div className="text-red-500 text-xs mt-1">{validationErrors.enrollmentDate}</div>}
              </div>
            </div>
            
            {/* Session, Handedness, and Photo - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Session */}
              <div>
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Session</label>
                <input
                  type="text"
                  name="schedule"
                  value={studentData?.schedule || studentData?.scheduleClass || 'Not specified'}
                  readOnly={true}
                  disabled={true}
                  className="border w-full p-2 rounded transition-colors border-gray-300 bg-gray-100 cursor-not-allowed caret-[#1E2A79]"
                  placeholder="Not specified"
                />
                {!studentData?.schedule && !studentData?.scheduleClass && <span className="text-xs text-gray-400">Not specified</span>}
              </div>
              
              {/* Handedness - Mobile: Full width, Desktop: Normal */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Handedness</label>
                <div className="flex gap-4 sm:gap-6 text-sm text-[#2c2f6f] justify-center md:justify-start">
                  {['Right', 'Left'].map(option => (
                    <label key={option} className={`flex items-center gap-2 ${editing ? 'cursor-pointer' : 'cursor-default'}`}>
                      <input
                        type="radio"
                        name="handedness"
                        value={option}
                        checked={editing ? editStudentData?.handedness === option : studentData?.handedness === option}
                        onChange={editing ? handleStudentChange : undefined}
                        readOnly={!editing}
                        disabled={!editing && !studentData?.handedness}
                        className={`${editing ? 'cursor-pointer' : 'cursor-default'} w-4 h-4`}
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  ))}
                </div>
                {!editing && !studentData?.handedness && <span className="text-xs text-gray-400 text-center block mt-1">Not specified</span>}
                {validationErrors.handedness && <div className="text-red-500 text-xs mt-1 text-center md:text-left">{validationErrors.handedness}</div>}
              </div>
              
              {/* Photo - Mobile: Full width, Desktop: Normal */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-[#2c2f6f] mb-1 text-center md:text-left">Photo</label>
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  {/* Current Photo Display with Circular Dashed Border */}
                  <div className="flex-shrink-0 relative">
                    {/* Debug logging for photo fields */}
                    {console.log('Photo display debug:', {
                      editStudentData_photo: editStudentData?.stud_photo,
                      studentData_photo: studentData?.stud_photo,
                      editStudentData_photo_alt: editStudentData?.photo,
                      studentData_photo_alt: studentData?.photo,
                      final_photo: editStudentData?.stud_photo || studentData?.stud_photo || editStudentData?.photo || studentData?.photo,
                      selectedStudentId: selectedStudentId,
                      current_student_name: studentData?.firstName || studentData?.name
                    })}
                    {(selectedPhoto || studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo) ? (
                      <div className="relative">
                        <img
                          src={selectedPhotoBlobUrl || getPhotoUrl(studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo)}
                          alt="Current Profile"
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 ${editing ? 'cursor-pointer hover:border-blue-400 transition-colors' : ''}`}
                          onClick={editing ? handlePhotoClick : undefined}
                          onError={(e) => {
                            console.log('Current photo failed to load:', selectedPhotoBlobUrl ? 'selectedPhotoBlobUrl (cropped)' : (studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo)); // Debug log
                            console.log('Full photo URL:', selectedPhotoBlobUrl ? 'blob URL from selectedPhoto' : getPhotoUrl(studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo)); // Debug log
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                          onLoad={() => {
                            console.log('Current photo loaded successfully:', selectedPhotoBlobUrl ? 'selectedPhotoBlobUrl (cropped)' : (studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo)); // Debug log
                            console.log('Full photo URL:', selectedPhotoBlobUrl ? 'blob URL from selectedPhoto' : getPhotoUrl(studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo)); // Debug log
                          }}
                        />
                        {/* Fallback icon that shows when photo fails to load */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl sm:text-2xl shadow-sm border-2 border-blue-200 hidden">
                          <FaUser />
                        </div>
                         
                        {/* Circular Dashed Border */}
                        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full pointer-events-none"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div 
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl sm:text-2xl border-2 border-gray-200 ${editing ? 'cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors' : ''}`}
                          onClick={editing ? handleNoPhotoClick : undefined}
                        >
                          <FaUser />
                        </div>
                        {/* Circular Dashed Border */}
                        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full pointer-events-none"></div>
                      </div>
                    )}

                    {/* Crop indicator overlay for editing mode */}
                    {editing && (selectedPhoto || studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <FaCrop className="text-white text-xs sm:text-sm" />
                      </div>
                    )}

                    {/* Click to change overlay for editing mode */}
                    {editing && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="text-white text-xs text-center">
                          <div className="font-medium">Click to</div>
                          <div>Change Photo</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Status Label */}
                  <div className="text-center">
                    {selectedPhoto ? (
                      <div className="text-green-600">
                        <div className="font-medium text-xs sm:text-sm">Selected: {selectedPhoto.name}</div>
                        <div className="text-xs">Click photo to change or crop</div>
                      </div>
                    ) : (selectedPhoto || studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo) ? (
                      <div className="text-gray-600">
                        <div className="font-medium text-xs sm:text-sm">Current photo uploaded</div>
                        <div className={`text-xs ${editing ? 'text-blue-600' : 'text-gray-500'}`}>
                          {editing ? 'Click photo for options' : 'Photo uploaded'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="font-medium text-xs sm:text-sm">No photo uploaded</div>
                        <div className={`text-xs ${editing ? 'text-blue-600' : 'text-gray-400'}`}>
                          {editing ? 'Click photo to upload your first photo' : 'No photo'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Instructions - Hidden on mobile to save space */}
                  {editing && (
                    <div className="text-center hidden sm:block">
                      <div className="text-xs text-gray-500 mb-2">
                        Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
                      </div>
                      {(selectedPhoto || studentData?.stud_photo || studentData?.photo || editStudentData?.stud_photo || editStudentData?.photo) && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          💡 <strong>Tip:</strong> Click on your current photo to crop/resize it
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {editing && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        openCropModal(file);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>



          {/* Section 3: Parent Details - Requires Scrolling */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-[#2c2f6f] mb-3 border-b border-gray-200 pb-2">Parent Information</h4>
            {/* Father's Details */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-[#2c2f6f] mb-2">Father's Details</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Father's Name</label>
                  <input type="text" name="father_name" value={editing ? (editParentProfile?.father_name ?? '') : (parentProfile?.father_name || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('father_name', validationErrors, editing ? editParentProfile?.father_name : parentProfile?.father_name, editing)} caret-[#1E2A79]`} />
                  {validationErrors.father_name && <div className="text-red-500 text-xs mt-1">{validationErrors.father_name}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Age</label>
                  <input type="number" min="18" max="100" name="father_age" value={editing ? (editParentProfile?.father_age ?? '') : (parentProfile?.father_age || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('father_age', validationErrors, editing ? editParentProfile?.father_age : parentProfile?.father_age, editing)} caret-[#1E2A79]`} />
                  {validationErrors.father_age && <div className="text-red-500 text-xs mt-1">{validationErrors.father_age}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Occupation</label>
                  <input type="text" name="father_occupation" value={editing ? (editParentProfile?.father_occupation ?? '') : (parentProfile?.father_occupation || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('father_occupation', validationErrors, editing ? editParentProfile?.father_occupation : parentProfile?.father_occupation, editing)} caret-[#1E2A79]`} />
                  {validationErrors.father_occupation && <div className="text-red-500 text-xs mt-1">{validationErrors.father_occupation}</div>}
                </div>
              </div>
            </div>
            {/* Mother's Details */}
            <div>
              <h5 className="text-sm font-semibold text-[#2c2f6f] mb-2">Mother's Details</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Mother's Name</label>
                  <input type="text" name="mother_name" value={editing ? (editParentProfile?.mother_name ?? '') : (parentProfile?.mother_name || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('mother_name', validationErrors, editing ? editParentProfile?.mother_name : parentProfile?.mother_name, editing)} caret-[#1E2A79]`} />
                  {validationErrors.mother_name && <div className="text-red-500 text-xs mt-1">{validationErrors.mother_name}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Age</label>
                  <input type="number" min="18" max="100" name="mother_age" value={editing ? (editParentProfile?.mother_age ?? '') : (parentProfile?.mother_age || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('mother_age', validationErrors, editing ? editParentProfile?.mother_age : parentProfile?.mother_age, editing)} caret-[#1E2A79]`} />
                  {validationErrors.mother_age && <div className="text-red-500 text-xs mt-1">{validationErrors.mother_age}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2c2f6f] mb-1">Occupation</label>
                  <input type="text" name="mother_occupation" value={editing ? (editParentProfile?.mother_occupation ?? '') : (parentProfile?.mother_occupation || 'Not specified')} onChange={editing ? handleParentChange : undefined} readOnly={!editing} className={`${getInputClassName('mother_occupation', validationErrors, editing ? editParentProfile?.mother_occupation : parentProfile?.mother_occupation, editing)} caret-[#1E2A79]`} />
                  {validationErrors.mother_occupation && <div className="text-red-500 text-xs mt-1">{validationErrors.mother_occupation}</div>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom spacing to ensure proper separation from action buttons */}
          <div className="h-4"></div>
        </div>
        
        {/* Action Buttons - Fixed at Bottom */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
          {!editing ? (
            <button 
              className="px-6 py-2 bg-[#2c2f6f] text-white rounded-lg font-semibold hover:bg-[#1E2A79] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm flex items-center gap-2" 
              onClick={handleEdit} 
              type="button"
              disabled={studentLoading}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" 
                onClick={handleCancel} 
                type="button"
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-[#2c2f6f] text-white rounded-lg font-semibold hover:bg-[#1E2A79] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm" 
                onClick={handleSave} 
                type="button" 
                disabled={!isFormValid}
              >
                Save Changes
              </button>
            </>
          )}
        </div>

        {/* Photo Selection Menu */}
        {showPhotoMenu && (
          <div className="fixed inset-0 z-40" onClick={closePhotoMenu}>
            <div 
              className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50"
              style={{
                left: photoMenuPosition.x - 80,
                top: photoMenuPosition.y
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(editStudentData?.stud_photo || studentData?.stud_photo || editStudentData?.photo || studentData?.photo) && (
                <button
                  onClick={() => handlePhotoMenuSelect('crop')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaCrop className="text-gray-500" />
                  Crop Current Photo
                </button>
              )}
              <button
                onClick={() => handlePhotoMenuSelect('upload')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaEdit className="text-gray-500" />
                Upload New Photo
              </button>
            </div>
          </div>
        )}

        {/* Photo Cropping Modal */}
        {showCropModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-lg p-3 sm:p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4 bg-[#232c67] text-white p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold">Crop & Resize Photo</h3>
              </div>

              {/* Cropping Area and Controls - Responsive Layout */}
              <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Cropping Area - Responsive */}
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  <div
                    className="crop-container relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] lg:h-[400px] lg:w-[400px] flex items-center justify-center cursor-crosshair select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ touchAction: 'none' }} // Prevent default touch behaviors
                    ref={(el) => {
                      if (el) {
                        // Add touch event listeners with passive: false to allow preventDefault
                        el.addEventListener('touchstart', handleTouchStart, { passive: false });
                        el.addEventListener('touchmove', handleTouchMove, { passive: false });
                        el.addEventListener('touchend', handleTouchEnd, { passive: false });
                        
                        // Cleanup function
                        return () => {
                          el.removeEventListener('touchstart', handleTouchStart);
                          el.removeEventListener('touchmove', handleTouchMove);
                          el.removeEventListener('touchend', handleTouchEnd);
                        };
                      }
                    }}
                  >
                    <img
                      src={cropImage}
                      alt="Crop preview"
                      className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] lg:w-[350px] lg:h-[350px] object-contain"
                      style={{
                        transform: `scale(${cropData.scale}) rotate(${cropData.rotate}deg)`,
                        transformOrigin: 'center'
                      }}
                    />

                    {/* Circular Crop Selection */}
                    <div
                      className="absolute border-2 border-black bg-black bg-opacity-20 rounded-full pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius}px`,
                        top: `${cropData.centerY - cropData.radius}px`,
                        width: `${cropData.radius * 2}px`,
                        height: `${cropData.radius * 2}px`
                      }}
                    />
                    
                    {/* Debug: Show crop area coordinates */}

                    {/* Center Point */}
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-white border-2 border-black rounded-full pointer-events-none"
                      style={{
                        left: `${cropData.centerX - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />

                    {/* Resize Handle (Outer Ring) - Larger on mobile for better touch */}
                    <div
                      className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500 border-2 border-white rounded-full cursor-nw-resize"
                      style={{
                        left: `${cropData.centerX + cropData.radius - (window.innerWidth < 640 ? 12 : 16)}px`,
                        top: `${cropData.centerY - (window.innerWidth < 640 ? 12 : 16)}px`
                      }}
                    />

                    {/* Bounding Box - Bright Cyan Square */}
                    <div
                      className="absolute border-2 border-cyan-500 border-dashed pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius}px`,
                        top: `${cropData.centerY - cropData.radius}px`,
                        width: `${cropData.radius * 2}px`,
                        height: `${cropData.radius * 2}px`
                      }}
                    />

                    {/* Corner Control Points - Bright Cyan */}
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />

                    {/* Midpoint Control Points - Bright Cyan */}
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY + cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                    <div
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - (window.innerWidth < 640 ? 4 : 6)}px`,
                        top: `${cropData.centerY - (window.innerWidth < 640 ? 4 : 6)}px`
                      }}
                    />
                  </div>
                </div>

                {/* Right Side Controls - Responsive */}
                <div className="flex-1 space-y-3 sm:space-y-4 lg:space-y-6">
                  {/* Row 1: How to Crop Info - Mobile and Desktop versions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-blue-800 mb-2">💡 How to crop:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className="hidden sm:block">• <strong>Drag the center</strong> of the black circle to move it anywhere on the image</li>
                      <li className="sm:hidden">• <strong>Touch and drag the center</strong> of the black circle to move it</li>
                      <li className="hidden sm:block">• <strong>Drag the outer edge</strong> of the black circle to resize it</li>
                      <li className="sm:hidden">• <strong>Touch and drag the cyan handle</strong> on the edge to resize</li>
                      <li>• <strong>Bright cyan control points</strong> show the bounding box and resize handles</li>
                      <li className="sm:hidden">• <strong>Use quick presets below</strong> for common sizes</li>
                    </ul>
                  </div>

                  {/* Row 2: Center X, Y, Radius - Responsive Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Center X</div>
                      <div className="text-sm sm:text-xl font-semibold text-gray-800">{Math.round(cropData.centerX)}px</div>
                    </div>
                    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Center Y</div>
                      <div className="text-sm sm:text-xl font-semibold text-gray-800">{Math.round(cropData.centerY)}px</div>
                    </div>
                    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Radius</div>
                      <div className="text-sm sm:text-xl font-semibold text-gray-800">{Math.round(cropData.radius)}px</div>
                    </div>
                  </div>
                  

                  {/* Row 3: Quick Presets - Responsive */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 105, centerX: 200, centerY: 200 }))}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        210×210
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 125, centerX: 200, centerY: 200 }))}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gray-200 rounded border text-center"
                      >
                        250×250
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 145, centerX: 200, centerY: 200 }))}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        290×290
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 165, centerX: 200, centerY: 200 }))}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        330×330
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  onClick={cancelCrop}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 order-2 sm:order-1"
                >
                  <FaUndo className="text-sm" />
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  className="px-4 py-2 bg-[#2c2f6f] text-white rounded-lg font-medium hover:bg-[#1a1f4d] transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <FaCheck className="text-sm" />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;
