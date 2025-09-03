"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUser, FaPhone, FaEnvelope, FaArrowLeft, FaTimes, FaEdit, FaCrop, FaCheck, FaUndo } from "react-icons/fa";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useUser } from "../../Context/UserContext";
import fullAddress from '../../../data/full_misamis_oriental_psgc.json';

// --- VALIDATION LOGIC (copied and adapted from AddUser) ---
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
  email: (value) => {
    if (!value) return { isValid: false, message: "" };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, message: "Email must be a valid Gmail address (@gmail.com)" };
    }
    return { isValid: true, message: "" };
  },
  contact: (value) => {
    if (!value) return { isValid: true, message: "" }; // Optional field

    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Check if it's a valid Philippine mobile number
    // Accept either:
    // 1. 10 digits starting with '9' (e.g., 9123456789) - for input
    // 2. 10 digits starting with '09' (e.g., 09123456789) - for stored
    // 3. 11 digits starting with '009' (e.g., 009123456789) - for legacy stored format
    if ((digits.length === 10 && digits.startsWith('9')) ||
      (digits.length === 10 && digits.startsWith('09')) ||
      (digits.length === 11 && digits.startsWith('009'))) {
      return { isValid: true, message: "" };
    } else if (digits.length > 0 && digits.length < 10) {
      return { isValid: false, message: "Enter a complete Philippine mobile number (e.g., 912 345 6789)" };
    } else if (digits.length > 0 && !digits.startsWith('9') && !digits.startsWith('09') && !digits.startsWith('009')) {
      return { isValid: false, message: "Philippine mobile numbers must start with 9, 09, or 009" };
    } else if (digits.length > 11) {
      return { isValid: false, message: "Phone number is too long" };
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
    birthDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
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
  required: (value) => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "" };
    }
    return { isValid: true, message: "" };
  }
};

function capitalizeWords(str) {
  return str.replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

function getInputClassName(fieldName, formData, validationErrors) {
  const baseClass = "border w-full p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67]";
  if (formData[fieldName] && validationErrors[fieldName]) {
    return `${baseClass} border-red-500 bg-red-50`;
  } else if (formData[fieldName] && !validationErrors[fieldName]) {
    return `${baseClass} border-green-500 bg-green-50`;
  }
  return `${baseClass} border-gray-300`;
}

// Format phone number for display: +63 9203847563 (simple format)
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


// --- END VALIDATION LOGIC ---

export default function ViewOwnUserPage() {
  const { updateUserName, updateUserPhoto, updateAnyUserPhoto } = useUser();
  const [formData, setFormData] = useState({
    user_firstname: "",
    user_middlename: "",
    user_lastname: "",
    user_contact_no: "",
    user_email: "",
    role: "SuperAdmin",
    user_birthdate: "",
    tin_number: "",
    sss_number: "",
    pagibig_number: "",
    barangay: "",
    city: "",
    province: "",
    country: "",
    user_photo: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [addressData, setAddressData] = useState({
    countries: [],
    provinces: [],
    cities: {},
    barangays: {}
  });

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

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/LoginSection");
        return;
      }

      try {
        const response = await fetch('/php/Users/get_user_details.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        const data = await response.json();
                  console.log("=== API RESPONSE DEBUG ===");
          console.log("API Response:", data); // Debug log
          console.log("Raw user data:", data.user); // Debug log
          console.log("Photo field from API:", data.user.photo); // Debug log
          console.log("User photo field from API:", data.user.user_photo); // Debug log
          console.log("Photo field type:", typeof data.user.photo); // Debug log
          console.log("Photo field length:", data.user.photo ? data.user.photo.length : 0); // Debug log
          console.log("Photo field is null?", data.user.photo === null); // Debug log
          console.log("Photo field is undefined?", data.user.photo === undefined); // Debug log
          console.log("=== END API DEBUG ===");

        if (data.status === "success") {
          const userData = {
            user_firstname: data.user.firstName || "",
            user_middlename: data.user.middleName || "",
            user_lastname: data.user.lastName || "",
            user_contact_no: data.user.contactNo || "",
            user_email: data.user.email || "",
            user_birthdate: data.user.user_birthdate || "",
            role: data.user.role || "SuperAdmin",
            tin_number: data.user.tin_number || "",
            sss_number: data.user.sss_number || "",
            pagibig_number: data.user.pagibig_number || "",
            barangay: data.user.barangay || "",
            city: data.user.city || "",
            province: data.user.province || "",
            country: data.user.country || "",
            user_photo: (() => {
              const photo = data.user.photo || data.user.user_photo || "";
              if (!photo) return "";
              
              // If it's already a full URL, return as is
              if (photo.startsWith('http://') || photo.startsWith('https://')) {
                return photo;
              }
              
              // If it's just a filename, construct the full backend URL
              return `/php/Uploads/${photo}`;
            })()
          };

          console.log("Processed User Data:", userData); // Debug log
          console.log("Final user_photo value:", userData.user_photo); // Debug log
          console.log("Final user_photo type:", typeof userData.user_photo); // Debug log
          console.log("Final user_photo is null?", userData.user_photo === null); // Debug log
          console.log("Final user_photo is undefined?", userData.user_photo === undefined); // Debug log
          setFormData(userData);
        } else {
          console.error("Failed to fetch user details:", data.message);
          alert("Failed to load user profile. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        alert("Error loading user profile. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();

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
  }, [router]);

  const handleBack = () => {
    router.push("/SuperAdminSection/Dashboard");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-capitalize first letter for names
    if (["user_firstname", "user_middlename", "user_lastname"].includes(name)) {
      if (value.length > 0) {
        processedValue = capitalizeWords(value);
      }
    }

    // Auto-capitalize first letter for barangay
    if (name === "barangay") {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    // Handle contact number input - format as +63 XXX XXX XXXX
    if (name === "user_contact_no") {
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
    validateForm(updatedFormData);
  };

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem("userId");

      // Upload photo first if user selected a new photo
      let uploadedPhotoUrl = undefined;
      if (selectedPhoto && typeof selectedPhoto !== 'string') {
        console.log('Photo selected for upload:', selectedPhoto.name); // Debug log
        try {
          const form = new FormData();
          form.append('photo', selectedPhoto);
          const uploadRes = await fetch('/php/Users/upload_photo.php', {
            method: 'POST',
            body: form,
          });
          const uploadJson = await uploadRes.json();
          console.log('Upload response:', uploadJson); // Debug log
          if (!uploadRes.ok || uploadJson.status !== 'success') {
            toast.error('Photo upload failed');
            return;
          }
          // Get filename from upload response (don't construct full URL here)
          uploadedPhotoUrl = uploadJson.url; // This is just the filename
          console.log('Photo uploaded successfully, filename:', uploadedPhotoUrl); // Debug log
        } catch (err) {
          console.error('Photo upload error:', err); // Debug log
          toast.error('Photo upload error: ' + err.message);
          return;
        }
      }

      // Format contact number for backend - always store as 09XXXXXXXXXX
      let dataToSend = { ...formData };

      // Update photo URL if a new photo was uploaded
      if (uploadedPhotoUrl !== undefined) {
        dataToSend.user_photo = uploadedPhotoUrl;
        console.log('Setting photo URL in dataToSend:', uploadedPhotoUrl); // Debug log
      } else if (formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.startsWith('blob:')) {
        // If we have a preview URL but no new upload, we need to upload the preview
        try {
          // Convert blob URL back to file
          const response = await fetch(formData.user_photo);
          const blob = await response.blob();
          const file = new File([blob], `preview_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          const form = new FormData();
          form.append('photo', file);
          const uploadRes = await fetch('/php/Users/upload_photo.php', {
            method: 'POST',
            body: form,
          });
          const uploadJson = await uploadRes.json();
          
          if (uploadRes.ok && uploadJson.status === 'success') {
            dataToSend.user_photo = uploadJson.url;
            console.log('Preview photo uploaded successfully, filename:', uploadJson.url);
          } else {
            toast.error('Failed to upload preview photo');
            return;
          }
        } catch (err) {
          console.error('Preview photo upload error:', err);
          toast.error('Failed to upload preview photo');
          return;
        }
      }

      if (formData.user_contact_no) {
        // Remove any formatting and ensure it's 10 digits starting with 9
        let cleanDigits = formData.user_contact_no.replace(/\D/g, '');

        // If it's 10 digits starting with 9, add leading 0
        if (cleanDigits.length === 10 && cleanDigits.startsWith('9')) {
          dataToSend.user_contact_no = '0' + cleanDigits;
        } else if (cleanDigits.startsWith('09') && cleanDigits.length === 10) {
          // Already in correct format
          dataToSend.user_contact_no = cleanDigits;
        } else if (cleanDigits.startsWith('009') && cleanDigits.length === 11) {
          // Convert from 009 to 09 format
          dataToSend.user_contact_no = cleanDigits.substring(1);
        } else {
          // For any other case, try to format as 09XXXXXXXXXX
          if (cleanDigits.length >= 10) {
            const tenDigits = cleanDigits.substring(0, 10);
            if (tenDigits.startsWith('9')) {
              dataToSend.user_contact_no = '0' + tenDigits;
            } else {
              dataToSend.user_contact_no = '09' + tenDigits.substring(1);
            }
          } else if (cleanDigits.length === 9 && cleanDigits.startsWith('9')) {
            // Handle case where we have 9 digits starting with 9
            dataToSend.user_contact_no = '09' + cleanDigits;
          } else if (cleanDigits.length > 0) {
            // For any other case, try to ensure it starts with 09
            if (cleanDigits.startsWith('9')) {
              dataToSend.user_contact_no = '09' + cleanDigits;
            } else {
              dataToSend.user_contact_no = '09' + cleanDigits;
            }
          } else {
            dataToSend.user_contact_no = '';
          }
        }
      }

      const response = await fetch('/php/Users/update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...dataToSend
        }),
      });

      console.log('Data sent to update_user.php:', { user_id: userId, ...dataToSend }); // Debug log
      const data = await response.json();
      if (data.status === "success") {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setSelectedPhoto(null);

        // Update the user name in real-time using UserContext
        const newFullName = `${formData.user_firstname} ${formData.user_middlename} ${formData.user_lastname}`.trim();
        updateUserName(newFullName);

        // Update the photo in formData if a new photo was uploaded
        if (uploadedPhotoUrl !== undefined) {
          // Construct full URL for the uploaded photo
          const fullPhotoUrl = `/php/Uploads/${uploadedPhotoUrl}`;
          setFormData(prev => ({ ...prev, user_photo: fullPhotoUrl }));
          // Update the user photo in UserContext for real-time display in Topbar
          updateUserPhoto(uploadedPhotoUrl);
          // Also update the global photo map for real-time updates across all pages
          const userId = localStorage.getItem("userId");
          if (userId) {
            // Construct the full URL for the uploaded photo
            const fullPhotoUrl = `/php/Uploads/${uploadedPhotoUrl}`;
            updateAnyUserPhoto(userId, fullPhotoUrl);
            console.log('Updated global photo map for user:', userId, 'with URL:', fullPhotoUrl);
          }
          console.log('Updated formData with new photo full URL:', fullPhotoUrl); // Debug log
        } else if (dataToSend.user_photo && dataToSend.user_photo !== formData.user_photo) {
          // Handle case where preview photo was uploaded (different from original)
          // Construct full URL for the preview photo
          const fullPhotoUrl = `/php/Uploads/${dataToSend.user_photo}`;
          setFormData(prev => ({ ...prev, user_photo: fullPhotoUrl }));
          // Update the user photo in UserContext for real-time display in Topbar
          updateUserPhoto(dataToSend.user_photo);
          // Also update the global photo map for real-time updates across all pages
          const userId = localStorage.getItem("userId");
          if (userId) {
            // Construct the full URL for the preview photo
            const fullPhotoUrl = `/php/Uploads/${dataToSend.user_photo}`;
            updateAnyUserPhoto(userId, fullPhotoUrl);
            console.log('Updated global photo map for user:', userId, 'with preview photo URL:', fullPhotoUrl);
          }
          console.log('Updated formData with preview photo full URL:', fullPhotoUrl); // Debug log
        }

        // System log for self-update (no notification)
        fetch("/php/Logs/create_system_log.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            target_user_id: userId,
            action: "Edited their own details.",
          }),
        });
      } else {
        toast.error("Failed to update profile: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedPhoto(null);
    // Reload user data to reset any changes
    window.location.reload();
  };

  // Photo menu handler
  const handlePhotoClick = (e) => {
    if (!isEditing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setPhotoMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setShowPhotoMenu(true);
  };

  // Close photo menu
  const closePhotoMenu = () => {
    setShowPhotoMenu(false);
  };

  // Handle photo menu selection
  const handlePhotoMenuSelect = (action) => {
    closePhotoMenu();
    
    if (action === 'crop' && formData.user_photo) {
      openCropModal('existing');
    } else if (action === 'upload') {
      fileInputRef.current?.click();
    }
  };

  // Photo cropping functions
  const openCropModal = (imageFile) => {
    if (!imageFile) return;
    
    // If it's a new file, read it directly
    if (imageFile instanceof File && imageFile.size > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
        setOriginalImage(imageFile);
        setShowCropModal(true);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageFile === 'existing' && formData.user_photo) {
      // For existing photos, convert to data URL to avoid cross-origin issues
              const currentPhotoUrl = formData.user_photo;
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
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image for conversion');
          toast.error('Failed to load existing photo. Please try uploading a new photo instead.');
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
      const displayWidth = 350; // Width of the image in the cropping interface
      const displayHeight = 350; // Height of the image in the cropping interface
      
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
      setFormData(prev => ({
        ...prev,
        user_photo: previewUrl // Use the preview URL for immediate display
      }));
      
      setShowCropModal(false);
      setCropImage(null);
      setOriginalImage(null);
      toast.success('Photo cropped successfully! Preview updated.');
    } catch (error) {
      console.error('Failed to create preview URL:', error);
      toast.error('Photo cropped but preview failed to load. Please save to see the result.');
      
      // Still close the modal and set the file
      setShowCropModal(false);
      setCropImage(null);
      setOriginalImage(null);
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

  // --- VALIDATION ---
  function validateField(name, value) {
    switch (name) {
      case 'user_firstname':
      case 'user_lastname':
        return validators.name(value);
      case 'user_middlename':
        return value ? validators.name(value) : { isValid: true, message: "" };
      case 'user_email':
        return validators.email(value);
      case 'user_contact_no':
        return validators.contact(value);
      case 'tin_number':
        return validators.tin(value);
      case 'sss_number':
        return validators.sss(value);
      case 'pagibig_number':
        return validators.pagibig(value);
      case 'user_birthdate':
        return validators.dob(value);
      case 'barangay':
      case 'city':
      case 'province':
      case 'country':
        return validators.required(value);
      default:
        return { isValid: true, message: "" };
    }
  }

  function validateForm(newFormData = formData) {
    const errors = {};
    [
      'user_firstname', 'user_lastname', 'user_email', 'user_contact_no',
      'user_birthdate', 'tin_number', 'sss_number', 'pagibig_number',
      'barangay', 'city', 'province', 'country'
    ].forEach(field => {
      const validation = validateField(field, newFormData[field]);
      if (!validation.isValid) {
        errors[field] = validation.message;
      }
    });
    // Middle name is optional but if present, must be valid
    if (newFormData.user_middlename) {
      const validation = validateField('user_middlename', newFormData.user_middlename);
      if (!validation.isValid) {
        errors.user_middlename = validation.message;
      }
    }
    setValidationErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }

  useEffect(() => {
    validateForm();
    // eslint-disable-next-line
  }, [formData]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any blob URLs to prevent memory leaks
      if (formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(formData.user_photo);
        } catch (error) {
          console.error('Failed to revoke blob URL:', error);
        }
      }
    };
  }, [formData.user_photo]);

  // Debug logging for formData changes
  useEffect(() => {
    console.log('=== formData changed ===');
    console.log('formData:', formData);
    console.log('user_photo field:', formData.user_photo);
    console.log('user_photo type:', typeof formData.user_photo);
    console.log('user_photo length:', formData.user_photo ? formData.user_photo.length : 0);
    console.log('user_photo is null?', formData.user_photo === null);
    console.log('user_photo is undefined?', formData.user_photo === undefined);

    if (formData.user_photo) {
      console.log('Current user_photo:', formData.user_photo);
      console.log('Full photo URL:', formData.user_photo);
    } else {
      console.log('No user_photo found in formData');
    }
  }, [formData]);

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
  // --- END VALIDATION ---

  if (isLoading) {
    return (
      <ProtectedRoute role="Super Admin">
        <main className="flex-1">
          <div className="flex flex-col justify-center items-center h-64 text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Loading profile...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch your information</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Super Admin">
      <main className="flex-1">
        {/* Header Section with Back Button and Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
            <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
          </div>

          {/* Profile Information */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              {formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' ? (
                <>
                  <img
                    src={formData.user_photo}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-blue-200"
                    onError={(e) => {
                      console.log('Photo failed to load:', formData.user_photo); // Debug log
                      console.log('Full photo URL:', formData.user_photo); // Debug log
                      console.log('Error event:', e); // Debug log
                      console.log('Image element:', e.target); // Debug log
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                    onLoad={(e) => {
                      console.log('Photo loaded successfully:', formData.user_photo); // Debug log
                      console.log('Full photo URL:', formData.user_photo); // Debug log
                      console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight); // Debug log
                    }}
                  />
                  {/* Fallback icon that shows when photo fails to load */}
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl shadow-sm border-2 border-blue-200 hidden">
                    <FaUser />
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl shadow-sm border-2 border-blue-200">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {formData.user_firstname} {formData.user_middlename} {formData.user_lastname}
                  </div>
                  <div className="text-gray-600 font-medium">{formData.role}</div>
                </div>
                <div className="flex flex-col gap-2 mt-4 md:mt-0">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-gray-500" />
                    <span className="font-semibold">
                      {formData.user_contact_no ?
                        formatPhoneForDisplay(formData.user_contact_no) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaEnvelope className="text-gray-500" />
                    <span>{formData.user_email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Editable Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-350px)] flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900">Profile Details</h3>
            <p className="text-sm text-gray-600">View and edit your profile information</p>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <form className="space-y-6 text-sm">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "user_firstname", label: "First Name", required: true },
                  { name: "user_middlename", label: "Middle Name", required: false },
                  { name: "user_lastname", label: "Last Name", required: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={getInputClassName(field.name, formData, validationErrors)}
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
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

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "user_birthdate", label: "Date of Birth", type: "date", required: true },
                  { name: "user_email", label: "Email Address", type: "email", required: true },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        name={field.name}
                        type={field.type || "text"}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={getInputClassName(field.name, formData, validationErrors)}
                      />
                    ) : (
                      <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
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

                {/* Contact Number with Philippine Flag and Country Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                  {isEditing ? (
                    <input
                      name="user_contact_no"
                      type="tel"
                      value={formatPhoneForInput(formData.user_contact_no) || ""}
                      onChange={handleChange}
                      className={`w-full rounded-lg p-2 ${getInputClassName('user_contact_no', formData, validationErrors)}`}
                      placeholder="+63 920 384 7563"
                      maxLength="20"
                    />
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">
                      {formData.user_contact_no ?
                        formatPhoneForDisplay(formData.user_contact_no) : 'Not specified'}
                    </div>
                  )}
                  {formData.user_contact_no && validationErrors.user_contact_no && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FaTimes />
                      {validationErrors.user_contact_no}
                    </div>
                  )}
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  {isEditing ? (
                    <select
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                      className={getInputClassName('country', formData, validationErrors)}
                    >
                      <option value="">Select Country</option>
                      {addressData.countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">{formData.country || 'Not specified'}</div>
                  )}
                  {formData.country && validationErrors.country && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes />{validationErrors.country}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                  {isEditing ? (
                    <select
                      name="province"
                      value={formData.province || ""}
                      onChange={handleChange}
                      className={getInputClassName('province', formData, validationErrors)}
                      disabled={!formData.country}
                    >
                      <option value="">Select Province</option>
                      {addressData.provinces.map(p => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">{formData.province || 'Not specified'}</div>
                  )}
                  {formData.province && validationErrors.province && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes />{validationErrors.province}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  {isEditing ? (
                    <select
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      className={getInputClassName('city', formData, validationErrors)}
                      disabled={!formData.province}
                    >
                      <option value="">Select City</option>
                      {addressData.provinces.length > 0 && addressData.cities[addressData.provinces.find(p => p.name === formData.province)?.code]?.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">{formData.city || 'Not specified'}</div>
                  )}
                  {formData.city && validationErrors.city && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes />{validationErrors.city}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-[#2c2f6f] mb-1">Barangay</label>
                  {isEditing ? (
                    <input
                      name="barangay"
                      type="text"
                      value={formData.barangay || ""}
                      onChange={handleChange}
                      className={getInputClassName('barangay', formData, validationErrors)}
                      placeholder="Enter barangay name"
                      disabled={!formData.city}
                    />
                  ) : (
                    <div className="border w-full p-2 rounded bg-gray-50 text-gray-700">{formData.barangay || 'Not specified'}</div>
                  )}
                  {formData.barangay && validationErrors.barangay && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes />{validationErrors.barangay}</div>
                  )}
                </div>
              </div>

              {/* Government IDs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={getInputClassName(field.name, formData, validationErrors)}
                      />
                    ) : (
                      <div className="border w-full p-2 rounded-lg bg-gray-50 text-gray-700">
                        {formData[field.name] || 'Not specified'}
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

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
                <div className="flex flex-col items-center gap-4">
                  {/* Current Photo Display with Circular Dashed Border */}
                  <div className="flex-shrink-0 relative">
                    {formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' ? (
                      <div className="relative">
                                               <img
                         src={formData.user_photo}
                         alt="Current Profile"
                         className={`w-20 h-20 rounded-full object-cover border-2 border-gray-200 ${isEditing ? 'cursor-pointer hover:border-blue-400 transition-colors' : ''
                           }`}
                         onClick={handlePhotoClick}
                         onError={(e) => {
                           console.log('Current photo failed to load:', formData.user_photo); // Debug log
                           console.log('Full photo URL:', formData.user_photo); // Debug log
                           e.target.style.display = 'none';
                           e.target.nextSibling.style.display = 'flex';
                         }}
                         onLoad={() => {
                           console.log('Current photo loaded successfully:', formData.user_photo); // Debug log
                           console.log('Full photo URL:', formData.user_photo); // Debug log
                         }}
                       />
                        {/* Fallback icon that shows when photo fails to load */}
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl shadow-sm border-2 border-blue-200 hidden">
                          <FaUser />
                        </div>
                        
                        {/* Circular Dashed Border */}
                        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full pointer-events-none"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div 
                          className={`w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-2xl border-2 border-gray-200 ${isEditing ? 'cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors' : ''}`}
                          onClick={handlePhotoClick}
                        >
                          <FaUser />
                        </div>
                        {/* Circular Dashed Border */}
                        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full pointer-events-none"></div>
                      </div>
                    )}

                    {/* Crop indicator overlay for editing mode */}
                    {isEditing && formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <FaCrop className="text-white text-sm" />
                      </div>
                    )}

                    {/* Click to change overlay for editing mode */}
                    {isEditing && (
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
                        <div className="font-medium text-sm">Selected: {selectedPhoto.name}</div>
                        <div className="text-xs">Click photo to change or crop</div>
                      </div>
                    ) : formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' ? (
                      <div className="text-gray-600">
                        <div className="font-medium text-sm">Current photo uploaded</div>
                        <div className={`text-xs ${isEditing ? 'text-blue-600' : 'text-gray-500'}`}>
                          {isEditing ? 'Click photo for options' : 'Photo uploaded'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="font-medium text-sm">No photo uploaded</div>
                        <div className={`text-xs ${isEditing ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isEditing ? 'Click photo to upload' : 'No photo'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Instructions */}
                  {isEditing && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">
                        Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
                      </div>
                      {formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          💡 <strong>Tip:</strong> Click on your current photo to crop/resize it
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
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
            </form>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-[#2c2f6f] text-white rounded-lg font-semibold hover:bg-[#2c2f6f] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                  disabled={!isFormValid}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-6 py-2 bg-[#2c2f6f] text-white rounded-lg font-semibold hover:bg-[#2c2f6f] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm flex items-center gap-2"
              >
                <FaEdit className="text-sm" />
                Edit Profile
              </button>
            )}
          </div>
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
              {formData.user_photo && typeof formData.user_photo === 'string' && formData.user_photo.trim() !== '' && (
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
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 bg-[#232c67] text-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold">Crop & Resize Photo</h3>
              </div>

              {/* Cropping Area and Controls Side by Side */}
              <div className="mb-6 flex gap-6">
                {/* Cropping Area */}
                <div className="flex-shrink-0">
                  <div
                    className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 h-[400px] w-[400px] flex items-center justify-center cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={cropImage}
                      alt="Crop preview"
                      className="w-[350px] h-[350px] object-contain"
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

                    {/* Center Point */}
                    <div
                      className="absolute w-3 h-3 bg-white border-2 border-black rounded-full pointer-events-none"
                      style={{
                        left: `${cropData.centerX - 6}px`,
                        top: `${cropData.centerY - 6}px`
                      }}
                    />

                    {/* Resize Handle (Outer Ring) */}
                    <div
                      className="absolute w-6 h-6 bg-cyan-500 border-2 border-white rounded-full cursor-nw-resize"
                      style={{
                        left: `${cropData.centerX + cropData.radius - 12}px`,
                        top: `${cropData.centerY - 12}px`
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
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - 6}px`,
                        top: `${cropData.centerY - cropData.radius - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - 6}px`,
                        top: `${cropData.centerY - cropData.radius - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - 6}px`,
                        top: `${cropData.centerY + cropData.radius - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - 6}px`,
                        top: `${cropData.centerY + cropData.radius - 6}px`
                      }}
                    />

                    {/* Midpoint Control Points - Bright Cyan */}
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - 6}px`,
                        top: `${cropData.centerY - cropData.radius - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX + cropData.radius - 6}px`,
                        top: `${cropData.centerY - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - 6}px`,
                        top: `${cropData.centerY + cropData.radius - 6}px`
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-cyan-500 border-2 border-white rounded-sm pointer-events-none"
                      style={{
                        left: `${cropData.centerX - cropData.radius - 6}px`,
                        top: `${cropData.centerY - 6}px`
                      }}
                    />
                  </div>
                </div>

                {/* Right Side Controls - Organized in Rows */}
                <div className="flex-1 space-y-6">
                  {/* Row 1: How to Crop Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 How to crop:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• <strong>Drag the center</strong> of the black circle to move it anywhere on the image</li>
                      <li>• <strong>Drag the outer edge</strong> of the black circle to resize it (fits Discord logo face)</li>
                      <li>• <strong>Scale & rotation</strong> are automatically adjusted as you move the circle</li>
                      <li>• <strong>Bright cyan control points</strong> show the bounding box and resize handles</li>
                      <li>• Photo is sized to fit the yellow highlighted area - crop circle can now properly fit the logo face!</li>
                    </ul>
                  </div>

                  {/* Row 2: Center X, Y, Radius (Same Line) */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Center X</div>
                      <div className="text-xl font-semibold text-gray-800">{Math.round(cropData.centerX)}px</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Center Y</div>
                      <div className="text-xl font-semibold text-gray-800">{Math.round(cropData.centerY)}px</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-xs text-gray-600 font-medium mb-1">Radius</div>
                      <div className="text-xl font-semibold text-gray-800">{Math.round(cropData.radius)}px</div>
                    </div>
                  </div>

                  {/* Row 3: Quick Presets (Same Line) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 105, centerX: 200, centerY: 200 }))}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        210×210
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 125, centerX: 200, centerY: 200 }))}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        250×250
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 145, centerX: 200, centerY: 200 }))}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        290×290
                      </button>
                      <button
                        onClick={() => setCropData(prev => ({ ...prev, radius: 165, centerX: 200, centerY: 200 }))}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-center"
                      >
                        330×330
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={cancelCrop}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <FaUndo className="text-sm" />
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  className="px-4 py-2 bg-[#232c67] text-white rounded-lg font-medium hover:bg-[#1a1f4d] transition-colors flex items-center gap-2"
                >
                  <FaCheck className="text-sm" />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}