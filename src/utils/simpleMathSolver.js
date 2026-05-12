const normalizeExpression = (value = "") => String(value)
  .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
  .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
  .replace(/,/g, ".")
  .replace(/×/g, "*")
  .replace(/÷/g, "/")
  .replace(/\^/g, "**")
  .replace(/√\s*\(/g, "sqrt(")
  .replace(/√\s*([0-9.]+)/g, "sqrt($1)")
  .replace(/sqrt\(/gi, "Math.sqrt(")
  .replace(/sin\(/gi, "Math.sin(")
  .replace(/cos\(/gi, "Math.cos(")
  .replace(/tan\(/gi, "Math.tan(")
  .replace(/\bpi\b/gi, "Math.PI")
  .trim();

const extractExpression = (prompt = "") => {
  const text = String(prompt || "")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/hisobla|yech|top|calculate|solve|=/gi, " ")
    .trim();

  const matches = text.match(/[0-9+\-*/^().,\s√a-zA-Z]+/g) || [];
  return matches
    .map((item) => item.trim())
    .filter((item) => /[0-9]/.test(item) && /[+\-*/^√]|sqrt|sin|cos|tan/i.test(item))
    .sort((a, b) => b.length - a.length)[0] || "";
};

const isSafeExpression = (expression = "") => {
  const normalized = normalizeExpression(expression);
  if (!normalized || normalized.length > 180) return false;
  return /^[0-9+\-*/().\sMathsqrtincotaPI*]+$/i.test(normalized)
    && !/[;={}\[\]`"'\\]|process|global|require|while|for|function|=>/i.test(normalized);
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.abs(value) < 1e-10 ? 0 : value;
  return Number(rounded.toFixed(10)).toLocaleString("uz-UZ", { maximumFractionDigits: 10 });
};

const tryEvaluateArithmetic = (prompt = "") => {
  const expression = extractExpression(prompt);
  if (!isSafeExpression(expression)) return null;

  try {
    const normalized = normalizeExpression(expression);
    // Input is restricted by isSafeExpression to numeric operators and Math functions.
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${normalized});`)();
    if (!Number.isFinite(Number(value))) return null;

    return {
      expression,
      result: formatNumber(Number(value)),
      numeric: Number(value),
    };
  } catch (_) {
    return null;
  }
};

const trySolveQuadratic = (prompt = "") => {
  const text = String(prompt || "").replace(/\s+/g, "");
  const match = text.match(/([+-]?\d*)x\^2([+-]\d*)x([+-]\d+)=0/i);
  if (!match) return null;

  const parseCoeff = (value, fallbackOne = false) => {
    if (value === "" || value === "+") return fallbackOne ? 1 : 0;
    if (value === "-") return fallbackOne ? -1 : 0;
    return Number(value);
  };

  const a = parseCoeff(match[1], true);
  const b = parseCoeff(match[2], false);
  const c = parseCoeff(match[3], false);
  if (![a, b, c].every(Number.isFinite) || a === 0) return null;

  const d = b * b - 4 * a * c;
  if (d < 0) {
    return {
      expression: `${a}x^2 ${b >= 0 ? "+" : ""}${b}x ${c >= 0 ? "+" : ""}${c}=0`,
      result: "Haqiqiy ildiz yo'q",
      steps: [
        `Diskriminant: D = b^2 - 4ac = ${b}^2 - 4*${a}*${c} = ${d}`,
        "D < 0 bo'lgani uchun haqiqiy ildizlar mavjud emas.",
      ],
    };
  }

  const sqrtD = Math.sqrt(d);
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  return {
    expression: `${a}x^2 ${b >= 0 ? "+" : ""}${b}x ${c >= 0 ? "+" : ""}${c}=0`,
    result: d === 0 ? `x = ${formatNumber(x1)}` : `x1 = ${formatNumber(x1)}, x2 = ${formatNumber(x2)}`,
    steps: [
      `Diskriminant: D = b^2 - 4ac = ${b}^2 - 4*${a}*${c} = ${formatNumber(d)}`,
      `Formula: x = \\frac{-b ± \\sqrt{D}}{2a}`,
      d === 0
        ? `x = \\frac{${-b}}{${2 * a}} = ${formatNumber(x1)}`
        : `x1 = \\frac{${-b} + \\sqrt{${d}}}{${2 * a}} = ${formatNumber(x1)}, x2 = \\frac{${-b} - \\sqrt{${d}}}{${2 * a}} = ${formatNumber(x2)}`,
    ],
    expressions: [`y=${a}x^2${b >= 0 ? "+" : ""}${b}x${c >= 0 ? "+" : ""}${c}`],
  };
};

const tryLocalMathSolve = (prompt = "") => {
  const quadratic = trySolveQuadratic(prompt);
  if (quadratic) return quadratic;

  const arithmetic = tryEvaluateArithmetic(prompt);
  if (arithmetic) {
    return {
      expression: arithmetic.expression,
      result: arithmetic.result,
      steps: [
        `Ifoda: ${arithmetic.expression}`,
        `Hisoblangan qiymat: ${arithmetic.result}`,
      ],
      expressions: [],
    };
  }

  return null;
};

module.exports = { tryLocalMathSolve };
