"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { FaBell, FaCog, FaChevronDown, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaPlus, FaInfoCircle, FaPlusSquare } from "react-icons/fa";
import { FaPencilAlt } from "react-icons/fa";
import ProtectedRoute from "../../Context/ProtectedRoute";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.css";
import { useModal } from "../../Context/ModalContext";

import { createPortal } from "react-dom";

// Modal component using React Portal
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-[95vw] max-w-[520px] sm:w-[520px] sm:min-w-[480px] relative border border-gray-100" style={{ overflow: 'visible' }}>
        {children}
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : null
  );
}

export default function SuperAdminSchedulePage() {
  const { openModal, closeModal } = useModal();
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editSchedule, setEditSchedule] = useState({});
  const [routines, setRoutines] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pendingEdit, setPendingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirtyCells, setDirtyCells] = new Set();
  const router = useRouter();
  const buttonRef = useRef(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  // Add state for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCell, setModalCell] = useState(null); // { day, start, end, minutes, activities }
  const [modalType, setModalType] = useState('subject');
  const [modalActivity1, setModalActivity1] = useState("");
  const [modalActivity2, setModalActivity2] = useState("");
  const [savingModal, setSavingModal] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  
  // Add Activity modal states
  const [addActivityModalOpen, setAddActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState('subject');
  const [newActivityName, setNewActivityName] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editValidationError, setEditValidationError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [savingDelete, setSavingDelete] = useState(false);
  
  // Usage tracking
  const [usedSubjectIds, setUsedSubjectIds] = useState(new Set());
  const [usedRoutineIds, setUsedRoutineIds] = useState(new Set());
  
  // Schedule Item Type dropdown state
  const [activityTypeDropdownOpen, setActivityTypeDropdownOpen] = useState(false);
  
  // Close Schedule Item Type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activityTypeDropdownOpen && !event.target.closest('.activity-type-dropdown')) {
        setActivityTypeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activityTypeDropdownOpen]);
  


  useEffect(() => {
    setLoading(true);
    fetch("/php/Schedule/get_schedule.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setScheduleData(data.schedules);
          if (data.schedules.length > 0) {
            setSelectedLevelId(data.schedules[0].level_id);
          }
        } else {
          setError("Failed to load schedule");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load schedule");
        setLoading(false);
      });
  }, []);

  // Track viewport for mobile dropdown behavior
  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute mobile dropdown position
  useEffect(() => {
    const computePosition = () => {
      if (!isMobileViewport || !dropdownOpen || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const margin = 16;
      const maxWidth = 320;
      const width = Math.min(window.innerWidth - margin * 2, maxWidth);
      const desiredLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(margin, Math.min(window.innerWidth - width - margin, desiredLeft));
      const top = rect.bottom + 8;
      setDropdownStyle({ top, left, width });
    };
    computePosition();
    window.addEventListener('scroll', computePosition, true);
    window.addEventListener('resize', computePosition);
    return () => {
      window.removeEventListener('scroll', computePosition, true);
      window.removeEventListener('resize', computePosition);
    };
  }, [dropdownOpen, isMobileViewport]);

  // Fetch routines and subjects when entering edit mode
  useEffect(() => {
    if (editMode) {
      fetch("/php/Schedule/get_routines.php")
        .then((res) => res.json())
        .then((data) => {
          setRoutines(data.routines || []);
          console.log('Fetched routines:', data.routines);
        });
      fetch("/php/Schedule/get_subjects.php")
        .then((res) => res.json())
        .then((data) => {
          setSubjects(data.subjects || []);
          console.log('Fetched subjects:', data.subjects);
        });
    }
  }, [editMode]);

  useEffect(() => {
    if (modalOpen) {
      fetch("/php/Schedule/get_routines.php")
        .then((res) => res.json())
        .then((data) => {
          setRoutines(data.routines || []);
          console.log('Fetched routines:', data.routines);
        });
      fetch("/php/Schedule/get_subjects.php")
        .then((res) => res.json())
        .then((data) => {
          setSubjects(data.subjects || []);
          console.log('Fetched subjects:', data.subjects);
        });
    } else {
      // Reset toast state when modal closes
      setToastShown(false);
    }
  }, [modalOpen]);

  // Fetch subjects and routines when Add Activity modal is opened
  useEffect(() => {
    if (addActivityModalOpen) {
      fetch("/php/Schedule/get_subjects.php")
        .then((res) => res.json())
        .then((data) => {
          setSubjects(data.subjects || []);
        })
        .catch((err) => {
          console.error('Failed to fetch subjects:', err);
        });
      
      fetch("/php/Schedule/get_routines.php")
        .then((res) => res.json())
        .then((data) => {
          setRoutines(data.routines || []);
        })
        .catch((err) => {
          console.error('Failed to fetch routines:', err);
        });
        
      // Fetch usage data
      fetch("/php/Schedule/get_schedule_item_usage.php")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setUsedSubjectIds(new Set(data.data.used_subject_ids.map(String)));
            setUsedRoutineIds(new Set(data.data.used_routine_ids.map(String)));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch usage data:', err);
        });
    }
  }, [addActivityModalOpen]);

  const selectedSchedule = scheduleData.find((s) => s.level_id === selectedLevelId);

  // Map level_name to class info
  const getClassInfo = (level_name) => {
    if (/Discoverer/i.test(level_name)) return { label: "Class Schedule of Discoverer", days: ["Monday", "Wednesday", "Friday"], time: "10:30 AM - 11:30 PM/1:30 PM - 2:30 PM" };
    if (/Explorer/i.test(level_name)) return { label: "Class Schedule of Explorer", days: ["Monday", "Wednesday", "Friday"], time: "9:30 AM - 11:00 PM/1:30 PM - 3:00 PM" };
    if (/Adventurer/i.test(level_name)) return { label: "Class Schedule of Adventurer", days: ["Tuesday", "Thursday", "Friday"], time: "9:30 AM - 11:00 PM/1:30 PM - 3:00 PM" };
    return { label: `Class Schedule of ${level_name}`, days: ["Monday", "Wednesday", "Friday"], time: "" };
  };

  const dropdownOptions = scheduleData.map((s) => {
    const info = getClassInfo(s.level_name);
    return {
      label: info.label,
      value: s.level_id,
      days: info.days,
      time: info.time,
      level_name: s.level_name,
    };
  });

  const selectedClassInfo = selectedSchedule ? getClassInfo(selectedSchedule.level_name) : { days: [], time: "" };

  // Helper to group by time slot (start_time-end_time) for selected days, always showing subject if available
  const groupByTime = (schedule, days) => {
    const result = {};
    days.forEach((day) => {
      if (!schedule[day]) return;
      schedule[day].forEach((item) => {
        // Group by start and end only (not type)
        const startVal = item.start_minutes;
        const endVal = item.end_minutes;
        const minutesVal = item.minutes;
        const key = `${startVal}_${endVal}`;
        if (!result[key]) {
          const row = {
            time: minutesVal ? `${minutesVal} minutes` : '',
            start: startVal,
            end: endVal,
            minutes: minutesVal,
          };
          days.forEach((d) => (row[d] = []));
          result[key] = row;
        }
        // Always collect both subjects and routines for this cell
        if (item.subject_id) {
          result[key][day].push({ id: item.subject_id, type: 'subject', name: item.subject_name || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.subject_id_2) {
          result[key][day].push({ id: item.subject_id_2, type: 'subject', name: item.subject_name_2 || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.routine_id) {
          result[key][day].push({ id: item.routine_id, type: 'routine', name: item.routine_name || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
        if (item.routine_id_2) {
          result[key][day].push({ id: item.routine_id_2, type: 'routine', name: item.routine_name_2 || item.name, schedule_item_id: item.schedule_item_id, schedule_id: item.schedule_id });
        }
      });
    });
    // For each cell, prefer subjects if present, otherwise routines
    Object.values(result).forEach(row => {
      days.forEach(day => {
        if (row[day] && row[day].length > 0) {
          const subjects = row[day].filter(x => x.type === 'subject');
          if (subjects.length > 0) {
            row[day] = subjects;
          } else {
            const routines = row[day].filter(x => x.type === 'routine');
            row[day] = routines;
          }
        }
      });
    });
    return Object.values(result).sort((a, b) => (a.start - b.start));
  };

  // When Edit Schedule is clicked, fetch routines/subjects first, then build editSchedule
  const handleEdit = () => {
    const grouped = groupByTime(selectedSchedule.schedule, selectedClassInfo.days);
    const editObj = {};
    grouped.forEach((row) => {
      const key = `${row.start}_${row.end}`;
      editObj[key] = {};
      selectedClassInfo.days.forEach((day) => {
        let current = [];
        if (Array.isArray(row[day]) && row[day].length > 0) {
          row[day].forEach((val) => {
            if (val && val.id && val.type) {
              // If subject and id is null, use name as id
              if (val.type === 'subject' && (val.id === null || val.id === undefined)) {
                current.push({ id: val.name, type: val.type });
              } else {
                current.push({ id: val.id, type: val.type });
              }
            }
          });
        }
        if (current.length < 2) {
          while (current.length < 2) current.push(null);
        } else if (current.length > 2) {
          current = current.slice(0, 2);
        }
        editObj[key][day] = {
          values: current,
          start: row.start,
          end: row.end,
          minutes: row.minutes
        };
      });
    });
    setEditSchedule(editObj);
    setEditMode(true);
  };

  // When routines and subjects are loaded and pendingEdit is true, build editSchedule
  useEffect(() => {
    if (pendingEdit && routines.length > 0 && subjects.length > 0 && selectedSchedule) {
      const grouped = groupByTime(selectedSchedule.schedule, selectedClassInfo.days);
      const editObj = {};
      grouped.forEach((row) => {
        selectedClassInfo.days.forEach((day) => {
          let current = [];
          if (Array.isArray(row[day]) && row[day].length > 0) {
            row[day].forEach((val) => {
              if (val && val.id && val.type) {
                // If subject and id is null, use name as id
                if (val.type === 'subject' && (val.id === null || val.id === undefined)) {
                  current.push({ id: val.name, type: val.type });
                } else {
                  current.push({ id: val.id, type: val.type });
                }
              }
            });
          }
          if (current.length < 2) {
            while (current.length < 2) current.push(null);
          } else if (current.length > 2) {
            current = current.slice(0, 2);
          }
          editObj[`${row.start}_${row.end}`] = current;
        });
      });
      setEditSchedule(editObj);
      setEditMode(true);
      setPendingEdit(false);
    }
  }, [pendingEdit, routines, subjects, selectedSchedule, selectedClassInfo]);

  // In editMode useEffect, only fetch routines/subjects if pendingEdit is true
  useEffect(() => {
    if (pendingEdit) {
      fetch("/php/Schedule/get_routines.php")
        .then((res) => res.json())
        .then((data) => setRoutines(data.routines || []));
      fetch("/php/Schedule/get_subjects.php")
        .then((res) => res.json())
        .then((data) => setSubjects(data.subjects || []));
    }
  }, [pendingEdit]);

  const handleCancel = () => {
    setEditMode(false);
    setEditSchedule({});
  };

  // In edit mode, each cell has two dropdowns, each can select either a routine or a subject
  const handleDropdownChange = (key, day, idx, value, type) => {
    setEditSchedule((prev) => {
      const updated = { ...prev };
      const prevCell = updated[key]?.[day] || {};
      updated[key] = { ...updated[key] };
      let arr = Array.isArray(updated[key][day]?.values) ? [...updated[key][day].values] : [null, null];
      if (value) {
        arr[idx] = { id: value, type };
      } else {
        arr[idx] = null;
      }
      updated[key][day] = {
        values: arr,
        start: prevCell.start,
        end: prevCell.end,
        minutes: prevCell.minutes
      };
      return updated;
    });
    setDirtyCells(prev => {
      const newSet = new Set(prev);
      newSet.add(`${key}_${day}`);
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = [];
    Object.entries(editSchedule).forEach(([key, dayObj]) => {
      Object.entries(dayObj).forEach(([day, cell]) => {
        // if (!dirtyCells.has(`${key}_${day}`)) return; // TEMP: send all cells for debugging
        const { values, start, end, minutes } = cell;
        const filteredArr = Array.isArray(values) ? values.filter(x => x && x.id && x.type) : [];
        const ids = filteredArr.map(x => x.id);
        const type = filteredArr[0]?.type || null;
        if (ids.length && type && start != null && end != null && minutes != null) {
          updates.push({
            day_of_week: day,
            start_minutes: start,
            end_minutes: end,
            minutes: minutes,
            type,
            ids
          });
        }
      });
    });
    const payload = {
      level_id: selectedLevelId,
      updates
    };
    try {
      const res = await fetch("/php/Schedule/update_schedule_items.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "success") {
        setLoading(true);
        fetch("/php/Schedule/get_schedule.php")
          .then((res) => res.json())
          .then((data) => {
            if (data.status === "success") {
              setScheduleData(data.schedules);
              setEditMode(false);
              setEditSchedule({});
              setDirtyCells(new Set());
                          } else {
                setError("Failed to load schedule");
                toast.error("Failed to reload schedule.");
              }
              setLoading(false);
            })
            .catch((err) => {
              setError("Failed to load schedule");
              toast.error("Failed to reload schedule.");
              setLoading(false);
            });
        } else {
          toast.error("Failed to save schedule.");
        }
      } catch (e) {
        toast.error("Failed to save schedule.");
      }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/LoginSection");
  };

  // Helper to convert minutes to time string
  function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  // Helper to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Helper to convert to title case (capitalize each word)
  function toTitleCase(string) {
    return string
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Validation function for schedule item names
  function validateScheduleItemName(name, type, existingItems) {
    const trimmedName = name.trim();
    
    // Check if empty
    if (!trimmedName) {
      return "Name cannot be empty";
    }
    
    // Check minimum length
    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters long";
    }
    
    // Check maximum length
    if (trimmedName.length > 50) {
      return "Name cannot exceed 50 characters";
    }
    
    // Check for numbers only
    if (/^\d+$/.test(trimmedName)) {
      return "Name cannot contain only numbers";
    }
    
    // Check for special characters (allow only letters, numbers, spaces, hyphens, and apostrophes)
    if (!/^[a-zA-Z0-9\s\'-]+$/.test(trimmedName)) {
      return "Name can only contain letters, numbers, spaces, hyphens, and apostrophes";
    }
    
    // Check for consecutive spaces
    if (/\s{2,}/.test(trimmedName)) {
      return "Name cannot contain consecutive spaces";
    }
    
    // Check for leading/trailing spaces
    if (trimmedName !== name.trim()) {
      return "Name cannot start or end with spaces";
    }
    
    // Check for duplicate
    const nameColumn = type === 'subject' ? 'subject_name' : 'routine_name';
    const isDuplicate = existingItems.some(item => 
      item[nameColumn].toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      return `${type === 'subject' ? 'Subject' : 'Routine'} "${trimmedName}" already exists`;
    }
    
    return ""; // No error
  }

  // Helper to open modal with cell info
  const openEditModal = (day, row) => {
    // Don't open modal if in edit mode
    if (editMode) return;
    
    // Find activities in this cell
    const activities = Array.isArray(row[day]) ? row[day] : [];
    // Prefer schedule_item_id from the first activity
    let schedule_item_id = activities[0]?.schedule_item_id || null;
    let schedule_id = activities[0]?.schedule_id || null;
    // fallback: try to find it from the schedule if not present
    if ((!schedule_item_id || !schedule_id) && selectedSchedule && selectedSchedule.schedule && selectedSchedule.schedule[day]) {
      const dayArr = selectedSchedule.schedule[day];
      const cell = dayArr.find(item =>
        item.start_minutes == row.start &&
        item.end_minutes == row.end
      );
      if (cell) {
        schedule_item_id = cell.schedule_item_id;
        schedule_id = cell.schedule_id;
      }
    }
    setModalCell({
      day,
      start: row.start,
      end: row.end,
      minutes: row.minutes,
      activities,
      schedule_item_id, // <-- always include this
      schedule_id // <-- always include this
    });
    let type = 'subject';
    let mainId = '';
    let altId = '';
    if (activities[0]?.type === 'routine') {
      type = 'routine';
      mainId = activities[0]?.id ? String(activities[0].id) : '';
      altId = activities[1]?.id ? String(activities[1].id) : '';
    } else if (activities[0]?.type === 'subject') {
      type = 'subject';
      mainId = activities[0]?.id ? String(activities[0].id) : '';
      altId = activities[1]?.id ? String(activities[1].id) : '';
    } else {
      type = 'subject';
      mainId = '';
      altId = '';
    }
    setModalType(type);
    setModalActivity1(mainId);
    setModalActivity2(altId);
    setModalOpen(true);
    openModal();
  };

  // Helper to determine session (morning/afternoon) for a given start time and class
  function getSessionLabel(startMinutes, levelName) {
    // Use getClassInfo to get the class's time ranges
    const info = getClassInfo(levelName);
    // Parse the time string for the class
    // Example: "10:30 AM - 11:30 AM/1:30 PM - 2:30 PM" or "9:30 AM - 11:00 AM/1:30 PM - 3:00 PM"
    const timeStr = info.time;
    if (!timeStr) return "";
    const [morning, afternoon] = timeStr.split("/");
    // Convert a time string like "10:30 AM - 11:30 AM" to start/end in minutes
    function parseTimeRange(str) {
      if (!str) return [null, null];
      const [start, end] = str.split("-").map(s => s.trim());
      return [toMinutes(start), toMinutes(end)];
    }
    function toMinutes(tstr) {
      if (!tstr) return null;
      const [time, ampm] = tstr.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    }
    const [mStart, mEnd] = parseTimeRange(morning);
    const [aStart, aEnd] = parseTimeRange(afternoon);
    if (mStart != null && mEnd != null && startMinutes >= mStart && startMinutes < mEnd) return "Morning";
    if (aStart != null && aEnd != null && startMinutes >= aStart && startMinutes < aEnd) return "Afternoon";
    // fallback: before noon = morning, after = afternoon
    return startMinutes < 12 * 60 ? "Morning" : "Afternoon";
  }

  let availableSubjects = subjects;
  let availableRoutines = routines;
  if (modalCell && selectedSchedule) {
    const usedSubjectIds = new Set();
    const usedRoutineIds = new Set();
    const dayArr = selectedSchedule.schedule?.[modalCell.day] || [];
    dayArr.forEach(item => {
      if (
        item.start_minutes !== modalCell.start ||
        item.end_minutes !== modalCell.end
      ) {
        if (item.subject_id) usedSubjectIds.add(String(item.subject_id));
        if (item.subject_id_2) usedSubjectIds.add(String(item.subject_id_2));
        if (item.routine_id) usedRoutineIds.add(String(item.routine_id));
        if (item.routine_id_2) usedRoutineIds.add(String(item.routine_id_2));
      }
    });
    
    // Filter available subjects and routines based on the modal type
    if (modalType === 'subject') {
      // If editing a subject, only show subjects
      availableSubjects = subjects.filter(
        s =>
          String(s.subject_id) === modalActivity1 ||
          String(s.subject_id) === modalActivity2 ||
          !usedSubjectIds.has(String(s.subject_id))
      );
      availableRoutines = []; // No routines available when editing subjects
    } else if (modalType === 'routine') {
      // If editing a routine, only show routines
      availableRoutines = routines.filter(
        r =>
          String(r.routine_id) === modalActivity1 ||
          String(r.routine_id) === modalActivity2 ||
          !usedRoutineIds.has(String(r.routine_id))
      );
      availableSubjects = []; // No subjects available when editing routines
    }
  }

  return (
    <ProtectedRoute role="Super Admin">
      <div className="flex-1 p-6 bg-gray-50">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#232c67] rounded-md shadow-sm">
                <FaCalendarAlt className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                  {selectedClassInfo.label}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Add Activity Button */}
              <button
                onClick={() => {
                  setAddActivityModalOpen(true);
                  openModal();
                }}
                className="flex items-center justify-center gap-2 bg-[#232c67] hover:bg-[#1a1f4d] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md w-full sm:w-auto"
              >
                <FaPlus className="text-sm" />
                Add Schedule Item
              </button>
              
              <div className="relative w-full sm:w-auto" ref={buttonRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <FaCalendarAlt className="text-sm" />
                  Select Class
                  <FaChevronDown className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div
                    className={`${isMobileViewport ? 'fixed z-50' : 'absolute z-50'} mt-2 rounded-xl shadow-xl bg-white border border-gray-200 overflow-hidden w-[calc(100vw-2rem)] sm:w-64 sm:right-0`}
                    style={isMobileViewport ? { top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width } : {}}
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">Available Classes</p>
                    </div>
                    <div className="py-2 max-h-72 overflow-y-auto">
                      {dropdownOptions.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaCalendarAlt className="text-xl text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">No Classes Available</p>
                          <p className="text-xs text-gray-500">No class levels have been configured yet.</p>
                        </div>
                      ) : (
                        dropdownOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSelectedLevelId(opt.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[13px] transition-colors ${
                            selectedLevelId === opt.value 
                              ? 'bg-[#232c67] text-white hover:bg-gray-100 hover:text-black' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                          }`}
                        >
                          <div className="font-medium">{opt.label}</div>
                        </button>
                        ))
                        )}
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Table Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Loading schedule...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the data</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">Failed to load schedule</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : selectedSchedule ? (
            <>
              {/* Desktop/tablet table view */}
              <div className="overflow-hidden hidden lg:block">
                <table className="min-w-full text-sm text-left text-gray-800">
                  <thead className="bg-[#232c67] text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-base font-semibold border-r border-[#1a1f4d]">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-sm" />
                          Time
                        </div>
                      </th>
                      {selectedClassInfo.days.map((day) => (
                        <th key={day} className="px-6 py-4 text-base font-semibold border-r border-[#1a1f4d] last:border-r-0">
                          <div className="text-center">
                            <div className="font-bold">{day}</div>
                            <div className="text-xs font-normal text-[#a8b0e0] mt-1">{selectedClassInfo.time}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="overflow-y-auto">
                    {groupByTime(selectedSchedule.schedule, selectedClassInfo.days).length === 0 ? (
                      <tr>
                        <td colSpan={selectedClassInfo.days.length + 1} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <FaCalendarAlt className="text-2xl text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-700 mb-2">Empty Schedule</h4>
                            <p className="text-gray-500 text-center max-w-sm">
                              This class schedule is empty. 
                            </p>
                            
                          </div>
                        </td>
                      </tr>
                    ) : (
                      groupByTime(selectedSchedule.schedule, selectedClassInfo.days).map((row, idx, allRows) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition-colors`}>
                        <td className="px-6 py-4 font-semibold text-sm border-r border-gray-200 bg-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#232c67] rounded-full"></div>
                            {row.time}
                          </div>
                        </td>
                        {selectedClassInfo.days.map((day) => {
                          const key = `${row.start}_${row.end}`;
                          if (editMode) {
                            const first = editSchedule[key]?.[day]?.[0] || null;

                            // Gather all selected routine/subject ids for this day except current cell
                            const usedRoutineIds = new Set();
                            const usedSubjectIds = new Set();
                            allRows.forEach((otherRow) => {
                              const otherKey = `${otherRow.start}_${otherRow.end}`;
                              if (otherKey !== key && editSchedule[otherKey]) {
                                Object.values(editSchedule[otherKey]).forEach(arr => {
                                  Array.isArray(arr?.values) && arr.values.forEach(sel => {
                                    if (sel?.type === 'routine') usedRoutineIds.add(sel.id);
                                    if (sel?.type === 'subject') usedSubjectIds.add(sel.id);
                                  });
                                });
                              }
                            });

                            return (
                              <td key={day} className="px-6 py-4 text-sm border-r border-gray-200 last:border-r-0">
                                <div className="flex flex-col gap-2">
                                  {[0, 1].map((i) => {
                                    // Determine allowed type for this dropdown
                                    let allowedType = null;
                                    const firstType = editSchedule[key]?.[day]?.[0]?.type || null;
                                    if (i === 1 && firstType) allowedType = firstType;
                                    if (i === 0 && editSchedule[key]?.[day]?.[1]?.type) allowedType = editSchedule[key][day][1].type;

                                    // Filter available options
                                    let availableRoutines = allowedType && allowedType !== 'routine' ? [] : routines;
                                    let availableSubjects = allowedType && allowedType !== 'subject' ? [] : subjects;

                                    // Prevent duplicate in the same cell
                                    if (i === 1 && editSchedule[key]?.[day]?.[0]) {
                                      if (editSchedule[key][day][0].type === 'routine') {
                                        availableRoutines = availableRoutines.filter(rt => String(rt.routine_id) !== String(editSchedule[key][day][0].id));
                                      } else if (editSchedule[key][day][0].type === 'subject') {
                                        availableSubjects = availableSubjects.filter(sb => String(sb.subject_id) !== String(editSchedule[key][day][0].id));
                                      }
                                    }

                                    return (
                                      <select
                                        key={`combo_${i}`}
                                        value={editSchedule[key]?.[day]?.values?.[i]
                                          ? `${editSchedule[key][day].values[i].type}_${String(editSchedule[key][day].values[i].id)}`
                                          : ''}
                                        onChange={e => {
                                          const val = e.target.value;
                                          const selectedType = val.startsWith('routine_') ? 'routine' : val.startsWith('subject_') ? 'subject' : null;
                                          // If first dropdown, clear second if type changes
                                          if (i === 0) {
                                            setEditSchedule(prev => {
                                              const updated = { ...prev };
                                              const prevCell = updated[key]?.[day] || {};
                                              updated[key] = { ...updated[key] };
                                              updated[key][day] = {
                                                values: [null, null],
                                                start: prevCell.start,
                                                end: prevCell.end,
                                                minutes: prevCell.minutes
                                              };
                                              if (!val) {
                                                updated[key][day] = {
                                                  values: [null, null],
                                                  start: prevCell.start,
                                                  end: prevCell.end,
                                                  minutes: prevCell.minutes
                                                };
                                              } else {
                                                updated[key][day][0] = { id: val.replace(/^(routine_|subject_)/, ''), type: selectedType };
                                                if (updated[key][day][1] && updated[key][day][1].type !== selectedType) {
                                                  updated[key][day][1] = null;
                                                }
                                              }
                                              return updated;
                                            });
                                          } else {
                                            // Second dropdown, must match first type
                                            setEditSchedule(prev => {
                                              const updated = { ...prev };
                                              const prevCell = updated[key]?.[day] || {};
                                              updated[key] = { ...updated[key] };
                                              updated[key][day] = {
                                                values: [null, null],
                                                start: prevCell.start,
                                                end: prevCell.end,
                                                minutes: prevCell.minutes
                                              };
                                              if (!val) {
                                                updated[key][day] = {
                                                  values: [null, null],
                                                  start: prevCell.start,
                                                  end: prevCell.end,
                                                  minutes: prevCell.minutes
                                                };
                                              } else {
                                                updated[key][day][1] = { id: val.replace(/^(routine_|subject_)/, ''), type: selectedType };
                                              }
                                              return updated;
                                            });
                                          }
                                          setDirtyCells(prev => {
                                            const newSet = new Set(prev);
                                            newSet.add(`${key}_${day}`);
                                            return newSet;
                                          });
                                        }}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                                      >
                                        <option value="">
                                          {allowedType
                                            ? `Select ${allowedType === 'routine' ? 'Routine' : 'Subject'}`
                                            : 'Select Routine or Subject'}
                                        </option>
                                        {(!allowedType || allowedType === 'routine') && (
                                          <optgroup label="Routines">
                                            {availableRoutines.length > 0 ? (
                                              availableRoutines.map(rt => (
                                                <option key={`routine_${rt.routine_id}`} value={`routine_${String(rt.routine_id)}`}>{rt.routine_name}</option>
                                              ))
                                            ) : (
                                              <option value="" disabled>No availability</option>
                                            )}
                                          </optgroup>
                                        )}
                                        {(!allowedType || allowedType === 'subject') && (
                                          <optgroup label="Subjects">
                                            {availableSubjects.length > 0 ? (
                                              availableSubjects.map(sb => (
                                                <option key={`subject_${sb.subject_id}`} value={`subject_${String(sb.subject_id)}`}>{sb.subject_name}</option>
                                              ))
                                            ) : (
                                              <option value="" disabled>No availability</option>
                                            )}
                                          </optgroup>
                                        )}
                                      </select>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          } else {
                            // View mode: cell is clickable to open modal
                            return (
                              <td
                                key={day}
                                className="px-6 py-4 text-sm cursor-pointer hover:bg-blue-50 transition-colors relative group border-r border-gray-200 last:border-r-0"
                                onClick={() => openEditModal(day, row)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {(Array.isArray(row[day]) && row[day].length > 0)
                                      ? [...new Set(row[day].map(x => x && x.name ? x.name : '').filter(Boolean))].join(' / ')
                                      : "-"}
                                  </span>
                                  {/* Edit icon on hover */}
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                                    <FaPencilAlt className="text-sm" />
                                  </span>
                                </div>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    ))
                    )}
                                     </tbody>
                </table>
              </div>

              {/* Mobile view: compact 4-column grid mimicking table without horizontal scroll */}
              <div className="block lg:hidden">
                {/* Header row */}
                <div className="grid grid-cols-4 rounded-t-xl overflow-hidden">
                  <div className="bg-[#232c67] text-white px-3 py-3 text-[13px] font-semibold flex items-center gap-2 border-r border-[#1a1f4d]">
                    <FaCalendarAlt className="text-xs" />
                    <span>Time</span>
                  </div>
                  {selectedClassInfo.days.map((day) => (
                    <div key={day} className="bg-[#232c67] text-white px-2 py-2 text-center text-[12px] border-r last:border-r-0 border-[#1a1f4d]">
                      <div className="font-bold">{day}</div>
                      <div className="text-[10px] text-[#a8b0e0] leading-4 mt-1 whitespace-pre-line">{selectedClassInfo.time}</div>
                    </div>
                  ))}
                </div>

                {/* Body rows */}
                <div>
                  {groupByTime(selectedSchedule.schedule, selectedClassInfo.days).length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <FaCalendarAlt className="text-2xl text-gray-400" />
                      </div>
                      <h4 className="text-base font-medium text-gray-700 mb-1">Empty Schedule</h4>
                      <p className="text-xs text-gray-500">This class schedule is empty.</p>
                    </div>
                  ) : (
                    groupByTime(selectedSchedule.schedule, selectedClassInfo.days).map((row, idx) => (
                      <div key={idx} className={`grid grid-cols-4 text-[13px] border-t border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        {/* Time cell */}
                        <div className="px-3 py-3 font-semibold border-r border-gray-200 min-h-[60px] flex items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#232c67] rounded-full"></span>
                            {row.time}
                          </div>
                        </div>
                        {/* Day cells */}
                        {selectedClassInfo.days.map((day) => (
                          <div key={day} className="px-2 py-3 border-r last:border-r-0 border-gray-200 min-h-[60px] flex items-center">
                            <div className="font-medium">
                              {(Array.isArray(row[day]) && row[day].length > 0)
                                ? [...new Set(row[day].map(x => x && x.name ? x.name : '').filter(Boolean))].join(' / ')
                                : '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {editMode && (
                <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
                  <button 
                    onClick={handleCancel} 
                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <FaTimes className="text-sm" />
                    Close
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg" 
                    disabled={saving}
                  >
                    <FaSave className="text-sm" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaCalendarAlt className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Schedule Available</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">
                No schedule data has been configured for this class level yet. 
                Please contact the administrator to set up the class schedule.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Select a different class or check back later</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for editing schedule cell */}
      <Modal open={modalOpen} onClose={() => {
        setModalOpen(false);
        closeModal();
      }}>
        <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
          <h3 className="text-xl font-bold text-white mb-1">Edit Schedule Item</h3>
          <p className="text-[#a8b0e0] text-sm">Update the schedule details for this time slot</p>
        </div>
        {modalCell && (
          <form
            onSubmit={async e => {
              e.preventDefault();
              
              // Validate that both activities are of the same type
              if (modalType === 'subject' && modalActivity2 && modalActivity2 !== '') {
                // Check if alternative is also a subject
                const isSubject = availableSubjects.some(s => String(s.subject_id) === modalActivity2);
                if (!isSubject) {
                  toast.error('Alternative item must also be a subject when main item is a subject.');
                  return;
                }
              } else if (modalType === 'routine' && modalActivity2 && modalActivity2 !== '') {
                // Check if alternative is also a routine
                const isRoutine = availableRoutines.some(r => String(r.routine_id) === modalActivity2);
                if (!isRoutine) {
                  toast.error('Alternative item must also be a routine when main item is a routine.');
                  return;
                }
              }
              
              setSavingModal(true);
              const toId = v => v && v !== '' ? Number(v) : null;
              let schedule_item_id = modalCell?.schedule_item_id;
              if (!schedule_item_id) {
                // fallback: try to find it again
                if (selectedSchedule && modalCell) {
                  const dayArr = selectedSchedule.schedule?.[modalCell.day] || [];
                  const cell = dayArr.find(item =>
                    item.start_minutes == modalCell.start &&
                    item.end_minutes == modalCell.end
                  );
                  if (cell) {
                    schedule_item_id = cell.schedule_item_id;
                  }
                }
              }
              if (!schedule_item_id) {
                alert('Could not find schedule_item_id for this cell. Update aborted.');
                setSavingModal(false);
                return;
              }
              // Ensure consistent item types: if modalType is 'subject', only populate subject fields
              // If modalType is 'routine', only populate routine fields
              const payload = {
                schedule_item_id,
                schedule_id: modalCell?.schedule_id,
                item_type: modalType === 'subject' ? 1 : 2, // 1 for subject, 2 for routine
                subject_id: modalType === 'subject' ? toId(modalActivity1) : null,
                subject_id_2: modalType === 'subject' ? toId(modalActivity2) : null,
                routine_id: modalType === 'routine' ? toId(modalActivity1) : null,
                routine_id_2: modalType === 'routine' ? toId(modalActivity2) : null
              };
              console.log('Update payload:', payload);
              try {
                const res = await fetch('/php/Schedule/update_schedule_item.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                const data = await res.json();
                                  if (data.status === 'success') {
                    if (!toastShown) {
                      toast.success('Schedule updated successfully!');
                      setToastShown(true);
                      setTimeout(() => setToastShown(false), 3000);
                    }
                    setModalOpen(false);
                    setSavingModal(false);
                    closeModal();
                    setLoading(true);
                    // Refresh schedule
                    fetch('/php/Schedule/get_schedule.php')
                      .then(res => res.json())
                      .then(data => {
                        if (data.status === 'success') {
                          setScheduleData(data.schedules);
                        } else {
                          setError('Failed to load schedule');
                          toast.error('Failed to reload schedule.');
                        }
                        setLoading(false);
                      })
                      .catch(() => {
                        setError('Failed to load schedule');
                        toast.error('Failed to reload schedule.');
                        setLoading(false);
                      });
                  } else {
                    setSavingModal(false);
                    toast.error('Failed to update schedule.');
                  }
                } catch (e) {
                  setSavingModal(false);
                  toast.error('Failed to update schedule.');
                }
            }}
            className="flex flex-col gap-4"
          >
            {/* Day & Time Range in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day</label>
                <div className="text-base font-medium text-gray-800">{modalCell.day}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Time Range</label>
                <div className="text-base font-medium text-gray-800">
                  {(() => {
                    if (!selectedSchedule || !modalCell) return null;
                    const info = getClassInfo(selectedSchedule.level_name);
                    if (!info.time) return null;
                    const [morning, afternoon] = info.time.split("/");
                    function toMinutes(tstr) {
                      if (!tstr) return null;
                      const [time, ampm] = tstr.split(" ");
                      let [h, m] = time.split(":").map(Number);
                      if (ampm === "PM" && h !== 12) h += 12;
                      if (ampm === "AM" && h === 12) h = 0;
                      return h * 60 + m;
                    }
                    function parseTimeRange(str) {
                      if (!str) return [null, null];
                      const [start, end] = str.split("-").map(s => s.trim());
                      return [toMinutes(start), toMinutes(end)];
                    }
                    const [mStart, mEnd] = parseTimeRange(morning);
                    const [aStart, aEnd] = parseTimeRange(afternoon);
                    const offset = modalCell.start - mStart;
                    const duration = modalCell.minutes;
                    const afternoonStart = aStart + offset;
                    const afternoonEnd = afternoonStart + duration;
                    return (
                      <>
                        <div className="mb-1">
                          <span className="font-semibold">Morning</span> {minutesToTime(modalCell.start)} – {minutesToTime(modalCell.end)}
                        </div>
                        <div>
                          <span className="font-semibold">Afternoon</span> {minutesToTime(afternoonStart)} – {minutesToTime(afternoonEnd)}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Duration */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
              <div className="text-base font-medium text-gray-800">{modalCell.minutes} minutes</div>
            </div>
            
            {/* Schedule Item Type */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule Item Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-default">
                  <input
                    type="radio"
                    name="activityType"
                    value="subject"
                    checked={modalType === 'subject'}
                    disabled={true}
                    className="w-4 h-4 text-gray-400 border-gray-300 cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-500">Subject</span>
                </label>
                <label className="flex items-center gap-2 cursor-default">
                  <input
                    type="radio"
                    name="activityType"
                    value="routine"
                    checked={modalType === 'routine'}
                    disabled={true}
                    className="w-4 h-4 text-gray-400 border-gray-300 cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-500">Routine</span>
                </label>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <FaInfoCircle className="inline mr-1" />
                {modalType === 'subject' 
                  ? 'You can only select subjects for both main and alternative items.' 
                  : 'You can only select routines for both main and alternative items.'
                }
              </div>
            </div>
                        {/* Main and Alternative Items in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Main {modalType === 'subject' ? 'Subject' : 'Routine'} <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                  required
                  value={modalActivity1}
                  onChange={e => setModalActivity1(e.target.value)}
                  disabled={editMode ? false : (modalType === 'subject' ? availableSubjects.length === 0 : availableRoutines.length === 0)}
                >
                  <option value="">Select {modalType === 'subject' ? 'Subject' : 'Routine'}</option>
                  {(modalType === 'subject' ? availableSubjects : availableRoutines).length === 0 && (
                    <option value="" disabled>{loading ? 'Loading...' : `No ${modalType === 'subject' ? 'subjects' : 'routines'} available`}</option>
                  )}
                  {(modalType === 'subject' ? availableSubjects : availableRoutines).map(opt => (
                    <option key={modalType === 'subject' ? opt.subject_id : opt.routine_id} value={String(modalType === 'subject' ? opt.subject_id : opt.routine_id)}>
                      {modalType === 'subject' ? opt.subject_name : opt.routine_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alternative {modalType === 'subject' ? 'Subject' : 'Routine'} (optional)
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#232c67] focus:border-[#232c67] transition-colors"
                  value={modalActivity2}
                  onChange={e => setModalActivity2(e.target.value)}
                  disabled={editMode ? false : (modalType === 'subject' ? availableSubjects.length === 0 : availableRoutines.length === 0)}
                >
                  <option value="">None</option>
                  {(modalType === 'subject' ? availableSubjects : availableRoutines)
                    .filter(opt => String(modalActivity1) !== String(modalType === 'subject' ? opt.subject_id : opt.routine_id))
                    .length === 0 && (
                    <option value="" disabled>{loading ? 'Loading...' : `No ${modalType === 'subject' ? 'subjects' : 'routines'} available`}</option>
                  )}
                  {(modalType === 'subject' ? availableSubjects : availableRoutines)
                    .filter(opt => String(modalActivity1) !== String(modalType === 'subject' ? opt.subject_id : opt.routine_id))
                    .map(opt => (
                      <option key={modalType === 'subject' ? opt.subject_id : opt.routine_id} value={String(modalType === 'subject' ? opt.subject_id : opt.routine_id)}>
                        {modalType === 'subject' ? opt.subject_name : opt.routine_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={() => {
                  setModalOpen(false);
                  closeModal();
                }} 
                disabled={savingModal}
              >
                <FaTimes className="text-sm" />
                Close
              </button>
              <button 
                type="submit" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                  savingModal || !modalActivity1
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                }`}
                disabled={savingModal || !modalActivity1}
              >
                <FaSave className="text-sm" />
                {savingModal ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Activity Modal */}
      <Modal open={addActivityModalOpen} onClose={() => {
        setAddActivityModalOpen(false);
        closeModal();
      }}>
        <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
          <h3 className="text-xl font-bold text-white mb-1">Manage Schedule Items</h3>
          <p className="text-[#a8b0e0] text-sm">View existing schedule items and add new ones</p>
        </div>

        {/* Schedule Item Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Schedule Item Type <span className="text-red-500">*</span>
          </label>
          <div className="relative activity-type-dropdown">
            <button
              type="button"
              onClick={() => setActivityTypeDropdownOpen(!activityTypeDropdownOpen)}
              className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <span>{activityType === 'subject' ? 'Subject' : 'Routine'}</span>
              <FaChevronDown className={`text-xs transition-transform ${activityTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {activityTypeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl bg-white border border-gray-200 z-20 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setActivityType('subject');
                      setNewActivityName("");
                      setValidationError("");
                      setActivityTypeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      activityType === 'subject' 
                        ? 'bg-[#232c67] text-white' 
                        : 'text-gray-700 hover:bg-[#232c67] hover:bg-opacity-10'
                    }`}
                  >
                    <div className="font-medium">Subject</div>
                  </button>
                  <button
                    onClick={() => {
                      setActivityType('routine');
                      setNewActivityName("");
                      setValidationError("");
                      setActivityTypeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      activityType === 'routine' 
                        ? 'bg-[#232c67] text-white' 
                        : 'text-gray-700 hover:bg-[#232c67] hover:bg-opacity-10'
                    }`}
                  >
                    <div className="font-medium">Routine</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Current Activities List */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">
            Current {activityType === 'subject' ? 'Subjects' : 'Routines'} (Schedule Items)
          </h4>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {(activityType === 'subject' ? subjects : routines).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No {activityType === 'subject' ? 'subjects' : 'routines'} available</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(activityType === 'subject' ? subjects : routines)
                      .sort((a, b) => (activityType === 'subject' ? a.subject_name : a.routine_name).localeCompare(activityType === 'subject' ? b.subject_name : b.routine_name))
                      .map((item) => (
                      <tr key={activityType === 'subject' ? item.subject_id : item.routine_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800">
                            {activityType === 'subject' ? item.subject_name : item.routine_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingItem({
                                  id: activityType === 'subject' ? item.subject_id : item.routine_id,
                                  name: activityType === 'subject' ? item.subject_name : item.routine_name,
                                  type: activityType
                                });
                                setEditName(activityType === 'subject' ? item.subject_name : item.routine_name);
                                setEditValidationError("");
                                setEditModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {(() => {
                              const itemId = String(activityType === 'subject' ? item.subject_id : item.routine_id);
                              const isUsed = activityType === 'subject' 
                                ? usedSubjectIds.has(itemId) 
                                : usedRoutineIds.has(itemId);
                              
                              if (isUsed) {
                                return (
                                  <div className="p-1 text-gray-400 cursor-not-allowed" title="Cannot delete - currently in use">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </div>
                                );
                              }
                              
                              return (
                                <button
                                  onClick={() => {
                                    setDeletingItem({
                                      id: activityType === 'subject' ? item.subject_id : item.routine_id,
                                      name: activityType === 'subject' ? item.subject_name : item.routine_name,
                                      type: activityType
                                    });
                                    setDeleteModalOpen(true);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                                                </button>
                              );
                            })()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>

        {/* Add New Activity Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            
            // Validate before submission
            const error = validateScheduleItemName(newActivityName, activityType, activityType === 'subject' ? subjects : routines);
            if (error) {
              setValidationError(error);
              return;
            }
            
            setSavingActivity(true);
            try {
              const response = await fetch('/php/Schedule/add_schedule_item.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  item_type: activityType,
                  name: newActivityName.trim()
                })
              });

              const data = await response.json();

              if (data.status === 'success') {
                toast.success(data.message);
                setNewActivityName("");
                setAddActivityModalOpen(false);
                
                // Refresh the lists
                if (activityType === 'subject') {
                  const subjectsResponse = await fetch("/php/Schedule/get_subjects.php");
                  const subjectsData = await subjectsResponse.json();
                  if (subjectsData.subjects) {
                    setSubjects(subjectsData.subjects);
                  }
                } else {
                  const routinesResponse = await fetch("/php/Schedule/get_routines.php");
                  const routinesData = await routinesResponse.json();
                  if (routinesData.routines) {
                    setRoutines(routinesData.routines);
                  }
                }
              } else {
                toast.error(data.message || `Failed to add ${activityType}. Please try again.`);
              }
            } catch (error) {
              console.error('Error adding schedule item:', error);
              toast.error(`Failed to add ${activityType}. Please try again.`);
            } finally {
              setSavingActivity(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New {activityType === 'subject' ? 'Subject' : 'Routine'} Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newActivityName}
              onChange={(e) => {
                const value = toTitleCase(e.target.value);
                setNewActivityName(value);
                const error = validateScheduleItemName(value, activityType, activityType === 'subject' ? subjects : routines);
                setValidationError(error);
              }}
              placeholder={`Enter ${activityType} name...`}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 transition-colors caret-[#232c67] ${
                validationError 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : activityType === 'subject' 
                    ? 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]' 
                    : 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]'
              }`}
              required
            />
            {validationError && (
              <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationError}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button 
              type="button" 
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={() => {
                  setAddActivityModalOpen(false);
                  closeModal();
                }}
              disabled={savingActivity}
            >
              <FaTimes className="text-sm" />
              Close
            </button>
            <button 
              type="submit" 
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                  savingActivity || !newActivityName.trim() || validationError
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : activityType === 'subject' 
                    ? 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                      : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                }`}
              disabled={savingActivity || !newActivityName.trim() || validationError}
            >
              <FaPlusSquare className="text-sm" />
              {savingActivity ? 'Adding...' : `Add ${activityType === 'subject' ? 'Subject' : 'Routine'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Schedule Item Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="mb-4 bg-[#232c67] text-white p-4 rounded-t-lg -mt-8 -mx-8">
          <h3 className="text-xl font-bold text-white mb-1">Edit {editingItem?.type === 'subject' ? 'Subject' : 'Routine'}</h3>
          <p className="text-[#a8b0e0] text-sm">Update the name of this schedule item</p>
        </div>

        {editingItem && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              
              // Validate before submission
              const error = validateScheduleItemName(editName, editingItem.type, editingItem.type === 'subject' ? subjects : routines);
              if (error) {
                setEditValidationError(error);
                return;
              }
              
              setSavingEdit(true);
              try {
                const response = await fetch('/php/Schedule/edit_schedule_item.php', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    item_type: editingItem.type,
                    item_id: editingItem.id,
                    new_name: editName.trim()
                  })
                });

                const data = await response.json();

                if (data.status === 'success') {
                  toast.success(data.message);
                  setEditModalOpen(false);
                  setAddActivityModalOpen(false); // Close the Add Schedule Item modal as well
                  closeModal();
                  
                  // Refresh the lists
                  if (editingItem.type === 'subject') {
                    const subjectsResponse = await fetch("/php/Schedule/get_subjects.php");
                    const subjectsData = await subjectsResponse.json();
                    if (subjectsData.subjects) {
                      setSubjects(subjectsData.subjects);
                    }
                  } else {
                    const routinesResponse = await fetch("/php/Schedule/get_routines.php");
                    const routinesData = await routinesResponse.json();
                    if (routinesData.routines) {
                      setRoutines(routinesData.routines);
                    }
                  }
                } else {
                  toast.error(data.message || `Failed to update ${editingItem.type}. Please try again.`);
                }
              } catch (error) {
                console.error('Error updating schedule item:', error);
                toast.error(`Failed to update ${editingItem.type}. Please try again.`);
              } finally {
                setSavingEdit(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Name
              </label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-800 font-medium">{editingItem.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  const value = toTitleCase(e.target.value);
                  setEditName(value);
                  const error = validateScheduleItemName(value, editingItem.type, editingItem.type === 'subject' ? subjects : routines);
                  setEditValidationError(error);
                }}
                placeholder={`Enter new ${editingItem.type} name...`}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 transition-colors caret-[#232c67] ${
                  editValidationError 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : editingItem.type === 'subject' 
                      ? 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]' 
                      : 'border-gray-300 focus:ring-[#232c67] focus:border-[#232c67]'
                }`}
                required
              />
              {editValidationError && (
                <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editValidationError}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={() => setEditModalOpen(false)} 
                disabled={savingEdit}
              >
                <FaTimes className="text-sm" />
                Close
              </button>
              <button 
                type="submit" 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                  savingEdit || !editName.trim() || editValidationError
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                    : editingItem.type === 'subject' 
                      ? 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                      : 'bg-[#232c67] hover:bg-[#1a1f4d] text-white hover:shadow-lg'
                }`}
                disabled={savingEdit || !editName.trim() || editValidationError}
              >
                <FaSave className="text-sm" />
                {savingEdit ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-red-800 mb-1">Delete {deletingItem?.type === 'subject' ? 'Subject' : 'Routine'}</h3>
          <p className="text-gray-600 text-sm">This action cannot be undone</p>
        </div>

        {deletingItem && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Warning</h4>
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete <span className="font-semibold">"{deletingItem.name}"</span>? 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button 
                type="button" 
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" 
                onClick={() => setDeleteModalOpen(false)} 
                disabled={savingDelete}
              >
                <FaTimes className="text-sm" />
                Close
              </button>
              <button 
                type="button" 
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg" 
                onClick={async () => {
                  setSavingDelete(true);
                  try {
                    const response = await fetch('/php/Schedule/delete_schedule_item.php', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        item_type: deletingItem.type,
                        item_id: deletingItem.id
                      })
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                      toast.success(data.message);
                      setDeleteModalOpen(false);
                      setAddActivityModalOpen(false); // Close the Add Schedule Item modal as well
                  closeModal();
                      
                      // Refresh the lists and usage data
                      if (deletingItem.type === 'subject') {
                        const subjectsResponse = await fetch("/php/Schedule/get_subjects.php");
                        const subjectsData = await subjectsResponse.json();
                        if (subjectsData.subjects) {
                          setSubjects(subjectsData.subjects);
                        }
                      } else {
                        const routinesResponse = await fetch("/php/Schedule/get_routines.php");
                        const routinesData = await routinesResponse.json();
                        if (routinesData.routines) {
                          setRoutines(routinesData.routines);
                        }
                      }
                      
                      // Refresh usage data
                      const usageResponse = await fetch("/php/Schedule/get_schedule_item_usage.php");
                      const usageData = await usageResponse.json();
                      if (usageData.status === 'success') {
                        setUsedSubjectIds(new Set(usageData.data.used_subject_ids.map(String)));
                        setUsedRoutineIds(new Set(usageData.data.used_routine_ids.map(String)));
                      }
                    } else {
                      toast.error(data.message || `Failed to delete ${deletingItem.type}. Please try again.`);
                    }
                  } catch (error) {
                    console.error('Error deleting schedule item:', error);
                    toast.error(`Failed to delete ${deletingItem.type}. Please try again.`);
                  } finally {
                    setSavingDelete(false);
                  }
                }}
                disabled={savingDelete}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {savingDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
    </ProtectedRoute>
  );
}
