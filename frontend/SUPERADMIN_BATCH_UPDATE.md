# SuperAdmin Section Batch Update Script

This document tracks the batch update of SuperAdminSection files.

## Files to Update (17 total)

1. ✅ ChangePassword/changepass.js
2. ✅ ChangePassword/page.js  
3. ⏳ Dashboard/page.js
4. ⏳ Calendar/page.js
5. ⏳ Configuration/page.js
6. ⏳ ViewOwnUser/page.js
7. ⏳ Users/page.js
8. ⏳ Users/AddUser/page.js
9. ⏳ Users/ViewUser/page.js
10. ⏳ Users/AssignedClass/page.js
11. ⏳ Users/ViewLinkedStudent/page.js
12. ⏳ Users/StudentProgress/page.js
13. ⏳ Report/page.js
14. ⏳ Schedule/page.js
15. ⏳ Message/page.js
16. ⏳ Logs/page.js
17. ⏳ Archive/page.js

## Common Replacements

All files need:
1. Add import: `import { API } from '@/config/api';`
2. Replace all `/php/` endpoints with `API.*` equivalents

## Endpoint Mapping

### Authentication
- `/php/login.php` → `API.auth.login()`
- `/php/changepassword.php` → `API.auth.changePassword()`
- `/php/send_otp.php` → `API.auth.sendOTP()`
- `/php/otpverify.php` → `API.auth.verifyOTP()`

### Users
- `/php/Users/get_all_users.php` → `API.user.getAllUsers()`
- `/php/Users/get_user_details.php` → `API.user.getUserDetails()`
- `/php/Users/get_user_profile.php` → `API.user.getUserProfile()`
- `/php/Users/get_user_names.php` → `API.user.getUserNames()`
- `/php/Users/get_student_details.php` → `API.user.getStudentDetails()`
- `/php/Users/get_user_counts.php` → `API.user.getUserCounts()`

### Assessment
- `/php/Assessment/get_visual_feedback.php` → `API.assessment.getVisualFeedback()`
- `/php/Assessment/get_risk_levels.php` → `API.assessment.getRiskLevels()`
- `/php/Assessment/get_quarters.php` → `API.assessment.getQuarters()`
- `/php/Assessment/get_shapes.php` → `API.assessment.getShapes()`
- `/php/Assessment/get_detailed_activity_data.php` → `API.assessment.getDetailedActivityData()`
- `/php/Assessment/update_visual_feedback.php` → `API.assessment.updateVisualFeedback()`
- `/php/Assessment/bulk_archive_activities.php` → `API.assessment.bulkArchiveActivities()`
- `/php/Assessment/get_all_classes_quarterly_performance.php` → `API.assessment.getAllClassesQuarterlyPerformance()`
- `/php/Assessment/get_all_classes_quarterly_performance_averages.php` → `API.assessment.getAllClassesQuarterlyPerformanceAverages()`
- `/php/Assessment/get_risk_level_report_data.php` → `API.assessment.getRiskLevelReportData()`
- `/php/Assessment/get_subject_performance_data.php` → `API.assessment.getSubjectPerformanceData()`

### Advisory
- `/php/Advisory/get_advisory_details.php` → `API.advisory.getAdvisoryDetails()`
- `/php/Advisory/list_class_levels.php` → `API.advisory.listClassLevels()`
- `/php/Advisory/get_available_sessions.php` → `API.advisory.getAvailableSessions()`
- `/php/Advisory/get_attendance.php` → `API.advisory.getAttendance()`
- `/php/Advisory/get_attendance_report_data.php` → `API.advisory.getAttendanceReportData()`

### Communication
- `/php/Communication/get_users.php` → `API.communication.getUsers()`
- `/php/Communication/get_conversation.php` → `API.communication.getConversation()`
- `/php/Communication/get_recent_conversations.php` → `API.communication.getRecentConversations()`
- `/php/Communication/get_archived_conversations.php` → `API.communication.getArchivedConversations()`
- `/php/Communication/get_groups.php` → `API.communication.getGroups()`
- `/php/Communication/get_group_messages.php` → `API.communication.getGroupMessages()`
- `/php/Communication/send_message.php` → `API.communication.sendMessage()`
- `/php/Communication/send_group_message.php` → `API.communication.sendGroupMessage()`
- `/php/Communication/edit_message.php` → `API.communication.editMessage()`
- `/php/Communication/edit_group_message.php` → `API.communication.editGroupMessage()`
- `/php/Communication/unsent_message.php` → `API.communication.unsentMessage()`
- `/php/Communication/unsent_group_message.php` → `API.communication.unsentGroupMessage()`
- `/php/Communication/mark_messages_read.php` → `API.communication.markMessagesRead()`
- `/php/Communication/archive_conversation.php` → `API.communication.archiveConversation()`
- `/php/Communication/unarchive_conversation.php` → `API.communication.unarchiveConversation()`
- `/php/Communication/get_group_message_reads.php` → `API.communication.getGroupMessageReads()`

### Schedule
- `/php/Schedule/get_schedule.php` → `API.schedule.getSchedule()`
- `/php/Schedule/get_routines.php` → `API.schedule.getRoutines()`
- `/php/Schedule/get_subjects.php` → `API.schedule.getSubjects()`
- `/php/Schedule/get_schedule_item_usage.php` → `API.schedule.getScheduleItemUsage()`
- `/php/Schedule/add_schedule_item.php` → `API.schedule.addScheduleItem()`
- `/php/Schedule/update_schedule_item.php` → `API.schedule.updateScheduleItem()`
- `/php/Schedule/update_schedule_items.php` → `API.schedule.updateScheduleItems()`
- `/php/Schedule/edit_schedule_item.php` → `API.schedule.editScheduleItem()`
- `/php/Schedule/delete_schedule_item.php` → `API.schedule.deleteScheduleItem()`

### Meeting
- `/php/Meeting/get_upcoming_meetings.php` → `API.meeting.getUpcomingMeetings()`

### Logs
- `/php/Logs/create_system_log.php` → `API.logs.createSystemLog()`
- `/php/Logs/get_system_logs.php` → `API.logs.getSystemLogs()`
- `/php/Logs/update_school_year_timeline.php` → `API.logs.updateSchoolYearTimeline()`



