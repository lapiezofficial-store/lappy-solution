import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { hasStaffOrAdminSession } from '@/lib/staffAuth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateClaimId(): string {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WAR-${yearSuffix}-${random}`;
}

async function uploadImageIfBase64(dataUriOrUrl?: string | null, folder: string = 'warranty-bills'): Promise<string | null> {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') return null;
  if (!dataUriOrUrl.startsWith('data:image/')) return dataUriOrUrl; // Already a remote URL
  try {
    const res = await uploadToCloudinary(dataUriOrUrl, folder);
    return res.url;
  } catch (err) {
    console.warn('Cloudinary upload fallback to inline storage:', err);
    return dataUriOrUrl;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get('claimId')?.trim();
    const query = searchParams.get('q')?.trim();
    const status = searchParams.get('status')?.trim();
    const channel = searchParams.get('channel')?.trim();

    // 1. Single claim lookup by claimId (publicly accessible for customer tracking)
    if (claimId) {
      const claim = await prisma.warrantyClaim.findUnique({
        where: { claimId },
      });
      if (!claim) {
        return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, claim });
    }

    // 2. Public lookup by customer phone or device serial number
    const isPublicSearch = searchParams.get('publicLookup') === 'true';
    if (isPublicSearch && query) {
      const claims = await prisma.warrantyClaim.findMany({
        where: {
          OR: [
            { customerPhone: { contains: query } },
            { serialNumber: { equals: query, mode: 'insensitive' } },
            { claimId: { equals: query, mode: 'insensitive' } },
            { invoiceNumber: { equals: query, mode: 'insensitive' } },
            { orderId: { equals: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, claims });
    }

    // 3. Admin & Staff full management list
    const auth = hasStaffOrAdminSession(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized to view warranty claims list' }, { status: 401 });
    }

    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (channel && channel !== 'ALL') {
      whereClause.purchaseChannel = channel;
    }
    if (query) {
      whereClause.OR = [
        { claimId: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query } },
        { serialNumber: { contains: query, mode: 'insensitive' } },
        { productName: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { invoiceNumber: { contains: query, mode: 'insensitive' } },
        { orderId: { contains: query, mode: 'insensitive' } },
      ];
    }

    const claims = await prisma.warrantyClaim.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const allClaims = await prisma.warrantyClaim.findMany({
      select: { status: true, purchaseChannel: true, verificationStatus: true },
    });

    const metrics = {
      total: allClaims.length,
      onlineCount: allClaims.filter((c) => c.purchaseChannel === 'ONLINE_WEBSITE').length,
      offlineCount: allClaims.filter((c) => c.purchaseChannel === 'OFFLINE_STORE').length,
      pastCount: allClaims.filter((c) => c.purchaseChannel === 'PAST_LEGACY').length,
      pendingVerification: allClaims.filter((c) => c.verificationStatus === 'PENDING_VERIFICATION').length,
      received: allClaims.filter((c) => c.status === 'RECEIVED').length,
      underInspection: allClaims.filter((c) => c.status === 'UNDER_INSPECTION').length,
      sentToBrand: allClaims.filter((c) => c.status === 'SENT_TO_BRAND').length,
      repairedReady: allClaims.filter((c) => c.status === 'REPAIRED_READY').length,
      deliveredClosed: allClaims.filter((c) => c.status === 'DELIVERED_CLOSED').length,
      rejected: allClaims.filter((c) => c.status === 'REJECTED').length,
    };

    return NextResponse.json({ success: true, metrics, claims });
  } catch (error) {
    console.error('Error fetching warranty claims:', error);
    return NextResponse.json({ error: 'Failed to fetch warranty claims' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const rawPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const customerPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
    const issueDescription = typeof body.issueDescription === 'string' ? body.issueDescription.trim() : '';
    const purchaseChannel = body.purchaseChannel || 'OFFLINE_STORE'; // ONLINE_WEBSITE | OFFLINE_STORE | PAST_LEGACY
    const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim().toUpperCase() : null;
    const invoiceNumber = typeof body.invoiceNumber === 'string' ? body.invoiceNumber.trim() : null;
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : null;

    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: 'Please enter customer name (नाम भरें)' }, { status: 400 });
    }
    if (!customerPhone || customerPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }
    if (!productName) {
      return NextResponse.json({ error: 'Please enter product name (सामान का नाम)' }, { status: 400 });
    }
    if (!issueDescription) {
      return NextResponse.json({ error: 'Please describe the fault or issue (समस्या लिखें)' }, { status: 400 });
    }

    // Required Proof Rules:
    // For Offline Showroom Purchase: Needs Invoice Number OR Uploaded Bill Copy
    if (purchaseChannel === 'OFFLINE_STORE' && !invoiceNumber && !body.billDocumentUrl) {
      return NextResponse.json({
        error: 'Showroom purchase requires Bill / Invoice Number or Bill Copy photo. (दुकान का बिल नंबर या बिल की फोटो आवश्यक है)'
      }, { status: 400 });
    }

    // For Past Customers: Needs Old Bill / Serial sticker photo OR Bill Number
    if (purchaseChannel === 'PAST_LEGACY' && !invoiceNumber && !body.billDocumentUrl && !serialNumber) {
      return NextResponse.json({
        error: 'Past customer claim requires Old Bill / Cash Memo photo or Device Serial Number. (पुराने बिल की फोटो या सीरियल नंबर आवश्यक है)'
      }, { status: 400 });
    }

    const auth = hasStaffOrAdminSession(request);
    const isAdminOrStaff = auth.authorized;
    const staffName = body.staffName?.trim() || (isAdminOrStaff ? (auth.staffName || 'Admin Desk') : 'Customer Online');
    const verificationStatus = isAdminOrStaff ? 'VERIFIED' : 'PENDING_VERIFICATION';

    // Upload bill document & device photo if base64
    const [billDocumentUrl, devicePhotoUrl] = await Promise.all([
      uploadImageIfBase64(body.billDocumentUrl, 'warranty-bills'),
      uploadImageIfBase64(body.devicePhotoUrl, 'warranty-devices'),
    ]);

    // Generate unique claim ID with retry if collision
    let claimId = generateClaimId();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.warrantyClaim.findUnique({ where: { claimId } });
      if (!exists) break;
      claimId = generateClaimId();
      attempts++;
    }

    const claim = await prisma.warrantyClaim.create({
      data: {
        claimId,
        customerName,
        customerPhone,
        customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail.trim() : null,
        customerAddress: typeof body.customerAddress === 'string' ? body.customerAddress.trim() : null,
        productName,
        productCategory: body.productCategory || 'Laptop',
        brand: body.brand || 'Other',
        modelNumber: body.modelNumber?.trim() || null,
        serialNumber,
        orderId,
        invoiceNumber,
        purchaseDate: body.purchaseDate?.trim() || null,
        warrantyType: body.warrantyType || 'Brand Warranty',
        warrantyPeriod: body.warrantyPeriod || '1 Year',
        issueDescription,
        faultCategory: body.faultCategory || 'Hardware',
        physicalCondition: body.physicalCondition?.trim() || 'Normal wear & tear',
        accessoriesReceived: body.accessoriesReceived?.trim() || 'Device only',
        purchaseChannel,
        billDocumentUrl,
        devicePhotoUrl,
        verificationStatus,
        status: body.status || 'RECEIVED',
        serviceCost: Number(body.serviceCost) || 0,
        estimatedReadyDate: body.estimatedReadyDate?.trim() || null,
        resolutionNotes: body.resolutionNotes?.trim() || null,
        technicianNotes: body.technicianNotes?.trim() || null,
        staffName,
        brandRmaNumber: body.brandRmaNumber?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      claim,
      message: `Warranty claim #${claimId} registered successfully.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    return NextResponse.json({ error: 'Failed to register warranty claim' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = hasStaffOrAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized to update warranty claims' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.id) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const existing = await prisma.warrantyClaim.findUnique({
      where: { id: body.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Warranty claim record not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.verificationStatus !== undefined) dataToUpdate.verificationStatus = body.verificationStatus;
    if (body.purchaseChannel !== undefined) dataToUpdate.purchaseChannel = body.purchaseChannel;
    if (body.status === 'DELIVERED_CLOSED' && !existing.handedOverDate) {
      dataToUpdate.handedOverDate = new Date();
    }
    if (body.technicianNotes !== undefined) dataToUpdate.technicianNotes = body.technicianNotes;
    if (body.resolutionNotes !== undefined) dataToUpdate.resolutionNotes = body.resolutionNotes;
    if (body.brandRmaNumber !== undefined) dataToUpdate.brandRmaNumber = body.brandRmaNumber;
    if (body.serviceCost !== undefined) dataToUpdate.serviceCost = Number(body.serviceCost) || 0;
    if (body.estimatedReadyDate !== undefined) dataToUpdate.estimatedReadyDate = body.estimatedReadyDate;
    if (body.accessoriesReceived !== undefined) dataToUpdate.accessoriesReceived = body.accessoriesReceived;
    if (body.physicalCondition !== undefined) dataToUpdate.physicalCondition = body.physicalCondition;
    if (body.serialNumber !== undefined) dataToUpdate.serialNumber = body.serialNumber.trim().toUpperCase();
    if (body.invoiceNumber !== undefined) dataToUpdate.invoiceNumber = body.invoiceNumber;
    if (body.purchaseDate !== undefined) dataToUpdate.purchaseDate = body.purchaseDate;
    if (body.staffName !== undefined) dataToUpdate.staffName = body.staffName;

    // Handle bill / device photo update
    if (body.billDocumentUrl && body.billDocumentUrl.startsWith('data:image/')) {
      dataToUpdate.billDocumentUrl = await uploadImageIfBase64(body.billDocumentUrl, 'warranty-bills');
    }
    if (body.devicePhotoUrl && body.devicePhotoUrl.startsWith('data:image/')) {
      dataToUpdate.devicePhotoUrl = await uploadImageIfBase64(body.devicePhotoUrl, 'warranty-devices');
    }

    const updated = await prisma.warrantyClaim.update({
      where: { id: body.id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      claim: updated,
      message: `Claim #${updated.claimId} updated successfully.`,
    });
  } catch (error) {
    console.error('Error updating warranty claim:', error);
    return NextResponse.json({ error: 'Failed to update warranty claim' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Only Super Admin can delete warranty claims' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    await prisma.warrantyClaim.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Warranty claim deleted' });
  } catch (error) {
    console.error('Error deleting warranty claim:', error);
    return NextResponse.json({ error: 'Failed to delete warranty claim' }, { status: 500 });
  }
}
