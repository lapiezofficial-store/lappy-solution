import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hasAdminSession, verifyAdminPassword } from '@/lib/adminAuth';

const STAFF_COOKIE_NAME = 'ls_staff_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for showroom counter staff
const FALLBACK_PIN = '1234';

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'lappy-solution-super-secure-secret-key-32chars-min-2026';
}

function sanitize(str: string): string {
  return (str || '').replace(/[\r\n\t]/g, '').trim();
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function verifyStaffPin(pinOrPassword: string): Promise<boolean> {
  const clean = sanitize(pinOrPassword);
  if (!clean) return false;

  // 1. Also allow Super Admin master password to authenticate on staff terminal
  const isAdminValid = await verifyAdminPassword(clean);
  if (isAdminValid) return true;

  // 2. Check process.env.STAFF_PIN
  const envPin = sanitize(process.env.STAFF_PIN || '');
  if (envPin && (safeCompare(clean, envPin) || clean === envPin)) {
    return true;
  }

  // 3. Check DB SiteSettings.staffPin
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
      select: { staffPin: true },
    });
    const dbPin = sanitize(settings?.staffPin || FALLBACK_PIN);
    if (safeCompare(clean, dbPin) || clean === dbPin) {
      return true;
    }
  } catch (err) {
    console.error('Error fetching staffPin from database:', err);
  }

  // 4. Default counter pin check
  return clean === FALLBACK_PIN;
}

export interface StaffSessionDetails {
  staffId?: string;
  staffCode?: string;
  staffName?: string;
  role?: string;
  canHandleOrders?: boolean;
  canHandleWarranty?: boolean;
}

export async function verifyStaffCredentials(identifier: string, password: string): Promise<{
  ok: boolean;
  error?: string;
  staff?: {
    id: string;
    staffCode: string;
    name: string;
    phone: string;
    role: string;
    canHandleOrders: boolean;
    canHandleWarranty: boolean;
  };
}> {
  const cleanId = sanitize(identifier);
  const cleanPass = sanitize(password);
  if (!cleanId || !cleanPass) {
    return { ok: false, error: 'Staff ID/Phone aur Password dalein.' };
  }

  const digitsOnly = cleanId.replace(/\D/g, '').slice(-10);
  try {
    const staff = await prisma.staffUser.findFirst({
      where: {
        OR: [
          { staffCode: cleanId.toUpperCase() },
          ...(digitsOnly ? [{ phone: digitsOnly }] : []),
          { phone: cleanId },
        ],
      },
    });

    if (!staff) {
      return { ok: false, error: 'Staff ID ya Phone number nahi mila.' };
    }

    if (staff.isBlocked) {
      return { ok: false, error: 'Aapka Staff ID Admin dwara block kar diya gaya hai.' };
    }

    const match = await bcrypt.compare(cleanPass, staff.password);
    if (!match) {
      return { ok: false, error: 'Galat password. Kripya sahi password dalein.' };
    }

    await prisma.staffUser.update({
      where: { id: staff.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});

    return {
      ok: true,
      staff: {
        id: staff.id,
        staffCode: staff.staffCode,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        canHandleOrders: staff.canHandleOrders,
        canHandleWarranty: staff.canHandleWarranty,
      },
    };
  } catch (err) {
    console.error('Staff credential verification error:', err);
    return { ok: false, error: 'Verification failed' };
  }
}

export function createStaffSession(staffName: string = 'Staff Desk', details: StaffSessionDetails = {}): string {
  const secret = getSecret();
  const payload = Buffer.from(
    JSON.stringify({
      role: details.role || 'staff',
      name: staffName,
      staffId: details.staffId || undefined,
      staffCode: details.staffCode || undefined,
      canHandleOrders: details.canHandleOrders ?? true,
      canHandleWarranty: details.canHandleWarranty ?? true,
      exp: Date.now() + SESSION_TTL_MS,
    })
  ).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyStaffSessionToken(token?: string | null): { isValid: boolean } & StaffSessionDetails {
  if (!token || typeof token !== 'string') return { isValid: false };

  const secret = getSecret();
  const parts = token.split('.');
  if (parts.length !== 2) return { isValid: false };
  const [payload, signature] = parts;
  if (!payload || !signature) return { isValid: false };

  const expected = sign(payload, secret);
  if (!safeCompare(signature, expected)) return { isValid: false };

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      name?: string;
      staffId?: string;
      staffCode?: string;
      canHandleOrders?: boolean;
      canHandleWarranty?: boolean;
      exp?: number;
    };
    if (
      session.role &&
      typeof session.exp === 'number' &&
      session.exp > Date.now()
    ) {
      return {
        isValid: true,
        staffName: session.name || 'Staff Desk',
        staffId: session.staffId,
        staffCode: session.staffCode,
        role: session.role,
        canHandleOrders: session.canHandleOrders ?? true,
        canHandleWarranty: session.canHandleWarranty ?? true,
      };
    }
  } catch {
    return { isValid: false };
  }

  return { isValid: false };
}

export function hasStaffOrAdminSession(request: NextRequest | Request): { authorized: boolean } & StaffSessionDetails {
  // If request has admin session, automatically authorize
  if (hasAdminSession(request)) {
    return {
      authorized: true,
      staffName: 'Super Admin',
      role: 'ADMIN',
      canHandleOrders: true,
      canHandleWarranty: true,
    };
  }

  // Check header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    const result = verifyStaffSessionToken(token);
    if (result.isValid) return { authorized: true, ...result };
  }

  // Check x-staff-token header
  const xStaffToken = request.headers.get('x-staff-token');
  if (xStaffToken) {
    const result = verifyStaffSessionToken(xStaffToken.trim());
    if (result.isValid) return { authorized: true, ...result };
  }

  // Check cookie ls_staff_session
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|; )${STAFF_COOKIE_NAME}=([^;]+)`));
    const cookie = match?.[1];
    if (cookie) {
      const result = verifyStaffSessionToken(cookie);
      if (result.isValid) return { authorized: true, ...result };
    }
  }

  return { authorized: false };
}

export const staffSessionCookie = {
  name: STAFF_COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  },
};
