import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PRESET_CONFIGS,
  buildDeck,
  describeUserAnswer,
  evaluateQuestion,
  reshuffleOptions,
  revealedResult,
} from './utils/questionEngine';
import type { Question, QuizConfig } from './utils/questionTypes';
import {
  countCorrectStates,
  createQuestionState,
  shuffleArray,
  summarizeStates,
  type AnswerRecord,
  type AnswerStatus,
  type QuestionState,
  type QuizMode,
} from './utils/quizLogic';
import { SYMBOLS } from './data/symbols';
import { playFeedbackSound } from './utils/audio';
import { appendAttempt, buildAttempt } from './utils/history';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReportScreen } from './components/ReportScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { LibraryScreen } from './components/LibraryScreen';
import { UnitsScreen } from './components/UnitsScreen';
import { DevicesScreen } from './components/DevicesScreen';
import { FlashcardsScreen } from './components/FlashcardsScreen';
import { StudyScreen } from './components/StudyScreen';
import { StatsScreen } from './components/StatsScreen';

type AppScreen =
  | 'start'
  | 'quiz'
  | 'report'
  | 'library'
  | 'units'
  | 'devices'
  | 'flashcards'
  | 'study'
  | 'stats';

const MODE_LABELS: Record<QuizMode, string> = {
  full: 'اختبار كامل',
  quick20: 'اختبار سريع (20)',
  practice: 'وضع التدريب',
  custom: 'امتحان مخصص',
};

function shouldAutostart(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autostart') === '1';
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(() => (shouldAutostart() ? 'quiz' : 'start'));
  const [preset, setPreset] = useState<QuizMode>('full');
  const [config, setConfig] = useState<QuizConfig>(() => ({ ...PRESET_CONFIGS.full, types: [...PRESET_CONFIGS.full.types] }));
  const [muted, setMuted] = useState<boolean>(false);

  const [deck, setDeck] = useState<Question[]>(() => buildDeck(PRESET_CONFIGS.full));
  const [states, setStates] = useState<QuestionState[]>(() => deck.map(() => createQuestionState()));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalElapsedSec, setTotalElapsedSec] = useState<number>(0);
  const [sessionLabel, setSessionLabel] = useState<string>(MODE_LABELS.full);

  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState<boolean>(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState<boolean>(false);

  /** يمنع تسجيل المحاولة أكثر من مرة لنفس الجلسة. */
  const attemptSavedRef = useRef(false);

  /* ----------------------------- المؤقتات ----------------------------- */

  useEffect(() => {
    if (screen !== 'quiz') return;
    const timer = window.setInterval(() => {
      setTotalElapsedSec((prev) => prev + 1);
      setStates((prev) => {
        const current = prev[currentIndex];
        // لا يُحتسب وقت إضافي لسؤال تم التحقق منه
        if (!current || current.result !== null) return prev;
        const next = [...prev];
        next[currentIndex] = { ...current, timeSpentSec: current.timeSpentSec + 1 };
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, currentIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [screen]);

  /* ----------------------------- حالة الجلسة ----------------------------- */

  const currentQuestion: Question | undefined = deck[currentIndex];
  const currentState: QuestionState = states[currentIndex] ?? createQuestionState();
  const score = useMemo(() => countCorrectStates(states), [states]);
  const streak = useMemo(() => {
    let count = 0;
    for (let i = currentIndex; i >= 0; i--) {
      if (states[i]?.result === 'correct') count++;
      else break;
    }
    return count;
  }, [states, currentIndex]);

  /** سجلات الجلسة مشتقة من حالات الأسئلة — لا تُضاف إلا مرة واحدة لكل سؤال. */
  const records = useMemo<AnswerRecord[]>(
    () =>
      deck.map((question, index) => {
        const state = states[index] ?? createQuestionState();
        const status: AnswerStatus = state.result ?? 'unanswered';
        return {
          question,
          userAnswer: state.result ? describeUserAnswer(question, state.answer) : '',
          status,
          timeSpentSec: state.timeSpentSec,
        };
      }),
    [deck, states]
  );

  const summary = useMemo(() => summarizeStates(states), [states]);

  const patchState = useCallback((index: number, patch: Partial<QuestionState>) => {
    setStates((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const next = [...prev];
      next[index] = { ...current, ...patch };
      return next;
    });
  }, []);

  const startSession = useCallback(
    (customDeck?: Question[], label?: string) => {
      const newDeck = customDeck ? shuffleArray(customDeck.map((q) => reshuffleOptions(q))) : buildDeck(config);
      if (newDeck.length === 0) return;
      attemptSavedRef.current = false;
      setDeck(newDeck);
      setStates(newDeck.map(() => createQuestionState()));
      setCurrentIndex(0);
      setTotalElapsedSec(0);
      setSessionLabel(label ?? MODE_LABELS[preset] ?? 'اختبار');
      setConfirmResetOpen(false);
      setConfirmFinishOpen(false);
      setConfirmExitOpen(false);
      setScreen('quiz');
    },
    [config, preset]
  );

  /* ----------------------------- أحداث الاختبار ----------------------------- */

  const goToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= deck.length) return;
      setCurrentIndex(index);
    },
    [deck.length]
  );

  const handleCheck = useCallback(() => {
    if (!currentQuestion || currentState.result) return;

    const result = currentState.answerRevealed
      ? revealedResult(currentQuestion)
      : evaluateQuestion(currentQuestion, currentState.answer);

    patchState(currentIndex, { result: result.status });

    if (result.status === 'correct') playFeedbackSound('correct', muted);
    else if (result.status === 'close' || result.status === 'revealed') playFeedbackSound('close', muted);
    else playFeedbackSound('wrong', muted);
  }, [currentIndex, currentQuestion, currentState.answer, currentState.answerRevealed, currentState.result, muted, patchState]);

  const handleChangeAnswer = useCallback(
    (value: string) => {
      // تعديل الإجابة يلغي التحقق السابق، والنتيجة تُحسب من الحالة النهائية فقط
      patchState(currentIndex, { answer: value, result: null });
    },
    [currentIndex, patchState]
  );

  const handleSkip = useCallback(() => {
    if (!currentQuestion || currentState.result) return;
    patchState(currentIndex, { result: 'skipped' });
    playFeedbackSound('wrong', muted);
    if (currentIndex + 1 < deck.length) setCurrentIndex((prev) => prev + 1);
    else setConfirmFinishOpen(true);
  }, [currentIndex, currentQuestion, currentState.result, deck.length, muted, patchState]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    setConfirmFinishOpen(true);
  }, [currentIndex, deck.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const finishSession = useCallback(() => {
    if (!attemptSavedRef.current) {
      attemptSavedRef.current = true;
      appendAttempt(buildAttempt(records, totalElapsedSec, sessionLabel, summary));
    }
    playFeedbackSound('finish', muted);
    setConfirmFinishOpen(false);
    setScreen('report');
  }, [muted, records, sessionLabel, summary, totalElapsedSec]);

  const handleRetryMistakes = useCallback(() => {
    const mistakes = records.filter((record) => record.status !== 'correct').map((record) => record.question);
    if (mistakes.length > 0) startSession(mistakes, 'إعادة الأخطاء');
  }, [records, startSession]);

  const handleSelectPreset = (next: QuizMode) => {
    const base = PRESET_CONFIGS[next];
    setPreset(next);
    setConfig({ ...base, types: [...base.types] });
  };

  const handleChangeConfig = (next: QuizConfig) => {
    setConfig(next);
    const base = PRESET_CONFIGS[preset];
    const sameAsPreset =
      next.practice === base.practice &&
      next.difficulty === base.difficulty &&
      next.count === base.count &&
      next.types.length === base.types.length &&
      next.types.every((t) => (base.types as readonly string[]).includes(t));
    if (!sameAsPreset) setPreset('custom');
  };

  const goHome = useCallback(() => setScreen('start'), []);

  const unansweredCount = summary.unanswered;

  return (
    <>
      {screen === 'start' && (
        <StartScreen
          totalSymbols={SYMBOLS.length}
          preset={preset}
          onSelectPreset={handleSelectPreset}
          config={config}
          onChangeConfig={handleChangeConfig}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onStart={() => startSession()}
          onOpenLibrary={() => setScreen('library')}
          onOpenUnits={() => setScreen('units')}
          onOpenDevices={() => setScreen('devices')}
          onOpenFlashcards={() => setScreen('flashcards')}
          onOpenStudy={() => setScreen('study')}
          onOpenStats={() => setScreen('stats')}
        />
      )}

      {screen === 'library' && <LibraryScreen onBack={goHome} onNavigate={setScreen} />}
      {screen === 'units' && <UnitsScreen onBack={goHome} onNavigate={setScreen} />}
      {screen === 'devices' && <DevicesScreen onBack={goHome} onNavigate={setScreen} />}
      {screen === 'flashcards' && <FlashcardsScreen onBack={goHome} onNavigate={setScreen} />}
      {screen === 'study' && <StudyScreen onBack={goHome} onNavigate={setScreen} />}
      {screen === 'stats' && <StatsScreen onBack={goHome} onNavigate={setScreen} />}

      {screen === 'quiz' &&
        (currentQuestion ? (
          <QuizScreen
            practice={config.practice}
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={deck.length}
            states={states}
            state={currentState}
            score={score}
            streak={streak}
            totalElapsedSec={totalElapsedSec}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onChangeAnswer={handleChangeAnswer}
            onCheck={handleCheck}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            onHint={() => patchState(currentIndex, { hintShown: true })}
            onRevealAnswer={() => patchState(currentIndex, { answerRevealed: true })}
            onGoToQuestion={goToQuestion}
            onRequestReset={() => setConfirmResetOpen(true)}
            onRequestFinish={() => setConfirmFinishOpen(true)}
            onRequestExit={() => setConfirmExitOpen(true)}
          />
        ) : (
          <main className="min-h-screen flex items-center justify-center p-6">
            <div
              className="max-w-md w-full rounded-2xl border p-6 text-center space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <p className="font-bold">لا توجد أسئلة في هذه المجموعة</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                عُد إلى الصفحة الرئيسية واختر نوع أسئلة أو مستوى آخر.
              </p>
              <button
                type="button"
                onClick={goHome}
                className="min-h-[48px] px-5 rounded-xl font-bold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                العودة إلى الرئيسية
              </button>
            </div>
          </main>
        ))}

      {screen === 'report' && (
        <ReportScreen
          records={records}
          totalTimeSec={totalElapsedSec}
          onRetryMistakes={handleRetryMistakes}
          onNewQuiz={goHome}
          onOpenStats={() => setScreen('stats')}
        />
      )}

      <ConfirmModal
        open={confirmResetOpen}
        title="تأكيد إعادة الاختبار"
        message="هل تريد إعادة خلط الأسئلة والبدء من السؤال الأول؟ ستُفقد إجابات الجلسة الحالية ونقاطها."
        confirmLabel="نعم، أعد الاختبار"
        cancelLabel="متابعة الاختبار"
        onConfirm={() => startSession()}
        onCancel={() => setConfirmResetOpen(false)}
      />

      <ConfirmModal
        open={confirmFinishOpen}
        title="تأكيد إنهاء الاختبار"
        message={
          unansweredCount > 0
            ? `لم تُجب أو لم تتحقق من ${unansweredCount} سؤالاً. هل تريد إنهاء الاختبار وعرض النتيجة الآن؟ يمكنك الرجوع للأسئلة من زر «متابعة الاختبار».`
            : 'أجبت عن جميع الأسئلة. هل تريد إنهاء الاختبار وعرض النتيجة التفصيلية؟'
        }
        confirmLabel="إنهاء وعرض النتيجة"
        cancelLabel="متابعة الاختبار"
        onConfirm={finishSession}
        onCancel={() => setConfirmFinishOpen(false)}
      />

      <ConfirmModal
        open={confirmExitOpen}
        title="تأكيد الخروج من الاختبار"
        message="هل تريد الخروج والعودة إلى الصفحة الرئيسية؟ ستُفقد إجابات هذه الجلسة ونقاطها ولن تُحفظ المحاولة في الإحصائيات."
        confirmLabel="نعم، خروج إلى الرئيسية"
        cancelLabel="متابعة الاختبار"
        onConfirm={() => {
          setConfirmExitOpen(false);
          setConfirmFinishOpen(false);
          setConfirmResetOpen(false);
          setScreen('start');
        }}
        onCancel={() => setConfirmExitOpen(false)}
      />
    </>
  );
}
