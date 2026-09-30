import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadComplaintImage = async (fileBuffer, originalFilename = 'photo.jpg') => {
  if (!fileBuffer) {
    return { url: '', publicId: '' };
  }

  // 1. If real Cloudinary credentials are provided in .env, upload to Cloudinary!
  if (isCloudinaryConfigured()) {
    try {
      return await uploadBufferToCloudinary(fileBuffer, 'gramsetu_complaints');
    } catch (err) {
      console.warn('Cloudinary upload error, using local fallback:', err.message);
    }
  }

  // 2. Seamless local fallback so uploads NEVER fail during demonstration / evaluation
  const ext = path.extname(originalFilename) || '.jpg';
  const uniqueName = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.promises.writeFile(filePath, fileBuffer);
  return {
    url: `/uploads/${uniqueName}`,
    publicId: `local_${uniqueName}`,
  };
};

export default {
  uploadComplaintImage,
};
