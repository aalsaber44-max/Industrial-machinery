import { SYMBOLS, type ElectricalSymbol } from '../data/symbols';
import { getCategoryOfSymbol } from '../data/categories';
import { FUNCTION_CONFLICTS, SYMBOL_FUNCTIONS } from '../data/functions';
import { BASE_UNITS, PREFIXES, QUANTITIES, type ElectricalQuantity } from '../data/units';
import { canonicalizeSynonyms, evaluateAnswer, getHint, normalize, shuffleArray, similarity } from './quizLogic';
import type { EvaluationResult } from './quizLogic';
import { convertValue, formatNumber, isAnswerCorrect } from './unitConversion';
import type {
  ChoiceOption,
  ChoiceQuestion,
  Difficulty,
  Level,
  Question,
  QuestionType,
  QuizConfig,
  TextQuestion,
} from './questionTypes';

type Rng = () => number;

/* ------------------------------------------------------------------ */
/* معلومات الأنواع والمستويات (للواجهة)                                  */
/* ------------------------------------------------------------------ */

export const QUESTION_TYPE_INFO: { id: QuestionType; title: string; description: string }[] = [
  { id: 'symbol-choice', title: 'اختر اسم الرمز', description: 'يظهر رمز وتختار اسمه من أربعة خيارات' },
  { id: 'name-to-symbol', title: 'اختر الرمز من اسمه', description: 'يظهر اسم وتختار الرمز الصحيح من أربعة رسوم' },
  { id: 'symbol-text', title: 'اكتب اسم الرمز', description: 'تكتب اسم الرمز بنفسك مع تصحيح ذكي' },
  { id: 'symbol-function', title: 'وظيفة الرمز', description: 'اختر الوظيفة الصحيحة للرمز' },
  { id: 'true-false', title: 'صح أو خطأ', description: 'عبارات عن الرموز والوحدات والأجهزة' },
  { id: 'fill-blank', title: 'أكمل الفراغ', description: 'أكمل الكلمة الناقصة في اسم الرمز أو الوحدة' },
  { id: 'units', title: 'الكميات والوحدات', description: 'الوحدات ورموز الكميات الكهربائية' },
  { id: 'conversion', title: 'تحويل الوحدات', description: 'التحويل بين المضاعفات (kΩ، mA، μF…)' },
  { id: 'devices', title: 'أجهزة القياس', description: 'ماذا يقيس كل جهاز وكيف يُوصَّل' },
];

export const ALL_QUESTION_TYPES: QuestionType[] = QUESTION_TYPE_INFO.map((t) => t.id);

export const DIFFICULTY_INFO: { id: Difficulty; title: string }[] = [
  { id: 'easy', title: 'سهل' },
  { id: 'medium', title: 'متوسط' },
  { id: 'hard', title: 'صعب' },
  { id: 'mixed', title: 'متنوع' },
];

export const LEVEL_LABEL: Record<Level, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

export const TYPE_LABEL: Record<QuestionType, string> = Object.fromEntries(
  QUESTION_TYPE_INFO.map((t) => [t.id, t.title])
) as Record<QuestionType, string>;

/** الإعدادات الجاهزة (تحافظ على الأوضاع الأصلية: كامل، سريع، تدريب). */
export const PRESET_CONFIGS = {
  full: { types: ['symbol-text'], difficulty: 'mixed', count: 90, practice: false },
  quick20: { types: ['symbol-text'], difficulty: 'mixed', count: 20, practice: false },
  practice: { types: ['symbol-text'], difficulty: 'mixed', count: 90, practice: true },
  custom: { types: ALL_QUESTION_TYPES, difficulty: 'mixed', count: 20, practice: false },
} satisfies Record<string, QuizConfig>;

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

const LEVELS: Level[] = ['easy', 'medium', 'hard'];

function randomLevel(rng: Rng): Level {
  return LEVELS[Math.floor(rng() * LEVELS.length)];
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

const symId = (id: number) => `s${id}`;

function stripParens(name: string): string {
  return name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

function isArabicWord(word: string): boolean {
  return /^[\u0600-\u06FF]+$/.test(word);
}

function arabicWordsOf(name: string): string[] {
  return stripParens(name).split(' ').filter((w) => w && isArabicWord(w));
}

function levelByWordCount(count: number): Level {
  if (count <= 2) return 'easy';
  if (count === 3) return 'medium';
  return 'hard';
}

function symbolLevel(sym: ElectricalSymbol): Level {
  return levelByWordCount(arabicWordsOf(sym.name).length);
}

function categoryTitle(sym: ElectricalSymbol): string {
  return getCategoryOfSymbol(sym.id)?.title ?? 'رموز كهربائية';
}

function symbolExplanation(sym: ElectricalSymbol): string {
  const cat = getCategoryOfSymbol(sym.id);
  const fn = SYMBOL_FUNCTIONS[sym.id];
  return `هذا الرمز هو «${sym.name}»${cat ? ` (فئة: ${cat.title})` : ''}.${fn ? ` وظيفته: ${fn.text}.` : ''}`;
}

function shortUnit(q: ElectricalQuantity): string {
  return q.unit.split(' (')[0];
}

/** الطاقة تُستثنى من أسئلة الوحدات العامة لأن لها وحدتين (J و Wh) وتُسأل بأسئلة خاصة. */
const UNIT_QUANTITIES = QUANTITIES.filter((q) => q.name !== 'الطاقة / الشغل');
/** كميات لها رمز واضح للمعادلات. */
const SYMBOL_QUANTITIES = QUANTITIES.filter((q) => ['V', 'I', 'R', 'P', 'f', 'C', 'L', 'Q'].includes(q.symbol));

function makeChoice(
  base: Omit<ChoiceQuestion, 'kind' | 'options' | 'correctId'>,
  options: ChoiceOption[],
  correctId: string,
  rng: Rng,
  keepOrder = false
): ChoiceQuestion {
  return { ...base, kind: 'choice', options: keepOrder ? options : shuffleArray(options, rng), correctId };
}

/** إعادة خلط خيارات سؤال اختيار (عند إعادة الأخطاء) دون تغيير محتواه. */
export function reshuffleOptions(q: Question, rng: Rng = Math.random): Question {
  if (q.kind !== 'choice') return q;
  const isTrueFalse = q.options.length === 2 && q.options.every((o) => o.id === 'true' || o.id === 'false');
  if (isTrueFalse) return q;
  return { ...q, options: shuffleArray(q.options, rng) };
}

/* ------------------------------------------------------------------ */
/* اختيار الخيارات المشتتة للرموز                                        */
/* ------------------------------------------------------------------ */

function pickDistractors(
  target: ElectricalSymbol,
  count: number,
  level: Level,
  rng: Rng,
  pool: readonly ElectricalSymbol[] = SYMBOLS,
  exclude: (s: ElectricalSymbol) => boolean = () => false
): ElectricalSymbol[] {
  const targetName = normalize(target.name);
  const targetAliases = new Set(target.aliases.map(normalize));
  const targetCat = getCategoryOfSymbol(target.id)?.id;

  const seen = new Set<string>([targetName]);
  const candidates: ElectricalSymbol[] = [];
  for (const s of shuffleArray(pool, rng)) {
    if (s.id === target.id || exclude(s)) continue;
    const n = normalize(s.name);
    if (seen.has(n) || targetAliases.has(n)) continue;
    seen.add(n);
    candidates.push(s);
  }

  const sameCat = (s: ElectricalSymbol) => getCategoryOfSymbol(s.id)?.id === targetCat;
  let ranked: ElectricalSymbol[];

  if (level === 'easy') {
    ranked = [...candidates.filter((s) => !sameCat(s)), ...candidates.filter(sameCat)];
  } else if (level === 'medium') {
    ranked = [...candidates.filter(sameCat), ...candidates.filter((s) => !sameCat(s))];
  } else {
    ranked = [...candidates]
      .map((s) => ({ s, score: similarity(targetName, normalize(s.name)) + (sameCat(s) ? 0.15 : 0) + rng() * 0.05 }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
  }
  return ranked.slice(0, count);
}

/* ------------------------------------------------------------------ */
/* بناء الأسئلة                                                         */
/* ------------------------------------------------------------------ */

function buildSymbolChoice(sym: ElectricalSymbol, level: Level, rng: Rng): Question | null {
  const ds = pickDistractors(sym, 3, level, rng);
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `symbol-choice:${sym.id}`,
      type: 'symbol-choice',
      level,
      prompt: 'ما اسم هذا الرمز الكهربائي؟',
      symbolId: sym.id,
      reviewSymbolId: sym.id,
      topic: categoryTitle(sym),
      correctText: sym.name,
      explanation: symbolExplanation(sym),
      hint: `الفئة: ${categoryTitle(sym)}`,
    },
    [sym, ...ds].map((s) => ({ id: symId(s.id), text: s.name })),
    symId(sym.id),
    rng
  );
}

function buildNameToSymbol(sym: ElectricalSymbol, level: Level, rng: Rng): Question | null {
  const ds = pickDistractors(sym, 3, level, rng);
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `name-to-symbol:${sym.id}`,
      type: 'name-to-symbol',
      level,
      prompt: `أي رمز يمثل «${sym.name}»؟`,
      reviewSymbolId: sym.id,
      topic: categoryTitle(sym),
      correctText: `الرمز الذي يمثل «${sym.name}»`,
      explanation: symbolExplanation(sym),
      hint: `الفئة: ${categoryTitle(sym)}`,
    },
    [sym, ...ds].map((s) => ({ id: symId(s.id), text: s.name, svg: s.svg })),
    symId(sym.id),
    rng
  );
}

function buildSymbolText(sym: ElectricalSymbol, level: Level): Question {
  return {
    kind: 'text',
    id: `symbol-text:${sym.id}`,
    type: 'symbol-text',
    level,
    prompt: 'ما اسم هذا الرمز الكهربائي؟',
    symbolId: sym.id,
    reviewSymbolId: sym.id,
    topic: categoryTitle(sym),
    correctText: sym.name,
    explanation: symbolExplanation(sym),
    hint: `يبدأ بـ: ${getHint(sym.name)}`,
    checker: { mode: 'symbol-name', symbolId: sym.id },
    placeholder: 'اكتب اسم الرمز هنا...',
    inputDir: 'rtl',
  };
}

function buildSymbolFunction(sym: ElectricalSymbol, level: Level, rng: Rng): Question | null {
  const fn = SYMBOL_FUNCTIONS[sym.id];
  if (!fn) return null;
  const conflicts = new Set(FUNCTION_CONFLICTS[sym.id] ?? []);
  const withFn = SYMBOLS.filter((s) => SYMBOL_FUNCTIONS[s.id]);
  const ds = pickDistractors(sym, 3, level, rng, withFn, (s) => {
    const other = SYMBOL_FUNCTIONS[s.id];
    return conflicts.has(s.id) || (FUNCTION_CONFLICTS[s.id] ?? []).includes(sym.id) || other.text === fn.text;
  });
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `symbol-function:${sym.id}`,
      type: 'symbol-function',
      level,
      prompt: 'ما وظيفة هذا الرمز؟',
      symbolId: sym.id,
      reviewSymbolId: sym.id,
      topic: categoryTitle(sym),
      correctText: fn.text,
      explanation: symbolExplanation(sym),
      hint: `الفئة: ${categoryTitle(sym)}`,
    },
    [sym, ...ds].map((s) => ({ id: symId(s.id), text: SYMBOL_FUNCTIONS[s.id].text })),
    symId(sym.id),
    rng
  );
}

const TF_OPTIONS: ChoiceOption[] = [
  { id: 'true', text: 'صح' },
  { id: 'false', text: 'خطأ' },
];

function trueFalse(
  base: Omit<ChoiceQuestion, 'kind' | 'options' | 'correctId' | 'correctText' | 'type'>,
  truth: boolean
): ChoiceQuestion {
  return {
    ...base,
    type: 'true-false',
    kind: 'choice',
    options: TF_OPTIONS,
    correctId: truth ? 'true' : 'false',
    correctText: truth ? 'صح' : 'خطأ',
  };
}

function buildTrueFalseSymbol(sym: ElectricalSymbol, level: Level, rng: Rng): Question | null {
  const truth = rng() < 0.5;
  let shownName = sym.name;
  let explanation = `${symbolExplanation(sym)}`;
  if (!truth) {
    const [d] = pickDistractors(sym, 1, level, rng);
    if (!d) return null;
    shownName = d.name;
    explanation = `هذا الرمز هو «${sym.name}» وليس «${d.name}». ${symbolExplanation(sym)}`;
  }
  return trueFalse(
    {
      id: `tf-symbol:${sym.id}`,
      level,
      prompt: `هل هذا الرمز يمثل «${shownName}»؟`,
      symbolId: sym.id,
      reviewSymbolId: sym.id,
      topic: categoryTitle(sym),
      explanation,
      hint: `الفئة: ${categoryTitle(sym)}`,
    },
    truth
  );
}

function buildTrueFalseUnit(q: ElectricalQuantity, level: Level, rng: Rng): Question | null {
  const truth = rng() < 0.5;
  let shown = shortUnit(q);
  if (!truth) {
    const others = UNIT_QUANTITIES.filter((o) => o.name !== q.name && shortUnit(o) !== shortUnit(q));
    shown = shortUnit(pick(others, rng));
  }
  return trueFalse(
    {
      id: `tf-unit:${q.name}`,
      level,
      prompt: `صح أم خطأ: وحدة قياس ${q.name} هي ${shown}.`,
      topic: 'الكميات والوحدات',
      explanation: `وحدة قياس ${q.name} هي ${shortUnit(q)} ورمزها ${q.unitSymbol}.`,
      hint: `رمز الكمية في المعادلات: ${q.symbol}`,
    },
    truth
  );
}

interface AuthoredTf {
  key: string;
  level: Level;
  prompt: string;
  truth: boolean;
  explanation: string;
}

const DEVICE_TF: AuthoredTf[] = [
  { key: 'volt-series', level: 'easy', prompt: 'الفولتميتر يُوصَّل على التوالي مع الحمل.', truth: false, explanation: 'الفولتميتر يُوصَّل على التوازي مع العنصر المراد قياس جهده، أما الأميتر فعلى التوالي.' },
  { key: 'amm-series', level: 'easy', prompt: 'الأميتر يُوصَّل على التوالي مع الحمل.', truth: true, explanation: 'يجب أن يمر تيار الحمل نفسه في الأميتر، لذلك يُوصَّل على التوالي.' },
  { key: 'ohm-off', level: 'medium', prompt: 'يُقاس المقاومة بالأوميتر والدائرة مفصولة عن التغذية.', truth: true, explanation: 'وجود جهد في الدائرة يعطي قراءة خاطئة وقد يتلف الجهاز.' },
  { key: 'energy-kwh', level: 'easy', prompt: 'عداد الطاقة يقيس الطاقة المستهلكة بوحدة kWh.', truth: true, explanation: 'kWh (كيلو واط ساعة) وحدة طاقة تُستخدم في فواتير الكهرباء.' },
  { key: 'clamp-cut', level: 'medium', prompt: 'ملقط التيار يحتاج إلى قطع الدائرة لقياس التيار.', truth: false, explanation: 'ملقط التيار يحيط بموصل واحد ويقيس التيار دون قطع الدائرة.' },
  { key: 'lcr', level: 'medium', prompt: 'مقياس LCR يقيس الحث والسعة والمقاومة.', truth: true, explanation: 'الحروف L و C و R ترمز إلى الحث والسعة والمقاومة.' },
  { key: 'kwh-power', level: 'hard', prompt: 'الكيلو واط ساعة (kWh) وحدة قدرة.', truth: false, explanation: 'kWh وحدة طاقة، أما الواط (W) والكيلو واط (kW) فهما وحدتا قدرة.' },
  { key: 'watt-power', level: 'easy', prompt: 'الواط (W) وحدة قدرة.', truth: true, explanation: 'القدرة P تُقاس بالواط، والطاقة تُقاس بالجول أو الواط ساعة.' },
  { key: 'clamp-both', level: 'hard', prompt: 'إحاطة الفاز والنتر معاً بملقط التيار تعطي قراءة تيار الحمل كاملاً.', truth: false, explanation: 'تياراهما متساويان متعاكسان فتتلاشى المجالات، فتكون القراءة قريبة من الصفر.' },
];

function buildAuthoredTf(item: AuthoredTf): Question {
  return trueFalse(
    {
      id: `tf-device:${item.key}`,
      level: item.level,
      prompt: `صح أم خطأ: ${item.prompt}`,
      topic: 'أجهزة القياس',
      explanation: item.explanation,
      hint: 'فكّر في طريقة التوصيل أو في الكمية التي يقيسها الجهاز.',
    },
    item.truth
  );
}

function buildFillBlankSymbol(sym: ElectricalSymbol, level: Level): Question | null {
  const stripped = stripParens(sym.name);
  const words = stripped.split(' ');
  const arabic = words.filter(isArabicWord);
  if (arabic.length < 2) return null;
  const target = [...arabic].reverse().find((w) => normalize(w).length >= 3);
  if (!target) return null;
  const idx = words.lastIndexOf(target);
  const stem = words.map((w, i) => (i === idx ? '____' : w)).join(' ');
  return {
    kind: 'text',
    id: `fill-symbol:${sym.id}`,
    type: 'fill-blank',
    level,
    prompt: 'أكمل الكلمة الناقصة في اسم هذا الرمز:',
    stem,
    symbolId: sym.id,
    reviewSymbolId: sym.id,
    topic: categoryTitle(sym),
    correctText: target,
    explanation: `الاسم الكامل: «${sym.name}». ${symbolExplanation(sym)}`,
    hint: `الكلمة تبدأ بـ: ${getHint(target)}`,
    checker: { mode: 'words', accepted: [target] },
    placeholder: 'اكتب الكلمة الناقصة...',
    inputDir: 'rtl',
  };
}

function buildFillBlankUnit(q: ElectricalQuantity, level: Level): Question {
  const unit = shortUnit(q);
  return {
    kind: 'text',
    id: `fill-unit:${q.name}`,
    type: 'fill-blank',
    level,
    prompt: 'أكمل الفراغ:',
    stem: `وحدة قياس ${q.name} هي ____ ورمزها (${q.unitSymbol})`,
    topic: 'الكميات والوحدات',
    correctText: unit,
    explanation: `وحدة قياس ${q.name} هي ${unit} ورمزها ${q.unitSymbol}.`,
    hint: `الكلمة تبدأ بـ: ${getHint(unit)}`,
    checker: { mode: 'words', accepted: [unit] },
    placeholder: 'اكتب اسم الوحدة...',
    inputDir: 'rtl',
  };
}

function distinctPick<T>(items: readonly T[], count: number, key: (t: T) => string, rng: Rng, avoid: Set<string>): T[] {
  const out: T[] = [];
  const used = new Set(avoid);
  for (const it of shuffleArray(items, rng)) {
    const k = key(it);
    if (used.has(k)) continue;
    used.add(k);
    out.push(it);
    if (out.length === count) break;
  }
  return out;
}

function buildUnitsA(q: ElectricalQuantity, rng: Rng): Question | null {
  const label = (x: ElectricalQuantity) => `${shortUnit(x)} (${x.unitSymbol})`;
  const ds = distinctPick(UNIT_QUANTITIES.filter((o) => o.name !== q.name), 3, label, rng, new Set([label(q)]));
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `units-a:${q.name}`,
      type: 'units',
      level: 'easy',
      prompt: `ما وحدة قياس ${q.name}؟`,
      topic: 'الكميات والوحدات',
      correctText: label(q),
      explanation: `${q.name} (${q.symbol}) تُقاس بوحدة ${shortUnit(q)} ورمزها ${q.unitSymbol}. ${q.definition}`,
      hint: `رمز الكمية في المعادلات: ${q.symbol}`,
    },
    [q, ...ds].map((x) => ({ id: x.name, text: label(x) })),
    q.name,
    rng
  );
}

function buildUnitsB(q: ElectricalQuantity, rng: Rng): Question | null {
  const ds = distinctPick(UNIT_QUANTITIES.filter((o) => o.name !== q.name && o.unitSymbol !== q.unitSymbol), 3, (x) => x.name, rng, new Set([q.name]));
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `units-b:${q.name}`,
      type: 'units',
      level: 'medium',
      prompt: `الوحدة ${q.unitSymbol} (${shortUnit(q)}) تُستخدم لقياس أي كمية؟`,
      topic: 'الكميات والوحدات',
      correctText: q.name,
      explanation: `${shortUnit(q)} (${q.unitSymbol}) وحدة قياس ${q.name}. ${q.definition}`,
      hint: `رمز الكمية في المعادلات: ${q.symbol}`,
    },
    [q, ...ds].map((x) => ({ id: x.name, text: x.name })),
    q.name,
    rng
  );
}

function buildUnitsC(q: ElectricalQuantity, rng: Rng): Question | null {
  const ds = distinctPick(SYMBOL_QUANTITIES.filter((o) => o.name !== q.name), 3, (x) => x.symbol, rng, new Set([q.symbol]));
  if (ds.length < 3) return null;
  return makeChoice(
    {
      id: `units-c:${q.name}`,
      type: 'units',
      level: 'hard',
      prompt: `ما الرمز المستخدم للدلالة على ${q.name} في المعادلات؟`,
      topic: 'الكميات والوحدات',
      correctText: q.symbol,
      explanation: `يُرمز إلى ${q.name} بالحرف ${q.symbol}، ووحدتها ${shortUnit(q)} (${q.unitSymbol}). فرّق بين رمز الكمية ورمز الوحدة.`,
      hint: `وحدتها: ${shortUnit(q)}`,
    },
    [q, ...ds].map((x) => ({ id: x.name, text: x.symbol })),
    q.name,
    rng
  );
}

interface AuthoredChoice {
  key: string;
  type: QuestionType;
  level: Level;
  topic: string;
  prompt: string;
  /** الخيار الأول هو الصحيح دائماً، ويُخلط عند العرض */
  options: [string, string, string, string];
  explanation: string;
}

const AUTHORED_UNITS: AuthoredChoice[] = [
  {
    key: 'household-energy',
    type: 'units',
    level: 'medium',
    topic: 'الكميات والوحدات',
    prompt: 'ما الوحدة المستخدمة في فاتورة الكهرباء المنزلية لقياس الطاقة المستهلكة؟',
    options: ['kWh (كيلو واط ساعة)', 'kW (كيلو واط)', 'A (أمبير)', 'Hz (هيرتز)'],
    explanation: 'الطاقة المستهلكة تُقاس بالكيلو واط ساعة kWh، وهي وحدة طاقة وليست قدرة.',
  },
  {
    key: 'energy-not-power',
    type: 'units',
    level: 'hard',
    topic: 'الكميات والوحدات',
    prompt: 'أي مما يلي وحدة طاقة وليست وحدة قدرة؟',
    options: ['Wh (واط ساعة)', 'W (واط)', 'kW (كيلو واط)', 'hp (حصان)'],
    explanation: 'W و kW و hp وحدات قدرة، أما Wh و kWh و J فوحدات طاقة.',
  },
  {
    key: 'power-formula',
    type: 'units',
    level: 'hard',
    topic: 'الكميات والوحدات',
    prompt: 'وفق العلاقة P = V × I، ما وحدة القدرة P عندما يكون V بالفولت و I بالأمبير؟',
    options: ['واط (W)', 'أوم (Ω)', 'جول (J)', 'هيرتز (Hz)'],
    explanation: 'ناتج ضرب الفولت في الأمبير هو الواط، وهو وحدة قياس القدرة.',
  },
  {
    key: 'period-frequency',
    type: 'units',
    level: 'hard',
    topic: 'الكميات والوحدات',
    prompt: 'ما العلاقة بين الزمن الدوري T والتردد f؟',
    options: ['T = 1 ÷ f', 'T = f × 2', 'T = f²', 'T = f + 1'],
    explanation: 'الزمن الدوري هو مقلوب التردد، فتردد 50 Hz يعني زمناً دورياً 0.02 s.',
  },
];

const AUTHORED_DEVICES: AuthoredChoice[] = [
  { key: 'measures-voltmeter', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس الفولتميتر؟', options: ['الجهد الكهربائي', 'شدة التيار', 'المقاومة', 'التردد'], explanation: 'الفولتميتر يقيس فرق الجهد بوحدة الفولت (V).' },
  { key: 'measures-ammeter', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس الأميتر؟', options: ['شدة التيار', 'الجهد الكهربائي', 'القدرة', 'التردد'], explanation: 'الأميتر يقيس شدة التيار بوحدة الأمبير (A).' },
  { key: 'measures-ohmmeter', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس الأوميتر؟', options: ['المقاومة الكهربائية', 'الجهد الكهربائي', 'شدة التيار', 'الطاقة المستهلكة'], explanation: 'الأوميتر يقيس المقاومة بوحدة الأوم (Ω).' },
  { key: 'measures-energy', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس عداد الطاقة؟', options: ['الطاقة المستهلكة (kWh)', 'الجهد الكهربائي', 'التردد', 'المقاومة'], explanation: 'عداد الطاقة يسجّل الاستهلاك التراكمي بالكيلو واط ساعة.' },
  { key: 'measures-frequency', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس مقياس التردد؟', options: ['عدد الدورات في الثانية (Hz)', 'شدة التيار', 'الجهد', 'الحث'], explanation: 'مقياس التردد يعرض عدد الدورات في الثانية بوحدة الهيرتز.' },
  { key: 'measures-multimeter', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس الجهاز المتعدد (Multimeter)؟', options: ['الجهد والتيار والمقاومة', 'التردد فقط', 'الطاقة المستهلكة فقط', 'السعة والحث فقط'], explanation: 'الجهاز المتعدد يجمع قياس الجهد والتيار والمقاومة، وغالباً الاستمرارية والدايود.' },
  { key: 'measures-lcr', type: 'devices', level: 'easy', topic: 'أجهزة القياس', prompt: 'ماذا يقيس مقياس LCR؟', options: ['الحث والسعة والمقاومة', 'الجهد والتردد فقط', 'الطاقة المستهلكة', 'التيار المستمر فقط'], explanation: 'L للحث و C للسعة و R للمقاومة.' },
  { key: 'connect-voltmeter', type: 'devices', level: 'medium', topic: 'أجهزة القياس', prompt: 'كيف يُوصَّل الفولتميتر في الدائرة؟', options: ['على التوازي مع العنصر', 'على التوالي مع الحمل', 'حول موصل واحد بفكّه', 'بعد فصل العنصر عن الدائرة'], explanation: 'الفولتميتر يقيس فرق الجهد بين نقطتين، لذلك يُوصَّل على التوازي.' },
  { key: 'connect-ammeter', type: 'devices', level: 'medium', topic: 'أجهزة القياس', prompt: 'كيف يُوصَّل الأميتر في الدائرة؟', options: ['على التوالي مع الحمل', 'على التوازي مع المصدر', 'حول موصل واحد بفكّه', 'بعد فصل المصدر عن الدائرة'], explanation: 'يجب أن يمر تيار الحمل في الأميتر، لذلك يُوصَّل على التوالي.' },
  { key: 'connect-ohmmeter', type: 'devices', level: 'medium', topic: 'أجهزة القياس', prompt: 'متى يُستخدم الأوميتر لقياس مقاومة؟', options: ['والدائرة مفصولة عن التغذية', 'والدائرة تحت الجهد', 'على التوالي مع المصدر', 'بعد تشغيل الحمل'], explanation: 'يوفّر الأوميتر تياره الخاص، ووجود جهد خارجي يعطي قراءة خاطئة وقد يتلفه.' },
  { key: 'connect-clamp', type: 'devices', level: 'medium', topic: 'أجهزة القياس', prompt: 'كيف يقيس ملقط التيار التيار؟', options: ['بإحاطة موصل واحد بفكّه', 'بقطع الدائرة وتوصيله على التوالي', 'بتوصيله على التوازي مع المصدر', 'بإحاطة الفاز والنتر معاً'], explanation: 'يقيس ملقط التيار المجال المغناطيسي حول موصل واحد دون قطع الدائرة.' },
  { key: 'jordan-frequency', type: 'devices', level: 'medium', topic: 'أجهزة القياس', prompt: 'ما تردد الشبكة الكهربائية المنزلية في الأردن؟', options: ['50 Hz', '60 Hz', '100 Hz', '25 Hz'], explanation: 'تردد الشبكة 50 هيرتز، ويُقاس بمقياس التردد.' },
  { key: 'best-clamp', type: 'devices', level: 'hard', topic: 'أجهزة القياس', prompt: 'أي جهاز هو الأنسب لقياس التيار دون قطع الدائرة؟', options: ['ملقط التيار', 'الفولتميتر', 'الأوميتر', 'عداد الطاقة'], explanation: 'ملقط التيار يحيط بالموصل ولا يحتاج إلى فتح الدائرة.' },
  { key: 'best-lcr', type: 'devices', level: 'hard', topic: 'أجهزة القياس', prompt: 'أي جهاز مخصص لقياس السعة والحث؟', options: ['مقياس LCR', 'الفولتميتر', 'الأميتر', 'عداد الطاقة'], explanation: 'مقياس LCR مصمم لقياس L وC وR.' },
  { key: 'voltmeter-resistance', type: 'devices', level: 'hard', topic: 'أجهزة القياس', prompt: 'لماذا تكون المقاومة الداخلية للفولتميتر عالية جداً؟', options: ['حتى لا يسحب تياراً يؤثر في الدائرة المقاسة', 'ليقيس التيارات الكبيرة', 'ليُوصَّل على التوالي', 'ليقيس المقاومة'], explanation: 'المقاومة العالية تجعل تيار الفولتميتر ضئيلاً فلا يغيّر قيمة الجهد المقاس.' },
  { key: 'ammeter-parallel', type: 'devices', level: 'hard', topic: 'أجهزة القياس', prompt: 'لماذا لا يُوصَّل الأميتر على التوازي مع المصدر؟', options: ['لأن مقاومته صغيرة جداً فيمر فيه تيار كبير قد يتلفه', 'لأن مقاومته عالية جداً', 'لأنه يقيس الجهد', 'لأنه يحتاج بطارية'], explanation: 'الأميتر مقاومته صغيرة جداً، فتوصيله على التوازي يشبه قصر الدائرة.' },
];

function buildAuthoredChoice(item: AuthoredChoice, rng: Rng): Question {
  const options = item.options.map((text, i) => ({ id: `o${i}`, text }));
  return makeChoice(
    {
      id: `${item.type}:${item.key}`,
      type: item.type,
      level: item.level,
      prompt: item.prompt,
      topic: item.topic,
      correctText: item.options[0],
      explanation: item.explanation,
      hint: `الموضوع: ${item.topic}`,
    },
    options,
    'o0',
    rng
  );
}

/* ----------------------------- التحويلات ----------------------------- */

const CONV_VALUES = [1, 2, 2.5, 3, 4.7, 5, 10, 25, 50, 100, 250, 500, 1500, 2500];

function buildConversion(level: Level, rng: Rng): Question {
  const base = pick(BASE_UNITS, rng);
  const nonBase = base.allowedPrefixes.filter((p) => p !== '');
  let from: string;
  let to: string;

  if (level === 'hard' && nonBase.length >= 2) {
    from = pick(nonBase, rng);
    to = pick(nonBase.filter((p) => p !== from), rng);
  } else {
    const pool = level === 'easy' ? nonBase.filter((p) => p === 'k' || p === 'm') : nonBase;
    const prefix = pick(pool.length ? pool : nonBase, rng);
    if (rng() < 0.5) {
      from = prefix;
      to = '';
    } else {
      from = '';
      to = prefix;
    }
  }

  const value = pick(CONV_VALUES, rng);
  const answer = convertValue(value, from, to);
  const fromLabel = `${from}${base.symbol}`;
  const toLabel = `${to}${base.symbol}`;
  const factor = convertValue(1, from, to);
  const prefixOf = (p: string) => PREFIXES.find((x) => x.symbol === p);
  const hintParts = [from, to].filter(Boolean).map((p) => `${p} = ${prefixOf(p)?.value}`);

  return {
    kind: 'text',
    id: `conversion:${level}:${base.symbol}:${from}:${to}:${value}`,
    type: 'conversion',
    level,
    prompt: `حوّل ${formatNumber(value)} ${fromLabel} إلى ${toLabel}`,
    topic: 'تحويل الوحدات',
    correctText: `${formatNumber(answer)} ${toLabel}`,
    explanation: `1 ${fromLabel} = ${formatNumber(factor)} ${toLabel}، إذن ${formatNumber(value)} ${fromLabel} = ${formatNumber(answer)} ${toLabel}.`,
    hint: hintParts.length ? `تذكّر: ${hintParts.join('، ')}` : undefined,
    checker: { mode: 'number', expected: answer },
    placeholder: 'اكتب الناتج كرقم',
    inputDir: 'ltr',
  };
}

/* ------------------------------------------------------------------ */
/* مجموعات الأسئلة وبناء الامتحان                                        */
/* ------------------------------------------------------------------ */

interface Subject {
  key: string;
  /** المستوى الذاتي للموضوع (إن وُجد يُستخدم لفلترة المستوى المطلوب) */
  level?: Level;
  build: (level: Level, rng: Rng) => Question | null;
}

const CONVERSION_SLOTS_PER_LEVEL = 15;

function subjectsFor(type: QuestionType): Subject[] {
  switch (type) {
    case 'symbol-choice':
      return SYMBOLS.map((s) => ({ key: `sc${s.id}`, build: (l, r) => buildSymbolChoice(s, l, r) }));
    case 'name-to-symbol': {
      // رمزان بالاسم نفسه (مثل ثلاثة أباريز) يعطيان السؤال نفسه، فنكتفي بأحدهما
      const seenNames = new Set<string>();
      return SYMBOLS.filter((s) => {
        const n = normalize(s.name);
        if (seenNames.has(n)) return false;
        seenNames.add(n);
        return true;
      }).map((s) => ({ key: `ns${s.id}`, build: (l, r) => buildNameToSymbol(s, l, r) }));
    }
    case 'symbol-text':
      return SYMBOLS.map((s) => ({ key: `st${s.id}`, level: symbolLevel(s), build: (l) => buildSymbolText(s, l) }));
    case 'symbol-function':
      return SYMBOLS.filter((s) => SYMBOL_FUNCTIONS[s.id]).map((s) => ({
        key: `sf${s.id}`,
        level: SYMBOL_FUNCTIONS[s.id].level,
        build: (l, r) => buildSymbolFunction(s, l, r),
      }));
    case 'true-false':
      return [
        ...SYMBOLS.map((s) => ({ key: `tfs${s.id}`, build: (l: Level, r: Rng) => buildTrueFalseSymbol(s, l, r) })),
        ...UNIT_QUANTITIES.map((q) => ({ key: `tfu${q.name}`, build: (l: Level, r: Rng) => buildTrueFalseUnit(q, l, r) })),
        ...DEVICE_TF.map((t) => ({ key: `tfd${t.key}`, level: t.level, build: () => buildAuthoredTf(t) })),
      ];
    case 'fill-blank': {
      const symbolSubjects = SYMBOLS.filter((s) => buildFillBlankSymbol(s, 'easy')).map((s) => ({
        key: `fs${s.id}`,
        level: symbolLevel(s),
        build: (l: Level) => buildFillBlankSymbol(s, l),
      }));
      const unitSubjects = UNIT_QUANTITIES.map((q) => ({
        key: `fu${q.name}`,
        level: 'easy' as Level,
        build: (l: Level) => buildFillBlankUnit(q, l),
      }));
      return [...symbolSubjects, ...unitSubjects];
    }
    case 'units':
      return [
        ...UNIT_QUANTITIES.map((q) => ({ key: `ua${q.name}`, level: 'easy' as Level, build: (_l: Level, r: Rng) => buildUnitsA(q, r) })),
        ...UNIT_QUANTITIES.map((q) => ({ key: `ub${q.name}`, level: 'medium' as Level, build: (_l: Level, r: Rng) => buildUnitsB(q, r) })),
        ...SYMBOL_QUANTITIES.map((q) => ({ key: `uc${q.name}`, level: 'hard' as Level, build: (_l: Level, r: Rng) => buildUnitsC(q, r) })),
        ...AUTHORED_UNITS.map((a) => ({ key: `ux${a.key}`, level: a.level, build: (_l: Level, r: Rng) => buildAuthoredChoice(a, r) })),
      ];
    case 'conversion':
      return LEVELS.flatMap((lv) =>
        Array.from({ length: CONVERSION_SLOTS_PER_LEVEL }, (_, i) => ({
          key: `cv${lv}${i}`,
          level: lv,
          build: (l: Level, r: Rng) => buildConversion(l, r),
        }))
      );
    case 'devices':
      return AUTHORED_DEVICES.map((a) => ({ key: `dv${a.key}`, level: a.level, build: (_l: Level, r: Rng) => buildAuthoredChoice(a, r) }));
  }
}

function eligibleSubjects(type: QuestionType, difficulty: Difficulty): Subject[] {
  const all = subjectsFor(type);
  if (difficulty === 'mixed') return all;
  return all.filter((s) => !s.level || s.level === difficulty);
}

/** عدد الأسئلة المتاحة فعلياً لإعداد معين (لتنبيه المستخدم في الواجهة). */
export function countAvailable(config: Pick<QuizConfig, 'types' | 'difficulty'>): number {
  return config.types.reduce((sum, t) => sum + eligibleSubjects(t, config.difficulty).length, 0);
}

function dedupeKey(q: Question): string {
  return `${q.type}|${q.prompt}|${q.stem ?? ''}|${q.symbolId ?? ''}`;
}

/**
 * بناء مجموعة أسئلة الامتحان: توزيع متساوٍ على الأنواع المختارة دون تكرار،
 * ثم خلط الأسئلة. قد يقل العدد عن المطلوب إذا لم يتوفر ما يكفي.
 */
export function buildDeck(config: QuizConfig, rng: Rng = Math.random): Question[] {
  const types = config.types.length ? config.types : ALL_QUESTION_TYPES;
  const pools = types.map((t) => shuffleArray(eligibleSubjects(t, config.difficulty), rng));
  const result: Question[] = [];
  const seen = new Set<string>();
  const cursors = pools.map(() => 0);
  const target = Math.max(1, Math.floor(config.count));

  let progressed = true;
  while (result.length < target && progressed) {
    progressed = false;
    for (let i = 0; i < pools.length && result.length < target; i++) {
      while (cursors[i] < pools[i].length) {
        const subject = pools[i][cursors[i]++];
        const level = subject.level ?? (config.difficulty === 'mixed' ? randomLevel(rng) : config.difficulty);
        let accepted: Question | null = null;
        // بعض الأسئلة عشوائية (التحويلات)، فنعيد المحاولة إن تكرر السؤال
        for (let attempt = 0; attempt < 8 && !accepted; attempt++) {
          const q = subject.build(level, rng);
          if (!q) break;
          const key = dedupeKey(q);
          if (seen.has(key)) continue;
          seen.add(key);
          accepted = q;
        }
        if (!accepted) continue;
        result.push(accepted);
        progressed = true;
        break;
      }
    }
  }
  return shuffleArray(result, rng);
}

/* ------------------------------------------------------------------ */
/* التصحيح والتلميحات                                                   */
/* ------------------------------------------------------------------ */

export function evaluateQuestion(q: Question, input: string): EvaluationResult {
  const wrong = (message: string): EvaluationResult => ({ status: 'wrong', similarity: 0, message });

  if (q.kind === 'choice') {
    if (!input) return wrong(`لم تختر إجابة. الإجابة الصحيحة: ${q.correctText}`);
    if (input === q.correctId) return { status: 'correct', similarity: 1, message: 'إجابة صحيحة!' };
    return wrong(`إجابة غير صحيحة. الإجابة الصحيحة: ${q.correctText}`);
  }

  const { checker } = q;
  if (checker.mode === 'symbol-name') {
    const sym = SYMBOLS.find((s) => s.id === checker.symbolId);
    if (!sym) return wrong('تعذر تحميل الرمز.');
    return evaluateAnswer(input, sym, SYMBOLS);
  }

  if (checker.mode === 'number') {
    if (!input.trim()) return wrong(`لم تُدخل إجابة. الإجابة الصحيحة: ${q.correctText}`);
    if (isAnswerCorrect(input, checker.expected)) {
      return { status: 'correct', similarity: 1, message: 'إجابة صحيحة!' };
    }
    return wrong(`إجابة غير صحيحة. الإجابة الصحيحة: ${q.correctText}`);
  }

  // words
  const userNorm = normalize(input);
  if (!userNorm) return wrong(`لم تُدخل إجابة. الإجابة الصحيحة: ${q.correctText}`);
  const userCanon = canonicalizeSynonyms(userNorm);
  const variants = new Set<string>();
  for (const a of checker.accepted) {
    const n = normalize(a);
    variants.add(n);
    variants.add(canonicalizeSynonyms(n));
  }
  if (variants.has(userNorm) || variants.has(userCanon)) {
    return { status: 'correct', similarity: 1, message: 'إجابة صحيحة!' };
  }
  let best = 0;
  for (const v of variants) best = Math.max(best, similarity(userNorm, v), similarity(userCanon, v));
  if (best >= 0.85 && userNorm.length >= 5) {
    return { status: 'correct', similarity: best, message: 'إجابة صحيحة!' };
  }
  if (best >= 0.7) {
    return { status: 'close', similarity: best, message: `قريب من الصحيح! الكلمة الدقيقة: ${q.correctText}` };
  }
  return wrong(`إجابة غير صحيحة. الإجابة الصحيحة: ${q.correctText}`);
}

/** نتيجة سؤال كُشفت إجابته في وضع التدريب: لا تُحتسب نقطة. */
export function revealedResult(q: Question): EvaluationResult {
  return {
    status: 'revealed',
    similarity: 0,
    message: `تم كشف الإجابة لهذا السؤال، لذلك لا تُحتسب له نقطة. الإجابة: ${q.correctText}`,
  };
}

/** نص إجابة الطالب كما يظهر في المراجعة والتقارير. */
export function describeUserAnswer(q: Question, input: string): string {
  if (q.kind === 'choice') {
    return q.options.find((o) => o.id === input)?.text ?? '';
  }
  return input;
}

/** الخيارات التي تُستبعد عند طلب التلميح في أسئلة الاختيار (خياران خاطئان). */
export function getEliminatedOptionIds(q: Question): string[] {
  if (q.kind !== 'choice' || q.options.length <= 2) return [];
  return q.options.filter((o) => o.id !== q.correctId).slice(0, 2).map((o) => o.id);
}
