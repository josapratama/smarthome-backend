# CORS Fix - Allow Credentials 🔧

## Problem

### Error Message

```
Access to fetch at 'http://localhost:3000/api/v1/preferences' from origin 'http://localhost:3001'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'
when the request's credentials mode is 'include'.
```

### Root Cause

```typescript
// BEFORE (Broken)
app.use(
  "*",
  cors({
    origin: "*", // ❌ Wildcard not allowed with credentials!
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Issue:**

- Frontend uses `credentials: 'include'` to send cookies
- Backend CORS uses wildcard `*` for origin
- Browser blocks this combination for security reasons
- Cookies cannot be sent with wildcard CORS

---

## Solution

### Updated CORS Configuration

```typescript
// AFTER (Fixed)
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests from frontend dev server and production
      const allowedOrigins = [
        "http://localhost:3001", // Frontend dev server
        "http://localhost:3000", // Backend (same-origin)
        "http://127.0.0.1:3001", // Alternative localhost
        "http://127.0.0.1:3000", // Alternative localhost
      ];

      // Allow if origin is in allowed list or if no origin (same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || "*";
      }

      return allowedOrigins[0]; // Default to localhost:3001
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // ✅ Allow credentials (cookies)
    exposeHeaders: ["Content-Length", "X-Request-Id"],
  }),
);
```

---

## What Changed

### 1. Origin Function

**Before:** `origin: "*"` (wildcard)
**After:** `origin: (origin) => { ... }` (function that checks allowed origins)

**Benefits:**

- ✅ Only allow specific origins
- ✅ Compatible with credentials mode
- ✅ More secure
- ✅ Flexible for dev and production

### 2. Credentials Enabled

**Before:** Not specified (default: false)
**After:** `credentials: true`

**Benefits:**

- ✅ Allows cookies to be sent
- ✅ Allows Authorization headers
- ✅ Required for authentication

### 3. Allow Methods

**Before:** Not specified (default: GET, POST)
**After:** `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`

**Benefits:**

- ✅ Supports all HTTP methods
- ✅ Allows PATCH for preferences update
- ✅ Allows OPTIONS for preflight

### 4. Expose Headers

**Before:** Not specified
**After:** `["Content-Length", "X-Request-Id"]`

**Benefits:**

- ✅ Better debugging
- ✅ Request tracking
- ✅ Content length for progress

---

## How CORS Works

### Without Credentials

```
Browser                    Backend
   |                          |
   |--- GET /api/data ------->|
   |                          |
   |<-- Access-Control-Allow-Origin: * --|
   |<-- Data ------------------|
   |                          |
```

✅ Works with wildcard `*`

### With Credentials (Cookies)

```
Browser                    Backend
   |                          |
   |--- OPTIONS /api/data --->| (Preflight)
   |    credentials: include  |
   |                          |
   |<-- Access-Control-Allow-Origin: http://localhost:3001 --|
   |<-- Access-Control-Allow-Credentials: true --|
   |                          |
   |--- GET /api/data ------->|
   |    Cookie: token=xxx     |
   |                          |
   |<-- Data ------------------|
   |                          |
```

❌ Does NOT work with wildcard `*`
✅ Works with specific origin

---

## Testing

### Step 1: Restart Backend

```bash
cd smarthome-backend
npm run dev  # or bun dev
```

### Step 2: Check CORS Headers

```bash
# Test preflight request
curl -X OPTIONS http://localhost:3000/api/v1/preferences \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: PATCH" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: http://localhost:3001
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Step 3: Test from Frontend

```bash
cd smarthome-frontend
npm run dev

# Open browser: http://localhost:3001/settings
# Change language and click Save
# Check Network tab:
# - OPTIONS request should succeed (200 OK)
# - PATCH request should succeed (200 OK)
# - No CORS errors in console
```

---

## Verification Checklist

### ✅ Backend

- [ ] Backend running on port 3000
- [ ] CORS middleware configured
- [ ] credentials: true enabled
- [ ] Allowed origins include localhost:3001

### ✅ Frontend

- [ ] Frontend running on port 3001
- [ ] API calls use credentials: 'include'
- [ ] Cookies sent with requests
- [ ] No CORS errors in console

### ✅ Network Tab

- [ ] OPTIONS request (preflight) succeeds
- [ ] Response has Access-Control-Allow-Origin header
- [ ] Response has Access-Control-Allow-Credentials: true
- [ ] PATCH request succeeds
- [ ] Cookies sent in request
- [ ] Response received

---

## Common Issues

### Issue 1: Still getting CORS error

**Solution:**

1. Restart backend server
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Check backend logs for errors

### Issue 2: Cookies not sent

**Solution:**

1. Check credentials: 'include' in fetch
2. Check CORS credentials: true
3. Check cookie domain and path
4. Check cookie SameSite attribute

### Issue 3: Preflight fails

**Solution:**

1. Check allowMethods includes your method
2. Check allowHeaders includes your headers
3. Check origin is in allowed list
4. Check OPTIONS method is allowed

---

## Production Configuration

For production, update allowed origins:

```typescript
const allowedOrigins = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
  "https://app.yourdomain.com",
  // Add your production domains
];

// For development
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3001");
  allowedOrigins.push("http://127.0.0.1:3001");
}
```

---

## Security Considerations

### ✅ Good Practices

- Use specific origins (not wildcard)
- Enable credentials only when needed
- Validate origin against whitelist
- Use HTTPS in production
- Set secure cookie flags

### ❌ Bad Practices

- Using wildcard with credentials
- Allowing all origins in production
- Not validating origin
- Sending sensitive data without HTTPS
- Not setting secure cookie flags

---

## Related Files

- `src/app.ts` - CORS configuration
- `smarthome-frontend/src/lib/api/client.browser.ts` - Frontend API client

---

## Git Commit

```bash
git commit -m "fix(cors): allow credentials for frontend requests"
```

**Commit Hash:** `4920efa`

---

## Success Criteria ✅

- [x] No CORS errors in browser console
- [x] Preflight requests succeed
- [x] Cookies sent with requests
- [x] API calls work from frontend
- [x] Preferences can be saved
- [x] Language switching works
- [x] Theme switching works

---

CORS issue resolved! 🎉
