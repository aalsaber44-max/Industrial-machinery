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
import type { ElectricalSymbol } from '../data/symbols';
import { formatDuration, getHint, type EvaluationResult, type QuizMode } from '../utils/quizLogic';

interface QuizScreenProps {
  mode: QuizMode;
  currentSymbol: ElectricalSymbol;
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
  mode,
  currentSymbol,
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
  const progressPct = totalQuestions > 0 ? Math.round(((currentIndex + (isChecked ? 1 : 0)) / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!isChecked) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isChecked]);

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
          key={currentSymbol.id}
          className="rounded-2xl border p-5 sm:p-7 shadow-sm fade-slide-enter"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
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

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="symbol-answer-input" className="block text-sm font-bold mb-2">
                ما اسم هذا الرمز الكهربائي؟
              </label>
              <input
                ref={inputRef}
                id="symbol-answer-input"
                type="text"
                dir="rtl"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={isChecked}
                value={answerText}
                onChange={(e) => onChangeAnswer(e.target.value)}
                placeholder="اكتب اسم الرمز هنا..."
                className="w-full min-h-[50px] rounded-xl border px-4 py-3 text-base outline-none transition-colors disabled:opacity-65"
                style={{
                  fontSize: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            {/* أزرار وضع التدريب */}
            {mode === 'practice' && !isChecked && (
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
                    يبدأ بـ: {getHint(currentSymbol.name)}
                  </span>
                )}
                {answerRevealed && (
                  <span className="text-sm font-bold" style={{ color: 'var(--warn-text)' }}>
                    الإجابة: {currentSymbol.name}
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
                    disabled={isChecked}
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
                <span>{checkedResult.message}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
