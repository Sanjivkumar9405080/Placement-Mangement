const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // Reuse existing connection
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });

    cachedConnection = conn;

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;