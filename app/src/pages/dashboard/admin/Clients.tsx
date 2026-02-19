import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserCheck, Building2 } from 'lucide-react';
import api from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { Organization } from '../../../contexts/AuthContext';

type AdminUserSearchResult = {
  id: string;
  email: string;
  name: string;
  systemRole: string;
  memberships: Array<{ organizationId: string; role: string }>;
};

export default function AdminClients() {
  const navigate = useNavigate();
  const { impersonateUser } = useAuth();

  const [clients, setClients] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await api.getClients();
        setClients(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const orgById = useMemo(() => {
    const m = new Map<string, Organization>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const runSearch = async () => {
    setError('');
    setSearching(true);
    try {
      const data = await api.searchAdminUsers(query);
      setResults(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar');
    } finally {
      setSearching(false);
    }
  };

  const handleImpersonate = async (userId: string, orgId: string) => {
    setError('');
    try {
      await impersonateUser(userId, orgId);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al impersonar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Admin: Clientes</h1>
          <p className="text-ghost-white">Multi-tenant: lista de organizaciones</p>
        </div>
      </div>

      {/* Clients table */}
      <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-terminal-gray/30 flex items-center gap-2">
          <Users className="w-4 h-4 text-neon-purple" />
          <h2 className="font-display text-lg font-semibold text-frost-white">Organizaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-gray/30">
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">NOMBRE</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">PLAN</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">ESTADO</th>
                <th className="text-left py-3 px-4 text-xs font-mono text-ghost-white">CREADA</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-terminal-gray/20 hover:bg-cyber-cyan/5 transition-colors">
                  <td className="py-3 px-4 text-sm text-frost-white">{c.name}</td>
                  <td className="py-3 px-4 text-sm text-ghost-white">{c.plan}</td>
                  <td className="py-3 px-4 text-sm text-ghost-white">{c.status}</td>
                  <td className="py-3 px-4 text-xs text-terminal-gray">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-sm text-ghost-white" colSpan={4}>
                    No hay clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impersonate */}
      <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-4 h-4 text-cyber-cyan" />
          <h2 className="font-display text-lg font-semibold text-frost-white">Impersonar usuario</h2>
        </div>

        <p className="text-sm text-ghost-white mb-4">
          Busca por email/nombre y elige la organización para entrar como ese usuario.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg text-error-crimson text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ghost-white" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="demo@empresa.com, María, etc."
              className="w-full pl-10 pr-4 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={searching || query.trim().length < 2}
            onClick={runSearch}
            className="px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </motion.button>
        </div>

        <div className="space-y-3">
          {results.map((u) => (
            <div key={u.id} className="p-4 bg-void-black/40 border border-terminal-gray/40 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-frost-white font-medium">{u.name}</p>
                  <p className="text-xs text-ghost-white font-mono">{u.email}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded border border-terminal-gray/50 text-ghost-white">
                  {u.systemRole}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {u.memberships.map((m) => {
                  const org = orgById.get(m.organizationId);
                  return (
                    <button
                      key={m.organizationId}
                      onClick={() => handleImpersonate(u.id, m.organizationId)}
                      className="flex items-center gap-2 px-3 py-2 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-lg hover:bg-neon-purple/20 transition-colors text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="flex-1 text-left">
                        {org?.name ?? m.organizationId}
                        <span className="ml-2 text-[10px] text-ghost-white font-mono">{m.role}</span>
                      </span>
                      <span className="text-xs">Entrar</span>
                    </button>
                  );
                })}
                {u.memberships.length === 0 && (
                  <div className="text-sm text-ghost-white">Sin memberships</div>
                )}
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <p className="text-sm text-terminal-gray">
              Sin resultados. Intenta con: <span className="text-ghost-white font-mono">demo@empresa.com</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

