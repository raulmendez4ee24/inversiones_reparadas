import type { Organization } from '../contexts/AuthContext';

// Types for API responses (shared with UI)
export interface DashboardOverview {
  kpis: {
    conversations: { value: number; change: number; trend: 'up' | 'down' };
    leads: { value: number; change: number; trend: 'up' | 'down' };
    appointments: { value: number; change: number; trend: 'up' | 'down' };
    roi: { value: number; change: number; trend: 'up' | 'down' };
    timeSaved: { value: number; unit: string };
    automationsActive: number;
  };
  systemStatus: 'healthy' | 'warning' | 'error';
  recentActivity: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type: 'automation' | 'task' | 'integration' | 'alert' | 'approval' | 'security';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  metadata?: Record<string, unknown>;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error' | 'warning';
  lastRun: string | null;
  nextRun: string | null;
  runCount: number;
  successRate: number;
  healthStatus: 'healthy' | 'warning' | 'error';
  config: {
    trigger: string;
    actions: string[];
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  schedule: string;
  lastRun: TaskRun | null;
  runHistory: TaskRun[];
  requiresApproval: boolean;
  createdAt: string;
}

export interface TaskRun {
  id: string;
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval' | 'queued';
  startedAt: string;
  completedAt: string | null;
  progress: number;
  steps: TaskStep[];
  evidence?: {
    before?: string;
    after?: string;
    screenshots?: string[];
    logs?: string[];
  };
}

export interface TaskStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  logs?: string[];
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string | null;
  healthStatus: 'healthy' | 'warning' | 'error';
  config: {
    endpoint?: string;
    features: string[];
    appIconUrl?: string | null;
    privacyPolicyUrl?: string | null;
    userDataDeletionUrl?: string | null;
    category?: string | null;
  };
  credentials: {
    hasCredentials: boolean;
    expiresAt?: string;
  };
  estimatedCost?: number;
}

export interface Approval {
  id: string;
  type: 'task_run' | 'integration_connect' | 'automation_edit';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  timestamp: string;
  ip: string;
  userAgent: string;
  severity: string;
  details?: Record<string, unknown>;
  organizationId: string;
}

export interface OrgUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
}

type JsonRecord = Record<string, unknown>;

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  let errPayload: unknown = null;
  try {
    errPayload = await res.json();
  } catch {
    // ignore
  }

  const code = (errPayload && typeof errPayload === 'object' && 'error' in errPayload) ? String((errPayload as any).error) : `HTTP_${res.status}`;
  const message =
    code === 'INVALID_CREDENTIALS' ? 'Credenciales inválidas' :
    code === 'INVALID_OTP' ? 'Código OTP inválido' :
    code === 'SESSION_EXPIRED' ? 'Sesión expirada' :
    code === 'UNAUTHENTICATED' ? 'Sesión requerida' :
    code === 'FORBIDDEN' ? 'Acceso denegado' :
    code === 'EMAIL_IN_USE' ? 'El email ya está registrado' :
    code === 'INVALID_RESET_TOKEN' ? 'Token inválido o expirado' :
    code === 'TASK_PAUSED' ? 'La misión está pausada' :
    'Error de servidor';

  throw new Error(message);
}

type TaskProgressUpdate = { runId: string; progress: number; status: string };
type TaskLogMessage = { runId: string; stepId: string; stepName: string; message: string; timestamp: string };

type StreamState = {
  es: EventSource | null;
  refs: number;
  activity: Set<(event: ActivityEvent) => void>;
  taskProgress: Set<(update: TaskProgressUpdate) => void>;
  taskLog: Set<(msg: TaskLogMessage) => void>;
};

const stream: StreamState = {
  es: null,
  refs: 0,
  activity: new Set(),
  taskProgress: new Set(),
  taskLog: new Set(),
};

function ensureStream() {
  if (stream.es) return;
  stream.es = new EventSource('/api/events/stream', { withCredentials: true });

  stream.es.addEventListener('activity', (ev) => {
    const data = JSON.parse((ev as MessageEvent).data) as ActivityEvent;
    for (const cb of stream.activity) cb(data);
  });

  stream.es.addEventListener('task_progress', (ev) => {
    const data = JSON.parse((ev as MessageEvent).data) as TaskProgressUpdate;
    for (const cb of stream.taskProgress) cb(data);
  });

  stream.es.addEventListener('task_log', (ev) => {
    const data = JSON.parse((ev as MessageEvent).data) as TaskLogMessage;
    for (const cb of stream.taskLog) cb(data);
  });
}

function releaseStream() {
  stream.refs = Math.max(0, stream.refs - 1);
  if (stream.refs > 0) return;
  stream.es?.close();
  stream.es = null;
}

export const api = {
  // Dashboard
  async getDashboardOverview(): Promise<DashboardOverview> {
    return requestJson<DashboardOverview>('/api/client/overview');
  },

  // Activity
  async getActivity(limit = 50): Promise<{ events: ActivityEvent[] }> {
    const qs = new URLSearchParams({ limit: String(limit) });
    return requestJson<{ events: ActivityEvent[] }>(`/api/client/activity?${qs.toString()}`);
  },

  // Automations / Workflows
  async getAutomations(): Promise<Automation[]> {
    const data = await requestJson<{ workflows: Automation[] }>('/api/client/workflows');
    return data.workflows;
  },

  async runAutomation(id: string): Promise<void> {
    await requestJson('/api/client/workflows/' + encodeURIComponent(id) + '/run', { method: 'POST' });
  },

  async toggleAutomation(id: string): Promise<void> {
    await requestJson('/api/client/workflows/' + encodeURIComponent(id) + '/toggle', { method: 'POST' });
  },

  async repairAutomation(id: string): Promise<void> {
    await requestJson('/api/client/workflows/' + encodeURIComponent(id) + '/repair', { method: 'POST' });
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    const data = await requestJson<{ tasks: Task[] }>('/api/client/tasks');
    return data.tasks;
  },

  async runTask(id: string): Promise<{ runId?: string; awaitingApproval?: boolean; approvalId?: string }> {
    return requestJson('/api/client/tasks/run', { method: 'POST', body: JSON.stringify({ taskId: id }) });
  },

  async createTask(input: { name: string; description: string; schedule: string; requiresApproval: boolean }): Promise<{ ok: boolean; taskId: string }> {
    return requestJson('/api/client/tasks', { method: 'POST', body: JSON.stringify(input) });
  },

  async toggleTaskPause(taskId: string): Promise<{ ok: boolean; isPaused: boolean }> {
    return requestJson('/api/client/tasks/' + encodeURIComponent(taskId) + '/toggle-pause', { method: 'POST' });
  },

  async getTaskRuns(taskId?: string): Promise<TaskRun[]> {
    const qs = new URLSearchParams();
    if (taskId) qs.set('taskId', taskId);
    const data = await requestJson<{ taskRuns: TaskRun[] }>(`/api/client/task-runs?${qs.toString()}`);
    return data.taskRuns;
  },

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    const data = await requestJson<{ integrations: Integration[] }>('/api/client/integrations');
    return data.integrations;
  },

  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    return requestJson('/api/client/integrations/' + encodeURIComponent(id) + '/test', { method: 'POST' });
  },

  async disconnectIntegration(id: string): Promise<void> {
    await requestJson('/api/client/integrations/' + encodeURIComponent(id) + '/disconnect', { method: 'POST' });
  },

  async updateIntegrationMetaRequirements(id: string, patch: {
    appIconUrl?: string | null;
    privacyPolicyUrl?: string | null;
    userDataDeletionUrl?: string | null;
    category?: string | null;
  }): Promise<void> {
    await requestJson('/api/client/integrations/' + encodeURIComponent(id) + '/config', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  // Approvals
  async getApprovals(): Promise<Approval[]> {
    const data = await requestJson<{ approvals: Approval[] }>('/api/client/approvals');
    return data.approvals;
  },

  async getOrgUsers(): Promise<{ users: OrgUser[] }> {
    return requestJson('/api/client/users');
  },

  async approveRequest(id: string): Promise<void> {
    await requestJson('/api/client/approve', { method: 'POST', body: JSON.stringify({ approvalId: id, decision: 'approve' }) });
  },

  async rejectRequest(id: string): Promise<void> {
    await requestJson('/api/client/approve', { method: 'POST', body: JSON.stringify({ approvalId: id, decision: 'reject' }) });
  },

  // Admin
  async getClients(): Promise<Organization[]> {
    const data = await requestJson<{ clients: Organization[] }>('/api/admin/clients');
    return data.clients;
  },

  async getAdminMetrics(): Promise<JsonRecord> {
    return requestJson('/api/admin/metrics');
  },

  async getAdminLogs(): Promise<{ logs: AuditLog[] }> {
    return requestJson('/api/admin/logs');
  },

  async getAuditLogs(limit = 50): Promise<{ logs: AuditLog[] }> {
    const qs = new URLSearchParams({ limit: String(limit) });
    return requestJson(`/api/client/audit-logs?${qs.toString()}`);
  },

  async searchAdminUsers(q: string, orgId?: string): Promise<{ users: Array<{ id: string; email: string; name: string; systemRole: string; memberships: Array<{ organizationId: string; role: string }> }> }> {
    const qs = new URLSearchParams();
    qs.set('q', q);
    if (orgId) qs.set('orgId', orgId);
    return requestJson(`/api/admin/users?${qs.toString()}`);
  },

  async impersonate(userId: string | null, organizationId: string | null): Promise<void> {
    await requestJson('/api/admin/impersonate', { method: 'POST', body: JSON.stringify({ userId, organizationId }) });
  },

  // Real-time
  subscribeToUpdates(callback: (event: ActivityEvent) => void): () => void {
    ensureStream();
    stream.refs += 1;
    stream.activity.add(callback);
    return () => {
      stream.activity.delete(callback);
      releaseStream();
    };
  },

  subscribeToTaskRunUpdates(handlers: { onProgress?: (u: TaskProgressUpdate) => void; onLog?: (m: TaskLogMessage) => void }): () => void {
    ensureStream();
    stream.refs += 1;
    if (handlers.onProgress) stream.taskProgress.add(handlers.onProgress);
    if (handlers.onLog) stream.taskLog.add(handlers.onLog);
    return () => {
      if (handlers.onProgress) stream.taskProgress.delete(handlers.onProgress);
      if (handlers.onLog) stream.taskLog.delete(handlers.onLog);
      releaseStream();
    };
  },
};

export default api;
