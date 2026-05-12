"use client";

const outerRegex = /(`[^`]+`|\*\*[^*]+\*\*|\$[^$]+\$)/g;
const mathTokenRegex = /(\\frac\{([^{}]+)\}\{([^{}]+)\}|\\sqrt\{([^{}]+)\}|sqrt\(([^()]+)\)|(\b\d+(?:\.\d+)?|\b[a-zA-Z])\/(\d+(?:\.\d+)?|[a-zA-Z]\b)|([a-zA-Z0-9()]+)\^([a-zA-Z0-9()+-]+))/g;

const Fraction = ({ top, bottom }) => (
  <span className="mx-1 inline-flex translate-y-[0.22em] flex-col items-center align-middle font-serif text-[1.05em] font-semibold leading-none">
    <span className="border-b-2 border-current px-1.5 pb-0.5">{top}</span>
    <span className="px-1.5 pt-0.5">{bottom}</span>
  </span>
);

const Root = ({ value }) => (
  <span className="mx-1 inline-flex items-start align-middle font-serif text-[1.05em] font-semibold">
    <span className="pr-0.5 text-[1.35em] leading-none">√</span>
    <span className="border-t-2 border-current px-1 pt-0.5 leading-none">{value}</span>
  </span>
);

const Sup = ({ base, power }) => (
  <span className="font-serif font-semibold">
    {base}<sup className="ml-0.5 text-[0.72em] leading-none">{power}</sup>
  </span>
);

const renderMathTokens = (source = "", keyPrefix = "math") => {
  const parts = [];
  let lastIndex = 0;
  let match;

  mathTokenRegex.lastIndex = 0;
  while ((match = mathTokenRegex.exec(source)) !== null) {
    const [raw, latexFrac, latexTop, latexBottom, latexRoot, rootValue, plainTop, plainBottom, powerBase, powerValue] = match;

    if (match.index > lastIndex) {
      parts.push(<span key={`${keyPrefix}-plain-${lastIndex}`}>{source.slice(lastIndex, match.index)}</span>);
    }

    if (latexFrac) {
      parts.push(<Fraction key={`${keyPrefix}-frac-${match.index}`} top={latexTop} bottom={latexBottom} />);
    } else if (latexRoot) {
      parts.push(<Root key={`${keyPrefix}-root-${match.index}`} value={latexRoot} />);
    } else if (rootValue) {
      parts.push(<Root key={`${keyPrefix}-sqrt-${match.index}`} value={rootValue} />);
    } else if (plainTop && plainBottom) {
      parts.push(<Fraction key={`${keyPrefix}-plain-frac-${match.index}`} top={plainTop} bottom={plainBottom} />);
    } else if (powerBase && powerValue) {
      parts.push(<Sup key={`${keyPrefix}-pow-${match.index}`} base={powerBase} power={powerValue} />);
    } else {
      parts.push(<span key={`${keyPrefix}-raw-${match.index}`}>{raw}</span>);
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < source.length) {
    parts.push(<span key={`${keyPrefix}-plain-${lastIndex}`}>{source.slice(lastIndex)}</span>);
  }

  return parts;
};

export default function MathInline({ text = "", keyPrefix = "math" }) {
  const source = String(text || "");
  const parts = [];
  let lastIndex = 0;
  let match;

  outerRegex.lastIndex = 0;
  while ((match = outerRegex.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderMathTokens(source.slice(lastIndex, match.index), `${keyPrefix}-segment-${lastIndex}`));
    }

    const raw = match[0];
    if (raw.startsWith("`") && raw.endsWith("`")) {
      parts.push(
        <code key={`${keyPrefix}-code-${match.index}`} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] text-emerald-400">
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith("**") && raw.endsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-bold-${match.index}`} className="font-black text-slate-900 dark:text-white">
          {renderMathTokens(raw.slice(2, -2), `${keyPrefix}-bold-math-${match.index}`)}
        </strong>
      );
    } else if (raw.startsWith("$") && raw.endsWith("$")) {
      parts.push(
        <span key={`${keyPrefix}-dollar-${match.index}`} className="font-serif text-[1.05em] font-semibold">
          {renderMathTokens(raw.slice(1, -1), `${keyPrefix}-dollar-math-${match.index}`)}
        </span>
      );
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < source.length) {
    parts.push(...renderMathTokens(source.slice(lastIndex), `${keyPrefix}-tail-${lastIndex}`));
  }

  return <>{parts}</>;
}
