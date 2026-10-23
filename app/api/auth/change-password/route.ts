import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession, verifyAdminPassword, validatePasswordPolicy, adminSessionCookie, createAdminSession, hashPassword } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const isAuthed = hasAdminSession(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body.newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }

    const { currentPassword, newPassword } = body;

    // If not already in an active session, current password verification is mandatory
    if (!isAuthed) {
      if (!currentPassword || !(await verifyAdminPassword(currentPassword))) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }
    } else if (currentPassword) {
      // If user supplied current password, verify it
      const isValidCurrent = await verifyAdminPassword(currentPassword);
      if (!isValidCurrent) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }
    }

    // Validate 8-14 characters mixed policy
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) {
      return NextResponse.json({ error: policy.error }, { status: 400 });
    }

    // Hash new password with Bcrypt (work factor 12)
    const hashedPassword = await hashPassword(newPassword.trim());

    // Save hashed password in database
    try {
      await prisma.siteSettings.upsert({
        where: { id: 'default' },
        update: { adminPassword: hashedPassword },
        create: { id: 'default', adminPassword: hashedPassword }
      });
    } catch (dbErr) {
      console.warn('DB note when saving admin password in SiteSettings:', dbErr);
    }

    // Also update in-memory active cache
    const { setRuntimeAdminPassword } = await import('@/lib/adminAuth');
    setRuntimeAdminPassword(hashedPassword);

    const response = NextResponse.json({
      success: true,
      message: 'Admin password updated successfully! (8-14 characters mixed policy enforced)'
    });

    // Refresh session cookie
    response.cookies.set(adminSessionCookie.name, createAdminSession(), adminSessionCookie.options);
    return response;
  } catch (error: any) {
    console.error('Error in change-password route:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update password' }, { status: 500 });
  }
}
