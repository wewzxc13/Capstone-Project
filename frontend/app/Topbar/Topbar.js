"use client";

import { useState, useEffect, useCallback } from "react";
import { FaBell, FaCog, FaArrowLeft, FaUser, FaBars } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useUser } from "../Context/UserContext";

export default function Topbar({ title = "Dashboard", notifications = null, onBack, onOpenSidebar }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { userData } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const router = useRouter();






  // --- STATE FOR MEETING NOTIFICATIONS ---
  const [meetingNotifications, setMeetingNotifications] = useState([]);
  const [pureMeetingNotifications, setPureMeetingNotifications] = useState([]);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingUserNames, setMeetingUserNames] = useState({});
  const [meetingUserRoles, setMeetingUserRoles] = useState({});

  // --- STATE FOR PROGRESS CARD NOTIFICATIONS ---
  const [progressCardNotifications, setProgressCardNotifications] = useState([]);
  const [progressCardLoading, setProgressCardLoading] = useState(false);
  const [overallProgressNotifications, setOverallProgressNotifications] = useState([]);

  const [advisoryTeacherNames, setAdvisoryTeacherNames] = useState({});

  // --- STATE FOR PARENT PROGRESS NOTIFICATIONS ---
  const [parentProgressNotifications, setParentProgressNotifications] = useState([]);
  const [parentOverallProgressNotifications, setParentOverallProgressNotifications] = useState([]);
  const [parentProgressLoading, setParentProgressLoading] = useState(false);

  // Move these function definitions above the useEffect that calls them:

  const fetchMeetingNotifications = useCallback(async () => {
    setMeetingLoading(true);
    try {
      // Fetch notifications from tbl_notifications instead of meetings
      const res = await fetch("/php/Notifications/get_notifications.php");
      
      if (!res.ok) {
        console.error('Meeting notifications HTTP error:', res.status, res.statusText);
        setMeetingNotifications([]);
        return;
      }
      
      const responseText = await res.text();
      let data;
      try {
        // Check if response looks like HTML (contains HTML tags)
        if (responseText.trim().startsWith('<') || responseText.includes('<br') || responseText.includes('<b>')) {
          console.error('Received HTML response instead of JSON for meeting notifications:', responseText.substring(0, 200));
          setMeetingNotifications([]);
          return;
        }
        
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse meeting notifications JSON response:', e, 'Raw response:', responseText.substring(0, 200));
        setMeetingNotifications([]);
        return;
      }
      
      if (data.status === "success" && Array.isArray(data.notifications)) {
        const notifications = data.notifications;
        const userIds = Array.from(new Set(notifications.map(n => n.created_by).filter(Boolean)));
        let userNames = {};
        let userRoles = {};
        if (userIds.length > 0) {
          const res2 = await fetch("/php/Users/get_user_names.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_ids: userIds })
          });
          
          if (res2.ok) {
            const data2ResponseText = await res2.text();
            try {
              const data2 = JSON.parse(data2ResponseText);
              Object.entries(data2).forEach(([id, val]) => {
                userNames[id] = val.full_name;
                userRoles[id] = val.role;
              });
            } catch (e) {
              console.error('Failed to parse user names JSON response:', e);
            }
          }
        }
        
        // For each notification with a meeting_id, fetch its teacher and parent recipients
        const notificationsWithRecipients = await Promise.all(notifications.map(async n => {
          if (!n.meeting_id) {
            return { ...n, teacher_recipient_ids: [], parent_recipient_ids: [] };
          }
          
          try {
            const recRes = await fetch(`/php/Meeting/get_notification_recipients.php?meeting_id=${n.meeting_id}`);
            if (recRes.ok) {
              const recResponseText = await recRes.text();
              try {
                if (recResponseText.trim().startsWith('<') || recResponseText.includes('<br') || recResponseText.includes('<b>')) {
                  console.error('Received HTML response instead of JSON for meeting recipients:', recResponseText.substring(0, 200));
                  return { ...n, teacher_recipient_ids: [], parent_recipient_ids: [] };
                }
                
                const recData = JSON.parse(recResponseText);
                let teacher_recipient_ids = [];
                let parent_recipient_ids = [];
                if (recData.status === 'success') {
                  if (Array.isArray(recData.teachers)) {
                    teacher_recipient_ids = recData.teachers.map(t => String(t.user_id));
                  }
                  if (Array.isArray(recData.parents)) {
                    parent_recipient_ids = recData.parents.map(p => String(p.user_id));
                  }
                }
                return { ...n, teacher_recipient_ids, parent_recipient_ids };
              } catch (e) {
                console.error('Failed to parse meeting recipients JSON response:', e, 'Raw response:', recResponseText.substring(0, 200));
                return { ...n, teacher_recipient_ids: [], parent_recipient_ids: [] };
              }
            } else {
              console.error('Meeting recipients HTTP error:', recRes.status, recRes.statusText);
              return { ...n, teacher_recipient_ids: [], parent_recipient_ids: [] };
            }
          } catch (error) {
            console.error('Error fetching meeting recipients:', error);
            return { ...n, teacher_recipient_ids: [], parent_recipient_ids: [] };
          }
        }));
        
        setMeetingNotifications(notificationsWithRecipients);
        setMeetingUserNames(userNames);
        setMeetingUserRoles(userRoles);
        
        // Fetch teacher names from advisory relationships for meetings with advisory_id
        const advisoryIds = Array.from(new Set(notificationsWithRecipients
          .filter(n => n.advisory_id)
          .map(n => n.advisory_id)
        ));
        
        if (advisoryIds.length > 0) {
          try {
            const advisoryRes = await fetch("/php/Advisory/get_advisory_teachers.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ advisory_ids: advisoryIds })
            });
            
            if (advisoryRes.ok) {
              const advisoryData = await advisoryRes.json();
              if (advisoryData.status === 'success') {
                setAdvisoryTeacherNames(advisoryData.teachers || {});
              }
            }
          } catch (error) {
            console.error('Error fetching advisory teacher names:', error);
          }
        }
      } else {
        setMeetingNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching meeting notifications:', error);
      setMeetingNotifications([]);
    } finally {
      setMeetingLoading(false);
    }
  }, []);

  // New function to fetch admin notifications using the new backend system
  const fetchAdminNotifications = useCallback(async () => {
    setMeetingLoading(true);
    try {
      const response = await fetch("/php/Notifications/get_notifications_with_read_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.userId,
          user_role: userData.role
        })
      });
      
      if (!response.ok) {
        console.error('Admin notifications HTTP error:', response.status, response.statusText);
        setMeetingNotifications([]);
        return;
      }
      
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.notifications)) {
        // Transform admin notifications to match the expected format
        const transformedNotifications = data.notifications.map(n => ({
          ...n,
          created_at: n.created_at,
          notif_message: n.notif_message,
          meeting_title: n.meeting_title,
          meeting_start: n.meeting_start,
          meeting_end: n.meeting_end,
          meeting_status: n.meeting_status,
          parent_id: n.parent_id,
          student_id: n.student_id,
          advisory_id: n.advisory_id,
          // Add admin-specific fields
          admin_seen: n.admin_seen,
          admin_viewed_at: n.admin_viewed_at,
          // Add recipient fields for compatibility
          teacher_recipient_ids: [],
          parent_recipient_ids: []
        }));
        
        console.log('🔍 Transformed notifications with admin_seen status:', transformedNotifications.map(n => ({
          id: n.notification_id,
          message: n.notif_message?.substring(0, 50) + '...',
          admin_seen: n.admin_seen,
          admin_viewed_at: n.admin_viewed_at
        })));
        
        setMeetingNotifications(transformedNotifications);
        
        // Set user names and roles if available
        if (data.notifications.length > 0) {
          const userIds = Array.from(new Set(data.notifications.map(n => n.created_by).filter(Boolean)));
          if (userIds.length > 0) {
            try {
              const userRes = await fetch("/php/Users/get_user_names.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ids: userIds })
              });
              
              if (userRes.ok) {
                const userData = await userRes.json();
                setMeetingUserNames(userData);
                // Set roles if available
                const roles = {};
                Object.entries(userData).forEach(([id, user]) => {
                  roles[id] = user.role || 'Unknown';
                });
                setMeetingUserRoles(roles);
              }
            } catch (error) {
              console.error('Error fetching user names for admin notifications:', error);
            }
          }
        }
      } else {
        setMeetingNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      setMeetingNotifications([]);
    } finally {
      setMeetingLoading(false);
    }
  }, [userData.userId, userData.role]);

  // New function to fetch teacher notifications using the new backend system
  const fetchTeacherNotifications = useCallback(async () => {
    setMeetingLoading(true);
    try {
      const response = await fetch("/php/Notifications/get_teacher_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.userId,
          user_role: userData.role
        })
      });
      
      if (!response.ok) {
        console.error('Teacher notifications HTTP error:', response.status, response.statusText);
        setMeetingNotifications([]);
        return;
      }
      
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.notifications)) {
        // Transform teacher notifications to match the expected format
        const transformedNotifications = data.notifications.map(n => ({
          ...n,
          created_at: n.created_at,
          notif_message: n.notif_message,
          meeting_title: n.meeting_title,
          meeting_start: n.meeting_start,
          meeting_end: n.meeting_end,
          meeting_status: n.meeting_status,
          parent_id: n.parent_id,
          student_id: n.student_id,
          advisory_id: n.advisory_id,
          // Add teacher-specific fields
          is_read: n.is_read,
          read_at: n.read_at,
          notification_type: n.notification_type,
          // Add recipient fields for compatibility
          teacher_recipient_ids: [],
          parent_recipient_ids: []
        }));
        
        console.log('🔍 Transformed teacher notifications with read status:', transformedNotifications.map(n => ({
          id: n.notification_id,
          message: n.notif_message?.substring(0, 50) + '...',
          is_read: n.is_read,
          read_at: n.read_at,
          type: n.notification_type
        })));
        
        setMeetingNotifications(transformedNotifications);
        
        // Set user names and roles if available
        if (data.notifications.length > 0) {
          const userIds = Array.from(new Set(data.notifications.map(n => n.created_by).filter(Boolean)));
          if (userIds.length > 0) {
            try {
              const userRes = await fetch("/php/Users/get_user_names.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_ids: userIds })
              });
              
              if (userRes.ok) {
                const userData = await userRes.json();
                setMeetingUserNames(userData);
                // Set roles if available
                const roles = {};
                Object.entries(userData).forEach(([id, user]) => {
                  roles[id] = user.role || 'Unknown';
                });
                setMeetingUserRoles(roles);
              }
            } catch (error) {
              console.error('Error fetching user names for teacher notifications:', error);
            }
          }
        }
      } else {
        setMeetingNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching teacher notifications:', error);
      setMeetingNotifications([]);
    } finally {
      setMeetingLoading(false);
    }
  }, [userData.userId, userData.role]);

  // New function to fetch parent notifications using the new backend system
  const fetchParentNotifications = useCallback(async () => {
    setMeetingLoading(true);
    try {
      const response = await fetch("/php/Notifications/get_parent_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.userId,
          user_role: userData.role
        })
      });
      if (!response.ok) {
        console.error('Parent notifications HTTP error:', response.status, response.statusText);
        setMeetingNotifications([]);
        return;
      }
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.notifications)) {
        const transformed = data.notifications.map(n => ({
          ...n,
          // compatibility fields
          notif_message: n.notif_message,
          created_at: n.created_at,
          meeting_title: n.meeting_title,
          meeting_start: n.meeting_start,
          meeting_end: n.meeting_end,
          meeting_status: n.meeting_status,
          parent_id: n.parent_id,
          student_id: n.student_id,
          advisory_id: n.advisory_id,
          is_read: n.is_read,
          read_at: n.read_at,
          notification_type: n.notification_type,
          teacher_recipient_ids: [],
          parent_recipient_ids: []
        }));
        setMeetingNotifications(transformed);
        // Optionally set names for creators
        const userIds = Array.from(new Set(transformed.map(n => n.created_by).filter(Boolean)));
        if (userIds.length > 0) {
          try {
            const userRes = await fetch("/php/Users/get_user_names.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_ids: userIds })
            });
            if (userRes.ok) {
              const userMap = await userRes.json();
              setMeetingUserNames(userMap);
            }
          } catch (e) {
            console.error('Error fetching user names for parent notifications:', e);
          }
        }
      } else {
        setMeetingNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching parent notifications:', error);
      setMeetingNotifications([]);
    } finally {
      setMeetingLoading(false);
    }
  }, [userData.userId, userData.role]);

  const fetchProgressCardNotifications = useCallback(async () => {
    // Only fetch for Super Admin and Teacher roles
    if (userData.role !== 'SuperAdmin' && userData.role !== 'Super Admin' && userData.role !== 'Teacher') {
      setProgressCardNotifications([]);
      return;
    }

    // Check if userData.userId exists
    if (!userData.userId) {
      setProgressCardNotifications([]);
      return;
    }

    setProgressCardLoading(true);
    try {
      const requestBody = {
        user_id: userData.userId,
        user_role: userData.role === 'SuperAdmin' ? 'Super Admin' : userData.role
      };
      
      const res = await fetch("/php/Assessment/get_progress_card_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        console.error('Progress card notifications HTTP error:', res.status, res.statusText);
        setProgressCardNotifications([]);
        return;
      }
      
      const responseText = await res.text();
      
      let data;
      try {
        // Check if response looks like HTML (contains HTML tags)
        if (responseText.trim().startsWith('<') || responseText.includes('<br') || responseText.includes('<b>')) {
          console.error('Received HTML response instead of JSON for progress card notifications:', responseText.substring(0, 200));
          setProgressCardNotifications([]);
          return;
        }
        
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse progress card notifications JSON response:', e, 'Raw response:', responseText.substring(0, 200));
        setProgressCardNotifications([]);
        return;
      }
      
      if (data.status === "success" && Array.isArray(data.notifications)) {
        // Ensure all required fields are present
        const formattedNotifications = data.notifications.map(n => ({
          ...n,
          message: n.message || n.notif_message || '',
          created_at: n.created_at || n.created_at || new Date().toISOString(),
          student_name: n.student_name || 'a student',
          quarter_name: n.quarter_name || ''
        }));
        
        setProgressCardNotifications(formattedNotifications);
      } else {
        setProgressCardNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching progress card notifications:', error);
      setProgressCardNotifications([]);
    } finally {
      setProgressCardLoading(false);
    }
  }, [userData.role, userData.userId]);

  const fetchOverallProgressNotifications = useCallback(async () => {
    // Only fetch for Super Admin and Teacher roles
    if (userData.role !== 'SuperAdmin' && userData.role !== 'Super Admin' && userData.role !== 'Teacher') {
      setOverallProgressNotifications([]);
      return;
    }

    // Check if userData.userId exists
    if (!userData.userId) {
      setOverallProgressNotifications([]);
      return;
    }

    try {
      const requestBody = {
        user_id: userData.userId,
        user_role: userData.role === 'SuperAdmin' ? 'Super Admin' : userData.role
      };
      
      const res = await fetch("/php/Assessment/get_overall_progress_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        console.error('HTTP error:', res.status, res.statusText);
        setOverallProgressNotifications([]);
        return;
      }
      
      const responseText = await res.text();
      
      let data;
      try {
        // Check if response looks like HTML (contains HTML tags)
        if (responseText.trim().startsWith('<') || responseText.includes('<br') || responseText.includes('<b>')) {
          console.error('Received HTML response instead of JSON for overall progress notifications:', responseText.substring(0, 200));
          setOverallProgressNotifications([]);
          return;
        }
        
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e, 'Raw response:', responseText.substring(0, 200));
        setOverallProgressNotifications([]);
        return;
      }
      
      if (data.status === "success" && Array.isArray(data.notifications)) {
        // Ensure all required fields are present
        const formattedNotifications = data.notifications.map(n => ({
          ...n,
          message: n.message || n.notif_message || '',
          created_at: n.created_at || n.created_at || new Date().toISOString(),
          student_name: n.student_name || 'a student'
        }));
        
        setOverallProgressNotifications(formattedNotifications);
      } else {
        setOverallProgressNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching overall progress notifications:', error);
      setOverallProgressNotifications([]);
    }
  }, [userData.role, userData.userId]);

  // New function to fetch parent progress notifications
  const fetchParentProgressNotifications = useCallback(async () => {
    // Only fetch for Parent role
    if (userData.role !== 'Parent') {
      setParentProgressNotifications([]);
      return;
    }

    // Check if userData.userId exists
    if (!userData.userId) {
      setParentProgressNotifications([]);
      return;
    }

    setParentProgressLoading(true);
    try {
      const requestBody = {
        user_id: userData.userId,
        user_role: 'Parent'
      };
      
      const res = await fetch("/php/Assessment/get_parent_progress_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        console.error('Parent progress notifications HTTP error:', res.status, res.statusText);
        setParentProgressNotifications([]);
        return;
      }
      
      const responseText = await res.text();
      
      let data;
      try {
        // Check if response looks like HTML (contains HTML tags)
        if (responseText.trim().startsWith('<') || responseText.includes('<br') || responseText.includes('<b>')) {
          console.error('Received HTML response instead of JSON for parent progress notifications:', responseText.substring(0, 200));
          setParentProgressNotifications([]);
          return;
        }
        
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse parent progress notifications JSON response:', e, 'Raw response:', responseText.substring(0, 200));
        setParentProgressNotifications([]);
        return;
      }
      
      if (data.status === "success" && Array.isArray(data.notifications)) {
        setParentProgressNotifications(data.notifications);
      } else {
        setParentProgressNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching parent progress notifications:', error);
      setParentProgressNotifications([]);
    } finally {
      setParentProgressLoading(false);
    }
  }, [userData.role, userData.userId]);



  // New function to fetch parent overall progress notifications
  const fetchParentOverallProgressNotifications = useCallback(async () => {
    // Only fetch for Parent role
    if (userData.role !== 'Parent') {
      setParentOverallProgressNotifications([]);
      return;
    }

    // Check if userData.userId exists
    if (!userData.userId) {
      setParentOverallProgressNotifications([]);
      return;
    }

    try {
      const requestBody = {
        user_id: userData.userId,
        user_role: 'Parent'
      };
      
      const res = await fetch("/php/Assessment/get_parent_overall_progress_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        console.error('Parent overall progress notifications HTTP error:', res.status, res.statusText);
        setParentOverallProgressNotifications([]);
        return;
      }
      
      const responseText = await res.text();
      
      let data;
      try {
        // Check if response looks like HTML (contains HTML tags)
        if (responseText.trim().startsWith('<') || responseText.includes('<br') || responseText.includes('<b>')) {
          console.error('Received HTML response instead of JSON for parent overall progress notifications:', responseText.substring(0, 200));
          setParentOverallProgressNotifications([]);
          return;
        }
        
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse parent overall progress notifications JSON response:', e, 'Raw response:', responseText.substring(0, 200));
        setParentOverallProgressNotifications([]);
        return;
      }
      
      if (data.status === "success" && Array.isArray(data.notifications)) {
        setParentOverallProgressNotifications(data.notifications);
      } else {
        setParentOverallProgressNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching parent overall progress notifications:', error);
      setParentOverallProgressNotifications([]);
    }
  }, [userData.role, userData.userId]);







  // --- FETCH MEETING NOTIFICATIONS FOR ADMIN, SUPER ADMIN, TEACHER, AND PARENT ---
  useEffect(() => {
    if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin" || userData.role === "Teacher" || userData.role === "Parent") {
      setMeetingLoading(true);
      
      // For Admin and Super Admin, use the new notification system
      if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin") {
        fetchAdminNotifications();
      } else if (userData.role === "Teacher") {
        // For Teacher, use the new teacher notification system
        fetchTeacherNotifications();
      } else {
        fetchMeetingNotifications();
      }
    }
  }, [userData.role, fetchMeetingNotifications, fetchAdminNotifications, fetchTeacherNotifications]);

  // --- FILTER OUT PROGRESS NOTIFICATIONS FROM MEETING NOTIFICATIONS ---
  // This is now handled by dedicated progress notification APIs, so we only need to filter out progress notifications from meeting notifications
  useEffect(() => {
    if (meetingNotifications.length > 0) {
      // Filter out progress notifications from meeting notifications to avoid duplicates
      const pureMeetings = meetingNotifications.filter(n => 
        n.notif_message && 
        !n.notif_message.includes('[QUARTERLY PROGRESS]') && 
        !n.notif_message.includes('[OVERALL PROGRESS]')
      );
      setPureMeetingNotifications(pureMeetings);
    }
  }, [meetingNotifications]);

  // --- FETCH PROGRESS NOTIFICATIONS FOR ADMIN AND SUPER ADMIN ---
  useEffect(() => {
    if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin") {
      fetchProgressCardNotifications();
      fetchOverallProgressNotifications();
    }
  }, [userData.role, fetchProgressCardNotifications, fetchOverallProgressNotifications]);

  // --- FETCH PROGRESS NOTIFICATIONS FOR TEACHERS ---
  // Note: Teachers now get progress notifications from the main teacher notification system
  // This useEffect is kept for backward compatibility but no longer needed for teachers
  useEffect(() => {
    if (userData.role === "Teacher") {
      // Teachers now get progress notifications from fetchTeacherNotifications()
      // No need to fetch separately
      return;
    }
  }, [userData.role, fetchProgressCardNotifications, fetchOverallProgressNotifications]);





  // Notification prototype (restored)
  const defaultNotifications = {
    today: [
      {
        time: "Wednesday, March 2025 | 2:15 PM",
        text: `${userData.fullName || "User"} has logged into the system.`,
      },
      {
        time: "Wednesday, March 2025 | 3:19 PM",
        text: "[ Unauthorized Access Detected ] Unknown User attempted to log in with invalid credentials (5 failed attempts).",
        isAlert: true,
      },
      {
        time: "Wednesday, March 2025",
        text: "[REMINDER] You have an upcoming meeting tomorrow at 10:00 AM",
        isReminder: true,
      },
      {
        time: "Wednesday, March 2025",
        text: "Christine Bacsarsa has logged into the system.",
      },
    ],
    yesterday: [
      {
        time: "Wednesday, March 2025 | 2:15 PM",
        text: `${userData.fullName || "User"} has logged into the system.`,
      },
      {
        time: "Wednesday, March 2025 | 1:20 PM",
        text: "[REMINDER] You have an upcoming meeting tomorrow at 10:00 AM",
        isReminder: true,
      },
      {
        time: "Wednesday, March 2025 | 12:15 PM",
        text: `${userData.fullName || "User"} has logged into the system.`,
      },
    ],
  };

  const notifs = notifications || defaultNotifications;

  const handleLogout = async () => {
    console.log('=== Manual Logout Called ===');
    
    try {
      // Get user ID for logout logging
      const userId = localStorage.getItem("userId");
      console.log('User ID for logout:', userId);
      
      if (userId) {
        console.log('Sending logout request to API...');
        
        // Log logout to system logs before clearing localStorage
        const response = await fetch("/php/Logs/create_system_log.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            action: "Logout"
          })
        });
        
        console.log('Logout API response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('Logout API response:', responseData);
        } else {
          console.error('Logout API failed with status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } else {
        console.log('No user ID found in localStorage');
      }
    } catch (error) {
      console.error("Failed to log logout:", error);
      // Continue with logout even if logging fails
    }
    
    console.log('Clearing localStorage and redirecting...');
    localStorage.clear();
    router.push("/LoginSection");
  };

  const handleProfileUpdate = () => {
    const userRole = localStorage.getItem("userRole");

    
    if (userRole === "Admin") {
      console.log("Navigating to Admin ViewOwnUser");
      router.push("/AdminSection/ViewOwnUser");
    } else if (userRole === "SuperAdmin" || userRole === "Super Admin") {
      console.log("Navigating to SuperAdmin ViewOwnUser");
      router.push("/SuperAdminSection/ViewOwnUser");
    } else if (userRole === "Teacher") {
      console.log("Navigating to Teacher ViewOwnUser");
      router.push("/TeacherSection/ViewOwnUser");
    } else if (userRole === "Parent") {
      console.log("Navigating to Parent ViewOwnUser");
      router.push("/ParentSection/ViewOwnUser");
    } else {
      console.log("No matching role found for:", userRole);
      // Fallback - try to navigate based on current path
      const currentPath = window.location.pathname;
      console.log("Using fallback navigation based on path:", currentPath);
      if (currentPath.includes("SuperAdmin")) {
        router.push("/SuperAdminSection/ViewOwnUser");
      } else if (currentPath.includes("Admin")) {
        router.push("/AdminSection/ViewOwnUser");
      } else if (currentPath.includes("Teacher")) {
        router.push("/TeacherSection/ViewOwnUser");
      } else if (currentPath.includes("Parent")) {
        router.push("/ParentSection/ViewOwnUser");
      }
    }
  };

  const handleChangePassword = () => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "SuperAdmin" || userRole === "Super Admin") {
      router.push("/SuperAdminSection/ChangePassword");
    } else if (userRole === "Admin") {
      router.push("/AdminSection/ChangePassword");
    } else if (userRole === "Teacher") {
      router.push("/TeacherSection/ChangePassword");
    } else if (userRole === "Parent") {
      router.push("/ParentSection/ChangePassword");
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.notification-dropdown') && isNotificationOpen) {
        setIsNotificationOpen(false);
      }
      if (!event.target.closest('.profile-dropdown') && isProfileOpen) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen, isProfileOpen]);



  // --- FORMAT MEETING NOTIFICATION MESSAGE ---
  function formatMeetingNotification(m, isOwn) {
    // Use the notif_message from the database if available
    if (m.notif_message) {
      const actorId = m.created_by;
      const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
      const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
      
      // Replace the basic message with detailed information
      let message = m.notif_message;
      
      // If it's a meeting notification, add meeting details
      if (m.meeting_title && m.meeting_start && m.meeting_end) {
        const title = m.meeting_title;
        const start = new Date(m.meeting_start);
        const end = new Date(m.meeting_end);
        const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Replace basic messages with detailed ones based on exact format requirements
        // For [MEETING] notifications (admin/super admin created)
        if (message === "[MEETING] Created the Meeting") {
          if (isOwn) {
            return `You created a meeting named '${title}' on ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
          }
        } else if (message === "[MEETING] Updated the meeting") {
          if (isOwn) {
            return `You updated the details for '${title}', scheduled for ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
          }
        } else if (message === "[MEETING] Rescheduled the meeting") {
          if (isOwn) {
            return `You changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Updated and rescheduled the meeting") {
          if (isOwn) {
            return `You updated and rescheduled the '${title}' to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Cancelled the meeting") {
          if (isOwn) {
            return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          }
        }
        // For [ONE ON ONE MEETING] notifications (teacher created)
        else if (message === "[ONE ON ONE MEETING] Created the Meeting") {
          if (isOwn) {
            return `You created a [ONE ON ONE] meeting named '${title}' on ${dateStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Updated the meeting") {
          if (isOwn) {
            return `You updated the details for '${title}', scheduled for ${dateStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Rescheduled the meeting") {
          if (isOwn) {
            return `You changed the [ONE ON ONE] meeting '${title}', and it has been rescheduled to ${reschedStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Updated and rescheduled the meeting") {
          if (isOwn) {
            return `You updated and rescheduled the [ONE ON ONE] meeting '${title}' to ${reschedStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Cancelled the meeting") {
          // For teacher-created meetings cancelled by teacher or super admin
          const currentUserId = String(localStorage.getItem("userId"));
          const isSuperAdmin = userData.role === "SuperAdmin" || userData.role === "Super Admin";
          const isTeacherCreatedMeeting = m.parent_id && m.student_id && m.advisory_id;
          
          if (isSuperAdmin) {
            if (isOwn) {
              // Super Admin cancelled a meeting
              if (isTeacherCreatedMeeting) {
                // Scenario 2: Super Admin cancelled a teacher-created meeting
                // Since the meeting has advisory_id, parent_id, student_id, it was created by a teacher
                // Get the teacher name from the advisory relationship
                const teacherName = advisoryTeacherNames[m.advisory_id] || "a teacher";
                return `You cancelled ${teacherName} meeting the '${title}' scheduled for ${dateStr}.`;
              } else {
                // Scenario 3: Super Admin cancelled their own meeting
                return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
              }
            } else {
              // Teacher cancelled their own meeting (Scenario 1 - viewed by Super Admin)
              return `[ONE ON ONE MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
            }
          } else {
            // Teacher view - this will be handled by formatTeacherMeetingNotification
            if (isOwn) {
              return `You cancelled the [ONE ON ONE] meeting '${title}' scheduled for ${dateStr}.`;
            } else {
              // Super Admin cancelled the teacher's meeting
              return `${actorName} cancelled your meeting the '${title}' scheduled for ${dateStr}.`;
            }
          }
        }
      }
      
      // If no meeting details or no specific replacement, return the original message
      return message;
    }
    
    // Fallback to old format if no notif_message
    const title = m.meeting_title;
    const start = new Date(m.meeting_start);
    const end = new Date(m.meeting_end);
    const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const actorId = m.created_by;
    const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
    const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
    
    // Add
    if (m.meeting_status === "Scheduled") {
      if (isOwn) {
        return `You created a meeting named '${title}' on ${dateStr}.`;
      } else if (actorRole === "admin") {
        return `[MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
      } else if (actorRole === "teacher") {
        return `[ONE ON ONE MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
      } else {
        return `${actorName} created a meeting named '${title}' on ${dateStr}.`;
      }
    }
    // Update (Rescheduled)
    if (m.meeting_status === "Rescheduled") {
      if (isOwn) {
        return `You changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      } else if (actorRole === "admin") {
        return `[MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      } else if (actorRole === "teacher") {
        return `[ONE ON ONE MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      } else {
        return `${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      }
    }
    // Cancelled
    if (m.meeting_status === "Cancelled") {
      if (isOwn) {
        return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      } else if (actorRole === "admin") {
        return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      } else if (actorRole === "teacher") {
        return `[ONE ON ONE MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      } else {
        return `${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      }
    }
    // Fallback: always return a generic message
    if (isOwn) {
      return `You performed an action on the meeting '${title}' (${m.meeting_status}) on ${dateStr}.`;
    }
    return `${actorName} performed an action on the meeting '${title}' (${m.meeting_status}) on ${dateStr}.`;
  }

  // Helper to format meeting notification for Admin (ADMIN ONLY)
  function formatAdminMeetingNotification(m, isOwn) {
    // Use the notif_message from the database if available
    if (m.notif_message) {
      const actorId = m.created_by;
      const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
      const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
      
      // Replace the basic message with detailed information
      let message = m.notif_message;
      
      // If it's a meeting notification, add meeting details
      if (m.meeting_title && m.meeting_start && m.meeting_end) {
        const title = m.meeting_title;
        const start = new Date(m.meeting_start);
        const end = new Date(m.meeting_end);
        const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Replace basic messages with detailed ones based on exact format requirements
        // For [MEETING] notifications (admin/super admin created)
        if (message === "[MEETING] Created the Meeting") {
          if (isOwn) {
            return `You created a meeting named '${title}' on ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
          }
        } else if (message === "[MEETING] Updated the meeting") {
          if (isOwn) {
            return `You updated the details for '${title}', scheduled for ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
          }
        } else if (message === "[MEETING] Rescheduled the meeting") {
          if (isOwn) {
            return `You changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Updated and rescheduled the meeting") {
          if (isOwn) {
            return `You updated and rescheduled the '${title}' to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Cancelled the meeting") {
          if (isOwn) {
            return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          }
        }
        // For [ONE ON ONE MEETING] notifications (teacher created)
        else if (message === "[ONE ON ONE MEETING] Created the Meeting") {
          return `[ONE ON ONE MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Updated the meeting") {
          return `[ONE ON ONE MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Rescheduled the meeting") {
          return `[ONE ON ONE MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Updated and rescheduled the meeting") {
          return `[ONE ON ONE MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Cancelled the meeting") {
          return `[ONE ON ONE MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
        }
      }
      
      // If no meeting details or no specific replacement, return the original message
      return message;
    }
    
    // Fallback to old format if no notif_message
    const title = m.meeting_title;
    const start = new Date(m.meeting_start);
    const end = new Date(m.meeting_end);
    const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const actorId = m.created_by;
    const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
    const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
    
    // Own actions (admin)
    if (isOwn) {
      if (m.meeting_status === "Scheduled") {
        return `You created a meeting named '${title}' on ${dateStr}.`;
      }
      if (m.meeting_status === "Rescheduled") {
        return `You changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      }
      if (m.meeting_status === "Cancelled") {
        return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      }
    } else if (actorRole === "teacher") {
      // Teacher actions only
      if (m.meeting_status === "Scheduled") {
        return `[ONE ON ONE MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
      }
      if (m.meeting_status === "Rescheduled") {
        return `[ONE ON ONE MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
      }
      if (m.meeting_status === "Cancelled") {
        return `[ONE ON ONE MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
      }
    }
    // No super admin actions or other roles
    return null;
  }

  // Helper to format meeting notification for Teacher (TEACHER ONLY)
  function formatTeacherMeetingNotification(m, isOwn) {
    // Use the notif_message from the database if available
    if (m.notif_message) {
      const actorId = m.created_by;
      const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
      const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
      
      // Replace the basic message with detailed information
      let message = m.notif_message;
      
      // If it's a meeting notification, add meeting details
      if (m.meeting_title && m.meeting_start && m.meeting_end) {
        const title = m.meeting_title;
        const start = new Date(m.meeting_start);
        const end = new Date(m.meeting_end);
        const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Replace basic messages with detailed ones based on exact format requirements
        if (message === "[ONE ON ONE MEETING] Created the Meeting") {
          if (isOwn) {
            return `You created a [ONE ON ONE] meeting named '${title}' on ${dateStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Updated the meeting") {
          if (isOwn) {
            return `You updated the details for '${title}', scheduled for ${dateStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Rescheduled the meeting") {
          if (isOwn) {
            return `You changed the [ONE ON ONE] meeting '${title}', and it has been rescheduled to ${reschedStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Updated and rescheduled the meeting") {
          if (isOwn) {
            return `You updated and rescheduled the [ONE ON ONE] meeting '${title}' to ${reschedStr}.`;
          } else {
            return `[ONE ON ONE MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
          }
        } else if (message === "[ONE ON ONE MEETING] Cancelled the meeting") {
          const currentUserId = String(localStorage.getItem("userId"));
          if (isOwn) {
            // Scenario 1: Teacher cancelled their own meeting
            return `You cancelled the [ONE ON ONE] meeting '${title}' scheduled for ${dateStr}.`;
          } else {
            // Scenario 2: Super Admin cancelled the teacher's meeting
            return `${actorName} cancelled your meeting the '${title}' scheduled for ${dateStr}.`;
          }
        } else if (message === "[MEETING] Created the Meeting") {
          if (isOwn) {
            return `You created a meeting named '${title}' on ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} created a meeting named '${title}' on ${dateStr}.`;
          }
        } else if (message === "[MEETING] Updated the meeting") {
          if (isOwn) {
            return `You updated the details for '${title}', scheduled for ${dateStr}.`;
          } else {
            return `[MEETING] ${actorName} updated the details for '${title}', scheduled for ${dateStr}.`;
          }
        } else if (message === "[MEETING] Rescheduled the meeting") {
          if (isOwn) {
            return `You changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} changed the '${title}', and it has been rescheduled to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Updated and rescheduled the meeting") {
          if (isOwn) {
            return `You updated and rescheduled the '${title}' to ${reschedStr}.`;
          } else {
            return `[MEETING] ${actorName} updated and rescheduled the '${title}' to ${reschedStr}.`;
          }
        } else if (message === "[MEETING] Cancelled the meeting") {
          if (isOwn) {
            // Scenario 3: Teacher was involved in Super Admin meeting and it was cancelled
            return `You cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          } else {
            // Super Admin cancelled a meeting that teacher was invited to
            return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr}.`;
          }
        }
      }
      
      // If no meeting details or no specific replacement, return the original message
      return message;
    }
    
    // Fallback to old format if no notif_message
    const title = m.meeting_title;
    const start = new Date(m.meeting_start);
    const end = new Date(m.meeting_end);
    const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}`;
    const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const actorId = m.created_by;
    const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
    const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
    
    // If teacher is the creator (own action)
    if (isOwn) {
      if (m.meeting_status === "Scheduled") {
        return `You created a [ONE ON ONE] meeting named '${title}' on ${dateStr}, from ${timeStr}.`;
      }
      if (m.meeting_status === "Rescheduled") {
        return `You changed the [ONE ON ONE] meeting '${title}', and it has been rescheduled to ${dateStr} from ${timeStr}.`;
      }
      if (m.meeting_status === "Cancelled") {
        return `You cancelled the [ONE ON ONE] meeting '${title}' scheduled for ${dateStr} from ${timeStr}.`;
      }
    }
    
    // If teacher is a recipient (invited, not creator)
    const userId = String(localStorage.getItem("userId"));
    if (String(m.created_by) !== userId && m.teacher_recipient_ids && m.teacher_recipient_ids.includes(userId)) {
      if (actorRole === "admin") {
        if (m.meeting_status === "Scheduled") {
          return `[MEETING] ${actorName} invited you to the ${title} on ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Rescheduled") {
          return `[MEETING] ${actorName} rescheduled the '${title}' meeting to ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Cancelled") {
          return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr} at ${timeStr}.`;
        }
      } else if (actorRole === "superadmin" || actorRole === "super admin") {
        if (m.meeting_status === "Scheduled") {
          return `[MEETING] ${actorName} invited you to the ${title} on ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Rescheduled") {
          return `[MEETING] ${actorName} rescheduled the '${title}' meeting to ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Cancelled") {
          return `[MEETING] ${actorName} cancelled the '${title}' meeting scheduled for ${dateStr} at ${timeStr}.`;
        }
      }
    }
    
    // No other actions
    return null;
  }

  function formatParentMeetingNotification(m, isOwn) {
    // Use the notif_message from the database if available
    if (m.notif_message) {
      const actorId = m.created_by;
      const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
      const actorRole = (meetingUserRoles[actorId] || "").toLowerCase();
      
      // Replace the basic message with detailed information
      let message = m.notif_message;
      
      // If it's a meeting notification, add meeting details
      if (m.meeting_title && m.meeting_start && m.meeting_end) {
        const title = m.meeting_title;
        const start = new Date(m.meeting_start);
        const end = new Date(m.meeting_end);
        const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const reschedStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()} from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Replace basic messages with detailed ones based on exact format requirements
        // For [MEETING] notifications (admin/super admin created)
        if (message === "[MEETING] Created the Meeting") {
          return `[MEETING] You are invited to the ${title} on ${dateStr}.`;
        } else if (message === "[MEETING] Updated the meeting") {
          return `[MEETING] The meeting '${title}' has been updated and is scheduled for ${dateStr}.`;
        } else if (message === "[MEETING] Rescheduled the meeting") {
          return `[MEETING] The meeting '${title}' has been rescheduled to ${reschedStr}.`;
        } else if (message === "[MEETING] Updated and rescheduled the meeting") {
          return `[MEETING] The meeting '${title}' has been updated and rescheduled to ${reschedStr}.`;
        } else if (message === "[MEETING] Cancelled the meeting") {
          return `[MEETING] The meeting '${title}' scheduled for ${dateStr} has been cancelled.`;
        }
        // For [ONE ON ONE MEETING] notifications (teacher created)
        else if (message === "[ONE ON ONE MEETING] Created the Meeting") {
          return `[ONE ON ONE MEETING] ${actorName} invited you to the meeting '${title}' on ${dateStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Updated the meeting") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${actorName} has been updated and is scheduled for ${dateStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Rescheduled the meeting") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${actorName} has been rescheduled to ${reschedStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Updated and rescheduled the meeting") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${actorName} has been updated and rescheduled to ${reschedStr}.`;
        } else if (message === "[ONE ON ONE MEETING] Cancelled the meeting") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${actorName}, which was scheduled for ${dateStr}, has been cancelled.`;
        }
      }
      
      // If no meeting details or no specific replacement, return the original message
      return message;
    }
    
    // Fallback to old format if no notif_message
    const title = m.meeting_title;
    const start = new Date(m.meeting_start);
    const end = new Date(m.meeting_end);
    const dateStr = `${start.toLocaleString('default', { month: 'long' })} ${start.getDate()}`;
    const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const userId = String(localStorage.getItem("userId"));
    const creatorRole = (meetingUserRoles[m.created_by] || "").toLowerCase();
    const advisorName = meetingUserNames[m.created_by] || "Advisor";
    // Only show if parent is a recipient (invited)
    if (m.parent_recipient_ids && m.parent_recipient_ids.includes(userId)) {
      if (creatorRole === "admin" || creatorRole === "superadmin" || creatorRole === "super admin") {
        if (m.meeting_status === "Scheduled") {
          return `[MEETING] You are invited to the ${title} on ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Rescheduled") {
          return `[MEETING] The meeting '${title}' has been rescheduled to ${dateStr} at ${timeStr}.`;
        }
        if (m.meeting_status === "Cancelled") {
          return `[MEETING] The meeting '${title}' scheduled for ${dateStr} at ${timeStr} has been cancelled.`;
        }
      } else if (creatorRole === "teacher") {
        if (m.meeting_status === "Scheduled") {
          return `[ONE ON ONE MEETING] ${advisorName} invited you to the meeting '${title}' on ${dateStr}, from ${timeStr}.`;
        }
        if (m.meeting_status === "Rescheduled") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${advisorName} has been rescheduled to ${dateStr}, at ${timeStr}.`;
        }
        if (m.meeting_status === "Cancelled") {
          return `[ONE ON ONE MEETING] The meeting '${title}' with ${advisorName}, which was scheduled for ${dateStr} at ${timeStr}, has been canceled.`;
        }
      }
    }
    // No other actions
    return null;
  }

  // Helper to format timestamp as 'Month Day, Year | h:mm AM/PM'
  function formatLogTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts.replace(' ', 'T'));
    if (isNaN(date.getTime())) return ts;
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const datePart = date.toLocaleDateString(undefined, options);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${datePart} | ${hours}:${minStr} ${ampm}`;
  }

  // Helper to format progress card notifications
  function formatProgressCardNotification(n, isOwn) {
    if (!n.message && !n.notif_message) return '';
    
    // Debug: Log what data we're receiving
    console.log('🔍 formatProgressCardNotification received:', {
      message: n.message,
      notif_message: n.notif_message,
      quarter_name: n.quarter_name,
      student_name: n.student_name,
      created_by: n.created_by
    });
    
    // Get the actor name for 3rd person references
    const actorId = n.created_by;
    const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
    
    // Use message or notif_message, whichever is available
    const messageText = n.message || n.notif_message || '';
    
    // Check if this is a quarterly progress notification
    if (messageText.includes('[QUARTERLY PROGRESS]')) {
      // Get quarter information
      const quarterInfo = n.quarter_name ? ` (${n.quarter_name})` : '';
      
      // Extract the action from the message - match the actual database message patterns
      if (messageText.includes('Updated a Quarterly Progress')) {
        if (isOwn) {
          return `You updated a Quarterly Progress${quarterInfo} for ${n.student_name || 'a student'}.`;
        } else {
          return `[QUARTERLY PROGRESS] ${actorName} updated a Quarterly Progress${quarterInfo} for ${n.student_name || 'a student'}.`;
        }
      } else if (messageText.includes('Finalized a Quarterly Progress')) {
        if (isOwn) {
          return `You finalized a Quarterly Progress${quarterInfo} for ${n.student_name || 'a student'}.`;
        } else {
          return `[QUARTERLY PROGRESS] ${actorName} finalized a Quarterly Progress${quarterInfo} for ${n.student_name || 'a student'}.`;
        }
      }
    }
    
    // If no specific formatting applies, return the original message
    return messageText;
  }

  // Helper to format overall progress notifications
  function formatOverallProgressNotification(n, isOwn) {
    if (!n.message && !n.notif_message) return '';
    
    // Debug: Log what data we're receiving
    console.log('🔍 formatOverallProgressNotification received:', {
      message: n.message,
      notif_message: n.notif_message,
      student_name: n.student_name,
      created_by: n.created_by
    });
    
    // Get the actor name for 3rd person references
    const actorId = n.created_by;
    const actorName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || "Someone";
    
    // Use message or notif_message, whichever is available
    const messageText = n.message || n.notif_message || '';
    
    // Check if this is an overall progress notification
    if (messageText.includes('[OVERALL PROGRESS]')) {
      // Extract the action from the message - match the actual database message patterns
      if (messageText.includes('Updated an Overall progress')) {
        if (isOwn) {
          return `You updated an Overall Progress for ${n.student_name || 'a student'}.`;
        } else {
          return `[OVERALL PROGRESS] ${actorName} updated an Overall Progress for ${n.student_name || 'a student'}.`;
        }
      } else if (messageText.includes('Finalized an Overall progress')) {
        if (isOwn) {
          return `You finalized an Overall Progress for ${n.student_name || 'a student'}.`;
        } else {
          return `[OVERALL PROGRESS] ${actorName} finalized an Overall Progress for ${n.student_name || 'a student'}.`;
        }
      }
    }
    
    // If no specific formatting applies, return the original message
    return messageText;
  }

  // Helper to format parent progress card notifications
  function formatParentProgressCardNotification(n, isOwn) {
    if (!n.message && !n.notif_message) return '';

    // Derive student full name
    const studentName = n.student_name
      || (n.stud_firstname || n.stud_middlename || n.stud_lastname
          ? `${n.stud_firstname || ''} ${n.stud_middlename || ''} ${n.stud_lastname || ''}`.replace(/\s+/g, ' ').trim()
          : 'your child');

    // Resolve quarter display
    const toQuarterDisplay = (qid, qname) => {
      if (qname && qname.trim().length > 0) return qname;
      const map = { '1': '1st Quarter', '2': '2nd Quarter', '3': '3rd Quarter', '4': '4th Quarter' };
      const key = String(qid || '').trim();
      return map[key] || '';
    };
    const quarterDisplay = toQuarterDisplay(n.quarter_id, n.quarter_name);

    // Resolve teacher/actor name
    const actorId = n.created_by;
    const teacherName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || 'a teacher';

    const messageText = n.message || n.notif_message || '';
    if (!messageText.includes('[QUARTERLY PROGRESS]')) return messageText;

    const isFinalized = /Finalized/i.test(messageText);
    const verbPart = isFinalized ? 'has been finalized' : 'has been updated';

    // Parent-only required format
    const quarterPart = quarterDisplay ? ` for (${quarterDisplay})` : '';
    return `[QUARTERLY PROGRESS] Progress card for ${studentName}${quarterPart} ${verbPart} by ${teacherName}.`;
  }

  // Helper to format parent overall progress notifications
  function formatParentOverallProgressNotification(n, isOwn) {
    if (!n.message && !n.notif_message) return '';

    // Student name (fallback to your child)
    const studentName = n.student_name
      || (n.stud_firstname || n.stud_middlename || n.stud_lastname
          ? `${n.stud_firstname || ''} ${n.stud_middlename || ''} ${n.stud_lastname || ''}`.replace(/\s+/g, ' ').trim()
          : 'your child');

    const actorId = n.created_by;
    const teacherName = meetingUserNames[actorId]?.full_name || meetingUserNames[actorId] || 'a teacher';

    const messageText = n.message || n.notif_message || '';
    if (!messageText.includes('[OVERALL PROGRESS]')) return messageText;

    const isFinalized = /Finalized/i.test(messageText);
    const verbPart = isFinalized ? 'has been finalized' : 'has been updated';

    // Parent-only required format
    return `[OVERALL PROGRESS] Overall progress for ${studentName} ${verbPart} by ${teacherName}.`;
  }

  // Combine system logs, meeting notifications, and progress card notifications into a single list, sorted by date descending
  const getCombinedLogs = useCallback(() => {
    // Map system logs to a unified format
    let sysLogs = [];
    let meetLogs = [];
    let progressLogs = [];
    let overallProgressLogs = [];
    
    // Remove all system logs for all user roles - only keep meetings and progress notifications
    if (userData.role === "Admin") {
      // Admin sees meeting notifications AND progress notifications (same as Super Admin)
      // Separate meeting and progress notifications from the unified Admin notification system
      const adminNotifications = meetingNotifications || [];
      
      meetLogs = adminNotifications
        .filter(m => m.meeting_id) // Only meeting notifications
        .map(m => ({
          type: 'meeting',
          timestamp: m.created_at,
          msg: formatAdminMeetingNotification(m, String(m.created_by) === String(localStorage.getItem("userId"))),
          log: m,
        }));
      
      // Progress notifications from Admin notification system
      progressLogs = adminNotifications
        .filter(m => m.notif_message && m.notif_message.includes('[QUARTERLY PROGRESS]'))
        .map(n => ({
          type: 'progress_card',
          timestamp: n.created_at,
          msg: formatProgressCardNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
          log: n,
        }));
      
      overallProgressLogs = adminNotifications
        .filter(m => m.notif_message && m.notif_message.includes('[OVERALL PROGRESS]'))
        .map(n => ({
          type: 'overall_progress',
          timestamp: n.created_at,
          msg: formatOverallProgressNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
          log: n,
        }));
      
    } else if (userData.role === "Teacher") {
      // Teacher sees all notifications from the new teacher notification system
      // The notifications are already properly formatted and include read status
      const teacherNotifications = meetingNotifications || [];
      
      // Process each notification based on its type
      teacherNotifications.forEach(n => {
        if (n.notification_type === 'general_meeting' || n.notification_type === 'one_on_one_meeting') {
          meetLogs.push({
            type: 'meeting',
            timestamp: n.created_at,
            msg: formatTeacherMeetingNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        } else if (n.notification_type === 'quarterly_progress') {
          progressLogs.push({
            type: 'progress_card',
            timestamp: n.created_at,
            msg: formatProgressCardNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        } else if (n.notification_type === 'overall_progress') {
          overallProgressLogs.push({
            type: 'overall_progress',
            timestamp: n.created_at,
            msg: formatOverallProgressNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        }
      });
    } else if (userData.role === "Parent") {
      // Parent uses unified notification feed with per-item read flags
      const parentNotifications = meetingNotifications || [];

      parentNotifications.forEach(n => {
        if (n.notification_type === 'general_meeting' || n.notification_type === 'one_on_one_meeting') {
          meetLogs.push({
            type: 'meeting',
            timestamp: n.created_at,
            msg: formatParentMeetingNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        } else if (n.notification_type === 'quarterly_progress') {
          progressLogs.push({
            type: 'progress_card',
            timestamp: n.created_at,
            msg: formatParentProgressCardNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        } else if (n.notification_type === 'overall_progress') {
          overallProgressLogs.push({
            type: 'overall_progress',
            timestamp: n.created_at,
            msg: formatParentOverallProgressNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
            log: n,
          });
        }
      });
      

      

    } else if (userData.role === "SuperAdmin" || userData.role === "Super Admin") {
      // Super Admin sees all meeting notifications and progress notifications (no system logs)
      // Separate meeting and progress notifications from the unified Admin notification system
      const adminNotifications = meetingNotifications || [];
      
      meetLogs = adminNotifications
        .filter(m => m.meeting_id) // Only meeting notifications
        .map(m => ({
          type: 'meeting',
          timestamp: m.created_at,
          msg: formatMeetingNotification(m, String(m.created_by) === String(localStorage.getItem("userId"))),
          log: m,
        }));
      
      // Progress notifications from Admin notification system
      progressLogs = adminNotifications
        .filter(m => m.notif_message && m.notif_message.includes('[QUARTERLY PROGRESS]'))
        .map(n => ({
          type: 'progress_card',
          timestamp: n.created_at,
          msg: formatProgressCardNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
          log: n,
        }));
      
      overallProgressLogs = adminNotifications
        .filter(m => m.notif_message && m.notif_message.includes('[OVERALL PROGRESS]'))
        .map(n => ({
          type: 'overall_progress',
          timestamp: n.created_at,
          msg: formatOverallProgressNotification(n, String(n.created_by) === String(localStorage.getItem("userId"))),
          log: n,
        }));
      
    } else {
      // Default case - no system logs, only meetings
      meetLogs = (pureMeetingNotifications || []).map(m => ({
        type: 'meeting',
        timestamp: m.created_at,
        msg: formatMeetingNotification(m, String(m.created_by) === String(localStorage.getItem("userId"))),
        log: m,
      }));
    }
    // Combine and sort by timestamp descending, filter out null/empty messages
    // Deduplicate notifications based on notification_id to prevent duplicates
    // This prevents duplicate QUARTERLY and OVERALL PROGRESS notifications
    const allLogs = [...meetLogs, ...progressLogs, ...(overallProgressLogs || [])]
      .filter(item => {
        const hasMsg = !!item.msg;
        return hasMsg;
      });
    

    
    // Create a Map to deduplicate by notification_id (for progress notifications)
    const uniqueLogs = new Map();
    
    allLogs.forEach(log => {
      // Fix: Ensure progress notifications are properly typed based on message content
      if (log.msg && typeof log.msg === 'string') {
        if (log.msg.includes('[QUARTERLY PROGRESS]')) {
          log.type = 'progress_card';
          // Apply formatting for progress card notifications only if not already formatted
          if (log.log && log.log.message && !log.msg.includes('Progress card for')) {
            if (userData.role === "Parent") {
              log.msg = formatParentProgressCardNotification(log.log, String(log.log.created_by) === String(localStorage.getItem("userId")));
            } else {
              log.msg = formatProgressCardNotification(log.log, String(log.log.created_by) === String(localStorage.getItem("userId")));
            }
          }
        } else if (log.msg.includes('[OVERALL PROGRESS]')) {
          log.type = 'overall_progress';
          // Apply formatting for overall progress notifications only if not already formatted
          if (log.log && log.log.message && !log.msg.includes('Overall progress for')) {
            if (userData.role === "Parent") {
              log.msg = formatParentOverallProgressNotification(log.log, String(log.log.created_by) === String(localStorage.getItem("userId")));
            } else {
              log.msg = formatOverallProgressNotification(log.log, String(log.log.created_by) === String(localStorage.getItem("userId")));
            }
          }
        }
      }
      
      if (log.type === 'progress_card' || log.type === 'overall_progress') {
        // For progress notifications, use notification_id as key to prevent duplicates
        const key = log.log?.notification_id || `${log.type}_${log.timestamp}_${log.msg}`;
        if (!uniqueLogs.has(key)) {
          uniqueLogs.set(key, log);
        }
      } else {
        // For other types, use timestamp and message as key
        const key = `${log.type}_${log.timestamp}_${log.msg}`;
        if (!uniqueLogs.has(key)) {
          uniqueLogs.set(key, log);
        }
      }
    });
    
    const combined = Array.from(uniqueLogs.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    

    
    return combined;
  }, [meetingNotifications, progressCardNotifications, overallProgressNotifications, userData.role, meetingUserNames, meetingUserRoles, advisoryTeacherNames, parentProgressNotifications, parentOverallProgressNotifications]);

  // Fetch system logs, meeting notifications, progress card notifications, and overall progress notifications on mount and every 30 seconds
  useEffect(() => {
    if (!userData.role || !userData.userId) {
      return; // Don't fetch until user data is fully loaded
    }
    
    // Only fetch meeting notifications for non-admin roles
    if (userData.role !== "Admin" && userData.role !== "SuperAdmin" && userData.role !== "Super Admin") {
      if (userData.role === "Teacher") {
        fetchTeacherNotifications();
      } else if (userData.role === "Parent") {
        fetchParentNotifications();
      } else {
        fetchMeetingNotifications();
      }
    }
    
    // Fetch progress notifications based on role
    if (userData.role === "Teacher") {
      // Teachers now get progress notifications from fetchTeacherNotifications()
      // No need to fetch separately
    } else if (userData.role === "Parent") {
      fetchParentProgressNotifications();
      fetchParentOverallProgressNotifications();
    }
    // Admin/Super Admin will get progress notifications from fetchAdminNotifications()
    
    const interval = setInterval(() => {
      // For Admin and Super Admin, use the new notification system
      if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin") {
        fetchAdminNotifications();
      } else if (userData.role === "Teacher") {
        // For Teacher, use the new teacher notification system
        fetchTeacherNotifications();
      } else if (userData.role === "Teacher") {
        fetchTeacherNotifications();
      } else if (userData.role === "Parent") {
        fetchParentNotifications();
      } else {
        fetchMeetingNotifications();
      }
      
      // Fetch progress notifications based on role
      if (userData.role === "Teacher") {
        // Teachers now get progress notifications from fetchTeacherNotifications()
      } else if (userData.role === "Parent") {
        // Parents now get unified notifications from fetchParentNotifications()
      }
      // Admin/Super Admin will get progress notifications from fetchAdminNotifications()
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [userData.role, userData.userId, userData.fullName, fetchMeetingNotifications, fetchAdminNotifications, fetchProgressCardNotifications, fetchOverallProgressNotifications, fetchParentProgressNotifications, fetchParentOverallProgressNotifications]); // Add function dependencies

  // Handle notification bell click - automatically mark all as seen for Admin/Super Admin and Teacher
  // This makes it hassle-free: just open the bell dropdown and all notifications are marked as seen
  const handleNotificationBellClick = async e => {
    e.stopPropagation();
    
    // For Admin, Super Admin, Teacher, and Parent, automatically mark all notifications as seen when bell is opened
    if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin" || userData.role === "Teacher" || userData.role === "Parent") {
      console.log('🔔 Admin/Super Admin/Teacher bell clicked - marking all as seen...');
      console.log('User ID:', userData.userId, 'Role:', userData.role);
      
      try {
        const requestBody = {
          user_id: userData.userId,
          user_role: userData.role
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch("/php/Notifications/mark_all_notifications_read.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ All notifications automatically marked as seen:', data);
          
          // Refresh notifications to update the count and show seen status
          if (userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin") {
            console.log('🔄 Refreshing admin notifications...');
            
            // Small delay to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Force refresh all notification types for Admin/Super Admin
            await fetchAdminNotifications();
            // Progress notifications are now included in fetchAdminNotifications()
            
            // Also refresh the unread count
            const countResponse = await fetch("/php/Notifications/count_unread_notifications.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userData.userId,
                user_role: userData.role
              })
            });
            
            if (countResponse.ok) {
              const countData = await countResponse.json();
              if (countData.status === 'success') {
                setNotifCount(countData.total_unread);
                console.log('🔄 Updated notification count:', countData.total_unread);
              }
            }
          } else if (userData.role === "Teacher") {
            console.log('🔄 Refreshing teacher notifications...');
            
            // Small delay to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Force refresh all notification types for Teacher
            await fetchTeacherNotifications();
            
            // Also refresh the unread count
            const countResponse = await fetch("/php/Notifications/count_unread_notifications.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userData.userId,
                user_role: userData.role
              })
            });
            
            if (countResponse.ok) {
              const countData = await countResponse.json();
              if (countData.status === 'success') {
                const unread = Number(countData.total_unread) || 0;
                setNotifCount(unread);
                console.log('🔄 Updated notification count:', countData.total_unread);
              }
            }
          } else if (userData.role === "Parent") {
            console.log('🔄 Refreshing parent notifications...');
            // Small delay to ensure DB ops complete
            await new Promise(resolve => setTimeout(resolve, 100));
            // Refresh parent unified notifications
            await fetchParentNotifications();
            // Refresh unread count
            const countResponse = await fetch("/php/Notifications/count_unread_notifications.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userData.userId,
                user_role: userData.role
              })
            });
            if (countResponse.ok) {
              const countData = await countResponse.json();
              if (countData.status === 'success') {
                const unread = Number(countData.total_unread) || 0;
                setNotifCount(unread);
              }
            }
 } else {
            console.log('🔄 Refreshing meeting notifications...');
            fetchMeetingNotifications();
          }
        } else {
          console.error('❌ HTTP error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
        }
      } catch (error) {
        console.error('❌ Error marking notifications as seen:', error);
      }
    } else {
      console.log('🔔 Non-admin/teacher bell clicked - no action needed');
    }
    
    setIsNotificationOpen(prev => !prev);
  };

  // Keep notifCount always in sync with logs, meetings, progress card notifications, and overall progress notifications
  // Note: For Admin, Super Admin, Teacher, and Parent, use unread count API so badge shows unread only
  useEffect(() => {
    // No-op here; counts fetched via API for Admin/SuperAdmin/Teacher/Parent
  }, [getCombinedLogs, userData.role]); // Use getCombinedLogs as dependency to prevent infinite re-renders

  // Fetch unread notification count for Admin, Super Admin, Teacher, and Parent
  useEffect(() => {
    if ((userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin" || userData.role === "Teacher" || userData.role === "Parent") && userData.userId) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/php/Notifications/count_unread_notifications.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userData.userId,
              user_role: userData.role
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              // Ensure we only display unread count (never total)
              const unread = Number(data.total_unread) || 0;
              setNotifCount(unread);
            }
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userData.role, userData.userId]);



  // Initials avatar for a friendly identity marker
  const userDisplayName = (userData.fullName && userData.fullName.trim().length > 0)
    ? userData.fullName
    : "User";

    return (
      <div className="sticky top-0 z-50 mb-6 -mt-6 rounded-none bg-gradient-to-r from-[#E9F3FF] to-[#CFE3FC] border border-blue-100 shadow-sm px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 select-none caret-transparent -mx-6">
      <div className="flex items-center w-full select-none">
        {onOpenSidebar && (
          <button
            className="md:hidden mr-3 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-sm border border-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232c67]/50"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <FaBars className="text-[#232c67] text-lg" />
          </button>
        )}
        {onBack && (
          <button
            className="mr-3 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-sm border border-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232c67]/50"
            onClick={onBack}
            aria-label="Back"
            title="Go back"
          >
            <FaArrowLeft className="text-[#232c67] text-lg" />
          </button>
        )}
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#1B3764] select-none">{title}</h1>
      </div>
        <div className="flex items-center gap-2 sm:gap-3 relative select-none caret-transparent">
        <button
          className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-sm border border-blue-100 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232c67]/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={handleNotificationBellClick}
          aria-label="Notifications"
          title="Notifications"
        >
          <FaBell className="text-[#232c67] cursor-pointer" />
          {((userData.role === "SuperAdmin" || userData.role === "Super Admin" || userData.role === "Admin" || userData.role === "Teacher" || userData.role === "Parent") && notifCount > 0) && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>
        {isNotificationOpen && (
          <div
            className="fixed sm:absolute left-4 right-4 sm:right-0 sm:left-auto top-24 sm:mt-3 w-auto sm:w-[420px] max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl p-4 z-50 text-sm space-y-3 border border-blue-100 notification-dropdown select-none"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-base font-semibold text-[#2c2f6f]">Notifications</h4>

            {meetingLoading || progressCardLoading || parentProgressLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : getCombinedLogs().length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1e2a79] to-[#232c67] rounded-full flex items-center justify-center">
                    <FaBell className="text-2xl text-white" />
                  </div>
                 
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">No Notifications Yet</h4>
                <p className="text-xs text-gray-500 max-w-48 leading-relaxed">
                  You're all caught up! New notifications will appear here when they arrive.
                </p>
                <div className="mt-3 flex gap-1">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {getCombinedLogs().map((item, idx) => (
                  <div 
                    className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-100"
                    key={idx}
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      item.type === 'warning' ? 'bg-red-600' : 
                      item.type === 'meeting' ? 'bg-green-600' : 
                      item.type === 'progress_card' ? 'bg-blue-400' :
                      item.type === 'overall_progress' ? 'bg-yellow-400' :
                      'bg-[#232c67]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{formatLogTimestamp(item.timestamp)}</p>
                      <p className={`text-sm leading-relaxed break-words ${item.type === 'warning' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{item.msg}</p>
                      {/* Show seen status for Admin/Super Admin and read status for Teachers/Parents */}
                      {(userData.role === "Admin" || userData.role === "SuperAdmin" || userData.role === "Super Admin") && 
                       item.log && item.log.admin_seen && (
                        <p className="text-xs text-green-600 mt-2">✓ Read</p>
                      )}
                      {(userData.role === "Teacher" || userData.role === "Parent") && 
                       item.log && item.log.is_read && (
                        <p className="text-xs text-green-600 mt-2">✓ Read</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="relative select-none">
          <button
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-sm border border-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232c67]/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="Settings"
            title="Settings"
          >
            <FaCog className="text-[#232c67]" />
          </button>
          {isProfileOpen && (
            <div 
              className="profile-dropdown fixed sm:absolute right-4 sm:right-0 top-28 sm:top-auto sm:mt-2 bg-white shadow-xl rounded-2xl border border-blue-100 w-64 sm:w-48 z-[1000] select-none"
            >
              <p className="px-4 py-3 font-semibold text-xs sm:text-sm text-gray-700 border-b border-gray-100">Settings</p>
              {userData.role !== "Parent" && (
                <button 
                  onClick={handleProfileUpdate}
                  className="block w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 text-xs sm:text-sm min-h-[44px] flex items-center"
                >
                  Profile Update
                </button>
              )}
              <button
                onClick={handleChangePassword}
                className="block w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 text-xs sm:text-sm min-h-[44px] flex items-center"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 text-red-500 text-xs sm:text-sm min-h-[44px] flex items-center"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 select-none">
          <div className="h-10 w-10 sm:h-11 sm:w-11 aspect-square rounded-full overflow-hidden bg-gradient-to-br from-[#FFB703] to-[#FB8500] text-white flex items-center justify-center shadow-sm select-none caret-transparent shrink-0 relative">
            {userData.user_photo && typeof userData.user_photo === 'string' && userData.user_photo.trim() !== '' ? (
              <>
                <img
                  src={userData.user_photo}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'none';
                    }
                  }}
                />
                {/* Fallback icon that shows when photo fails to load */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFB703] to-[#FB8500] text-white flex items-center justify-center text-sm sm:text-base hidden">
                  <FaUser />
                </div>
              </>
            ) : (
              <FaUser className="text-white text-sm sm:text-base" />
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#1B3764] text-xs sm:text-base">
              {isLoading ? "Welcome..." : `Welcome, ${userDisplayName}!`}
            </p>
            <p className="text-[10px] sm:text-xs text-[#1B3764] opacity-80">
              {isLoading ? "Loading..." : (userData.role === "SuperAdmin" || userData.role === "Super Admin" ? "Owner" : userData.role)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 