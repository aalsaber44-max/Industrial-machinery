import { BASE_UNITS, PREFIXES, type BaseUnit } from '../data/units';

export function prefixExponent(prefixSymbol: string): number {
  const p = PREFIXES.find((x) => x.symbol === prefixSymbol);
  if (!p) throw new Error(`Unknown prefix: ${prefixSymbol}`);
  return p.exponent;
}

/**
 * تحويل قيمة بين مضاعفين لنفس الوحدة الأساسية.
 * يستخدم الأس العشري كنص لتجنب أخطاء الفاصلة العائمة (مثل 0.1 + 0.2).
 */
export function convertValue(value: number, fromPrefix: string, toPrefix: string): number {
  const shift = prefixExponent(fromPrefix) - prefixExponent(toPrefix);
  return Number(`${value}e${shift}`);
}

/** تحويل نص رقمي (يقبل الأرقام الهندية وفاصلة عربية/إنجليزية) إلى رقم، أو NaN. */
export function parseNumberInput(text: string): number {
  const hindi = '٠١٢٣٤٥٦٧٨٩';
  let cleaned = text
    .trim()
    .replace(/[٠-٩]/g, (d) => String(hindi.indexOf(d)))
    .replace(/\s+/g, '');
  // فاصل الآلاف (مثل 2,500 أو 1,000,000) يُحذف، وغير ذلك تُعامل الفاصلة كفاصلة عشرية
  if (/^-?\d{1,3}([,٬]\d{3})+(\.\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/[,٬]/g, '');
  } else {
    cleaned = cleaned.replace(/[٫,]/g, '.');
  }
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return NaN;
  return Number(cleaned);
}

/** تنسيق رقم للعرض بدون أخطاء عشرية طويلة. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toPrecision(12));
  if (Math.abs(rounded) >= 1e15 || (rounded !== 0 && Math.abs(rounded) < 1e-9)) {
    return rounded.toExponential(3);
  }
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 12 });
}

export interface ConversionQuestion {
  value: number;
  base: BaseUnit;
  fromPrefix: string;
  toPrefix: string;
  answer: number;
}

const SAMPLE_VALUES = [1, 2, 2.5, 3, 4.7, 5, 10, 25, 50, 100, 250, 500, 1500, 2500];

/** توليد سؤال تحويل عشوائي (قابل للاختبار عبر تمرير rng). */
export function generateConversionQuestion(rng: () => number = Math.random): ConversionQuestion {
  const base = BASE_UNITS[Math.floor(rng() * BASE_UNITS.length)];
  const prefixes = base.allowedPrefixes;
  const fromPrefix = prefixes[Math.floor(rng() * prefixes.length)];
  let toPrefix = fromPrefix;
  while (toPrefix === fromPrefix) {
    toPrefix = prefixes[Math.floor(rng() * prefixes.length)];
  }
  const value = SAMPLE_VALUES[Math.floor(rng() * SAMPLE_VALUES.length)];
  return { value, base, fromPrefix, toPrefix, answer: convertValue(value, fromPrefix, toPrefix) };
}

/** مقارنة إجابة الطالب بالجواب الصحيح بتسامح نسبي صغير. */
export function isAnswerCorrect(userText: string, expected: number): boolean {
  const n = parseNumberInput(userText);
  if (Number.isNaN(n)) return false;
  if (expected === 0) return n === 0;
  return Math.abs(n - expected) / Math.abs(expected) < 1e-9;
}
