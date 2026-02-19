import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Terminal,
  Calendar,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Task, TaskRun } from '../../lib/api';

type StatusKey = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

const statusColors: Record<StatusKey, string> = {
  idle: 'bg-terminal-gray/20 text-ghost-white border-terminal-gray/30',
  running: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30',
  completed: 'bg-matrix-green/20 text-matrix-green border-matrix-green/30',
  failed: 'bg-error-crimson/20 text-error-crimson border-error-crimson/30',
  paused: 'bg-alert-amber/20 text-alert-amber border-alert-amber/30',
};

const statusIcons: Record<StatusKey, React.ElementType> = {
  idle: Clock,
  running: Activity,
  completed: CheckCircle2,
  failed: XCircle,
  paused: Pause,
};

function TaskRunHistory({ run, isExpanded }: { run: TaskRun; isExpanded: boolean }) {
  if (!isExpanded) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-4 pt-4 border-t border-terminal-gray/30">
        <h4 className="text-xs font-mono text-ghost-white mb-3">EJECUCIÓN: {run.id}</h4>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-ghost-white">Progreso</span>
            <span className="text-cyber-cyan">{run.progress}%</span>
          </div>
          <div className="h-1.5 bg-void-black rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${run.progress}%` }}
              className="h-full bg-gradient-to-r from-cyber-cyan to-neon-purple"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-4">
          {run.steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-2 bg-void-black/50 rounded-lg">
              {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-matrix-green" />}
              {step.status === 'running' && <Activity className="w-4 h-4 text-cyber-cyan animate-pulse" />}
              {step.status === 'pending' && <Clock className="w-4 h-4 text-terminal-gray" />}
              {step.status === 'failed' && <XCircle className="w-4 h-4 text-error-crimson" />}
              <div className="flex-1">
                <p className="text-sm text-frost-white">{step.name}</p>
                <div className="h-1 bg-terminal-gray/30 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      step.status === 'completed' ? 'bg-matrix-green' :
                      step.status === 'running' ? 'bg-cyber-cyan' :
                      step.status === 'failed' ? 'bg-error-crimson' :
                      'bg-terminal-gray'
                    }`}
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
                {step.logs && step.logs.length > 0 && (
                  <p className="mt-1 text-[10px] font-mono text-terminal-gray truncate">
                    {step.logs[step.logs.length - 1]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Evidence */}
        {run.evidence && (
          <div className="grid grid-cols-3 gap-2">
            {run.evidence.screenshots && run.evidence.screenshots.length > 0 && (
              <div className="p-2 bg-void-black/50 rounded-lg text-center">
                <ImageIcon className="w-5 h-5 text-cyber-cyan mx-auto mb-1" />
                <p className="text-xs text-ghost-white">{run.evidence.screenshots.length} capturas</p>
              </div>
            )}
            {run.evidence.logs && run.evidence.logs.length > 0 && (
              <div className="p-2 bg-void-black/50 rounded-lg text-center">
                <FileText className="w-5 h-5 text-neon-purple mx-auto mb-1" />
                <p className="text-xs text-ghost-white">{run.evidence.logs.length} logs</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TaskCard({ 
  task, 
  onRun, 
  onTogglePause,
  canEdit,
  isExpanded, 
  onToggleExpand 
}: { 
  task: Task; 
  onRun: (id: string) => void;
  onTogglePause: (id: string) => void;
  canEdit: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const StatusIcon = (statusIcons[task.status as StatusKey] || Clock) as React.ElementType;

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
          <div className="w-10 h-10 bg-neon-purple/10 rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-medium text-frost-white">{task.name}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border rounded ${statusColors[task.status as StatusKey] as string}`}>
              {/* @ts-expect-error - TypeScript strict template literal issue */}
              <StatusIcon className="w-3 h-3" />
              {task.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {task.requiresApproval && (
            <span className="px-2 py-0.5 text-[10px] bg-alert-amber/20 text-alert-amber border border-alert-amber/30 rounded">
              REQUIERE APROBACIÓN
            </span>
          )}
          {task.lastRun?.status === 'awaiting_approval' && (
            <span className="px-2 py-0.5 text-[10px] bg-alert-amber/10 text-alert-amber border border-alert-amber/20 rounded">
              PENDIENTE APROBACIÓN
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => onTogglePause(task.id)}
              className="p-2 text-ghost-white hover:text-frost-white hover:bg-white/10 rounded-lg transition-colors"
              title={task.status === 'paused' ? 'Reanudar' : 'Pausar'}
            >
              {task.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}
          <button 
            onClick={onToggleExpand}
            className="p-2 text-ghost-white hover:text-frost-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-sm text-ghost-white mb-4">{task.description}</p>

      <div className="flex items-center gap-4 mb-4 text-xs text-ghost-white">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {task.schedule}
        </span>
        {task.lastRun && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Última: {new Date(task.lastRun.startedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRun(task.id)}
          disabled={task.status === 'running' || task.status === 'paused'}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          <span className="text-sm">Ejecutar</span>
        </button>

        <button className="p-2 text-ghost-white hover:text-frost-white hover:bg-white/10 rounded-lg transition-colors border border-terminal-gray/50">
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {task.lastRun && (
        <TaskRunHistory run={task.lastRun} isExpanded={isExpanded} />
      )}
    </motion.div>
  );
}

export default function Tasks() {
  const { hasPermission } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', schedule: '0 9 * * 1', requiresApproval: false });

  useEffect(() => {
    loadTasks();
  }, []);

  // Real-time task progress/logs (SSE)
  useEffect(() => {
    const unsubscribe = api.subscribeToTaskRunUpdates({
      onProgress: (u) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.lastRun?.id === u.runId
              ? { ...t, lastRun: { ...t.lastRun, progress: u.progress, status: u.status as TaskRun['status'] } }
              : t,
          ),
        );
      },
      onLog: (m) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.lastRun?.id !== m.runId) return t;
            const steps = t.lastRun.steps.map((s) =>
              s.id === m.stepId ? { ...s, logs: [...(s.logs ?? []), m.message] } : s,
            );
            return { ...t, lastRun: { ...t.lastRun, steps } };
          }),
        );
      },
    });
    return unsubscribe;
  }, []);

  const loadTasks = async () => {
    const data = await api.getTasks();
    setTasks(data);
    setIsLoading(false);
  };

  const handleRun = async (id: string) => {
    setBanner(null);
    const result = await api.runTask(id);
    if (result.awaitingApproval) {
      setBanner('Solicitud enviada a aprobaciones (pendiente).');
    } else {
      setBanner('Misión en ejecución. Verás progreso en tiempo real.');
    }
    loadTasks();
  };

  const handleTogglePause = async (id: string) => {
    await api.toggleTaskPause(id);
    loadTasks();
  };

  const handleCreate = async () => {
    await api.createTask(newTask);
    setShowCreate(false);
    setNewTask({ name: '', description: '', schedule: '0 9 * * 1', requiresApproval: false });
    setBanner('Misión creada.');
    loadTasks();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
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
      {banner && (
        <div className="mb-6 p-4 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl text-cyber-cyan">
          {banner}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Misiones</h1>
          <p className="text-ghost-white">Gestiona tareas con evidencia de trabajo</p>
        </div>
        {hasPermission('tasks:create') && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Misión</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-ghost-white tracking-wider mb-1">TOTAL</p>
          <p className="font-display text-2xl font-bold text-frost-white">{stats.total}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-cyber-cyan tracking-wider mb-1">EJECUTANDO</p>
          <p className="font-display text-2xl font-bold text-cyber-cyan">{stats.running}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-matrix-green tracking-wider mb-1">COMPLETADAS</p>
          <p className="font-display text-2xl font-bold text-matrix-green">{stats.completed}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-error-crimson tracking-wider mb-1">FALLIDAS</p>
          <p className="font-display text-2xl font-bold text-error-crimson">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-white" />
          <input
            type="text"
            placeholder="Buscar misiones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'running', 'completed', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-mono border rounded-lg transition-colors ${
                filter === f
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                  : 'bg-transparent border-terminal-gray/50 text-ghost-white hover:border-terminal-gray'
              }`}
            >
              {f === 'all' ? 'TODAS' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onRun={handleRun}
              onTogglePause={handleTogglePause}
              canEdit={hasPermission('tasks:edit')}
              isExpanded={expandedTask === task.id}
              onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/80"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-steel-gray/80 backdrop-blur-xl border border-terminal-gray/50 rounded-2xl p-6"
            >
              <h3 className="font-display text-xl font-bold text-frost-white mb-4">Nueva Misión</h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">NOMBRE</label>
                  <input
                    value={newTask.name}
                    onChange={(e) => setNewTask((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">DESCRIPCIÓN</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm min-h-[90px]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">SCHEDULE (CRON)</label>
                  <input
                    value={newTask.schedule}
                    onChange={(e) => setNewTask((p) => ({ ...p, schedule: e.target.value }))}
                    className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm font-mono"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-ghost-white">
                  <input
                    type="checkbox"
                    checked={newTask.requiresApproval}
                    onChange={(e) => setNewTask((p) => ({ ...p, requiresApproval: e.target.checked }))}
                  />
                  Requiere aprobación
                </label>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-transparent border border-terminal-gray/50 text-ghost-white rounded-lg hover:border-terminal-gray transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTask.name.trim() || !newTask.description.trim() || !newTask.schedule.trim()}
                  className="px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Terminal className="w-16 h-16 text-terminal-gray mx-auto mb-4" />
          <p className="text-ghost-white mb-2">No se encontraron misiones</p>
          <p className="text-sm text-terminal-gray">Ajusta los filtros o crea una nueva misión</p>
        </div>
      )}
    </div>
  );
}
