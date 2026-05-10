import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BlurBackground } from './components/layout/BlurBackground';
import { Loader2 } from 'lucide-react';

/* ── Lazy-loaded pages — each becomes its own JS chunk ── */
const Landing        = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const HowItWorks     = lazy(() => import('./pages/HowItWorks').then(m => ({ default: m.HowItWorks })));
const AuthPage       = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const OTPVerify      = lazy(() => import('./pages/OTPVerify').then(m => ({ default: m.OTPVerify })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Dashboard      = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const InterviewSetup = lazy(() => import('./pages/InterviewSetup').then(m => ({ default: m.InterviewSetup })));
const Interview      = lazy(() => import('./pages/Interview').then(m => ({ default: m.Interview })));
const Results        = lazy(() => import('./pages/Results').then(m => ({ default: m.Results })));
const AICoach        = lazy(() => import('./pages/AICoach').then(m => ({ default: m.AICoach })));
const Roadmap        = lazy(() => import('./pages/Roadmap').then(m => ({ default: m.Roadmap })));
const Settings       = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

/* ── Minimal full-page spinner shown while a lazy chunk loads ── */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes
          location={location}
          key={['/login', '/signup', '/forgot-password', '/verify'].includes(location.pathname) ? 'auth' : location.pathname}
        >
          {/* Public */}
          <Route path="/"                element={<Landing />} />
          <Route path="/how-it-works"    element={<HowItWorks />} />
          <Route path="/login"           element={<AuthPage />} />
          <Route path="/signup"          element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify"          element={<OTPVerify />} />

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
    </Suspense>
  );
};

const AppRoot = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isLandingPage = pathname === '/';
  const showSidebar = isAuthenticated && !isLandingPage && pathname !== '/interview';

  return (
    <>
      {!isLandingPage && <BlurBackground />}
      {!isLandingPage && <Navbar />}

      {showSidebar && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      )}

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
