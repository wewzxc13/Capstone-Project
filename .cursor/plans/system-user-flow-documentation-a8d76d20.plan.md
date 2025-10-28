<!-- a8d76d20-d03a-4673-8bbd-a13140b98133 377844f2-78fc-4ba4-b102-da15a5ff8e8b -->
# System User Flow Plan - VilLE Learning Management System

## User Roles Overview

The system has **4 user roles**:

1. **Super Admin** (role_id: 1)
2. **Admin** (role_id: 2)
3. **Teacher** (role_id: 3)
4. **Parent** (role_id: 4)

---

## 1. SUPER ADMIN User Flow

### Login Process

- Super Admin logs in using **email and password**
- Must solve **addition captcha** (e.g., 5 + 3 = ?)
- System validates credentials and captcha answer
- On successful login, redirects to Super Admin Dashboard

### Dashboard Features

- View **Active Admin count**
- View **Active Teachers count**
- View **Active Parents count**
- View **Active Students count** (only students linked to parents)
- View **Upcoming Meetings** (next scheduled meetings)
- View **Progress Data** by quarters (line chart showing student performance across Q1-Q4)
- View progress for three student levels: Discoverer, Explorer, Adventurer

### Users Management (`/SuperAdminSection/Users`)

- **View All Users**: List of Admins, Teachers, Parents, and Students
- **Add Users**: 
- Add Admin (with government IDs: TIN, SSS, Pag-IBIG, address)
- Add Teacher (with government IDs and address)
- Add Parent (with address only, no government IDs)
- System automatically generates random password and sends OTP
- **View User Details**: See complete profile of any user
- **Edit User**: Update user information
- **Archive User**: Set user status to Inactive
- When archiving Parent: automatically unlinks all their students and sets students to Inactive
- **Link Parent to Student**: 
- Select parent and student
- System auto-assigns student to advisory based on level
- Updates gender counts in advisory
- **View Linked Students**: See all students linked to a parent
- **Unlink Student from Parent**: Remove parent-student relationship
- **Assign Class**: Assign students to advisory classes
- **View Student Progress**: 
- See quarterly performance (Q1-Q4)
- View assessment ratings (shapes: Heart, Star, Diamond, Triangle, Circle)
- View risk levels and milestones
- Track attendance and behavioral patterns

### Communication/Messaging (`/SuperAdminSection/Message`)

- **Direct Messages**: 
- Send messages to Admins, Teachers, Parents
- View message history with unread counts
- Edit sent messages
- Unsend messages
- Archive conversations
- **Group Messages**:
- Access to ALL groups (Overall, Staff, Class-specific)
- Send group messages
- View message read receipts
- Edit/unsend group messages

### Meeting Management (`/SuperAdminSection/Calendar`)

- **Create Meetings**: 
- General meetings (multiple recipients)
- One-on-one meetings (Teacher-Parent)
- Set meeting title, agenda, start/end time
- Select recipients (Teachers/Parents)
- System checks for time conflicts
- **View Calendar**: See all scheduled meetings
- **Edit Meetings**: Reschedule or update meeting details
- **Cancel Meetings**: Mark meetings as cancelled
- **Meeting Notifications**: 
- Recipients receive notifications
- 48-hour reminder notifications auto-generated
- View notification read status

### Schedule Management (`/SuperAdminSection/Schedule`)

- **View Schedules**: See class schedules for all levels (Discoverer, Explorer, Adventurer)
- **Manage Schedule Items**:
- Add/edit **Subjects** (e.g., Language, Math, Science)
- Add/edit **Routines** (e.g., Attendance, Circle Time, Snack Time, Story Time)
- Set time blocks per day (Monday-Friday)
- Assign different schedules per student level

### Reports (`/SuperAdminSection/Report`)

- **Attendance Report**: View attendance statistics across all classes
- **Progress Report**: 
- Quarterly performance averages
- Risk level distribution (At Risk, Need Attention, On Track)
- Progress trends by quarter
- **Subject Report**: Performance breakdown by subject areas
- **Download Reports**: Export reports as PDF

### Configuration (`/SuperAdminSection/Configuration`)

- **Manage Activities**: 
- View all assessment activities (Activity 1-22)
- Archive activities by quarter or advisory
- View activity usage statistics
- **Manage Visual Feedback**: 
- Edit feedback shapes and meanings
- Available shapes: ❤️ (Excellent), ⭐ (Very Good), 🔷 (Good), ▲ (Need Help), 🟡 (Not Met)
- Edit descriptions for each rating level
- **Manage School Year Timeline**:
- Set dates for Quarter 1, 2, 3, 4
- Define school year start and end dates
- System uses this for quarter calculations

### Notifications (`/SuperAdminSection/Notifications`)

- View all notifications (General Meetings, One-on-One Meetings, Progress Notifications)
- Notifications marked as "seen" (does NOT modify recipient read status)
- Badge count shows unseen notifications
- Separate tracking via `tbl_notification_admin_views`

### System Logs (`/SuperAdminSection/Logs`)

- View all system activities (Login, Logout, User Creation, User Updates, Archiving)
- Filter logs by user, action type, date range
- Track who did what and when

### Archive Section (`/SuperAdminSection/Archive`)

- View archived users
- Restore archived users (set back to Active)
- Permanently delete archived users

### Profile Management (`/SuperAdminSection/ViewOwnUser`)

- View own profile
- Edit profile information
- Upload/change profile photo
- Change password (requires OTP verification)

---

## 2. ADMIN User Flow

### Login Process

- Admin logs in using **email and password**
- Must solve **addition captcha**
- On successful login, redirects to Admin Dashboard

### Dashboard Features

- Same as Super Admin:
- View Active Admin, Teachers, Parents, Students counts
- View Upcoming Meetings
- View Progress Data by quarters

### Users Management (`/AdminSection/Users`)

- **Same capabilities as Super Admin**:
- Add Users (Admin, Teacher, Parent)
- View/Edit/Archive Users
- Link/Unlink Parent to Student
- Assign Classes
- View Student Progress

### Communication/Messaging (`/AdminSection/Message`)

- Same as Super Admin (access to all conversations and groups)

### Meeting Management (`/AdminSection/Calendar`)

- Same as Super Admin (create, view, edit, cancel meetings)

### Schedule Management (`/AdminSection/Schedule`)

- View schedules for all levels

### Reports (`/AdminSection/Report`)

- Same report types as Super Admin:
- Attendance Report
- Progress Report
- Subject Report
- Download as PDF

### Notifications, Logs, Archive, Profile

- Same features as Super Admin

**Note**: Admin and Super Admin have identical features/permissions in this system.

---

## 3. TEACHER User Flow

### Login Process

- Teacher logs in using **email and password**
- Must solve **addition captcha**
- On successful login, redirects to Teacher Dashboard

### Dashboard Features

- View **My Students count** (students in assigned advisory)
- View **My Classes** (assigned as Lead Teacher or Assistant Teacher)
- View **Upcoming Meetings** (meetings teacher is invited to)
- View **Recent Assessments** (recent student ratings)
- View **Attendance Summary**

### Students Management (`/TeacherSection/Students`)

- **View Students**: See all students in assigned advisory classes
- **Student Assessment** (`/StudentAssessment`):
- Rate student performance using shapes (❤️⭐🔷▲🟡)
- View student's quarterly progress
- View student's attendance history
- View behavioral patterns
- **Student Status** (`/StudentStatus`):
- View current risk level (At Risk, Need Attention, On Track)
- View milestone achievements
- View quarterly performance trends
- **Download Student Reports**: Generate PDF reports for students

### Assessment/Rating (`/TeacherSection/Assessment`)

- **Create Activities**: 
- Add assessment activities for specific quarters (Q1-Q4)
- Set activity descriptions
- Select student level (Discoverer, Explorer, Adventurer)
- **Rate Students**:
- Select activity and quarter
- Choose students (filtered by Morning/Afternoon session)
- Assign shapes to each student:
 - ❤️ **Heart** = Excellent
 - ⭐ **Star** = Very Good
 - 🔷 **Diamond** = Good
 - ▲ **Triangle** = Need Help
 - 🟡 **Circle** = Not Met
- System auto-saves ratings
- Can edit/update ratings later
- **View Activity History**: See all past assessments
- **Edit Activities**: Update activity descriptions

### Attendance Management (`/TeacherSection/Attendance`)

- **Mark Attendance**:
- Select date (with validation for future dates)
- Choose session (Morning/Afternoon)
- Mark students as Present ✓ or Absent ✗
- System filters students by session
- **View Attendance History**: 
- See past attendance records
- Edit previous attendance if needed
- **Attendance Statistics**: View attendance rates per student

### Calendar/Meetings (`/TeacherSection/Calendar`)

- **View Meetings**: See meetings teacher is invited to
- **View One-on-One Meetings**: Meetings with parents about specific students
- **Meeting Details**: View agenda, participants, time
- **Notifications**: Receive meeting reminders (48 hours before)
- **Mark as Read**: Mark meeting notifications as read

### Communication/Messaging (`/TeacherSection/Message`)

- **Direct Messages**:
- Message other Teachers
- Message Parents (of students in their advisory)
- Message Admins/Super Admins
- **Group Messages**:
- Access to: Overall group, Staff group
- Access to: Class-specific groups (only their advisory classes)
- Cannot see groups for other advisories
- **Message Features**: Send, edit, unsend, archive conversations

### Notifications

- View notifications for:
- General meetings (from tbl_notification_recipients)
- One-on-one meetings (role-based: lead_is_read, assistant_is_read)
- Progress notifications (when students achieve milestones)
- Mark notifications as read
- Badge count shows unread notifications

### Profile Management (`/TeacherSection/ViewOwnUser`)

- View own profile
- Edit profile information
- Change profile photo
- Change password (requires OTP)

---

## 4. PARENT User Flow

### Login Process

- Parent logs in using **email and password**
- Must solve **addition captcha**
- On successful login, redirects to Parent Dashboard

### Dashboard Features

- View **Total Children** count
- View **Active Students** count (children currently enrolled)
- View **Children at Risk** count and details
- View **Upcoming Meetings** (meetings scheduled with teachers)
- View **Quarterly Progress Chart** (performance trends for each child across Q1-Q4)
- Toggle visibility of each child's progress line in chart

### My Children / Student Details (`/ParentSection/StudentDetails`)

- **View Student Profile**:
- Student's full name, birthdate, enrollment date
- Student's level (Discoverer, Explorer, Adventurer)
- Student's class schedule (Morning/Afternoon)
- Student's handedness (Left/Right)
- Student photo
- **View Advisory Information**:
- Class name
- Lead Teacher and Assistant Teacher names
- Class schedule
- **Cannot Edit**: Parents can only VIEW student information, not edit

### Report Card / Student Progress (`/ParentSection/ReportCard`)

- **Select Child**: Choose which child to view (if multiple children)
- **Assessment Tab**:
- View quarterly performance (Q1, Q2, Q3, Q4)
- See performance by subject areas
- View visual feedback ratings (shapes)
- View attendance percentage
- View quarterly feedback comments
- View final subject progress
- **Status Tab** (if progress data exists):
- View overall risk level
- View milestone summary
- View quarterly performance trends
- View overall progress summary
- **Download Report Card**: Export child's report as PDF

### Schedule View (`/ParentSection/Schedule`)

- **View Child's Class Schedule**:
- See weekly schedule (Monday-Friday)
- View subjects and routines
- See time blocks
- Schedule is based on child's assigned level/advisory

### Communication/Messaging (`/ParentSection/Message`)

- **Direct Messages**:
- Message Teachers (of their children)
- Message Admins/Super Admins
- View message history
- **Group Messages**:
- Access to: Overall group
- Access to: Class-specific groups (only groups for their children's advisories)
- Cannot access Staff group
- **Message Features**: Send, edit, unsend messages

### Calendar/Meetings (`/ParentSection/Calendar`)

- **View Meetings**: See meetings scheduled for parent
- **One-on-One Meetings**: Meetings with teachers about their children
- **Meeting Notifications**: Receive meeting invitations and reminders
- **Mark as Read**: Mark meeting notifications as read

### Parent Profile (`/ParentSection/ParentDetails`)

- **View Own Profile**:
- Full name, birthdate, email, contact number
- Address (Barangay, City/Municipality, Province, Country)
- Profile photo
- **Edit Profile**: Update personal information
- **Change Profile Photo**: Upload new photo
- **Change Password**: Requires OTP verification

### Notifications

- View notifications for:
- General meetings
- One-on-one meetings with teachers (parent_is_read flag)
- Progress notifications for their children
- Mark notifications as read
- Badge count shows unread notifications

---

## Common Features Across All Roles

### Password Management

- **First Login**: If user is new (is_new = 'Yes'), must change password
- **Change Password Flow**:

1. Request password change
2. System sends OTP to email
3. Verify OTP
4. Enter new password (must meet requirements: uppercase, lowercase, number, special char, 8+ chars)
5. Confirm new password
6. System updates password and sets is_new = 'No'

### Forgot Password

- Enter email address
- Solve captcha
- System sends OTP
- Verify OTP
- Enter new password
- Password reset successful

### Logout

- Click logout button
- System clears local storage
- Redirects to login page
- System logs the logout action

### Profile Photo Management

- All users can upload/change profile photos
- Photos stored in `backend/Uploads/`
- Supported formats: JPG, PNG, JPEG
- System automatically normalizes photo URLs

### Real-Time Features

- **Messaging**: Real-time message delivery using SSE (Server-Sent Events)
- **Notifications**: Real-time notification updates
- **Unread Counts**: Auto-updates when new messages/notifications arrive

---

## Summary of Key Differences

| Feature | Super Admin / Admin | Teacher | Parent |
|---------|---------------------|---------|--------|
| **Add/Edit/Archive Users** | ✅ Yes | ❌ No | ❌ No |
| **Link Parent-Student** | ✅ Yes | ❌ No | ❌ No |
| **Create Meetings** | ✅ Yes | ❌ No | ❌ No |
| **Rate Students (Shapes)** | ❌ No | ✅ Yes | ❌ No |
| **Mark Attendance** | ❌ No | ✅ Yes | ❌ No |
| **View All Reports** | ✅ Yes | ✅ Limited (own classes) | ✅ Limited (own children) |
| **Manage Configuration** | ✅ Yes | ❌ No | ❌ No |
| **View System Logs** | ✅ Yes | ❌ No | ❌ No |
| **Group Message Access** | ✅ All groups | ✅ Overall, Staff, Own Classes | ✅ Overall, Children's Classes |
| **View Student Progress** | ✅ All students | ✅ Own advisory students | ✅ Own children only |

---

## Technical Notes

### Database Tables (Key Tables)

- `tbl_users` - All user accounts
- `tbl_roles` - User roles (1=Super Admin, 2=Admin, 3=Teacher, 4=Parent)
- `tbl_students` - Student information
- `tbl_advisory` - Class/advisory information
- `tbl_student_assigned` - Student-to-advisory assignments
- `tbl_meetings` - Meeting schedules
- `tbl_notifications` - Notification system
- `tbl_activities` - Assessment activities
- `tbl_ratings` - Student ratings/assessments
- `tbl_visual_feedback` - Rating shapes (❤️⭐🔷▲🟡)
- `tbl_attendance` - Attendance records
- `tbl_schedule` - Class schedules
- `tbl_system_logs` - System activity logs

### API Endpoints Pattern

- Backend: `backend/[Module]/[action].php`
- Modules: Users, Assessment, Meeting, Communication, Schedule, Notifications, Advisory, Logs
- All endpoints use CORS configuration for cross-origin requests
- Authentication via localStorage (userId, userRole, token)

### Security Features

- Password hashing using `password_verify()`
- OTP verification for password changes
- Captcha on login (addition problem)
- Rate limiting (10 attempts, 5-minute lockout)
- Role-based access control
- Session management

---

## End-to-End Demonstration Scenario (All Roles, Plain Language)

This is a simple story that shows how everyone uses the system and how information moves between them.

### Characters

- Sarah, the Super Admin
- Alex, the Admin
- Tina, the Teacher
- Peter, the Parent
- Sam, the Student (Explorer level)

### 1) Getting ready
Everyone signs in with their email and password and answers a quick addition question to prove they are human. After logging in, each person lands on their own dashboard.

Sarah and Alex first make sure the school year is set up. They check that classes exist for each level and that schedules are in place for the week. If someone new needs an account, they add them (for example, a new teacher or parent).

### 2) Adding Sam and connecting his parent
Alex adds Sam’s student profile. Sarah links Peter to Sam. As soon as they’re linked, the system places Sam into the correct class for his level, and the class counts update automatically.

### 3) Teaching and tracking progress
Tina opens her class list each day. She marks who’s present and who’s absent. When students complete activities, she gives simple, visual ratings (like a heart for Excellent or a triangle for Needs Help). These ratings are saved and become part of Sam’s progress record.

### 4) Setting a meeting and reminders
Sarah schedules a short meeting for Tina and Peter to talk about Sam’s progress. The meeting appears on their calendars, and both get a reminder a couple of days beforehand. When Peter or Tina opens the reminder or meeting details, the system knows they’ve seen it. Sarah can also see that the reminder was shown.

### 5) Parent checks child’s progress
Peter signs in and opens Sam’s report. He can see how Sam is doing each quarter, which shapes Tina has chosen for Sam’s activities, and how often Sam has been present. If Peter has more than one child, he can switch between them easily.

### 6) School‑wide overview and reports
Sarah and Alex open the reporting area to see trends: how classes are doing across the quarters, where students are excelling, and where extra help might be needed. When needed, they download a clean summary to share.

### 7) Messaging that keeps everyone aligned
Peter sends Tina a message asking about a recent activity. Tina replies with a short explanation. If necessary, Sarah can review conversations to keep the community safe. Group messages help share announcements with staff and with parents in the relevant classes.

### 8) Closing a quarter or school year
When a quarter ends, Sarah updates the dates for the next one. At year end, she can archive accounts that are no longer active. If a parent account is archived, the system cleanly disconnects linked students so records remain accurate.

### The big picture
- Admins and Super Admins prepare the environment and support everyone.
- Teachers record attendance and learning progress in a friendly, visual way.
- Parents view their child’s progress, communicate with teachers, and keep track of meetings.
- The school leadership can see trends, generate reports, and keep everything organized.