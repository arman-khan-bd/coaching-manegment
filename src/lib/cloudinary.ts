/**
 * Cloudinary Image Upload Service
 * Automatically reads VITE_CLOUDINARY_CLOUD and VITE_CLOUDINARY_PRESET from .env
 */

export const CLOUDINARY_CLOUD =
  (import.meta.env.VITE_CLOUDINARY_CLOUD as string) || 'dj7pg5slk';
export const CLOUDINARY_PRESET =
  (import.meta.env.VITE_CLOUDINARY_PRESET as string) || 'coaching';

export interface CloudinaryUploadResponse {
  asset_id?: string;
  public_id: string;
  version?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  bytes?: number;
  url: string;
  secure_url: string;
}

/**
 * Upload an image file, blob, or base64 string to Cloudinary
 * @param file File object, Blob, or base64 data string
 * @param folder Cloudinary folder name (defaults to 'coaching_management')
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  folder: string = 'coaching_management'
): Promise<CloudinaryUploadResponse> {
  const cloudName = CLOUDINARY_CLOUD.trim();
  const uploadPreset = CLOUDINARY_PRESET.trim();

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured in .env (VITE_CLOUDINARY_CLOUD)');
  }
  if (!uploadPreset) {
    throw new Error('Cloudinary upload preset is not configured in .env (VITE_CLOUDINARY_PRESET)');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.error?.message ||
        `Cloudinary upload failed with HTTP status ${response.status}`;
      throw new Error(errorMsg);
    }

    return {
      asset_id: data.asset_id,
      public_id: data.public_id,
      version: data.version,
      width: data.width,
      height: data.height,
      format: data.format,
      resource_type: data.resource_type,
      created_at: data.created_at,
      bytes: data.bytes,
      url: data.url,
      secure_url: data.secure_url || data.url,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
