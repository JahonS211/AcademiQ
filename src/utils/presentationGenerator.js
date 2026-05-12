const PptxGenJS = require("pptxgenjs");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const geminiService = require("../services/gemini.service");
const { createGeneratedSvgVisual, svgToDataUri } = require("./aiImageGenerator");

const LANGUAGE_CONFIG = {
  uz: {
    name: "Uzbek Latin",
    instruction: "Write every visible title, bullet point, caption, speaker note, and slide text only in Uzbek Latin script.",
    imageLabel: "Vizual",
    footer: "Thinky AI taqdimot",
    slidesLabel: "slayd",
    notePrefix: "Presenter eslatmasi",
  },
  ru: {
    name: "Russian",
    instruction: "Write every visible title, bullet point, caption, speaker note, and slide text only in Russian.",
    imageLabel: "Vizual",
    footer: "Thinky AI prezentatsiya",
    slidesLabel: "slaydov",
    notePrefix: "Zametka dokladchika",
  },
  en: {
    name: "English",
    instruction: "Write every visible title, bullet point, caption, speaker note, and slide text only in English.",
    imageLabel: "Visual",
    footer: "Thinky AI presentation",
    slidesLabel: "slides",
    notePrefix: "Presenter note",
  },
};

const DETAIL_CONFIG = {
  short: {
    label: "short and concise",
    bulletCount: 3,
    maxBulletChars: 105,
    instruction: "Keep the slide text concise, but include concrete facts and one practical example when useful.",
  },
  medium: {
    label: "balanced detail",
    bulletCount: 4,
    maxBulletChars: 135,
    instruction: "Use balanced explanations with specific terms, useful context, and examples that help a student understand the topic.",
  },
  long: {
    label: "more detailed",
    bulletCount: 5,
    maxBulletChars: 155,
    instruction: "Use richer explanations, but keep each bullet readable and presentation-friendly.",
  },
};

const THEMES = [
  { bg: "F7FAFF", panel: "FFFFFF", imagePanel: "EAF1FF", accent: "4F46E5", accent2: "06B6D4", text: "111827", muted: "64748B", soft: "EEF2FF" },
  { bg: "07111F", panel: "111C2F", imagePanel: "16243A", accent: "38BDF8", accent2: "34D399", text: "F8FAFC", muted: "AAB7C9", soft: "172554" },
  { bg: "FFF7ED", panel: "FFFFFF", imagePanel: "FFEFD5", accent: "EA580C", accent2: "2563EB", text: "1F2937", muted: "78716C", soft: "FFEDD5" },
  { bg: "F8FAFC", panel: "FFFFFF", imagePanel: "E0F2FE", accent: "0F766E", accent2: "7C3AED", text: "0F172A", muted: "64748B", soft: "CCFBF1" },
  { bg: "0E1020", panel: "171A2E", imagePanel: "202544", accent: "F43F5E", accent2: "FBBF24", text: "F8FAFC", muted: "CBD5E1", soft: "312E81" },
];

const imageCache = new Map();

const escapeXml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const cleanText = (value = "", maxChars = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).replace(/\s+\S*$/, "")}...`;
};

const splitLines = (text = "", maxChars = 26, maxLines = 3) => {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
};

const normalizeQuery = (query = "") => String(query)
  .replace(/[^a-zA-Z0-9\s-]/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 90);

const normalizeSlides = (content, topic, slideCount, detail) => {
  const slides = Array.isArray(content.slides) ? content.slides : [];
  const normalized = slides.slice(0, slideCount).map((slide, index) => {
    const contentItems = Array.isArray(slide.content)
      ? slide.content
      : [String(slide.content || "")].filter(Boolean);

    const visualKeywords = Array.isArray(slide.visualKeywords)
      ? slide.visualKeywords.slice(0, 5).map((x) => cleanText(x, 34)).filter(Boolean)
      : [];

    const imageSearchQuery = normalizeQuery(slide.imageSearchQuery || slide.searchQuery || [topic, ...visualKeywords].join(" "));

    return {
      title: cleanText(slide.title || `${topic} ${index + 1}`, 78),
      takeaway: cleanText(slide.takeaway || slide.subtitle || "", 130),
      content: contentItems.slice(0, detail.bulletCount).map((point) => cleanText(point, detail.maxBulletChars)).filter(Boolean),
      imageDesc: cleanText(slide.imageDesc || slide.visual || slide.visualIdea || slide.takeaway || "", 155),
      visualKeywords,
      imageSearchQuery: imageSearchQuery || normalizeQuery(topic),
      speakerNote: cleanText(slide.speakerNote || slide.note || "", 240),
    };
  });

  while (normalized.length < slideCount && normalized.length > 0) {
    const previous = normalized[normalized.length - 1];
    normalized.push({ ...previous, title: `${previous.title} ${normalized.length + 1}` });
  }

  return normalized;
};

const fetchImageUrlAsData = async (url, source) => {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 9000,
    maxRedirects: 5,
    headers: {
      "User-Agent": "Thinky presentation generator/1.0",
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
    },
  });

  const contentType = String(response.headers["content-type"] || "").split(";")[0].toLowerCase();
  if (!contentType.startsWith("image/")) return null;
  if (contentType.includes("svg") || contentType.includes("gif") || contentType.includes("webp") || contentType.includes("avif")) return null;

  const mime = contentType.includes("png") ? "image/png" : "image/jpeg";
  return {
    data: `data:${mime};base64,${Buffer.from(response.data).toString("base64")}`,
    source,
  };
};

const fetchWikimediaImage = async (query) => {
  const search = normalizeQuery(query);
  if (!search) return null;

  const api = "https://commons.wikimedia.org/w/api.php";
  const { data } = await axios.get(api, {
    timeout: 7000,
    params: {
      action: "query",
      generator: "search",
      gsrsearch: search,
      gsrnamespace: 6,
      gsrlimit: 8,
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: 1600,
      format: "json",
      origin: "*",
    },
    headers: { "User-Agent": "Thinky presentation generator/1.0" },
  });

  const pages = Object.values(data?.query?.pages || {});
  const candidates = pages
    .map((page) => page.imageinfo?.[0])
    .filter(Boolean)
    .filter((info) => /image\/(jpeg|jpg|png)/i.test(info.mime || ""))
    .map((info) => info.thumburl || info.url)
    .filter(Boolean);

  for (const candidate of candidates) {
    try {
      const image = await fetchImageUrlAsData(candidate, "Wikimedia Commons");
      if (image) return image;
    } catch (error) {
      // Try the next candidate.
    }
  }

  return null;
};

const fetchOpenImage = async (query) => {
  const search = normalizeQuery(query);
  if (!search) return null;

  const encodedComma = encodeURIComponent(search.replace(/\s+/g, ","));
  const encodedPath = encodeURIComponent(search.replace(/\s+/g, ","));
  const urls = [
    `https://source.unsplash.com/1600x900/?${encodedComma}`,
    `https://loremflickr.com/1600/900/${encodedPath}`,
  ];

  for (const url of urls) {
    try {
      const image = await fetchImageUrlAsData(url, url.includes("unsplash") ? "Unsplash" : "Open image search");
      if (image) return image;
    } catch (error) {
      // Continue to fallback providers.
    }
  }

  return null;
};

const resolveSlideImage = async (topic, slideData) => {
  const queries = [
    slideData.imageSearchQuery,
    `${topic} ${slideData.visualKeywords.join(" ")}`,
    `${topic} educational illustration`,
  ].map(normalizeQuery).filter(Boolean);

  for (const query of queries) {
    if (imageCache.has(query)) return imageCache.get(query);

    try {
      const wikimedia = await fetchWikimediaImage(query);
      if (wikimedia) {
        imageCache.set(query, wikimedia);
        return wikimedia;
      }
    } catch (error) {
      // Network or provider failure should not block presentation generation.
    }

    try {
      const openImage = await fetchOpenImage(query);
      if (openImage) {
        imageCache.set(query, openImage);
        return openImage;
      }
    } catch (error) {
      // Fallback SVG will be used.
    }
  }

  return null;
};

const fallbackVisual = ({ title, imageDesc, palette, index }) => {
  const titleLines = splitLines(title, 26, 3);
  const descLines = splitLines(imageDesc, 34, 4);
  const titleSvg = titleLines.map((line, i) => (
    `<text x="76" y="${120 + i * 42}" fill="#${palette.text}" font-size="35" font-weight="850" font-family="Arial">${escapeXml(line)}</text>`
  )).join("");
  const descSvg = descLines.map((line, i) => (
    `<text x="76" y="${430 + i * 30}" fill="#${palette.muted}" font-size="21" font-weight="650" font-family="Arial">${escapeXml(line)}</text>`
  )).join("");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#${palette.imagePanel}"/>
      <stop offset="1" stop-color="#${palette.bg}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#${palette.accent}"/>
      <stop offset="1" stop-color="#${palette.accent2}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" rx="70" fill="url(#bg)"/>
  <circle cx="1280" cy="165" r="245" fill="#${palette.accent}" opacity="0.20"/>
  <circle cx="1235" cy="705" r="330" fill="#${palette.accent2}" opacity="0.18"/>
  <path d="M760 130 C1005 42 1425 165 1465 430 C1510 724 1115 842 820 700 C600 594 552 252 760 130Z" fill="url(#accent)" opacity="0.17"/>
  <rect x="54" y="58" width="1492" height="784" rx="56" fill="none" stroke="#${palette.accent}" stroke-width="5" opacity="0.38"/>
  <rect x="76" y="682" width="520" height="14" rx="7" fill="#${palette.accent2}" opacity="0.9"/>
  <text x="76" y="82" fill="#${palette.accent2}" font-size="20" font-weight="900" font-family="Arial" letter-spacing="5">VISUAL ${index + 1}</text>
  ${titleSvg}
  ${descSvg}
</svg>`.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
};

const addFooter = (pptx, slide, palette, pageNumber, lang) => {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55, y: 6.93, w: 8.9, h: 0,
    line: { color: palette.accent, transparency: 55, width: 1 },
  });
  slide.addText(lang.footer, {
    x: 0.55, y: 7.05, w: 3.1, h: 0.16,
    fontSize: 6.5, bold: true, color: palette.muted,
    margin: 0,
  });
  slide.addText(String(pageNumber).padStart(2, "0"), {
    x: 8.82, y: 7.02, w: 0.6, h: 0.18,
    fontSize: 8.5, bold: true, color: palette.accent,
    align: "right", margin: 0,
  });
};

const addImageCard = (pptx, slide, visual, fallback, palette, x, y, w, h, caption) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: palette.imagePanel },
    line: { color: palette.accent, transparency: 70, width: 1 },
  });

  slide.addImage({ data: visual?.data || fallback, x: x + 0.08, y: y + 0.08, w: w - 0.16, h: h - 0.16, sizing: { type: "cover", w: w - 0.16, h: h - 0.16 } });

  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.08, y: y + h - 0.76, w: w - 0.16, h: 0.68,
    fill: { color: "000000", transparency: 18 },
    line: { color: "000000", transparency: 100 },
  });
  slide.addText(caption, {
    x: x + 0.28, y: y + h - 0.56, w: w - 0.56, h: 0.22,
    fontSize: 7.5, bold: true, color: "FFFFFF", fit: "shrink", margin: 0,
  });
};

const addBulletCards = (pptx, slide, points, palette, x, y, w, detail) => {
  const rowH = detail.bulletCount >= 5 ? 0.55 : 0.64;
  const gap = detail.bulletCount >= 5 ? 0.12 : 0.16;

  points.forEach((point, pointIndex) => {
    const rowY = y + pointIndex * (rowH + gap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: rowY, w, h: rowH,
      rectRadius: 0.08,
      fill: { color: palette.soft, transparency: palette.bg === "07111F" || palette.bg === "0E1020" ? 20 : 0 },
      line: { color: palette.accent, transparency: 82, width: 1 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15, y: rowY + 0.16, w: 0.2, h: 0.2,
      fill: { color: pointIndex % 2 ? palette.accent2 : palette.accent },
      line: { color: pointIndex % 2 ? palette.accent2 : palette.accent },
    });
    slide.addText(point, {
      x: x + 0.48, y: rowY + 0.09, w: w - 0.64, h: rowH - 0.12,
      fontSize: detail.bulletCount >= 5 ? 10.2 : 10.8,
      bold: true,
      color: palette.text,
      fit: "shrink",
      valign: "mid",
      breakLine: false,
      margin: 0.02,
    });
  });
};

const buildPresentationPrompt = ({ topic, safeSlideCount, detail, lang }) => `
You are an expert teacher, presentation strategist, and fact-checking assistant.
Create a polished, modern, Gamma-style educational presentation about "${topic}".
Generate exactly ${safeSlideCount} slides.
Detail level: ${detail.label}. ${detail.instruction}

Content quality rules:
1. Make every slide specific to the topic. Avoid vague filler like "important for websites" unless it explains why and how.
2. Include correct definitions, mechanisms, examples, real use cases, common mistakes, and practical conclusions where relevant.
3. If the topic is technical, include concrete terminology, workflow, syntax/structure, and best practices.
4. Do not invent fake statistics, sources, dates, or names. If exact data is uncertain, describe the concept accurately without numbers.
5. Each slide needs one strong takeaway and exactly ${detail.bulletCount} bullet points.
6. Each slide needs a descriptive imageDesc for the caption, plus an imageSearchQuery in English for creating a topic-matching AI visual.
7. Avoid repeated slide titles. Build a logical teaching sequence from basics to practical use.
8. ${lang.instruction}
9. JSON keys must stay in English. Visible values must be in ${lang.name}. The only exceptions are imageSearchQuery and visualKeywords, which must be concise English search terms and will not be shown as slide text.

Return ONLY valid JSON in this format:
{
  "title": "Presentation title",
  "subtitle": "Short subtitle",
  "slides": [
    {
      "title": "Specific slide title",
      "takeaway": "One clear takeaway sentence",
      "content": ["Concrete point", "Concrete point", "Concrete point"],
      "imageDesc": "Visible caption text in the selected language",
      "imageSearchQuery": "English AI image prompt, e.g. HTML code editor semantic web browser",
      "visualKeywords": ["English keyword", "English keyword", "English keyword"],
      "speakerNote": "One helpful presenter note"
    }
  ]
}`.trim();

const generatePresentationPlan = async ({ topic, language, slideCount = 7, userPlan = "free", detailLevel = "medium" }) => {
  const lang = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.uz;
  const safeSlideCount = Math.min(Math.max(Number(slideCount) || 7, 3), 15);
  const detail = DETAIL_CONFIG[detailLevel] || DETAIL_CONFIG.medium;
  const prompt = buildPresentationPrompt({ topic, safeSlideCount, detail, lang });
  const content = await geminiService.generateJSON(prompt, null, userPlan, { title: topic, subtitle: "", slides: [] });
  if (content.error) throw new Error(content.error);

  const slides = normalizeSlides(content, topic, safeSlideCount, detail);
  if (!slides.length) throw new Error("Failed to generate presentation outline");

  return {
    title: cleanText(content.title || topic, 90),
    subtitle: cleanText(content.subtitle || "", 150),
    slideCount: safeSlideCount,
    detailLevel,
    language,
    slides: slides.map((slide, index) => ({
      id: `${Date.now()}-${index}`,
      title: slide.title,
      takeaway: slide.takeaway,
      content: slide.content,
      imageDesc: slide.imageDesc,
      imageSearchQuery: slide.imageSearchQuery,
      visualKeywords: slide.visualKeywords,
      speakerNote: slide.speakerNote,
    })),
  };
};

const generatePresentationAI = async ({ topic, language, slideCount = 7, userPlan = "free", detailLevel = "medium", slides: editedSlides = null, title = null, subtitle = "" }) => {
  const lang = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.uz;
  const safeSlideCount = Math.min(Math.max(Number(slideCount) || 7, 3), 15);
  const detail = DETAIL_CONFIG[detailLevel] || DETAIL_CONFIG.medium;
  const content = Array.isArray(editedSlides) && editedSlides.length
    ? { title: title || topic, subtitle, slides: editedSlides }
    : await generatePresentationPlan({ topic, language, slideCount: safeSlideCount, userPlan, detailLevel });

  const slides = normalizeSlides(content, topic, safeSlideCount, detail);
  if (!slides.length) throw new Error("Failed to generate presentation content");

  const visualAssets = slides.map((slideData, index) => {
    const palette = THEMES[(index + 1) % THEMES.length];
    const svg = createGeneratedSvgVisual({
      title: slideData.title,
      description: slideData.imageDesc || slideData.takeaway || slideData.imageSearchQuery,
      keywords: slideData.visualKeywords?.length ? slideData.visualKeywords : [topic, "education", "visual"],
      palette,
      index,
    });
    return { data: svgToDataUri(svg), source: "Thinky AI generated visual" };
  });
  const titleVisual = {
    data: svgToDataUri(createGeneratedSvgVisual({
      title: content.title || topic,
      description: content.subtitle || `${topic} educational presentation`,
      keywords: [topic, "presentation", "learning"],
      palette: THEMES[0],
      index: 0,
    })),
    source: "Thinky AI generated visual",
  };

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Thinky";
  pptx.subject = topic;
  pptx.title = content.title || topic;
  pptx.company = "Thinky";
  pptx.lang = language || "uz";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: language || "uz",
  };

  const titlePalette = THEMES[0];
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: titlePalette.bg };
  titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 7.5, fill: { color: titlePalette.bg }, line: { color: titlePalette.bg } });
  titleSlide.addShape(pptx.ShapeType.roundRect, { x: 0.55, y: 0.55, w: 4.65, h: 6.1, rectRadius: 0.12, fill: { color: titlePalette.panel }, line: { color: "E2E8F0", transparency: 15 } });
  titleSlide.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 0.95, w: 1.35, h: 0.34, rectRadius: 0.06, fill: { color: titlePalette.soft }, line: { color: titlePalette.soft } });
  titleSlide.addText("Thinky", { x: 1.02, y: 1.06, w: 0.95, h: 0.12, fontSize: 7.5, bold: true, color: titlePalette.accent, align: "center", margin: 0 });
  titleSlide.addText(content.title || topic, { x: 0.86, y: 2.02, w: 3.95, h: 1.7, fontSize: 31, bold: true, color: titlePalette.text, breakLine: false, fit: "shrink" });
  if (content.subtitle) {
    titleSlide.addText(cleanText(content.subtitle, 160), { x: 0.9, y: 3.86, w: 3.75, h: 0.56, fontSize: 12.5, bold: true, color: titlePalette.muted, fit: "shrink" });
  }
  titleSlide.addShape(pptx.ShapeType.roundRect, { x: 0.9, y: 5.35, w: 2.1, h: 0.4, rectRadius: 0.08, fill: { color: titlePalette.accent }, line: { color: titlePalette.accent } });
  titleSlide.addText(`${safeSlideCount} ${lang.slidesLabel}`, { x: 1.08, y: 5.47, w: 1.72, h: 0.13, fontSize: 7.5, bold: true, color: "FFFFFF", align: "center", margin: 0 });
  const titleFallback = fallbackVisual({ title: content.title || topic, imageDesc: content.subtitle || topic, palette: titlePalette, index: 0 });
  addImageCard(pptx, titleSlide, titleVisual, titleFallback, titlePalette, 5.45, 0.55, 4.0, 6.1, content.subtitle || topic);
  addFooter(pptx, titleSlide, titlePalette, 1, lang);

  slides.forEach((slideData, index) => {
    const palette = THEMES[(index + 1) % THEMES.length];
    const slide = pptx.addSlide();
    slide.background = { color: palette.bg };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 7.5, fill: { color: palette.bg }, line: { color: palette.bg } });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.48, y: 0.42, w: 5.2, h: 6.15, rectRadius: 0.12, fill: { color: palette.panel }, line: { color: palette.panel } });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.78, y: 0.77, w: 0.74, h: 0.34, rectRadius: 0.06, fill: { color: palette.soft, transparency: 0 }, line: { color: palette.soft, transparency: 100 } });
    slide.addText(String(index + 1).padStart(2, "0"), { x: 0.95, y: 0.88, w: 0.4, h: 0.12, fontSize: 7.5, bold: true, color: palette.accent, align: "center", margin: 0 });

    slide.addText(slideData.title, { x: 0.78, y: 1.34, w: 4.42, h: 0.88, fontSize: 23, bold: true, color: palette.text, fit: "shrink" });

    if (slideData.takeaway) {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.78, y: 2.33, w: 4.44, h: 0.62, rectRadius: 0.08, fill: { color: palette.accent, transparency: 88 }, line: { color: palette.accent, transparency: 70 } });
      slide.addText(slideData.takeaway, { x: 1.0, y: 2.48, w: 4.05, h: 0.23, fontSize: 10.8, bold: true, color: palette.accent, fit: "shrink", margin: 0 });
    }

    const points = slideData.content.filter(Boolean).slice(0, detail.bulletCount);
    addBulletCards(pptx, slide, points, palette, 0.78, 3.18, 4.44, detail);

    const fallback = fallbackVisual({
      title: slideData.title,
      imageDesc: slideData.imageDesc || slideData.takeaway,
      palette,
      index,
    });
    addImageCard(pptx, slide, visualAssets[index], fallback, palette, 5.95, 0.62, 3.58, 5.78, slideData.imageDesc || slideData.takeaway || slideData.title);

    const noteParts = [];
    if (slideData.speakerNote) noteParts.push(`${lang.notePrefix}: ${slideData.speakerNote}`);
    if (visualAssets[index]?.source) noteParts.push(`Visual source: ${visualAssets[index].source}`);
    if (noteParts.length) slide.addNotes(noteParts.join("\n"));

    addFooter(pptx, slide, palette, index + 2, lang);
  });

  const fileName = `presentation-${Date.now()}.pptx`;
  const filePath = path.join(__dirname, "../../uploads", fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  await pptx.writeFile({ fileName: filePath });

  return {
    title: content.title || topic,
    fileName,
    fileUrl: `/uploads/${fileName}`,
  };
};

module.exports = { generatePresentationAI, generatePresentationPlan };
