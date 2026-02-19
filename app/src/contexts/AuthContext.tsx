import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ORG_USER';

export interface Organization {
  id: string;
  name: string;
  plan: 'starter' | 'growth' | 'commerce' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization: Organization;
  permissions: string[];
  lastLogin: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestLoginOTP: (email: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  register: (email: string, password: string, name: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canImpersonate: () => boolean;
  impersonateUser: (userId: string, organizationId?: string | null) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (res.ok) return (await res.json()) as T;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }
  const code = payload && typeof payload === 'object' && 'error' in payload ? String((payload as any).error) : `HTTP_${res.status}`;
  const message =
    code === 'INVALID_CREDENTIALS' ? 'Credenciales inválidas' :
    code === 'INVALID_OTP' ? 'Código OTP inválido' :
    code === 'EMAIL_IN_USE' ? 'El email ya está registrado' :
    code === 'INVALID_RESET_TOKEN' ? 'Token inválido o expirado' :
    code === 'NO_ORG_ACCESS' ? 'No tienes acceso a esta organización' :
    'Error de servidor';
  throw new Error(message);
}

async function fetchMe(): Promise<{ user: User; isImpersonating: boolean }> {
  return requestJson<{ user: User; isImpersonating: boolean }>('/api/auth/me');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me.user);
        setIsImpersonating(me.isImpersonating);
      } catch {
        if (cancelled) return;
        setUser(null);
        setIsImpersonating(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await requestJson('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const me = await fetchMe();
      setUser(me.user);
      setIsImpersonating(me.isImpersonating);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLoginOTP = async (email: string) => {
    await requestJson('/api/auth/login/otp/start', { method: 'POST', body: JSON.stringify({ email }) });
  };

  const loginWithOTP = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      await requestJson('/api/auth/login/otp/verify', { method: 'POST', body: JSON.stringify({ email, code: otp }) });
      const me = await fetchMe();
      setUser(me.user);
      setIsImpersonating(me.isImpersonating);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, orgName: string) => {
    setIsLoading(true);
    try {
      await requestJson('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, orgName }) });
      const me = await fetchMe();
      setUser(me.user);
      setIsImpersonating(me.isImpersonating);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await requestJson('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsImpersonating(false);
  };

  const requestPasswordReset = async (email: string) => {
    await requestJson('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });
  };

  const resetPassword = async (token: string, _newPassword: string) => {
    await requestJson('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password: _newPassword }) });
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const canImpersonate = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const impersonateUser = async (userId: string, organizationId?: string | null) => {
    if (!canImpersonate()) throw new Error('No tienes permiso para impersonar');
    await requestJson('/api/admin/impersonate', { method: 'POST', body: JSON.stringify({ userId, organizationId: organizationId ?? null }) });
    const me = await fetchMe();
    setUser(me.user);
    setIsImpersonating(me.isImpersonating);
  };

  const stopImpersonation = async () => {
    await requestJson('/api/admin/impersonate', { method: 'POST', body: JSON.stringify({ userId: null, organizationId: null }) });
    const me = await fetchMe();
    setUser(me.user);
    setIsImpersonating(me.isImpersonating);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      requestLoginOTP,
      loginWithOTP,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      hasPermission,
      canImpersonate,
      impersonateUser,
      stopImpersonation,
      isImpersonating,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ children, permission }: { children: ReactNode; permission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-ghost-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login would happen here
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-ghost-white mb-4">Sesión requerida</p>
          <a href="/#/login" className="text-cyber-cyan hover:underline">Ir al login</a>
        </div>
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-error-crimson mb-2">⛔ ACCESO DENEGADO</p>
          <p className="font-mono text-xs text-ghost-white">No tienes permiso para acceder a esta sección</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
