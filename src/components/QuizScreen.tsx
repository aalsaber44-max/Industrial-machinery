import React, { useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { SYMBOLS } from '../data/symbols';
import type { Question } from '../utils/questionTypes';
import { LEVEL_LABEL, TYPE_LABEL, getEliminatedOptionIds } from '../utils/questionEngine';
import { formatDuration, type EvaluationResult } from '../utils/quizLogic';

interface QuizScreenProps {
  practice: boolean;
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  questionElapsedSec: number;
  totalElapsedSec: number;
  answerText: string;
  onChangeAnswer: (val: string) => void;
  checkedResult: EvaluationResult | null;
  hintShown: boolean;
  answerRevealed: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  onHint: () => void;
  onRevealAnswer: () => void;
  onRequestReset: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  practice,
  question,
  currentIndex,
  totalQuestions,
  score,
  streak,
  questionElapsedSec,
  totalElapsedSec,
  answerText,
  onChangeAnswer,
  checkedResult,
  hintShown,
  answerRevealed,
  muted,
  onToggleMute,
  onCheck,
  onNext,
  onSkip,
  onHint,
  onRevealAnswer,
  onRequestReset,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isChecked = checkedResult !== null;
  const currentSymbol = question.symbolId ? SYMBOLS.find((x) => x.id === question.symbolId) : undefined;
  const eliminated = hintShown ? getEliminatedOptionIds(question) : [];
  const progressPct = totalQuestions > 0 ? Math.round(((currentIndex + (isChecked ? 1 : 0)) / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!isChecked) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isChecked, question.id]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isChecked) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isChecked, onNext]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) {
      onCheck();
    } else {
      onNext();
    }
  };

  return (
    <main className="min-h-screen py-5 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
        {/* الشريط العلوي وإحصائيات التقدم */}
        <header
          className="rounded-2xl border p-4 sm:p-5 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold tabular-nums">
              <span>
                السؤال {currentIndex + 1} من {totalQuestions}
              </span>
              <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--primary)' }}>
                النقاط: {score} من {totalQuestions}
              </span>
              <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
              <span>سلسلة الصح: {streak}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
                className="min-h-[48px] min-w-[48px] px-3 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={onRequestReset}
                className="min-h-[48px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الاختبار</span>
              </button>
            </div>
          </div>

          {/* شريط التقدم والوقت */}
          <div className="space-y-2">
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="تقدم الاختبار"
            >
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${progressPct}%`, backgroundColor: 'var(--primary)' }}
              />
            </div>
            <div
              className="flex items-center justify-between text-xs sm:text-sm tabular-nums"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>
                التقدم: <span dir="ltr">{progressPct}%</span>
              </span>
              <span>
                زمن السؤال: <span dir="ltr">{formatDuration(questionElapsedSec)}</span> · الزمن الكلي:{' '}
                <span dir="ltr">{formatDuration(totalElapsedSec)}</span>
              </span>
            </div>
          </div>
        </header>

        {/* بطاقة عرض الرمز وحقل الإجابة */}
        <section
          key={question.id}
          className="rounded-2xl border p-5 sm:p-7 shadow-sm fade-slide-enter"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {TYPE_LABEL[question.type]}
            </span>
            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              المستوى: {LEVEL_LABEL[question.level]}
            </span>
          </div>

          {currentSymbol && (
            <div className="mb-5">
              <div
                className="engineering-grid rounded-xl border overflow-hidden flex items-center justify-center p-4 sm:p-6"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <svg
                  viewBox="0 0 200 120"
                  className="symbol-svg max-w-[300px]"
                  role="img"
                  aria-label={`رمز كهربائي رقم ${currentIndex + 1}`}
                  dangerouslySetInnerHTML={{ __html: currentSymbol.svg }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <p id="question-prompt" dir="auto" className="block text-base sm:text-lg font-bold mb-2">
                {question.prompt}
              </p>
              {question.stem && (
                <p dir="auto" className="text-xl sm:text-2xl font-bold mb-3 text-center rounded-xl border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                  {question.stem}
                </p>
              )}

              {question.kind === 'text' ? (
                <input
                  ref={inputRef}
                  id="symbol-answer-input"
                  aria-labelledby="question-prompt"
                  type="text"
                  dir={question.inputDir}
                  inputMode={question.checker.mode === 'number' ? 'decimal' : undefined}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={isChecked}
                  value={answerText}
                  onChange={(e) => onChangeAnswer(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full min-h-[50px] rounded-xl border px-4 py-3 text-base outline-none transition-colors disabled:opacity-65"
                  style={{
                    fontSize: '16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                  }}
                />
              ) : (
                <div
                  role="radiogroup"
                  aria-labelledby="question-prompt"
                  className={
                    question.options.some((o) => o.svg)
                      ? 'grid grid-cols-2 gap-3'
                      : question.options.length === 2
                        ? 'grid grid-cols-2 gap-3'
                        : 'grid grid-cols-1 gap-2.5'
                  }
                >
                  {question.options.map((opt, i) => {
                    const selected = answerText === opt.id;
                    const isCorrectOpt = opt.id === question.correctId;
                    const isEliminated = eliminated.includes(opt.id);
                    let borderColor = selected ? 'var(--primary)' : 'var(--border-color)';
                    let bg = selected ? 'var(--primary-soft)' : 'var(--bg-subtle)';
                    let color = 'var(--text-main)';
                    if (isChecked && isCorrectOpt) {
                      borderColor = 'var(--ok-border)';
                      bg = 'var(--ok-bg)';
                      color = 'var(--ok-text)';
                    } else if (isChecked && selected) {
                      borderColor = 'var(--err-border)';
                      bg = 'var(--err-bg)';
                      color = 'var(--err-text)';
                    }
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={opt.svg ? `الخيار ${i + 1}` : undefined}
                        disabled={isChecked || isEliminated}
                        onClick={() => onChangeAnswer(opt.id)}
                        className="min-h-[52px] rounded-xl border p-3 text-right font-semibold text-base transition-colors cursor-pointer disabled:cursor-default"
                        style={{
                          borderColor,
                          backgroundColor: bg,
                          color,
                          opacity: isEliminated ? 0.35 : 1,
                          textDecoration: isEliminated ? 'line-through' : undefined,
                        }}
                      >
                        {opt.svg ? (
                          <div className="engineering-grid rounded-lg flex items-center justify-center p-1.5">
                            <svg viewBox="0 0 200 120" className="symbol-svg w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: opt.svg }} />
                          </div>
                        ) : (
                          <span dir="auto">{opt.text}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* أزرار وضع التدريب */}
            {practice && !isChecked && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onHint}
                  className="min-h-[48px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>تلميح</span>
                </button>
                <button
                  type="button"
                  onClick={onRevealAnswer}
                  className="min-h-[48px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>أظهر الإجابة</span>
                </button>
                {hintShown && (
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    {question.hint ?? `الموضوع: ${question.topic}`}{eliminated.length > 0 && ' · تم استبعاد خيارين خاطئين'}
                  </span>
                )}
                {answerRevealed && (
                  <span className="text-sm font-bold" style={{ color: 'var(--warn-text)' }}>
                    الإجابة: {question.correctText}
                  </span>
                )}
              </div>
            )}

            {/* أزرار التحقق والتخطي والانتقال */}
            <div className="flex flex-wrap items-center gap-3">
              {!isChecked ? (
                <>
                  <button
                    type="submit"
                    disabled={isChecked || (question.kind === 'choice' && !answerText)}
                    className="flex-1 min-w-[140px] min-h-[48px] px-5 rounded-xl font-bold text-base text-white transition-colors cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    تحقق
                  </button>
                  <button
                    type="button"
                    onClick={onSkip}
                    className="min-h-[48px] px-5 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>تخطّي السؤال</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  className="w-full min-h-[50px] px-5 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <span>{currentIndex + 1 === totalQuestions ? 'عرض التقرير النهائي' : 'السؤال التالي'}</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {/* رسالة النتيجة الحية */}
          <div aria-live="polite" className="mt-4 min-h-[24px]">
            {checkedResult && (
              <div
                className="rounded-xl border p-4 flex items-start gap-3 text-sm sm:text-base font-semibold"
                style={{
                  backgroundColor:
                    checkedResult.status === 'correct'
                      ? 'var(--ok-bg)'
                      : checkedResult.status === 'close' || checkedResult.status === 'revealed'
                        ? 'var(--warn-bg)'
                        : 'var(--err-bg)',
                  borderColor:
                    checkedResult.status === 'correct'
                      ? 'var(--ok-border)'
                      : checkedResult.status === 'close' || checkedResult.status === 'revealed'
                        ? 'var(--warn-border)'
                        : 'var(--err-border)',
                  color:
                    checkedResult.status === 'correct'
                      ? 'var(--ok-text)'
                      : checkedResult.status === 'close' || checkedResult.status === 'revealed'
                        ? 'var(--warn-text)'
                        : 'var(--err-text)',
                }}
              >
                {checkedResult.status === 'correct' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                {(checkedResult.status === 'close' || checkedResult.status === 'revealed') && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                {checkedResult.status === 'wrong' && <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="space-y-1.5">
                  <p dir="auto">{checkedResult.message}</p>
                  <p dir="auto" className="text-sm font-medium opacity-90">
                    <strong>الشرح: </strong>
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
