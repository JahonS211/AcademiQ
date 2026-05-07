const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const generatePresentationAI = async ({ topic, language, slideCount = 5 }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const prompt = `
    Create a detailed presentation outline about "${topic}" in ${language} language.
    Generate exactly ${slideCount} slides.
    For each slide, provide:
    1. Title
    2. Content (detailed bullet points)
    3. Image Description (what kind of image would fit here)
    
    Return ONLY valid JSON in this format:
    {
      "title": "Main Title",
      "slides": [
        { "title": "Slide 1 Title", "content": ["Point 1", "Point 2"], "imageDesc": "Description" },
        ...
      ]
    }
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, "").trim());

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
    slide.addText(slideData.content.join("\n\n"), { x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 18, color: "333333" });
    slide.addText(`[Image Idea: ${slideData.imageDesc}]`, { x: 0.5, y: 5.5, w: 9, h: 0.5, fontSize: 10, italic: true, color: "999999" });
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
