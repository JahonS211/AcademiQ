const fs = require("fs");
const { generateFromImage } = require("./geminiService");

const extractTextWithGroq = async (filePath) => {
  // Read file as base64
  const imageAsBase64 = fs.readFileSync(filePath, { encoding: "base64" });
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

  try {
    const text = await generateFromImage(
      "Extract all the text from this image accurately. Do not include any explanations, just the raw text you see in the image. If the image contains no text, return empty.",
      imageAsBase64,
      mimeType
    );
    return text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

module.exports = { extractTextWithGroq };
