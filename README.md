# CraveSense

CraveSense is a full-stack craving tracker with three connected surfaces:

- A Node.js + Express backend with MongoDB, JWT auth, Gemini coaching, nutrition lookup, and web push support
- A React + Vite dashboard for food logging, pattern analysis, and danger-zone visibility
- A Chrome extension for in-the-moment craving intervention

## Project Structure

```text
backend/   Express API, MongoDB models, Gemini services, push notifications
frontend/  React dashboard built with Vite and Tailwind CSS
extension/ Chrome extension popup flow and background badge logic
```

## 1. Backend Setup

1. Go to `D:\Projects\CraveSense\backend`.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in all values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GEMINI_API_KEY=your_gemini_api_key_from_aistudio_google_com
API_NINJAS_KEY=your_api_ninjas_key_here
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=mailto:you@email.com
CLIENT_URL=http://localhost:5173
```

4. Start the API:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`.

## 2. Frontend Setup

1. Go to `D:\Projects\CraveSense\frontend`.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file if you want custom endpoints:

```env
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

4. Start the dashboard:

```bash
npm run dev
```

The dashboard will run on `http://localhost:5173`.

## 3. Chrome Extension Setup

1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `D:\Projects\CraveSense\extension`.
5. Pin the extension to the toolbar for quick access.

The popup expects:

- The backend to be running at `http://localhost:5000`
- The dashboard to be running at `http://localhost:5173`
- A logged-in CraveSense session in the same browser for cloud sync

If the backend is unavailable or the session is missing, the extension still stores logs locally and syncs them later.

## Backend Highlights

- JWT access tokens with refresh tokens stored in HttpOnly cookies
- Daily calorie reset logic on authenticated requests
- MongoDB aggregation-based pattern analysis plus cached Gemini insight text
- API Ninjas nutrition lookup with Gemini estimation fallback
- Web push subscriptions and hourly danger-zone notifications

## Frontend Highlights

- Landing, login, register, and protected dashboard routes
- Auto-refreshing axios client with JWT retry flow
- Food logger, macro rings, craving heatmap, AI pattern card, and weekly progress view
- Push notification registration through the browser service worker

## Extension Highlights

- Five-screen craving flow
- Countdown challenge timer
- Offline log queue with background badge count
- Smart food suggestion flow plus manual give-in logging

## Suggested Run Order

1. Start the backend.
2. Start the frontend.
3. Open the dashboard and create an account.
4. Load the Chrome extension.
5. Use the extension while the dashboard is open in the same browser profile.
