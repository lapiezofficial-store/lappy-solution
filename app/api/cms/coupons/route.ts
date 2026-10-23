import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { INITIAL_COUPONS, Coupon } from '@/data/coupons';

// In-memory fallback cache for development/offline resilience
let memoryCoupons: Coupon[] = [...INITIAL_COUPONS];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validateCode = searchParams.get('validate')?.trim().toUpperCase();
    const orderAmount = Number(searchParams.get('amount') || 0);

    // 1. Fetch from Database if available
    let dbCoupons: Coupon[] = [];
    try {
      const records = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (records && records.length > 0) {
        dbCoupons = records.map((r) => ({
          id: r.id,
          code: r.code,
          title: r.title,
          discountType: (r.discountType === 'fixed' ? 'fixed' : 'percentage') as 'fixed' | 'percentage',
          discountValue: r.discountValue,
          minOrder: r.minOrder,
          maxDiscount: r.maxDiscount ?? undefined,
          audience: (r.audience === 'premium' ? 'premium' : r.audience === 'normal' ? 'normal' : 'all') as 'all' | 'normal' | 'premium',
          description: r.description || '',
          isActive: r.isActive,
          validUntil: r.validUntil || undefined,
          usageLimit: r.usageLimit ?? undefined,
          timesUsed: r.timesUsed,
          createdAt: r.createdAt.toISOString(),
        }));
      } else {
        // Auto-seed default initial coupons to database
        for (const initC of INITIAL_COUPONS) {
          await prisma.coupon.upsert({
            where: { code: initC.code },
            create: {
              id: initC.id,
              code: initC.code,
              title: initC.title,
              discountType: initC.discountType,
              discountValue: initC.discountValue,
              minOrder: initC.minOrder,
              maxDiscount: initC.maxDiscount,
              audience: initC.audience,
              description: initC.description,
              isActive: initC.isActive,
              validUntil: initC.validUntil,
              timesUsed: initC.timesUsed || 0,
            },
            update: {},
          }).catch(() => null);
        }
        dbCoupons = [...INITIAL_COUPONS];
      }
    } catch {
      // Fallback to memoryCoupons if DB is paused or unreachable
      dbCoupons = memoryCoupons;
    }

    // If specific coupon validation requested
    if (validateCode) {
      const found = dbCoupons.find((c) => c.code === validateCode && c.isActive);
      if (!found) {
        return NextResponse.json({ valid: false, error: 'Invalid or inactive coupon code.' }, { status: 404 });
      }

      if (found.validUntil && new Date(found.validUntil) < new Date()) {
        return NextResponse.json({ valid: false, error: 'This coupon code has expired.' }, { status: 400 });
      }

      if (found.usageLimit && (found.timesUsed ?? 0) >= found.usageLimit) {
        return NextResponse.json({ valid: false, error: 'This coupon has reached its maximum usage limit.' }, { status: 400 });
      }

      if (orderAmount < found.minOrder) {
        return NextResponse.json({
          valid: false,
          error: `Minimum order amount to apply ${found.code} is ₹${found.minOrder.toLocaleString('en-IN')}.`,
        }, { status: 400 });
      }

      let discount = 0;
      if (found.discountType === 'percentage') {
        discount = Math.round((orderAmount * found.discountValue) / 100);
        if (found.maxDiscount && discount > found.maxDiscount) {
          discount = found.maxDiscount;
        }
      } else {
        discount = Math.min(found.discountValue, orderAmount);
      }

      return NextResponse.json({
        valid: true,
        coupon: found,
        discountAmount: discount,
      });
    }

    return NextResponse.json({ coupons: dbCoupons });
  } catch (error) {
    console.error('Failed to get coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons', coupons: memoryCoupons }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { code, title, discountType, discountValue, minOrder, maxDiscount, audience, description, validUntil, usageLimit } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Coupon code and discount value are required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      title: title || cleanCode,
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(discountValue) || 0,
      minOrder: Number(minOrder) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      audience: audience === 'premium' ? 'premium' : audience === 'normal' ? 'normal' : 'all',
      description: description || '',
      isActive: true,
      validUntil: validUntil || undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    };

    // Save in Database
    try {
      await prisma.coupon.create({
        data: {
          id: newCoupon.id,
          code: newCoupon.code,
          title: newCoupon.title,
          discountType: newCoupon.discountType,
          discountValue: newCoupon.discountValue,
          minOrder: newCoupon.minOrder,
          maxDiscount: newCoupon.maxDiscount,
          audience: newCoupon.audience,
          description: newCoupon.description,
          isActive: newCoupon.isActive,
          validUntil: newCoupon.validUntil,
          usageLimit: newCoupon.usageLimit,
          timesUsed: 0,
        },
      });
    } catch (dbErr: any) {
      if (dbErr?.code === 'P2002') {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
      }
      console.warn('Coupon DB save fallback:', dbErr?.message);
    }

    // Also update in-memory cache
    memoryCoupons = [newCoupon, ...memoryCoupons.filter((c) => c.code !== cleanCode)];

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { id, code, title, discountType, discountValue, minOrder, maxDiscount, audience, description, isActive, validUntil, usageLimit } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const cleanCode = code ? String(code).trim().toUpperCase() : undefined;

    let updatedCoupon: Coupon | null = null;

    try {
      const record = await prisma.coupon.update({
        where: { id },
        data: {
          ...(cleanCode ? { code: cleanCode } : {}),
          ...(title !== undefined ? { title } : {}),
          ...(discountType !== undefined ? { discountType: discountType === 'fixed' ? 'fixed' : 'percentage' } : {}),
          ...(discountValue !== undefined ? { discountValue: Number(discountValue) } : {}),
          ...(minOrder !== undefined ? { minOrder: Number(minOrder) } : {}),
          ...(maxDiscount !== undefined ? { maxDiscount: maxDiscount ? Number(maxDiscount) : null } : {}),
          ...(audience !== undefined ? { audience } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(validUntil !== undefined ? { validUntil } : {}),
          ...(usageLimit !== undefined ? { usageLimit: usageLimit ? Number(usageLimit) : null } : {}),
        },
      });

      updatedCoupon = {
        id: record.id,
        code: record.code,
        title: record.title,
        discountType: (record.discountType === 'fixed' ? 'fixed' : 'percentage') as 'fixed' | 'percentage',
        discountValue: record.discountValue,
        minOrder: record.minOrder,
        maxDiscount: record.maxDiscount ?? undefined,
        audience: (record.audience === 'premium' ? 'premium' : record.audience === 'normal' ? 'normal' : 'all') as 'all' | 'normal' | 'premium',
        description: record.description || '',
        isActive: record.isActive,
        validUntil: record.validUntil || undefined,
        usageLimit: record.usageLimit ?? undefined,
        timesUsed: record.timesUsed,
        createdAt: record.createdAt.toISOString(),
      };
    } catch {
      // Memory fallback
      const idx = memoryCoupons.findIndex((c) => c.id === id);
      if (idx !== -1) {
        memoryCoupons[idx] = {
          ...memoryCoupons[idx],
          ...(cleanCode ? { code: cleanCode } : {}),
          ...(title !== undefined ? { title } : {}),
          ...(discountType !== undefined ? { discountType } : {}),
          ...(discountValue !== undefined ? { discountValue: Number(discountValue) } : {}),
          ...(minOrder !== undefined ? { minOrder: Number(minOrder) } : {}),
          ...(maxDiscount !== undefined ? { maxDiscount: maxDiscount ? Number(maxDiscount) : undefined } : {}),
          ...(audience !== undefined ? { audience } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(validUntil !== undefined ? { validUntil } : {}),
        };
        updatedCoupon = memoryCoupons[idx];
      }
    }

    if (!updatedCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: updatedCoupon });
  } catch (error: any) {
    console.error('Failed to update coupon:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    try {
      await prisma.coupon.delete({ where: { id } });
    } catch {}

    memoryCoupons = memoryCoupons.filter((c) => c.id !== id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
