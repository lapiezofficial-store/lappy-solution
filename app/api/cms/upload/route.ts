import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { hasAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized. Please login as admin.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // Case 1: FormData (File upload from input)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'products';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'image/jpeg';
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      const uploadResult = await uploadToCloudinary(base64Data, folder);

      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    }

    // Case 2: JSON Payload (base64 string or remote URL)
    const body = await request.json();
    const { image, file, folder = 'products' } = body;
    const targetImage = image || file;

    if (!targetImage || typeof targetImage !== 'string') {
      return NextResponse.json({ error: 'Valid image base64 or URL is required' }, { status: 400 });
    }

    const uploadResult = await uploadToCloudinary(targetImage, folder);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error('Image upload route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image to Cloudinary' },
      { status: 500 }
    );
  }
}
