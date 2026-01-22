# Login Authentication Fix Guide

## What Was Fixed

### 1. **Docker Network Configuration**
- Added `API_URL=http://backend:8000/api` environment variable for server-side API calls
- Frontend container now uses Docker network name `backend` instead of `localhost`

### 2. **Authentication Logic** (`frontend/src/lib/auth.ts`)
- Uses `API_URL` for server-side requests (Docker network)
- Falls back to `NEXT_PUBLIC_API_URL` for client-side requests
- Added detailed console logging for debugging
- Improved error handling

### 3. **Enhanced Login Page** (`frontend/src/app/login/page.tsx`)
- Beautiful gradient background with animated blobs
- Modern card design with shadows
- Error display with AlertCircle icon
- Loading spinner animation
- Disabled inputs during loading
- Demo credentials display
- Better UX with validation

## How to Test

### Step 1: Restart Frontend Container

The frontend needs to restart to pick up the new environment variable:

```bash
docker compose restart frontend
```

Or rebuild everything:

```bash
docker compose down
docker compose up --build
```

### Step 2: Access the Login Page

Open your browser:
```
http://localhost:3000
```

### Step 3: Login

Use the demo credentials displayed on the page:
- **Username:** `admin`
- **Password:** `admin123`

### Step 4: Check Browser Console

Open DevTools (F12) and check the Console tab. You should see:
```
Attempting login to: http://backend:8000/api/token/
Tokens received, fetching user info...
User authenticated: admin
Login result: {ok: true, ...}
```

### Step 5: Verify Dashboard

After successful login, you should be redirected to:
```
http://localhost:3000/dashboard
```

## Troubleshooting

### Issue: Still getting 401 Unauthorized

**Solution 1:** Make sure backend is running
```bash
docker compose ps
```

All containers should show "Up" status.

**Solution 2:** Check backend logs
```bash
docker compose logs backend
```

Look for any errors.

**Solution 3:** Restart both containers
```bash
docker compose restart backend frontend
```

### Issue: "Unable to connect to the server"

**Check 1:** Backend is accessible from frontend
```bash
docker compose exec frontend ping backend
```

Should show successful pings.

**Check 2:** Backend API is responding
```bash
curl http://localhost:8000/api/token/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return JWT tokens.

### Issue: Frontend shows blank page

**Solution:** Clear browser cache and reload
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Issue: TypeScript errors in IDE

These are expected! The npm packages aren't installed locally. The errors will disappear once you run:
```bash
cd frontend
npm install
```

But for Docker, they're already installed in the container.

## API Endpoints Being Used

### 1. Token Endpoint
```
POST http://backend:8000/api/token/
Body: {"username": "admin", "password": "admin123"}
Response: {"access": "...", "refresh": "..."}
```

### 2. User Info Endpoint
```
GET http://backend:8000/api/users/me/
Headers: Authorization: Bearer <access_token>
Response: {"id": 1, "username": "admin", "role": "ADMIN", ...}
```

## Environment Variables

### Frontend Container
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api  # Client-side (browser)
API_URL=http://backend:8000/api                # Server-side (Docker network)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Backend Container
```env
DJANGO_SECRET_KEY=your-secret-key
DB_HOST=db
DB_PORT=5432
CELERY_BROKER_URL=redis://redis:6379/0
```

## Next Steps After Login Works

1. ✅ Generate sample data:
   ```bash
   docker compose exec backend python manage.py generate_sample_data
   ```

2. ✅ Browse the frontend pages:
   - Dashboard
   - Job Orders
   - Equipment
   - Clients
   - Inspections
   - Certificates

3. ✅ Test different user roles:
   - Login as inspector: `inspector1` / `inspector123`
   - Login as manager: `manager1` / `manager123`
   - Login as client: `client1` / `client123`

4. ✅ Create new records via the UI

5. ✅ Test API directly:
   ```bash
   # Get token
   TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' | jq -r '.access')
   
   # List job orders
   curl http://localhost:8000/api/job-orders/ \
     -H "Authorization: Bearer $TOKEN"
   ```

## Login Page Features

### Visual Design
- ✨ Gradient background (blue to indigo)
- ✨ Animated blob decorations
- ✨ Modern card with shadow
- ✨ Gradient icon background
- ✨ Smooth transitions and hover effects

### UX Features
- ✅ Form validation
- ✅ Error messages with icons
- ✅ Loading states
- ✅ Disabled inputs during submission
- ✅ Demo credentials display
- ✅ Responsive design

### Security
- ✅ JWT token-based authentication
- ✅ Secure password input
- ✅ CSRF protection via NextAuth
- ✅ HTTP-only cookies for tokens

---

**Happy Testing!** 🎉

If you still face issues, check:
1. Docker containers are running
2. Backend migrations are applied
3. Admin user exists
4. Browser console for detailed errors
