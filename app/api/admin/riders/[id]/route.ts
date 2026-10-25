import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PATCH: Update rider status (Approve/Reject, Block/Unblock, Online/Offline, Edit Details)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      isBlocked, blockReason, 
      approvalStatus, rejectionReason,
      isOnline, name, phone, email, 
      vehicleType, vehicleNumber, dlNumber, city, emergencyContact,
      commissionPerOrder, password, 
      bankAccountNo, bankIfsc, bankUpi 
    } = body;

    const updateData: any = {};
    if (typeof isBlocked === 'boolean') {
      updateData.isBlocked = isBlocked;
      if (blockReason !== undefined) updateData.blockReason = blockReason;
    }
    if (approvalStatus) {
      updateData.approvalStatus = approvalStatus;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    }
    if (typeof isOnline === 'boolean') updateData.isOnline = isOnline;
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim().replace(/[^0-9]/g, '');
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber ? vehicleNumber.trim().toUpperCase() : null;
    if (dlNumber !== undefined) updateData.dlNumber = dlNumber ? dlNumber.trim().toUpperCase() : null;
    if (city !== undefined) updateData.city = city ? city.trim() : 'Garhwa';
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (commissionPerOrder !== undefined) updateData.commissionPerOrder = Number(commissionPerOrder);
    
    if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo;
    if (bankIfsc !== undefined) updateData.bankIfsc = bankIfsc;
    if (bankUpi !== undefined) updateData.bankUpi = bankUpi;

    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.rider.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...sanitized } = updated;
    return NextResponse.json({ success: true, rider: sanitized });
  } catch (error: any) {
    console.error('Error updating rider:', error);
    return NextResponse.json({ error: 'Failed to update rider: ' + error.message }, { status: 500 });
  }
}

// DELETE: Remove Rider
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if rider has active undelivered orders
    const activeOrders = await prisma.order.count({
      where: {
        riderId: id,
        orderStatus: { in: ['Out For Delivery', 'Ready'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json({ 
        error: `Yeh rider delete nahi ho sakta kyunki iske paas ${activeOrders} active undelivered orders hain. Pehle orders unassign karein.` 
      }, { status: 400 });
    }

    // Unlink any completed orders to maintain order history
    await prisma.order.updateMany({
      where: { riderId: id },
      data: { riderId: null },
    });

    // Delete Rider
    await prisma.rider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Rider safaltapoorvak remove ho gaya!' });
  } catch (error: any) {
    console.error('Error deleting rider:', error);
    return NextResponse.json({ error: 'Failed to delete rider: ' + error.message }, { status: 500 });
  }
}
