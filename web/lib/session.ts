import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { requireEnv } from './env';

export type AppSession = {
  id: string;
  company_id: string | null;
  email: string;
  full_name: string;
  role: string;
  user_type: 'ADMIN' | 'WEB' | 'PDA';
  company_name?: string | null;
};

const cookieName = 'inventory_session';

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return crypto.createHmac('sha256', requireEnv('APP_SESSION_SECRET')).update(payload).digest('base64url');
}

export function sealSession(session: AppSession) {
  const payload = base64url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function unsealSession(value?: string): AppSession | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AppSession;
}

export async function setSession(session: AppSession) {
  const jar = await cookies();
  jar.set(cookieName, sealSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const jar = await cookies();
  return unsealSession(jar.get(cookieName)?.value);
}

export async function requireSession(allowed?: Array<AppSession['user_type']>) {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  if (allowed && !allowed.includes(session.user_type)) throw new Error('FORBIDDEN');
  return session;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(cookieName);
}
