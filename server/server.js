const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cron');
const errorHandler = require('./middleware/errorHandler');
const activityLogger = require('./middleware/activityLogger');

// Route imports
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const digitalAssetRoutes = require('./routes/digitalAssets');
const licenseRoutes = require('./routes/licenses');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const maintenanceRoutes = require('./routes/maintenance');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const searchRoutes = require('./routes/search');
const rideBookingRoutes = require('./routes/rideBookings');
const assetTypeRoutes = require('./routes/assetTypes');
const digitalAssetCategoryRoutes = require('./routes/digitalAssetCategories');
const licenseTypeRoutes = require('./routes/licenseTypes');
const assetRequestRoutes = require('./routes/assetRequests');
const AssetType = require('./models/AssetType');
const DigitalAssetCategory = require('./models/DigitalAssetCategory');
const LicenseType = require('./models/LicenseType');

const app = express();

const seedAssetTypes = async () => {
  try {
    const count = await AssetType.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default Asset Types...');
      const defaultTypes = [
        { name: 'Laptop', code: 'laptop', category: 'IT Devices', icon: 'Laptop', description: 'Portable personal computer' },
        { name: 'Desktop', code: 'desktop', category: 'IT Devices', icon: 'Monitor', description: 'Stationary personal computer' },
        { name: 'Monitor', code: 'monitor', category: 'IT Devices', icon: 'Tv', description: 'External display screen' },
        { name: 'Chair', code: 'chair', category: 'Office Furniture', icon: 'Chair', description: 'Ergonomic seating chair' },
        { name: 'Table', code: 'table', category: 'Office Furniture', icon: 'Table', description: 'Workdesk or conference table' },
        { name: 'Printer', code: 'printer', category: 'IT Devices', icon: 'Printer', description: 'Office printer or scanner' },
        { name: 'Router', code: 'router', category: 'Network Devices', icon: 'Wifi', description: 'Networking router or switch' },
        { name: 'CCTV Camera', code: 'cctv', category: 'IT Devices', icon: 'Cctv', description: 'Security camera' },
        { name: 'Mobile Phone', code: 'mobile', category: 'IT Devices', icon: 'Smartphone', description: 'Corporate smartphone device' },
        { name: 'Keyboard', code: 'keyboard', category: 'Accessories', icon: 'Keyboard', description: 'External computer keyboard' },
        { name: 'Mouse', code: 'mouse', category: 'Accessories', icon: 'Mouse', description: 'Computer mouse pointer device' },
        { name: 'UPS', code: 'ups', category: 'Network Devices', icon: 'Cpu', description: 'Uninterruptible power supply' },
        { name: 'Server', code: 'server', category: 'Network Devices', icon: 'Server', description: 'Data or compute server machine' },
        { name: 'Projector', code: 'projector', category: 'IT Devices', icon: 'Projector', description: 'Office conference projector' },
        { name: 'Desk Phone', code: 'phone', category: 'IT Devices', icon: 'Phone', description: 'Office landline telephone' },
        { name: 'Tablet', code: 'tablet', category: 'IT Devices', icon: 'Tablet', description: 'Portable tablet device' },
        { name: 'Other', code: 'other', category: 'Other', icon: 'HelpCircle', description: 'Miscellaneous asset type' }
      ];
      await AssetType.insertMany(defaultTypes);
      console.log('✅ Default Asset Types seeded successfully!');
    }
  } catch (error) {
    console.error('❌ Error seeding Asset Types:', error.message);
  }
};

const seedDigitalAssetCategories = async () => {
  try {
    const count = await DigitalAssetCategory.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default Digital Asset Categories...');
      const defaultCategories = [
        { name: 'Logo', code: 'logo', icon: 'Sparkles', description: 'Company logos and icons' },
        { name: 'Images', code: 'image', icon: 'Img', description: 'Photos, raster images, and vector graphics' },
        { name: 'Videos', code: 'video', icon: 'Film', description: 'Video clips, recordings, and animation files' },
        { name: 'PDFs', code: 'pdf', icon: 'FileText', description: 'Portable document format files' },
        { name: 'PPT/Slides', code: 'ppt', icon: 'Presentation', description: 'Presentations and slide decks' },
        { name: 'Marketing', code: 'marketing', icon: 'Megaphone', description: 'Marketing materials and branding assets' },
        { name: 'Source Code', code: 'source_code', icon: 'Code', description: 'Source code files and scripts' },
        { name: 'Documents', code: 'document', icon: 'FileText', description: 'Text files, word documents, and PDFs' },
        { name: 'Spreadsheet', code: 'spreadsheet', icon: 'Table', description: 'Excel, CSV, and tabular documents' },
        { name: 'Other', code: 'other', icon: 'File', description: 'Uncategorized digital files' }
      ];
      await DigitalAssetCategory.insertMany(defaultCategories);
      console.log('✅ Default Digital Asset Categories seeded successfully!');
    }
  } catch (error) {
    console.error('❌ Error seeding Digital Asset Categories:', error.message);
  }
};

const seedLicenseTypes = async () => {
  try {
    const count = await LicenseType.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default License Types...');
      const defaultTypes = [
        { name: 'Subscription', code: 'subscription', icon: 'Calendar', description: 'Recurring payment license' },
        { name: 'Perpetual', code: 'perpetual', icon: 'ShieldCheck', description: 'Lifetime ownership license' },
        { name: 'Trial', code: 'trial', icon: 'Clock', description: 'Temporary evaluation license' },
        { name: 'Open Source', code: 'open_source', icon: 'FileCode', description: 'Free & public repository code' }
      ];
      await LicenseType.insertMany(defaultTypes);
      console.log('✅ Default License Types seeded successfully!');
    }
  } catch (error) {
    console.error('❌ Error seeding License Types:', error.message);
  }
};

// Connect DB
connectDB().then(() => {
  seedAssetTypes();
  seedDigitalAssetCategories();
  seedLicenseTypes();
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Support heavy local client loads in dev
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sanitization
app.use(mongoSanitize());
app.use(xssClean());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Activity logging on mutating routes
app.use(activityLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/digital-assets', digitalAssetRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ride-bookings', rideBookingRoutes);
app.use('/api/asset-types', assetTypeRoutes);
app.use('/api/digital-asset-categories', digitalAssetCategoryRoutes);
app.use('/api/license-types', licenseTypeRoutes);
app.use('/api/asset-requests', assetRequestRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EAMS API is running', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  // Fallback: send index.html for any non-API route (SPA client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Init cron jobs
initCronJobs();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 EAMS Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Initialize WebSockets
const { init: initWebSocket } = require('./utils/websocket');
initWebSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
