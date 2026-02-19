import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../../../lib/api';

export default function AdminMetrics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const d = await api.getAdminMetrics();
        setData(d);
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
        <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Admin: Métricas</h1>
        <p className="text-ghost-white">KPIs globales (todas las organizaciones)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(data ?? {}).map(([k, v]) => (
          <div key={k} className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-cyber-cyan" />
              <span className="font-mono text-[10px] text-ghost-white tracking-wider uppercase">{k}</span>
            </div>
            <p className="font-display text-3xl font-bold text-frost-white">{String(v)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

