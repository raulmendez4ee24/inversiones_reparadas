import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plug,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  CreditCard,
  Brain,
  Calendar,
  ShoppingCart
} from 'lucide-react';
import api from '../../lib/api';
import type { Integration } from '../../lib/api';

const providerIcons: Record<string, React.ElementType> = {
  'Meta': MessageSquare,
  'Google': Calendar,
  'Shopify': ShoppingCart,
  'Stripe': CreditCard,
  'OpenAI': Brain,
  default: Plug,
};

type StatusKey = 'connected' | 'disconnected' | 'error' | 'syncing';

const statusColors: Record<StatusKey, string> = {
  connected: 'bg-matrix-green/20 text-matrix-green border-matrix-green/30',
  disconnected: 'bg-terminal-gray/20 text-ghost-white border-terminal-gray/30',
  error: 'bg-error-crimson/20 text-error-crimson border-error-crimson/30',
  syncing: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30',
};

const healthIndicators: Record<string, { color: string; label: string }> = {
  healthy: { color: 'bg-matrix-green', label: 'Saludable' },
  warning: { color: 'bg-alert-amber', label: 'Advertencia' },
  error: { color: 'bg-error-crimson', label: 'Error' },
};

function IntegrationCard({ 
  integration, 
  onTest, 
  onDisconnect,
  onUpdateMeta,
  isTesting
}: { 
  integration: Integration; 
  onTest: (id: string) => void;
  onDisconnect: (id: string) => void;
  onUpdateMeta: (id: string, patch: { appIconUrl?: string | null; privacyPolicyUrl?: string | null; userDataDeletionUrl?: string | null; category?: string | null }) => Promise<void>;
  isTesting: boolean;
}) {
  const Icon = (providerIcons[integration.provider] || providerIcons.default) as React.ElementType;
  const health = healthIndicators[integration.healthStatus];
  const isMeta = integration.provider === 'Meta';

  const missingMeta: string[] = [];
  if (isMeta) {
    if (!integration.config.appIconUrl) missingMeta.push('Icono de la app (1,024 x 1,024)');
    if (!integration.config.privacyPolicyUrl) missingMeta.push('URL de la política de privacidad');
    if (!integration.config.userDataDeletionUrl) missingMeta.push('Eliminación de datos de usuario');
    if (!integration.config.category) missingMeta.push('Categoría');
  }

  const [showMeta, setShowMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appIconUrl, setAppIconUrl] = useState<string>(integration.config.appIconUrl ?? '');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState<string>(integration.config.privacyPolicyUrl ?? '');
  const [userDataDeletionUrl, setUserDataDeletionUrl] = useState<string>(integration.config.userDataDeletionUrl ?? '');
  const [category, setCategory] = useState<string>(integration.config.category ?? '');

  useEffect(() => {
    setAppIconUrl(integration.config.appIconUrl ?? '');
    setPrivacyPolicyUrl(integration.config.privacyPolicyUrl ?? '');
    setUserDataDeletionUrl(integration.config.userDataDeletionUrl ?? '');
    setCategory(integration.config.category ?? '');
  }, [
    integration.id,
    integration.config.appIconUrl,
    integration.config.privacyPolicyUrl,
    integration.config.userDataDeletionUrl,
    integration.config.category,
  ]);

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
          <div className="w-10 h-10 bg-matrix-green/10 rounded-lg flex items-center justify-center">
            {/* @ts-expect-error - TypeScript strict template literal issue */}
            <Icon className="w-5 h-5 text-matrix-green" />
          </div>
          <div>
            <h3 className="font-medium text-frost-white">{integration.name}</h3>
            <p className="text-xs text-ghost-white">{integration.provider}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border rounded ${statusColors[integration.status as StatusKey] as string}`}>
          {integration.status === 'connected' && <CheckCircle2 className="w-3 h-3" />}
          {integration.status === 'disconnected' && <XCircle className="w-3 h-3" />}
          {integration.status === 'error' && <AlertTriangle className="w-3 h-3" />}
          {integration.status === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {integration.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ghost-white">Estado de salud</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${health.color}`} />
            <span className="text-frost-white">{health.label}</span>
          </div>
        </div>

        {integration.lastSync && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ghost-white">Última sincronización</span>
            <span className="text-frost-white">{new Date(integration.lastSync).toLocaleString()}</span>
          </div>
        )}

        {integration.credentials.expiresAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ghost-white">Credenciales expiran</span>
            <span className="text-frost-white">{new Date(integration.credentials.expiresAt).toLocaleDateString()}</span>
          </div>
        )}

        {integration.estimatedCost && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ghost-white">Costo estimado/mes</span>
            <span className="text-cyber-cyan">${integration.estimatedCost}</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1 mb-4">
        {integration.config.features.map((feature) => (
          <span 
            key={feature}
            className="px-2 py-0.5 text-[10px] bg-void-black/50 text-ghost-white rounded"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {integration.status === 'connected' ? (
          <>
            <button
              onClick={() => onTest(integration.id)}
              disabled={isTesting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span className="text-sm">{isTesting ? 'Probando...' : 'Probar'}</span>
            </button>
            <button
              onClick={() => onDisconnect(integration.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-error-crimson/10 border border-error-crimson/30 text-error-crimson rounded-lg hover:bg-error-crimson/20 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Desconectar</span>
            </button>
          </>
        ) : (
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-matrix-green/10 border border-matrix-green/30 text-matrix-green rounded-lg hover:bg-matrix-green/20 transition-colors"
          >
            <Plug className="w-4 h-4" />
            <span className="text-sm">Conectar</span>
          </button>
        )}
      </div>

      {/* Meta App Review requirements (from screenshot) */}
      {isMeta && (
        <div className="mt-4 space-y-3">
          {missingMeta.length > 0 ? (
            <div className="p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-error-crimson mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-error-crimson font-medium">No cumple los requisitos para la solicitud</p>
                  <p className="text-xs text-ghost-white mt-1">Faltan datos en:</p>
                  <ul className="mt-2 space-y-1 text-xs text-ghost-white list-disc list-inside">
                    {missingMeta.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowMeta(!showMeta)}
                className="mt-3 w-full px-3 py-2 bg-error-crimson/10 border border-error-crimson/30 text-error-crimson rounded-lg hover:bg-error-crimson/20 transition-colors text-sm"
              >
                {showMeta ? 'Ocultar' : 'Completar requisitos'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-matrix-green/10 border border-matrix-green/30 rounded-lg text-matrix-green text-sm">
              Listo para solicitud (icono, privacidad, eliminación de datos y categoría configurados).
            </div>
          )}

          {showMeta && (
            <div className="p-4 bg-void-black/40 border border-terminal-gray/40 rounded-xl space-y-3">
              <div>
                <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">ICONO (URL)</label>
                <input
                  value={appIconUrl}
                  onChange={(e) => setAppIconUrl(e.target.value)}
                  placeholder="https://.../icon-1024.png"
                  className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">PRIVACY POLICY (URL)</label>
                <input
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  placeholder="https://tu-dominio.com/privacy"
                  className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">ELIMINACIÓN DE DATOS (URL)</label>
                <input
                  value={userDataDeletionUrl}
                  onChange={(e) => setUserDataDeletionUrl(e.target.value)}
                  placeholder="https://tu-dominio.com/data-deletion"
                  className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-1">CATEGORÍA</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Business"
                  className="w-full px-3 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors text-sm"
                />
              </div>

              <button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onUpdateMeta(integration.id, {
                      appIconUrl: appIconUrl.trim() ? appIconUrl.trim() : null,
                      privacyPolicyUrl: privacyPolicyUrl.trim() ? privacyPolicyUrl.trim() : null,
                      userDataDeletionUrl: userDataDeletionUrl.trim() ? userDataDeletionUrl.trim() : null,
                      category: category.trim() ? category.trim() : null,
                    });
                    setShowMeta(false);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="w-full px-3 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const data = await api.getIntegrations();
    setIntegrations(data);
    setIsLoading(false);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const result = await api.testIntegration(id);
    setTestingId(null);
    alert(result.success ? 'Conexión exitosa' : result.message);
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('¿Estás seguro de desconectar esta integración?')) {
      await api.disconnectIntegration(id);
      loadIntegrations();
    }
  };

  const handleUpdateMeta = async (
    id: string,
    patch: { appIconUrl?: string | null; privacyPolicyUrl?: string | null; userDataDeletionUrl?: string | null; category?: string | null },
  ) => {
    await api.updateIntegrationMetaRequirements(id, patch);
    await loadIntegrations();
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesFilter = filter === 'all' || integration.status === filter;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    disconnected: integrations.filter(i => i.status === 'disconnected').length,
    error: integrations.filter(i => i.status === 'error').length,
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
          <h1 className="font-display text-3xl font-bold text-frost-white mb-2">Integraciones</h1>
          <p className="text-ghost-white">Conecta tus herramientas favoritas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-matrix-green/10 border border-matrix-green text-matrix-green rounded-lg hover:bg-matrix-green/20 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Nueva Integración</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-ghost-white tracking-wider mb-1">TOTAL</p>
          <p className="font-display text-2xl font-bold text-frost-white">{stats.total}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-matrix-green tracking-wider mb-1">CONECTADAS</p>
          <p className="font-display text-2xl font-bold text-matrix-green">{stats.connected}</p>
        </div>
        <div className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-4">
          <p className="font-mono text-[10px] text-terminal-gray tracking-wider mb-1">DESCONECTADAS</p>
          <p className="font-display text-2xl font-bold text-ghost-white">{stats.disconnected}</p>
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
            placeholder="Buscar integraciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white focus:border-cyber-cyan focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'connected', 'disconnected', 'error'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-mono border rounded-lg transition-colors ${
                filter === f
                  ? 'bg-matrix-green/20 border-matrix-green text-matrix-green'
                  : 'bg-transparent border-terminal-gray/50 text-ghost-white hover:border-terminal-gray'
              }`}
            >
              {f === 'all' ? 'TODAS' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onTest={handleTest}
              onDisconnect={handleDisconnect}
              onUpdateMeta={handleUpdateMeta}
              isTesting={testingId === integration.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Plug className="w-16 h-16 text-terminal-gray mx-auto mb-4" />
          <p className="text-ghost-white mb-2">No se encontraron integraciones</p>
          <p className="text-sm text-terminal-gray">Ajusta los filtros o agrega una nueva integración</p>
        </div>
      )}
    </div>
  );
}
