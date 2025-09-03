"use client";

import { useState, useEffect } from "react";
import { 
  FaSearch, 
  FaTools,
  FaArchive, 
  FaCalendarAlt, 
  FaStar, 
  FaFilter, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaSchool,
  FaPalette,
  FaHistory,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
     FaChartBar,
   FaSave
} from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SuperAdminConfigurationPage() {

  const [activeTab, setActiveTab] = useState("Activities");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   
  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    shape: "",
    name: "",
    description: ""
  });
  
  // Timeline modal state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineForm, setTimelineForm] = useState([]);
  
  // Add validation state for timeline
  const [timelineValidationErrors, setTimelineValidationErrors] = useState({});
  const [isTimelineValid, setIsTimelineValid] = useState(true);
  
    // Shape dropdown state
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  
  // Bulk archive modal state
  const [bulkArchiveModalOpen, setBulkArchiveModalOpen] = useState(false);
  const [bulkArchiveForm, setBulkArchiveForm] = useState({
    archiveType: 'overall',
    quarterId: '',
    advisoryId: '',
    confirmText: ''
  });
  const [isArchiveConfirmed, setIsArchiveConfirmed] = useState(false);
  
 
   
  // Real data from database
  const [activities, setActivities] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [visualFeedback, setVisualFeedback] = useState([]);
  const [availableShapes, setAvailableShapes] = useState([]);

  // Fetch data from database
  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/php/Assessment/get_detailed_activity_data.php", {
        method: "GET",
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Backend did not return JSON. First 120 chars: " + text.slice(0, 120));
      }
      
      if (data.success) {
        setActivities(data.data.activities || []);
        setQuarters(data.data.quarters || []);
        setStatistics(data.data.statistics || {});
        setRecentActivities(data.data.recent_activities || []);
        // Visual feedback data is now fetched separately
      } else {
        setError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Error connecting to database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };





  // Fetch available shapes from tbl_shapes
  const fetchAvailableShapes = async () => {
    try {
      const response = await fetch("/php/Assessment/get_shapes.php", {
        method: "GET",
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Shapes endpoint returned non-JSON:', text.slice(0, 120));
        return;
      }
      
      if (data.success) {
        setAvailableShapes(data.shapes || []);
      }
    } catch (err) {
      console.error('Error fetching shapes:', err);
    }
  };

  // Fetch visual feedback data
  const fetchVisualFeedbackData = async () => {
    try {
      const response = await fetch("/php/Assessment/get_visual_feedback.php", {
        method: "GET",
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Visual feedback endpoint returned non-JSON:', text.slice(0, 120));
        return;
      }
      
      if (data.status === 'success') {
        setVisualFeedback(data.feedback || []);
        console.log('Visual feedback data loaded:', data.feedback);
      } else {
        console.error('Failed to fetch visual feedback:', data.message);
        setVisualFeedback([]);
      }
    } catch (err) {
      console.error('Error fetching visual feedback:', err);
      setVisualFeedback([]);
    }
  };

  // Modal functions
  const openEditModal = (item) => {
    console.log('Opening edit modal for item:', item);
    console.log('Item shape details:', {
      shape: item.visual_feedback_shape,
      shapeType: typeof item.visual_feedback_shape,
      shapeLength: item.visual_feedback_shape?.length,
      shapeCharCodes: item.visual_feedback_shape ? Array.from(item.visual_feedback_shape).map(char => char.charCodeAt(0)) : []
    });
    
    setEditingItem(item);
    setEditForm({
      shape: item.visual_feedback_shape,
      name: item.visual_feedback_name,
      description: item.visual_feedback_description
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditForm({
      shape: "",
      name: "",
      description: ""
    });
  };

  // Timeline modal functions
  const openTimelineModal = () => {
    // Initialize form with current quarters data
    const initialForm = quarters.map(quarter => ({
      quarter_id: quarter.quarter_id,
      quarter_name: quarter.quarter_name,
      start_date: quarter.start_date ? quarter.start_date.split('T')[0] : '',
      end_date: quarter.end_date ? quarter.end_date.split('T')[0] : ''
    }));
    setTimelineForm(initialForm);
    
    // Clear validation errors and reset validation state
    setTimelineValidationErrors({});
    setIsTimelineValid(true);
    
    setIsTimelineModalOpen(true);
  };

  const closeTimelineModal = () => {
    setIsTimelineModalOpen(false);
    setTimelineForm([]);
    setTimelineValidationErrors({});
    setIsTimelineValid(true);
  };

  const handleTimelineInputChange = (index, field, value) => {
    const updatedForm = [...timelineForm];
    updatedForm[index][field] = value;
    setTimelineForm(updatedForm);
    
    // Validate dates in real-time
    validateTimelineDates(updatedForm);
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validateTimelineDates(timelineForm)) {
      toast.error('Please fix the validation errors before saving the timeline.');
      return;
    }
    
    try {
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem("userId");
      
      // Prepare the data for the API call
      const requestData = {
        user_id: currentUserId,
        quarters: timelineForm.map(quarter => ({
          quarter_id: quarter.quarter_id,
          quarter_name: quarter.quarter_name,
          start_date: quarter.start_date,
          end_date: quarter.end_date
        }))
      };
      
      // Make API call to update the database
      const response = await fetch("/php/Logs/update_school_year_timeline.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state with the response data
        setQuarters(result.data.quarters);
        closeTimelineModal();
        
                 // Show success toast message
         if (result.toast) {
           toast[result.toast.type](result.toast.message);
         } else {
           toast.success(result.message || 'School year timeline updated successfully!');
         }
         
         // Refresh the data to show updated information
         fetchActivityData();
       } else {
        // Show error toast message
        if (result.toast) {
          toast[result.toast.type](result.toast.message);
        } else {
          toast.error(result.message || 'Failed to update school year timeline');
        }
      }
    } catch (error) {
      console.error('Error updating school year timeline:', error);
      toast.error('Error updating school year timeline. Please try again.');
    }
  };

  // Date validation functions for school year timeline
  const validateTimelineDates = (form) => {
    const errors = {};
    let isValid = true;

    // Sort quarters by quarter_id to ensure proper order
    const sortedForm = [...form].sort((a, b) => a.quarter_id - b.quarter_id);

    for (let i = 0; i < sortedForm.length; i++) {
      const quarter = sortedForm[i];
      const quarterKey = `quarter_${quarter.quarter_id}`;
      
      // Initialize error object for this quarter
      if (!errors[quarterKey]) {
        errors[quarterKey] = {};
      }

      // Validate start date
      if (!quarter.start_date) {
        errors[quarterKey].start_date = "Start date is required";
        isValid = false;
      } else if (!isValidDate(quarter.start_date)) {
        errors[quarterKey].start_date = "Invalid start date format";
        isValid = false;
      }

      // Validate end date
      if (!quarter.end_date) {
        errors[quarterKey].end_date = "End date is required";
        isValid = false;
      } else if (!isValidDate(quarter.end_date)) {
        errors[quarterKey].end_date = "Invalid end date format";
        isValid = false;
      }

      // Validate that start date is before end date within the same quarter
      if (quarter.start_date && quarter.end_date && isValidDate(quarter.start_date) && isValidDate(quarter.end_date)) {
        const startDate = new Date(quarter.start_date);
        const endDate = new Date(quarter.end_date);
        
        if (startDate >= endDate) {
          errors[quarterKey].end_date = "End date must be after start date";
          isValid = false;
        }

        // Validate quarter duration (minimum 30 days, maximum 120 days)
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff < 30) {
          errors[quarterKey].end_date = "Quarter must be at least 30 days long";
          isValid = false;
        }
        if (daysDiff > 120) {
          errors[quarterKey].end_date = "Quarter cannot exceed 120 days";
          isValid = false;
        }
      }

      // Validate chronological order with previous quarters
      if (i > 0) {
        const prevQuarter = sortedForm[i - 1];
        
        if (quarter.start_date && prevQuarter.end_date && isValidDate(quarter.start_date) && isValidDate(prevQuarter.end_date)) {
          const currentStart = new Date(quarter.start_date);
          const prevEnd = new Date(prevQuarter.end_date);
          
          // Allow 1 day gap between quarters (optional)
          const daysGap = Math.ceil((currentStart - prevEnd) / (1000 * 60 * 60 * 24));
          
          if (daysGap < 0) {
            errors[quarterKey].start_date = `Start date must be after the end of ${prevQuarter.quarter_name}`;
            isValid = false;
          }
          
          // Warn if there's a large gap (more than 30 days) between quarters
          if (daysGap > 30) {
            errors[quarterKey].start_date = `Large gap detected: ${daysGap} days between ${prevQuarter.quarter_name} and ${quarter.quarter_name}`;
            // This is a warning, not an error, so don't set isValid = false
          }
        }
      }

      // Validate school year spans reasonable time (typically 9-12 months)
      if (i === 0 && quarter.start_date && isValidDate(quarter.start_date)) {
        const firstQuarterStart = new Date(quarter.start_date);
        const currentYear = new Date().getFullYear();
        const quarterYear = firstQuarterStart.getFullYear();
        
        // Check if the school year is not too far in the past or future
        if (quarterYear < currentYear - 2) {
          errors[quarterKey].start_date = "School year cannot start more than 2 years in the past";
          isValid = false;
        }
        if (quarterYear > currentYear + 1) {
          errors[quarterKey].start_date = "School year cannot start more than 1 year in the future";
          isValid = false;
        }
      }

      // Validate quarter names are not empty
      if (!quarter.quarter_name || quarter.quarter_name.trim() === '') {
        errors[quarterKey].quarter_name = "Quarter name is required";
        isValid = false;
      } else if (quarter.quarter_name.trim().length < 3) {
        errors[quarterKey].quarter_name = "Quarter name must be at least 3 characters long";
        isValid = false;
      } else if (quarter.quarter_name.trim().length > 50) {
        errors[quarterKey].quarter_name = "Quarter name cannot exceed 50 characters";
        isValid = false;
      }
    }

    // Check for overlapping quarters
    for (let i = 0; i < sortedForm.length; i++) {
      for (let j = i + 1; j < sortedForm.length; j++) {
        const quarter1 = sortedForm[i];
        const quarter2 = sortedForm[j];
        
        if (quarter1.start_date && quarter1.end_date && quarter2.start_date && quarter2.end_date &&
            isValidDate(quarter1.start_date) && isValidDate(quarter1.end_date) &&
            isValidDate(quarter2.start_date) && isValidDate(quarter2.end_date)) {
          
          const start1 = new Date(quarter1.start_date);
          const end1 = new Date(quarter1.end_date);
          const start2 = new Date(quarter2.start_date);
          const end2 = new Date(quarter2.end_date);
          
          // Check for overlap
          if ((start1 < end2) && (start2 < end1)) {
            const quarter1Key = `quarter_${quarter1.quarter_id}`;
            const quarter2Key = `quarter_${quarter2.quarter_id}`;
            
            if (!errors[quarter1Key]) errors[quarter1Key] = {};
            if (!errors[quarter2Key]) errors[quarter2Key] = {};
            
            errors[quarter1Key].start_date = `Overlaps with ${quarter2.quarter_name}`;
            errors[quarter2Key].start_date = `Overlaps with ${quarter1.quarter_name}`;
            isValid = false;
          }
        }
      }
    }

    setTimelineValidationErrors(errors);
    setIsTimelineValid(isValid);
    return isValid;
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString !== '';
  };

  const getValidationError = (quarterId, field) => {
    const quarterKey = `quarter_${quarterId}`;
    return timelineValidationErrors[quarterKey]?.[field] || '';
  };

  const hasValidationError = (quarterId, field) => {
    const quarterKey = `quarter_${quarterId}`;
    return !!timelineValidationErrors[quarterKey]?.[field];
  };

  const calculateSchoolYearDuration = (form) => {
    if (!form || form.length === 0) return null;
    
    const sortedForm = [...form].sort((a, b) => a.quarter_id - b.quarter_id);
    const firstQuarter = sortedForm[0];
    const lastQuarter = sortedForm[sortedForm.length - 1];
    
    if (!firstQuarter.start_date || !lastQuarter.end_date) return null;
    
    const startDate = new Date(firstQuarter.start_date);
    const endDate = new Date(lastQuarter.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const monthsDiff = Math.ceil(daysDiff / 30.44);
    
    return { days: daysDiff, months: monthsDiff };
  };

  const validateQuarterOrder = (form) => {
    const sortedForm = [...form].sort((a, b) => a.quarter_id - b.quarter_id);
    const warnings = [];
    
    for (let i = 0; i < sortedForm.length - 1; i++) {
      const currentQuarter = sortedForm[i];
      const nextQuarter = sortedForm[i + 1];
      
      if (currentQuarter.end_date && nextQuarter.start_date && 
          isValidDate(currentQuarter.end_date) && isValidDate(nextQuarter.start_date)) {
        
        const currentEnd = new Date(currentQuarter.end_date);
        const nextStart = new Date(nextQuarter.start_date);
        const daysGap = Math.ceil((nextStart - currentEnd) / (1000 * 60 * 60 * 24));
        
        if (daysGap > 30) {
          warnings.push(`Large gap of ${daysGap} days between ${currentQuarter.quarter_name} and ${nextQuarter.quarter_name}`);
        }
      }
    }
    
    return warnings;
  };

  const suggestOptimalDates = (quarterId) => {
    const sortedForm = [...timelineForm].sort((a, b) => a.quarter_id - b.quarter_id);
    const currentQuarterIndex = sortedForm.findIndex(q => q.quarter_id === quarterId);
    
    if (currentQuarterIndex === -1) return null;
    
    const currentQuarter = sortedForm[currentQuarterIndex];
    const suggestions = {};
    
    // Suggest start date based on previous quarter
    if (currentQuarterIndex > 0) {
      const prevQuarter = sortedForm[currentQuarterIndex - 1];
      if (prevQuarter.end_date && isValidDate(prevQuarter.end_date)) {
        const prevEnd = new Date(prevQuarter.end_date);
        const suggestedStart = new Date(prevEnd);
        suggestedStart.setDate(prevEnd.getDate() + 1); // Next day after previous quarter ends
        suggestions.start_date = suggestedStart.toISOString().split('T')[0];
      }
    }
    
    // Suggest end date based on start date and typical quarter length
    if (currentQuarter.start_date && isValidDate(currentQuarter.start_date)) {
      const startDate = new Date(currentQuarter.start_date);
      const suggestedEnd = new Date(startDate);
      suggestedEnd.setDate(startDate.getDate() + 60); // Typical quarter is ~60 days
      suggestions.end_date = suggestedEnd.toISOString().split('T')[0];
    }
    
    return suggestions;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that both shape and name are selected
    if (!editForm.shape || !editForm.name) {
      toast.error('Please select both a shape and name for this scoring item.');
      return;
    }
    
    // Debug logging
    console.log('Submitting edit with data:', {
      visual_feedback_id: editingItem.visual_feedback_id,
      visual_feedback_shape: editForm.shape,
      visual_feedback_name: editForm.name,
      visual_feedback_description: editForm.description
    });
    
    // Additional debugging for shape
    console.log('Shape details:', {
      shape: editForm.shape,
      shapeLength: editForm.shape.length,
      shapeCharCodes: Array.from(editForm.shape).map(char => char.charCodeAt(0)),
      shapeHex: Array.from(editForm.shape).map(char => char.charCodeAt(0).toString(16)),
      shapeType: typeof editForm.shape,
      shapeTrimmed: editForm.shape.trim(),
      shapeTrimmedLength: editForm.shape.trim().length
    });
    
    // Check if shape is empty or just whitespace
    if (!editForm.shape.trim()) {
      toast.error('Shape cannot be empty or just whitespace.');
      return;
    }
    
         try {
       // Get current user ID from localStorage
       const currentUserId = localStorage.getItem("userId");
       
       // Make API call to update the database
       const response = await fetch("/php/Assessment/update_visual_feedback.php", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           user_id: currentUserId,
           visual_feedback_id: editingItem.visual_feedback_id,
           visual_feedback_shape: editForm.shape.trim(),
           visual_feedback_name: editForm.name,
           visual_feedback_description: editForm.description
         })
       });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state with the response data
        const updatedVisualFeedback = visualFeedback.map(item => 
          item.visual_feedback_id === editingItem.visual_feedback_id 
            ? { 
                ...item, 
                visual_feedback_shape: result.data.visual_feedback_shape,
                visual_feedback_name: result.data.visual_feedback_name,
                visual_feedback_description: result.data.visual_feedback_description
              }
            : item
        );
        setVisualFeedback(updatedVisualFeedback);
        closeEditModal();
        
        // Show success message
        toast.success('Scoring item updated successfully!');
      } else {
        toast.error('Failed to update scoring item: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating visual feedback:', error);
      toast.error('Error updating scoring item. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Bulk archive functions
  const openBulkArchiveModal = () => {
    setBulkArchiveModalOpen(true);
    setBulkArchiveForm({
      archiveType: 'overall',
      quarterId: '',
      advisoryId: '',
      confirmText: ''
    });
    setIsArchiveConfirmed(false);
  };

  const closeBulkArchiveModal = () => {
    setBulkArchiveModalOpen(false);
    setBulkArchiveForm({
      archiveType: 'overall',
      quarterId: '',
      advisoryId: '',
      confirmText: ''
    });
    setIsArchiveConfirmed(false);
  };

  const handleBulkArchiveInputChange = (field, value) => {
    const updatedForm = { ...bulkArchiveForm, [field]: value };
    setBulkArchiveForm(updatedForm);
    
    // Check if confirmation text is correct
    if (field === 'confirmText') {
      setIsArchiveConfirmed(value === 'ARCHIVE');
    }
  };

  const handleBulkArchiveSubmit = async (e) => {
    e.preventDefault();
    
    if (!isArchiveConfirmed) {
      toast.error('Please type "ARCHIVE" to confirm the action.');
      return;
    }
    
    try {
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem("userId");
      
      // Prepare the data for the API call
      const requestData = {
        user_id: currentUserId,
        archive_type: bulkArchiveForm.archiveType,
        quarter_id: bulkArchiveForm.quarterId || null,
        advisory_id: bulkArchiveForm.advisoryId || null
      };
      
      // Make API call to bulk archive activities
      const response = await fetch("/php/Assessment/bulk_archive_activities.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
                           if (result.success) {
          closeBulkArchiveModal();
          toast.success(result.message || 'Activities archived successfully!');
          
          // Refresh the data to show updated information
          fetchActivityData();
        } else {
        toast.error(result.message || 'Failed to archive activities');
      }
    } catch (error) {
      console.error('Error bulk archiving activities:', error);
      toast.error('Error archiving activities. Please try again.');
    }
  };

  const getArchiveTypeDescription = () => {
    switch (bulkArchiveForm.archiveType) {
      case 'overall':
        return 'All activities in the system will be archived.';
      case 'quarter':
        const selectedQuarter = quarters.find(q => q.quarter_id == bulkArchiveForm.quarterId);
        return selectedQuarter ? `All activities in ${selectedQuarter.quarter_name} will be archived.` : 'Select a quarter first.';
      default:
        return 'Select an archive type first.';
    }
  };



    // Get shape icon based on shape type - fully dynamic for future shape editing
  const getShapeIcon = (shapeType, color) => {
    // Special handling for triangle to ensure it displays in orange
    // Check for various triangle representations that might be used
    if (shapeType === '▲' || shapeType === '🔺' || shapeType === 'triangle' || shapeType.toLowerCase().includes('triangle')) {
      return <span style={{ color: '#f59e42', fontSize: '2rem' }}>{shapeType}</span>;
    }
    
    // For all other shapes, use the emoji with appropriate styling
    const iconStyle = { color: color, fontSize: '2rem' };
    
    // Find the item in visualFeedback to get the correct color
    const item = visualFeedback.find(item => item.visual_feedback_shape === shapeType);
    const itemColor = item?.color || color;
    
    // This allows for any shape to be used without hardcoding
    return <span style={{ ...iconStyle, color: itemColor, fontSize: '2rem' }}>{shapeType}</span>;
  };

                               useEffect(() => {
     fetchActivityData();
     fetchAvailableShapes();
     fetchVisualFeedbackData(); // Call the new function here
   }, []);

  // Close shape dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shapeDropdownOpen && !event.target.closest('.shape-dropdown')) {
        setShapeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shapeDropdownOpen]);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort data function
  const sortData = (data, field, direction) => {
    if (!data || data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Special handling for numeric fields
      if (field === 'min_score' || field === 'max_score') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
        
        if (direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (direction === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
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
  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Check all possible fields for each data type
      return (
        // Activities
        item.activity_name?.toLowerCase().includes(searchLower) ||
        item.subject_name?.toLowerCase().includes(searchLower) ||
        item.quarter_name?.toLowerCase().includes(searchLower) ||
        item.advisory_name?.toLowerCase().includes(searchLower) ||
        item.activity_status?.toLowerCase().includes(searchLower) ||
        String(item.activity_num)?.includes(searchLower) ||
        
        // Quarters
        item.start_date?.toLowerCase().includes(searchLower) ||
        item.end_date?.toLowerCase().includes(searchLower) ||
        
        // Visual Feedback
        item.visual_feedback_name?.toLowerCase().includes(searchLower) ||
        item.visual_feedback_description?.toLowerCase().includes(searchLower) ||
        item.visual_feedback_shape?.toLowerCase().includes(searchLower) ||
        String(item.min_score)?.includes(searchLower) ||
        String(item.max_score)?.includes(searchLower)
      );
    });
  };

  // Filter function for visual feedback
  const filterVisualFeedback = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.visual_feedback_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.visual_feedback_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.visual_feedback_shape?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get available shapes for selection (excluding shapes already used in visual feedback)
  const getAvailableShapes = (currentItemId) => {
    // Get all shapes from tbl_shapes
    const allShapes = availableShapes;
    
    // Convert currentItemId to number for consistent comparison
    const currentId = parseInt(currentItemId);
    
    // Get shapes currently used in visual feedback (excluding the current item being edited)
    const usedShapes = visualFeedback
      .filter(item => parseInt(item.visual_feedback_id) !== currentId)
      .map(item => item.visual_feedback_shape);
    
    // Debug logging
    console.log('getAvailableShapes called with currentItemId:', currentItemId);
    console.log('Current item ID type:', typeof currentItemId);
    console.log('Converted current ID:', currentId, 'type:', typeof currentId);
    console.log('All shapes from tbl_shapes:', allShapes);
    console.log('Current visualFeedback:', visualFeedback);
    console.log('Used shapes (excluding current):', usedShapes);
    
    // Debug the filtering logic
    console.log('Filtering details:');
    visualFeedback.forEach(item => {
      const itemId = parseInt(item.visual_feedback_id);
      const shouldExclude = itemId !== currentId;
      console.log(`Item ID: ${item.visual_feedback_id} -> ${itemId} (type: ${typeof itemId}), Current ID: ${currentItemId} -> ${currentId} (type: ${typeof currentId}), Should exclude: ${shouldExclude}, Shape: ${item.visual_feedback_shape}`);
    });
    
    // Additional debugging for shape comparison
    console.log('Shape comparison details:');
    allShapes.forEach(shape => {
      const isUsed = usedShapes.includes(shape.shape_form);
      console.log(`Shape: ${shape.shape_form} (${shape.shape_name}) - Used: ${isUsed}`);
      console.log(`  - shape_form type: ${typeof shape.shape_form}, length: ${shape.shape_form.length}`);
      console.log(`  - usedShapes includes check: ${usedShapes.includes(shape.shape_form)}`);
      
      // Check if any used shapes match this shape
      usedShapes.forEach(usedShape => {
        const matches = usedShape === shape.shape_form;
        console.log(`    - Comparing with used shape: "${usedShape}" (type: ${typeof usedShape}, length: ${usedShape?.length}) - Matches: ${matches}`);
      });
    });
    
    const filteredShapes = allShapes.filter(shape => !usedShapes.includes(shape.shape_form));
    console.log('Available shapes after filtering:', filteredShapes);
    
    // Return shapes that are not currently being used, limited to first 20 options
    return filteredShapes.slice(0, 20);
  };

  const filteredActivities = sortData(filterData(activities), sortField, sortDirection);
  const filteredQuarters = sortData(filterData(quarters), sortField, sortDirection);
  const filteredVisualFeedback = sortData(filterVisualFeedback(visualFeedback), sortField, sortDirection);

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex-1 p-4">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="px-5 py-2 border-b border-gray-200">
            <div className="flex gap-2">
              {[
                { name: 'Activities', icon: <FaArchive className="text-sm" /> },
                { name: 'School Year', icon: <FaSchool className="text-sm" /> },
                { name: 'Visual Scoring', icon: <FaPalette className="text-sm" /> }
              ].map(tab => (
                <button
                  key={tab.name}
                  className={`px-4 py-1.5 rounded-lg font-medium border-2 transition-colors duration-150 flex items-center gap-2 ${
                    activeTab === tab.name 
                      ? 'bg-[#232c67] text-white border-[#232c67]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  {tab.icon}
                  {tab.name}
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
                    placeholder="Search by name or description"
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
                  <FaTools className="text-gray-600 text-sm" />
                  <span className="text-sm font-medium text-gray-700">
                    System Configuration
                  </span>
                </div>
                
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaTimes className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

                     {activeTab === 'Visual Scoring' && (
             <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Visual Scoring System
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaPalette className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Total: {filteredVisualFeedback.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredVisualFeedback.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaPalette className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Scoring System Match Your Search' : 'No Scoring System Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No scoring system found matching "${searchTerm}".`
                      : "There are no scoring systems to display at the moment."
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '20%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                                                     <th 
                             className="px-6 py-4 font-semibold text-white cursor-pointer text-center"
                             onClick={() => handleSort("visual_feedback_shape")}
                           >
                             <div className="flex items-center gap-2 justify-center">
                               Shape
                               {getSortIcon("visual_feedback_shape")}
                             </div>
                           </th>
                           <th 
                             className="px-6 py-4 font-semibold text-white cursor-pointer"
                             onClick={() => handleSort("visual_feedback_name")}
                           >
                             <div className="flex items-center gap-2">
                               Name
                               {getSortIcon("visual_feedback_name")}
                             </div>
                           </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("visual_feedback_description")}
                          >
                            <div className="flex items-center gap-2">
                              Description
                              {getSortIcon("visual_feedback_description")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer text-center"
                            onClick={() => handleSort("min_score")}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              Min Score
                              {getSortIcon("min_score")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer text-center"
                            onClick={() => handleSort("max_score")}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              Max Score
                              {getSortIcon("max_score")}
                            </div>
                          </th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-[272px] overflow-y-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                        <colgroup>
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '25%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '20%' }} />
                        </colgroup>
                        <tbody className="divide-y divide-gray-200">
                          {filteredVisualFeedback.map((vf) => (
                            <tr 
                              key={vf.visual_feedback_id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer group"
                              onClick={() => openEditModal(vf)}
                              title="Click to edit this scoring item"
                            >
                                                                                                                             <td className="px-6 py-4 text-center">
                                   <div className="flex justify-center">
                                     {getShapeIcon(vf.visual_feedback_shape, vf.color)}
                                   </div>
                                 </td>
                              <td className="px-6 py-4">
                                <span className="font-medium text-gray-900">{vf.visual_feedback_name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-600">{vf.visual_feedback_description}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {Number(vf.min_score).toFixed(3)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {Number(vf.max_score).toFixed(3)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading data from database...</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'Activities' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Activities 
                  </h2>
                                     <div className="flex items-center gap-4">
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                         <FaArchive className="text-blue-600" />
                         <span className="text-sm font-medium text-blue-900">Total: {statistics.total_activities || 0}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <FaCheck className="text-green-600" />
                         <span className="text-sm font-medium text-green-700">Active: {statistics.active_activities || 0}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <FaTimes className="text-gray-600" />
                         <span className="text-sm font-medium text-gray-700">Archived: {statistics.archived_activities || 0}</span>
                       </div>
                     </div>
                     <button
                       onClick={openBulkArchiveModal}
                       className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-lg hover:bg-[#1a1f4d] transition-colors text-sm font-medium"
                     >
                       <FaArchive className="text-xs" />
                       Bulk Archive
                     </button>
                   </div>
                </div>
              </div>
              
              {filteredActivities.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-40">
                  <div className="w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <FaArchive className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Activities Match Your Search' : 'No Activities Found'}
                  </h3>
                  <p className="text-gray-600 mb-3 max-w-md">
                    {searchTerm 
                      ? `No activities found matching "${searchTerm}".`
                      : "There are no activities to display at the moment."
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
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                      <colgroup>
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <thead className="bg-[#232c67] text-white border-b border-gray-200">
                        <tr>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("activity_name")}
                          >
                            <div className="flex items-center gap-2">
                              Activity Name
                              {getSortIcon("activity_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("subject_name")}
                          >
                            <div className="flex items-center gap-2">
                              Subject
                              {getSortIcon("subject_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("activity_date")}
                          >
                            <div className="flex items-center gap-2">
                              Date
                              {getSortIcon("activity_date")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("quarter_name")}
                          >
                            <div className="flex items-center gap-2">
                              Quarter
                              {getSortIcon("quarter_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer"
                            onClick={() => handleSort("advisory_name")}
                          >
                            <div className="flex items-center gap-2">
                              Advisory Class
                              {getSortIcon("advisory_name")}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-semibold text-white cursor-pointer text-center"
                            onClick={() => handleSort("activity_status")}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              Status
                              {getSortIcon("activity_status")}
                            </div>
                          </th>
                        </tr>
                      </thead>
                    </table>
                      <div className="max-h-[272px] overflow-y-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 table-fixed">
                        <colgroup>
                          <col style={{ width: '35%' }} />
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                        </colgroup>
                        <tbody className="divide-y divide-gray-200">
                          {filteredActivities.map((activity) => (
                            <tr key={activity.activity_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-medium text-gray-900">{activity.activity_name}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{activity.subject_name || 'N/A'}</td>
                                                             <td className="px-6 py-4 text-gray-600">
                                 {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString('en-US', { 
                                   month: 'short', 
                                   day: '2-digit', 
                                   year: 'numeric' 
                                 }) : 'N/A'}
                               </td>
                              <td className="px-6 py-4 text-gray-600">{activity.quarter_name || 'N/A'}</td>
                                                             <td className="px-6 py-4 text-center">
                                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                   activity.advisory_name === 'Discoverer' 
                                     ? 'bg-blue-100 text-blue-800' 
                                     : activity.advisory_name === 'Explorer'
                                     ? 'bg-yellow-100 text-yellow-800'
                                     : activity.advisory_name === 'Adventurer'
                                     ? 'bg-red-100 text-red-800'
                                     : 'bg-gray-100 text-gray-800'
                                 }`}>
                                   {activity.advisory_name || 'N/A'}
                                 </span>
                               </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  activity.activity_status === 'Active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {activity.activity_status || 'Unknown'}
                                </span>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}







          {activeTab === 'School Year' && (
            <>
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    School Year Timeline
                  </h2>
                                     <div className="flex items-center gap-4">
                     <button 
                       onClick={openTimelineModal}
                       className="flex items-center gap-2 px-4 py-2 bg-[#232c67] text-white rounded-lg hover:bg-[#1a1f4d] transition-colors text-sm font-medium"
                     >
                       <FaEdit className="text-xs" />
                       Edit Timeline
                     </button>
                     <div className="flex items-center gap-2">
                       <FaCalendarAlt className="text-green-600" />
                       <span className="text-sm font-medium text-green-700">Total: {quarters.length}</span>
                     </div>
                   </div>
                </div>
              </div>
              
              {filteredQuarters.length === 0 ? (
                <div className="flex flex-col justify-center items-center text-center px-6 h-80">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaSchool className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No Quarters Match Your Search' : 'No Quarters Found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    {searchTerm 
                      ? `No quarters found matching "${searchTerm}".`
                      : "There are no quarters to display at the moment."
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
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                                             <thead className="bg-[#232c67] text-white border-b border-gray-200">
                         <tr>
                           <th 
                             className="px-6 py-4 font-semibold text-white cursor-pointer"
                             onClick={() => handleSort("quarter_name")}
                           >
                             <div className="flex items-center gap-2">
                               Quarter Name
                               {getSortIcon("quarter_name")}
                             </div>
                           </th>
                           <th 
                             className="px-6 py-4 font-semibold text-white cursor-pointer"
                             onClick={() => handleSort("start_date")}
                           >
                             <div className="flex items-center gap-2">
                               Start Date
                               {getSortIcon("start_date")}
                             </div>
                           </th>
                           <th 
                             className="px-6 py-4 font-semibold text-white cursor-pointer"
                             onClick={() => handleSort("end_date")}
                           >
                             <div className="flex items-center gap-2">
                               End Date
                               {getSortIcon("end_date")}
                             </div>
                           </th>
                         </tr>
                       </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredQuarters.map((quarter) => (
                          <tr key={quarter.quarter_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{quarter.quarter_name}</span>
                            </td>
                                                         <td className="px-6 py-4 text-gray-600">
                               {quarter.start_date ? new Date(quarter.start_date).toLocaleDateString('en-US', { 
                                 month: 'short', 
                                 day: '2-digit', 
                                 year: 'numeric' 
                               }) : 'N/A'}
                             </td>
                             <td className="px-6 py-4 text-gray-600">
                               {quarter.end_date ? new Date(quarter.end_date).toLocaleDateString('en-US', { 
                                 month: 'short', 
                                 day: '2-digit', 
                                 year: 'numeric' 
                               }) : 'N/A'}
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}


        </div>
      </div>

             {/* Edit Modal */}
       {isEditModalOpen && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[480px] max-w-[98vw] w-[520px] relative border border-gray-100">
                           <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
                <h3 className="text-xl font-bold text-white mb-1">Edit Scoring Item</h3>
                <p className="text-[#a8b0e0] text-sm">Update the shape, name and description of this scoring item</p>
              </div>
             
             <form onSubmit={handleEditSubmit} className="space-y-4">
                                               {/* Shape and Name Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shape & Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex justify-center mb-4">
                    {getShapeIcon(editForm.shape, editingItem?.color)}
                  </div>
                                                                           <div className="relative shape-dropdown">
                                        <button
                                          type="button"
                                          onClick={() => setShapeDropdownOpen(!shapeDropdownOpen)}
                                          className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            {editForm.shape ? (
                                              <>
                                                {getShapeIcon(editForm.shape, '#000000')}
                                                <span>{editForm.name || 'Select a shape'}</span>
                                              </>
                                            ) : (
                                              <span className="text-gray-500">Select a shape and name</span>
                                            )}
                                          </div>
                                                                                     <svg className={`w-4 h-4 text-gray-400 transition-transform ${shapeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                           </svg>
                                        </button>
                                        
                                        {shapeDropdownOpen && (
                                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                                                         {getAvailableShapes(editingItem?.visual_feedback_id).map((shape) => (
                                               <button
                                                 key={shape.shape_id}
                                                 type="button"
                                                 onClick={() => {
                                                   handleInputChange('shape', shape.shape_form);
                                                   handleInputChange('name', shape.shape_name);
                                                   setShapeDropdownOpen(false);
                                                 }}
                                                                                                   className="w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-gray-200 transition-colors"
                                               >
                                                 <div className="flex-shrink-0">
                                                   {getShapeIcon(shape.shape_form, '#000000')}
                                                 </div>
                                                 <span className="font-medium">{shape.shape_name}</span>
                                               </button>
                                             ))}
                                          </div>
                                        )}
                                      </div>
                                   
                </div>

                

               {/* Description Field */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Description <span className="text-red-500">*</span>
                 </label>
                 <textarea
                   value={editForm.description}
                   onChange={(e) => handleInputChange('description', e.target.value)}
                   rows={3}
                   className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors caret-[#232c67]"
                   placeholder="Enter description"
                   required
                 />
               </div>

               {/* Score Range Display (Read-only) */}
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Score Range 
                 </label>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="text-xs text-gray-500">Min Score</span>
                     <div className="text-lg font-mono text-gray-900">
                       {editingItem?.min_score}
                     </div>
                   </div>
                   <div>
                     <span className="text-xs text-gray-500">Max Score</span>
                     <div className="text-lg font-mono text-gray-900">
                       {editingItem?.max_score}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                 <button
                   type="button"
                   onClick={closeEditModal}
                   className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                 >
                   <FaTimes className="text-sm" />
                   Close
                 </button>
                 <button
                   type="submit"
                   className="flex items-center gap-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                 >
                   <FaSave className="text-sm" />
                   Save Changes
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

               {/* Toast Container for notifications */}
        <div className="toast-container">
          {/* This will be rendered by react-toastify */}
        </div>


                   {/* Bulk Archive Modal */}
         {bulkArchiveModalOpen && (
           <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[500px] max-w-[98vw] w-[600px] relative border border-gray-100">
                              <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
                  <h3 className="text-xl font-bold text-white mb-1">Bulk Archive Activities</h3>
                  <p className="text-[#a8b0e0] text-sm">Archive multiple activities at once</p>
                </div>
               
               <form onSubmit={handleBulkArchiveSubmit} className="space-y-4">
                {/* Archive Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Archive Type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="archiveType"
                        value="overall"
                        checked={bulkArchiveForm.archiveType === 'overall'}
                        onChange={(e) => handleBulkArchiveInputChange('archiveType', e.target.value)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm">Archive All Activities (Overall)</span>
                    </label>
                                         <label className="flex items-center gap-2">
                       <input
                         type="radio"
                         name="archiveType"
                         value="quarter"
                         checked={bulkArchiveForm.archiveType === 'quarter'}
                         onChange={(e) => handleBulkArchiveInputChange('archiveType', e.target.value)}
                         className="text-orange-600 focus:ring-orange-500"
                       />
                       <span className="text-sm">Archive by Quarter</span>
                     </label>
                     <label className="flex items-center gap-2">
                       <input
                         type="radio"
                         name="archiveType"
                         value="class"
                         checked={bulkArchiveForm.archiveType === 'class'}
                         onChange={(e) => handleBulkArchiveInputChange('archiveType', e.target.value)}
                         className="text-orange-600 focus:ring-orange-500"
                       />
                       <span className="text-sm">Archive by Class</span>
                     </label>

                  </div>
                </div>

                                 {/* Quarter Selection (if quarter type selected) */}
                 {bulkArchiveForm.archiveType === 'quarter' && (
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">
                       Select Quarter <span className="text-red-500">*</span>
                     </label>
                     <select
                       value={bulkArchiveForm.quarterId}
                       onChange={(e) => handleBulkArchiveInputChange('quarterId', e.target.value)}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                       required
                     >
                       <option value="">Select a quarter</option>
                       {quarters.map((quarter) => (
                         <option key={quarter.quarter_id} value={quarter.quarter_id}>
                           {quarter.quarter_name}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {/* Class Selection (if class type selected) */}
                 {bulkArchiveForm.archiveType === 'class' && (
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">
                       Select Class <span className="text-red-500">*</span>
                     </label>
                     <select
                       value={bulkArchiveForm.advisoryId}
                       onChange={(e) => handleBulkArchiveInputChange('advisoryId', e.target.value)}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                       required
                     >
                       <option value="">Select a class</option>
                       <option value="1">Advisory 1 - Discoverer</option>
                       <option value="2">Advisory 2 - Explorer</option>
                       <option value="3">Advisory 3 - Adventurer</option>
                     </select>
                   </div>
                 )}



                {/* Description of what will be archived */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">What will be archived:</h4>
                  <p className="text-sm text-orange-700">{getArchiveTypeDescription()}</p>
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ This action will change the status of all matching activities to "Archived" and cannot be undone.
                  </p>
                </div>

                                 {/* Confirmation */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Type "ARCHIVE" to confirm <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     value={bulkArchiveForm.confirmText}
                     onChange={(e) => handleBulkArchiveInputChange('confirmText', e.target.value)}
                     className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 transition-colors ${
                       bulkArchiveForm.confirmText === '' 
                         ? 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                         : bulkArchiveForm.confirmText === 'ARCHIVE'
                         ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                         : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                     }`}
                     placeholder="Type 'ARCHIVE' to confirm"
                     required
                   />
                   {bulkArchiveForm.confirmText !== '' && (
                     <div className={`text-sm mt-1 flex items-center gap-1 ${
                       bulkArchiveForm.confirmText === 'ARCHIVE' ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {bulkArchiveForm.confirmText === 'ARCHIVE' ? (
                         <>
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                           </svg>
                           Confirmation text is correct
                         </>
                       ) : (
                         <>
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                           </svg>
                           Type "ARCHIVE" exactly (case sensitive)
                         </>
                       )}
                     </div>
                   )}
                 </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeBulkArchiveModal}
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <FaTimes className="text-sm" />
                    Cancel
                  </button>
                                     <button
                     type="submit"
                     disabled={!isArchiveConfirmed}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                       isArchiveConfirmed
                         ? 'bg-orange-600 hover:bg-orange-700 text-white hover:shadow-lg'
                         : 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                     }`}
                   >
                     <FaArchive className="text-sm" />
                     Archive Activities
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

       {/* Timeline Edit Modal */}
        {isTimelineModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl min-w-[600px] max-w-[98vw] w-[700px] max-h-[90vh] flex flex-col border border-gray-100">
              {/* Header - Fixed */}
              <div className="bg-[#232c67] text-white p-4 rounded-t-xl flex-shrink-0">
                <h3 className="text-xl font-bold text-white mb-1">Edit School Year Timeline</h3>
                <p className="text-[#a8b0e0] text-sm">Update the quarter names and dates for the school year</p>
              </div>
              
                             {/* Scrollable Content */}
               <div className="flex-1 overflow-y-auto p-6">
                 
                 {/* Timeline Overview */}
                 <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="flex items-start gap-3">
                     <div className="flex-shrink-0">
                       <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                     </div>
                     <div className="flex-1">
                       <h4 className="text-sm font-semibold text-blue-800 mb-1">Timeline Guidelines</h4>
                       <ul className="text-sm text-blue-700 space-y-1 mb-3">
                         <li>• Each quarter must be at least 30 days and no more than 120 days</li>
                         <li>• Quarters must follow chronological order (no overlapping dates)</li>
                         <li>• School year typically spans 9-12 months</li>
                         <li>• Dates should be realistic (not too far in past/future)</li>
                        
                       </ul>
                       
                       {/* School Year Duration Display */}
                       {(() => {
                         const duration = calculateSchoolYearDuration(timelineForm);
                         if (duration) {
                           const durationStatus = duration.months >= 9 && duration.months <= 12 ? 'text-green-600' : 'text-orange-600';
                           const durationIcon = duration.months >= 9 && duration.months <= 12 ? '✓' : '⚠';
                           
                           return (
                             <div className={`text-sm ${durationStatus} font-medium`}>
                               <span className="mr-2">{durationIcon}</span>
                               Total School Year Duration: {duration.days} days ({duration.months} months)
                               {duration.months < 9 && <span className="block text-xs mt-1">⚠️ School year seems too short</span>}
                               {duration.months > 12 && <span className="block text-xs mt-1">⚠️ School year seems too long</span>}
                             </div>
                           );
                         }
                         return null;
                       })()}
                     </div>
                   </div>
                 </div>
                 
                 <form onSubmit={handleTimelineSubmit} className="space-y-6">
                  {timelineForm.map((quarter, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-4 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Quarter {index + 1}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={quarter.start_date}
                              onChange={(e) => handleTimelineInputChange(index, 'start_date', e.target.value)}
                              className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 transition-colors caret-[#232c67] ${
                                hasValidationError(quarter.quarter_id, 'start_date')
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]'
                              }`}
                              required
                            />
                            {hasValidationError(quarter.quarter_id, 'start_date') && (
                              <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {getValidationError(quarter.quarter_id, 'start_date')}
                              </div>
                            )}
                            
                            {/* Date Suggestions */}
                            {(() => {
                              const suggestions = suggestOptimalDates(quarter.quarter_id);
                              if (suggestions?.start_date && !quarter.start_date) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleTimelineInputChange(index, 'start_date', suggestions.start_date)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors mt-1"
                                  >
                                    💡 Suggest: {suggestions.start_date}
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={quarter.end_date}
                              onChange={(e) => handleTimelineInputChange(index, 'end_date', e.target.value)}
                              className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 transition-colors caret-[#232c67] ${
                                hasValidationError(quarter.quarter_id, 'end_date')
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]'
                              }`}
                              required
                            />
                            {hasValidationError(quarter.quarter_id, 'end_date') && (
                              <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {getValidationError(quarter.quarter_id, 'end_date')}
                              </div>
                            )}
                            
                            {/* Date Suggestions */}
                            {(() => {
                              const suggestions = suggestOptimalDates(quarter.quarter_id);
                              if (suggestions?.end_date && !quarter.end_date && quarter.start_date) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleTimelineInputChange(index, 'end_date', suggestions.end_date)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors mt-1"
                                  >
                                    💡 Suggest: {suggestions.end_date}
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </form>
              </div>

              {/* Action Buttons - Fixed at Bottom */}
              <div className="border-t border-gray-200 p-6 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeTimelineModal}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <FaTimes className="text-sm" />
                  Close
                </button>
                <button
                  type="submit"
                  onClick={handleTimelineSubmit}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                    !isTimelineValid
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                      : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                  }`}
                  disabled={!isTimelineValid}
                >
                  <FaSave className="text-sm" />
                  Save Timeline
                </button>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
  );
}
