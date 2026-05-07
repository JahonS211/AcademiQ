require("dotenv").config();
const mongoose = require("mongoose");
const Presentation = require("../src/models/Presentation");

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in .env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const presentations = [
    {
      title: "Math Fundamentals",
      category: "Math",
      fileUrl: "https://example.com/presentations/math-fundamentals.pptx",
    },
    {
      title: "English Grammar Essentials",
      category: "Language",
      fileUrl: "https://example.com/presentations/english-grammar.pptx",
    },
    {
      title: "Biology Basics",
      category: "Science",
      fileUrl: "https://example.com/presentations/biology-basics.pptx",
    },
  ];

  await Presentation.insertMany(presentations);
  console.log("Seed data inserted: presentations");

  await mongoose.disconnect();
  console.log("Seeding completed");
};

run().catch(async (error) => {
  console.error("Seed DB failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore disconnect errors
  }
  process.exit(1);
});
