const mongoose = require("mongoose");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  while (mongoose.connection.readyState !== 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.log("Retrying MongoDB connection in 5 seconds...");
      await wait(5000);
    }
  }

  return mongoose.connection;
};

module.exports = connectDB;