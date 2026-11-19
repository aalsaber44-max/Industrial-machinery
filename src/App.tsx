import { useCallback, useEffect, useState } from 'react';
import { SYMBOLS, type ElectricalSymbol } from './data/symbols';
import {
  evaluateAnswer,
  shuffleArray,
  type AnswerRecord,
  type EvaluationResult,
  type QuizMode,
} from './utils/quizLogic';
import { playFeedbackSound } from './utils/audio';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReportScreen } from './components/ReportScreen';
import { ConfirmModal } from './components/ConfirmModal';

type AppScreen = 'start' | 'quiz' | 'report';

function shouldAutostart(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('autostart') === '1';
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(() => (shouldAutostart() ? 'quiz' : 'start'));
  const [mode, setMode] = useState<QuizMode>('full');
  const [muted, setMuted] = useState<boolean>(false);

  const [deck, setDeck] = useState<ElectricalSymbol[]>(() => shuffleArray(SYMBOLS));
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

  const startSession = useCallback((customDeck?: ElectricalSymbol[]) => {
    let newDeck = customDeck ? shuffleArray(customDeck) : shuffleArray(SYMBOLS);
    if (!customDeck && mode === 'quick20') {
      newDeck = newDeck.slice(0, Math.min(20, SYMBOLS.length));
    }
    setDeck(newDeck);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setAnswerText('');
    setCheckedResult(null);
    setHintShown(false);
    setAnswerRevealed(false);
    setRecords([]);
    setQuestionElapsedSec(0);
    setTotalElapsedSec(0);
    setConfirmResetOpen(false);
    setScreen('quiz');
  }, [mode]);

  const currentSymbol = deck[currentIndex] ?? SYMBOLS[0];

  const handleCheck = useCallback(() => {
    if (checkedResult) return;

    // إذا كُشفت الإجابة في وضع التدريب فلا تُحتسب نقطة حتى لو كتبها الطالب
    const res: EvaluationResult = answerRevealed
      ? {
          status: 'revealed',
          similarity: 0,
          message: `تم كشف الإجابة لهذا السؤال، لذلك لا تُحتسب له نقطة. الإجابة: ${currentSymbol.name}`,
        }
      : evaluateAnswer(answerText, currentSymbol, SYMBOLS);
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
        symbol: currentSymbol,
        userAnswer: answerText,
        status: res.status,
        timeSpentSec: questionElapsedSec,
      },
    ]);
  }, [answerRevealed, answerText, checkedResult, currentSymbol, muted, questionElapsedSec]);

  const advanceOrFinish = useCallback(() => {
    if (currentIndex + 1 >= deck.length) {
      playFeedbackSound('finish', muted);
      setScreen('report');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setAnswerText('');
    setCheckedResult(null);
    setHintShown(false);
    setAnswerRevealed(false);
    setQuestionElapsedSec(0);
  }, [currentIndex, deck.length, muted]);

  const handleSkip = useCallback(() => {
    if (checkedResult) return;
    setStreak(0);
    playFeedbackSound('wrong', muted);
    const updatedRecords: AnswerRecord[] = [
      ...records,
      {
        symbol: currentSymbol,
        userAnswer: answerText,
        status: 'skipped',
        timeSpentSec: questionElapsedSec,
      },
    ];
    setRecords(updatedRecords);

    if (currentIndex + 1 >= deck.length) {
      playFeedbackSound('finish', muted);
      setScreen('report');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswerText('');
      setCheckedResult(null);
      setHintShown(false);
      setAnswerRevealed(false);
      setQuestionElapsedSec(0);
    }
  }, [answerText, checkedResult, currentIndex, currentSymbol, deck.length, muted, questionElapsedSec, records]);

  const handleRetryMistakes = useCallback(() => {
    const mistakeSymbols = records
      .filter((r) => r.status !== 'correct')
      .map((r) => r.symbol);
    if (mistakeSymbols.length > 0) {
      startSession(mistakeSymbols);
    }
  }, [records, startSession]);

  return (
    <>
      {screen === 'start' && (
        <StartScreen
          totalSymbols={SYMBOLS.length}
          selectedMode={mode}
          onSelectMode={setMode}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onStart={() => startSession()}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          mode={mode}
          currentSymbol={currentSymbol}
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
          totalBankCount={SYMBOLS.length}
          onRetryMistakes={handleRetryMistakes}
          onNewQuiz={() => setScreen('start')}
        />
      )}

      <ConfirmModal
        open={confirmResetOpen}
        title="تأكيد إعادة الاختبار"
        message="هل تريد إعادة خلط الرموز والبدء من السؤال الأول؟ ستُفقد نقاط الجلسة الحالية."
        confirmLabel="نعم، أعد الاختبار"
        cancelLabel="متابعة الاختبار"
        onConfirm={() => startSession()}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
}
