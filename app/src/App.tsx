import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Landing Page Components
import NeuralNetworkBackground from './components/three/NeuralNetworkBackground';
import HUD from './components/ui/HUD';
import HeroSection from './sections/HeroSection';
import DigitalWorkforceSection from './sections/DigitalWorkforceSection';
import ServicesSection from './sections/ServicesSection';
import ProcessSection from './sections/ProcessSection';
import AuditSection from './sections/AuditSection';
import ContactSection from './sections/ContactSection';
import Footer from './sections/Footer';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Automations from './pages/dashboard/Automations';
import Tasks from './pages/dashboard/Tasks';
import Integrations from './pages/dashboard/Integrations';
import Security from './pages/dashboard/Security';
import AdminClients from './pages/dashboard/admin/Clients';
import AdminMetrics from './pages/dashboard/admin/Metrics';
import AdminLogs from './pages/dashboard/admin/Logs';

// Landing Page Component
function LandingPage() {
  const [currentSection, setCurrentSection] = useState('INICIO');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'workforce', 'services', 'process', 'audit', 'contact'];
      const sectionNames = ['INICIO', 'FUERZA LABORAL', 'SERVICIOS', 'PROCESO', 'AUDITORIA', 'CONTACTO'];
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            setCurrentSection(sectionNames[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-void-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-2 border-cyber-cyan rounded-lg animate-pulse" />
            <div className="absolute inset-2 border border-neon-purple rounded animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 bg-cyber-cyan/20 rounded" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-2xl font-bold text-cyber-cyan">K</span>
            </div>
          </div>
          
          <div className="font-mono text-sm text-ghost-white tracking-widest mb-2">
            INICIALIZANDO SISTEMAS
          </div>
          
          <div className="w-48 h-1 bg-steel-gray rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-cyber-cyan to-neon-purple animate-pulse" style={{ width: '100%' }} />
          </div>
          
          <div className="mt-6 space-y-1">
            {['Cargando modulos...', 'Conectando a red neuronal...', 'Listo'].map((step, i) => (
              <div 
                key={i} 
                className={`font-mono text-xs transition-all duration-500 ${
                  i < 2 ? 'text-cyber-cyan' : 'text-matrix-green'
                }`}
                style={{ 
                  opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.5,
                  animationDelay: `${i * 0.5}s`
                }}
              >
                {i < 2 ? '> ' : ''}{step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-void-black text-frost-white scrollbar-cyber">
      <NeuralNetworkBackground />
      <HUD currentSection={currentSection} />
      <main className="relative z-10">
        <HeroSection />
        <DigitalWorkforceSection />
        <ServicesSection />
        <ProcessSection />
        <AuditSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-mono text-sm text-ghost-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-error-crimson mb-2">⛔ ACCESO DENEGADO</p>
          <p className="font-mono text-xs text-ghost-white">No tienes permiso para acceder a esta sección</p>
          <Link to="/dashboard" className="text-cyber-cyan hover:underline text-sm mt-4 inline-block">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Public Route (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-mono text-sm text-ghost-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// App Routes
function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Overview />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/automations"
          element={
            <ProtectedRoute permission="automation:view">
              <DashboardLayout>
                <Automations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute permission="tasks:view">
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/integrations"
          element={
            <ProtectedRoute permission="integrations:view">
              <DashboardLayout>
                <Integrations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/security"
          element={
            <ProtectedRoute permission="security:view">
              <DashboardLayout>
                <Security />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard/admin/clients"
          element={
            <ProtectedRoute permission="admin:clients">
              <DashboardLayout>
                <AdminClients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/metrics"
          element={
            <ProtectedRoute permission="admin:metrics">
              <DashboardLayout>
                <AdminMetrics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/logs"
          element={
            <ProtectedRoute permission="admin:logs">
              <DashboardLayout>
                <AdminLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-void-black flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-cyber-cyan font-display mb-4">404</h1>
                <p className="text-ghost-white mb-6">Página no encontrada</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors"
                >
                  Volver al Inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
