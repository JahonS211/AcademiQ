const geminiService = require("../services/gemini.service");

const LANGUAGE = {
  uz: {
    name: "Uzbek",
    confidenceHigh: "yuqori",
    confidenceMedium: "o'rtacha",
    verdictHuman: "Inson yozgan bo'lishi ehtimoli yuqori",
    verdictMixed: "AI yordami aralashgan bo'lishi mumkin",
    verdictAI: "AI yozgan bo'lishi ehtimoli yuqori",
    reasonFallback: "Matn uslubi, takrorlanish va jumla ritmi bo'yicha baholandi.",
    indicatorsFallback: [
      { label: "Uslub", value: "Jumla ritmi va tabiiylik tekshirildi", explanation: "Matndagi gap uzunligi va ifoda turlicha ko'rib chiqildi." },
      { label: "Takrorlanish", value: "Bir xil iboralar qanchalik ko'p ishlatilgani baholandi", explanation: "AI matnlarda takroriy shablonlar ko'proq uchrashi mumkin." },
      { label: "Aniqlik", value: "Fikrlar dalil va kontekst bilan solishtirildi", explanation: "Noaniq umumiy gaplar ehtimolni oshiradi." }
    ],
  },
  ru: {
    name: "Russian",
    confidenceHigh: "высокая",
    confidenceMedium: "средняя",
    verdictHuman: "Скорее всего написано человеком",
    verdictMixed: "Возможно, текст частично написан с помощью AI",
    verdictAI: "Скорее всего написано AI",
    reasonFallback: "Оценены стиль, повторяемость и ритм предложений.",
    indicatorsFallback: [
      { label: "Стиль", value: "Проверены ритм предложений и естественность", explanation: "Сравнивались длина предложений и разнообразие формулировок." },
      { label: "Повторы", value: "Оценены повторяющиеся шаблоны", explanation: "AI-тексты чаще используют одинаковые конструкции." },
      { label: "Конкретика", value: "Проверены факты и контекст", explanation: "Слишком общие фразы повышают вероятность AI." }
    ],
  },
  en: {
    name: "English",
    confidenceHigh: "high",
    confidenceMedium: "medium",
    verdictHuman: "Likely written by a human",
    verdictMixed: "Potentially AI-assisted",
    verdictAI: "Highly likely AI-generated",
    reasonFallback: "The style, repetition, and sentence rhythm were evaluated.",
    indicatorsFallback: [
      { label: "Style", value: "Sentence rhythm and naturalness checked", explanation: "Sentence length and wording variety were compared." },
      { label: "Repetition", value: "Repeated patterns were evaluated", explanation: "AI text often uses similar structures repeatedly." },
      { label: "Specificity", value: "Facts and context were checked", explanation: "Vague generic wording increases AI probability." }
    ],
  },
};

const pickLanguage = (language) => (LANGUAGE[language] ? language : "uz");

const normalizeAiScore = (value) => {
  if (typeof value === "string") {
    value = value.replace("%", "").replace(",", ".");
  }
  let score = Number(value);
  if (!Number.isFinite(score)) return 0;
  if (score > 0 && score <= 1) score *= 100;
  return Math.min(100, Math.max(0, Math.round(score)));
};

const verdictForScore = (score, language) => {
  const lang = LANGUAGE[language];
  if (score >= 70) return lang.verdictAI;
  if (score >= 40) return lang.verdictMixed;
  return lang.verdictHuman;
};

const normalizeIndicators = (indicators, language) => {
  const fallback = LANGUAGE[language].indicatorsFallback;
  if (!Array.isArray(indicators) || indicators.length === 0) return fallback;

  return indicators.slice(0, 6).map((item, index) => ({
    label: String(item?.label || fallback[index % fallback.length].label),
    value: String(item?.value || item?.finding || fallback[index % fallback.length].value),
    explanation: String(item?.explanation || item?.reason || fallback[index % fallback.length].explanation),
  }));
};

const DETECTOR_COPY = {
  uz: {
    rhythm: "Jumla ritmi",
    repetition: "Takrorlanish",
    generic: "Umumiy iboralar",
    detail: "Aniq dalil",
    punctuation: "Tabiiy yozuv belgisi",
    length: "Matn hajmi",
    fallbackReason: "Matn lokal uslubiy belgilar bilan tahlil qilindi, chunki AI modeli vaqtincha javob bermadi.",
    aiPhrase: "AI matnlarga xos umumiy va silliq iboralar ko'p uchradi.",
    humanPhrase: "Matnda tabiiy ritm va oddiy insoniy ifoda belgilar ko'rindi.",
    mixedPhrase: "Matnda AI uslubiga o'xshash joylar bor, lekin ayrim tabiiy belgilar ham saqlangan.",
    shortText: "Matn qisqa bo'lgani uchun baho ehtiyotkor hisoblandi.",
    repetitive: "Bir xil so'z yoki iboralar takrorlangan.",
    lowSpecificity: "Aniq misol, raqam yoki shaxsiy kontekst kam.",
    highSpecificity: "Aniq so'zlar, raqamlar yoki kontekst bor.",
    uniform: "Gap uzunliklari bir-biriga juda yaqin.",
    varied: "Gap uzunliklari turlicha, bu tabiiy yozuvga yaqin.",
    confidenceLow: "past",
  },
  ru: {
    rhythm: "Ритм предложений",
    repetition: "Повторы",
    generic: "Общие фразы",
    detail: "Конкретные детали",
    punctuation: "Признаки живого письма",
    length: "Объем текста",
    fallbackReason: "Текст был проанализирован локально, потому что AI-модель временно не ответила.",
    aiPhrase: "В тексте много общих и слишком гладких формулировок, похожих на AI.",
    humanPhrase: "В тексте видны естественный ритм и признаки живого письма.",
    mixedPhrase: "В тексте есть признаки AI-стиля, но часть естественности сохранена.",
    shortText: "Текст короткий, поэтому оценка рассчитана осторожно.",
    repetitive: "Повторяются похожие слова или фразы.",
    lowSpecificity: "Мало конкретных примеров, чисел или личного контекста.",
    highSpecificity: "Есть конкретные слова, числа или контекст.",
    uniform: "Длины предложений слишком похожи друг на друга.",
    varied: "Длины предложений разные, это ближе к живому письму.",
    confidenceLow: "низкая",
  },
  en: {
    rhythm: "Sentence rhythm",
    repetition: "Repetition",
    generic: "Generic phrasing",
    detail: "Specific detail",
    punctuation: "Natural writing signals",
    length: "Text length",
    fallbackReason: "The text was analyzed with local style signals because the AI model did not respond.",
    aiPhrase: "The text contains many generic, overly smooth phrases often seen in AI writing.",
    humanPhrase: "The text shows natural rhythm and ordinary human writing signals.",
    mixedPhrase: "The text has some AI-like phrasing, but also keeps natural signals.",
    shortText: "The text is short, so the score is intentionally cautious.",
    repetitive: "Similar words or phrases repeat.",
    lowSpecificity: "Few concrete examples, numbers, or personal context were found.",
    highSpecificity: "Concrete terms, numbers, or context were found.",
    uniform: "Sentence lengths are very similar.",
    varied: "Sentence lengths vary, which is closer to natural writing.",
    confidenceLow: "low",
  },
};

const HUMANIZER_COPY = {
  uz: {
    fallback: "Matn yumshatildi: ortiqcha bo'shliqlar, takroriy bog'lovchilar va juda rasmiy ohang qisqartirildi.",
    noChange: "Matn allaqachon tabiiy ko'rindi, faqat mayda tozalashlar qilindi.",
  },
  ru: {
    fallback: "Текст смягчен: убраны лишние пробелы, повторы и слишком официальный тон.",
    noChange: "Текст уже выглядит естественно, выполнена только небольшая очистка.",
  },
  en: {
    fallback: "The text was softened by cleaning spacing, repeated connectors, and overly formal wording.",
    noChange: "The text already looked natural, so only light cleanup was applied.",
  },
};

const uniqueRatio = (words) => {
  if (!words.length) return 1;
  return new Set(words).size / words.length;
};

const variance = (numbers) => {
  if (numbers.length < 2) return 0;
  const avg = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  return numbers.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / numbers.length;
};

const localAiAnalysis = (text = "", language = "uz", reasonPrefix = "") => {
  const copy = DETECTOR_COPY[language] || DETECTOR_COPY.uz;
  const source = String(text || "");
  const lower = source.toLowerCase();
  const sentences = source.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const words = (lower.match(/[a-zа-яёʻ'’-]+/gi) || []).map((word) => word.replace(/[ʻ'’-]/g, ""));
  const wordCount = words.length;
  const sentenceLengths = sentences.map((sentence) => (sentence.match(/[a-zа-яёʻ'’-]+/gi) || []).length).filter(Boolean);
  const ratio = uniqueRatio(words);
  const repeatedScore = ratio < 0.42 ? 18 : ratio < 0.55 ? 10 : ratio < 0.68 ? 4 : -8;
  const rhythmVar = variance(sentenceLengths);
  const rhythmScore = sentences.length >= 3 && rhythmVar < 10 ? 16 : sentences.length >= 3 && rhythmVar > 55 ? -10 : 4;
  const genericPatterns = [
    /muhim ahamiyatga ega/g,
    /xulosa qilib aytganda/g,
    /zamonaviy dunyoda/g,
    /katta rol o'ynaydi/g,
    /shuni ta'kidlash kerak/g,
    /в современном мире/g,
    /следует отметить/g,
    /играет важную роль/g,
    /таким образом/g,
    /in today's world/g,
    /it is important to note/g,
    /plays a crucial role/g,
    /in conclusion/g,
    /overall,/g,
    /furthermore/g,
  ];
  const genericHits = genericPatterns.reduce((count, pattern) => count + ((lower.match(pattern) || []).length), 0);
  const genericScore = Math.min(24, genericHits * 8);
  const hasNumbers = /\d/.test(source);
  const hasQuotes = /["“”«»]/.test(source);
  const hasParentheses = /[()]/.test(source);
  const specificityScore = hasNumbers || hasQuotes || hasParentheses ? -10 : 12;
  const punctuationVariety = (source.match(/[,:;()"'“”«»]/g) || []).length;
  const punctuationScore = punctuationVariety >= 3 ? -8 : 6;
  const shortPenalty = wordCount < 80 ? -8 : 0;
  const longAiBoost = wordCount > 180 && genericHits >= 2 ? 10 : 0;
  const score = Math.max(5, Math.min(98, Math.round(45 + repeatedScore + rhythmScore + genericScore + specificityScore + punctuationScore + shortPenalty + longAiBoost)));

  const indicators = [
    {
      label: copy.rhythm,
      value: rhythmScore >= 10 ? copy.uniform : copy.varied,
      explanation: sentences.length < 3 ? copy.shortText : `${sentences.length} ta gap ritmi va uzunligi solishtirildi.`,
    },
    {
      label: copy.repetition,
      value: repeatedScore >= 10 ? copy.repetitive : `Unique ratio: ${Math.round(ratio * 100)}%`,
      explanation: repeatedScore >= 10 ? copy.repetitive : "So'zlar xilma-xilligi AI ehtimolini pasaytiradi.",
    },
    {
      label: copy.generic,
      value: genericHits ? `${genericHits} ta shablon ibora` : "Kuchli shablon ibora kam",
      explanation: genericHits ? copy.aiPhrase : copy.humanPhrase,
    },
    {
      label: copy.detail,
      value: hasNumbers || hasQuotes || hasParentheses ? copy.highSpecificity : copy.lowSpecificity,
      explanation: hasNumbers || hasQuotes || hasParentheses ? copy.highSpecificity : copy.lowSpecificity,
    },
    {
      label: copy.punctuation,
      value: punctuationVariety >= 3 ? "Tabiiyroq punktuatsiya" : "Punktuatsiya juda sodda",
      explanation: punctuationScore < 0 ? copy.humanPhrase : "Juda tekis punktuatsiya AI matnlarda ko'proq uchrashi mumkin.",
    },
  ];

  return {
    aiScore: score,
    verdict: verdictForScore(score, language),
    confidence: wordCount < 80 ? copy.confidenceLow : (score > 80 || score < 20 ? LANGUAGE[language].confidenceHigh : LANGUAGE[language].confidenceMedium),
    shortReason: reasonPrefix || (score >= 70 ? copy.aiPhrase : score >= 40 ? copy.mixedPhrase : copy.humanPhrase),
    indicators,
  };
};

const normalizeAiDetectorResult = (raw, text, language) => {
  const local = localAiAnalysis(text, language);
  const rawScore = raw?.aiScore ?? raw?.score ?? raw?.aiProbability ?? raw?.probability;
  const parsedScore = rawScore === undefined || rawScore === null ? null : normalizeAiScore(rawScore);
  let aiScore = parsedScore === null ? local.aiScore : Math.round((parsedScore * 0.55) + (local.aiScore * 0.45));

  if (parsedScore !== null && parsedScore >= 55 && parsedScore <= 65 && local.aiScore >= 72) {
    aiScore = local.aiScore;
  }
  if (parsedScore !== null && parsedScore >= 55 && parsedScore <= 65 && local.aiScore <= 30) {
    aiScore = local.aiScore;
  }

  const rawIndicators = normalizeIndicators(raw?.indicators, language);
  const indicators = rawIndicators.length ? rawIndicators.slice(0, 3).concat(local.indicators.slice(0, 3)) : local.indicators;
  const lang = LANGUAGE[language];

  return {
    aiScore,
    verdict: raw?.verdict || verdictForScore(aiScore, language),
    confidence: raw?.confidence || (aiScore > 80 || aiScore < 20 ? lang.confidenceHigh : lang.confidenceMedium),
    shortReason: raw?.shortReason || raw?.reason || local.shortReason,
    indicators: indicators.slice(0, 6),
  };
};

const fallbackHumanize = (text = "", language = "uz") => {
  const copy = HUMANIZER_COPY[language] || HUMANIZER_COPY.uz;
  let output = String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\b(shuni ta'kidlash kerakki|xulosa qilib aytganda),?\s*/gi, "")
    .replace(/\b(it is important to note that|in conclusion),?\s*/gi, "")
    .replace(/\b(следует отметить,? что|таким образом),?\s*/gi, "")
    .trim();

  if (!output) output = String(text || "").trim();
  return {
    humanizedText: output,
    changesSummary: output === String(text || "").trim() ? copy.noChange : copy.fallback,
  };
};

const normalizeHumanizerResult = (raw, text, language) => {
  const fallback = fallbackHumanize(text, language);
  const humanizedText = raw?.humanizedText || raw?.text || raw?.result || raw?.rewrittenText;
  if (!humanizedText || typeof humanizedText !== "string") return fallback;
  return {
    humanizedText,
    changesSummary: String(raw?.changesSummary || raw?.summary || fallback.changesSummary),
  };
};

const GRAMMAR_COPY = {
  uz: {
    clean: "Matn yaxshi ko'rinadi. Jiddiy xato topilmadi.",
    fixed: "Matn tekshirildi va kerakli tuzatishlar taklif qilindi.",
    punctuation: "Tinish belgisi",
    spelling: "Imlo",
    spacing: "Oraliq",
    grammar: "Grammatika",
    critical: "muhim",
    medium: "o'rtacha",
    minor: "kichik",
    doubleSpace: "Ortiqcha bo'sh joy matnni noqulay ko'rsatadi.",
    punctuationSpace: "Tinish belgisidan keyin bitta bo'sh joy bo'lishi kerak.",
    sentenceStart: "Gap boshidagi harf katta yoziladi.",
    englishHello: "Ingliz tilida salomlashuvdan keyin odatda vergul qo'yiladi.",
    englishWorld: "Bu iborada odatda birlikdagi 'world' ishlatiladi.",
    englishI: "Ingliz tilida 'I' olmoshi katta harf bilan yoziladi.",
  },
  ru: {
    clean: "Текст выглядит хорошо. Серьезных ошибок не найдено.",
    fixed: "Текст проверен, предложены нужные исправления.",
    punctuation: "Пунктуация",
    spelling: "Орфография",
    spacing: "Пробелы",
    grammar: "Грамматика",
    critical: "важно",
    medium: "средне",
    minor: "мелко",
    doubleSpace: "Лишние пробелы ухудшают читаемость текста.",
    punctuationSpace: "После знака препинания нужен один пробел.",
    sentenceStart: "Предложение начинается с заглавной буквы.",
    englishHello: "После приветственного слова в английском обычно ставится запятая.",
    englishWorld: "В этом выражении обычно используется единственное число 'world'.",
    englishI: "В английском местоимение 'I' пишется с заглавной буквы.",
  },
  en: {
    clean: "The text looks good. No serious issues were found.",
    fixed: "The text was checked and clear fixes were suggested.",
    punctuation: "Punctuation",
    spelling: "Spelling",
    spacing: "Spacing",
    grammar: "Grammar",
    critical: "critical",
    medium: "medium",
    minor: "minor",
    doubleSpace: "Extra spaces make the text harder to read.",
    punctuationSpace: "Use one space after punctuation.",
    sentenceStart: "A sentence should start with a capital letter.",
    englishHello: "In English, a greeting/interjection is usually followed by a comma.",
    englishWorld: "This phrase normally uses the singular form 'world'.",
    englishI: "The English pronoun 'I' is written with a capital letter.",
  },
};

const makeGrammarIssue = ({ original, correction, explanation, category, severity = "medium", begin = -1, end = -1, replacements = [] }) => ({
  original: String(original || ""),
  correction: String(correction || ""),
  explanation: String(explanation || ""),
  category: String(category || "Grammar"),
  severity: String(severity || "medium"),
  begin: Number.isFinite(Number(begin)) ? Number(begin) : -1,
  end: Number.isFinite(Number(end)) ? Number(end) : -1,
  replacements: Array.isArray(replacements) ? replacements.map(String).slice(0, 5) : [],
});

const localGrammarCheck = (text = "", language = "uz") => {
  const copy = GRAMMAR_COPY[language] || GRAMMAR_COPY.uz;
  let correctedText = String(text);
  const errors = [];
  const addIssue = (issue) => errors.push(makeGrammarIssue(issue));

  correctedText = correctedText.replace(/[ \t]{2,}/g, (match, offset) => {
    addIssue({
      original: match,
      correction: " ",
      explanation: copy.doubleSpace,
      category: copy.spacing,
      severity: "minor",
      begin: offset,
      end: offset + match.length,
      replacements: [" "],
    });
    return " ";
  });

  correctedText = correctedText.replace(/([,.!?;:])([^\s])/g, (match, mark, next, offset) => {
    addIssue({
      original: match,
      correction: `${mark} ${next}`,
      explanation: copy.punctuationSpace,
      category: copy.punctuation,
      severity: "minor",
      begin: offset,
      end: offset + match.length,
      replacements: [`${mark} ${next}`],
    });
    return `${mark} ${next}`;
  });

  correctedText = correctedText.replace(/(^|[.!?]\s+)([a-zа-яё])/g, (match, prefix, letter, offset) => {
    const correction = `${prefix}${letter.toUpperCase()}`;
    addIssue({
      original: match,
      correction,
      explanation: copy.sentenceStart,
      category: copy.grammar,
      severity: "medium",
      begin: offset,
      end: offset + match.length,
      replacements: [correction],
    });
    return correction;
  });

  if (language === "en") {
    correctedText = correctedText.replace(/\b(i)\b/g, (match, pronoun, offset) => {
      addIssue({
        original: pronoun,
        correction: "I",
        explanation: copy.englishI,
        category: copy.grammar,
        severity: "critical",
        begin: offset,
        end: offset + pronoun.length,
        replacements: ["I"],
      });
      return "I";
    });

    correctedText = correctedText.replace(/\b(Hello|Hi|Hey|Well|Yes|No|Oh|Wow)\s+(?![,!?.])/gi, (match, word, offset) => {
      const correction = `${word}, `;
      addIssue({
        original: word,
        correction: `${word},`,
        explanation: copy.englishHello,
        category: copy.punctuation,
        severity: "critical",
        begin: offset,
        end: offset + word.length,
        replacements: [","],
      });
      return correction;
    });

    correctedText = correctedText.replace(/\bworlds\b/gi, (match, offset) => {
      addIssue({
        original: match,
        correction: "world",
        explanation: copy.englishWorld,
        category: copy.spelling,
        severity: "medium",
        begin: offset,
        end: offset + match.length,
        replacements: ["world"],
      });
      return match[0] === "W" ? "World" : "world";
    });
  }

  return {
    correctedText,
    summary: errors.length ? copy.fixed : copy.clean,
    score: Math.max(0, 100 - errors.length * 12),
    errors,
  };
};

const normalizeGrammarResult = (raw, originalText, language) => {
  const copy = GRAMMAR_COPY[language] || GRAMMAR_COPY.uz;
  const local = localGrammarCheck(originalText, language);
  const rawErrors = Array.isArray(raw?.errors) ? raw.errors : [];
  const aiErrors = rawErrors.map((item) => makeGrammarIssue({
    original: item?.original || item?.text || item?.highlightText || item?.wrong,
    correction: item?.correction || item?.replacement || item?.suggestion || item?.correct,
    explanation: item?.explanation || item?.reason || item?.details || item?.title,
    category: item?.category || item?.group || item?.categoryHuman || copy.grammar,
    severity: item?.severity || item?.impact || copy.medium,
    begin: item?.begin ?? item?.start,
    end: item?.end,
    replacements: item?.replacements || (item?.correction ? [item.correction] : []),
  })).filter((item) => item.original || item.correction || item.explanation);

  const mergedErrors = [...local.errors, ...aiErrors].slice(0, 18);
  return {
    correctedText: String(raw?.correctedText || local.correctedText || originalText),
    summary: String(raw?.summary || (mergedErrors.length ? copy.fixed : copy.clean)),
    score: Number.isFinite(Number(raw?.score)) ? Math.max(0, Math.min(100, Math.round(Number(raw.score)))) : Math.max(0, 100 - mergedErrors.length * 10),
    errors: mergedErrors,
  };
};

const checkGrammar = async (req, res, next) => {
  try {
    const { text, language = "en" } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const langKey = pickLanguage(language);
    const langName = LANGUAGE[langKey].name;

    const prompt = `You are a precise Grammarly-style editor. Check the text for grammar, spelling, punctuation, clarity, and style.
Keep the meaning unchanged. Do not add new facts. If there are no issues, return an empty errors array.
All explanations, category names, summary, and labels must be in ${langName}.
Be concrete: identify the exact wrong fragment and the exact replacement.

Text:
"""
${text}
"""

Return ONLY JSON:
{
  "correctedText": "full corrected text",
  "summary": "one short overall sentence",
  "score": 0-100,
  "errors": [
    {
      "original": "exact wrong fragment",
      "correction": "exact corrected fragment",
      "explanation": "short clear reason",
      "category": "punctuation / spelling / grammar / style translated to ${langName}",
      "severity": "critical / medium / minor translated to ${langName}",
      "begin": 0,
      "end": 5,
      "replacements": ["replacement 1"]
    }
  ]
}`;

    const raw = await geminiService.generateJSON(prompt, null, req.user.planType || req.user.plan || "free", {});
    
    const result = raw?.error ? localGrammarCheck(text, langKey) : normalizeGrammarResult(raw, text, langKey);
    
    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Grammarly: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits,
      cost: req.creditCost || 0,
    });
  } catch (error) {
    return next(error);
  }
};

const detectAI = async (req, res, next) => {
  try {
    const { text, language = "uz" } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const langKey = pickLanguage(language);
    const langName = LANGUAGE[langKey].name;

    const prompt = `Analyze whether the text is AI-written or human-written.
Respond in ${langName}. This is a probability, but use the FULL 0-100 range when the evidence is strong.
Return aiScore as an INTEGER from 0 to 100. Never return decimals like 0.4; use 40 instead.
Do not default to 50 or 60. If the text is highly generic, repetitive, polished, and lacks concrete detail, scores from 75 to 95 are allowed.
If the text has personal context, irregular rhythm, natural small mistakes, and specific details, scores from 5 to 35 are allowed.
Give concrete reasons from this exact text: sentence rhythm, repetition, specificity, natural errors, tone, vocabulary, and examples of phrases.

Text:
"""
${text}
"""

Return ONLY JSON. All string values must be in ${langName}:
{
  "aiScore": 40,
  "verdict": "clear verdict in ${langName}",
  "confidence": "low / medium / high translated to ${langName}",
  "shortReason": "one clear sentence with the main reason",
  "indicators": [
    { "label": "specific indicator", "value": "what you observed", "explanation": "why this matters" }
  ]
}`;

    const raw = await geminiService.generateJSON(prompt, null, req.user.planType || req.user.plan || "free", {});
    const result = raw?.error
      ? localAiAnalysis(text, langKey, `${(DETECTOR_COPY[langKey] || DETECTOR_COPY.uz).fallbackReason} ${raw.error}`)
      : normalizeAiDetectorResult(raw, text, langKey);

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`AI Detector: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits,
      cost: req.creditCost || 0,
    });
  } catch (error) {
    return next(error);
  }
};

const humanizeText = async (req, res, next) => {
  try {
    const { text, language = "uz" } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const langKey = pickLanguage(language);
    const langName = LANGUAGE[langKey].name;

    const prompt = `You are a professional human editor. Rewrite the text in ${langName} so it sounds natural, clear, and human-written.
Keep the same meaning, facts, numbers, and structure. Remove robotic phrasing, repeated patterns, stiff transitions, and generic AI-style wording.
Use natural sentence length variety and a friendly but academic tone. Do not add new facts.
Return all fields in ${langName}.

Text:
"""
${text}
"""

Return ONLY JSON:
{
  "humanizedText": "natural rewritten text",
  "changesSummary": "one short sentence explaining what changed"
}`;

    const raw = await geminiService.generateJSON(prompt, null, req.user.planType || req.user.plan || "free", {});
    const result = raw?.error ? fallbackHumanize(text, langKey) : normalizeHumanizerResult(raw, text, langKey);

    let remainingCredits = null;
    if (req.deductCredits) {
      remainingCredits = await req.deductCredits(`Humanizer: ${text.slice(0, 30)}...`);
    }

    return res.status(200).json({
      success: true,
      result,
      remainingCredits,
      cost: req.creditCost || 0,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { checkGrammar, detectAI, humanizeText };
