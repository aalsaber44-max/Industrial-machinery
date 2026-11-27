import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { PageFrame, EmptyState, type AppSection } from './PageFrame';
import { SymbolSvg } from './SymbolSvg';
import { LIBRARY_ENTRIES } from '../utils/symbolLibrary';
import { QUANTITIES } from '../data/units';
import {
  clearFlashcardProgress,
  loadFlashcardProgress,
  saveFlashcardProgress,
  type FlashcardMark,
  type FlashcardProgress,
} from '../utils/history';

interface FlashcardsScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
}

type CardSource = 'symbols' | 'units';
type FilterMode = 'all' | 'review';

interface Flashcard {
  id: string;
  source: CardSource;
  prompt: string;
  answer: string;
  detail: string;
  svg?: string;
  topic: string;
}

function buildCards(source: CardSource): Flashcard[] {
  if (source === 'symbols') {
    return LIBRARY_ENTRIES.map((entry) => ({
      id: `symbol:${entry.id}`,
      source,
      prompt: 'ما اسم هذا الرمز الكهربائي؟',
      answer: entry.name,
      detail: [entry.functionText ?? '', entry.usage, `للحفظ: ${entry.note}`].filter(Boolean).join(' — '),
      svg: entry.svg,
      topic: entry.categoryTitle,
    }));
  }
  return QUANTITIES.map((q) => ({
    id: `unit:${q.name}`,
    source,
    prompt: `ما وحدة قياس «${q.name}» كما تُكتب في المعادلات؟`,
    answer: `${q.unit} — ${q.unitSymbol} — ورمز الكمية ${q.symbol}`,
    detail: [q.definition, q.multiples.length > 0 ? `المضاعفات: ${q.multiples.join(' ، ')}` : ''].filter(Boolean).join(' — '),
    topic: q.family,
  }));
}

/** بطاقات حفظ: سؤال أولاً، ثم كشف الإجابة، مع تصنيف «أعرفها» و«أحتاج مراجعتها». */
export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ onBack, onNavigate }) => {
  const [source, setSource] = useState<CardSource>('symbols');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState<FlashcardProgress>(() => loadFlashcardProgress());
  const [notice, setNotice] = useState<string | null>(null);

  const allCards = useMemo(() => buildCards(source), [source]);
  const visibleCards = useMemo(
    () => (filterMode === 'review' ? allCards.filter((c) => marks[c.id] === 'review') : allCards),
    [allCards, filterMode, marks]
  );

  const safeIndex = visibleCards.length === 0 ? 0 : Math.min(index, visibleCards.length - 1);
  const card = visibleCards[safeIndex];

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
    setNotice(null);
  }, [source, filterMode]);

  const knownCount = allCards.filter((c) => marks[c.id] === 'known').length;
  const reviewCount = allCards.filter((c) => marks[c.id] === 'review').length;

  const mark = (value: FlashcardMark) => {
    if (!card) return;
    const next = { ...marks, [card.id]: value };
    setMarks(next);
    if (!saveFlashcardProgress(next)) setNotice('تعذر حفظ التقدم في هذا المتصفح (التخزين المحلي غير متاح).');
    setRevealed(false);
    if (value === 'known') setIndex(Math.min(safeIndex + 1, Math.max(0, visibleCards.length - 1)));
  };

  const move = (direction: 1 | -1) => {
    if (visibleCards.length === 0) return;
    const next = (safeIndex + direction + visibleCards.length) % visibleCards.length;
    setIndex(next);
    setRevealed(false);
  };

  const handleReset = () => {
    setMarks({});
    clearFlashcardProgress();
    setIndex(0);
    setRevealed(false);
    setNotice('تم إعادة ضبط تقدّم البطاقات.');
  };

  return (
    <PageFrame
      title="بطاقات الحفظ (Flashcards)"
      subtitle="اسأل نفسك أولاً، ثم اكشف الإجابة، وصنّف البطاقة: أعرفها أو أحتاج مراجعتها."
      active="flashcards"
      onNavigate={onNavigate}
      onBackHome={onBack}
      actions={
        <button
          type="button"
          onClick={handleReset}
          className="min-h-[40px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة ضبط التقدم</span>
        </button>
      }
    >
      <section
        className="rounded-2xl border p-4 shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            المصدر:
          </span>
          {([
            { id: 'symbols' as CardSource, label: `الرموز (${LIBRARY_ENTRIES.length})` },
            { id: 'units' as CardSource, label: `الوحدات (${QUANTITIES.length})` },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSource(option.id)}
              aria-pressed={source === option.id}
              className="min-h-[36px] px-3 rounded-lg border text-xs font-bold cursor-pointer"
              style={{
                borderColor: source === option.id ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: source === option.id ? 'var(--primary)' : 'var(--bg-subtle)',
                color: source === option.id ? '#fff' : 'var(--text-main)',
              }}
            >
              {option.label}
            </button>
          ))}

          <span className="text-xs font-bold ms-auto" style={{ color: 'var(--text-muted)' }}>
            التصفية:
          </span>
          {([
            { id: 'all' as FilterMode, label: 'كل البطاقات' },
            { id: 'review' as FilterMode, label: `أحتاج مراجعتها (${reviewCount})` },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilterMode(option.id)}
              aria-pressed={filterMode === option.id}
              className="min-h-[36px] px-3 rounded-lg border text-xs font-bold cursor-pointer"
              style={{
                borderColor: filterMode === option.id ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: filterMode === option.id ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                color: filterMode === option.id ? 'var(--primary)' : 'var(--text-main)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          <span className="tabular-nums">
            البطاقة {visibleCards.length ? safeIndex + 1 : 0} من {visibleCards.length}
          </span>
          <span className="tabular-nums">
            <span style={{ color: 'var(--ok-text)' }}>أعرفها: {knownCount}</span>
            {' · '}
            <span style={{ color: 'var(--warn-text)' }}>تحتاج مراجعة: {reviewCount}</span>
            {' · '}
            غير مصنّفة: {allCards.length - knownCount - reviewCount}
          </span>
        </div>
      </section>

      {notice && (
        <p
          className="rounded-xl border p-3 text-xs font-semibold"
          style={{ borderColor: 'var(--warn-border)', backgroundColor: 'var(--warn-bg)', color: 'var(--warn-text)' }}
          role="status"
        >
          {notice}
        </p>
      )}

      {!card ? (
        <EmptyState
          title="لا توجد بطاقات في هذه التصفية"
          hint={
            filterMode === 'review'
              ? 'لم تُصنّف أي بطاقة بـ«أحتاج مراجعتها» بعد. راجع البطاقات وحدّدها أولاً.'
              : 'تأكد من اختيار مصدر للبطاقات.'
          }
          icon={<Layers className="w-8 h-8" />}
        />
      ) : (
        <section
          className="rounded-2xl border p-4 sm:p-6 shadow-sm space-y-4 fade-slide-enter"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <span
            className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
          >
            {card.topic}
          </span>

          <div className="text-center space-y-3">
            {card.svg && (
              <SymbolSvg svg={card.svg} label="رمز البطاقة" className="w-full max-w-xs mx-auto h-40" />
            )}
            <p className="text-base sm:text-lg font-bold" dir="auto">
              {card.prompt}
            </p>
          </div>

          {revealed ? (
            <div
              className="rounded-xl border p-4 space-y-2 text-center"
              style={{ borderColor: 'var(--ok-border)', backgroundColor: 'var(--ok-bg)', color: 'var(--ok-text)' }}
            >
              <p className="text-lg sm:text-xl font-bold" dir="auto">
                {card.answer}
              </p>
              <p className="text-sm leading-relaxed" dir="auto">
                {card.detail}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="w-full min-h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <Eye className="w-5 h-5" />
              <span>إظهار الإجابة</span>
            </button>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              className="min-h-[46px] px-4 rounded-xl border font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => mark('known')}
                className="min-h-[46px] px-4 rounded-xl border font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--ok-border)', backgroundColor: 'var(--ok-bg)', color: 'var(--ok-text)' }}
              >
                <Check className="w-4 h-4" />
                <span>أعرفها</span>
              </button>
              <button
                type="button"
                onClick={() => mark('review')}
                className="min-h-[46px] px-4 rounded-xl border font-bold text-sm flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--warn-border)', backgroundColor: 'var(--warn-bg)', color: 'var(--warn-text)' }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>أحتاج مراجعتها</span>
              </button>
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? 'إخفاء الإجابة' : 'إظهار الإجابة'}
                className="min-h-[46px] min-w-[46px] rounded-xl border flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => move(1)}
              className="min-h-[46px] px-4 rounded-xl border font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}
    </PageFrame>
  );
};
