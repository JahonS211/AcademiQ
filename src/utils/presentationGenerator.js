const PptxGenJS = require("pptxgenjs");
const path = require("path");
const geminiService = require("../services/gemini.service");

const LANGUAGE_CONFIG = {
  uz: {
    name: "Uzbek language, Latin script",
    instruction: "Write every title, bullet point, image description, and all visible slide text ONLY in Uzbek Latin script. Do not use English words unless they are unavoidable technical terms.",
    imageLabel: "Rasm g'oyasi",
  },
  ru: {
    name: "Russian language",
    instruction: "Write every title, bullet point, image description, and all visible slide text ONLY in Russian.",
    imageLabel: "Идея изображения",
  },
  en: {
    name: "English language",
    instruction: "Write every title, bullet point, image description, and all visible slide text ONLY in English.",
    imageLabel: "Image idea",
  },
};

const generatePresentationAI = async ({ topic, language, slideCount = 5, userPlan = "free" }) => {
  const lang = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.uz;
  const prompt = `
Create a clear, ready-to-present outline about "${topic}" in ${lang.name}.
Generate exactly ${slideCount} slides.

Rules:
1. Every slide title must be specific, not generic.
2. Each slide must contain 3-5 concise bullet points with concrete information.
3. Do not repeat the same idea across slides.
4. Image descriptions must describe a useful visual for that slide.
5. ${lang.instruction}
6. The JSON keys must stay in English, but every JSON value must be in ${lang.name}.

Return ONLY valid JSON in this format:
{
  "title": "Presentation title in the selected language",
  "slides": [
    { "title": "Slide title in the selected language", "content": ["Specific point in the selected language", "Specific point in the selected language"], "imageDesc": "Useful visual description in the selected language" }
  ]
}
  `.trim();

  const content = await geminiService.generateJSON(prompt, null, userPlan, { title: topic, slides: [] });

  if (!content.slides || content.slides.length === 0) {
    throw new Error("Failed to generate presentation content");
  }

  // Create PPTX
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  // Title Slide
  let titleSlide = pptx.addSlide();
  titleSlide.addText(content.title, { 
    x: 1, y: 1.5, w: 8, h: 2, 
    fontSize: 44, bold: true, color: "363636", align: "center",
    fill: { color: "F1F1F1" }
  });

  // Content Slides
  content.slides.forEach(slideData => {
    let slide = pptx.addSlide();
    slide.addText(slideData.title, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 32, bold: true, color: "0088CC" });
    slide.addText(Array.isArray(slideData.content) ? slideData.content.join("\n\n") : slideData.content, { x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 18, color: "333333" });
    slide.addText(`[${lang.imageLabel}: ${slideData.imageDesc}]`, { x: 0.5, y: 5.5, w: 9, h: 0.5, fontSize: 10, italic: true, color: "999999" });
  });

  const fileName = `presentation-${Date.now()}.pptx`;
  const filePath = path.join(__dirname, "../../uploads", fileName);
  
  await pptx.writeFile({ fileName: filePath });
  
  return {
    title: content.title,
    fileName,
    fileUrl: `/uploads/${fileName}`
  };
};

module.exports = { generatePresentationAI };
