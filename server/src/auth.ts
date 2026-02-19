import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { env } from './env.js';
import { hasPermission, permissionsForRoles, type Permission } from './permissions.js';
import { randomToken, sha256 } from './security.js';

export const SESSION_COOKIE_NAME = 'kanlogic_session';

export type AuthedRequest = Request & {
  auth: {
    sessionId: string;
    userId: string;
    organizationId: string;
    systemRole: 'NONE' | 'SUPER_ADMIN';
    orgRole: 'ORG_ADMIN' | 'ORG_USER' | null;
    permissions: Permission[];
    isImpersonating: boolean;
    impersonatorUserId: string | null;
  };
};

function cookieOptions() {
  const isSecure = env.COOKIE_SECURE;
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...cookieOptions(),
  });
}

export async function createSession(params: { userId: string; organizationId: string }) {
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId: params.userId,
      organizationId: params.organizationId,
      expiresAt,
    },
  });
  return { session, token };
}

export async function destroySession(token: string) {
  const tokenHash = sha256(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token || typeof token !== 'string') return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const tokenHash = sha256(token);
  const session = await prisma.session.findUnique({ where: { tokenHash } });
  if (!session) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  const baseUserId = session.userId;
  const effectiveUserId = session.impersonatedUserId ?? baseUserId;
  const effectiveOrgId = session.impersonatedOrgId ?? session.organizationId;

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: effectiveUserId } }),
    prisma.membership.findUnique({
      where: { userId_organizationId: { userId: effectiveUserId, organizationId: effectiveOrgId } },
    }),
  ]);

  if (!user || !user.isActive) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  if (user.systemRole !== 'SUPER_ADMIN' && !membership) {
    return res.status(403).json({ error: 'NO_ORG_ACCESS' });
  }

  const orgRole = membership?.role ?? null;
  const permissions = permissionsForRoles(user.systemRole, orgRole);

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  (req as AuthedRequest).auth = {
    sessionId: session.id,
    userId: effectiveUserId,
    organizationId: effectiveOrgId,
    systemRole: user.systemRole,
    orgRole,
    permissions,
    isImpersonating: session.impersonatedUserId != null,
    impersonatorUserId: session.impersonatedUserId != null ? baseUserId : null,
  };
  next();
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as AuthedRequest).auth;
    if (!auth) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!hasPermission(auth.permissions, permission)) return res.status(403).json({ error: 'FORBIDDEN' });
    next();
  };
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
