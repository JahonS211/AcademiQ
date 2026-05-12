const fs = require("fs");
const path = require("path");

const escapeXml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const hashText = (value = "") => {
  let hash = 0;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const splitLines = (text = "", maxChars = 28, maxLines = 4) => {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines.slice(0, maxLines);
};

const normalizeColor = (value, fallback) => {
  const color = String(value || "").replace("#", "").trim();
  return /^[0-9a-fA-F]{6}$/.test(color) ? color.toUpperCase() : fallback;
};

const buildDiagram = ({ variant, palette, seed }) => {
  if (variant === 0) {
    return `
      <circle cx="1110" cy="286" r="128" fill="#${palette.accent}" opacity="0.18"/>
      <circle cx="1288" cy="420" r="150" fill="#${palette.accent2}" opacity="0.22"/>
      <path d="M980 585 C1122 470 1337 510 1440 626" fill="none" stroke="#${palette.accent}" stroke-width="18" stroke-linecap="round" opacity="0.65"/>
      <rect x="995" y="245" width="398" height="326" rx="38" fill="#${palette.panel}" opacity="0.92"/>
      <path d="M1042 492 L1142 392 L1225 458 L1358 318" fill="none" stroke="#${palette.accent2}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="1042" cy="492" r="17" fill="#${palette.accent2}"/>
      <circle cx="1142" cy="392" r="17" fill="#${palette.accent2}"/>
      <circle cx="1225" cy="458" r="17" fill="#${palette.accent2}"/>
      <circle cx="1358" cy="318" r="17" fill="#${palette.accent2}"/>
    `;
  }

  if (variant === 1) {
    return `
      <rect x="968" y="194" width="410" height="88" rx="28" fill="#${palette.panel}" opacity="0.96"/>
      <rect x="1034" y="354" width="410" height="88" rx="28" fill="#${palette.panel}" opacity="0.9"/>
      <rect x="968" y="514" width="410" height="88" rx="28" fill="#${palette.panel}" opacity="0.96"/>
      <path d="M1174 292 L1174 336" stroke="#${palette.accent}" stroke-width="16" stroke-linecap="round"/>
      <path d="M1174 452 L1174 496" stroke="#${palette.accent2}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="1015" cy="238" r="20" fill="#${palette.accent}"/>
      <circle cx="1082" cy="398" r="20" fill="#${palette.accent2}"/>
      <circle cx="1015" cy="558" r="20" fill="#${palette.accent}"/>
    `;
  }

  if (variant === 2) {
    return `
      <path d="M1010 610 L1185 190 L1370 610 Z" fill="#${palette.panel}" opacity="0.94"/>
      <path d="M1088 565 L1185 332 L1290 565 Z" fill="#${palette.accent}" opacity="0.18"/>
      <circle cx="1185" cy="258" r="54" fill="#${palette.accent2}" opacity="0.9"/>
      <path d="M1110 610 H1368" stroke="#${palette.accent}" stroke-width="20" stroke-linecap="round" opacity="0.75"/>
      <path d="M1060 672 H1420" stroke="#${palette.accent2}" stroke-width="16" stroke-linecap="round" opacity="0.45"/>
    `;
  }

  return `
    <circle cx="1170" cy="388" r="210" fill="#${palette.panel}" opacity="0.9"/>
    <circle cx="1170" cy="388" r="150" fill="#${palette.bg}" opacity="0.95"/>
    <path d="M1170 238 A150 150 0 0 1 1320 388" fill="none" stroke="#${palette.accent}" stroke-width="34" stroke-linecap="round"/>
    <path d="M1170 538 A150 150 0 0 1 1020 388" fill="none" stroke="#${palette.accent2}" stroke-width="34" stroke-linecap="round"/>
    <circle cx="${1040 + (seed % 80)}" cy="235" r="22" fill="#${palette.accent2}" opacity="0.85"/>
    <circle cx="${1320 - (seed % 70)}" cy="552" r="28" fill="#${palette.accent}" opacity="0.75"/>
  `;
};

const createGeneratedSvgVisual = ({
  title = "Thinky visual",
  description = "",
  keywords = [],
  palette = {},
  index = 0,
  width = 1600,
  height = 900,
}) => {
  const safePalette = {
    bg: normalizeColor(palette.bg, "F7FAFF"),
    panel: normalizeColor(palette.panel, "FFFFFF"),
    accent: normalizeColor(palette.accent, "4F46E5"),
    accent2: normalizeColor(palette.accent2, "06B6D4"),
    text: normalizeColor(palette.text, "111827"),
    muted: normalizeColor(palette.muted, "64748B"),
    soft: normalizeColor(palette.soft, "EEF2FF"),
  };
  const seed = hashText(`${title} ${description} ${keywords.join(" ")}`);
  const variant = (seed + index) % 4;
  const titleLines = splitLines(title, 25, 3);
  const descLines = splitLines(description || keywords.join(", "), 40, 4);
  const keywordList = keywords.slice(0, 4).filter(Boolean);

  const titleSvg = titleLines.map((line, lineIndex) => (
    `<text x="96" y="${190 + lineIndex * 58}" fill="#${safePalette.text}" font-size="48" font-weight="900" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
  )).join("");

  const descSvg = descLines.map((line, lineIndex) => (
    `<text x="102" y="${482 + lineIndex * 36}" fill="#${safePalette.muted}" font-size="24" font-weight="700" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
  )).join("");

  const chipsSvg = keywordList.map((keyword, chipIndex) => {
    const x = 100 + chipIndex * 210;
    return `
      <rect x="${x}" y="674" width="178" height="54" rx="20" fill="#${chipIndex % 2 ? safePalette.accent2 : safePalette.accent}" opacity="0.14"/>
      <text x="${x + 22}" y="709" fill="#${chipIndex % 2 ? safePalette.accent2 : safePalette.accent}" font-size="20" font-weight="850" font-family="Arial, sans-serif">${escapeXml(String(keyword).slice(0, 18))}</text>
    `;
  }).join("");

  const diagram = buildDiagram({ variant, palette: safePalette, seed });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#${safePalette.bg}"/>
      <stop offset="100%" stop-color="#${safePalette.soft}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#${safePalette.accent}"/>
      <stop offset="100%" stop-color="#${safePalette.accent2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#111827" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" rx="70" fill="url(#bg)"/>
  <path d="M110 116 H940" stroke="#${safePalette.accent}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
  <path d="M110 145 H680" stroke="#${safePalette.accent2}" stroke-width="8" stroke-linecap="round" opacity="0.55"/>
  <rect x="70" y="92" width="1460" height="716" rx="58" fill="#${safePalette.panel}" opacity="0.68" filter="url(#shadow)"/>
  <text x="100" y="126" fill="#${safePalette.accent}" font-size="22" font-weight="900" font-family="Arial, sans-serif" letter-spacing="7">AI VISUAL ${String(index + 1).padStart(2, "0")}</text>
  ${titleSvg}
  ${descSvg}
  ${chipsSvg}
  ${diagram}
</svg>`.trim();
};

const svgToDataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;

const writeGeneratedSvgImage = ({ prompt, title, description, keywords = [], palette = {}, index = 0, uploadsDir }) => {
  const svg = createGeneratedSvgVisual({ title: title || prompt, description: description || prompt, keywords, palette, index });
  const dir = uploadsDir || path.join(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `ai-image-${Date.now()}-${Math.round(Math.random() * 1e9)}.svg`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, svg, "utf8");
  return {
    fileName,
    filePath,
    fileUrl: `/uploads/${fileName}`,
    data: svgToDataUri(svg),
    source: "Thinky AI generated",
  };
};

module.exports = {
  createGeneratedSvgVisual,
  svgToDataUri,
  writeGeneratedSvgImage,
};
