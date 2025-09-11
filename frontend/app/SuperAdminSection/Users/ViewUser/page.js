"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaPhone, FaEnvelope, FaArrowLeft, FaTimes, FaEdit, FaArchive } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import fullAddress from '../../../../data/full_misamis_oriental_psgc.json';

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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message: "Email must be a valid Gmail address (@gmail.com)" };
    }
    return { isValid: true, message: "" };
  },
  contact: (value) => {
    if (!value) return { isValid: true, message: "" };
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
  studentDob: (value) => {
    if (!value) return { isValid: false, message: "" };
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    if (actualAge < 2) {
      return { isValid: false, message: "Student must be at least 2 years old" };
    } else if (actualAge > 4) {
      return { isValid: false, message: "Student must be 4 years old or younger" };
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

  // Fetch user or student data on mount
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    let url = "";
    let body = {};
    if (role === "Student") {
      url = "/php/Users/get_student_details.php";
      body = { student_id: userId };
    } else {
      url = "/php/Users/get_user_details.php";
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
              const advisoryResponse = await fetch("/php/Advisory/get_advisory_details.php", {
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
      fetch("/php/Advisory/get_advisory_details.php", {
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

  function validateField(name, value, role) {
    if (role === "Student") {
      if (["firstName", "lastName"].includes(name)) return validators.name(value);
      if (name === "middleName") return validators.middleName(value);
      if (name === "dob" || name === "user_birthdate") return validators.studentDob(value);
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
      const dobValidation = validators.studentDob(newFormData.user_birthdate);
      if (!dobValidation.isValid) errors.user_birthdate = dobValidation.message;
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
  }, [formData, isEditing]);

  const handleBack = () => {
    router.push("/SuperAdminSection/Users");
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
    setFormData(updatedFormData);
    // Clear validation error for this field and dependent fields
    const fieldsToClear = [name];
    if (name === 'province') {
      fieldsToClear.push('city', 'barangay');
    } else if (name === 'city') {
      fieldsToClear.push('barangay');
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
        enrollmentDate: 'stud_enrollment_date'
      };
    } else if (role === "Parent") {
      fieldMap = {
        ...fieldMap,
        barangay: 'barangay',
        city_municipality: 'municipality_city',
        country: 'country'
      };
    } else if (role === "Teacher" || role === "Admin" || role === "Super Admin") {
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
      (role === "Admin" || role === "Teacher" || role === "Super Admin") &&
      updateData.city_municipality
    ) {
      updateData.city = updateData.city_municipality;
      delete updateData.city_municipality;
    }
    
    let url = "";
    if (role === "Student") {
      updateData.student_id = formData.id;
      url = "/php/Users/update_student.php";
    } else {
      updateData.user_id = formData.id;
      url = "/php/Users/update_user.php";
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
          fetch("/php/Logs/create_system_log.php", {
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
          fetch("/php/Logs/create_system_log.php", {
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
          const studentsResponse = await fetch(`/php/Users/get_parent_students.php?parent_id=${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          
          const studentsData = await studentsResponse.json();
          
          if (studentsData.status === "success" && studentsData.data && studentsData.data.students) {
            // Unlink each student by setting parent_id and parent_profile_id to NULL
            // and set their status to 'Inactive'
            for (const student of studentsData.data.students) {
              await fetch("/php/Users/update_student.php", {
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
      const response = await fetch("/php/Users/archive_user.php", {
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
          router.push("/SuperAdminSection/Users");
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
        response = await fetch("/php/Users/update_student.php", {
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
        response = await fetch("/php/Users/update_user.php", {
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
          router.push('/SuperAdminSection/Archive?refresh=true');
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
      <ProtectedRoute role="Super Admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-lg text-gray-500">Loading user data...</div>
        </div>
      </ProtectedRoute>
    );
  }
  if (!formData) return null;

  return (
    <ProtectedRoute role="Super Admin">
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
                    src={formData.photo.startsWith('http') ? formData.photo : `/php/Uploads/${formData.photo}`}
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
                      console.log('Photo URL used:', formData.photo.startsWith('http') ? formData.photo : `/php/Uploads/${formData.photo}`);
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
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
                      <select 
                        name="country" 
                        value={formData.country || ""} 
                        onChange={handleChange} 
                        className={getInputClassName('country')}
                      >
                        <option value="">Select Country</option>
                        {addressData.countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData.country || "Not specified"}
                      </div>
                    )}
                    {formData.country && validationErrors.country && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <FaTimes />
                        {validationErrors.country}
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
                      <input type="date" name="user_birthdate" value={formData.user_birthdate || ""} onChange={handleChange} className={getInputClassName("user_birthdate")} />
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
    </ProtectedRoute>
  );
}
