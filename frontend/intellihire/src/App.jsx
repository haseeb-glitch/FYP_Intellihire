import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BlurBackground } from './components/layout/BlurBackground';

// Pages
import { Landing }        from './pages/Landing';
import { HowItWorks }     from './pages/HowItWorks';
import { AuthPage }       from './pages/AuthPage';
import { OTPVerify }      from './pages/OTPVerify';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard }      from './pages/Dashboard';
import { InterviewSetup } from './pages/InterviewSetup';
import { Interview }      from './pages/Interview';
import { Results }        from './pages/Results';
import { AICoach }        from './pages/AICoach';
import { Roadmap }        from './pages/Roadmap';
import { Settings }       from './pages/Settings';
import { Pricing }        from './pages/Pricing';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={['/login', '/signup', '/forgot-password', '/verify'].includes(location.pathname) ? 'auth' : location.pathname}>
        {/* Public */}
        <Route path="/"            element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login"       element={<AuthPage />} />
        <Route path="/signup"      element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify"      element={<OTPVerify />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/setup"     element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/results"   element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/ai-coach"  element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
        <Route path="/roadmap"   element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────
   AppRoot — lives inside Router + AuthProvider, manages
   sidebar state and applies layout offsets.
───────────────────────────────────────────────────────── */
const AppRoot = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isLandingPage = pathname === '/';
  // Sidebar only for authenticated users, not on landing or interview pages
  const showSidebar = isAuthenticated && !isLandingPage && pathname !== '/interview';

  return (
    <>
      {!isLandingPage && <BlurBackground />}
      {!isLandingPage && <Navbar />}

      {showSidebar && (
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
      )}

      {/* Content area — offset for fixed navbar + sidebar at lg breakpoint */}
      <div
        className={[
          'transition-[padding] duration-280 ease-in-out',
          !isLandingPage ? 'pt-16' : '',
          showSidebar && !collapsed ? 'lg:pl-[220px]' : '',
          showSidebar && collapsed ? 'lg:pl-16' : '',
        ].filter(Boolean).join(' ')}
      >
        <AnimatedRoutes />
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoot />
      </Router>
    </AuthProvider>
  );
}

export default App;
