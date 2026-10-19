import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary strictly from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ydugu2xq';
const apiKey = process.env.CLOUDINARY_API_KEY || '825948682878493';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '5TWFbLWdkLS_rD8lMGTSM7KdOGM';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Uploads a base64 data URI, image buffer, or remote URL to Cloudinary
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: string = 'lapiez-products'
): Promise<CloudinaryUploadResult> {
  const currentCloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ydugu2xq';
  const currentApiKey = process.env.CLOUDINARY_API_KEY || '825948682878493';
  const currentApiSecret = process.env.CLOUDINARY_API_SECRET || '5TWFbLWdkLS_rD8lMGTSM7KdOGM';

  cloudinary.config({
    cloud_name: currentCloudName,
    api_key: currentApiKey,
    api_secret: currentApiSecret,
    secure: true,
  });

  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder: `lapiez/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Cloudinary upload failure');
    throw new Error(error?.message || 'Failed to upload image to Cloudinary');
  }
}

export default cloudinary;
