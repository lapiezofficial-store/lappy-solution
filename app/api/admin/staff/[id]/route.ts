import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const updateData: any = {};
    if (typeof body.name === 'string' && body.name.trim()) updateData.name = body.name.trim();
    if (typeof body.phone === 'string' && body.phone.trim()) {
      updateData.phone = body.phone.trim().replace(/\D/g, '').slice(-10);
    }
    if (typeof body.role === 'string' && ['COUNTER', 'TECHNICIAN', 'MANAGER'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (typeof body.canHandleOrders === 'boolean') updateData.canHandleOrders = body.canHandleOrders;
    if (typeof body.canHandleWarranty === 'boolean') updateData.canHandleWarranty = body.canHandleWarranty;
    if (typeof body.isBlocked === 'boolean') updateData.isBlocked = body.isBlocked;
    if (typeof body.password === 'string' && body.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(body.password.trim(), 10);
    }

    const updated = await prisma.staffUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        staffCode: true,
        name: true,
        phone: true,
        role: true,
        canHandleOrders: true,
        canHandleWarranty: true,
        isBlocked: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await prisma.staffUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}

