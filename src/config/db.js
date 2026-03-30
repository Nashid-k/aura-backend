const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed.');
    console.error(error.message);
    throw error;
  }
}

module.exports = { connectDB };
