import { useCallback, useEffect, useState } from 'react';
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
  shuffleArray,
  type AnswerRecord,
  type EvaluationResult,
  type QuizMode,
} from './utils/quizLogic';
import { SYMBOLS } from './data/symbols';
import { playFeedbackSound } from './utils/audio';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReportScreen } from './components/ReportScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { LibraryScreen } from './components/LibraryScreen';
import { UnitsScreen } from './components/UnitsScreen';
import { DevicesScreen } from './components/DevicesScreen';

type AppScreen = 'start' | 'quiz' | 'report' | 'library' | 'units' | 'devices';

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
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const [answerText, setAnswerText] = useState<string>('');
  const [checkedResult, setCheckedResult] = useState<EvaluationResult | null>(null);
  const [hintShown, setHintShown] = useState<boolean>(false);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);

  const [questionElapsedSec, setQuestionElapsedSec] = useState<number>(0);
  const [totalElapsedSec, setTotalElapsedSec] = useState<number>(0);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  // مؤقت السؤال والاختبار أثناء اللعب قبل التحقق أو طوال الجلسة
  useEffect(() => {
    if (screen !== 'quiz') return;
    const timer = window.setInterval(() => {
      setTotalElapsedSec((prev) => prev + 1);
      if (!checkedResult) {
        setQuestionElapsedSec((prev) => prev + 1);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, checkedResult]);

  const resetQuestionState = () => {
    setAnswerText('');
    setCheckedResult(null);
    setHintShown(false);
    setAnswerRevealed(false);
    setQuestionElapsedSec(0);
  };

  const startSession = useCallback(
    (customDeck?: Question[]) => {
      const newDeck = customDeck ? shuffleArray(customDeck.map((q) => reshuffleOptions(q))) : buildDeck(config);
      if (newDeck.length === 0) return;
      setDeck(newDeck);
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setRecords([]);
      setTotalElapsedSec(0);
      resetQuestionState();
      setConfirmResetOpen(false);
      setScreen('quiz');
    },
    [config]
  );

  const currentQuestion: Question = deck[currentIndex] ?? deck[0];

  const handleCheck = useCallback(() => {
    if (checkedResult || !currentQuestion) return;

    // إذا كُشفت الإجابة في وضع التدريب فلا تُحتسب نقطة حتى لو أجاب الطالب بها
    const res: EvaluationResult = answerRevealed
      ? revealedResult(currentQuestion)
      : evaluateQuestion(currentQuestion, answerText);
    setCheckedResult(res);

    if (res.status === 'correct') {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      playFeedbackSound('correct', muted);
    } else if (res.status === 'close' || res.status === 'revealed') {
      setStreak(0);
      playFeedbackSound('close', muted);
    } else {
      setStreak(0);
      playFeedbackSound('wrong', muted);
    }

    setRecords((prev) => [
      ...prev,
      {
        question: currentQuestion,
        userAnswer: describeUserAnswer(currentQuestion, answerText),
        status: res.status,
        timeSpentSec: questionElapsedSec,
      },
    ]);
  }, [answerRevealed, answerText, checkedResult, currentQuestion, muted, questionElapsedSec]);

  const advanceOrFinish = useCallback(() => {
    if (currentIndex + 1 >= deck.length) {
      playFeedbackSound('finish', muted);
      setScreen('report');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    resetQuestionState();
  }, [currentIndex, deck.length, muted]);

  const handleSkip = useCallback(() => {
    if (checkedResult || !currentQuestion) return;
    setStreak(0);
    playFeedbackSound('wrong', muted);
    setRecords((prev) => [
      ...prev,
      {
        question: currentQuestion,
        userAnswer: describeUserAnswer(currentQuestion, answerText),
        status: 'skipped',
        timeSpentSec: questionElapsedSec,
      },
    ]);

    if (currentIndex + 1 >= deck.length) {
      playFeedbackSound('finish', muted);
      setScreen('report');
    } else {
      setCurrentIndex((prev) => prev + 1);
      resetQuestionState();
    }
  }, [answerText, checkedResult, currentIndex, currentQuestion, deck.length, muted, questionElapsedSec]);

  /** إعادة الأسئلة التي لم تُجَب إجابة صحيحة فقط (خاطئة، قريبة، متخطاة، مكشوفة). */
  const handleRetryMistakes = useCallback(() => {
    const mistakes = records.filter((r) => r.status !== 'correct').map((r) => r.question);
    if (mistakes.length > 0) {
      startSession(mistakes);
    }
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
        />
      )}

      {screen === 'library' && <LibraryScreen onBack={() => setScreen('start')} />}
      {screen === 'units' && <UnitsScreen onBack={() => setScreen('start')} />}
      {screen === 'devices' && <DevicesScreen onBack={() => setScreen('start')} />}

      {screen === 'quiz' && currentQuestion && (
        <QuizScreen
          practice={config.practice}
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={deck.length}
          score={score}
          streak={streak}
          questionElapsedSec={questionElapsedSec}
          totalElapsedSec={totalElapsedSec}
          answerText={answerText}
          onChangeAnswer={setAnswerText}
          checkedResult={checkedResult}
          hintShown={hintShown}
          answerRevealed={answerRevealed}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onCheck={handleCheck}
          onNext={advanceOrFinish}
          onSkip={handleSkip}
          onHint={() => setHintShown(true)}
          onRevealAnswer={() => setAnswerRevealed(true)}
          onRequestReset={() => setConfirmResetOpen(true)}
        />
      )}

      {screen === 'report' && (
        <ReportScreen
          records={records}
          totalTimeSec={totalElapsedSec}
          onRetryMistakes={handleRetryMistakes}
          onNewQuiz={() => setScreen('start')}
        />
      )}

      <ConfirmModal
        open={confirmResetOpen}
        title="تأكيد إعادة الاختبار"
        message="هل تريد إعادة خلط الأسئلة والبدء من السؤال الأول؟ ستُفقد نقاط الجلسة الحالية."
        confirmLabel="نعم، أعد الاختبار"
        cancelLabel="متابعة الاختبار"
        onConfirm={() => startSession()}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
}
