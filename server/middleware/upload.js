const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// A custom storage engine wrapper to format path as HTTP URL
const customStorage = {
  _handleFile: (req, file, cb) => {
    localDiskStorage._handleFile(req, file, (err, info) => {
      if (err) return cb(err);
      // Format path to server URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      cb(null, {
        ...info,
        localPath: info.path, // Store local path for internal use (Tesseract)
        path: `${baseUrl}/uploads/${info.filename}`, // Format path for DB/client
      });
    });
  },
  _removeFile: (req, file, cb) => {
    localDiskStorage._removeFile(req, file, cb);
  },
};

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
  storage: customStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for assets'), false);
  },
});

const uploadDigitalAsset = multer({
  storage: customStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

const uploadProfileImage = multer({
  storage: customStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for profile'), false);
  },
});

const uploadOCRImage = multer({
  storage: customStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed for OCR'), false);
  },
});

// Cloudinary Mock Object for local storage mode
const cloudinary = {
  config: () => {},
  uploader: {
    destroy: async (publicId, options = {}) => {
      try {
        if (!publicId) return;
        // The publicId is stored as the filename (e.g. uniqueSuffix.ext)
        // We delete it from the local uploads folder
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
      // Just return the local HTTP URL directly
      return `/uploads/${publicId}`;
    },
  },
};

module.exports = {
  cloudinary,
  uploadAssetImage,
  uploadDigitalAsset,
  uploadProfileImage,
  uploadOCRImage,
};
