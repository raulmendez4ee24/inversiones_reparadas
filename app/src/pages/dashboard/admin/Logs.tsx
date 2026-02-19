import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '../../../lib/api';
import type { AuditLog } from '../../../lib/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await api.getAdminLogs();
        setLogs(data.logs);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Admin: Logs</h1>
        <p className="text-ghost-white">Auditoría global (state-changing calls)</p>
      </div>

      <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-terminal-gray/30 flex items-center gap-2">
          <FileText className="w-4 h-4 text-alert-amber" />
          <h2 className="font-display text-lg font-semibold text-frost-white">Audit Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-gray/30">
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">FECHA</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ORG</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ACCIÓN</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">IP</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">SEVERIDAD</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-terminal-gray/20 hover:bg-cyber-cyan/5 transition-colors">
                  <td className="py-3 px-4 text-xs text-terminal-gray">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs text-ghost-white font-mono">{l.organizationId}</td>
                  <td className="py-3 px-4 text-sm text-frost-white">{l.action}</td>
                  <td className="py-3 px-4 text-xs text-ghost-white font-mono">{l.ip}</td>
                  <td className="py-3 px-4 text-xs text-ghost-white">{l.severity}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-sm text-ghost-white">
                    Sin logs todavía. Ejecuta alguna acción (run task, approve, etc.).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

