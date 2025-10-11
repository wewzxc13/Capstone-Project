/**
 * Centralized API Configuration
 * 
 * This file contains all API endpoints used throughout the application.
 * Update the environment variables in .env.local to change the base URL.
 * 
 * Environment Variables (Optional):
 * - NEXT_PUBLIC_API_BASE_URL: Base URL for the API (default: https://learnersville.online)
 * - NEXT_PUBLIC_BACKEND_PATH: Path to backend (default: /backend-ville)
 * 
 * Production (default):
 * NEXT_PUBLIC_API_BASE_URL=https://learnersville.online
 * NEXT_PUBLIC_BACKEND_PATH=/backend-ville
 * 
 * For local development, create a .env.local file with:
 * NEXT_PUBLIC_API_BASE_URL=http://localhost
 * NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
 */

import axios from 'axios';

// API Base Configuration - Now defaults to production (Namecheap hosting)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://learnersville.online';
const BACKEND_PATH = process.env.NEXT_PUBLIC_BACKEND_PATH || '/backend-ville';

// Full API URL
export const API_URL = `${API_BASE_URL}${BACKEND_PATH}`;

// Determine if we're using production or local development
// Check both the API URL and if we're NOT on localhost
const isProduction = API_BASE_URL.includes('learnersville.online') || 
                     (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));

const getEndpoint = (path) => {
  // Dynamic production check at runtime (not module load time)
  const isDynamicProduction = typeof window !== 'undefined' && 
                               (window.location.hostname.includes('vercel.app') || 
                                window.location.hostname.includes('learnersville.online') ||
                                !window.location.hostname.includes('localhost'));
  
  // For production (Vercel or Namecheap), use direct backend URL
  if (isProduction || isDynamicProduction) {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const endpoint = `${API_URL}/${cleanPath}`;
    console.log('[API] Production endpoint:', endpoint);
    return endpoint;
  }
  
  // For local development, use Next.js rewrites (/php/ -> /capstone-project/backend/)
  if (path.startsWith('/php/')) {
    return path;
  }
  return `/php/${path}`;
};

/**
 * Axios instance with default configuration
 */
export const apiClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('[API] Unauthorized access');
    } else if (error.response?.status === 500) {
      console.error('[API] Server error:', error.response?.data);
    } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
      console.error('[API] Network error - Check CORS configuration');
    } else {
      console.error('[API] Request failed:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API Endpoints
 */
export const authAPI = {
  login: () => getEndpoint('login.php'),
  signup: () => getEndpoint('signup.php'),
  logout: () => getEndpoint('logout.php'),
  sendOTP: () => getEndpoint('send_otp.php'),
  verifyOTP: () => getEndpoint('otpverify.php'),
  changePassword: () => getEndpoint('changepassword.php'),
  updatePassword: () => getEndpoint('update-pass.php'),
  checkUserPhoto: () => getEndpoint('check_user_photo.php'),
  healthCheck: () => getEndpoint('health_check.php'),
};

/**
 * User Management API Endpoints
 */
export const userAPI = {
  getAllUsers: () => getEndpoint('Users/get_all_users.php'),
  getUserDetails: () => getEndpoint('Users/get_user_details.php'),
  getUserProfile: () => getEndpoint('Users/get_user_profile.php'),
  getUserNames: () => getEndpoint('Users/get_user_names.php'),
  getStudentNames: () => getEndpoint('Users/get_student_names.php'),
  getStudentDetails: () => getEndpoint('Users/get_student_details.php'),
  getUserCounts: () => getEndpoint('Users/get_user_counts.php'),
  createUser: () => getEndpoint('Users/create_user.php'),
  addUser: () => getEndpoint('Users/add_user.php'),
  addStudent: () => getEndpoint('Users/add_student.php'),
  updateUser: () => getEndpoint('Users/update_user.php'),
  updateStudent: () => getEndpoint('Users/update_student.php'),
  getParentStudents: (parentId) => getEndpoint(`Users/get_parent_students.php?parent_id=${parentId}`),
  deleteUser: () => getEndpoint('Users/delete_user.php'),
  updateUserStatus: () => getEndpoint('Users/update_user_status.php'),
  updateUserPhoto: () => getEndpoint('Users/update_user_photo.php'),
  uploadPhoto: () => getEndpoint('Users/upload_photo.php'),
  archiveUser: () => getEndpoint('Users/archive_user.php'),
  unarchiveUser: () => getEndpoint('Users/unarchive_user.php'),
  getArchivedUsers: () => getEndpoint('Users/get_archived_users.php'),
  linkStudent: () => getEndpoint('Users/link_student.php'),
  linkStudentToParent: () => getEndpoint('Users/link_student_to_parent.php'),
  unlinkStudent: () => getEndpoint('Users/unlink_student.php'),
  unlinkStudentFromParent: () => getEndpoint('Users/unlink_student_from_parent.php'),
  getLinkedStudents: () => getEndpoint('Users/get_linked_students.php'),
  updateLevel: () => getEndpoint('update_lvl.php'),
};

/**
 * Assessment API Endpoints
 */
export const assessmentAPI = {
  // Visual Feedback
  getVisualFeedback: () => getEndpoint('Assessment/get_visual_feedback.php'),
  createVisualFeedback: () => getEndpoint('Assessment/create_visual_feedback.php'),
  updateVisualFeedback: () => getEndpoint('Assessment/update_visual_feedback.php'),
  
  // Risk Levels
  getRiskLevels: () => getEndpoint('Assessment/get_risk_levels.php'),
  
  // Subjects
  getSubjectsByAdvisory: (advisoryId) => 
    getEndpoint(`Assessment/get_subjects_by_advisory.php?advisory_id=${advisoryId}`),
  
  // Progress Cards
  getStudentProgressCards: (studentId, advisoryId) => 
    getEndpoint(`Assessment/get_student_progress_cards.php?student_id=${studentId}&advisory_id=${advisoryId}`),
  insertProgressCard: () => getEndpoint('Assessment/insert_progress_card.php'),
  updateProgressCard: () => getEndpoint('Assessment/update_progress_card.php'),
  deleteProgressCard: () => getEndpoint('Assessment/delete_progress_card.php'),
  finalizeProgressCard: () => getEndpoint('Assessment/finalize_progress_card.php'),
  
  // Quarter Feedback
  getStudentQuarterFeedback: (studentId) => 
    getEndpoint(`Assessment/get_student_quarter_feedback.php?student_id=${studentId}`),
  
  // Quarters
  getQuarters: () => getEndpoint('Assessment/get_quarters.php'),
  
  // Comments
  getComments: (studentId) => 
    getEndpoint(`Assessment/get_comments.php?student_id=${studentId}`),
  createComment: () => getEndpoint('Assessment/create_comment.php'),
  updateComment: () => getEndpoint('Assessment/update_comment.php'),
  deleteComment: () => getEndpoint('Assessment/delete_comment.php'),
  
  // Overall Progress
  getOverallProgress: (studentId, advisoryId) => 
    getEndpoint(`Assessment/get_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`),
  insertOverallProgress: () => getEndpoint('Assessment/insert_overall_progress.php'),
  updateOverallProgress: () => getEndpoint('Assessment/update_overall_progress.php'),
  
  // Subject Overall Progress
  getSubjectOverallProgress: (studentId, advisoryId) => 
    getEndpoint(`Assessment/get_subject_overall_progress.php?student_id=${studentId}&advisory_id=${advisoryId}`),
  insertSubjectOverallProgress: () => getEndpoint('Assessment/insert_subject_overall_progress.php'),
  updateSubjectOverallProgress: () => getEndpoint('Assessment/update_subject_overall_progress.php'),
  
  // Milestone Interpretation
  getMilestoneInterpretation: (studentId) => 
    getEndpoint(`Assessment/get_milestone_interpretation.php?student_id=${studentId}`),
  updateMilestoneInterpretation: () => getEndpoint('Assessment/update_milestone_interpretation.php'),
  
  // Risk Status
  getStudentRiskStatus: () => getEndpoint('Assessment/get_student_risk_status.php'),
  
  // Activity Management
  checkDuplicateActivity: () => getEndpoint('Assessment/check_duplicate_activity.php'),
  getAssessmentTable: () => getEndpoint('Assessment/get_assessment_table.php'),
  addActivity: () => getEndpoint('Assessment/add_activity.php'),
  updateActivity: () => getEndpoint('Assessment/update_activity.php'),
  saveRating: () => getEndpoint('Assessment/save_rating.php'),
  updateQuarterFeedback: () => getEndpoint('Assessment/update_quarter_feedback.php'),
  getStudentsAtRiskCount: () => getEndpoint('Assessment/get_students_at_risk_count.php'),
  
  // Notifications
  getProgressCardNotifications: () => getEndpoint('Assessment/get_progress_card_notifications.php'),
  getOverallProgressNotifications: () => getEndpoint('Assessment/get_overall_progress_notifications.php'),
  getParentProgressNotifications: () => getEndpoint('Assessment/get_parent_progress_notifications.php'),
  getParentOverallProgressNotifications: () => getEndpoint('Assessment/get_parent_overall_progress_notifications.php'),
  
  // Reports & Analytics
  getAllClassesQuarterlyPerformance: () => getEndpoint('Assessment/get_all_classes_quarterly_performance.php'),
  getAllClassesQuarterlyPerformanceAverages: () => getEndpoint('Assessment/get_all_classes_quarterly_performance_averages.php'),
  getRiskLevelReportData: () => getEndpoint('Assessment/get_risk_level_report_data.php'),
  getSubjectPerformanceData: () => getEndpoint('Assessment/get_subject_performance_data.php'),
  getAdvisorySubjectAverages: (teacherId) => getEndpoint(`Assessment/get_advisory_subject_averages.php?teacher_id=${teacherId}`),
  getClassQuarterlyPerformance: (teacherId) => getEndpoint(`Assessment/get_class_quarterly_performance.php?teacher_id=${teacherId}`),
  
  // Configuration
  getDetailedActivityData: () => getEndpoint('Assessment/get_detailed_activity_data.php'),
  getShapes: () => getEndpoint('Assessment/get_shapes.php'),
  bulkArchiveActivities: () => getEndpoint('Assessment/bulk_archive_activities.php'),
};

/**
 * Advisory/Class Management API Endpoints
 */
export const advisoryAPI = {
  getAdvisoryDetails: () => getEndpoint('Advisory/get_advisory_details.php'),
  getAllAdvisoryDetails: () => getEndpoint('Advisory/get_all_advisory_details.php'),
  getAdvisoryTeachers: () => getEndpoint('Advisory/get_advisory_teachers.php'),
  updateAdvisoryTeacher: () => getEndpoint('Advisory/update_advisory_teacher.php'),
  updateAdvisoryClass: () => getEndpoint('Advisory/update_advisory_class.php'),
  listClassLevels: () => getEndpoint('Advisory/list_class_levels.php'),
  getAvailableSessions: () => getEndpoint('Advisory/get_available_sessions.php'),
  getStudentsByLevel: () => getEndpoint('Advisory/get_students_by_level.php'),
  getStudentsByClassSession: () => getEndpoint('Advisory/get_students_by_class_session.php'),
  listTeachersWithoutAdvisory: () => getEndpoint('Advisory/list_teachers_without_advisory.php'),
  getStudentLevels: () => getEndpoint('Advisory/get_student_levels.php'),
  fixAdvisoryAssignments: () => getEndpoint('Advisory/fix_advisory_assignments.php'),
  
  // Attendance
  getAttendance: () => getEndpoint('Advisory/get_attendance.php'),
  createAttendance: () => getEndpoint('Advisory/create_attendance.php'),
  updateAttendance: () => getEndpoint('Advisory/update_attendance.php'),
  getAttendanceReportData: () => getEndpoint('Advisory/get_attendance_report_data.php'),
  getInactiveStudentsCount: () => getEndpoint('Advisory/get_inactive_students_count.php'),
  
  // Student Assignment
  autoAssignStudents: () => getEndpoint('Advisory/auto_assign_students.php'),
  updateAdvisoryCounts: () => getEndpoint('Advisory/update_advisory_counts.php'),
};

/**
 * Communication/Messaging API Endpoints
 */
export const communicationAPI = {
  // Direct Messages
  getUsers: () => getEndpoint('Communication/get_users.php'),
  getConversation: () => getEndpoint('Communication/get_conversation.php'),
  getRecentConversations: () => getEndpoint('Communication/get_recent_conversations.php'),
  sendMessage: () => getEndpoint('Communication/send_message.php'),
  editMessage: () => getEndpoint('Communication/edit_message.php'),
  unsentMessage: () => getEndpoint('Communication/unsent_message.php'),
  markMessagesRead: () => getEndpoint('Communication/mark_messages_read.php'),
  
  // Group Messages
  getGroups: () => getEndpoint('Communication/get_groups.php'),
  getGroupMessages: () => getEndpoint('Communication/get_group_messages.php'),
  sendGroupMessage: () => getEndpoint('Communication/send_group_message.php'),
  editGroupMessage: () => getEndpoint('Communication/edit_group_message.php'),
  unsentGroupMessage: () => getEndpoint('Communication/unsent_group_message.php'),
  getGroupMessageReads: () => getEndpoint('Communication/get_group_message_reads.php'),
  
  // Archive
  archiveConversation: () => getEndpoint('Communication/archive_conversation.php'),
  unarchiveConversation: () => getEndpoint('Communication/unarchive_conversation.php'),
  getArchivedConversations: () => getEndpoint('Communication/get_archived_conversations.php'),
};

/**
 * Notification API Endpoints
 */
export const notificationAPI = {
  getNotifications: () => getEndpoint('Notifications/get_notifications.php'),
  getNotificationsWithReadStatus: () => getEndpoint('Notifications/get_notifications_with_read_status.php'),
  getTeacherNotifications: () => getEndpoint('Notifications/get_teacher_notifications.php'),
  getParentNotifications: () => getEndpoint('Notifications/get_parent_notifications.php'),
  countUnreadNotifications: () => getEndpoint('Notifications/count_unread_notifications.php'),
  markNotificationRead: () => getEndpoint('Notifications/mark_notification_read.php'),
  markAllNotificationsRead: () => getEndpoint('Notifications/mark_all_notifications_read.php'),
  deleteNotification: () => getEndpoint('Notifications/delete_notification.php'),
  createNotification: () => getEndpoint('Notifications/create_notification.php'),
};

/**
 * Meeting API Endpoints
 */
export const meetingAPI = {
  getMeetings: () => getEndpoint('Meeting/get_meetings.php'),
  getMeetingsDetails: () => getEndpoint('Meeting/get_meetings_details.php'),
  getUpcomingMeetings: () => getEndpoint('Meeting/get_upcoming_meetings.php'),
  createMeeting: () => getEndpoint('Meeting/create_meeting.php'),
  updateMeeting: () => getEndpoint('Meeting/update_meeting.php'),
  deleteMeeting: () => getEndpoint('Meeting/delete_meeting.php'),
  getNotificationRecipients: (meetingId) => 
    getEndpoint(`Meeting/get_notification_recipients.php?meeting_id=${meetingId}`),
  sendMeetingReminders: () => getEndpoint('Meeting/send_meeting_reminders.php'),
};

/**
 * Schedule API Endpoints
 */
export const scheduleAPI = {
  getSchedule: () => getEndpoint('Schedule/get_schedule.php'),
  getTeacherSchedule: () => getEndpoint('Schedule/get_teacher_schedule.php'),
  getStudentSchedule: () => getEndpoint('Schedule/get_student_schedule.php'),
  getRoutines: () => getEndpoint('Schedule/get_routines.php'),
  getSubjects: () => getEndpoint('Schedule/get_subjects.php'),
  getScheduleItemUsage: () => getEndpoint('Schedule/get_schedule_item_usage.php'),
  createSchedule: () => getEndpoint('Schedule/create_schedule.php'),
  updateSchedule: () => getEndpoint('Schedule/update_schedule.php'),
  deleteSchedule: () => getEndpoint('Schedule/delete_schedule.php'),
  addScheduleItem: () => getEndpoint('Schedule/add_schedule_item.php'),
  updateScheduleItem: () => getEndpoint('Schedule/update_schedule_item.php'),
  updateScheduleItems: () => getEndpoint('Schedule/update_schedule_items.php'),
  editScheduleItem: () => getEndpoint('Schedule/edit_schedule_item.php'),
  deleteScheduleItem: () => getEndpoint('Schedule/delete_schedule_item.php'),
};

/**
 * System Logs API Endpoints
 */
export const logsAPI = {
  createSystemLog: () => getEndpoint('Logs/create_system_log.php'),
  getSystemLogs: () => getEndpoint('Logs/get_system_logs.php'),
  checkServerTime: () => getEndpoint('Logs/check_server_time.php'),
  checkCurrentTime: () => getEndpoint('Logs/check_current_time.php'),
  dbHealthCheck: () => getEndpoint('Logs/db_health_check.php'),
  updateSchoolYearTimeline: () => getEndpoint('Logs/update_school_year_timeline.php'),
};

/**
 * External APIs
 */
export const externalAPI = {
  getClientIP: () => 'https://api.ipify.org?format=json',
};

/**
 * File Upload URLs
 */
export const uploadsAPI = {
  getUploadURL: (filename) => {
    // Dynamic production check - check if we're on Vercel or production domain
    const isDynamic = typeof window !== 'undefined' && 
                      (window.location.hostname.includes('vercel.app') || 
                       window.location.hostname.includes('learnersville.online') ||
                       !window.location.hostname.includes('localhost'));
    
    const finalUrl = (isProduction || isDynamic) 
      ? `${API_URL}/Uploads/${filename}`
      : `/php/Uploads/${filename}`;
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[API] getUploadURL:', {
        filename,
        hostname: window.location.hostname,
        isProduction,
        isDynamic,
        API_URL,
        finalUrl
      });
    }
    
    return finalUrl;
  },
  // Alternative paths for different server configurations
  getUploadURLAlt: (filename) => [
    `${API_URL}/Uploads/${filename}`,
    `http://localhost/backend/Uploads/${filename}`,
    `http://localhost/capstone-project/Uploads/${filename}`,
  ],
};

/**
 * Utility function to handle API requests with error handling
 */
export const apiRequest = async (
  endpoint,
  options
) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method: options?.method || 'GET',
      data: options?.data,
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Export all API endpoints as a single object for easy access
 */
export const API = {
  auth: authAPI,
  user: userAPI,
  assessment: assessmentAPI,
  advisory: advisoryAPI,
  communication: communicationAPI,
  notification: notificationAPI,
  meeting: meetingAPI,
  schedule: scheduleAPI,
  logs: logsAPI,
  external: externalAPI,
  uploads: uploadsAPI,
};

export default API;

