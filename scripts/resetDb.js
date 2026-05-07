require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in .env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
    console.log(`Cleared: ${collection.collectionName}`);
  }

  await mongoose.disconnect();
  console.log("Database reset completed");
};

run().catch(async (error) => {
  console.error("Reset DB failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore disconnect errors
  }
  process.exit(1);
});
