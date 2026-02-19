import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Workflow,
  Terminal,
  Plug
} from 'lucide-react';
import type { DashboardOverview as DashboardData } from '../../lib/api';

type ColorKey = 'cyan' | 'purple' | 'green' | 'amber';

const colorStyles: Record<ColorKey, string> = {
  cyan: 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/30',
  purple: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30',
  green: 'text-matrix-green bg-matrix-green/10 border-matrix-green/30',
  amber: 'text-alert-amber bg-alert-amber/10 border-alert-amber/30',
};

function KPICard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  color = 'cyan'
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  trend: 'up' | 'down';
  icon: React.ElementType;
  color?: ColorKey;
}) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5 hover:border-cyber-cyan/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorStyles[color]}`}>
          {/* @ts-expect-error - TypeScript strict template literal issue */}
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-matrix-green' : 'text-error-crimson'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <p className="font-mono text-[10px] text-ghost-white tracking-wider mb-1">{title}</p>
      <p className="font-display text-2xl font-bold text-frost-white">{value}</p>
    </motion.div>
  );
}

function ActivityItem({ event }: { event: { id: string; type: string; title: string; description: string; timestamp: string; status: string } }) {
  const statusIcons = {
    success: <CheckCircle2 className="w-4 h-4 text-matrix-green" />,
    error: <AlertCircle className="w-4 h-4 text-error-crimson" />,
    pending: <Clock3 className="w-4 h-4 text-alert-amber" />,
    warning: <AlertCircle className="w-4 h-4 text-alert-amber" />,
  };

  const typeColors: Record<string, string> = {
    automation: 'text-cyber-cyan',
    task: 'text-neon-purple',
    integration: 'text-matrix-green',
    alert: 'text-error-crimson',
    approval: 'text-alert-amber',
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-cyber-cyan/5 rounded-lg transition-colors">
      {statusIcons[event.status as keyof typeof statusIcons] || <Activity className="w-4 h-4 text-ghost-white" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase ${typeColors[event.type] || 'text-ghost-white'}`}>
            {event.type}
          </span>
          <span className="text-[10px] text-terminal-gray">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-frost-white truncate">{event.title}</p>
        <p className="text-xs text-ghost-white truncate">{event.description}</p>
      </div>
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getDashboardOverview().then(data => {
      setData(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-frost-white mb-2">
          Bienvenido, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-ghost-white">
          Aquí está el resumen de tu sistema hoy
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="CONVERSACIONES"
          value={data?.kpis.conversations.value.toLocaleString() || 0}
          change={data?.kpis.conversations.change || 0}
          trend={data?.kpis.conversations.trend || 'up'}
          icon={MessageSquare}
          color="cyan"
        />
        <KPICard
          title="LEADS CAPTURADOS"
          value={data?.kpis.leads.value || 0}
          change={data?.kpis.leads.change || 0}
          trend={data?.kpis.leads.trend || 'up'}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="CITAS AGENDADAS"
          value={data?.kpis.appointments.value || 0}
          change={data?.kpis.appointments.change || 0}
          trend={data?.kpis.appointments.trend || 'up'}
          icon={Calendar}
          color="green"
        />
        <KPICard
          title="ROI ESTIMADO"
          value={`${data?.kpis.roi.value || 0}x`}
          change={data?.kpis.roi.change || 0}
          trend={data?.kpis.roi.trend || 'up'}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-cyber-cyan" />
            <span className="font-mono text-[10px] text-ghost-white tracking-wider">TIEMPO AHORRADO</span>
          </div>
          <p className="font-display text-3xl font-bold text-frost-white">
            {data?.kpis.timeSaved.value} <span className="text-lg text-ghost-white">{data?.kpis.timeSaved.unit}</span>
          </p>
        </div>
        
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Bot className="w-5 h-5 text-neon-purple" />
            <span className="font-mono text-[10px] text-ghost-white tracking-wider">AUTOMATIZACIONES ACTIVAS</span>
          </div>
          <p className="font-display text-3xl font-bold text-frost-white">
            {data?.kpis.automationsActive || 0}
          </p>
        </div>

        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-matrix-green" />
            <span className="font-mono text-[10px] text-ghost-white tracking-wider">ESTADO DEL SISTEMA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              data?.systemStatus === 'healthy' ? 'bg-matrix-green animate-pulse' :
              data?.systemStatus === 'warning' ? 'bg-alert-amber' :
              'bg-error-crimson'
            }`} />
            <span className="font-display text-xl font-bold text-frost-white">
              {data?.systemStatus === 'healthy' ? 'OPERATIVO' :
               data?.systemStatus === 'warning' ? 'REVISIÓN' :
               'ERROR'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity feed and Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-terminal-gray/30">
            <h2 className="font-display text-lg font-semibold text-frost-white">Actividad Reciente</h2>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {data?.recentActivity.length === 0 ? (
              <p className="p-4 text-sm text-ghost-white text-center">Sin actividad reciente</p>
            ) : (
              data?.recentActivity.map((event) => (
                <ActivityItem key={event.id} event={event} />
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-terminal-gray/30">
            <h2 className="font-display text-lg font-semibold text-frost-white">Acciones Rápidas</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link
              to="/dashboard/automations"
              className="flex items-center gap-3 p-3 bg-void-black/30 rounded-lg hover:bg-cyber-cyan/10 transition-colors group"
            >
              <div className="w-10 h-10 bg-cyber-cyan/10 rounded-lg flex items-center justify-center group-hover:bg-cyber-cyan/20 transition-colors">
                <Workflow className="w-5 h-5 text-cyber-cyan" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-frost-white">Ver Automatizaciones</p>
                <p className="text-xs text-ghost-white">{data?.kpis.automationsActive} activas</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-terminal-gray group-hover:text-cyber-cyan transition-colors" />
            </Link>

            <Link
              to="/dashboard/tasks"
              className="flex items-center gap-3 p-3 bg-void-black/30 rounded-lg hover:bg-neon-purple/10 transition-colors group"
            >
              <div className="w-10 h-10 bg-neon-purple/10 rounded-lg flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors">
                <Terminal className="w-5 h-5 text-neon-purple" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-frost-white">Ejecutar Misión</p>
                <p className="text-xs text-ghost-white">Crear y monitorear tareas</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-terminal-gray group-hover:text-neon-purple transition-colors" />
            </Link>

            <Link
              to="/dashboard/integrations"
              className="flex items-center gap-3 p-3 bg-void-black/30 rounded-lg hover:bg-matrix-green/10 transition-colors group"
            >
              <div className="w-10 h-10 bg-matrix-green/10 rounded-lg flex items-center justify-center group-hover:bg-matrix-green/20 transition-colors">
                <Plug className="w-5 h-5 text-matrix-green" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-frost-white">Gestionar Integraciones</p>
                <p className="text-xs text-ghost-white">Conectar nuevos servicios</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-terminal-gray group-hover:text-matrix-green transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
