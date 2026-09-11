const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifedrop', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB Warning] Please ensure MongoDB is installed and running locally, or update MONGODB_URI in backend/.env with your MongoDB Atlas connection string.`);
    // Return null instead of terminating process immediately so static frontend can still load
    return null;
  }
};

module.exports = connectDB;
