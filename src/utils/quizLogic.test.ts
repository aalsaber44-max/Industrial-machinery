import test from 'node:test';
import assert from 'node:assert/strict';
import { SYMBOLS } from '../data/symbols';
import { SYMBOL_CATEGORIES } from '../data/categories';
import {
  ALL_QUESTION_TYPES,
  PRESET_CONFIGS,
  buildDeck,
  countAvailable,
  describeUserAnswer,
  evaluateQuestion,
  getEliminatedOptionIds,
  reshuffleOptions,
  revealedResult,
} from './questionEngine';
import type { Difficulty, Question, QuizConfig } from './questionTypes';
import { summarizeRecords } from './quizLogic';
import { convertValue, generateConversionQuestion, isAnswerCorrect, parseNumberInput } from './unitConversion';
import {
  canonicalizeSynonyms,
  evaluateAnswer,
  formatDuration,
  getHint,
  getVerbalGrade,
  normalize,
  shuffleArray,
} from './quizLogic';

test('SYMBOLS dataset contains 90 unique sequential items with valid SVGs', () => {
  assert.equal(SYMBOLS.length, 90);
  const ids = new Set(SYMBOLS.map((s) => s.id));
  assert.equal(ids.size, 90);
  for (const sym of SYMBOLS) {
    assert.ok(sym.name.trim().length > 0, `Symbol ${sym.id} has empty name`);
    assert.ok(sym.svg.includes('<g>') && sym.svg.includes('</g>'), `Symbol ${sym.id} has invalid SVG group`);
  }
});

test('normalize removes diacritics, unifies alef/ta-marbuta/digits, strips punctuation and leading ال', () => {
  assert.equal(normalize('التَّيَّارُ المُتَغَيِّر'), 'تيار متغير');
  assert.equal(normalize('الإيريز العاديّ (مأخذ)'), 'ايريز عادي ماخذ');
  assert.equal(normalize('محرك ٣ فاز'), 'محرك 3 فاز');
  assert.equal(normalize('خطّ الأرضيّ'), 'خط ارضي');
  assert.equal(normalize('  TV/Te  '), 'tv te');
});

test('shuffleArray returns a lossless permutation without mutating input', () => {
  const original = [1, 2, 3, 4, 5, 6, 7];
  const shuffled = shuffleArray(original, () => 0.42);
  assert.deepEqual(original, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), original);
});

test('evaluateAnswer accepts exact matches, aliases, and synonym replacements', () => {
  const lamp = SYMBOLS.find((s) => s.id === 5)!;
  assert.equal(evaluateAnswer('المصباح الكهربائي', lamp, SYMBOLS).status, 'correct');

  const motor3 = SYMBOLS.find((s) => s.id === 12)!;
  assert.equal(evaluateAnswer('محرك ثلاثه اطوار', motor3, SYMBOLS).status, 'correct');

  const fuse = SYMBOLS.find((s) => s.id === 43)!;
  assert.equal(evaluateAnswer('مصهر', fuse, SYMBOLS).status, 'correct');

  const socket = SYMBOLS.find((s) => s.id === 71)!;
  assert.equal(evaluateAnswer('ابريز عادي', socket, SYMBOLS).status, 'correct');
  assert.equal(evaluateAnswer('مأخذ عادي', socket, SYMBOLS).status, 'correct');
});

test('evaluateAnswer accepts duplicate symbol names without rejecting as another symbol', () => {
  const triple1 = SYMBOLS.find((s) => s.id === 73)!;
  const triple2 = SYMBOLS.find((s) => s.id === 76)!;
  assert.equal(evaluateAnswer('ثلاثة أباريز', triple1, SYMBOLS).status, 'correct');
  assert.equal(evaluateAnswer('ثلاثة أباريز', triple2, SYMBOLS).status, 'correct');

  const earth1 = SYMBOLS.find((s) => s.id === 7)!;
  const earth2 = SYMBOLS.find((s) => s.id === 60)!;
  assert.equal(evaluateAnswer('خط الأرضي', earth1, SYMBOLS).status, 'correct');
  assert.equal(evaluateAnswer('خط أرضي', earth1, SYMBOLS).status, 'correct');
  assert.equal(evaluateAnswer('خط الأرضي', earth2, SYMBOLS).status, 'correct');
});

test('evaluateAnswer handles Levenshtein >=85% typo tolerance, close 70-85% warning, and closer-other rejection', () => {
  const heater = SYMBOLS.find((s) => s.id === 83)!; // مسخن ماء (8 chars) -> مسخن مائ
  const resTypo = evaluateAnswer('مسخن مائ', heater, SYMBOLS);
  assert.equal(resTypo.status, 'correct');

  // If user enters exact name of another symbol ("مفتاح مزدوج") when asked for "مفتاح مفرد", it must be rejected
  const singleSwitch = SYMBOLS.find((s) => s.id === 62)!;
  const wrongSwitch = evaluateAnswer('مفتاح مزدوج', singleSwitch, SYMBOLS);
  assert.notEqual(wrongSwitch.status, 'correct');

  // 70-85% similarity triggers "close" warning
  const buzzer = SYMBOLS.find((s) => s.id === 4)!; // جرس كهربائي
  const closeRes = evaluateAnswer('جرس كهربا', buzzer, SYMBOLS);
  assert.equal(closeRes.status, 'close');
  assert.ok(closeRes.message.includes('قريب من الصحيح'));
});

test('helpers: getHint, getVerbalGrade, and formatDuration behave deterministically', () => {
  assert.equal(getHint('مصباح كهربائي'), 'مص...');
  assert.equal(getVerbalGrade(95), 'ممتاز');
  assert.equal(getVerbalGrade(82), 'جيد جداً');
  assert.equal(getVerbalGrade(72), 'جيد');
  assert.equal(getVerbalGrade(61), 'مقبول');
  assert.equal(getVerbalGrade(40), 'يحتاج إلى مراجعة');
  assert.equal(formatDuration(125), '02:05');
});

test('canonicalizeSynonyms works with Arabic words (whole-word matching, no \\b)', () => {
  assert.equal(canonicalizeSynonyms('زر ضغط'), 'ضاغط');
  assert.equal(canonicalizeSynonyms('ضغاط'), 'ضاغط');
  assert.equal(canonicalizeSynonyms('محرك ثلاثه اطوار'), 'محرك ثلاثه فاز');
  assert.equal(canonicalizeSynonyms('ابريز عادي'), 'ايريز عادي');
  assert.equal(canonicalizeSynonyms('ماخذ عادي'), 'ايريز عادي');
  assert.equal(canonicalizeSynonyms('مصهر'), 'فيوز');
  assert.equal(canonicalizeSynonyms('بريكر'), 'قاطع');
  assert.equal(canonicalizeSynonyms('موقت'), 'تايمر');
  // لا يستبدل جزءاً من كلمة أخرى
  assert.equal(canonicalizeSynonyms('طورين'), 'طورين');
});

test('every symbol name and alias is accepted for its own symbol', () => {
  for (const sym of SYMBOLS) {
    for (const answer of [sym.name, ...sym.aliases]) {
      assert.equal(
        evaluateAnswer(answer, sym, SYMBOLS).status,
        'correct',
        `Symbol ${sym.id}: "${answer}" should be accepted`
      );
    }
  }
});

test('exact name of a different symbol is never accepted (similar names guard)', () => {
  const clashes: string[] = [];
  for (const sym of SYMBOLS) {
    for (const other of SYMBOLS) {
      if (other.id === sym.id || normalize(other.name) === normalize(sym.name)) continue;
      const aliasSet = new Set([sym.name, ...sym.aliases].map((a) => normalize(a)));
      if (aliasSet.has(normalize(other.name))) continue; // اسم مشترك مقصود
      if (evaluateAnswer(other.name, sym, SYMBOLS).status === 'correct') {
        clashes.push(`${other.id} -> ${sym.id}`);
      }
    }
  }
  assert.deepEqual(clashes, []);
});

test('every symbol belongs to exactly one library category', () => {
  const all = SYMBOL_CATEGORIES.flatMap((c) => c.ids);
  assert.equal(all.length, SYMBOLS.length);
  assert.equal(new Set(all).size, SYMBOLS.length);
  for (const sym of SYMBOLS) assert.ok(all.includes(sym.id), `Symbol ${sym.id} has no category`);
});

test('unit conversion matches the examples in the curriculum', () => {
  assert.equal(convertValue(5, 'k', ''), 5000);
  assert.equal(convertValue(2, 'M', ''), 2000000);
  assert.equal(convertValue(500, 'm', ''), 0.5);
  assert.equal(convertValue(3, 'k', ''), 3000);
  assert.equal(convertValue(1, 'm', ''), 0.001);
  assert.equal(convertValue(100, 'μ', ''), 0.0001);
  assert.equal(convertValue(2500, 'm', ''), 2.5);
  assert.equal(convertValue(1, 'k', 'm'), 1000000);
});

test('number parsing accepts Arabic digits and decimal separators', () => {
  assert.equal(parseNumberInput('٢٫٥'), 2.5);
  assert.equal(parseNumberInput('2,5'), 2.5);
  assert.ok(Number.isNaN(parseNumberInput('abc')));
  assert.ok(isAnswerCorrect('0.5', 0.5));
  assert.ok(!isAnswerCorrect('5', 0.5));
});

test('generated conversion questions are always consistent', () => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 200; i++) {
    const q = generateConversionQuestion(rng);
    assert.notEqual(q.fromPrefix, q.toPrefix);
    assert.ok(q.base.allowedPrefixes.includes(q.fromPrefix));
    assert.ok(q.base.allowedPrefixes.includes(q.toPrefix));
    assert.equal(q.answer, convertValue(q.value, q.fromPrefix, q.toPrefix));
  }
});

/* ---------------- المرحلة الثانية: نظام الامتحانات ---------------- */

const LEVEL_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard', 'mixed'];

function correctInputFor(q: Question): string {
  if (q.kind === 'choice') return q.correctId;
  if (q.checker.mode === 'number') return String(q.checker.expected);
  return q.correctText;
}

function wrongInputFor(q: Question): string {
  if (q.kind === 'choice') return q.options.find((o) => o.id !== q.correctId)!.id;
  return q.checker.mode === 'number' ? '987654321' : 'كلمةغيرمنطقيةإطلاقا';
}

test('every question type x difficulty builds valid questions that score correctly', () => {
  for (const type of ALL_QUESTION_TYPES) {
    for (const difficulty of LEVEL_OPTIONS) {
      const config: QuizConfig = { types: [type], difficulty, count: 500, practice: false };
      const deck = buildDeck(config);
      assert.equal(deck.length, Math.min(500, countAvailable(config)), `${type}/${difficulty} deck size`);
      for (const q of deck) {
        const label = `${type}/${difficulty}/${q.id}`;
        assert.ok(q.prompt && q.correctText && q.explanation, `${label} has text`);
        if (q.kind === 'choice') {
          const ids = q.options.map((o) => o.id);
          assert.equal(new Set(ids).size, ids.length, `${label} option ids unique`);
          const texts = q.options.map((o) => o.text);
          assert.equal(new Set(texts).size, texts.length, `${label} option texts unique`);
          assert.equal(ids.filter((id) => id === q.correctId).length, 1, `${label} exactly one correct`);
          assert.ok(q.options.length >= 2, `${label} has options`);
        }
        assert.equal(evaluateQuestion(q, correctInputFor(q)).status, 'correct', `${label} correct input`);
        assert.notEqual(evaluateQuestion(q, wrongInputFor(q)).status, 'correct', `${label} wrong input`);
        assert.equal(evaluateQuestion(q, '').status, 'wrong', `${label} empty input`);
        if (difficulty !== 'mixed') {
          assert.equal(q.level, difficulty, `${label} level`);
        }
      }
    }
  }
});

test('buildDeck respects count, mixes selected types and has no duplicates', () => {
  const deck = buildDeck({ types: ['symbol-choice', 'units', 'devices', 'conversion'], difficulty: 'mixed', count: 20, practice: false });
  assert.equal(deck.length, 20);
  assert.equal(new Set(deck.map((q) => q.id + q.prompt)).size, 20);
  const types = new Set(deck.map((q) => q.type));
  assert.deepEqual([...types].sort(), ['conversion', 'devices', 'symbol-choice', 'units']);
  assert.equal(buildDeck({ ...PRESET_CONFIGS.full, types: [...PRESET_CONFIGS.full.types] }).length, SYMBOLS.length);
  assert.equal(buildDeck({ ...PRESET_CONFIGS.quick20, types: [...PRESET_CONFIGS.quick20.types] }).length, 20);
});

test('name-to-symbol distractors never share the correct symbol name', () => {
  const deck = buildDeck({ types: ['name-to-symbol', 'symbol-choice', 'symbol-function'], difficulty: 'hard', count: 200, practice: false });
  for (const q of deck) {
    if (q.kind !== 'choice') continue;
    const correct = q.options.find((o) => o.id === q.correctId)!;
    for (const o of q.options) {
      if (o.id !== q.correctId) assert.notEqual(normalize(o.text), normalize(correct.text), `${q.id}`);
    }
  }
});

test('fill-blank and word answers: exact, synonym and typo handling', () => {
  const deck = buildDeck({ types: ['fill-blank'], difficulty: 'mixed', count: 200, practice: false });
  const q = deck.find((x) => x.kind === 'text' && x.id.startsWith('fill-unit:الجهد'))!;
  assert.equal(evaluateQuestion(q, 'فولت').status, 'correct');
  assert.equal(evaluateQuestion(q, 'الفولت').status, 'correct');
  assert.notEqual(evaluateQuestion(q, 'أمبير').status, 'correct');
});

test('conversion answers accept Arabic digits and thousands separators', () => {
  const q = buildDeck({ types: ['conversion'], difficulty: 'easy', count: 1, practice: false })[0];
  if (q.kind !== 'text' || q.checker.mode !== 'number') throw new Error('expected numeric question');
  const e = q.checker.expected;
  assert.equal(evaluateQuestion(q, String(e)).status, 'correct');
  assert.equal(evaluateQuestion(q, String(e).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])).status, 'correct');
  assert.equal(parseNumberInput('2,500'), 2500);
  assert.equal(parseNumberInput('1,000,000'), 1000000);
});

test('revealed answers never score and are not counted as wrong', () => {
  const q = buildDeck({ types: ['symbol-choice'], difficulty: 'easy', count: 1, practice: true })[0];
  assert.equal(revealedResult(q).status, 'revealed');
  const records = [
    { status: 'correct' },
    { status: 'wrong' },
    { status: 'close' },
    { status: 'skipped' },
    { status: 'revealed' },
    { status: 'revealed' },
  ] as const;
  const sum = summarizeRecords(records);
  assert.equal(sum.total, 6);
  assert.equal(sum.correct, 1);
  assert.equal(sum.wrong, 1);
  assert.equal(sum.close, 1);
  assert.equal(sum.skipped, 1);
  assert.equal(sum.revealed, 2);
  assert.equal(sum.mistakes, 5);
  assert.equal(sum.percentage, 17);
  assert.equal(sum.correct + sum.wrong + sum.close + sum.skipped + sum.revealed, sum.total);
  assert.equal(summarizeRecords([]).percentage, 0);
});

test('score is correct for a mixed exam answered half right', () => {
  const deck = buildDeck({ types: ALL_QUESTION_TYPES, difficulty: 'mixed', count: 40, practice: false });
  const records = deck.map((q, i) => {
    const input = i % 2 === 0 ? correctInputFor(q) : wrongInputFor(q);
    return { status: evaluateQuestion(q, input).status };
  });
  const sum = summarizeRecords(records);
  assert.equal(sum.total, 40);
  assert.equal(sum.correct, 20);
  assert.equal(sum.percentage, 50);
});

test('hints and answer descriptions work for choice questions', () => {
  const q = buildDeck({ types: ['symbol-choice'], difficulty: 'easy', count: 1, practice: true })[0];
  if (q.kind !== 'choice') throw new Error('expected choice');
  const eliminated = getEliminatedOptionIds(q);
  assert.equal(eliminated.length, 2);
  assert.ok(!eliminated.includes(q.correctId));
  assert.equal(describeUserAnswer(q, q.correctId), q.correctText);
  const shuffled = reshuffleOptions(q) as typeof q;
  assert.deepEqual(shuffled.options.map((o) => o.id).sort(), q.options.map((o) => o.id).sort());
  assert.equal(shuffled.correctId, q.correctId);
});

test('retrying mistakes keeps only the unanswered-correctly questions intact', () => {
  const deck = buildDeck({ types: ['true-false', 'symbol-text'], difficulty: 'mixed', count: 10, practice: false });
  const mistakes = deck.slice(0, 4).map((q) => reshuffleOptions(q));
  assert.equal(mistakes.length, 4);
  for (const q of mistakes) {
    assert.equal(evaluateQuestion(q, correctInputFor(q)).status, 'correct');
  }
});
