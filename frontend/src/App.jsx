import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { createApiClient } from './api/axios';
import AppHeader from './components/AppHeader';
import Dashboard from './pages/Dashboard';
import FoodLogPage from './pages/FoodLogPage';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Settings from './pages/Settings';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel w-full max-w-md p-10 text-center">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
        <h1 className="font-display text-2xl font-semibold">Loading CraveSense</h1>
        <p className="mt-3 copy-muted">Checking your session and preparing your dashboard.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ProtectedAppShell({ user, loading, onLogout }) {
  return (
    <ProtectedRoute user={user} loading={loading}>
      <div className="min-h-screen font-body text-white">
        <AppHeader user={user} onLogout={onLogout} />
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => accessTokenRef.current,
        setAccessToken: (token) => {
          accessTokenRef.current = token;
          setAccessToken(token);
        },
        onUnauthenticated: () => {
          accessTokenRef.current = null;
          setAccessToken(null);
          setUser(null);
        }
      }),
    []
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        accessTokenRef.current = data.accessToken;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch (error) {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, [api]);

  const handleAuthSuccess = (payload) => {
    accessTokenRef.current = payload.accessToken;
    setAccessToken(payload.accessToken);
    setUser(payload.user);
  };

  const handleUserUpdate = (nextUserOrUpdater) => {
    setUser((currentUser) =>
      typeof nextUserOrUpdater === 'function' ? nextUserOrUpdater(currentUser) : nextUserOrUpdater
    );
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed, clearing local session anyway.');
    } finally {
      accessTokenRef.current = null;
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen font-body text-white">
      <Routes>
        <Route path="/" element={<Landing user={user} />} />
        <Route
          path="/login"
          element={
            bootstrapping ? (
              <LoadingScreen />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login api={api} onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            bootstrapping ? (
              <LoadingScreen />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register api={api} onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route element={<ProtectedAppShell user={user} loading={bootstrapping} onLogout={handleLogout} />}>
          <Route
            path="/dashboard"
            element={<Dashboard api={api} user={user} onUserUpdate={handleUserUpdate} />}
          />
          <Route path="/profile" element={<Profile api={api} user={user} />} />
          <Route
            path="/food-log"
            element={<FoodLogPage api={api} user={user} onUserUpdate={handleUserUpdate} />}
          />
          <Route
            path="/settings"
            element={<Settings api={api} user={user} onUserUpdate={handleUserUpdate} />}
          />
        </Route>
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center px-6">
              <div className="panel max-w-lg p-10 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-brand">404</p>
                <h1 className="mt-4 font-display text-3xl font-semibold">This page is off the menu.</h1>
                <p className="mt-3 copy-muted">
                  The route you asked for does not exist. Head back and keep building your streak.
                </p>
                <Link to="/" className="primary-btn mt-6">
                  Go Home
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
