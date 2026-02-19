import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Bot,
  MessageSquare,
  ShoppingCart,
  Database,
  MoreVertical
} from 'lucide-react';
import api from '../../lib/api';
import type { Automation } from '../../lib/api';

const automationIcons: Record<string, React.ElementType> = {
  'webhook:whatsapp': MessageSquare,
  'schedule:daily': Clock,
  'schedule:daily:09:00': Clock,
  'event:cart_abandoned': ShoppingCart,
  'webhook:shopify': Database,
  default: Bot,
};

type StatusKey = 'active' | 'paused' | 'error' | 'warning';

const statusColors: Record<StatusKey, string> = {
  active: 'bg-matrix-green/20 text-matrix-green border-matrix-green/30',
  paused: 'bg-alert-amber/20 text-alert-amber border-alert-amber/30',
  error: 'bg-error-crimson/20 text-error-crimson border-error-crimson/30',
  warning: 'bg-alert-amber/20 text-alert-amber border-alert-amber/30',
};

const healthIndicators: Record<string, { color: string; label: string }> = {
  healthy: { color: 'bg-matrix-green', label: 'Saludable' },
  warning: { color: 'bg-alert-amber', label: 'Advertencia' },
  error: { color: 'bg-error-crimson', label: 'Error' },
};

function AutomationCard({ 
  automation, 
  onRun, 
  onToggle, 
  onRepair 
}: { 
  automation: Automation; 
  onRun: (id: string) => void;
  onToggle: (id: string) => void;
  onRepair: (id: string) => void;
}) {
  const Icon = (automationIcons[automation.config.trigger] || automationIcons.default) as React.ElementType;
  const health = healthIndicators[automation.healthStatus];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5 hover:border-cyber-cyan/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyber-cyan/10 rounded-lg flex items-center justify-center">
            {/* @ts-expect-error - TypeScript strict template literal issue */}
            <Icon className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <h3 className="font-medium text-frost-white">{automation.name}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border rounded ${statusColors[automation.status as StatusKey] as string}`}>
              {automation.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
              {automation.status === 'paused' && <Pause className="w-3 h-3" />}
              {automation.status === 'error' && <AlertCircle className="w-3 h-3" />}
              {automation.status.toUpperCase()}
            </span>
          </div>
        </div>
        <button className="p-2 text-ghost-white hover:text-frost-white hover:bg-white/10 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-ghost-white mb-4">{automation.description}</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-mono text-terminal-gray mb-1">EJECUCIONES</p>
          <p className="font-display text-lg font-semibold text-frost-white">{automation.runCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-terminal-gray mb-1">ÉXITO</p>
          <p className="font-display text-lg font-semibold text-frost-white">{automation.successRate}%</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-terminal-gray mb-1">SALUD</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${health.color}`} />
            <span className="text-xs text-ghost-white">{health.label}</span>
          </div>
        </div>
      </div>

      {automation.lastRun && (
        <div className="flex items-center gap-2 text-xs text-ghost-white mb-4">
          <Clock className="w-3 h-3" />
          <span>Última ejecución: {new Date(automation.lastRun).toLocaleString()}</span>
        </div>
      )}

      <div className="flex gap-2">
        {automation.status === 'active' ? (
          <button
            onClick={() => onToggle(automation.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-alert-amber/10 border border-alert-amber/30 text-alert-amber rounded-lg hover:bg-alert-amber/20 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span className="text-sm">Pausar</span>
          </button>
        ) : (
          <button
            onClick={() => onToggle(automation.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-matrix-green/10 border border-matrix-green/30 text-matrix-green rounded-lg hover:bg-matrix-green/20 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Activar</span>
          </button>
        )}

        <button
          onClick={() => onRun(automation.id)}
          disabled={automation.status !== 'active'}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Ejecutar</span>
        </button>

        {automation.healthStatus === 'error' && (
          <button
            onClick={() => onRepair(automation.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-lg hover:bg-neon-purple/20 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Reparar</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    const data = await api.getAutomations();
    setAutomations(data);
    setIsLoading(false);
  };

  const handleRun = async (id: string) => {
    await api.runAutomation(id);
    loadAutomations();
  };

  const handleToggle = async (id: string) => {
    await api.toggleAutomation(id);
    loadAutomations();
  };

  const handleRepair = async (id: string) => {
    await api.repairAutomation(id);
    loadAutomations();
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesFilter = filter === 'all' || automation.status === filter;
    const matchesSearch = automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         automation.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === 'active').length,
    paused: automations.filter(a => a.status === 'paused').length,
    error: automations.filter(a => a.status === 'error').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Automatizaciones</h1>
          <p className="text-ghost-white">Gestiona tus flujos de trabajo automatizados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Nueva Automatización</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-ghost-white tracking-wider mb-1">TOTAL</p>
          <p className="font-display text-2xl font-bold text-frost-white">{stats.total}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-matrix-green tracking-wider mb-1">ACTIVAS</p>
          <p className="font-display text-2xl font-bold text-matrix-green">{stats.active}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-alert-amber tracking-wider mb-1">PAUSADAS</p>
          <p className="font-display text-2xl font-bold text-alert-amber">{stats.paused}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-error-crimson tracking-wider mb-1">CON ERROR</p>
          <p className="font-display text-2xl font-bold text-error-crimson">{stats.error}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-white" />
          <input
            type="text"
            placeholder="Buscar automatizaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'error'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-mono border rounded-lg transition-colors ${
                filter === f
                  ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
                  : 'bg-transparent border-terminal-gray/50 text-ghost-white hover:border-terminal-gray'
              }`}
            >
              {f === 'all' ? 'TODAS' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAutomations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onRun={handleRun}
              onToggle={handleToggle}
              onRepair={handleRepair}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredAutomations.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-terminal-gray mx-auto mb-4" />
          <p className="text-ghost-white mb-2">No se encontraron automatizaciones</p>
          <p className="text-sm text-terminal-gray">Ajusta los filtros o crea una nueva automatización</p>
        </div>
      )}
    </div>
  );
}
