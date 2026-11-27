/**
 * سجل المحاولات والإحصائيات — تخزين محلي (localStorage) يبقى بعد تحديث الصفحة.
 * لا يوجد في المشروع خادم أو تسجيل دخول، لذلك هذا هو مكان الحفظ المناسب.
 */

import type { AnswerRecord, ScoreSummary } from './quizLogic';
import { summarizeRecords } from './quizLogic';

const ATTEMPTS_KEY = 'industrial-machinery/attempts/v1';
const FLASHCARDS_KEY = 'industrial-machinery/flashcards/v1';
const MAX_ATTEMPTS = 60;

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
}

export interface WrongQuestionRef {
  id: string;
  prompt: string;
  topic: string;
}

export interface QuizAttempt {
  id: string;
  dateISO: string;
  modeLabel: string;
  total: number;
  correct: number;
  wrong: number;
  close: number;
  skipped: number;
  revealed: number;
  unanswered: number;
  percentage: number;
  durationSec: number;
  topics: TopicResult[];
  wrongQuestions: WrongQuestionRef[];
}

/* ------------------------------ أدوات التخزين ------------------------------ */

function storageAvailable(): boolean {
  try {
    const probe = '__im_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !storageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof window === 'undefined' || !storageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ سجل المحاولات ------------------------------ */

function isAttempt(value: unknown): value is QuizAttempt {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<QuizAttempt>;
  return typeof v.id === 'string' && typeof v.dateISO === 'string' && typeof v.total === 'number';
}

export function loadAttempts(): QuizAttempt[] {
  const raw = readJson<unknown>(ATTEMPTS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isAttempt).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

export function appendAttempt(attempt: QuizAttempt): QuizAttempt[] {
  const next = [attempt, ...loadAttempts()].slice(0, MAX_ATTEMPTS);
  writeJson(ATTEMPTS_KEY, next);
  return next;
}

export function clearAttempts(): void {
  writeJson(ATTEMPTS_KEY, []);
}

/** بناء محاولة من سجلات الجلسة (تُستدعى مرة واحدة عند إنهاء الاختبار). */
export function buildAttempt(
  records: readonly AnswerRecord[],
  totalTimeSec: number,
  modeLabel: string,
  summary: ScoreSummary = summarizeRecords(records)
): QuizAttempt {
  const topicMap = new Map<string, TopicResult>();
  for (const record of records) {
    const topic = record.question.topic || 'عام';
    const entry = topicMap.get(topic) ?? { topic, correct: 0, total: 0 };
    entry.total += 1;
    if (record.status === 'correct') entry.correct += 1;
    topicMap.set(topic, entry);
  }

  const wrongQuestions: WrongQuestionRef[] = records
    .filter((r) => r.status !== 'correct')
    .map((r) => ({
      id: r.question.id,
      prompt: r.question.stem ? `${r.question.prompt} ${r.question.stem}` : r.question.prompt,
      topic: r.question.topic,
    }));

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dateISO: new Date().toISOString(),
    modeLabel,
    total: summary.total,
    correct: summary.correct,
    wrong: summary.wrong,
    close: summary.close,
    skipped: summary.skipped,
    revealed: summary.revealed,
    unanswered: summary.unanswered,
    percentage: summary.percentage,
    durationSec: Math.max(0, Math.round(totalTimeSec)),
    topics: [...topicMap.values()].sort((a, b) => b.total - a.total),
    wrongQuestions,
  };
}

/* -------------------------------- الإحصائيات -------------------------------- */

export interface AggregateStats {
  completed: number;
  averagePercentage: number;
  bestPercentage: number;
  lastPercentage: number | null;
  totalCorrect: number;
  totalWrong: number;
  totalQuestions: number;
  totalTimeSec: number;
  strengths: TopicResult[];
  weaknesses: TopicResult[];
  frequentMistakes: { prompt: string; count: number; topic: string }[];
  history: QuizAttempt[];
}

export function aggregateAttempts(attempts: readonly QuizAttempt[]): AggregateStats {
  const completed = attempts.length;
  const sumPct = attempts.reduce((s, a) => s + a.percentage, 0);
  const totalCorrect = attempts.reduce((s, a) => s + a.correct, 0);
  const totalWrong = attempts.reduce(
    (s, a) => s + a.wrong + a.close + a.unanswered,
    0
  );
  const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
  const totalTimeSec = attempts.reduce((s, a) => s + a.durationSec, 0);

  const topicMap = new Map<string, TopicResult>();
  const mistakeMap = new Map<string, { prompt: string; count: number; topic: string }>();

  for (const attempt of attempts) {
    for (const t of attempt.topics) {
      const entry = topicMap.get(t.topic) ?? { topic: t.topic, correct: 0, total: 0 };
      entry.correct += t.correct;
      entry.total += t.total;
      topicMap.set(t.topic, entry);
    }
    for (const q of attempt.wrongQuestions) {
      const entry = mistakeMap.get(q.prompt) ?? { prompt: q.prompt, count: 0, topic: q.topic };
      entry.count += 1;
      mistakeMap.set(q.prompt, entry);
    }
  }

  const topicList = [...topicMap.values()].filter((t) => t.total > 0);
  const ratio = (t: TopicResult) => t.correct / t.total;
  const strengths = [...topicList].sort((a, b) => ratio(b) - ratio(a)).slice(0, 4);
  const weaknesses = [...topicList].sort((a, b) => ratio(a) - ratio(b)).slice(0, 4);

  return {
    completed,
    averagePercentage: completed > 0 ? Math.round(sumPct / completed) : 0,
    bestPercentage: completed > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0,
    lastPercentage: completed > 0 ? attempts[0].percentage : null,
    totalCorrect,
    totalWrong,
    totalQuestions,
    totalTimeSec,
    strengths,
    weaknesses,
    frequentMistakes: [...mistakeMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    history: [...attempts],
  };
}

/* ------------------------------- بطاقات الحفظ ------------------------------- */

export type FlashcardMark = 'known' | 'review';

export type FlashcardProgress = Record<string, FlashcardMark>;

export function loadFlashcardProgress(): FlashcardProgress {
  const raw = readJson<unknown>(FLASHCARDS_KEY, {});
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: FlashcardProgress = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === 'known' || value === 'review') out[key] = value;
  }
  return out;
}

export function saveFlashcardProgress(progress: FlashcardProgress): boolean {
  return writeJson(FLASHCARDS_KEY, progress);
}

export function clearFlashcardProgress(): void {
  writeJson(FLASHCARDS_KEY, {});
}
