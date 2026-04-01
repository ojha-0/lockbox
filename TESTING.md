# Testing Lockbox

## Test Credentials (Mock API)

Since the app uses mock authentication by default, you can test with any credentials:

### Citizen Login
- **National ID**: `123456789012` (any 12-digit number)
- **Password**: `password` (any non-empty string)

### Verifier Login
- **Company PAN**: `9999999999999` (any valid PAN format)
- **Password**: `password` (any non-empty string)

## Test User Flows

### 1. Citizen Dashboard
1. Go to `/citizen/login`
2. Enter any 12-digit National ID
3. Enter any password
4. Click "Sign in"
5. You should be redirected to `/citizen/dashboard`

### 2. Access History
1. From the citizen dashboard, click "Access history" 
2. View the mock audit trail showing organizations that accessed your data
3. See biometric scores and approval status

### 3. Manage Consent
1. Click "Manage consent"
2. View organizations and toggle their access permissions
3. Changes are persisted to localStorage

### 4. Verifier Scanning
1. Go to `/verifier/login`
2. Enter company PAN and password
3. Click "Sign in"
4. On the scan page, enter a citizen's National ID (e.g., `123456789012`)
5. Select a verification purpose
6. Click "Verify"
7. View the filtered results with biometric scoring

## Browser DevTools

### LocalStorage
You can inspect the persisted auth session:
```javascript
localStorage.getItem('auth-store')
```

This will show the stored user, accessToken, and refreshToken.

### Network
When using mock API (`NEXT_PUBLIC_USE_MOCK_API=true`), network requests still happen but use local fallbacks without hitting the server.

## Switching to Real Backend

To use a real backend instead of mock API:

1. Update `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=http://your-backend-url:5000/api/v1
```

2. Start your backend server
3. The app will now make real API requests

## Known Limitations (Mock Mode)

- All authentication succeeds (no validation)
- Biometric scores are random
- Audit trails are pre-seeded data
- No real data persistence on backend
- No actual verification logic

## Troubleshooting

### Session Not Persisting
- Check that localStorage is enabled in browser
- Clear localStorage: `localStorage.clear()`

### API Errors
- Mock API should automatically kick in for auth endpoints
- Check `.env.local` for `NEXT_PUBLIC_USE_MOCK_API=true`

### Page Not Rendering
- Ensure you're logged in (check localStorage for auth-store)
- Try clearing browser cache and localStorage
- Restart the dev server: `pnpm dev`

## Performance Testing

The app includes:
- Framer Motion animations (smooth transitions)
- Responsive design (test with mobile viewport)
- Dark/Light mode support (check system preferences)

Test responsive behavior:
```javascript
// In browser console
window.innerWidth  // Should adapt to mobile, tablet, desktop
```
