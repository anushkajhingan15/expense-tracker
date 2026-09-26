const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker';
  
  try {
    // Attempt standard connection with 3s timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Primary MongoDB connection failed (${error.message}).`);
    console.log('[Database] Initializing fallback MongoMemoryServer for standalone zero-config execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] In-Memory MongoDB Connected at: ${mongoUri}`);
      return conn;
    } catch (memError) {
      console.error('[Database] Failed to start fallback MongoDB server:', memError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
