import type { ElectricalSymbol } from '../data/symbols';

export type QuizMode = 'full' | 'quick20' | 'practice';

export type AnswerStatus = 'correct' | 'close' | 'wrong' | 'skipped' | 'revealed';

export interface EvaluationResult {
  status: 'correct' | 'close' | 'wrong' | 'revealed';
  similarity: number;
  message: string;
}

export interface AnswerRecord {
  symbol: ElectricalSymbol;
  userAnswer: string;
  status: AnswerStatus;
  timeSpentSec: number;
}

/**
 * خوارزمية Fisher-Yates لخلط نسخة من المصفوفة عشوائياً دون تعديل الأصل.
 */
export function shuffleArray<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * تطبيع النص العربي والإنجليزي للتدقيق الذكي:
 * 1. إزالة التشكيل والتطويل
 * 2. توحيد الألف (أ إ آ ٱ -> ا)
 * 3. ة->ه، ى->ي، ؤ->و، ئ->ي
 * 4. إزالة علامات الترقيم والأقواس
 * 5. تحويل الأرقام الهندية إلى لاتينية وتوحيد حالة الأحرف الإنجليزية
 * 6. توحيد الفراغات
 * 7. إزالة "ال" التعريف من بداية كل كلمة
 */
export function normalize(text: string): string {
  if (!text) return '';

  const hindiDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  let out = text
    // 1. إزالة التشكيل والتطويل
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // 2. توحيد الألف
    .replace(/[أإآٱ]/g, 'ا')
    // 3. توحيد التاء المربوطة والألف المقصورة والهمزات على واو وياء
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // 5أ. تحويل الأرقام الهندية والفارسية
    .replace(/[٠-٩]/g, (d) => String(hindiDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    // 4. إزالة علامات الترقيم والأقواس
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    // 5ب. توحيد حالة الأحرف الإنجليزية
    .toLowerCase()
    // 6. توحيد الفراغات
    .replace(/\s+/g, ' ')
    .trim();

  if (!out) return '';

  // 7. إزالة "ال" التعريف من بداية كل كلمة
  out = out
    .split(' ')
    .map((word) => (word.length > 3 && word.startsWith('ال') ? word.slice(2) : word))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}

/**
 * توحيد المرادفات الشائعة بعد التطبيع (فاز=طور، ضاغط=زر ضغط=ضغاط، إلخ).
 */
// حدود الكلمة: \b في JavaScript لا تعمل مع الحروف العربية، لذلك نستخدم حدوداً مبنية على الحروف العربية/اللاتينية/الأرقام.
const WORD_START = '(?<![\\u0600-\\u06FFa-zA-Z0-9])';
const WORD_END = '(?![\\u0600-\\u06FFa-zA-Z0-9])';

function wordRule(words: string, replacement: string): [RegExp, string] {
  return [new RegExp(`${WORD_START}(?:${words})${WORD_END}`, 'g'), replacement];
}

const SYNONYM_RULES: ReadonlyArray<[RegExp, string]> = [
  wordRule('زر ضغط|ضغاط', 'ضاغط'),
  wordRule('طور|اطوار', 'فاز'),
  wordRule('ابريز|ماخذ|بريزه|بريز', 'ايريز'),
  wordRule('بريكر', 'قاطع'),
  wordRule('صهر|مصهر', 'فيوز'),
  wordRule('ثيمر|تيمر|موقت', 'تايمر'),
  wordRule('مخفت', 'ديمر'),
  wordRule('ثلاجه', 'براد'),
  wordRule('فلورسنت', 'نيون'),
  wordRule('نيوترال', 'نتر'),
];

/**
 * توحيد المرادفات الشائعة بعد التطبيع (فاز=طور، ضاغط=زر ضغط=ضغاط، إلخ).
 */
export function canonicalizeSynonyms(normalized: string): string {
  if (!normalized) return '';
  let out = normalized;
  for (const [pattern, replacement] of SYNONYM_RULES) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * حساب مسافة ليفنشتاين (Levenshtein Distance) بين سلسلتين.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

/**
 * حساب نسبة التشابه بين نصين (0 إلى 1).
 */
export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * إرجاع قائمة الأشكال المطبّعة المقبولة للرمز (الاسم + المرادفات).
 */
function getAcceptedVariants(symbol: ElectricalSymbol): string[] {
  const raw = [symbol.name, ...symbol.aliases];
  const variants = new Set<string>();
  for (const item of raw) {
    const n = normalize(item);
    if (n) {
      variants.add(n);
      variants.add(canonicalizeSynonyms(n));
    }
  }
  return Array.from(variants);
}

/**
 * حساب أعلى تشابه بين إجابة المستخدم وقائمة الصيغ المقبولة لرمز معين.
 */
function bestSimilarityForSymbol(userNorm: string, userCanon: string, symbol: ElectricalSymbol): number {
  let best = 0;
  for (const variant of getAcceptedVariants(symbol)) {
    const s1 = similarity(userNorm, variant);
    const s2 = similarity(userCanon, variant);
    const s = Math.max(s1, s2);
    if (s > best) best = s;
  }
  return best;
}

/**
 * تقييم إجابة المستخدم مع دعم التطابق التام، المرادفات، الأسماء المكررة، والتشابه الذكي.
 */
export function evaluateAnswer(
  userInput: string,
  target: ElectricalSymbol,
  allSymbols: readonly ElectricalSymbol[]
): EvaluationResult {
  const userNorm = normalize(userInput);
  if (!userNorm) {
    return {
      status: 'wrong',
      similarity: 0,
      message: `لم تُدخل إجابة. الإجابة الصحيحة: ${target.name}`,
    };
  }

  const userCanon = canonicalizeSynonyms(userNorm);
  const targetVariants = getAcceptedVariants(target);

  // 1. تطابق تام مع الاسم أو أحد المرادفات
  if (targetVariants.includes(userNorm) || targetVariants.includes(userCanon)) {
    return {
      status: 'correct',
      similarity: 1,
      message: `إجابة صحيحة! (${target.name})`,
    };
  }

  // 2. حساب نسبة التشابه للرمز المستهدف
  const targetSim = bestSimilarityForSymbol(userNorm, userCanon, target);

  if (targetSim >= 0.85) {
    // التحقق من عدم وجود رمز آخر باسم مختلف أقرب من الإجابة الحالية
    const targetNameNorm = normalize(target.name);
    let closerOtherFound = false;

    for (const other of allSymbols) {
      if (other.id === target.id) continue;
      // السماح إذا كان الرمزان يشتركان في نفس الاسم (مثل "ثلاثة أباريز" أو "خط أرضي")
      if (normalize(other.name) === targetNameNorm) continue;

      const otherSim = bestSimilarityForSymbol(userNorm, userCanon, other);
      if (otherSim > targetSim) {
        closerOtherFound = true;
        break;
      }
    }

    if (!closerOtherFound) {
      return {
        status: 'correct',
        similarity: targetSim,
        message: `إجابة صحيحة! (${target.name})`,
      };
    }
  }

  // 3. تشابه متوسط 70% - 85%: قريب من الصحيح بدون نقطة
  if (targetSim >= 0.70) {
    return {
      status: 'close',
      similarity: targetSim,
      message: `قريب من الصحيح! الاسم الدقيق: ${target.name}`,
    };
  }

  return {
    status: 'wrong',
    similarity: targetSim,
    message: `إجابة غير صحيحة. الإجابة الصحيحة: ${target.name}`,
  };
}

/**
 * استخراج تلميح من أول حرفين للرمز في وضع التدريب.
 */
export function getHint(name: string): string {
  const cleaned = name.trim();
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}...`;
}

/**
 * التقدير اللفظي للنتيجة النهائية.
 */
export function getVerbalGrade(percentage: number): string {
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'مقبول';
  return 'يحتاج إلى مراجعة';
}

/**
 * تنسيق المدة الزمنية بصيغة دقائق:ثوانٍ (00:00).
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
