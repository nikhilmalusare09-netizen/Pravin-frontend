const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    // If no URI or default local is unreachable, attempt memory server fallback for local testing
    if (!mongoURI) {
      console.warn('⚠️ MONGODB_URI not specified in .env. Attempting local MongoDB at mongodb://127.0.0.1:27017/pravin-chinese');
      mongoURI = 'mongodb://127.0.0.1:27017/pravin-chinese';
    }

    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (connErr) {
      console.warn(`⚠️ Direct MongoDB connection to ${mongoURI} failed: ${connErr.message}`);
      
      // Attempt embedded memory MongoDB if in development
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        console.log('🔄 Initializing in-memory MongoDB fallback for smooth local execution...');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ Connected to In-Memory MongoDB: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error('❌ Could not connect to local/Atlas MongoDB or in-memory MongoDB fallback.');
        throw connErr;
      }
    }
  } catch (error) {
    console.error(`❌ Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
