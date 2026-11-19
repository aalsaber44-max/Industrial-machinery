import test from 'node:test';
import assert from 'node:assert/strict';
import { SYMBOLS } from '../data/symbols';
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
