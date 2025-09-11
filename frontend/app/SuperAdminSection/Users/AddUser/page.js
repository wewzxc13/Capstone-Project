"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaTimes, FaUsers, FaClipboardCheck, FaCalendarAlt, FaChevronDown, FaUserShield, FaUserTie, FaChalkboardTeacher, FaChild } from "react-icons/fa";
import ReactCountryFlag from "react-country-flag";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import fullAddress from '../../../../data/full_misamis_oriental_psgc.json';


const userTypes = ["Admin", "Teacher", "Parent", "Student"];

function capitalizeWords(str) {
  return str.replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

// Move getTodayDateString here so it's defined before use
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Validation functions
const validators = {
  // Name validation - each word first letter capital, only letters and spaces
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

  // Middle name validation - same as name but optional
  middleName: (value) => {
    if (!value) return { isValid: true, message: "" }; // Optional field
    const nameRegex = /^([A-Z][a-zA-Z]*)(\s[A-Z][a-zA-Z]*)*$/;
    if (!nameRegex.test(value)) {
      return { isValid: false, message: "Each word must start with a capital letter, only letters and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Name must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },

  // Email validation - must end with @gmail.com
  email: (value) => {
    if (!value) return { isValid: false, message: "" };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message: "Email must be a valid Gmail address (@gmail.com)" };
    }
    return { isValid: true, message: "" };
  },

          // Contact number validation - Philippine format (10 digits: 3-3-4)
        contact: (value) => {
          if (!value) return { isValid: true, message: "" }; // Optional field

          // Remove all non-digits
          const digits = value.replace(/\D/g, '');

          // Debug logging
          console.log('Contact validation:', { 
            value: value, 
            digits: digits, 
            length: digits.length,
            startsWith9: digits.startsWith('9'),
            startsWith09: digits.startsWith('09'),
            startsWith009: digits.startsWith('009')
          });

          // Check if it's a valid Philippine mobile number
          // Accept either:
          // 1. 10 digits starting with '9' (e.g., 9123456789) - for input
          // 2. 10 digits starting with '09' (e.g., 09123456789) - for stored
          // 3. 11 digits starting with '009' (e.g., 009123456789) - for legacy stored format
          if ((digits.length === 10 && digits.startsWith('9')) || 
              (digits.length === 10 && digits.startsWith('09')) ||
              (digits.length === 11 && digits.startsWith('009'))) {
            console.log('Contact validation: VALID - returning success');
            return { isValid: true, message: "" };
          } else if (digits.length > 0 && digits.length < 10) {
            console.log('Contact validation: INVALID - too short');
            return { isValid: false, message: "Enter a complete Philippine mobile number (e.g., 912 345 6789)" };
          } else if (digits.length > 0 && !digits.startsWith('9') && !digits.startsWith('09') && !digits.startsWith('009')) {
            console.log('Contact validation: INVALID - wrong prefix');
            return { isValid: false, message: "Philippine mobile numbers must start with 9, 09, or 009" };
          } else if (digits.length > 11) {
            console.log('Contact validation: INVALID - too long');
            return { isValid: false, message: "Phone number is too long" };
          }

          console.log('Contact validation: FALLBACK - returning success');
          return { isValid: true, message: "" };
        },

  // TIN validation - 9 digits (###-###-###) or 12 digits for branches (###-###-###-###)
  tin: (value) => {
    if (!value) return { isValid: true, message: "" }; // Optional field
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Check for 9 digits (###-###-###) or 12 digits (###-###-###-###)
    if (digits.length === 9) {
      return { isValid: true, message: "" };
    } else if (digits.length === 12) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "TIN must be 9 digits (###-###-###) or 12 digits for branches (###-###-###-###)" };
    }
    
    return { isValid: true, message: "" };
  },

  // SSS validation - 10 digits (##-#######-#)
  sss: (value) => {
    if (!value) return { isValid: true, message: "" }; // Optional field
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Must be exactly 10 digits
    if (digits.length === 10) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "SSS must be 10 digits (##-#######-#)" };
    }
    
    return { isValid: true, message: "" };
  },

  // Pagibig validation - 12 digits (####-####-#### or 123456789123)
  pagibig: (value) => {
    if (!value) return { isValid: true, message: "" }; // Optional field
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Must be exactly 12 digits
    if (digits.length === 12) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0) {
      return { isValid: false, message: "Pagibig must be 12 digits (123456789123 or 1234-5678-9123)" };
    }
    
    return { isValid: true, message: "" };
  },

  // Date of birth validation - must be 18-100 years old (for Admin/Teacher/Parent)
  dob: (value) => {
    if (!value) return { isValid: false, message: "" };
    
    const birthDate = new Date(value);
    const today = new Date();
    
    // Calculate age more accurately
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }
    
    // Check if person is between 18 and 100 years old
    if (age >= 18 && age <= 100) {
      return { isValid: true, message: "" };
    } else if (age < 18) {
      return { isValid: false, message: `Must be 18 years or older. Current age: ${age} years` };
    } else {
      return { isValid: false, message: `Must be 100 years or younger. Current age: ${age} years` };
    }
  },

  // Student date of birth validation - must match level logic in update_lvl.php
  studentDob: (value) => {
    if (!value) return { isValid: false, message: "" };
    // Reference date for age computation (same as update_lvl.php)
    const referenceDate = new Date("2025-08-04");
    const birthDate = new Date(value);
    if (isNaN(birthDate.getTime())) {
      return { isValid: false, message: "Invalid date format" };
    }
    
    // Use the EXACT same age calculation as update_lvl.php
    // Calculate the difference in milliseconds and convert to years/months
    const timeDiff = referenceDate.getTime() - birthDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Convert to years and months (more accurate than the previous method)
    const years = Math.floor(daysDiff / 365.25);
    const remainingDays = daysDiff % 365.25;
    const months = Math.floor(remainingDays / 30.44);
    
    const age = years + months / 12;
    
    // Level date ranges (same as update_lvl.php)
    const levelDateRanges = {
      1: { start: new Date("2022-08-05"), end: new Date("2023-11-04") },
      2: { start: new Date("2021-08-05"), end: new Date("2022-08-04") }, // Accepts 1.8 years and above
      3: { start: new Date("2020-08-05"), end: new Date("2021-08-04") },
    };
    
    let levelId = null;
    if (age >= 1.8 && age < 3) {
      levelId = 1;
    } else if (age >= 3 && age < 4) { // Level 2: 3-4 years
      levelId = 2;
    } else if (age >= 4 && age < 5) {
      levelId = 3;
    }
    
    if (!levelId) {
      return { isValid: false, message: "Only students aged 1.8, 3, or 4 are allowed. Given age: " + Math.floor(age) };
    }
    
    // Check if birthdate falls within the valid range for the level
    const range = levelDateRanges[levelId];
    if (birthDate < range.start || birthDate > range.end) {
      return { isValid: false, message: `Birthdate must be between ${range.start.toISOString().slice(0,10)} and ${range.end.toISOString().slice(0,10)} for Level ${levelId}` };
    }
    
    return { isValid: true, message: "" };
  },

  // Barangay validation - first letter capital, can contain numbers
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

  // Required field validation
  required: (value) => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "" };
    }
    return { isValid: true, message: "" };
  }
};



// Custom Dropdown Component
const CustomDropdown = ({ 
  name, 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false, 
  error = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white text-left ${
          error 
            ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
            : value && value !== ""
              ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
              : 'border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <FaChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-left transition-colors ${
                option.value === value 
                  ? 'bg-[#232c67] text-white hover:bg-white hover:text-black' 
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AddUserPage() {
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({
    enrollment_date: getTodayDateString(),
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [addressData, setAddressData] = useState({
    countries: [],
    provinces: [],
    cities: {},
    barangays: {}
  });
  
  const [touchedFields, setTouchedFields] = useState({});
  const router = useRouter();

  // Reset form when user type changes
  useEffect(() => {
    setFormData({ enrollment_date: getTodayDateString() });
    setValidationErrors({});
    setTouchedFields({});
  }, [userType]);

  useEffect(() => {
    const parsed = { countries: [], provinces: [], cities: {}, barangays: {} };

    const country = "Philippines";
    const provinces = fullAddress[country];
    parsed.countries.push(country); // ✅ ADD THIS

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
  
  
  const handleBack = () => {
    router.push("/SuperAdminSection/Users");
  };

  const handleClear = () => {
    setFormData({ enrollment_date: getTodayDateString() });
    setValidationErrors({});
    setTouchedFields({});
  };

  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const validateField = (name, value) => {
    // Debug logging for contact field
    if (name === 'contact') {
      console.log('validateField called for contact with value:', value);
    }
    
    switch (name) {
      case 'first_name':
      case 'last_name':
        return validators.name(value);
      case 'middle_name':
        return validators.middleName(value);
      case 'barangay':
        return validators.barangay(value);
      case 'email':
        return validators.email(value);
      case 'contact':
        return validators.contact(value);
      case 'tin':
        return validators.tin(value);
      case 'sss':
        return validators.sss(value);
      case 'pagibig':
        return validators.pagibig(value);
      case 'dob':
        return validators.dob(value);
      case 'studentDob':
        return validators.studentDob(value);
      case 'gender':
      case 'class_schedule':
      case 'country':
      case 'provinceCode':
      case 'cityCode':
        return validators.required(value);
      default:
        return { isValid: true, message: "" };
    }
  };

  const validateForm = () => {
    const errors = {};
    const isStudent = userType === "Student";
    
    if (isStudent) {
      // Student validation - use dob field but validate with studentDob logic
      ['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule'].forEach(field => {
        const validation = validateField(field, formData[field]);
        if (!validation.isValid) {
          errors[field] = validation.message;
        }
      });
      
      // Special validation for student date of birth (age 2-4)
      const dobValidation = validators.studentDob(formData.dob);
      if (!dobValidation.isValid) {
        errors.dob = dobValidation.message;
      }
    } else {
      // Admin/Teacher/Parent validation - use dob for age 18+ validation
      ['first_name', 'middle_name', 'last_name', 'dob', 'email', 'country', 'provinceCode', 'cityCode', 'barangay'].forEach(field => {
        const validation = validateField(field, formData[field]);
        if (!validation.isValid) {
          errors[field] = validation.message;
        }
      });
      
      // Contact validation for all non-student users (Admin/Teacher/Parent)
      console.log('validateForm: About to validate contact field with value:', formData.contact);
      const contactValidation = validateField('contact', formData.contact);
      console.log('validateForm: Contact validation result:', contactValidation);
      if (!contactValidation.isValid) {
        errors.contact = contactValidation.message;
        console.log('validateForm: Setting contact error:', contactValidation.message);
      }
      
      // Government ID validation for Admin/Teacher only
      if (userType === "Admin" || userType === "Teacher") {
        ['tin', 'sss', 'pagibig'].forEach(field => {
          const validation = validateField(field, formData[field]);
          if (!validation.isValid) {
            errors[field] = validation.message;
          }
        });
      }
    }

    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  };

  useEffect(() => {
    console.log('useEffect triggered - formData changed:', formData);
    console.log('useEffect - current contact value:', formData.contact);
    validateForm();
  }, [formData, userType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-capitalize first letter for names
    if (["first_name", "middle_name", "last_name"].includes(name)) {
      if (value.length > 0) {
        processedValue = capitalizeWords(value);
      }
    }

    // Auto-lowercase for email
    if (name === 'email') {
      processedValue = value.toLowerCase();
    }

    // Auto-capitalize first letter for barangay
    if (name === 'barangay') {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

            // Handle contact number input - format as ___ ___ ____ (10 digits: 3-3-4)
        if (name === 'contact') {
          // Remove all non-digits and spaces, then re-add spaces for formatting
          let digits = value.replace(/[^\d\s]/g, '');
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
          // Store the formatted value for display
          processedValue = digits;
          // For validation, store the unformatted digits
          const unformattedDigits = unformatPhoneInput(digits);
          if (unformattedDigits.length === 10 && unformattedDigits.startsWith('9')) {
            // Store as 10 digits starting with 9 (e.g., 9123456789)
            processedValue = unformattedDigits;
          } else if (unformattedDigits.length > 0) {
            // Store as is for partial input
            processedValue = unformattedDigits;
          } else {
            processedValue = '';
          }
        }

    // Handle government ID formatting
    if (name === 'tin') {
      // Get current cursor position
      const cursorPos = e.target.selectionStart;
      
      // Remove all non-digits
      let digits = value.replace(/\D/g, '');
      
      // Limit to 12 digits (for branch format)
      if (digits.length > 12) {
        digits = digits.substring(0, 12);
      }
      
      // Auto-format with dashes: ###-###-### or ###-###-###-###
      let formatted = '';
      if (digits.length <= 9) {
        if (digits.length > 0) {
          formatted += digits.substring(0, Math.min(3, digits.length));
        }
        if (digits.length > 3) {
          formatted += '-' + digits.substring(3, Math.min(6, digits.length));
        }
        if (digits.length > 6) {
          formatted += '-' + digits.substring(6, Math.min(9, digits.length));
        }
      } else if (digits.length > 9) {
        formatted += digits.substring(0, 3) + '-' + digits.substring(3, 6) + '-' + digits.substring(6, 9);
        if (digits.length === 12) {
          formatted += '-' + digits.substring(9, 12);
        } else {
          formatted += digits.substring(9, digits.length);
        }
      }
      processedValue = formatted;
      
      // Adjust cursor position to account for dashes
      setTimeout(() => {
        let newCursorPos = cursorPos;
        if (processedValue[cursorPos] === '-') {
          newCursorPos = cursorPos + 1;
        }
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    if (name === 'sss') {
      // Get current cursor position
      const cursorPos = e.target.selectionStart;
      
      // Remove all non-digits
      let digits = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (digits.length > 10) {
        digits = digits.substring(0, 10);
      }
      
      // Auto-format with dashes: ##-#######-#
      if (digits.length > 0) {
        let formatted = '';
        if (digits.length > 0) {
          formatted += digits.substring(0, Math.min(2, digits.length));
        }
        if (digits.length > 2) {
          formatted += '-' + digits.substring(2, Math.min(9, digits.length));
        }
        if (digits.length > 9) {
          formatted += '-' + digits.substring(9, Math.min(10, digits.length));
        }
        processedValue = formatted;
      } else {
        processedValue = '';
      }
      
      // Adjust cursor position to account for dashes
      setTimeout(() => {
        let newCursorPos = cursorPos;
        // If cursor was at a dash position, move it to the next digit
        if (processedValue[cursorPos] === '-') {
          newCursorPos = cursorPos + 1;
        }
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    if (name === 'pagibig') {
      // Get current cursor position
      const cursorPos = e.target.selectionStart;
      
      // Remove all non-digits
      let digits = value.replace(/\D/g, '');
      
      // Limit to 12 digits
      if (digits.length > 12) {
        digits = digits.substring(0, 12);
      }
      
      // Auto-format with dashes: ####-####-####
      if (digits.length > 0) {
        let formatted = '';
        if (digits.length > 0) {
          formatted += digits.substring(0, Math.min(4, digits.length));
        }
        if (digits.length > 4) {
          formatted += '-' + digits.substring(4, Math.min(8, digits.length));
        }
        if (digits.length > 8) {
          formatted += '-' + digits.substring(8, Math.min(12, digits.length));
        }
        processedValue = formatted;
      } else {
        processedValue = '';
      }
      
      // Adjust cursor position to account for dashes
      setTimeout(() => {
        let newCursorPos = cursorPos;
        // If cursor was at a dash position, move it to the next digit
        if (processedValue[cursorPos] === '-') {
          newCursorPos = cursorPos + 1;
        }
        newCursorPos = Math.min(newCursorPos, processedValue.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    // Handle cascading address fields
    let updatedFormData = { ...formData, [name]: processedValue };
    
    // Reset city and barangay when province changes
    if (name === 'provinceCode') {
      updatedFormData.cityCode = '';
      updatedFormData.barangay = '';
    }
    
    // Reset barangay when city changes
    if (name === 'cityCode') {
      updatedFormData.barangay = '';
    }

    setFormData(updatedFormData);

    // Clear validation error for this field and dependent fields
    const fieldsToClear = [name];
    if (name === 'provinceCode') {
      fieldsToClear.push('cityCode', 'barangay');
    } else if (name === 'cityCode') {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
  
    const isStudent = userType === "Student";
  
    const apiURL = isStudent
      ? "/php/Users/add_student.php"
      : "/php/Users/add_user.php";
  
    let dataToSend = {
      ...formData,
      // Photo will be automatically assigned by the backend based on user type and gender
    };
  
    if (!isStudent) {
      dataToSend.user_type = userType.toLowerCase();
      
      // Extract address names from codes for backend
      const province = addressData.provinces.find(p => p.code === formData.provinceCode)?.name;
      const city = addressData.cities[formData.provinceCode]?.find(c => c.code === formData.cityCode)?.name;
      
      dataToSend.country = formData.country;
      dataToSend.province = province;
      dataToSend.city = city;
      dataToSend.barangay = formData.barangay; // Use the text input value directly
      
      // Format contact number for backend - always store as 09XXXXXXXXXX
      if (formData.contact) {
        // Remove any formatting and ensure it's 10 digits starting with 9
        let cleanDigits = formData.contact.replace(/\D/g, '');
        // If it's 10 digits starting with 9, add leading 0
        if (cleanDigits.length === 10 && cleanDigits.startsWith('9')) {
          dataToSend.contact = '0' + cleanDigits;
        } else if (cleanDigits.startsWith('09') && cleanDigits.length === 10) {
          // Already in correct format
          dataToSend.contact = cleanDigits;
        } else if (cleanDigits.startsWith('009') && cleanDigits.length === 11) {
          // Convert from 009 to 09 format
          dataToSend.contact = cleanDigits.substring(1);
        } else {
          // For any other case, try to format as 09XXXXXXXXXX
          if (cleanDigits.length >= 10) {
            const tenDigits = cleanDigits.substring(0, 10);
            if (tenDigits.startsWith('9')) {
              dataToSend.contact = '0' + tenDigits;
            } else {
              dataToSend.contact = '09' + tenDigits.substring(1);
            }
          } else {
            dataToSend.contact = formData.contact;
          }
        }
      }
      
      if (userType === "Parent" && city) {
        dataToSend.municipality_city = city;
      }
      
      // Add editor_id for system logging
      dataToSend.editor_id = localStorage.getItem("userId");
    } else {
      // Remap for student
      dataToSend = {
        stud_firstname: formData.first_name,
        stud_middlename: formData.middle_name,
        stud_lastname: formData.last_name,
        stud_birthdate: formData.dob,
        stud_enrollment_date: formData.enrollment_date,
        stud_handedness: formData.handedness && formData.handedness.trim() !== '' ? formData.handedness : 'Not Yet Established',
        stud_gender: formData.gender,
        stud_schedule_class: formData.class_schedule,
        // Photo will be automatically assigned by the backend based on gender
        stud_school_status: "Active",
        editor_id: localStorage.getItem("userId") // Add editor_id for system logging
      };
    }
  
    try {
      const res = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });
  
             const result = await res.json();
       if (res.ok) {
         const successMessage = isStudent
           ? `Student added successfully! Assigned Class: ${
               result.level_id === 1
                 ? 'Discoverer'
                 : result.level_id === 2
                 ? 'Explorer'
                 : result.level_id === 3
                 ? 'Adventurer'
                 : result.level_id
             }`
           : `User added successfully!`;
         
         toast.success(successMessage);
         
         // System logging is handled by the backend APIs
         setTimeout(() => router.push("/SuperAdminSection/Users"), 3000);
       } else {
         toast.error("Failed to add user: " + (result.message || "Unknown error"));
       }
     } catch (error) {
       toast.error("Error submitting user: " + error.message);
     }
  };


// Helper function to get input class names
function getInputClassName(fieldName, formData, validationErrors) {
  const baseClass = "w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white caret-[#232c67]";
  
  // Special handling for date of birth validation based on user type
  if (fieldName === 'dob' && formData[fieldName]) {
    const isStudent = userType === "Student";
    
    if (isStudent) {
      // Student validation - use studentDob validator
      const dobValidation = validators.studentDob(formData[fieldName]);
      if (!dobValidation.isValid) {
        return `${baseClass} border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500`;
      } else {
        return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
      }
    } else {
      // Admin/Teacher/Parent validation - use dob validator (18+ years)
      const dobValidation = validators.dob(formData[fieldName]);
      if (!dobValidation.isValid) {
        return `${baseClass} border-red-500 bg-red-500 focus:border-red-500 focus:ring-red-500`;
      } else {
        return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
      }
    }
  }
   
  // Handle country, province, and city fields for green highlighting when selected
  if (['country', 'provinceCode', 'cityCode'].includes(fieldName) && formData[fieldName]) {
    return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
  }

  if (validationErrors[fieldName]) {
    return `${baseClass} border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500`;
  }
  if (formData[fieldName]) {
    return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
  }
  return `${baseClass} border-gray-300 focus:border-[#232c67] focus:ring-[#232c67]`;
}

// ... existing code ...

  // Format phone number for display: +63 920 391 1111 (10 digits: 3-3-4)
  function formatPhoneForDisplay(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    let digits = phoneNumber.replace(/\D/g, '');
    let formattedNumber;
    
    if (digits.startsWith('009')) {
      // If starts with 009, remove it and format as +63
      const cleanDigits = digits.substring(3);
      if (cleanDigits.length === 10) {
        formattedNumber = `+63 ${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3, 6)} ${cleanDigits.substring(6)}`;
      } else {
        formattedNumber = `+63 ${cleanDigits}`;
      }
    } else if (digits.startsWith('09')) {
      // If starts with 09, remove it and format as +63
      const cleanDigits = digits.substring(2);
      if (cleanDigits.length === 10) {
        formattedNumber = `+63 ${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3, 6)} ${cleanDigits.substring(6)}`;
      } else {
        formattedNumber = `+63 ${cleanDigits}`;
      }
    } else if (digits.startsWith('9')) {
      // If starts with 9, format as +63
      if (digits.length === 10) {
        formattedNumber = `+63 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
      } else {
        formattedNumber = `+63 ${digits}`;
      }
    } else {
      // For any other format, just add +63
      formattedNumber = `+63 ${digits}`;
    }
    
    return formattedNumber;
  }

  // Format phone number for input field: ___ ___ ____ (10 digits: 3-3-4)
  function formatPhoneForInput(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    let digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.startsWith('009')) {
      // If starts with 009, remove it and format as ___ ___ ____
      const cleanDigits = digits.substring(3);
      if (cleanDigits.length >= 3) {
        let formatted = cleanDigits.substring(0, 3);
        if (cleanDigits.length >= 6) {
          formatted += ' ' + cleanDigits.substring(3, 6);
          if (cleanDigits.length >= 10) {
            formatted += ' ' + cleanDigits.substring(6, 10);
          } else {
            formatted += ' ' + cleanDigits.substring(6);
          }
        } else {
          formatted += ' ' + cleanDigits.substring(3);
        }
        return formatted;
      }
      return cleanDigits;
    } else if (digits.startsWith('09')) {
      // If starts with 09, remove it and format as ___ ___ ____
      const cleanDigits = digits.substring(2);
      if (cleanDigits.length >= 3) {
        let formatted = cleanDigits.substring(0, 3);
        if (cleanDigits.length >= 6) {
          formatted += ' ' + cleanDigits.substring(3, 6);
          if (cleanDigits.length >= 10) {
            formatted += ' ' + cleanDigits.substring(6, 10);
          } else {
            formatted += ' ' + cleanDigits.substring(6);
          }
        } else {
          formatted += ' ' + cleanDigits.substring(3);
        }
        return formatted;
      }
      return cleanDigits;
    } else if (digits.startsWith('9')) {
      // If starts with 9, format as ___ ___ ____
      if (digits.length >= 3) {
        let formatted = digits.substring(0, 3);
        if (digits.length >= 6) {
          formatted += ' ' + digits.substring(3, 6);
          if (digits.length >= 10) {
            formatted += ' ' + digits.substring(6, 10);
          } else {
            formatted += ' ' + digits.substring(6);
          }
        } else {
          formatted += ' ' + digits.substring(3);
        }
        return formatted;
      }
      return digits;
    }
    
    return digits;
  }

  // Convert formatted input back to digits
  function unformatPhoneInput(formattedInput) {
    if (!formattedInput) return '';
    // Remove all non-digits and spaces
    return formattedInput.replace(/[^\d]/g, '');
  }

  const renderTeacherParentAdminFields = (isTeacher, isAdmin) => (
    <>
      <div className="bg-[#232c67] text-white rounded-lg px-4 py-3 mb-6 font-semibold text-lg">
        {isAdmin ? "Admin Details" : isTeacher ? "Teacher Details" : "Parent Details"}
      </div>
     
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input 
            name="first_name" 
            type="text" 
            value={formData.first_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('first_name', formData, validationErrors)}
            placeholder="Enter first name"
          />
          {formData.first_name && validationErrors.first_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.first_name}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
          <input 
            name="middle_name" 
            type="text" 
            value={formData.middle_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('middle_name', formData, validationErrors)}
            placeholder="Enter middle name"
          />
          {formData.middle_name && validationErrors.middle_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.middle_name}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input 
            name="last_name" 
            type="text" 
            value={formData.last_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('last_name', formData, validationErrors)}
            placeholder="Enter last name"
          />
          {formData.last_name && validationErrors.last_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.last_name}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
          <input 
            name="dob" 
            type="date" 
            value={formData.dob || ""} 
            onChange={handleChange} 
            className={getInputClassName('dob', formData, validationErrors)}
          />
          {formData.dob && validationErrors.dob && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.dob}
            </div>
          )}
          {formData.dob && !validationErrors.dob && (
            <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
              <FaCheckCircle />
              Valid age: {(() => {
                const birthDate = new Date(formData.dob);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age = age - 1;
                }
                return `${age} years old (18-100 years allowed)`;
              })()}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
          <input 
            name="email" 
            type="email" 
            value={formData.email || ""} 
            onChange={handleChange} 
            className={getInputClassName('email', formData, validationErrors)}
            placeholder="example@gmail.com"
          />
          {formData.email && validationErrors.email && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.email}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                      <div className="flex">
              {/* Country Selector */}
              <div className="flex items-center px-0.5 py-2 border border-gray-300 border-r-0 rounded-l-lg bg-white min-w-[50px]">
                {/* Philippine Flag */}
                <ReactCountryFlag
                  countryCode="PH"
                  svg
                  style={{
                    width: "1.5em",
                    height: "1.5em"
                  }}
                  title="Philippines"
                />
              </div>
              {/* Country Code */}
              <div className="px-0.5 py-2 border border-gray-300 border-l-0 border-r-0 bg-gray-50 text-gray-700 font-medium min-w-[35px] text-center flex items-center justify-center">
                +63
              </div>
                       {/* Phone Number Input */}
                       <input
                            name="contact"
               type="tel"
               value={formatPhoneForInput(formData.contact)}
               onChange={handleChange}
               className={`flex-1 rounded-r-lg p-2 border-2 bg-white caret-[#232c67] ${getInputClassName('contact', formData, validationErrors).replace('w-full', '').replace('border-2 bg-white', '')}`}
               placeholder="912 345 6789"
               maxLength="14"
           />
          </div>
          {formData.contact && validationErrors.contact && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.contact}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
          <CustomDropdown
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
            options={[
              { value: "", label: "Select Country" },
              ...addressData.countries.map(country => ({ value: country, label: country }))
            ]}
            placeholder="Select Country"
            error={!!validationErrors.country}
            className={getInputClassName('country', formData, validationErrors).replace('w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white', '')}
          />
          {formData.country && validationErrors.country && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              {validationErrors.country}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
          <CustomDropdown
            name="provinceCode"
            value={formData.provinceCode || ""}
            onChange={handleChange}
            options={[
              { value: "", label: "Select Province" },
              ...addressData.provinces.map((p) => ({ value: p.code, label: p.name }))
            ]}
            placeholder="Select Province"
            disabled={!formData.country}
            error={!!validationErrors.provinceCode}
            className={getInputClassName('provinceCode', formData, validationErrors).replace('w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white', '')}
          />
          {formData.provinceCode && validationErrors.provinceCode && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              {validationErrors.provinceCode}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
          <CustomDropdown
            name="cityCode"
            value={formData.cityCode || ""}
            onChange={handleChange}
            options={[
              { value: "", label: "Select City" },
              ...(addressData.cities[formData.provinceCode]?.map((c) => ({ value: c.code, label: c.name })) || [])
            ]}
            placeholder="Select City"
            disabled={!formData.provinceCode}
            error={!!validationErrors.cityCode}
            className={getInputClassName('cityCode', formData, validationErrors).replace('w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white', '')}
          />
          {formData.cityCode && validationErrors.cityCode && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              {validationErrors.cityCode}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay <span className="text-red-500">*</span></label>
          <input 
            name="barangay" 
            type="text" 
            value={formData.barangay || ""} 
            onChange={handleChange} 
            className={getInputClassName('barangay', formData, validationErrors)}
            placeholder="Enter barangay name"
            disabled={!formData.cityCode}
          />
          {formData.barangay && validationErrors.barangay && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.barangay}
            </div>
          )}
        </div>
      </div>
      {(isTeacher || isAdmin) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">TIN</label>
            <input 
              name="tin" 
              type="text" 
              value={formData.tin || ""} 
              onChange={handleChange} 
              className={getInputClassName('tin', formData, validationErrors)}
              placeholder="123-456-789"
              maxLength="14"
            />
            {formData.tin && validationErrors.tin && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FaTimes />
                {validationErrors.tin}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SSS</label>
            <input 
              name="sss" 
              type="text" 
              value={formData.sss || ""} 
              onChange={handleChange} 
              className={getInputClassName('sss', formData, validationErrors)}
              placeholder="34-1234567-9"
              maxLength="12"
            />
            {formData.sss && validationErrors.sss && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FaTimes />
                {validationErrors.sss}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pag-ibig</label>
            <input 
              name="pagibig" 
              type="text" 
              value={formData.pagibig || ""} 
              onChange={handleChange} 
              className={getInputClassName('pagibig', formData, validationErrors)}
              placeholder="1234-5678-9123"
              maxLength="14"
            />
            {formData.pagibig && validationErrors.pagibig && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FaTimes />
                {validationErrors.pagibig}
              </div>
            )}
          </div>
        </div>
      )}
        
     </>
   );

  const renderStudentFields = () => (
    <>
      <div className="bg-[#232c67] text-white rounded-lg px-4 py-3 mb-6 font-semibold text-lg">
        Student Details
        {formData.dob && !validationErrors.dob && (() => {
          // Calculate level for display in header using same method as validation
          const referenceDate = new Date("2025-08-04");
          const birthDate = new Date(formData.dob);
          const timeDiff = referenceDate.getTime() - birthDate.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const years = Math.floor(daysDiff / 365.25);
          const remainingDays = daysDiff % 365.25;
          const months = Math.floor(remainingDays / 30.44);
          const age = years + months / 12;
          let levelId = null;
          if (age >= 1.8 && age < 3) {
            levelId = 1;
          } else if (age >= 3 && age < 4) { // Level 2: 3-4 years
            levelId = 2;
          } else if (age >= 4 && age < 5) {
            levelId = 3;
          }
          const levelNames = { 1: 'Discoverer', 2: 'Explorer', 3: 'Adventurer' };
          return levelId ? (
            <span className="ml-3 text-sm font-normal bg-white bg-opacity-20 px-2 py-1 rounded">
              Level {levelId}: {levelNames[levelId]}
            </span>
          ) : '';
        })()}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Student Age Requirements</p>
            <p className="text-blue-700">
              Students must be between 1.8 and 5 years old as of August 4, 2025. 
              Birthdates are automatically validated against the following ranges:
            </p>
                         <ul className="mt-2 text-blue-700 space-y-1">
               <li>• <strong>Level 1 (Discoverer):</strong> Aug 5, 2022 - Nov 4, 2023 (Age 1.8-3 years)</li>
               <li>• <strong>Level 2 (Explorer):</strong> Aug 5, 2021 - Aug 4, 2022 (Age 3-4 years)</li>
               <li>• <strong>Level 3 (Adventurer):</strong> Aug 5, 2020 - Aug 4, 2021 (Age 4-5 years)</li>
             </ul>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input 
            name="first_name" 
            type="text" 
            value={formData.first_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('first_name', formData, validationErrors)}
            placeholder="Enter first name"
          />
          {formData.first_name && validationErrors.first_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.first_name}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
          <input 
            name="middle_name" 
            type="text" 
            value={formData.middle_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('middle_name', formData, validationErrors)}
            placeholder="Enter middle name"
          />
          {formData.middle_name && validationErrors.middle_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.middle_name}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input 
            name="last_name" 
            type="text" 
            value={formData.last_name || ""} 
            onChange={handleChange} 
            className={getInputClassName('last_name', formData, validationErrors)}
            placeholder="Enter last name"
          />
          {formData.last_name && validationErrors.last_name && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.last_name}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
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
          {formData.gender && validationErrors.gender && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              {validationErrors.gender}
            </div>
          )}
        </div>
        <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">
             Date of Birth <span className="text-red-500">*</span>
             <span className="text-xs text-gray-500 ml-2 font-normal">
               (Valid: Aug 5, 2020 - Nov 4, 2023)
             </span>
           </label>
           <input 
             name="dob" 
             type="date" 
             value={formData.dob || ""} 
             onChange={handleChange} 
             className={getInputClassName('dob', formData, validationErrors)}
             min="2020-08-05"
             max="2023-11-04"
           />
          {formData.dob && validationErrors.dob && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.dob}
            </div>
          )}
          {formData.dob && !validationErrors.dob && (
            <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
              <FaCheckCircle />
              Valid birthdate for student enrollment: 
              {(() => {
                // Calculate level for display using same method as validation
                const referenceDate = new Date("2025-08-04");
                const birthDate = new Date(formData.dob);
                const timeDiff = referenceDate.getTime() - birthDate.getTime();
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const years = Math.floor(daysDiff / 365.25);
                const remainingDays = daysDiff % 365.25;
                const months = Math.floor(remainingDays / 30.44);
                const age = years + months / 12;
                
                return ` ${years} years, ${months} months`;
              })()}
            </div>
          )}
                
         
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment Date</label>
          <input 
            name="enrollment_date" 
            type="date" 
            value={formData.enrollment_date || getTodayDateString()} 
            onChange={handleChange} 
            className="border-2 border-gray-300 bg-white w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] caret-[#232c67]" 
          />
        </div>
      </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
       
         <div>
           <label className="block text-sm font-semibold text-gray-700 mb-2">Handedness</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="handedness"
                value="Left"
                checked={formData.handedness === "Left"}
                onChange={handleChange}
                className="text-[#232c67] focus:ring-[#232c67]"
              />
              Left
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="handedness"
                value="Right"
                checked={formData.handedness === "Right"}
                onChange={handleChange}
                className="text-[#232c67] focus:ring-[#232c67]"
              />
              Right
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Class Schedule <span className="text-red-500">*</span></label>
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
          {formData.class_schedule && validationErrors.class_schedule && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              {validationErrors.class_schedule}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ProtectedRoute role="Super Admin">
      <main className="flex-1">
        {/* Header Section with Back Button and User Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Users</span>
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select User Type</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Choose the type of user you want to add to the system</p>
                     <div className="flex flex-wrap gap-3">
             {userTypes.map((type) => {
               // Get the appropriate icon for each user type
               const getIcon = (userType) => {
                 switch (userType) {
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
                   key={type}
                   type="button"
                   className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                     userType === type 
                       ? 'bg-[#232c67] text-white border-[#232c67] shadow-sm' 
                       : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                   }`}
                   onClick={() => setUserType(type)}
                 >
                   {getIcon(type)}
                   {type}
                 </button>
               );
             })}
           </div>
        </div>
        
        {/* Form Section */}
        {userType && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-auto md:h-[calc(100vh-250px)] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Add {userType} Details</h3>
              <p className="text-sm text-gray-600">Fill in the required information to create a new {userType.toLowerCase()} account</p>
           
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-6 flex-1 overflow-y-auto md:overflow-y-auto overflow-y-visible">
              {userType === "Admin" && renderTeacherParentAdminFields(false, true)}
              {userType === "Teacher" && renderTeacherParentAdminFields(true, false)}
              {userType === "Parent" && renderTeacherParentAdminFields(false, false)}
              {userType === "Student" && renderStudentFields()}
            </form>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleClear}
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear 
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                  isFormValid 
                    ? 'bg-[#232c67] text-white hover:bg-[#1a1f4d] shadow-sm' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaClipboardCheck className="text-sm" />
                  Add {userType}
                </div>
              </button>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
