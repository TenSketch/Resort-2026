# Authentication Token Validation Fix

## Problem
When users closed the browser and returned later, the app would:
1. Load the protected page (because token exists in localStorage)
2. Fail on form submission with "no auth token" error
3. Require logout and login to work again

## Root Cause
The `AdminProvider` was only checking if a token **exists** in localStorage, not if it's **valid**. When the token expired or became invalid, the app still thought the user was authenticated.

## Solution

### 1. Token Validation on App Load
Updated `AdminProvider.tsx` to verify the token with the backend when the app loads:

```typescript
// Now validates token with backend
const res = await fetch(`${apiBase}/api/admin/me`, {
  headers: { 'Authorization': `Bearer ${token}` }
})

if (!res.ok) {
  // Token invalid - clear it and logout
  localStorage.removeItem('admin_token')
  setAdmin(null)
  return
}
```

If `/api/admin/me` endpoint doesn't exist, it falls back to testing with `/api/resorts` endpoint.

### 2. Auto-Logout on Auth Errors
Created `admin/src/lib/apiUtils.ts` with utilities for handling auth errors:

```typescript
import { fetchWithAuth, handleAuthError } from '@/lib/apiUtils'

// Use this instead of fetch for authenticated requests
const response = await fetchWithAuth('/api/resorts/add', {
  method: 'POST',
  body: formData
})
```

This automatically:
- Adds the Authorization header
- Detects 401/403 errors
- Clears the invalid token
- Redirects to login page

### 3. Migration Guide

To update your existing components, replace this pattern:

**OLD:**
```typescript
const token = localStorage.getItem('admin_token')
const headers: Record<string, string> = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: data
})
```

**NEW:**
```typescript
import { fetchWithAuth } from '@/lib/apiUtils'

fetchWithAuth('/api/endpoint', {
  method: 'POST',
  body: data
})
```

### 4. Files Updated
- ✅ `admin/src/lib/AdminProvider.tsx` - Token validation on load
- ✅ `admin/src/lib/apiUtils.ts` - New auth utilities
- ✅ `admin/src/components/resorts/ResortFormComp.tsx` - Example migration

### 5. Recommended: Update All API Calls
For best results, update all components that make authenticated API calls to use `fetchWithAuth`. This ensures consistent auth error handling across the app.

Files that need updating (search for `Authorization.*Bearer`):
- All components in `admin/src/components/`
- Focus on form submission handlers

### 6. Backend Requirement (Optional)
For better validation, create a `/api/admin/me` endpoint that returns the current admin user:

```javascript
router.get('/api/admin/me', authMiddleware, (req, res) => {
  res.json({ admin: req.user })
})
```

If this endpoint doesn't exist, the app will fall back to testing with `/api/resorts`.

## Testing
1. Login to the app
2. Close the browser completely
3. Wait for token to expire (or manually edit it in localStorage to make it invalid)
4. Open the app again
5. Try to submit a form
6. Should automatically redirect to login instead of showing "no auth token" error

## Benefits
- ✅ Invalid tokens are detected immediately on app load
- ✅ Users are automatically logged out when token expires
- ✅ No more confusing "no auth token" errors on form submission
- ✅ Consistent auth error handling across the app
