import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'lapiez-app.apk');
    
    if (!fs.existsSync(apkPath)) {
      return new NextResponse('APK file not found on server.', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(apkPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="Lapiez-Garhwa-App.apk"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Error serving Lapiez APK download:', error);
    return new NextResponse('Failed to download APK. Please contact support.', { status: 500 });
  }
}
