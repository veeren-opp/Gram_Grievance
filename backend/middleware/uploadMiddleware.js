import multer from 'multer';

// 5 MB maximum size constraint as specified in requirements
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Accepted formats: JPG, JPEG, PNG, WEBP.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to cleanly catch Multer upload errors
 */
export const handleSingleUpload = (fieldName = 'photo') => {
  const singleUpload = upload.single(fieldName);

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Photo size exceeds maximum limit of 5 MB. Please choose a smaller photo.',
          });
        }
        return res.status(400).json({
          success: false,
          error: `Photo upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      next();
    });
  };
};

export default handleSingleUpload;
