"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaTimes, FaUsers, FaClipboardCheck, FaCalendarAlt, FaChevronDown, FaUserShield, FaUserTie, FaChalkboardTeacher, FaChild } from "react-icons/fa";
import ReactCountryFlag from "react-country-flag";
import ProtectedRoute from "../../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import fullAddress from '../../../../data/northern_mindanao_psgc.json';
import { API } from '@/config/api';


const userTypes = ["Admin", "Teacher", "Parent/Student"];

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
          if (!value) return { isValid: false, message: "" }; // Required field

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

  // Student date of birth validation - uses dynamic age requirements
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
    
    // Convert to years and months (more accurate than the previous method)
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
    } else if (age >= 3 && age < 4) { // Level 2: 3-4 years
      levelId = 2;
    } else if (age >= 4 && age < 5) {
      levelId = 3;
    }
    
    if (!levelId) {
      // Format age to show more precision for better error messages
      const ageYears = Math.floor(age);
      const ageMonths = Math.floor((age - ageYears) * 12);
      const ageDisplay = ageMonths > 0 ? `${ageYears} years, ${ageMonths} months` : `${ageYears} years`;
      return { isValid: false, message: `Only students aged 1.8, 3, or 4 are allowed. Given age: ${ageDisplay} (${age.toFixed(1)} years)` };
    }
    
    // Get the date range for the determined level
    const range = levelDateRanges[levelId];
    
    // Check if birthdate falls within the valid range for the level
    // Compare dates using date strings (YYYY-MM-DD) to avoid time component issues
    // Note: The end date is inclusive (student born on end date should be accepted)
    const birthDateStr = birthDate.toISOString().split('T')[0];
    const rangeStartStr = range.start.toISOString().split('T')[0];
    const rangeEndStr = range.end.toISOString().split('T')[0];
    
    // Debug: Log the date comparison (remove after testing)
    // console.log('Date validation:', { birthDateStr, rangeStartStr, rangeEndStr, age });
    
    if (birthDateStr < rangeStartStr || birthDateStr > rangeEndStr) {
      const levelInfo = ageRequirements.levels[levelId];
      return { 
        isValid: false, 
        message: `Birthdate must be between ${levelInfo.start_date_formatted} and ${levelInfo.end_date_formatted} for Level ${levelId} (${levelInfo.name})` 
      };
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

  // Custom province validation - first letter capital, can contain numbers
  customProvince: (value) => {
    if (!value) return { isValid: false, message: "" };
    const provinceRegex = /^[A-Z][a-zA-Z0-9\s]*$/;
    if (!provinceRegex.test(value)) {
      return { isValid: false, message: "First letter must be capital, letters, numbers and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "Province must be at least 2 characters" };
    }
    return { isValid: true, message: "" };
  },

  // Custom city validation - first letter capital, can contain numbers
  customCity: (value) => {
    if (!value) return { isValid: false, message: "" };
    const cityRegex = /^[A-Z][a-zA-Z0-9\s]*$/;
    if (!cityRegex.test(value)) {
      return { isValid: false, message: "First letter must be capital, letters, numbers and spaces allowed" };
    }
    if (value.length < 2) {
      return { isValid: false, message: "City must be at least 2 characters" };
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



// Custom Dropdown Component with "Other" option support
const CustomDropdown = ({ 
  name, 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false, 
  error = false,
  className = "",
  allowOther = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customError, setCustomError] = useState('');
  const dropdownRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowTextInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  const handleSelect = (optionValue) => {
    if (optionValue === 'OTHER') {
      setShowTextInput(true);
      setCustomValue('');
    } else {
      onChange({ target: { name, value: optionValue } });
      setIsOpen(false);
      setShowTextInput(false);
    }
  };

  const handleCustomInput = (e) => {
    let value = e.target.value;
    
    // Auto-capitalize first letter
    if (value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    setCustomValue(value);
    
    // Validate the input
    if (name === 'provinceCode') {
      const validation = validators.customProvince(value);
      setCustomError(validation.isValid ? '' : validation.message);
    } else if (name === 'cityCode') {
      const validation = validators.customCity(value);
      setCustomError(validation.isValid ? '' : validation.message);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim() && !customError) {
      onChange({ target: { name, value: customValue.trim() } });
      setIsOpen(false);
      setShowTextInput(false);
      setCustomError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setShowTextInput(false);
      setCustomValue('');
    }
  };

  // Check if current value is a custom value (not in predefined options)
  const isCustomValue = value && !options.find(opt => opt.value === value);
  const displayValue = isCustomValue ? value : (options.find(opt => opt.value === value)?.label || '');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showTextInput ? (
        <div>
          <div className="flex gap-2 items-center relative z-50">
            <input
              ref={textInputRef}
              type="text"
              value={customValue}
              onChange={handleCustomInput}
              onKeyDown={handleKeyPress}
              placeholder={`Enter ${name === 'provinceCode' ? 'province' : 'city'} name`}
              className={`flex-1 p-2 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 caret-[#232c67] relative z-10 ${
                customError 
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                  : customValue && !customError
                    ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                    : 'border-[#232c67] focus:border-[#232c67] focus:ring-[#232c67]'
              }`}
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={!!customError || !customValue.trim()}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[45px] font-semibold shadow-lg relative z-50 ${
                customError || !customValue.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
              } text-white`}
              title="Confirm"
            >
              <FaCheckCircle className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTextInput(false);
                setCustomValue('');
                setCustomError('');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center min-w-[45px] font-semibold shadow-lg hover:shadow-xl relative z-50"
              title="Cancel"
            >
              <FaTimes className="text-base" />
            </button>
          </div>
          {customError && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {customError}
            </div>
          )}
        </div>
      ) : (
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
      )}
      
      {isOpen && !showTextInput && (
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
          {allowOther && (
            <button
              type="button"
              onClick={() => handleSelect('OTHER')}
              className="w-full px-3 py-2 text-left transition-colors text-gray-600 hover:bg-gray-100 border-t border-gray-200"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">✏️</span>
                Other (Type custom)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function AddUserPage() {
  const [userType, setUserType] = useState("");
  const [activeSection, setActiveSection] = useState("parent"); // "parent" or "student"
  const [parentFormData, setParentFormData] = useState({ country: "Philippines" });
  const [studentFormData, setStudentFormData] = useState({
    enrollment_date: getTodayDateString(),
  });
  const [isManualLevel, setIsManualLevel] = useState(false); // Toggle for manual level selection
  const [manualLevelId, setManualLevelId] = useState(null); // Manual level selection
  const [studNotes, setStudNotes] = useState(''); // Notes for manual level selection
  const [studentsList, setStudentsList] = useState([]); // Track added students
  const [parentAdded, setParentAdded] = useState(false); // Track if parent has been added
  const [parentUserId, setParentUserId] = useState(null); // Store parent's user_id
  const [parentProfileId, setParentProfileId] = useState(null); // Store parent's profile_id
  const [formData, setFormData] = useState({
    enrollment_date: getTodayDateString(),
    country: "Philippines",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [addressData, setAddressData] = useState({
    countries: [],
    provinces: [],
    cities: {},
    barangays: {}
  });
  
  // Dynamic age requirements state
  const [ageRequirements, setAgeRequirements] = useState(null);
  const [loadingAgeRequirements, setLoadingAgeRequirements] = useState(true);
  
  // Available slots state
  const [availableSlots, setAvailableSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [touchedFields, setTouchedFields] = useState({});
  const router = useRouter();

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
      } finally {
        setLoadingAgeRequirements(false);
      }
    };
    
    fetchAgeRequirements();
  }, []);

  // Function to determine level from birthdate or manual selection
  const getCurrentLevel = () => {
    if (userType === "Parent/Student") {
      if (activeSection === "student") {
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
      }
    } else if (userType === "Student") {
      // Check manual level first
      if (isManualLevel && manualLevelId) {
        return manualLevelId;
      }
      // Otherwise calculate from birthdate
      if (formData.dob && ageRequirements) {
        const referenceDate = new Date(ageRequirements.reference_date);
        const birthDate = new Date(formData.dob);
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
    }
    return null;
  };

  // Fetch available slots when level is determined
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const levelId = getCurrentLevel();
      
      // Only fetch if we have a valid level
      if (!levelId || (userType !== "Parent/Student" && userType !== "Student")) {
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
    
    fetchAvailableSlots();
  }, [
    userType,
    activeSection,
    studentFormData.dob,
    formData.dob,
    isManualLevel,
    manualLevelId,
    ageRequirements
  ]);

  // Reset form when user type changes
  useEffect(() => {
    if (userType === "Parent/Student") {
      setParentFormData({ country: "Philippines" });
      setStudentFormData({ enrollment_date: getTodayDateString() });
      setActiveSection("parent");
      setStudentsList([]);
      setParentAdded(false);
      setParentUserId(null);
      setParentProfileId(null);
      setIsManualLevel(false);
      setManualLevelId(null);
      setStudNotes('');
    } else {
      setFormData({ enrollment_date: getTodayDateString(), country: "Philippines" });
      setIsManualLevel(false);
      setManualLevelId(null);
      setStudNotes('');
    }
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
    if (userType === "Parent/Student") {
      if (activeSection === "parent") {
        setParentFormData({ country: "Philippines" });
      } else {
        setStudentFormData({ enrollment_date: getTodayDateString() });
        setIsManualLevel(false);
        setManualLevelId(null);
        setStudNotes('');
      }
    } else {
      setFormData({ enrollment_date: getTodayDateString(), country: "Philippines" });
      setIsManualLevel(false);
      setManualLevelId(null);
      setStudNotes('');
    }
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
        return validators.studentDob(value, ageRequirements);
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
    
    if (userType === "Parent/Student") {
      if (activeSection === "parent") {
        // Parent validation - use parentFormData
        ['first_name', 'middle_name', 'last_name', 'dob', 'email', 'country', 'provinceCode', 'cityCode', 'barangay'].forEach(field => {
          const validation = validateField(field, parentFormData[field] || formData[field]);
          if (!validation.isValid) {
            errors[field] = validation.message;
          }
        });
        
        // Contact validation for parent
        const contactValidation = validateField('contact', parentFormData.contact || formData.contact);
        if (!contactValidation.isValid) {
          errors.contact = contactValidation.message;
        }
      } else {
        // Student validation - use studentFormData
        ['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule'].forEach(field => {
          const validation = validateField(field, studentFormData[field] || formData[field]);
          if (!validation.isValid) {
            errors[field] = validation.message;
          }
        });
        
        // Special validation for student date of birth (age 2-4) - skip if manual level is selected
        if (!isManualLevel) {
          const dobValidation = validators.studentDob(studentFormData.dob || formData.dob, ageRequirements);
          if (!dobValidation.isValid) {
            errors.dob = dobValidation.message;
          }
        } else {
          // When manual level is selected, still validate that DOB is provided
          if (!studentFormData.dob && !formData.dob) {
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
      }
    } else if (userType === "Student") {
      // Student validation - use dob field but validate with studentDob logic
      ['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule'].forEach(field => {
        const validation = validateField(field, formData[field]);
        if (!validation.isValid) {
          errors[field] = validation.message;
        }
      });
      
      // Special validation for student date of birth (age 2-4) - skip if manual level is selected
      if (!isManualLevel) {
        const dobValidation = validators.studentDob(formData.dob, ageRequirements);
        if (!dobValidation.isValid) {
          errors.dob = dobValidation.message;
        }
      } else {
        // When manual level is selected, still validate that DOB is provided
        if (!formData.dob) {
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
    } else {
      // Admin/Teacher validation - use dob for age 18+ validation
      ['first_name', 'middle_name', 'last_name', 'dob', 'email', 'country', 'provinceCode', 'cityCode', 'barangay'].forEach(field => {
        const validation = validateField(field, formData[field]);
        if (!validation.isValid) {
          errors[field] = validation.message;
        }
      });
      
      // Contact validation for all non-student users (Admin/Teacher)
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

  // Sync formData with parentFormData or studentFormData when activeSection changes
  useEffect(() => {
    if (userType === "Parent/Student") {
      if (activeSection === "parent") {
        setFormData(parentFormData);
      } else {
        setFormData(studentFormData);
      }
    }
  }, [activeSection, userType, parentFormData, studentFormData]);

  useEffect(() => {
    if (userType === "Parent/Student") {
      console.log('useEffect triggered - Parent/Student form changed:', { parentFormData, studentFormData, activeSection, isManualLevel, manualLevelId, studNotes });
      validateForm();
    } else {
      console.log('useEffect triggered - formData changed:', formData);
      console.log('useEffect - current contact value:', formData.contact);
      validateForm();
    }
  }, [formData, userType, parentFormData, studentFormData, activeSection, ageRequirements, isManualLevel, manualLevelId, studNotes]);

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

    // Handle Parent/Student section differently
    if (userType === "Parent/Student") {
      if (activeSection === "parent") {
        // Handle cascading address fields for parent
        let updatedParentData = { ...parentFormData, [name]: processedValue };
        
        // Reset city and barangay when province changes
        if (name === 'provinceCode') {
          updatedParentData.cityCode = '';
          updatedParentData.barangay = '';
        }
        
        // Reset barangay when city changes
        if (name === 'cityCode') {
          updatedParentData.barangay = '';
        }

        setParentFormData(updatedParentData);
        setFormData(updatedParentData); // Also update formData for validation
      } else {
        // Student section
        setStudentFormData(prev => ({ ...prev, [name]: processedValue }));
        setFormData(prev => ({ ...prev, [name]: processedValue })); // Also update formData for validation
      }
    } else {
      // Handle cascading address fields for Admin/Teacher
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
    }

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

  // Handle Confirm in Parent section (just switch to student section, don't add parent yet)
  const handleAddParent = () => {
    if (!isFormValid) return;
    // Just switch to student section, don't add parent yet
    setActiveSection("student");
  };

  // Handle Add Student (when in Parent/Student tab) - saves to local list only, doesn't add to database
  const handleAddStudent = () => {
    if (!isFormValid) return false;
    
    // Check if manual level is selected and required fields are filled
    if (isManualLevel) {
      if (!manualLevelId) {
        toast.error("Please select a class level when using manual assignment.");
        return false;
      }
      if (!studNotes || studNotes.trim() === '') {
        toast.error("Please provide notes explaining why this student is manually assigned to this level.");
        return false;
      }
    }
    
    // Use manual level if selected, otherwise calculate from age
    let levelId = null;
    let levelName = '';
    
    if (isManualLevel && manualLevelId) {
      // Use manually selected level
      levelId = manualLevelId;
      levelName = ageRequirements?.levels[manualLevelId]?.name || 
        (manualLevelId === 1 ? 'Discoverer' : manualLevelId === 2 ? 'Explorer' : 'Adventurer');
    } else {
      // Calculate level based on age (using dynamic reference date)
      if (!ageRequirements) {
        toast.error("Age requirements are loading. Please wait.");
        return false;
      }
      
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
        levelName = ageRequirements.levels[1].name;
      } else if (age >= 3 && age < 4) {
        levelId = 2;
        levelName = ageRequirements.levels[2].name;
      } else if (age >= 4 && age < 5) {
        levelId = 3;
        levelName = ageRequirements.levels[3].name;
      }
    }
    
    // Add student to the list (not to database yet)
    const newStudent = {
      ...studentFormData,
      tempId: studentsList.length + 1, // Temporary ID for list
      levelId: levelId,
      level: levelName,
      isManualLevel: isManualLevel,
      stud_notes: isManualLevel ? studNotes : null
    };
    
    setStudentsList(prevList => [...prevList, newStudent]);
    
      // Reset student form and manual level selection
      setStudentFormData({ enrollment_date: getTodayDateString() });
      setIsManualLevel(false);
      setManualLevelId(null);
      setStudNotes('');
      setValidationErrors({});
      // Also reset formData for student section
      setFormData({ enrollment_date: getTodayDateString() });
    
    const assignmentNote = isManualLevel ? ' (Manually Assigned)' : '';
    toast.success(`Student saved to list! Assigned Class: ${levelName}${assignmentNote}`);
    
    return true;
  };

  // Handle final submit (when user clicks Confirm in student section - adds both parent and student(s))
  const handleFinalSubmit = async () => {
    // Validate both parent and student forms
    const errors = {};
    
    // Validate parent form
    ['first_name', 'middle_name', 'last_name', 'dob', 'email', 'country', 'provinceCode', 'cityCode', 'barangay'].forEach(field => {
      const validation = validateField(field, parentFormData[field] || formData[field]);
      if (!validation.isValid) {
        errors[`parent_${field}`] = validation.message;
      }
    });
    
    const contactValidation = validateField('contact', parentFormData.contact || formData.contact);
    if (!contactValidation.isValid) {
      errors.parent_contact = contactValidation.message;
    }
    
    // Validate student form (only if there's current student data or no students added yet)
    const hasCurrentStudentData = studentFormData.first_name && 
                                 studentFormData.last_name && 
                                 studentFormData.dob && 
                                 studentFormData.gender && 
                                 studentFormData.class_schedule;
    
    let isStudentValid = true;
    // Only validate student form if there's current student data OR no students added yet
    if (hasCurrentStudentData || studentsList.length === 0) {
      ['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule'].forEach(field => {
        const validation = validateField(field, studentFormData[field] || formData[field]);
        if (!validation.isValid) {
          errors[`student_${field}`] = validation.message;
        }
      });
      
      // Special validation for student date of birth - skip age validation if manual level is selected
      if (!isManualLevel) {
        const dobValidation = validators.studentDob(studentFormData.dob || formData.dob, ageRequirements);
        if (!dobValidation.isValid) {
          errors.student_dob = dobValidation.message;
        }
      } else {
        // When manual level is selected, still validate that DOB is provided
        if (!studentFormData.dob && !formData.dob) {
          errors.student_dob = "Date of birth is required";
        }
        // Validate manual level selection
        if (!manualLevelId) {
          errors.student_manualLevel = "Please select a class level";
        }
        if (!studNotes || studNotes.trim() === '') {
          errors.student_studNotes = "Notes are required when manually assigning a class level";
        }
      }
      
      isStudentValid = !['first_name', 'middle_name', 'last_name', 'gender', 'class_schedule', 'dob'].some(field => errors[`student_${field}`]) &&
                      !errors.student_manualLevel && !errors.student_studNotes;
    }
    
    // Check if forms are valid
    const isParentValid = !['first_name', 'middle_name', 'last_name', 'dob', 'email', 'country', 'provinceCode', 'cityCode', 'barangay', 'contact'].some(field => errors[`parent_${field}`]);
    
    // Must have at least one student (either in list or in current form)
    const hasStudents = studentsList.length > 0 || (hasCurrentStudentData && isStudentValid);
    
    if (!isParentValid || !isStudentValid || !hasStudents) {
      if (!isParentValid) {
        toast.error("Please fill in all required parent fields correctly.");
        setActiveSection("parent");
      } else if (!isStudentValid || !hasStudents) {
        toast.error("Please add at least one student with all required fields filled.");
      }
      return;
    }
    
    try {
      // Step 1: Add parent first to get user_id and parent_profile_id (or use stored values)
      let currentParentUserId = parentUserId;
      let currentParentProfileId = parentProfileId;
      
      if (!parentAdded) {
        const parentApiURL = API.user.addUser();
        let parentDataToSend = {
          ...parentFormData,
          user_type: "parent",
        };
        
        // Extract address names from codes for backend
        const provinceOption = addressData.provinces.find(p => p.code === parentFormData.provinceCode);
        const province = provinceOption ? provinceOption.name : parentFormData.provinceCode;
        
        const cityOption = addressData.cities[parentFormData.provinceCode]?.find(c => c.code === parentFormData.cityCode);
        const city = cityOption ? cityOption.name : parentFormData.cityCode;
        
        parentDataToSend.country = parentFormData.country;
        parentDataToSend.province = province;
        parentDataToSend.city = city;
        parentDataToSend.barangay = parentFormData.barangay;
        
        // Format contact number for backend
        if (parentFormData.contact) {
          let cleanDigits = parentFormData.contact.replace(/\D/g, '');
          if (cleanDigits.length === 10 && cleanDigits.startsWith('9')) {
            parentDataToSend.contact = '0' + cleanDigits;
          } else if (cleanDigits.startsWith('09') && cleanDigits.length === 10) {
            parentDataToSend.contact = cleanDigits;
          } else if (cleanDigits.startsWith('009') && cleanDigits.length === 11) {
            parentDataToSend.contact = cleanDigits.substring(1);
          } else {
            if (cleanDigits.length >= 10) {
              const tenDigits = cleanDigits.substring(0, 10);
              if (tenDigits.startsWith('9')) {
                parentDataToSend.contact = '0' + tenDigits;
              } else {
                parentDataToSend.contact = '09' + tenDigits.substring(1);
              }
            } else {
              parentDataToSend.contact = parentFormData.contact;
            }
          }
        }
        
        if (city) {
          parentDataToSend.municipality_city = city;
        }
        
        parentDataToSend.editor_id = localStorage.getItem("userId");
        
        const parentRes = await fetch(parentApiURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parentDataToSend),
        });
        
        const parentResult = await parentRes.json();
        if (!parentRes.ok) {
          toast.error("Failed to add parent: " + (parentResult.message || "Unknown error"));
          return;
        }
        
        currentParentUserId = parentResult.user_id;
        currentParentProfileId = parentResult.parent_profile_id;
        setParentUserId(currentParentUserId);
        setParentProfileId(currentParentProfileId);
        setParentAdded(true);
      }
      
      // Step 2: Prepare all students for database (including current form if it has data)
      const allStudents = [...studentsList];
      
      // Add current student to list if it has valid data
      if (hasCurrentStudentData && isStudentValid) {
        // Validate manual level if selected
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
        
        // Use manual level if selected, otherwise calculate from age
        let levelId = null;
        let levelName = '';
        
        if (isManualLevel && manualLevelId) {
          // Use manually selected level
          levelId = manualLevelId;
          levelName = ageRequirements?.levels[manualLevelId]?.name || 
            (manualLevelId === 1 ? 'Discoverer' : manualLevelId === 2 ? 'Explorer' : 'Adventurer');
        } else {
          // Calculate level based on age (using dynamic reference date)
          if (!ageRequirements) {
            toast.error("Age requirements are loading. Please wait.");
            return;
          }
          
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
            levelName = ageRequirements.levels[1].name;
          } else if (age >= 3 && age < 4) {
            levelId = 2;
            levelName = ageRequirements.levels[2].name;
          } else if (age >= 4 && age < 5) {
            levelId = 3;
            levelName = ageRequirements.levels[3].name;
          }
        }
        
        allStudents.push({
          ...studentFormData,
          tempId: allStudents.length + 1,
          levelId: levelId,
          level: levelName,
          isManualLevel: isManualLevel,
          stud_notes: isManualLevel ? studNotes : null
        });
      }
      
      // Step 3: Check if we have at least one student
      if (allStudents.length === 0) {
        toast.error("Please add at least one student before confirming.");
        return;
      }
      
      // Step 4: Add all students to database with parent_id and parent_profile_id
      const studentApiURL = API.user.addStudent();
      const editorId = localStorage.getItem("userId");
      
      for (const student of allStudents) {
        let studentDataToSend = {
          stud_firstname: student.first_name,
          stud_middlename: student.middle_name || '',
          stud_lastname: student.last_name,
          stud_birthdate: student.dob,
          stud_enrollment_date: student.enrollment_date || getTodayDateString(),
          stud_handedness: student.handedness && student.handedness.trim() !== '' ? student.handedness : 'Not Yet Established',
          stud_gender: student.gender,
          stud_schedule_class: student.class_schedule,
          stud_school_status: "Active",
          editor_id: editorId,
          parent_id: currentParentUserId,          // Link to parent's user_id
          parent_profile_id: currentParentProfileId, // Link to parent's profile_id
        };
        
        // Only send level_id if it's a manual assignment
        // For automatic assignments, don't send level_id and let backend calculate it
        if (student.isManualLevel && student.levelId) {
          studentDataToSend.level_id = student.levelId;
          studentDataToSend.stud_notes = student.stud_notes || null;
        } else {
          // For automatic assignments, don't send level_id - backend will calculate from age
          // Don't send stud_notes either (it should be null/empty)
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
        if (!studentRes.ok) {
          toast.error(`Failed to add student ${student.first_name} ${student.last_name}: ${studentResult.message || "Unknown error"}`);
          return;
        }
      }
      
      // Step 5: All students added successfully with parent linking
      toast.success(`Parent and ${allStudents.length} student(s) added successfully!`);
      setTimeout(() => router.push("/SuperAdminSection/Users"), 2000);
    } catch (error) {
      toast.error("Error submitting: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
  
    // Don't handle Parent/Student here, they have their own handlers
    if (userType === "Parent/Student") {
      return;
    }
  
    const isStudent = userType === "Student";
  
    const apiURL = isStudent
      ? API.user.addStudent()
      : API.user.addUser();
  
    let dataToSend = {
      ...formData,
      // Photo will be automatically assigned by the backend based on user type and gender
    };
  
    if (!isStudent) {
      dataToSend.user_type = userType.toLowerCase();
      
      // Extract address names from codes for backend
      // Check if provinceCode is a custom value (not in predefined options)
      const provinceOption = addressData.provinces.find(p => p.code === formData.provinceCode);
      const province = provinceOption ? provinceOption.name : formData.provinceCode;
      
      // Check if cityCode is a custom value (not in predefined options)
      const cityOption = addressData.cities[formData.provinceCode]?.find(c => c.code === formData.cityCode);
      const city = cityOption ? cityOption.name : formData.cityCode;
      
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
      
      // Calculate level if not manually selected
      let levelId = null;
      if (isManualLevel && manualLevelId) {
        levelId = manualLevelId;
      } else if (ageRequirements && formData.dob) {
        // Calculate level based on age
        const referenceDate = new Date(ageRequirements.reference_date);
        const birthDate = new Date(formData.dob);
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
        editor_id: localStorage.getItem("userId"), // Add editor_id for system logging
      };
      
      // Only send level_id if it's a manual assignment
      // For automatic assignments, don't send level_id and let backend calculate it
      if (isManualLevel && levelId) {
        dataToSend.level_id = levelId;
        dataToSend.stud_notes = studNotes || null;
      } else {
        // For automatic assignments, don't send level_id - backend will calculate from age
        dataToSend.stud_notes = null;
      }
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
  const getInputClassName = (fieldName, formData, validationErrors) => {
    const baseClass = "w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 border-2 bg-white caret-[#232c67]";
    
    // Special handling for date of birth validation based on user type
    if (fieldName === 'dob' && formData[fieldName]) {
      const isStudent = userType === "Student" || (userType === "Parent/Student" && activeSection === "student");
      
      if (isStudent) {
        // Student validation - skip age validation if manual level is enabled
        if (isManualLevel) {
          // In manual mode, just check if DOB is provided (required field)
          if (!formData[fieldName]) {
            return `${baseClass} border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500`;
          } else {
            // DOB is provided, show green (age doesn't matter in manual mode)
            return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
          }
        } else {
          // Automatic mode - validate age using studentDob validator
          const dobValidation = validators.studentDob(formData[fieldName], ageRequirements);
          if (!dobValidation.isValid) {
            return `${baseClass} border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500`;
          } else {
            return `${baseClass} border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500`;
          }
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
  };

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
                return `${age} years old`;
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
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
               className={`flex-1 rounded-r-lg p-2 caret-[#232c67] ${getInputClassName('contact', formData, validationErrors).replace('w-full', '')}`}
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
          <input
            name="country"
            type="text"
            value="Philippines"
            disabled
            className="w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed"
          />
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
            allowOther={true}
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
            allowOther={true}
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
        {formData.dob && !validationErrors.dob && ageRequirements && !isManualLevel && (() => {
          // Calculate level for display in header using dynamic reference date (only if not manual)
          const referenceDate = new Date(ageRequirements.reference_date);
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
          return levelId ? (
            <span className="ml-3 text-sm font-normal bg-white bg-opacity-20 px-2 py-1 rounded">
              Level {levelId}: {ageRequirements.levels[levelId].name}
            </span>
          ) : '';
        })()}
        {isManualLevel && manualLevelId && (
          <span className="ml-3 text-sm font-normal bg-yellow-400 bg-opacity-30 px-2 py-1 rounded">
            Level {manualLevelId}: {ageRequirements?.levels[manualLevelId]?.name || (manualLevelId === 1 ? 'Discoverer' : manualLevelId === 2 ? 'Explorer' : 'Adventurer')} (Manual)
          </span>
        )}
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
          </label>
           <input 
             name="dob" 
             type="date" 
             value={formData.dob || ""} 
             onChange={handleChange} 
             className={getInputClassName('dob', formData, validationErrors)}
             min={isManualLevel ? undefined : (ageRequirements ? ageRequirements.levels[3].start_date : "2020-08-05")}
             max={isManualLevel ? undefined : (ageRequirements ? ageRequirements.levels[1].end_date : "2023-11-04")}
             disabled={false}
           />
          {formData.dob && validationErrors.dob && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes />
              {validationErrors.dob}
            </div>
          )}
          {formData.dob && !validationErrors.dob && ageRequirements && !isManualLevel && (
            <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
              <FaCheckCircle />
              Valid birthdate for student enrollment: 
              {(() => {
                // Calculate level for display using dynamic reference date
                const referenceDate = new Date(ageRequirements.reference_date);
                const birthDate = new Date(formData.dob);
                const timeDiff = referenceDate.getTime() - birthDate.getTime();
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const years = Math.floor(daysDiff / 365.25);
                const remainingDays = daysDiff % 365.25;
                const months = Math.floor(remainingDays / 30.44);
                
                return ` ${years} years, ${months} months`;
              })()}
            </div>
          )}
          {isManualLevel && formData.dob && (
            <div className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              Manual level assignment enabled: Age will not be used to determine class level. Please select the class level below.
            </div>
          )}
          {isManualLevel && !formData.dob && (
            <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <FaExclamationCircle />
              Date of birth is still required for student records (even in manual mode)
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
          {(() => {
            const currentLevel = getCurrentLevel();
            const isLevelDetermined = currentLevel !== null;
            const isScheduleDisabled = !isLevelDetermined || 
              (availableSlots && availableSlots.Morning?.available === 0 && availableSlots.Afternoon?.available === 0);
            
            return (
              <>
                <div className="flex gap-6">
                  <label className={`flex items-center gap-2 text-sm ${!isLevelDetermined ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}>
                    <input
                      type="radio"
                      name="class_schedule"
                      value="Morning"
                      checked={formData.class_schedule === "Morning"}
                      onChange={handleChange}
                      className="text-[#232c67] focus:ring-[#232c67]"
                      disabled={!isLevelDetermined}
                    />
                    <span className="flex items-center gap-2">
                      Morning
                      {!isLevelDetermined ? (
                        <span className="text-xs text-gray-500">(Select birthdate or class level first)</span>
                      ) : loadingSlots ? (
                        <span className="text-xs text-gray-500">(Loading...)</span>
                      ) : availableSlots && availableSlots.Morning !== undefined ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {availableSlots.Morning.enrolled > 0
                            ? `${availableSlots.Morning.enrolled} student${availableSlots.Morning.enrolled !== 1 ? 's' : ''} enrolled`
                            : 'No students enrolled'
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
                      checked={formData.class_schedule === "Afternoon"}
                      onChange={handleChange}
                      className="text-[#232c67] focus:ring-[#232c67]"
                      disabled={!isLevelDetermined}
                    />
                    <span className="flex items-center gap-2">
                      Afternoon
                      {!isLevelDetermined ? (
                        <span className="text-xs text-gray-500">(Select birthdate or class level first)</span>
                      ) : loadingSlots ? (
                        <span className="text-xs text-gray-500">(Loading...)</span>
                      ) : availableSlots && availableSlots.Afternoon !== undefined ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {availableSlots.Afternoon.enrolled > 0
                            ? `${availableSlots.Afternoon.enrolled} student${availableSlots.Afternoon.enrolled !== 1 ? 's' : ''} enrolled`
                            : 'No students enrolled'
                          }
                        </span>
                      ) : null}
                    </span>
                  </label>
                </div>
                {formData.class_schedule && validationErrors.class_schedule && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaExclamationCircle />
                    {validationErrors.class_schedule}
                  </div>
                )}
                {availableSlots && currentLevel && (
                  <div className="text-xs text-gray-600 mt-1">
                    Showing slots for Level {currentLevel} - {ageRequirements?.levels[currentLevel]?.name || ''}
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
                // Clear manual level validation errors when disabled
                setValidationErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.manualLevel;
                  delete newErrors.studNotes;
                  delete newErrors.student_manualLevel;
                  delete newErrors.student_studNotes;
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
                  // Clear validation errors when level is selected
                  setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.manualLevel;
                    delete newErrors.student_manualLevel;
                    return newErrors;
                  });
                }}
                className={`w-full p-2 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 caret-[#232c67] ${
                  validationErrors.manualLevel || validationErrors.student_manualLevel
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
              <p className="text-xs text-gray-600 mt-1">
                Use this option when the student needs a different level due to medical conditions, learning difficulties, or advanced abilities.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes/Reason for Manual Assignment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={studNotes}
                onChange={(e) => {
                  let value = e.target.value;
                  // Auto-capitalize first letter if input is not empty
                  if (value.length > 0) {
                    value = value.charAt(0).toUpperCase() + value.slice(1);
                  }
                  setStudNotes(value);
                  // Clear validation errors when notes are entered
                  setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.studNotes;
                    delete newErrors.student_studNotes;
                    return newErrors;
                  });
                }}
                placeholder="Explain why this student is assigned to this level (e.g., medical condition, learning difficulty, advanced learning ability, etc.)"
                rows={3}
                className={`w-full p-2 rounded-lg border-2 bg-white focus:outline-none focus:ring-2 caret-[#232c67] resize-y ${
                  validationErrors.studNotes || validationErrors.student_studNotes
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
              {!studNotes && isManualLevel && manualLevelId && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <FaExclamationCircle />
                  Notes are required when manually selecting a class level
                </div>
              )}
              {(validationErrors.studNotes || validationErrors.manualLevel || validationErrors.student_studNotes || validationErrors.student_manualLevel) && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <FaExclamationCircle />
                  {validationErrors.studNotes || validationErrors.manualLevel || validationErrors.student_studNotes || validationErrors.student_manualLevel}
                </div>
              )}
            </div>
          </div>
        )}
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
                   case "Parent/Student":
                     return <FaUsers className="text-sm" />;
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
              <h3 className="text-lg font-bold text-gray-900">
                {userType === "Parent/Student" 
                  ? activeSection === "parent" 
                    ? "Add Parent Details" 
                    : "Add Student Details"
                  : `Add ${userType} Details`}
              </h3>
              <p className="text-sm text-gray-600">
                {userType === "Parent/Student"
                  ? activeSection === "parent"
                    ? "Fill in the required information to create a new parent account"
                    : "Fill in the required information to add a student"
                  : `Fill in the required information to create a new ${userType.toLowerCase()} account`}
              </p>
           
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-6 flex-1 overflow-y-auto md:overflow-y-auto overflow-y-visible">
              {userType === "Admin" && renderTeacherParentAdminFields(false, true)}
              {userType === "Teacher" && renderTeacherParentAdminFields(true, false)}
              {userType === "Parent/Student" && (
                <>
                  {activeSection === "parent" && (
                    <>
                      {renderTeacherParentAdminFields(false, false)}
                    </>
                  )}
                  {activeSection === "student" && (
                    <>
                      {studentsList.length > 0 && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">Added Students ({studentsList.length}):</h4>
                          <ul className="list-disc list-inside space-y-2">
                            {studentsList.map((student, idx) => (
                              <li key={idx} className="text-sm text-green-700">
                                <span className="font-medium">
                                  {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                                </span>
                                {' - '}
                                <span className="font-semibold">{student.level}</span>
                                {student.isManualLevel ? (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 font-semibold rounded">
                                    (Manual)
                                  </span>
                                ) : (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-200 text-blue-800 font-semibold rounded">
                                    (Auto)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {renderStudentFields()}
                    </>
                  )}
                </>
              )}
              {userType === "Parent" && renderTeacherParentAdminFields(false, false)}
              {userType === "Student" && renderStudentFields()}
            </form>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              {userType === "Parent/Student" ? (
                <>
                  {activeSection === "parent" && (
                    <>
                      <button
                        onClick={handleClear}
                        type="button"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Clear 
                      </button>
                      <button
                        onClick={handleAddParent}
                        disabled={!isFormValid}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                          isFormValid 
                            ? 'bg-[#232c67] text-white hover:bg-[#1a1f4d] shadow-sm' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-sm" />
                          Confirm
                        </div>
                      </button>
                    </>
                  )}
                  {activeSection === "student" && (
                    <>
                      <button
                        onClick={() => setActiveSection("parent")}
                        type="button"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
                      >
                        <FaArrowLeft className="text-sm" />
                        Back
                      </button>
                      <button
                        onClick={handleClear}
                        type="button"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Clear 
                      </button>
                      <button
                        onClick={handleAddStudent}
                        disabled={!isFormValid}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                          isFormValid 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaClipboardCheck className="text-sm" />
                          Add Student
                        </div>
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={!isFormValid && studentsList.length === 0}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:ring-offset-2 ${
                          (isFormValid || studentsList.length > 0)
                            ? 'bg-[#232c67] text-white hover:bg-[#1a1f4d] shadow-sm' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-sm" />
                          Confirm
                        </div>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
