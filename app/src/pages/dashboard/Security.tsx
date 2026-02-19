import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  CheckCircle2,
  XCircle,
  Lock,
  FileText,
  Globe,
  Cpu,
  CheckSquare,
  XSquare,
  History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import type { Approval, AuditLog, OrgUser } from '../../lib/api';

type SeverityKey = 'low' | 'medium' | 'high' | 'critical';

const severityColors: Record<SeverityKey, string> = {
  low: 'bg-terminal-gray/20 text-ghost-white border-terminal-gray/30',
  medium: 'bg-alert-amber/20 text-alert-amber border-alert-amber/30',
  high: 'bg-error-crimson/20 text-error-crimson border-error-crimson/30',
  critical: 'bg-error-crimson/30 text-error-crimson border-error-crimson/50',
};

type ApprovalType = 'task_run' | 'integration_connect' | 'automation_edit';

const typeIcons: Record<ApprovalType, React.ElementType> = {
  'task_run': Cpu,
  'integration_connect': Globe,
  'automation_edit': FileText,
};

function ApprovalCard({ 
  approval, 
  onApprove, 
  onReject 
}: { 
  approval: Approval; 
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const Icon = (typeIcons[approval.type as ApprovalType] || FileText) as React.ElementType;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-alert-amber/10 rounded-lg flex items-center justify-center">
            {/* @ts-expect-error - TypeScript strict template literal issue */}
            <Icon className="w-5 h-5 text-alert-amber" />
          </div>
          <div>
            <h3 className="font-medium text-frost-white">{approval.title}</h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-alert-amber/20 text-alert-amber border border-alert-amber/30 rounded">
              PENDIENTE
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-ghost-white mb-4">{approval.description}</p>

      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-ghost-white">Solicitado por</span>
          <span className="text-frost-white">{approval.requestedBy}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ghost-white">Fecha</span>
          <span className="text-frost-white">{new Date(approval.requestedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(approval.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-matrix-green/10 border border-matrix-green/30 text-matrix-green rounded-lg hover:bg-matrix-green/20 transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-sm">Aprobar</span>
        </button>
        <button
          onClick={() => onReject(approval.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-error-crimson/10 border border-error-crimson/30 text-error-crimson rounded-lg hover:bg-error-crimson/20 transition-colors"
        >
          <XSquare className="w-4 h-4" />
          <span className="text-sm">Rechazar</span>
        </button>
      </div>
    </motion.div>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  return (
    <tr className="border-b border-terminal-gray/20 hover:bg-cyber-cyan/5 transition-colors">
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border rounded ${severityColors[log.severity as keyof typeof severityColors]}`}>
          {log.severity.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-frost-white">{log.action}</td>
      <td className="py-3 px-4 text-sm text-ghost-white">{log.resource}</td>
      <td className="py-3 px-4 text-sm text-ghost-white">{log.userName ?? 'system'}</td>
      <td className="py-3 px-4 text-sm text-ghost-white font-mono">{log.ip}</td>
      <td className="py-3 px-4 text-xs text-terminal-gray">{new Date(log.timestamp).toLocaleString()}</td>
    </tr>
  );
}

export default function Security() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'audit' | 'users'>('approvals');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [approvalsData, logsData, usersData] = await Promise.all([
        api.getApprovals(),
        api.getAuditLogs(100),
        api.getOrgUsers(),
      ]);
      setApprovals(approvalsData.filter(a => a.status === 'pending'));
      setAuditLogs(logsData.logs);
      setOrgUsers(usersData.users);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await api.approveRequest(id);
    loadData();
  };

  const handleReject = async (id: string) => {
    await api.rejectRequest(id);
    loadData();
  };

  const filteredLogs = auditLogs.filter(log =>
    severityFilter === 'all' || log.severity === severityFilter
  );

  const canManageApprovals = hasPermission('approvals:approve');
  const canViewAudit = hasPermission('security:view');

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
          <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Seguridad</h1>
          <p className="text-ghost-white">Auditoría, permisos y control de acceso</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-terminal-gray/30 mb-6">
        {[
          { id: 'approvals', label: 'APROBACIONES', icon: CheckSquare },
          { id: 'audit', label: 'LOGS DE AUDITORÍA', icon: History },
          { id: 'users', label: 'USUARIOS Y ROLES', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyber-cyan text-cyber-cyan'
                : 'border-transparent text-ghost-white hover:text-frost-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div>
          {!canManageApprovals ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-terminal-gray mx-auto mb-4" />
              <p className="text-ghost-white">No tienes permisos para gestionar aprobaciones</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-ghost-white">
                  {approvals.length} solicitudes pendientes
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {approvals.map((approval) => (
                    <ApprovalCard
                      key={approval.id}
                      approval={approval}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {approvals.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-matrix-green mx-auto mb-4" />
                  <p className="text-ghost-white">No hay solicitudes pendientes</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div>
          {!canViewAudit ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-terminal-gray mx-auto mb-4" />
              <p className="text-ghost-white">No tienes permisos para ver logs de auditoría</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex gap-2 mb-4">
                {(['all', 'low', 'medium', 'high', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-3 py-2 text-xs font-mono border rounded-lg transition-colors ${
                      severityFilter === s
                        ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan'
                        : 'bg-transparent border-terminal-gray/50 text-ghost-white hover:border-terminal-gray'
                    }`}
                  >
                    {s === 'all' ? 'TODOS' : s.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Audit Table */}
              <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-terminal-gray/30">
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">SEVERIDAD</th>
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ACCIÓN</th>
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">RECURSO</th>
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">USUARIO</th>
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">IP</th>
                        <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">FECHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <AuditLogRow key={log.id} log={log} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Current Users */}
          <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-terminal-gray/30 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-frost-white">Usuarios de la Organización</h3>
              {hasPermission('security:manage_users') && (
                <button className="flex items-center gap-2 px-3 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors text-sm">
                  <Users className="w-4 h-4" />
                  Invitar Usuario
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-terminal-gray/30">
                    <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">USUARIO</th>
                    <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ROL</th>
                    <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ESTADO</th>
                    <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ÚLTIMO ACCESO</th>
                  </tr>
                </thead>
                <tbody>
                  {orgUsers.map((u) => (
                    <tr key={u.id} className="border-b border-terminal-gray/20 hover:bg-cyber-cyan/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyber-cyan/20 rounded-full flex items-center justify-center">
                            <span className="text-cyber-cyan text-xs font-bold">{u.name.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm text-frost-white">{u.name}</p>
                            <p className="text-xs text-ghost-white">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${u.isActive ? 'text-matrix-green' : 'text-error-crimson'}`}>
                          {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-ghost-white">{new Date(u.lastLoginAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {orgUsers.length === 0 && (
                    <tr>
                      <td className="py-6 px-4 text-sm text-ghost-white" colSpan={4}>
                        No hay usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-frost-white mb-4">Permisos por Rol</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-error-crimson/30 rounded-lg bg-error-crimson/5">
                <h4 className="text-error-crimson font-bold text-sm mb-3">SUPER_ADMIN</h4>
                <ul className="space-y-1 text-xs text-ghost-white">
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Acceso total</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Gestión de organizaciones</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Configuración global</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Auditoría completa</li>
                </ul>
              </div>

              <div className="p-4 border border-neon-purple/30 rounded-lg bg-neon-purple/5">
                <h4 className="text-neon-purple font-bold text-sm mb-3">ORG_ADMIN</h4>
                <ul className="space-y-1 text-xs text-ghost-white">
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Gestión de usuarios</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Automatizaciones</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Integraciones</li>
                  <li className="flex items-center gap-1"><XCircle className="w-3 h-3 text-error-crimson" /> Configuración global</li>
                </ul>
              </div>

              <div className="p-4 border border-cyber-cyan/30 rounded-lg bg-cyber-cyan/5">
                <h4 className="text-cyber-cyan font-bold text-sm mb-3">ORG_USER</h4>
                <ul className="space-y-1 text-xs text-ghost-white">
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Dashboard</li>
                  <li className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-matrix-green" /> Ver tareas</li>
                  <li className="flex items-center gap-1"><XCircle className="w-3 h-3 text-error-crimson" /> Gestión de usuarios</li>
                  <li className="flex items-center gap-1"><XCircle className="w-3 h-3 text-error-crimson" /> Configuración</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
