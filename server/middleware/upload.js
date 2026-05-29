const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinarySDK = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure upload directory exists for local fallback
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if valid Cloudinary credentials are provided (i.e. not the default placeholder or empty)
const useCloudinary = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME.trim() !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY.trim() !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET.trim() !== 'your_api_secret';

let cloudinary;
let storageAssetImage;
let storageDigitalAsset;
let storageProfileImage;
let storageOCRImage;

if (useCloudinary) {
  console.log('☁️ Cloudinary credentials detected. Using Cloudinary for storage.');
  
  cloudinarySDK.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
  });

  cloudinary = cloudinarySDK;

  storageAssetImage = new CloudinaryStorage({
    cloudinary: cloudinarySDK,
    params: {
      folder: 'eams/assets',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });

  storageProfileImage = new CloudinaryStorage({
    cloudinary: cloudinarySDK,
    params: {
      folder: 'eams/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });

  storageOCRImage = new CloudinaryStorage({
    cloudinary: cloudinarySDK,
    params: {
      folder: 'eams/ocr',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });

  storageDigitalAsset = new CloudinaryStorage({
    cloudinary: cloudinarySDK,
    params: async (req, file) => {
      return {
        folder: 'eams/digital_assets',
        resource_type: 'auto',
      };
    },
  });
} else {
  console.log('📁 Local directory mode. Using local disk storage.');

  // Local disk storage configuration
  const localDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  // Custom storage engine wrapper to format path as HTTP URL
  const customStorage = {
    _handleFile: (req, file, cb) => {
      localDiskStorage._handleFile(req, file, (err, info) => {
        if (err) return cb(err);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        cb(null, {
          ...info,
          localPath: info.path,
          path: `${baseUrl}/uploads/${info.filename}`,
        });
      });
    },
    _removeFile: (req, file, cb) => {
      localDiskStorage._removeFile(req, file, cb);
    },
  };

  storageAssetImage = customStorage;
  storageDigitalAsset = customStorage;
  storageProfileImage = customStorage;
  storageOCRImage = customStorage;

  // Cloudinary Mock Object for local storage mode
  cloudinary = {
    config: () => {},
    uploader: {
      destroy: async (publicId, options = {}) => {
        try {
          if (!publicId) return;
          const filename = path.basename(publicId);
          const filePath = path.join(uploadDir, filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting local file:', err);
        }
      },
    },
    utils: {
      private_download_url: (publicId, format, options = {}) => {
        return `/uploads/${publicId}`;
      },
    },
  };
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
    'application/octet-stream',
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.mp4', '.zip', '.rar', '.7z'];

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} (extension: ${ext}) not allowed`), false);
  }
};

const uploadAssetImage = multer({
  storage: storageAssetImage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for assets'), false);
  },
});

const uploadDigitalAsset = multer({
  storage: storageDigitalAsset,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

const uploadProfileImage = multer({
  storage: storageProfileImage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for profile'), false);
  },
});

const uploadOCRImage = multer({
  storage: storageOCRImage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for OCR'), false);
  },
});

module.exports = {
  cloudinary,
  uploadAssetImage,
  uploadDigitalAsset,
  uploadProfileImage,
  uploadOCRImage,
};
