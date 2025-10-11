/**
 * Usage Examples for API Configuration
 * 
 * This file demonstrates how to use the centralized API configuration
 * in different scenarios throughout the application.
 */

import axios from 'axios';
import { API, apiClient, apiRequest } from './api';

// ============================================================================
// AUTHENTICATION EXAMPLES
// ============================================================================

/**
 * Example 1: User Login
 */
export async function loginUser(email: string, password: string) {
  try {
    const response = await axios.post(API.auth.login(), {
      email,
      password,
    });
    
    if (response.data.success) {
      // Store user data
      localStorage.setItem('userId', response.data.userData.id);
      localStorage.setItem('userRole', response.data.role);
      return response.data;
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Example 2: Send OTP
 */
export async function sendOTPCode(email: string) {
  try {
    const response = await axios.post(API.auth.sendOTP(), { email });
    return response.data;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
}

/**
 * Example 3: Verify OTP
 */
export async function verifyOTPCode(email: string, otp: string) {
  try {
    const response = await axios.post(API.auth.verifyOTP(), { email, otp });
    return response.data;
  } catch (error) {
    console.error('OTP verification failed:', error);
    throw error;
  }
}

// ============================================================================
// USER MANAGEMENT EXAMPLES
// ============================================================================

/**
 * Example 4: Fetch User Details
 */
export async function fetchUserDetails(userId: number) {
  try {
    const response = await axios.post(API.user.getUserDetails(), {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw error;
  }
}

/**
 * Example 5: Get All Users
 */
export async function fetchAllUsers() {
  try {
    const response = await fetch(API.user.getAllUsers());
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

/**
 * Example 6: Update User Profile
 */
export async function updateUserProfile(userData: any) {
  try {
    const response = await axios.post(API.user.updateUser(), userData);
    return response.data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

/**
 * Example 7: Get Student Details
 */
export async function fetchStudentDetails(studentId: number) {
  try {
    const response = await fetch(API.user.getStudentDetails(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch student details:', error);
    throw error;
  }
}

// ============================================================================
// ASSESSMENT EXAMPLES
// ============================================================================

/**
 * Example 8: Get Student Progress Cards
 */
export async function fetchProgressCards(studentId: number, advisoryId: number) {
  try {
    const response = await fetch(
      API.assessment.getStudentProgressCards(studentId, advisoryId)
    );
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch progress cards:', error);
    throw error;
  }
}

/**
 * Example 9: Create Progress Card Comment
 */
export async function createProgressComment(commentData: {
  student_id: number;
  quarter_id: number;
  comment: string;
  teacher_id: number;
}) {
  try {
    const response = await axios.post(
      API.assessment.createComment(),
      commentData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
}

/**
 * Example 10: Update Overall Progress
 */
export async function updateOverallProgress(progressData: any) {
  try {
    const response = await fetch(API.assessment.updateOverallProgress(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to update overall progress:', error);
    throw error;
  }
}

/**
 * Example 11: Fetch Multiple Assessment Data (Parallel Requests)
 */
export async function fetchAllAssessmentData(studentId: number, advisoryId: number) {
  try {
    const [
      visualFeedback,
      progressCards,
      quarters,
      comments,
      overallProgress,
    ] = await Promise.all([
      fetch(API.assessment.getVisualFeedback()),
      fetch(API.assessment.getStudentProgressCards(studentId, advisoryId)),
      fetch(API.assessment.getQuarters()),
      fetch(API.assessment.getComments(studentId)),
      fetch(API.assessment.getOverallProgress(studentId, advisoryId)),
    ]);

    return {
      visualFeedback: await visualFeedback.json(),
      progressCards: await progressCards.json(),
      quarters: await quarters.json(),
      comments: await comments.json(),
      overallProgress: await overallProgress.json(),
    };
  } catch (error) {
    console.error('Failed to fetch assessment data:', error);
    throw error;
  }
}

// ============================================================================
// ADVISORY & ATTENDANCE EXAMPLES
// ============================================================================

/**
 * Example 12: Get Advisory Details
 */
export async function fetchAdvisoryDetails(studentId: number) {
  try {
    const response = await fetch(API.advisory.getAdvisoryDetails(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch advisory details:', error);
    throw error;
  }
}

/**
 * Example 13: Update Attendance
 */
export async function updateAttendance(attendanceData: any) {
  try {
    const response = await axios.post(
      API.advisory.updateAttendance(),
      attendanceData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update attendance:', error);
    throw error;
  }
}

/**
 * Example 14: Get Class Levels
 */
export async function fetchClassLevels() {
  try {
    const response = await fetch(API.advisory.listClassLevels());
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch class levels:', error);
    throw error;
  }
}

// ============================================================================
// COMMUNICATION EXAMPLES
// ============================================================================

/**
 * Example 15: Send Direct Message
 */
export async function sendDirectMessage(receiverId: number, message: string, senderId: number) {
  try {
    const response = await axios.post(API.communication.sendMessage(), {
      sender_id: senderId,
      receiver_id: receiverId,
      message: message,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

/**
 * Example 16: Get Recent Conversations
 */
export async function fetchRecentConversations(userId: number) {
  try {
    const response = await axios.post(API.communication.getRecentConversations(), {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
}

/**
 * Example 17: Send Group Message
 */
export async function sendGroupMessage(groupId: number, message: string, senderId: number) {
  try {
    const response = await axios.post(API.communication.sendGroupMessage(), {
      group_id: groupId,
      sender_id: senderId,
      message: message,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send group message:', error);
    throw error;
  }
}

// ============================================================================
// NOTIFICATION EXAMPLES
// ============================================================================

/**
 * Example 18: Fetch Notifications
 */
export async function fetchNotifications(userId: number) {
  try {
    const response = await fetch(API.notification.getNotifications());
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
}

/**
 * Example 19: Mark All Notifications as Read
 */
export async function markAllAsRead(userId: number) {
  try {
    const response = await fetch(API.notification.markAllNotificationsRead(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    throw error;
  }
}

/**
 * Example 20: Count Unread Notifications
 */
export async function countUnreadNotifications(userId: number) {
  try {
    const response = await fetch(API.notification.countUnreadNotifications());
    return await response.json();
  } catch (error) {
    console.error('Failed to count notifications:', error);
    throw error;
  }
}

// ============================================================================
// USING API CLIENT EXAMPLES
// ============================================================================

/**
 * Example 21: Using apiClient (with interceptors)
 */
export async function loginWithClient(email: string, password: string) {
  try {
    const response = await apiClient.post(API.auth.login(), {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    // Error is already handled by interceptor
    throw error;
  }
}

/**
 * Example 22: Using apiRequest utility
 */
export async function fetchUserWithUtility(userId: number) {
  try {
    const data = await apiRequest(API.user.getUserDetails(), {
      method: 'POST',
      data: { user_id: userId },
    });
    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// ============================================================================
// SYSTEM LOGS EXAMPLES
// ============================================================================

/**
 * Example 23: Create System Log
 */
export async function createSystemLog(logData: {
  user_id: number;
  action: string;
  details?: string;
}) {
  try {
    const response = await axios.post(API.logs.createSystemLog(), logData);
    return response.data;
  } catch (error) {
    console.error('Failed to create log:', error);
    // Don't throw - logging should not break the app
  }
}

/**
 * Example 24: Get Client IP (External API)
 */
export async function getClientIP() {
  try {
    const response = await axios.get(API.external.getClientIP());
    return response.data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return null;
  }
}

// ============================================================================
// FILE UPLOAD EXAMPLES
// ============================================================================

/**
 * Example 25: Get Photo URL
 */
export function getPhotoURL(filename: string) {
  if (!filename) return null;
  return API.uploads.getUploadURL(filename);
}

/**
 * Example 26: Try Multiple Upload URLs
 */
export async function loadImageWithFallback(filename: string) {
  const urls = [
    API.uploads.getUploadURL(filename),
    ...API.uploads.getUploadURLAlt(filename),
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return url;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null; // All URLs failed
}

// ============================================================================
// ERROR HANDLING PATTERNS
// ============================================================================

/**
 * Example 27: With Toast Notifications
 */
export async function loginWithToast(email: string, password: string, toast: any) {
  try {
    const response = await axios.post(API.auth.login(), { email, password });
    
    if (response.data.success) {
      toast.success('Login successful!');
      return response.data;
    } else {
      toast.error(response.data.message || 'Login failed');
      return null;
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'An error occurred');
    throw error;
  }
}

/**
 * Example 28: With Loading State
 */
export async function fetchDataWithLoading(
  studentId: number,
  setLoading: (loading: boolean) => void
) {
  setLoading(true);
  try {
    const response = await fetch(API.user.getStudentDetails(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  } finally {
    setLoading(false);
  }
}

// ============================================================================
// REACT HOOKS INTEGRATION
// ============================================================================

/**
 * Example 29: Custom Hook for Fetching Data
 */
import { useState, useEffect } from 'react';

export function useStudentDetails(studentId: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(API.user.getStudentDetails(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId }),
        });
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  return { data, loading, error };
}

/**
 * Example 30: Custom Hook for Notifications
 */
export function useNotifications(userId: number) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(API.notification.getNotifications());
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(API.notification.countUnreadNotifications());
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(API.notification.markAllNotificationsRead(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    refetch: fetchNotifications,
    markAllAsRead,
  };
}

