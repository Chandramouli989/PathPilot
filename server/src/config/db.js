const mongoose = require("mongoose");

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the server environment.");
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 0
  });

  try {
    await connectionPromise;
    console.log("MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

mongoose.connection.on("disconnected", () => {
  connectionPromise = null;
});

module.exports = connectDB;
