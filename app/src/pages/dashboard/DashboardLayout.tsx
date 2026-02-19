import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { 
  LayoutDashboard, 
  Workflow, 
  Terminal, 
  Plug, 
  Shield, 
  Users, 
  BarChart3,
  FileText,
  LogOut,
  Bell,
  Cpu,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { ActivityEvent } from '../../lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'automations', label: 'Automatizaciones', icon: Workflow, href: '/dashboard/automations' },
  { id: 'tasks', label: 'Misiones', icon: Terminal, href: '/dashboard/tasks' },
  { id: 'integrations', label: 'Integraciones', icon: Plug, href: '/dashboard/integrations' },
  { id: 'security', label: 'Seguridad', icon: Shield, href: '/dashboard/security' },
];

const adminNavItems = [
  { id: 'clients', label: 'Clientes', icon: Users, href: '/dashboard/admin/clients' },
  { id: 'metrics', label: 'Métricas', icon: BarChart3, href: '/dashboard/admin/metrics' },
  { id: 'logs', label: 'Logs', icon: FileText, href: '/dashboard/admin/logs' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isImpersonating, stopImpersonation, canImpersonate } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<ActivityEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = api.subscribeToUpdates((event) => {
      setNotifications(prev => [event, ...prev].slice(0, 20));
      if (event.status === 'error') {
        setSystemStatus('warning');
      }
    });

    // Initial data load
    api.getDashboardOverview().then(data => {
      setSystemStatus(data.systemStatus);
      setNotifications(data.recentActivity);
    });

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'error' || n.status === 'pending').length;

  return (
    <div className="min-h-screen bg-void-black flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] bg-steel-gray/50 backdrop-blur-xl border-r border-terminal-gray/30 z-40"
      >
        {/* Logo */}
        <div className="p-6 border-b border-terminal-gray/30">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div>
              <div className="font-display font-bold text-frost-white">KAN LOGIC</div>
              <div className="font-mono text-[10px] text-ghost-white tracking-widest">PANEL DE CONTROL</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <div className="mb-4">
            <span className="px-4 py-2 text-[10px] font-mono text-ghost-white tracking-wider">PRINCIPAL</span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-ghost-white hover:text-frost-white hover:bg-cyber-cyan/10 transition-all group"
            >
              <item.icon className="w-5 h-5 text-terminal-gray group-hover:text-cyber-cyan transition-colors" />
              <span className="text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}

          {canImpersonate() && (
            <>
              <div className="mt-6 mb-4">
                <span className="px-4 py-2 text-[10px] font-mono text-ghost-white tracking-wider">ADMIN</span>
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-ghost-white hover:text-frost-white hover:bg-neon-purple/10 transition-all group"
                >
                  <item.icon className="w-5 h-5 text-terminal-gray group-hover:text-neon-purple transition-colors" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-terminal-gray/30">
          {isImpersonating && (
            <div className="mb-3 p-2 bg-alert-amber/10 border border-alert-amber/30 rounded-lg">
              <p className="text-[10px] text-alert-amber font-mono">MODO IMPERSONACIÓN</p>
              <button
                onClick={stopImpersonation}
                className="text-xs text-alert-amber hover:underline mt-1"
              >
                Volver a tu cuenta
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyber-cyan/20 rounded-full flex items-center justify-center">
              <span className="font-mono text-sm text-cyber-cyan font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-frost-white truncate">{user?.name}</p>
              <p className="text-[10px] text-ghost-white truncate">{user?.organization.name}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ghost-white hover:text-error-crimson hover:bg-error-crimson/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-void-black/80 backdrop-blur-xl border-b border-terminal-gray/30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-ghost-white hover:text-cyber-cyan transition-colors"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
                  <span className="w-full h-0.5 bg-current" />
                  <span className="w-3/4 h-0.5 bg-current" />
                  <span className="w-full h-0.5 bg-current" />
                </div>
              </button>
              
              {/* System status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-steel-gray/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  systemStatus === 'healthy' ? 'bg-matrix-green animate-pulse' :
                  systemStatus === 'warning' ? 'bg-alert-amber' :
                  'bg-error-crimson'
                }`} />
                <span className="font-mono text-[10px] text-ghost-white tracking-wider">
                  {systemStatus === 'healthy' ? 'SISTEMA OPERATIVO' :
                   systemStatus === 'warning' ? 'REVISIÓN REQUERIDA' :
                   'ERROR DETECTADO'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-ghost-white hover:text-cyber-cyan transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-error-crimson rounded-full text-[10px] font-mono flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-steel-gray/90 backdrop-blur-xl border border-terminal-gray/50 rounded-xl overflow-hidden shadow-xl"
                  >
                    <div className="p-3 border-b border-terminal-gray/30">
                      <span className="font-mono text-xs text-ghost-white tracking-wider">NOTIFICACIONES</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-ghost-white text-center">Sin notificaciones</p>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            className="p-3 border-b border-terminal-gray/20 hover:bg-cyber-cyan/5 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              {notif.status === 'success' && <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0 mt-0.5" />}
                              {notif.status === 'error' && <AlertCircle className="w-4 h-4 text-error-crimson flex-shrink-0 mt-0.5" />}
                              {notif.status === 'pending' && <Clock className="w-4 h-4 text-alert-amber flex-shrink-0 mt-0.5" />}
                              <div>
                                <p className="text-sm text-frost-white">{notif.title}</p>
                                <p className="text-xs text-ghost-white">{notif.description}</p>
                                <p className="text-[10px] text-terminal-gray mt-1">
                                  {new Date(notif.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* User info */}
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-steel-gray/50 rounded-lg">
                <span className="font-mono text-xs text-cyber-cyan">{user?.role}</span>
                <span className="w-px h-3 bg-terminal-gray" />
                <span className="text-xs text-ghost-white">{user?.organization.plan.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
