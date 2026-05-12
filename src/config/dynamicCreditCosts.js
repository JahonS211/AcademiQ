const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const bodyText = (req, keys) => keys.map((key) => req.body?.[key] || "").join(" ");

const textLengthCost = (base, text, step = 1200, max = 20) => {
  const length = String(text || "").trim().length;
  const extra = Math.max(0, Math.ceil(length / step) - 1);
  return clamp(base + extra, base, max);
};

const requestSizeCost = (base, req, stepBytes = 5 * 1024 * 1024, max = 16) => {
  const size = Number(req.headers?.["content-length"] || 0);
  const extra = Number.isFinite(size) && size > 0 ? Math.max(0, Math.ceil(size / stepBytes) - 1) : 0;
  return clamp(base + extra, base, max);
};

const chatCost = (req) => {
  const message = String(req.body?.message || "");
  const imageMode = req.body?.mode === "image" || req.body?.imageMode === "true" || /(rasm|image|surat).*(yarat|chiz|generate|create)/i.test(message);
  if (imageMode) return textLengthCost(36, message, 600, 58);

  const historyText = Array.isArray(req.body?.history)
    ? req.body.history.map((h) => h?.text || "").join(" ")
    : "";
  const base = req.file ? 16 : 5;
  const max = req.file ? 30 : 14;
  return textLengthCost(base, `${message} ${historyText}`, 1100, max);
};

const essayCost = (req) => {
  const length = req.body?.length || "medium";
  return ({ short: 14, medium: 17, long: 23 }[length] || 17);
};

const presentationCost = (req) => {
  const slides = clamp(normalizeNumber(req.body?.slideCount, 7), 3, 15);
  const detail = req.body?.detailLevel || "medium";
  const detailAdd = { short: 5, medium: 9, long: 13 }[detail] ?? 9;
  return clamp(20 + Math.ceil(slides * 1.6) + detailAdd, 30, 62);
};

const homeworkCost = (req) => {
  const base = req.file ? 17 : 9;
  const max = req.file ? 30 : 18;
  return textLengthCost(base, bodyText(req, ["question", "subject"]), 1100, max);
};

const flashcardsCost = (req) => {
  const count = clamp(normalizeNumber(req.body?.count, 6), 1, 20);
  return clamp(6 + Math.ceil(count / 3), 8, 17);
};

const testCost = (req) => {
  const count = clamp(normalizeNumber(req.body?.questionCount, 10), 5, 20);
  return clamp(7 + Math.ceil(count / 4), 9, 15);
};

const grammarlyCost = (req) => textLengthCost(6, req.body?.text, 1100, 14);
const aiDetectorCost = (req) => textLengthCost(8, req.body?.text, 1100, 16);
const humanizerCost = (req) => textLengthCost(12, req.body?.text, 900, 23);
const mathLabCost = (req) => textLengthCost(10, req.body?.prompt, 900, 22);

const pdfToWordCost = (req) => requestSizeCost(5, req, 6 * 1024 * 1024, 14);
const imageToTextCost = (req) => requestSizeCost(8, req, 4 * 1024 * 1024, 18);
const imageToPdfCost = (req) => requestSizeCost(6, req, 5 * 1024 * 1024, 14);
const compressCost = (req) => requestSizeCost(6, req, 8 * 1024 * 1024, 20);

module.exports = {
  textLengthCost,
  requestSizeCost,
  chatCost,
  essayCost,
  presentationCost,
  homeworkCost,
  flashcardsCost,
  testCost,
  grammarlyCost,
  aiDetectorCost,
  humanizerCost,
  mathLabCost,
  pdfToWordCost,
  imageToTextCost,
  imageToPdfCost,
  compressCost,
};
