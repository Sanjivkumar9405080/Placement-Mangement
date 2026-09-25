const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // If connection is already established or ready, reuse it
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://placement_admin:Yash1234@cluster0.cqnmloc.mongodb.net/placement_management?appName=Cluster0';

    const conn = await mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // In serverless environments, do not process.exit(1) as it kills the lambda worker abruptly
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
