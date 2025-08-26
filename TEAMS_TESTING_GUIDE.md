# Teams Module Role-Based Access Control Guide

## 🔐 Authentication Required

The Teams module requires user authentication to function properly. Direct API calls will return:
```json
{
  "code": 209,
  "error": "User is not authenticated."
}
```

This is expected and secure behavior.

## 🧪 How to Test Role-Based Access Control

### Step 1: Login to the Application
1. Navigate to: http://localhost:3000/auth/login
2. Login with your OpenSign credentials
3. Ensure you're authenticated

### Step 2: Access Teams Module
1. Navigate to: http://localhost:3000/team
2. The page will automatically detect your role
3. UI will adapt based on your permissions

### Step 3: Test Role-Based Features

#### 🔍 For Testing User Roles:

**Admin User Testing:**
- ✅ Should see "Add Team Member" button
- ✅ Can click button to open modal
- ✅ In modal: Can select User, Manager, and Admin roles
- ✅ Can successfully create team members

**Manager User Testing:**
- ✅ Should see "Add Team Member" button  
- ✅ Can click button to open modal
- ⚠️ In modal: Can only select User role (Manager/Admin hidden)
- ✅ Can create team members with User role only

**Regular User Testing:**
- ❌ "Add Team Member" button should be completely hidden
- ✅ Can view existing team members
- ✅ Can use search and filter functionality
- ❌ Cannot add new team members

## 🎭 Role Detection Logic

The system uses these role mappings:
- `UserRole: "Admin"` → Full access
- `UserRole: "Manager"` → Limited role assignment
- `UserRole: "User"` → View-only access
- `UserRole: undefined/other` → No access (safest default)

## 🧪 Built-in Testing Features

### API Test Button
1. Login to the application
2. Navigate to Teams module
3. Click "🧪 Test API" button
4. Check browser console for detailed API test results
5. This will show your current role and permissions

### Console Debugging
When on the Teams page, open browser developer tools and check:
```javascript
// This will show current user role detection
console.log('Current user role:', currentUserRole)
```

## 🚀 Expected Behavior by Role

### Admin Role
```
✅ Add Team Member button visible
✅ Can assign: User, Manager, Admin roles  
✅ Full Teams module access
```

### Manager Role  
```
✅ Add Team Member button visible
⚠️ Can assign: User role only
✅ Limited Teams module access
```

### User Role
```
❌ Add Team Member button hidden
❌ Cannot add team members
✅ Can view team members
```

### No Role / Unauthenticated
```
❌ Add Team Member button hidden
❌ Cannot access Teams features
❌ Redirected to login if needed
```

## 🔧 Implementation Details

The role-based access control is implemented at multiple levels:

1. **UI Level**: Conditional rendering based on user role
2. **Component Level**: Form validation and button states
3. **API Level**: Backend permission checks
4. **Graceful Degradation**: Safe defaults when role is unavailable

## 🎯 Testing Checklist

- [ ] Login works correctly
- [ ] Teams page loads without errors
- [ ] Role detection works (check "🧪 Test API" button)
- [ ] Add Team Member button shows/hides based on role
- [ ] Role dropdown filters correctly in modal
- [ ] Form submission validates permissions
- [ ] Users see appropriate error messages for unauthorized actions

## 🔍 Troubleshooting

**Issue**: "User is not authenticated" error
**Solution**: Login through the web interface at /auth/login

**Issue**: API returns HTML instead of JSON (500 error)
**Solution**: This indicates a build/compilation issue. Fix with:
```bash
# Clear Next.js cache and restart
cd /Users/medelkouch/Projects/orbit/e-signature
rm -rf .next
npm run dev
```

**Issue**: Add Team Member button not showing for Admin
**Solution**: Check browser console for role detection, verify authentication

**Issue**: Role options not filtering correctly  
**Solution**: Verify user role is being fetched correctly via "🧪 Test API" button

**Issue**: Organization setup errors
**Solution**: These have been removed per requirements - system now works without organization setup

**Issue**: Direct API testing fails
**Solution**: Use the web interface for testing. The "🧪 Test API" button provides comprehensive testing within the authenticated session.

## ✅ Recommended Testing Approach

Instead of testing APIs directly via curl/scripts, use the built-in testing features:

1. **Login**: Go to http://localhost:3000/auth/login
2. **Navigate**: Go to http://localhost:3000/team  
3. **Test**: Click "🧪 Test API" button
4. **Inspect**: Open browser console to see detailed results
5. **Verify**: Check that role-based UI elements appear correctly

This approach tests the full authentication flow and role-based access control as users would experience it.
