export const essayCreditCost = (length = "medium") => ({ short: 14, medium: 17, long: 23 }[length] || 17);

export const presentationCreditCost = (slideCount = 7, detailLevel = "medium") => {
  const slides = Math.min(15, Math.max(3, Number(slideCount) || 7));
  const detailAdd = { short: 5, medium: 9, long: 13 }[detailLevel] ?? 9;
  return Math.min(62, Math.max(30, 20 + Math.ceil(slides * 1.6) + detailAdd));
};

export const homeworkCreditCost = (question = "", hasImage = false) => textToolCreditCost(hasImage ? 17 : 9, question, 1100, hasImage ? 30 : 18);

export const flashcardsCreditCost = (count = 6) => {
  const safeCount = Math.min(20, Math.max(1, Number(count) || 6));
  return Math.min(19, Math.max(9, 7 + Math.ceil(safeCount / 3)));
};

export const testCreditCost = (questionCount = 10) => {
  const safeCount = Math.min(20, Math.max(5, Number(questionCount) || 10));
  return Math.min(18, Math.max(10, 8 + Math.ceil(safeCount / 4)));
};

export const textToolCreditCost = (base, text = "", step = 1100, max = 23) => {
  const length = String(text || "").trim().length;
  const extra = Math.max(0, Math.ceil(length / step) - 1);
  return Math.min(max, Math.max(base, base + extra));
};

export const toolBaseCosts = {
  chat: 4,
  chatImage: 16,
  imageCreate: 36,
  homework: 9,
  homeworkImage: 17,
  flashcards: 9,
  imageToPdf: 6,
  imageToText: 8,
  zip: 6,
  grammarly: 6,
  aiDetector: 8,
  humanizer: 12,
  mathLab: 10,
};
