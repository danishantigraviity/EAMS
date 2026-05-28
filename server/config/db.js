const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
// Force IPv4 to avoid SRV lookup issues on Windows
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 10;

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      connectTimeoutMS: 30000,
      family: 4, // Use IPv4
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Reconnect automatically on disconnect
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Retrying in 5s...');
      setTimeout(() => connectDB(), RETRY_DELAY_MS);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error('🚨 Max retries reached. Server will continue without DB — check your MongoDB Atlas IP whitelist.');
      // Do NOT exit — keep server alive so you can debug
    }
  }
};

module.exports = connectDB;
