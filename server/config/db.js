const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection status listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Retrying connection...');
    });
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    console.error(`❌ MongoDB initial connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
