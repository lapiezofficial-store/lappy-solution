import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminSession } from '@/lib/adminAuth';
import { invalidateInitCache } from '@/app/api/cms/init/route';

export async function GET() {
  try {
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { id: 'default' },
    });

    const cleanSiteSettings = siteSettings ? {
      id: siteSettings.id,
      siteName: siteSettings.siteName || 'Lapiez',
      tagline: siteSettings.tagline || '',
      logo: siteSettings.logo || '',
      favicon: siteSettings.favicon || '/favicon.ico',
      phone: siteSettings.phone || '',
      whatsapp: siteSettings.whatsapp || '',
      email: siteSettings.email || '',
      address: siteSettings.address || '',
      timings: siteSettings.timings || '',
      announcementText: siteSettings.announcementText || '',
      maintenanceMode: Boolean(siteSettings.maintenanceMode),
      facebookUrl: siteSettings.facebookUrl || '',
      instagramUrl: siteSettings.instagramUrl || '',
      youtubeUrl: siteSettings.youtubeUrl || '',
      twitterUrl: siteSettings.twitterUrl || '',
      googleMapsUrl: siteSettings.twitterUrl || 'https://www.google.com/maps/place/LAPPY+SOLUTION/@24.1624844,83.7994142,14.58z/data=!4m19!1m12!4m11!1m3!2m2!1d85.0827707!2d25.6822957!1m6!1m2!1s0x398c0f004ce430c7:0xe58fa9332947c20e!2sLAPPY+SOLUTION,+Chiniya+Rd,+Bishunpur,+Garhwa,+Jharkhand+822114!2m2!1d83.8030729!2d24.1581205!3m5!1s0x398c0f004ce430c7:0xe58fa9332947c20e!8m2!3d24.1581205!4d83.8030729!16s%2Fg%2F11vj3g_7j2?entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D',
      updatedAt: siteSettings.updatedAt,
    } : null;

    const cleanPaymentSettings = paymentSettings ? {
      id: paymentSettings.id,
      upiId: paymentSettings.upiId || 'lappy.solution@ybl',
      upiName: paymentSettings.upiName || 'LAPIEZ GARHWA',
      codEnabled: Boolean(paymentSettings.codEnabled),
      gstRate: paymentSettings.gstRate ?? 18,
      gstin: paymentSettings.gstin || '',
      bankAccountsJson: paymentSettings.bankAccountsJson || '[]',
      updatedAt: paymentSettings.updatedAt,
    } : null;

    return NextResponse.json({
      siteSettings: cleanSiteSettings,
      paymentSettings: cleanPaymentSettings,
    });
  } catch (error) {
    console.error('Error fetching CMS settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { siteSettings, paymentSettings } = body;

    let updatedSite;
    let updatedPayment;

    if (siteSettings && typeof siteSettings === 'object') {
      if (siteSettings.googleMapsUrl !== undefined) {
        siteSettings.twitterUrl = siteSettings.googleMapsUrl;
      }
      const siteFields = [
        'siteName', 'tagline', 'logo', 'favicon', 'phone', 'whatsapp', 'email', 
        'address', 'timings', 'announcementText', 'maintenanceMode',
        'facebookUrl', 'instagramUrl', 'youtubeUrl', 'twitterUrl'
      ];
      const safeSiteSettings = Object.fromEntries(
        Object.entries(siteSettings).filter(([key, val]) => siteFields.includes(key) && val !== undefined)
      );
      if (Object.keys(safeSiteSettings).length > 0) {
        updatedSite = await prisma.siteSettings.upsert({
          where: { id: 'default' },
          update: safeSiteSettings,
          create: { id: 'default', ...safeSiteSettings },
        });
      }
    }

    if (paymentSettings && typeof paymentSettings === 'object') {
      const paymentFields = ['upiId', 'upiName', 'codEnabled', 'gstRate', 'gstin', 'bankAccountsJson'];
      const safePaymentSettings = Object.fromEntries(
        Object.entries(paymentSettings).filter(([key, val]) => paymentFields.includes(key) && val !== undefined)
      );
      if (Object.keys(safePaymentSettings).length > 0) {
        updatedPayment = await prisma.paymentSettings.upsert({
          where: { id: 'default' },
          update: safePaymentSettings,
          create: { id: 'default', ...safePaymentSettings },
        });
      }
    }

    const safeSiteResponse = updatedSite ? {
      id: updatedSite.id,
      siteName: updatedSite.siteName,
      tagline: updatedSite.tagline,
      logo: updatedSite.logo,
      favicon: updatedSite.favicon,
      phone: updatedSite.phone,
      whatsapp: updatedSite.whatsapp,
      email: updatedSite.email,
      address: updatedSite.address,
      timings: updatedSite.timings,
      announcementText: updatedSite.announcementText,
      maintenanceMode: updatedSite.maintenanceMode,
      facebookUrl: updatedSite.facebookUrl,
      instagramUrl: updatedSite.instagramUrl,
      youtubeUrl: updatedSite.youtubeUrl,
      twitterUrl: updatedSite.twitterUrl,
      googleMapsUrl: updatedSite.twitterUrl,
      updatedAt: updatedSite.updatedAt,
    } : null;

    invalidateInitCache();
    return NextResponse.json({
      success: true,
      siteSettings: safeSiteResponse,
      paymentSettings: updatedPayment,
    });
  } catch (error) {
    console.error('Error updating CMS settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
