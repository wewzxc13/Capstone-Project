"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaPhone, FaEnvelope, FaArrowLeft, FaTimes, FaEdit, FaArchive, FaPlus, FaCheckCircle, FaExclamationCircle, FaChild } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import fullAddress from '../../../../data/full_misamis_oriental_psgc.json';
import { API } from '@/config/api';

const OTP_TIMEOUT = 180; // 3 minutes in seconds
const OTP_EXP_KEY = "otp_expiration";

// --- VALIDATION LOGIC (copied and adapted from AddUser/ViewOwnUser) ---
const validators = {
  name: (value) => {
    if (!value) return { isValid: false, message: "" };
    const nameRegex = /^([A-Z][a-zA-Z]*)(\s[A-Z][a-zA-Z]*)*$/;
    if (!nameRegex.test(value)) {
      return { isValid: false, message: "Each word must start with a capital letter, only letters and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Name must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },
  middleName: (value) => {
    if (!value) return { isValid: true, message: "" };
    const nameRegex = /^([A-Z][a-zA-Z]*)(\s[A-Z][a-zA-Z]*)*$/;
    if (!nameRegex.test(value)) {
      return { isValid: false, message: "Each word must start with a capital letter, only letters and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Name must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },
  email: (value) => {
    if (!value) return { isValid: false, message: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message: "Email must be a valid email address" };
    }
    return { isValid: true, message: "" };
  },
  contact: (value) => {
    if (!value) return { isValid: false, message: "" };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('09')) {
      return { isValid: true, message: "" };
    } else if (digits.length === 10 && digits.startsWith('9')) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "Enter a valid Philippine mobile number (e.g., 09123456789)" };
    }
    return { isValid: true, message: "" };
  },
  tin: (value) => {
    if (!value) return { isValid: true, message: "" };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 9) {
      return { isValid: true, message: "" };
    } else if (digits.length === 12) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "TIN must be 9 digits (###-###-###) or 12 digits for branches (###-###-###-###)" };
    }
    return { isValid: true, message: "" };
  },
  sss: (value) => {
    if (!value) return { isValid: true, message: "" };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "SSS must be 10 digits (##-#######-#)" };
    }
    return { isValid: true, message: "" };
  },
  pagibig: (value) => {
    if (!value) return { isValid: true, message: "" };
    const digits = value.replace(/\D/g, '');
    if (digits.length === 12) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "Pagibig must be 12 digits (123456789123 or 1234-5678-9123)" };
    }
    return { isValid: true, message: "" };
  },
  dob: (value) => {
    if (!value) return { isValid: false, message: "" };
    const birthDate = new Date(value);
    const today = new Date();
    birthDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (birthDate > today) {
      return { isValid: false, message: "Date of birth cannot be in the future" };
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    if (actualAge < 18) {
      return { isValid: false, message: "Must be 18 years or older" };
    }
    return { isValid: true, message: "" };
  },
  studentDob: (value, ageRequirements) => {
    if (!value) return { isValid: false, message: "" };
    
    // If age requirements not loaded yet, use fallback
    if (!ageRequirements || !ageRequirements.levels) {
      return { isValid: false, message: "Age requirements are loading. Please wait." };
    }
    
    const birthDate = new Date(value);
    if (isNaN(birthDate.getTime())) {
      return { isValid: false, message: "Invalid date format" };
    }
    
    // Use dynamic reference date from age requirements
    const referenceDate = new Date(ageRequirements.reference_date);
    
    // Calculate the difference in milliseconds and convert to years/months
    const timeDiff = referenceDate.getTime() - birthDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Convert to years and months
    const years = Math.floor(daysDiff / 365.25);
    const remainingDays = daysDiff % 365.25;
    const months = Math.floor(remainingDays / 30.44);
    
    const age = years + months / 12;
    
    // Use dynamic level date ranges from age requirements
    const levelDateRanges = {
      1: { 
        start: new Date(ageRequirements.levels[1].start_date), 
        end: new Date(ageRequirements.levels[1].end_date) 
      },
      2: { 
        start: new Date(ageRequirements.levels[2].start_date), 
        end: new Date(ageRequirements.levels[2].end_date) 
      },
      3: { 
        start: new Date(ageRequirements.levels[3].start_date), 
        end: new Date(ageRequirements.levels[3].end_date) 
      },
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
      const ageYears = Math.floor(age);
      const ageMonths = Math.floor((age - ageYears) * 12);
      const ageDisplay = ageMonths > 0 ? `${ageYears} years, ${ageMonths} months` : `${ageYears} years`;
      return { isValid: false, message: `Only students aged 1.8, 3, or 4 are allowed. Given age: ${ageDisplay} (${age.toFixed(1)} years)` };
    }
    
    // Get the date range for the determined level
    const range = levelDateRanges[levelId];
    
    // Check if birthdate falls within the valid range for the level
    const birthDateStr = birthDate.toISOString().split('T')[0];
    const rangeStartStr = range.start.toISOString().split('T')[0];
    const rangeEndStr = range.end.toISOString().split('T')[0];
    
    if (birthDateStr < rangeStartStr || birthDateStr > rangeEndStr) {
      const levelInfo = ageRequirements.levels[levelId];
      return { 
        isValid: false, 
        message: `Birthdate must be between ${levelInfo.start_date_formatted} and ${levelInfo.end_date_formatted} for Level ${levelId} (${levelInfo.name})` 
      };
    }
    
    return { isValid: true, message: "" };
  },
  barangay: (value) => {
    if (!value) return { isValid: false, message: "" };
    const barangayRegex = /^[A-Z][a-zA-Z0-9\s]*$/;
    if (!barangayRegex.test(value)) {
      return { isValid: false, message: "First letter must be capital, letters, numbers and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Barangay must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },
  required: (value) => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "" };
    }
    return { isValid: true, message: "" };
  }
};
// --- END VALIDATION LOGIC ---

// Add capitalizeWords helper at the top (after validators)
function capitalizeWords(str) {
  return str.replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

// Format phone number for display: +63 920 384 7563 (simple format)
function formatPhoneForDisplay(phoneNumber) {
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
}

// Format phone number for input field: +63 920 384 7563 (with +63 prefix)
function formatPhoneForInput(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats and convert to 10-digit format
  let cleanDigits = '';
  if (digits.startsWith('009')) {
    cleanDigits = digits.substring(3);
  } else if (digits.startsWith('09')) {
    cleanDigits = digits.substring(1); // Remove 0 to get 9XXXXXXXXX
  } else if (digits.startsWith('9')) {
    cleanDigits = digits;
  } else {
    cleanDigits = digits;
  }
  
  // Limit to 10 digits
  cleanDigits = cleanDigits.substring(0, 10);
  
  // Format as +63 XXX XXX XXXX (3-3-4)
  let formatted = '+63 ';
  if (cleanDigits.length > 0) formatted += cleanDigits.substring(0, Math.min(3, cleanDigits.length));
  if (cleanDigits.length > 3) formatted += ' ' + cleanDigits.substring(3, Math.min(6, cleanDigits.length));
  if (cleanDigits.length > 6) formatted += ' ' + cleanDigits.substring(6, Math.min(10, cleanDigits.length));
  
  return formatted;
}

// Convert formatted input back to digits
function unformatPhoneInput(formattedInput) {
  if (!formattedInput) return '';
  
  // Remove all non-digits
  const digits = formattedInput.replace(/\D/g, '');
  
  // Limit to 10 digits
  return digits.substring(0, 10);
}

export default function ViewUserPage() {
  // View and edit user/student details
  // - Archive button is disabled for teachers currently assigned to a class
  // - Teachers must be unassigned from their class before they can be archived
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const role = searchParams.get("role") || "Teacher";
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [originalData, setOriginalData] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== "undefined") {
      const exp = localStorage.getItem(OTP_EXP_KEY);
      if (exp) {
        const now = Date.now();
        const diff = Math.floor((parseInt(exp) - now) / 1000);
        return diff > 0 ? diff : 0;
      }
    }
    return OTP_TIMEOUT;
  });
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef();
  const [hasMounted, setHasMounted] = useState(false);
  const [assignedClassName, setAssignedClassName] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [addressData, setAddressData] = useState({
    countries: [],
    provinces: [],
    cities: {},
    barangays: {}
  });
  
  // Student form states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: '',
    handedness: '',
    class_schedule: '',
    enrollment_date: new Date().toISOString().split('T')[0],
  });
  const [studentValidationErrors, setStudentValidationErrors] = useState({});
  const [isStudentFormValid, setIsStudentFormValid] = useState(false);
  const [isManualLevel, setIsManualLevel] = useState(false);
  const [manualLevelId, setManualLevelId] = useState(null);
  const [studNotes, setStudNotes] = useState('');
  const [ageRequirements, setAgeRequirements] = useState(null);
  const [loadingAgeRequirements, setLoadingAgeRequirements] = useState(true);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);

  // Fetch user or student data on mount
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    let url = "";
    let body = {};
    if (role === "Student") {
      url = API.user.getStudentDetails();
      body = { student_id: userId };
    } else {
      url = API.user.getUserDetails();
      body = { user_id: userId };
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.status === "success") {
          const userOrStudent = data.user || data.student;
          
          if (role === "Student") {
            // Map backend student fields to frontend keys for consistency
            const levelId = userOrStudent.levelId || userOrStudent.level_id || "";
            
            // Check if student is assigned to an advisory
            let className = "Not assigned yet";
            try {
              const advisoryResponse = await fetch(API.advisory.getAdvisoryDetails(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: userId }),
              });
              const advisoryData = await advisoryResponse.json();
              
              if (advisoryData.advisory && advisoryData.advisory.level_id) {
                // Student is assigned to an advisory, get the class name
                className = getClassName(advisoryData.advisory.level_id);
              }
            } catch (error) {
              console.error("Error checking advisory assignment:", error);
              className = "Not assigned yet";
            }
            
            setFormData({
              firstName: userOrStudent.firstName || userOrStudent.stud_firstname || "",
              middleName: userOrStudent.middleName || userOrStudent.stud_middlename || "",
              lastName: userOrStudent.lastName || userOrStudent.stud_lastname || "",
              gender: userOrStudent.gender || userOrStudent.stud_gender || "",
              handedness: userOrStudent.handedness || userOrStudent.stud_handedness || "",
              class_schedule: userOrStudent.class_schedule || userOrStudent.scheduleClass || userOrStudent.stud_schedule_class || "",
              user_birthdate: userOrStudent.user_birthdate || userOrStudent.stud_birthdate || "",
              enrollmentDate: userOrStudent.enrollmentDate || userOrStudent.stud_enrollment_date || "",
              photo: userOrStudent.photo || userOrStudent.stud_photo || "",
              schoolStatus: userOrStudent.schoolStatus || userOrStudent.stud_school_status || "",
              levelId: levelId,
              className: className,
              parentId: userOrStudent.parentId || userOrStudent.parent_id || "",
              parentProfileId: userOrStudent.parentProfileId || userOrStudent.parent_profile_id || "",
              id: userOrStudent.id || userOrStudent.student_id,
              role: "Student",
              city_municipality: userOrStudent.city_municipality || userOrStudent.city || userOrStudent.municipality_city || "",
              stud_notes: userOrStudent.stud_notes || userOrStudent.studNotes || "",
            });
            setOriginalData({
              firstName: userOrStudent.firstName || userOrStudent.stud_firstname || "",
              middleName: userOrStudent.middleName || userOrStudent.stud_middlename || "",
              lastName: userOrStudent.lastName || userOrStudent.stud_lastname || "",
              gender: userOrStudent.gender || userOrStudent.stud_gender || "",
              handedness: userOrStudent.handedness || userOrStudent.stud_handedness || "",
              class_schedule: userOrStudent.class_schedule || userOrStudent.scheduleClass || userOrStudent.stud_schedule_class || "",
              user_birthdate: userOrStudent.user_birthdate || userOrStudent.stud_birthdate || "",
              enrollmentDate: userOrStudent.enrollmentDate || userOrStudent.stud_enrollment_date || "",
              photo: userOrStudent.photo || userOrStudent.stud_photo || "",
              schoolStatus: userOrStudent.schoolStatus || userOrStudent.stud_school_status || "",
              levelId: levelId,
              className: className,
              parentId: userOrStudent.parentId || userOrStudent.parent_id || "",
              parentProfileId: userOrStudent.parentProfileId || userOrStudent.parent_profile_id || "",
              id: userOrStudent.id || userOrStudent.student_id,
              role: "Student",
              city_municipality: userOrStudent.city_municipality || userOrStudent.city || userOrStudent.municipality_city || "",
              stud_notes: userOrStudent.stud_notes || userOrStudent.studNotes || "",
            });
          } else {
            setFormData({
              ...userOrStudent,
              city_municipality: userOrStudent.city_municipality || userOrStudent.city || userOrStudent.municipality_city || "",
              country: userOrStudent.country || "",
            });
            setOriginalData(userOrStudent);
          }
        } else {
          setError(data.message || "User not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch user data");
        setLoading(false);
      });
  }, [userId, role]);

  // Start/restart timer
  useEffect(() => {
    if (timeLeft > 0) {
      setCanResend(false);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    if (formData && formData.role === "Teacher" && formData.id) {
      fetch(API.advisory.getAdvisoryDetails(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: formData.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.advisory && data.advisory.level_id) {
            // Map level_id to class name and age group
            let className = "";
            switch (parseInt(data.advisory.level_id)) {
              case 1:
                className = "Discoverer - 2 yrs";
                break;
              case 2:
                className = "Explorer - 3 yrs";
                break;
              case 3:
                className = "Adventurer - 4 yrs";
                break;
              default:
                className = "Not assigned";
            }
            setAssignedClassName(className);
          } else {
            setAssignedClassName("Not assigned");
          }
        })
        .catch(() => setAssignedClassName("Not assigned"));
    }
  }, [formData]);

  useEffect(() => {
    // PSGC address data setup (same as AddUser)
    const parsed = { countries: [], provinces: [], cities: {}, barangays: {} };
    const country = "Philippines";
    const provinces = fullAddress[country];
    parsed.countries.push(country);
    for (const provinceKey in provinces) {
      const [provName, provCode] = provinceKey.split('‑');
      parsed.provinces.push({ name: provName, code: provCode });
      parsed.cities[provCode] = [];
      const cities = provinces[provinceKey];
      for (const cityKey in cities) {
        const [cityName, cityCode] = cityKey.split('‑');
        parsed.cities[provCode].push({ name: cityName, code: cityCode });
        parsed.barangays[cityCode] = Object.keys(cities[cityKey]).map(brgyKey => {
          const [brgyName, brgyCode] = brgyKey.split('‑');
          return { name: brgyName, code: brgyCode };
        });
      }
    }
    setAddressData(parsed);
  }, []);

  // Fetch dynamic age requirements on component mount
  useEffect(() => {
    const fetchAgeRequirements = async () => {
      try {
        setLoadingAgeRequirements(true);
        const response = await fetch(API.user.getStudentAgeRequirements());
        const data = await response.json();
        
        if (data.status === 'success') {
          setAgeRequirements(data);
        } else {
          toast.error("Failed to load age requirements. Using default values.");
          // Fallback to default values
          setAgeRequirements({
            reference_date: "2025-08-04",
            reference_date_formatted: "August 4, 2025",
            levels: {
              1: {
                name: "Discoverer",
                age_range: "1.8-3 years",
                start_date: "2022-08-05",
                end_date: "2023-11-04",
                start_date_formatted: "Aug 5, 2022",
                end_date_formatted: "Nov 4, 2023"
              },
              2: {
                name: "Explorer",
                age_range: "3-4 years",
                start_date: "2021-08-05",
                end_date: "2022-08-04",
                start_date_formatted: "Aug 5, 2021",
                end_date_formatted: "Aug 4, 2022"
              },
              3: {
                name: "Adventurer",
                age_range: "4-5 years",
                start_date: "2020-08-05",
                end_date: "2021-08-04",
                start_date_formatted: "Aug 5, 2020",
                end_date_formatted: "Aug 4, 2021"
              }
            }
          });
        }
      } catch (error) {
        console.error("Error fetching age requirements:", error);
        toast.error("Failed to load age requirements. Using default values.");
        setAgeRequirements({
          reference_date: "2025-08-04",
          reference_date_formatted: "August 4, 2025",
          levels: {
            1: {
              name: "Discoverer",
              age_range: "1.8-3 years",
              start_date: "2022-08-05",
              end_date: "2023-11-04",
              start_date_formatted: "Aug 5, 2022",
              end_date_formatted: "Nov 4, 2023"
            },
            2: {
              name: "Explorer",
              age_range: "3-4 years",
              start_date: "2021-08-05",
              end_date: "2022-08-04",
              start_date_formatted: "Aug 5, 2021",
              end_date_formatted: "Aug 4, 2022"
            },
            3: {
              name: "Adventurer",
              age_range: "4-5 years",
              start_date: "2020-08-05",
              end_date: "2021-08-04",
              start_date_formatted: "Aug 5, 2020",
              end_date_formatted: "Aug 4, 2021"
            }
          }
        });
      } finally {
        setLoadingAgeRequirements(false);
      }
    };
    
    fetchAgeRequirements();
  }, []);

  // Function to determine level from birthdate or manual selection
  const getCurrentLevel = () => {
    if (!studentFormData.dob) return null;
    
    // Check manual level first
    if (isManualLevel && manualLevelId) {
      return manualLevelId;
    }
    
    // Otherwise calculate from birthdate
    if (studentFormData.dob && ageRequirements) {
      const referenceDate = new Date(ageRequirements.reference_date);
      const birthDate = new Date(studentFormData.dob);
      const timeDiff = referenceDate.getTime() - birthDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const years = Math.floor(daysDiff / 365.25);
      const remainingDays = daysDiff % 365.25;
      const months = Math.floor(remainingDays / 30.44);
      const age = years + months / 12;
      
      if (age >= 1.8 && age < 3) return 1;
      if (age >= 3 && age < 4) return 2;
      if (age >= 4 && age < 5) return 3;
    }
    return null;
  };

  // Fetch available slots when level is determined
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const levelId = getCurrentLevel();
      
      if (!levelId) {
        setAvailableSlots(null);
        return;
      }
      
      try {
        setLoadingSlots(true);
        const response = await fetch(API.user.getAvailableSlots(levelId));
        const data = await response.json();
        
        if (data.status === 'success' && data.slots) {
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots(null);
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        setAvailableSlots(null);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    if (showAddStudentModal) {
      fetchAvailableSlots();
    }
  }, [showAddStudentModal, studentFormData.dob, isManualLevel, manualLevelId, ageRequirements]);

  // Helper function to calculate level_id based on birthdate (same logic as AddUser)
  const calculateLevelId = (birthdate) => {
    if (!birthdate || !ageRequirements) return null;
    
    // Use dynamic reference date from age requirements
    const referenceDate = new Date(ageRequirements.reference_date);
    const birthDate = new Date(birthdate);
    
    if (isNaN(birthDate.getTime()) || isNaN(referenceDate.getTime())) {
      return null;
    }
    
    // Calculate age the same way as AddUser
    const timeDiff = referenceDate.getTime() - birthDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const years = Math.floor(daysDiff / 365.25);
    const remainingDays = daysDiff % 365.25;
    const months = Math.floor(remainingDays / 30.44);
    const age = years + months / 12;
    
    // Determine level based on age
    let levelId = null;
    if (age >= 1.8 && age < 3) {
      levelId = 1; // Discoverer
    } else if (age >= 3 && age < 4) {
      levelId = 2; // Explorer
    } else if (age >= 4 && age < 5) {
      levelId = 3; // Adventurer
    }
    
    return levelId;
  };

  function validateField(name, value, role) {
    if (role === "Student") {
      if (["firstName", "lastName"].includes(name)) return validators.name(value);
      if (name === "middleName") return validators.middleName(value);
      if (name === "dob" || name === "user_birthdate") {
        // Skip age validation if student has notes (manual assignment/special case)
        const hasNotes = formData?.stud_notes && formData.stud_notes.trim() !== "";
        if (hasNotes) {
          // Only validate that DOB is provided, skip age validation
          if (!value) return { isValid: false, message: "Date of birth is required" };
          return { isValid: true, message: "" };
        }
        // Normal age validation if no notes
        return validators.studentDob(value, ageRequirements);
      }
      if (["gender", "class_schedule"].includes(name)) return validators.required(value);
      return { isValid: true, message: "" };
    } else {
      if (["firstName", "lastName"].includes(name)) return validators.name(value);
      if (name === "middleName") return validators.middleName(value);
      if (name === "user_birthdate" || name === "dob") return validators.dob(value);
      if (name === "email") return validators.email(value);
      if (name === "contactNo" || name === "contact") return validators.contact(value);
      if (["country", "provinceCode", "cityCode", "barangay", "province", "city"].includes(name)) return validators.required(value);
      if (name === "tin_number") return validators.tin(value);
      if (name === "sss_number") return validators.sss(value);
      if (name === "pagibig_number") return validators.pagibig(value);
      return { isValid: true, message: "" };
    }
  }

  function validateForm(newFormData = formData, role = (formData && formData.role) || "") {
    if (!newFormData) return;
    const errors = {};
    if (role === "Student") {
      ["firstName", "middleName", "lastName", "gender", "class_schedule"].forEach(field => {
        const validation = validateField(field, newFormData[field], role);
        if (!validation.isValid) errors[field] = validation.message;
      });
      // Check if student has notes (manual assignment/special case) - skip age validation if yes
      const hasNotes = newFormData?.stud_notes && newFormData.stud_notes.trim() !== "";
      if (hasNotes) {
        // Only validate that DOB is provided, skip age validation
        if (!newFormData.user_birthdate) {
          errors.user_birthdate = "Date of birth is required";
        }
      } else {
        // Normal age validation if no notes
        const dobValidation = validators.studentDob(newFormData.user_birthdate, ageRequirements);
      if (!dobValidation.isValid) errors.user_birthdate = dobValidation.message;
      }
    } else {
      ["firstName", "middleName", "lastName", "user_birthdate", "email", "country", "province", "city", "barangay"].forEach(field => {
        const validation = validateField(field, newFormData[field], role);
        if (!validation.isValid) errors[field] = validation.message;
      });
      const contactValidation = validateField("contactNo", newFormData.contactNo, role);
      if (!contactValidation.isValid) errors.contactNo = contactValidation.message;
      if (role === "Admin" || role === "Teacher") {
        ["tin_number", "sss_number", "pagibig_number"].forEach(field => {
          const validation = validateField(field, newFormData[field], role);
          if (!validation.isValid) errors[field] = validation.message;
        });
      }
    }
    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }

  useEffect(() => {
    if (isEditing && formData) validateForm(formData, formData.role);
    // eslint-disable-next-line
  }, [formData, isEditing, ageRequirements]);

  // Student form validation
  const validateStudentForm = () => {
    const errors = {};
    
    ['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule'].forEach(field => {
      const validation = validateStudentField(field, studentFormData[field]);
      if (!validation.isValid) {
        errors[field] = validation.message;
      }
    });
    
    // Special validation for student date of birth - skip if manual level is selected
    if (!isManualLevel) {
      const dobValidation = validators.studentDob(studentFormData.dob, ageRequirements);
      if (!dobValidation.isValid) {
        errors.dob = dobValidation.message;
      }
    } else {
      // When manual level is selected, still validate that DOB is provided
      if (!studentFormData.dob) {
        errors.dob = "Date of birth is required";
      }
      // Validate manual level selection
      if (!manualLevelId) {
        errors.manualLevel = "Please select a class level";
      }
      if (!studNotes || studNotes.trim() === '') {
        errors.studNotes = "Notes are required when manually assigning a class level";
      }
    }
    
    setStudentValidationErrors(errors);
    setIsStudentFormValid(Object.keys(errors).length === 0);
  };

  const validateStudentField = (name, value) => {
    switch (name) {
      case 'first_name':
      case 'last_name':
        return validators.name(value);
      case 'middle_name':
        return validators.middleName(value);
      case 'gender':
      case 'class_schedule':
        return validators.required(value);
      default:
        return { isValid: true, message: "" };
    }
  };

  useEffect(() => {
    if (showAddStudentModal) {
      validateStudentForm();
    }
  }, [studentFormData, showAddStudentModal, isManualLevel, manualLevelId, studNotes, ageRequirements]);

  // Student form change handler
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-capitalize first letter for names
    if (["first_name", "middle_name", "last_name"].includes(name)) {
      if (value.length > 0) {
        processedValue = capitalizeWords(value);
      }
    }

    setStudentFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear validation error for this field
    setStudentValidationErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[name]) {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  // Handle Add Student button click
  const handleAddStudentClick = () => {
    // Reset student form
    setStudentFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      dob: '',
      gender: '',
      handedness: '',
      class_schedule: '',
      enrollment_date: new Date().toISOString().split('T')[0],
    });
    setIsManualLevel(false);
    setManualLevelId(null);
    setStudNotes('');
    setStudentValidationErrors({});
    setShowAddStudentModal(true);
  };

  // Handle Close Student Modal
  const handleCloseStudentModal = () => {
    setShowAddStudentModal(false);
    setStudentFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      dob: '',
      gender: '',
      handedness: '',
      class_schedule: '',
      enrollment_date: new Date().toISOString().split('T')[0],
    });
    setIsManualLevel(false);
    setManualLevelId(null);
    setStudNotes('');
    setStudentValidationErrors({});
  };

  // Handle Add Student Submit
  const handleAddStudentSubmit = async () => {
    if (!isStudentFormValid) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    // Check if manual level is selected and required fields are filled
    if (isManualLevel) {
      if (!manualLevelId) {
        toast.error("Please select a class level when using manual assignment.");
        return;
      }
      if (!studNotes || studNotes.trim() === '') {
        toast.error("Please provide notes explaining why this student is manually assigned to this level.");
        return;
      }
    }

    setAddingStudent(true);

    try {
      // Get parent_id and parent_profile_id from formData
      const parentId = formData?.id || userId;
      const parentProfileId = formData?.parent_profile_id || formData?.parentProfileId || null;

      // Use manual level if selected, otherwise calculate from age
      let levelId = null;
      
      if (isManualLevel && manualLevelId) {
        levelId = manualLevelId;
      } else if (ageRequirements && studentFormData.dob) {
        // Calculate level based on age
        const referenceDate = new Date(ageRequirements.reference_date);
        const birthDate = new Date(studentFormData.dob);
        const timeDiff = referenceDate.getTime() - birthDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const years = Math.floor(daysDiff / 365.25);
        const remainingDays = daysDiff % 365.25;
        const months = Math.floor(remainingDays / 30.44);
        const age = years + months / 12;
        
        if (age >= 1.8 && age < 3) {
          levelId = 1;
        } else if (age >= 3 && age < 4) {
          levelId = 2;
        } else if (age >= 4 && age < 5) {
          levelId = 3;
        }
      }

      const studentApiURL = API.user.addStudent();
      const editorId = localStorage.getItem("userId");
      
      let studentDataToSend = {
        stud_firstname: studentFormData.first_name,
        stud_middlename: studentFormData.middle_name || '',
        stud_lastname: studentFormData.last_name,
        stud_birthdate: studentFormData.dob,
        stud_enrollment_date: studentFormData.enrollment_date || new Date().toISOString().split('T')[0],
        stud_handedness: studentFormData.handedness && studentFormData.handedness.trim() !== '' ? studentFormData.handedness : 'Not Yet Established',
        stud_gender: studentFormData.gender,
        stud_schedule_class: studentFormData.class_schedule,
        stud_school_status: "Active",
        editor_id: editorId,
        parent_id: parentId,          // Link to parent's user_id
        parent_profile_id: parentProfileId, // Link to parent's profile_id
      };
      
      // Only send level_id if it's a manual assignment
      if (isManualLevel && levelId) {
        studentDataToSend.level_id = levelId;
        studentDataToSend.stud_notes = studNotes || null;
      } else {
        // For automatic assignments, don't send level_id - backend will calculate from age
        studentDataToSend.stud_notes = null;
      }
      
      const studentRes = await fetch(studentApiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentDataToSend),
      });
      
      const studentResult = await studentRes.json();
      
      if (!studentRes.ok || studentResult.status !== "success") {
        toast.error(`Failed to add student: ${studentResult.message || "Unknown error"}`);
        setAddingStudent(false);
        return;
      }

      // Success
      const levelName = isManualLevel 
        ? (ageRequirements?.levels[levelId]?.name || (levelId === 1 ? 'Discoverer' : levelId === 2 ? 'Explorer' : 'Adventurer'))
        : (studentResult.level_id === 1 ? 'Discoverer' : studentResult.level_id === 2 ? 'Explorer' : studentResult.level_id === 3 ? 'Adventurer' : '');
      
      toast.success(`Student added successfully! Assigned Class: ${levelName}${isManualLevel ? ' (Manual)' : ''}`);
      
      // Close modal and reset form
      handleCloseStudentModal();
      
      // Reload user data to refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Error adding student: " + error.message);
      setAddingStudent(false);
    }
  };

  const handleBack = () => {
    router.push("/AdminSection/Users");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    // Auto-capitalize first letter for names
    if (["firstName", "middleName", "lastName"].includes(name)) {
      if (value.length > 0) {
        processedValue = capitalizeWords(value);
      }
    }
    // Auto-capitalize first letter for barangay
    if (name === "barangay") {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    // Auto-calculate level_id when birthdate changes for students
    if (name === "user_birthdate" && formData && formData.role === "Student") {
      const newLevelId = calculateLevelId(value);
      if (newLevelId !== null) {
        // Update both levelId and user_birthdate in formData
        setFormData(prev => ({
          ...prev,
          user_birthdate: value,
          levelId: newLevelId
        }));
        return; // Exit early to prevent double update
      }
    }
    // Handle contact number input - format as +63 XXX XXX XXXX
    if (name === "contactNo") {
      // Remove +63 prefix and all non-digits, then format
      let digits = value.replace(/^\+63\s*/, '').replace(/[^\d\s]/g, '');
      
      // Limit to 10 digits (excluding spaces)
      const digitCount = digits.replace(/\s/g, '').length;
      if (digitCount > 10) {
        digits = digits.replace(/\s/g, '').substring(0, 10);
        // Re-add spaces
        if (digits.length > 3) {
          digits = digits.substring(0, 3) + ' ' + digits.substring(3);
        }
        if (digits.length > 7) {
          digits = digits.substring(0, 7) + ' ' + digits.substring(7);
        }
      }
      
      // Store the raw digits in formData for saving
      const unformattedDigits = unformatPhoneInput(digits);
      processedValue = unformattedDigits; // Store raw digits, not formatted
    }
    // Handle government ID formatting
    if (name === "tin_number") {
      const cursorPos = e.target.selectionStart;
      let digits = value.replace(/\D/g, "");
      if (digits.length > 12) digits = digits.substring(0, 12);
      let formatted = "";
      if (digits.length <= 9) {
        if (digits.length > 0) formatted += digits.substring(0, Math.min(3, digits.length));
        if (digits.length > 3) formatted += "-" + digits.substring(3, Math.min(6, digits.length));
        if (digits.length > 6) formatted += "-" + digits.substring(6, Math.min(9, digits.length));
      } else if (digits.length > 9) {
        formatted += digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6, 9);
        if (digits.length === 12) {
          formatted += "-" + digits.substring(9, 12);
        } else {
          formatted += digits.substring(9, digits.length);
        }
      }
      processedValue = formatted;
      setTimeout(() => {
        let newCursorPos = cursorPos;
        if (processedValue[cursorPos] === "-") newCursorPos = cursorPos + 1;
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    if (name === "sss_number") {
      const cursorPos = e.target.selectionStart;
      let digits = value.replace(/\D/g, "");
      if (digits.length > 10) digits = digits.substring(0, 10);
      let formatted = "";
      if (digits.length > 0) formatted += digits.substring(0, Math.min(2, digits.length));
      if (digits.length > 2) formatted += "-" + digits.substring(2, Math.min(9, digits.length));
      if (digits.length > 9) formatted += "-" + digits.substring(9, Math.min(10, digits.length));
      processedValue = formatted;
      setTimeout(() => {
        let newCursorPos = cursorPos;
        if (processedValue[cursorPos] === "-") newCursorPos = cursorPos + 1;
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    if (name === "pagibig_number") {
      const cursorPos = e.target.selectionStart;
      let digits = value.replace(/\D/g, "");
      if (digits.length > 12) digits = digits.substring(0, 12);
      let formatted = "";
      if (digits.length > 0) formatted += digits.substring(0, Math.min(4, digits.length));
      if (digits.length > 4) formatted += "-" + digits.substring(4, Math.min(8, digits.length));
      if (digits.length > 8) formatted += "-" + digits.substring(8, Math.min(12, digits.length));
      processedValue = formatted;
      setTimeout(() => {
        let newCursorPos = cursorPos;
        if (processedValue[cursorPos] === "-") newCursorPos = cursorPos + 1;
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    // Handle cascading address fields
    let updatedFormData = { ...formData, [name]: processedValue };
    if (name === 'province') {
      updatedFormData.city = '';
      updatedFormData.barangay = '';
    }
    if (name === 'city') {
      updatedFormData.barangay = '';
    }
    
    // If stud_notes changes, re-validate birthdate since validation depends on notes
    if (name === 'stud_notes') {
      // Notes changed - may need to clear or re-validate birthdate errors
    setFormData(updatedFormData);
      // Re-validate form after notes change to update birthdate validation
      setTimeout(() => {
        validateForm(updatedFormData, formData?.role || role);
      }, 0);
    } else {
      setFormData(updatedFormData);
    }
    
    // Clear validation error for this field and dependent fields
    const fieldsToClear = [name];
    if (name === 'province') {
      fieldsToClear.push('city', 'barangay');
    } else if (name === 'city') {
      fieldsToClear.push('barangay');
    } else if (name === 'stud_notes') {
      // When notes change, also clear birthdate error as it may no longer be invalid
      fieldsToClear.push('user_birthdate');
    }
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      fieldsToClear.forEach(field => {
        if (newErrors[field]) {
          delete newErrors[field];
        }
      });
      return newErrors;
    });
  };

  const handleSave = async () => {
    setIsEditing(false);
    setLoading(true);
    setError(null);
    
    // Create field mapping based on user role
    let fieldMap = {
      firstName: 'user_firstname',
      middleName: 'user_middlename',
      lastName: 'user_lastname',
      email: 'user_email',
      contactNo: 'user_contact_no',
      user_birthdate: 'user_birthdate',
      user_status: 'user_status',
      user_role: 'user_role',
    };
    
    // Add address and government ID mappings based on role
    if (role === "Student") {
      fieldMap = {
        firstName: 'stud_firstname',
        middleName: 'stud_middlename',
        lastName: 'stud_lastname',
        user_birthdate: 'stud_birthdate',
        gender: 'stud_gender',
        handedness: 'stud_handedness',
        class_schedule: 'stud_schedule_class',
        photo: 'stud_photo',
        schoolStatus: 'stud_school_status',
        levelId: 'level_id',
        parentId: 'parent_id',
        parentProfileId: 'parent_profile_id',
        enrollmentDate: 'stud_enrollment_date',
        stud_notes: 'stud_notes'
      };
    } else if (role === "Parent") {
      fieldMap = {
        ...fieldMap,
        barangay: 'barangay',
        city_municipality: 'municipality_city',
        country: 'country'
      };
    } else if (role === "Teacher" || role === "Admin" || role === "Admin") {
      fieldMap = {
        ...fieldMap,
        barangay: 'barangay',
        city_municipality: 'city',
        province: 'province',
        country: 'country',
        tin_number: 'tin_number',
        sss_number: 'sss_number',
        pagibig_number: 'pagibig_number'
      };
    }
    
    let updateData = {};
    let changed = false;
    
    for (const key in formData) {
      if ((formData[key] !== (originalData ? originalData[key] : undefined)) ||
          (formData[key] === '' && (originalData && originalData[key] !== ''))) {
        const backendKey = fieldMap[key] || key;
        updateData[backendKey] = formData[key];
        changed = true;
      }
    }
    
    // Format contact number for backend - always store as 09XXXXXXXXXX
    if (updateData.user_contact_no) {
      // Remove any formatting and ensure it's 10 digits starting with 9
      let cleanDigits = updateData.user_contact_no.replace(/\D/g, '');
      
      // If it's 10 digits starting with 9, add leading 0
      if (cleanDigits.length === 10 && cleanDigits.startsWith('9')) {
        updateData.user_contact_no = '0' + cleanDigits;
      } else if (cleanDigits.startsWith('09') && cleanDigits.length === 10) {
        // Already in correct format
        updateData.user_contact_no = cleanDigits;
      } else if (cleanDigits.startsWith('009') && cleanDigits.length === 11) {
        // Convert from 009 to 09 format
        updateData.user_contact_no = cleanDigits.substring(1);
      } else {
        // For any other case, try to format as 09XXXXXXXXXX
        if (cleanDigits.length >= 10) {
          const tenDigits = cleanDigits.substring(0, 10);
          if (tenDigits.startsWith('9')) {
            updateData.user_contact_no = '0' + tenDigits;
          } else {
            updateData.user_contact_no = '09' + tenDigits.substring(1);
          }
        } else if (cleanDigits.length === 9 && cleanDigits.startsWith('9')) {
          // Handle case where we have 9 digits starting with 9
          updateData.user_contact_no = '09' + cleanDigits;
        } else if (cleanDigits.length > 0) {
          // For any other case, try to ensure it starts with 09
          if (cleanDigits.startsWith('9')) {
            updateData.user_contact_no = '09' + cleanDigits;
          } else {
            updateData.user_contact_no = '09' + cleanDigits;
          }
        } else {
          updateData.user_contact_no = '';
        }
      }
    }
    
    // Log the update data for debugging
    console.log('Update data being sent:', updateData);
    
    // Remap city/municipality field for backend compatibility
    if (role === "Parent" && updateData.city_municipality) {
      updateData.municipality_city = updateData.city_municipality;
      // DO NOT delete updateData.city_municipality here!
    } else if (
      (role === "Admin" || role === "Teacher" || role === "Admin") &&
      updateData.city_municipality
    ) {
      updateData.city = updateData.city_municipality;
      delete updateData.city_municipality;
    }
    
    let url = "";
    if (role === "Student") {
      updateData.student_id = formData.id;
      url = API.user.updateStudent();
    } else {
      updateData.user_id = formData.id;
      url = API.user.updateUser();
    }
    
    if (!changed) {
      toast.error("No fields to update");
      setIsEditing(false);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        setOriginalData(formData);
        setFormData(formData);
        toast.success("Profile updated successfully!");
        // Log system action only (no notification)
        const editorId = localStorage.getItem("userId");
        let action = "";
        if (role === "Student") {
          action = "Edited the details of a student profile.";
          fetch(API.logs.createSystemLog(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: editorId,
              target_user_id: null,
              target_student_id: formData.id,
              action,
            }),
          });
        } else {
          let article = (role === "Admin") ? "an" : "a";
          action = `Edited the details of ${article} ${role.toLowerCase()} account.`;
          fetch(API.logs.createSystemLog(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: editorId,
              target_user_id: formData.id,
              target_student_id: null,
              action,
            }),
          });
        }
      } else {
        setError(data.message || "Failed to update user");
        toast.error(data.message || "Failed to update user");
      }
    } catch (err) {
      console.error('Update error:', err);
      setError("Failed to update user");
      toast.error("Failed to update user");
    }
    setLoading(false);
  };

  const handleArchive = () => {
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    setArchiving(true);
    setError(null);
    
    try {
      // Special handling for Parent role - unlink students first
      if (role === "Parent") {
        try {
          // Get all students linked to this parent
          const studentsResponse = await fetch(API.user.getParentStudents(userId), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          
          const studentsData = await studentsResponse.json();
          
          if (studentsData.status === "success" && studentsData.data && studentsData.data.students) {
            // Unlink each student by setting parent_id and parent_profile_id to NULL
            // and set their status to 'Inactive'
            for (const student of studentsData.data.students) {
              await fetch(API.user.updateStudent(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  student_id: student.student_id,
                  parent_id: null,
                  parent_profile_id: null,
                  stud_school_status: "Inactive"
                }),
              });
            }
            
            // Show success message for student unlinking
            if (studentsData.data.students.length > 0) {
              toast.success(`${studentsData.data.students.length} linked student(s) have been unlinked and set to inactive.`);
            }
          }
        } catch (error) {
          console.error('Error unlinking students:', error);
          // Continue with archiving even if student unlinking fails
        }
      }
      
      // Proceed with normal archiving
      const response = await fetch(API.user.archiveUser(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: role,
          editor_id: localStorage.getItem("userId") // Add editor_id for system logging
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        toast.success(data.message || "User archived successfully!");
        // System logging is handled by the backend archive_user.php
        setShowArchiveModal(false);
        // Redirect back to users list after a short delay
        setTimeout(() => {
          router.push("/AdminSection/Users");
        }, 1500);
      } else {
        setError(data.message || "Failed to archive user");
        toast.error(data.message || "Failed to archive user");
      }
    } catch (err) {
      console.error('Archive error:', err);
      setError("Failed to archive user");
      toast.error("Failed to archive user");
    }
    setArchiving(false);
  };

  const cancelArchive = () => {
    setShowArchiveModal(false);
  };

  const handleRestore = () => {
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      let response;
      if (role === "Student") {
        // Restore student using update_student.php
        response = await fetch(API.user.updateStudent(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            student_id: userId, 
            stud_school_status: "Active",
            editor_id: localStorage.getItem("userId") // Add editor_id for system logging
          })
        });
      } else {
        // Restore user using update_user.php
        response = await fetch(API.user.updateUser(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            user_id: userId, 
            user_status: "Active",
            editor_id: localStorage.getItem("userId") // Add editor_id for system logging
          })
        });
      }
      
      const data = await response.json();
      if (data.status === "success" || (data.message && data.message.includes("success"))) {
        // System logging should be handled by the backend restore functions
        toast.success(data.message || `${role} restored successfully!`);
        // Navigate back to archive page with a refresh parameter
        setTimeout(() => {
          router.push('/AdminSection/Archive?refresh=true');
        }, 1200);
      } else {
        setError(data.message || "Failed to restore user");
        toast.error(data.message || "Failed to restore user");
      }
    } catch (err) {
      setError("Failed to restore user");
      toast.error("Failed to restore user");
    } finally {
      setRestoring(false);
      setShowRestoreModal(false);
    }
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
  };

  // Helper to get value from API response with fallback
  const getField = (key, fallback = "Not specified") => {
    if (!formData) return fallback;
    // Try both camelCase and snake_case
    return (
      formData[key] ||
      formData[key.replace(/([A-Z])/g, '_$1').toLowerCase()] ||
      fallback
    );
  };

  // Helper to get class name based on level ID
  const getClassName = (levelId) => {
    switch (parseInt(levelId)) {
      case 1:
        return "Discoverer - 2 yrs";
      case 2:
        return "Explorer - 3 yrs";
      case 3:
        return "Adventurer - 4 yrs";
      default:
        return "Not assigned";
    }
  };

  // Call this when OTP is sent or resent
  const handleResendOTP = async () => {
    // Call your /send_otp.php API here
    // await fetch(...);
    setTimeLeft(OTP_TIMEOUT); // Reset timer
  };

  function getInputClassName(fieldName) {
    const baseClass = "border w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] caret-[#232c67]";
    if (formData && formData[fieldName] && validationErrors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50`;
    } else if (formData && formData[fieldName] && !validationErrors[fieldName]) {
      return `${baseClass} border-green-500 bg-green-50`;
    }
    return `${baseClass} border-gray-300`;
  }

  if (loading) {
    return (
      <ProtectedRoute role="Admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-lg text-gray-500">Loading user data...</div>
        </div>
      </ProtectedRoute>
    );
  }
  if (!formData) return null;

  return (
    <ProtectedRoute role="Admin">
      <main className="flex-1">
        {/* Header Section with Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Manage User Details</h2>
          </div>
          
          {/* Profile Information */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              {formData.photo ? (
                <>
                  <img
                    src={formData.photo.startsWith('http') ? formData.photo : `${API.uploads.getUploadURL(formData.photo)}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-[#a8b0e0]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                    onLoad={() => {
                      console.log('Photo loaded successfully:', formData.photo);
                      console.log('Photo URL used:', formData.photo.startsWith('http') ? formData.photo : `${API.uploads.getUploadURL(formData.photo)}`);
                    }}
                  />
                  {/* Fallback icon that shows when photo fails to load */}
                  <div className="w-20 h-20 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-2xl shadow-sm border-2 border-[#a8b0e0] hidden">
                    <FaUser />
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#e8ecf7] flex items-center justify-center text-[#232c67] text-2xl shadow-sm border-2 border-[#a8b0e0]">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {getField('lastName')}, {getField('firstName')}
                    {formData.middleName && formData.middleName !== "Not specified" ? ` ${formData.middleName}` : ""}
                  </div>
                  <div className="text-gray-600 font-medium">{getField('role')}</div>
                </div>
                <div className="flex flex-col gap-2 mt-4 md:mt-0">
                  {formData.role === "Student" ? (
                    <>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold">Class Name:</span>
                        <span>{formData.className || "Not assigned yet"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold">Class Schedule:</span>
                        <span>{formData.class_schedule || "No schedule yet"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaPhone className="text-gray-500" />
                        <span className="font-semibold">
                          {(/\d/.test(getField('contactNo') || '')) 
                            ? formatPhoneForDisplay(getField('contactNo')) 
                            : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaEnvelope className="text-gray-500" />
                        <span>{getField('email')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          {/* Editable Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-auto md:h-[calc(100vh-350px)] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <p className="text-sm text-gray-600">View and edit user information</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto md:overflow-y-auto overflow-y-visible">
            <form className="space-y-6 text-sm max-w-full">
              {/* Basic Information - Show for all roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[ 
                    { name: "firstName", label: "First Name", required: true },
                    { name: "middleName", label: "Middle Name", required: false },
                    { name: "lastName", label: "Last Name", required: true },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                    {isEditing ? (
                      <input 
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || formData[field.name.replace(/([A-Z])/g, '_$1').toLowerCase()] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={getInputClassName(field.name)}
                      />
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {getField(field.name)}
                      </div>
                    )}
                    {formData[field.name] && validationErrors[field.name] && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors[field.name]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Information - Only for non-Student roles */}
              {formData.role !== "Student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[ 
                    { name: "user_birthdate", label: "Date of Birth", type: "date", required: true },
                    { name: "email", label: "Email Address", type: "email", required: true },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input 
                          name={field.name}
                          type={field.type || "text"}
                          value={formData[field.name] || formData[field.name.replace(/([A-Z])/g, '_$1').toLowerCase()] || ""}
                          onChange={handleChange}
                          required={field.required}
                          className={getInputClassName(field.name)}
                        />
                      ) : (
                        <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                          {getField(field.name)}
                        </div>
                      )}
                      {formData[field.name] && validationErrors[field.name] && (
                        <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <FaTimes />
                          {validationErrors[field.name]}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Contact Number with +63 formatting */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        name="contactNo"
                        type="tel"
                        value={formatPhoneForInput(formData.contactNo) || ""}
                        onChange={handleChange}
                        className={getInputClassName('contactNo')}
                        placeholder="+63 920 384 7563"
                        maxLength="20"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.contactNo ? 
                          formatPhoneForDisplay(formData.contactNo) : 'Not specified'}
                      </div>
                    )}
                    {formData.contactNo && validationErrors.contactNo && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.contactNo}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Fields - Only for non-Student roles */}
              {formData.role !== "Student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input
                        name="country"
                        type="text"
                        value="Philippines"
                        disabled
                        className="w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData.country || "Not specified"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <select 
                        name="province" 
                        onChange={handleChange} 
                        value={formData.province || ""}
                        className={getInputClassName('province')}
                        disabled={!formData.country}
                      >
                        <option value="">Select Province</option>
                        {addressData.provinces.map((p) => (
                          <option key={p.code} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData.province || "Not specified"}
                      </div>
                    )}
                    {formData.province && validationErrors.province && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.province}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <select 
                        name="city" 
                        onChange={handleChange} 
                        value={formData.city || ""}
                        className={getInputClassName('city')}
                        disabled={!formData.province}
                      >
                        <option value="">Select City</option>
                        {addressData.provinces.length > 0 && addressData.cities[addressData.provinces.find(p => p.name === formData.province)?.code]?.map((c) => (
                          <option key={c.code} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData.city || "Not specified"}
                      </div>
                    )}
                    {formData.city && validationErrors.city && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.city}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay <span className="text-red-500">*</span></label>
                    {isEditing ? (
                      <input 
                        name="barangay" 
                        type="text" 
                        value={formData.barangay || ""} 
                        onChange={handleChange} 
                        className={getInputClassName('barangay')}
                        placeholder="Enter barangay name"
                        disabled={!formData.city}
                      />
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData.barangay || "Not specified"}
                      </div>
                    )}
                    {formData.barangay && validationErrors.barangay && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.barangay}
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Student-specific fields - Only for Student role */}
              {formData.role === "Student" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    {isEditing ? (
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={formData.gender === "Male"}
                            onChange={handleChange}
                            className="text-[#232c67] focus:ring-[#232c67]"
                          />
                          Male
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={formData.gender === "Female"}
                            onChange={handleChange}
                            className="text-[#232c67] focus:ring-[#232c67]"
                          />
                          Female
                        </label>
                      </div>
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.gender || "Not specified"}
                      </div>
                    )}
                    {formData.gender && validationErrors.gender && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.gender}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <>
                        {(() => {
                          const hasNotes = formData?.stud_notes && formData.stud_notes.trim() !== "";
                          return (
                            <>
                              <input 
                                type="date" 
                                name="user_birthdate" 
                                value={formData.user_birthdate || ""} 
                                onChange={handleChange} 
                                className={getInputClassName("user_birthdate")}
                                min={hasNotes ? undefined : (ageRequirements ? ageRequirements.levels[3].start_date : undefined)}
                                max={hasNotes ? undefined : (ageRequirements ? ageRequirements.levels[1].end_date : undefined)}
                                disabled={!hasNotes && !ageRequirements}
                              />
                              {!ageRequirements && !hasNotes && (
                                <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                  <FaExclamationCircle />
                                  Loading age requirements...
                                </div>
                              )}
                              {hasNotes && (
                                <div className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                                  <FaExclamationCircle />
                                  Manual assignment: Age validation is bypassed due to special circumstances noted.
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.user_birthdate || "Not specified"}
                      </div>
                    )}
                    {formData.user_birthdate && validationErrors.user_birthdate && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.user_birthdate}
                      </div>
                    )}
                    {formData.user_birthdate && !validationErrors.user_birthdate && ageRequirements && isEditing && !(formData?.stud_notes && formData.stud_notes.trim() !== "") && (
                      <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
                        <FaCheckCircle />
                        Valid birthdate for student enrollment
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment Date</label>
                    {isEditing ? (
                      <input type="date" name="enrollmentDate" value={formData.enrollmentDate || ""} onChange={handleChange} className={getInputClassName("enrollmentDate")} />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.enrollmentDate || "Not specified"}
                      </div>
                    )}
                    {formData.enrollmentDate && validationErrors.enrollmentDate && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.enrollmentDate}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Handedness</label>
                    {isEditing ? (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="handedness" value="Left" checked={formData.handedness === "Left"} onChange={handleChange} />
                          Left
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="handedness" value="Right" checked={formData.handedness === "Right"} onChange={handleChange} />
                          Right
                        </label>
                      </div>
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.handedness || "Not specified"}
                      </div>
                    )}
                    {formData.handedness && validationErrors.handedness && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.handedness}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Class Schedule</label>
                    {isEditing ? (
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="class_schedule"
                            value="Morning"
                            checked={formData.class_schedule === "Morning"}
                            onChange={handleChange}
                            className="text-[#232c67] focus:ring-[#232c67]"
                          />
                          Morning
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="class_schedule"
                            value="Afternoon"
                            checked={formData.class_schedule === "Afternoon"}
                            onChange={handleChange}
                            className="text-[#232c67] focus:ring-[#232c67]"
                          />
                          Afternoon
                        </label>
                      </div>
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData.class_schedule || "Not specified"}
                      </div>
                    )}
                    {formData.class_schedule && validationErrors.class_schedule && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.class_schedule}
                      </div>
                    )}
                  </div>
                  
                  {/* Notes field - only shows if it already has a value (not null/empty) */}
                  {formData.role === "Student" && formData.stud_notes && formData.stud_notes.trim() !== "" && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                      {isEditing ? (
                        <>
                          <textarea
                            name="stud_notes"
                            value={formData.stud_notes || ""}
                            onChange={handleChange}
                            rows={3}
                            className={getInputClassName("stud_notes")}
                            placeholder="Enter notes about this student"
                            maxLength={60}
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            {(formData.stud_notes || "").length}/60 characters
                          </p>
                        </>
                      ) : (
                        <div className="border w-full p-2 rounded bg-gray-50 text-gray-700 whitespace-pre-wrap">
                          {formData.stud_notes}
                        </div>
                      )}
                      {formData.stud_notes && validationErrors.stud_notes && (
                        <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <FaTimes />
                          {validationErrors.stud_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Government IDs for Teacher/Admin only */}
              {(formData.role === "Teacher" || formData.role === "Admin") && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[ 
                    { name: "tin_number", label: "TIN", required: true },
                    { name: "sss_number", label: "SSS", required: true },
                    { name: "pagibig_number", label: "Pag-ibig", required: true },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {isEditing ? (
                        <input 
                          name={field.name}
                          type={field.type || "text"}
                          value={formData[field.name] || formData[field.name.replace(/([A-Z])/g, '_$1').toLowerCase()] || ""}
                          onChange={handleChange}
                          required={field.required}
                          className={getInputClassName(field.name)}
                        />
                      ) : (
                        <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                          {getField(field.name)}
                        </div>
                      )}
                      {formData[field.name] && validationErrors[field.name] && (
                        <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <FaTimes />
                          {validationErrors[field.name]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}


            </form>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleBack}
                type="button"
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back
              </button>
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      // Reload user data to reset any changes
                      window.location.reload();
                    }}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={!isFormValid}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                      isFormValid 
                        ? 'bg-[#232c67] text-white hover:bg-[#1a1f4d] shadow-sm' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="w-full sm:w-auto px-6 py-2 bg-[#232c67] text-white rounded-lg font-semibold hover:bg-[#1a1f4d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                >
                  <FaEdit className="text-sm" />
                  Edit User
                </button>
              )}
              {/* Add Student button for Parent role */}
              {formData && formData.role === "Parent" && formData.status === "Active" && !isEditing && (
                <button
                  onClick={handleAddStudentClick}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                >
                  <FaPlus className="text-sm" />
                  Add Student
                </button>
              )}
              {formData && (
                formData.role === "Student"
                  ? (
                      formData.schoolStatus === "Active" || formData.stud_school_status === "Active"
                        ? (
                            <button
                              onClick={handleArchive}
                              className="w-full sm:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                            >
                              <FaArchive className="text-sm" />
                              Archive User
                            </button>
                          )
                        : (
                            <button
                              onClick={handleRestore}
                              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                            >
                              <FaUndo /> Restore User
                            </button>
                          )
                    )
                  : (
                      formData.status === "Active"
                        ? (
                            // For teachers, check if they are assigned to a class
                            formData.role === "Teacher" && assignedClassName && assignedClassName !== "Not assigned" ? (
                              <div className="relative group">
                                <button
                                  disabled
                                  className="w-full sm:w-auto px-6 py-2 bg-gray-400 text-gray-500 rounded-lg font-semibold cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                                  title="Cannot archive assigned teacher"
                                >
                                  <FaArchive className="text-sm" />
                                  Archive User
                                </button>
                              
                              </div>
                            ) : (
                              <button
                                onClick={handleArchive}
                                className="w-full sm:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                              >
                                <FaArchive className="text-sm" />
                                Archive User
                              </button>
                            )
                          )
                        : (
                            <button
                              onClick={handleRestore}
                              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2"
                            >
                              <FaUndo /> Restore User
                            </button>
                          )
                    )
              )}
            </div>
          </div>
        </main>
      
      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Archive {role}</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Archive Confirmation</h4>
                  <p className="text-sm text-gray-700">
                    Are you sure you want to archive <span className="font-semibold">"{formData?.firstName && formData?.lastName ? `${formData.lastName}, ${formData.firstName}` : formData?.name || 'this user'}"</span>? 
                    This action will set their status to inactive and they will lose access to the system. The user can be restored later if needed.
                    {role === "Parent" && (
                      <span className="block mt-2 text-amber-700 font-medium">
                        ⚠️ Note: All linked students will be unlinked and set to inactive status.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={cancelArchive} 
                disabled={archiving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button 
                type="button" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                  archiving
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                onClick={confirmArchive}
                disabled={archiving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Restore {role}</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Confirmation</h4>
                  <p className="text-sm text-green-700">
                    Are you sure you want to restore <span className="font-semibold">"{formData?.firstName && formData?.lastName ? `${formData.lastName}, ${formData.firstName}` : formData?.name || 'this user'}"</span>? 
                    This action will set their status to active and they will be able to access the system again.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={cancelRestore} 
                disabled={restoring}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button 
                type="button" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                  restoring
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                onClick={confirmRestore}
                disabled={restoring}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {restoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 min-w-[90vw] max-w-[95vw] w-full max-h-[90vh] my-8 relative border border-gray-100 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Add New Student</h3>
                <p className="text-gray-600 text-sm">Link a new student to {formData?.firstName && formData?.lastName ? `${formData.firstName} ${formData.lastName}` : 'this parent'}</p>
              </div>
              <button
                onClick={handleCloseStudentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={addingStudent}
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Student Form */}
            <div className="space-y-6">
              {/* Age Requirements Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Student Age Requirements</p>
                    {loadingAgeRequirements ? (
                      <p className="text-blue-700">Loading age requirements...</p>
                    ) : ageRequirements ? (
                      <>
                        <p className="text-blue-700">
                          Students must be between 1.8 and 5 years old as of {ageRequirements.reference_date_formatted}. 
                          Birthdates are automatically validated against the following ranges:
                        </p>
                        <ul className="mt-2 text-blue-700 space-y-1">
                          {Object.keys(ageRequirements.levels).map(levelKey => {
                            const level = ageRequirements.levels[levelKey];
                            return (
                              <li key={levelKey}>
                                • <strong>Level {levelKey} ({level.name}):</strong> {level.start_date_formatted} - {level.end_date_formatted} (Age {level.age_range})
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <p className="text-blue-700 text-red-600">Failed to load age requirements. Please refresh the page.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                  <input 
                    name="first_name" 
                    type="text" 
                    value={studentFormData.first_name || ""} 
                    onChange={handleStudentFormChange} 
                    className={`w-full p-2 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 caret-[#232c67] ${
                      studentValidationErrors.first_name
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                        : studentFormData.first_name
                          ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                    }`}
                    placeholder="Enter first name"
                  />
                  {studentValidationErrors.first_name && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaTimes />
                      {studentValidationErrors.first_name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                  <input 
                    name="middle_name" 
                    type="text" 
                    value={studentFormData.middle_name || ""} 
                    onChange={handleStudentFormChange} 
                    className={`w-full p-2 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 caret-[#232c67] ${
                      studentValidationErrors.middle_name
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                        : studentFormData.middle_name
                          ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                    }`}
                    placeholder="Enter middle name"
                  />
                  {studentValidationErrors.middle_name && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaTimes />
                      {studentValidationErrors.middle_name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                  <input 
                    name="last_name" 
                    type="text" 
                    value={studentFormData.last_name || ""} 
                    onChange={handleStudentFormChange} 
                    className={`w-full p-2 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 caret-[#232c67] ${
                      studentValidationErrors.last_name
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                        : studentFormData.last_name
                          ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                    }`}
                    placeholder="Enter last name"
                  />
                  {studentValidationErrors.last_name && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaTimes />
                      {studentValidationErrors.last_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={studentFormData.gender === "Male"}
                        onChange={handleStudentFormChange}
                        className="text-[#232c67] focus:ring-[#232c67]"
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={studentFormData.gender === "Female"}
                        onChange={handleStudentFormChange}
                        className="text-[#232c67] focus:ring-[#232c67]"
                      />
                      Female
                    </label>
                  </div>
                  {studentValidationErrors.gender && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationCircle />
                      {studentValidationErrors.gender}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="dob" 
                    type="date" 
                    value={studentFormData.dob || ""} 
                    onChange={handleStudentFormChange} 
                    className={`w-full p-2 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 caret-[#232c67] ${
                      studentValidationErrors.dob
                        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                        : studentFormData.dob && !isManualLevel
                          ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                    }`}
                    min={isManualLevel ? undefined : (ageRequirements ? ageRequirements.levels[3].start_date : undefined)}
                    max={isManualLevel ? undefined : (ageRequirements ? ageRequirements.levels[1].end_date : undefined)}
                    disabled={!isManualLevel && !ageRequirements}
                  />
                  {studentValidationErrors.dob && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaTimes />
                      {studentValidationErrors.dob}
                    </div>
                  )}
                  {!ageRequirements && !isManualLevel && (
                    <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <FaExclamationCircle />
                      Loading age requirements...
                    </div>
                  )}
                  {studentFormData.dob && !studentValidationErrors.dob && ageRequirements && !isManualLevel && (
                    <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <FaCheckCircle />
                      Valid birthdate for student enrollment
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment Date</label>
                  <input 
                    name="enrollment_date" 
                    type="date" 
                    value={studentFormData.enrollment_date || new Date().toISOString().split('T')[0]} 
                    onChange={handleStudentFormChange} 
                    className="w-full p-2 rounded-lg border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] caret-[#232c67]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Handedness</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="handedness"
                        value="Left"
                        checked={studentFormData.handedness === "Left"}
                        onChange={handleStudentFormChange}
                        className="text-[#232c67] focus:ring-[#232c67]"
                      />
                      Left
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="handedness"
                        value="Right"
                        checked={studentFormData.handedness === "Right"}
                        onChange={handleStudentFormChange}
                        className="text-[#232c67] focus:ring-[#232c67]"
                      />
                      Right
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Schedule <span className="text-red-500">*</span></label>
                  {(() => {
                    const currentLevel = getCurrentLevel();
                    const isLevelDetermined = currentLevel !== null;
                    
                    return (
                      <>
                        <div className="flex gap-6">
                          <label className={`flex items-center gap-2 text-sm ${!isLevelDetermined ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}>
                            <input
                              type="radio"
                              name="class_schedule"
                              value="Morning"
                              checked={studentFormData.class_schedule === "Morning"}
                              onChange={handleStudentFormChange}
                              className="text-[#232c67] focus:ring-[#232c67]"
                              disabled={!isLevelDetermined}
                            />
                            <span className="flex items-center gap-2">
                              Morning
                              {!isLevelDetermined ? (
                                <span className="text-xs text-gray-500">(Select birthdate and class level first)</span>
                              ) : loadingSlots ? (
                                <span className="text-xs text-gray-500">(Loading...)</span>
                              ) : availableSlots && availableSlots.Morning !== undefined ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {availableSlots.Morning.enrolled > 0
                                    ? `${availableSlots.Morning.enrolled} enrolled`
                                    : 'No students'
                                  }
                                </span>
                              ) : null}
                            </span>
                          </label>
                          <label className={`flex items-center gap-2 text-sm ${!isLevelDetermined ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}>
                            <input
                              type="radio"
                              name="class_schedule"
                              value="Afternoon"
                              checked={studentFormData.class_schedule === "Afternoon"}
                              onChange={handleStudentFormChange}
                              className="text-[#232c67] focus:ring-[#232c67]"
                              disabled={!isLevelDetermined}
                            />
                            <span className="flex items-center gap-2">
                              Afternoon
                              {!isLevelDetermined ? (
                                <span className="text-xs text-gray-500">(Select birthdate and class level first)</span>
                              ) : loadingSlots ? (
                                <span className="text-xs text-gray-500">(Loading...)</span>
                              ) : availableSlots && availableSlots.Afternoon !== undefined ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {availableSlots.Afternoon.enrolled > 0
                                    ? `${availableSlots.Afternoon.enrolled} enrolled`
                                    : 'No students'
                                  }
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </div>
                        {studentValidationErrors.class_schedule && (
                          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <FaExclamationCircle />
                            {studentValidationErrors.class_schedule}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Manual Level Selection Section */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="manualLevelToggle"
                    checked={isManualLevel}
                    onChange={(e) => {
                      setIsManualLevel(e.target.checked);
                      if (!e.target.checked) {
                        setManualLevelId(null);
                        setStudNotes('');
                        setStudentValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.manualLevel;
                          delete newErrors.studNotes;
                          return newErrors;
                        });
                      }
                    }}
                    className="w-4 h-4 mt-1 text-[#232c67] border-gray-300 rounded focus:ring-[#232c67]"
                  />
                  <div className="flex-1">
                    <label htmlFor="manualLevelToggle" className="text-sm font-semibold text-gray-700 cursor-pointer block mb-1">
                      Manually Assign Class Level (Override Age-Based Assignment)
                    </label>
                    <p className="text-xs text-gray-600">
                      When enabled, you can select the class level regardless of the student's age. 
                      Date of birth is still required for records, but age will not determine the level assignment.
                    </p>
                  </div>
                </div>
                
                {isManualLevel && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Class Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualLevelId || ''}
                        onChange={(e) => {
                          setManualLevelId(e.target.value ? parseInt(e.target.value) : null);
                          setStudentValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.manualLevel;
                            return newErrors;
                          });
                        }}
                        className={`w-full p-2 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 caret-[#232c67] ${
                          studentValidationErrors.manualLevel
                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : manualLevelId
                              ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                              : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                        }`}
                      >
                        <option value="">Select Class Level</option>
                        <option value="1">Level 1 - Discoverer</option>
                        <option value="2">Level 2 - Explorer</option>
                        <option value="3">Level 3 - Adventurer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notes/Reason for Manual Assignment <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={studNotes}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value.length > 0) {
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                          }
                          setStudNotes(value);
                          setStudentValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.studNotes;
                            return newErrors;
                          });
                        }}
                        placeholder="Explain why this student is assigned to this level (e.g., medical condition, learning difficulty, advanced learning ability, etc.)"
                        rows={3}
                        className={`w-full p-2 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 caret-[#232c67] resize-y ${
                          studentValidationErrors.studNotes
                            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                            : studNotes && studNotes.trim()
                              ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                              : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
                        }`}
                        maxLength={60}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {studNotes.length}/60 characters
                      </p>
                      {studentValidationErrors.studNotes && (
                        <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <FaExclamationCircle />
                          {studentValidationErrors.studNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={handleCloseStudentModal} 
                disabled={addingStudent}
              >
                <FaTimes className="text-sm" />
                Cancel
              </button>
              <button 
                type="button" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                  addingStudent || !isStudentFormValid
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={handleAddStudentSubmit}
                disabled={addingStudent || !isStudentFormValid}
              >
                <FaChild className="text-sm" />
                {addingStudent ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
