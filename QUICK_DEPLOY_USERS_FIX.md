# Quick Deploy Guide - Users CORS Fix

## What Was Fixed
Fixed CORS errors preventing the SuperAdmin Users page from loading by updating 19 PHP files to support production domains.

## Files to Upload to Namecheap

### ⚠️ IMPORTANT: Upload ALL these files to `/public_html/backend-ville/Users/`

```
backend-ville/Users/
  ├── cors_config.php                      ⭐ NEW FILE (Required!)
  ├── get_all_users.php
  ├── get_user_details.php
  ├── get_user_profile.php
  ├── get_user_names.php
  ├── get_student_names.php
  ├── add_user.php
  ├── update_user.php
  ├── add_student.php
  ├── update_student.php
  ├── archive_user.php
  ├── get_archived_users.php
  ├── get_student_details.php
  ├── get_parent_students.php
  ├── link_student_to_parent.php
  ├── unlink_student_from_parent.php
  ├── get_parent_children_progress.php
  ├── get_parent_children_risk.php
  ├── upload_photo.php
  └── get_user_counts.php
```

## Quick Upload Steps

### Option 1: Using cPanel File Manager (Recommended)

1. **Login to cPanel** → File Manager
2. **Navigate** to `public_html/backend-ville/Users/`
3. **Delete old files** (backup first if needed)
4. **Upload** all files from your local `backend-ville/Users/` folder
5. **Verify** `cors_config.php` is present
6. **Set permissions**: 644 for all PHP files

### Option 2: Using FTP Client (FileZilla)

1. **Connect** to your hosting via FTP
2. **Navigate** to `/public_html/backend-ville/Users/`
3. **Upload** all files from `C:\xampp\htdocs\capstone-project\backend-ville\Users\`
4. **Overwrite** existing files when prompted
5. **Verify** upload completed successfully

### Option 3: Using ZIP Upload

1. **Create ZIP** of the entire `Users` folder
2. **Upload ZIP** to cPanel File Manager
3. **Extract** in `/public_html/backend-ville/Users/`
4. **Verify** all files are present

## Test Immediately After Upload

1. **Visit**: https://learnersville.vercel.app/SuperAdminSection/Users
2. **Press F12** to open browser console
3. **Look for**: No CORS errors
4. **Verify**: User list loads successfully

## Expected Result

✅ Users page loads all users
✅ No CORS errors in console
✅ All user roles display (Admin, Teacher, Parent, Student)
✅ Search and filter work

## If It Still Doesn't Work

### Quick Checks:
1. ✅ Uploaded `cors_config.php`?
2. ✅ All files in correct folder?
3. ✅ Cleared browser cache?
4. ✅ Correct folder: `backend-ville` (not `backend`)?

### Test Endpoints:
```
https://learnersville.online/backend-ville/Users/cors_config.php
https://learnersville.online/backend-ville/Users/get_all_users.php
```

Both should respond (download or show content), not 404.

## Rollback (If Needed)

If something goes wrong, restore from your backup and contact support.

## Next Steps After This Works

1. ✅ Dashboard shows user counts
2. ✅ Users page loads (this fix)
3. 🔄 Other sections may need similar fixes

---

**Need Help?** Check `USERS_CORS_FIX_SUMMARY.md` for detailed troubleshooting.

