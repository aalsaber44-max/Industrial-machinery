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
  ChevronRight,
  ChevronLeft,
  Flag,
  LayoutGrid,
  LogOut,
} from 'lucide-react';
import { SYMBOLS } from '../data/symbols';
import type { Question } from '../utils/questionTypes';
import { LEVEL_LABEL, TYPE_LABEL, getEliminatedOptionIds } from '../utils/questionEngine';
import { formatDuration, isQuestionResolved, type EvaluationResult, type QuestionState } from '../utils/quizLogic';

interface QuizScreenProps {
  practice: boolean;
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  /** حالة كل سؤال في المجموعة (لشريط التنقل والتقدم) */
  states: readonly QuestionState[];
  /** حالة السؤال الحالي */
  state: QuestionState;
  score: number;
  streak: number;
  totalElapsedSec: number;
  muted: boolean;
  onToggleMute: () => void;
  onChangeAnswer: (value: string) => void;
  onCheck: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onHint: () => void;
  onRevealAnswer: () => void;
  onGoToQuestion: (index: number) => void;
  onRequestReset: () => void;
  onRequestFinish: () => void;
  /** الخروج من الاختبار والعودة للرئيسية دون إكمال الأسئلة */
  onRequestExit: () => void;
}

function statusColor(result: QuestionState['result']): string {
  switch (result) {
    case 'correct':
      return 'var(--ok-border)';
    case 'wrong':
      return 'var(--err-border)';
    case 'close':
    case 'revealed':
      return 'var(--warn-border)';
    case 'skipped':
      return 'var(--text-muted)';
    default:
      return 'var(--border-color)';
  }
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  practice,
  question,
  currentIndex,
  totalQuestions,
  states,
  state,
  score,
  streak,
  totalElapsedSec,
  muted,
  onToggleMute,
  onChangeAnswer,
  onCheck,
  onNext,
  onPrev,
  onSkip,
  onHint,
  onRevealAnswer,
  onGoToQuestion,
  onRequestReset,
  onRequestFinish,
  onRequestExit,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isChecked = state.result !== null;
  const currentSymbol = question.symbolId ? SYMBOLS.find((x) => x.id === question.symbolId) : undefined;
  const eliminated = state.hintShown ? getEliminatedOptionIds(question) : [];

  const resolvedCount = states.filter(isQuestionResolved).length;
  const correctCount = states.filter((s) => s.result === 'correct').length;
  const wrongCount = states.filter((s) => s.result !== null && s.result !== 'correct').length;
  const progressPct = totalQuestions > 0 ? Math.round((resolvedCount / totalQuestions) * 100) : 0;
  const isLast = currentIndex + 1 >= totalQuestions;

  useEffect(() => {
    if (!isChecked && question.kind === 'text') {
      inputRef.current?.focus();
    }
  }, [currentIndex, isChecked, question.id, question.kind]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'TEXTAREA') return;
      if (isChecked) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isChecked, onNext]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) onCheck();
  };

  return (
    <main className="min-h-screen py-5 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-4">
        {/* الشريط العلوي: التقدم والإحصاءات */}
        <header
          className="rounded-2xl border p-4 sm:p-5 shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
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
              <span style={{ color: 'var(--ok-text)' }}>صحيح: {correctCount}</span>
              <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--err-text)' }}>غير صحيح: {wrongCount}</span>
              {streak > 0 && (
                <>
                  <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span>سلسلة الصح: {streak}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onRequestExit}
                className="min-h-[44px] px-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
                className="min-h-[44px] min-w-[44px] px-3 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
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
                className="min-h-[44px] px-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة</span>
              </button>
              <button
                type="button"
                onClick={onRequestFinish}
                className="min-h-[44px] px-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--primary-soft)',
                  color: 'var(--primary)',
                }}
              >
                <Flag className="w-4 h-4" />
                <span>إنهاء الاختبار</span>
              </button>
            </div>
          </div>

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
              className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm tabular-nums"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>
                المنجز: <span dir="ltr">{resolvedCount}</span> من{' '}
                <span dir="ltr">{totalQuestions}</span> (<span dir="ltr">{progressPct}%</span>)
              </span>
              <span>
                زمن السؤال: <span dir="ltr">{formatDuration(state.timeSpentSec)}</span> · الزمن الكلي:{' '}
                <span dir="ltr">{formatDuration(totalElapsedSec)}</span>
              </span>
            </div>
          </div>

          {/* شريط التنقل بين الأسئلة */}
          <details className="mt-3" open={totalQuestions <= 20}>
            <summary className="text-xs font-bold cursor-pointer flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <LayoutGrid className="w-3.5 h-3.5" />
              خريطة الأسئلة ({resolvedCount} منجزة، {totalQuestions - resolvedCount} غير منجزة)
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              {states.map((s, i) => {
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onGoToQuestion(i)}
                    aria-label={`الانتقال إلى السؤال ${i + 1}${s.result ? ` — ${s.result}` : ' — لم يُجب'}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className="w-9 h-9 rounded-lg border text-xs font-bold tabular-nums cursor-pointer flex items-center justify-center"
                    style={{
                      borderColor: isCurrent ? 'var(--primary)' : statusColor(s.result),
                      backgroundColor: isCurrent
                        ? 'var(--primary)'
                        : s.result === 'correct'
                          ? 'var(--ok-bg)'
                          : s.result === 'wrong'
                            ? 'var(--err-bg)'
                            : s.result
                              ? 'var(--warn-bg)'
                              : 'var(--bg-subtle)',
                      color: isCurrent ? '#ffffff' : 'var(--text-main)',
                      borderWidth: isCurrent ? 2 : 1,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border inline-block" style={{ backgroundColor: 'var(--ok-bg)', borderColor: 'var(--ok-border)' }} />
                صحيح
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border inline-block" style={{ backgroundColor: 'var(--err-bg)', borderColor: 'var(--err-border)' }} />
                خاطئ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border inline-block" style={{ backgroundColor: 'var(--warn-bg)', borderColor: 'var(--warn-border)' }} />
                قريب / مكشوف / متخطى
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border inline-block" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }} />
                لم يُجب
              </span>
            </div>
          </details>
        </header>

        {/* بطاقة السؤال */}
        <section
          key={question.id}
          className="rounded-2xl border p-5 sm:p-7 shadow-sm fade-slide-enter"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>
              {TYPE_LABEL[question.type]}
            </span>
            <span className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              المستوى: {LEVEL_LABEL[question.level]}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isChecked ? 'var(--ok-bg)' : 'var(--warn-bg)',
                color: isChecked ? 'var(--ok-text)' : 'var(--warn-text)',
              }}
            >
              {isChecked ? 'تم التحقق من الإجابة' : 'لم يُتحقق بعد'}
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
                  aria-label="الرمز الكهربائي في السؤال"
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
                <p
                  dir="auto"
                  className="text-lg sm:text-xl font-bold mb-3 text-center rounded-xl border p-3"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
                >
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
                  value={state.answer}
                  onChange={(e) => onChangeAnswer(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full min-h-[50px] rounded-xl border px-4 py-3 outline-none transition-colors"
                  style={{
                    fontSize: '16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: isChecked ? 'var(--ok-border)' : 'var(--border-color)',
                    color: 'var(--text-main)',
                  }}
                />
              ) : (
                <div
                  role="radiogroup"
                  aria-labelledby="question-prompt"
                  className={
                    question.options.some((o) => o.svg) || question.options.length === 2
                      ? 'grid grid-cols-2 gap-3'
                      : 'grid grid-cols-1 gap-2.5'
                  }
                >
                  {question.options.map((opt, i) => {
                    const selected = state.answer === opt.id;
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
                        disabled={isEliminated}
                        onClick={() => onChangeAnswer(opt.id)}
                        className="min-h-[52px] rounded-xl border p-3 text-right font-semibold text-sm sm:text-base transition-colors cursor-pointer"
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
                            <svg
                              viewBox="0 0 200 120"
                              className="symbol-svg w-full"
                              aria-hidden="true"
                              dangerouslySetInnerHTML={{ __html: opt.svg }}
                            />
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

            {/* أدوات وضع التدريب */}
            {practice && !isChecked && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onHint}
                  disabled={state.hintShown}
                  className="min-h-[44px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                  disabled={state.answerRevealed}
                  className="min-h-[44px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>أظهر الإجابة</span>
                </button>
                {state.hintShown && (
                  <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    {question.hint ?? `الموضوع: ${question.topic}`}
                    {eliminated.length > 0 && ' · تم استبعاد خيارين خاطئين'}
                  </span>
                )}
                {state.answerRevealed && (
                  <span className="text-sm font-bold" style={{ color: 'var(--warn-text)' }}>
                    الإجابة: {question.correctText}
                  </span>
                )}
              </div>
            )}

            {/* أزرار التحقق والتخطي */}
            {!isChecked ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={question.kind === 'choice' && !state.answer}
                  className="flex-1 min-w-[140px] min-h-[50px] px-5 rounded-xl font-bold text-base text-white transition-colors cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  تحقق
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-[50px] px-5 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                  }}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>تخطّي السؤال</span>
                </button>
              </div>
            ) : (
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                يمكنك تعديل الإجابة ثم التحقق مرة أخرى؛ تُحسب النتيجة من الحالة النهائية لكل سؤال ولا تتكرر النقاط.
              </p>
            )}

            {/* التنقل بين الأسئلة */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="min-h-[48px] px-4 rounded-xl border font-semibold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              <button
                type="button"
                onClick={onNext}
                className="min-h-[48px] px-5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <span>{isLast ? 'إنهاء ومراجعة النتيجة' : 'السؤال التالي'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* نتيجة التحقق */}
          <div aria-live="polite" className="mt-4 min-h-[24px]">
            {isChecked && (
              <div
                className="rounded-xl border p-4 flex items-start gap-3 text-sm sm:text-base font-semibold"
                style={{
                  backgroundColor:
                    state.result === 'correct'
                      ? 'var(--ok-bg)'
                      : state.result === 'close' || state.result === 'revealed'
                        ? 'var(--warn-bg)'
                        : state.result === 'skipped'
                          ? 'var(--bg-subtle)'
                          : 'var(--err-bg)',
                  borderColor:
                    state.result === 'correct'
                      ? 'var(--ok-border)'
                      : state.result === 'close' || state.result === 'revealed'
                        ? 'var(--warn-border)'
                        : state.result === 'skipped'
                          ? 'var(--border-color)'
                          : 'var(--err-border)',
                  color:
                    state.result === 'correct'
                      ? 'var(--ok-text)'
                      : state.result === 'close' || state.result === 'revealed'
                        ? 'var(--warn-text)'
                        : state.result === 'skipped'
                          ? 'var(--text-muted)'
                          : 'var(--err-text)',
                }}
              >
                {state.result === 'correct' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                {(state.result === 'close' || state.result === 'revealed' || state.result === 'skipped') && (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                {state.result === 'wrong' && <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="space-y-1.5">
                  <p dir="auto">
                    {state.result === 'correct'
                      ? 'إجابة صحيحة!'
                      : state.result === 'close'
                        ? `قريب من الصحيح. الإجابة الصحيحة: ${question.correctText}`
                        : state.result === 'revealed'
                          ? 'تم كشف الإجابة لهذا السؤال، لذلك لا تُحتسب له نقطة.'
                          : state.result === 'skipped'
                            ? 'تم تخطّي هذا السؤال، ويمكنك الرجوع إليه لاحقاً من خريطة الأسئلة.'
                            : `إجابة غير صحيحة. الإجابة الصحيحة: ${question.correctText}`}
                  </p>
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
