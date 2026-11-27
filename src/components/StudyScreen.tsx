import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Gauge, Ruler, Info } from 'lucide-react';
import { PageFrame, EmptyState, type AppSection } from './PageFrame';
import { SymbolSvg } from './SymbolSvg';
import { LIBRARY_CATEGORY_SUMMARIES, LIBRARY_ENTRIES } from '../utils/symbolLibrary';
import { QUANTITIES } from '../data/units';
import { MEASURING_DEVICES } from '../data/devices';
import { getCategoryById } from '../data/categories';

interface StudyScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  kind: 'category' | 'units' | 'devices';
  categoryId?: string;
}

const LESSONS: Lesson[] = [
  ...LIBRARY_CATEGORY_SUMMARIES.map<Lesson>((c) => ({
    id: `category:${c.id}`,
    title: c.title,
    description: c.description,
    kind: 'category',
    categoryId: c.id,
  })),
  {
    id: 'units',
    title: 'الكميات والوحدات',
    description: 'مراجعة الكميات الكهربائية ووحداتها وتعريفاتها وجهاز القياس المرتبط بكل كمية.',
    kind: 'units',
  },
  {
    id: 'devices',
    title: 'أجهزة القياس',
    description: 'مراجعة سريعة لأجهزة القياس والكمية التي يقيسها كل جهاز وطريقة توصيله.',
    kind: 'devices',
  },
];

/** وضع الدراسة: تصفّح المحتوى التعليمي دون اختبار. */
export const StudyScreen: React.FC<StudyScreenProps> = ({ onBack, onNavigate }) => {
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = LESSONS[Math.min(lessonIndex, LESSONS.length - 1)];

  const entries = useMemo(() => {
    if (lesson.kind !== 'category' || !lesson.categoryId) return [];
    const category = getCategoryById(lesson.categoryId);
    if (!category) return [];
    return category.ids.map((id) => LIBRARY_ENTRIES.find((e) => e.id === id)).filter((e) => e !== undefined);
  }, [lesson]);

  const go = (direction: 1 | -1) =>
    setLessonIndex((prev) => Math.min(LESSONS.length - 1, Math.max(0, prev + direction)));

  return (
    <PageFrame
      title="وضع الدراسة"
      subtitle="تنقّل بين الدروس (فئات الرموز، الوحدات، أجهزة القياس) للمراجعة دون الدخول في اختبار."
      active="study"
      onNavigate={onNavigate}
      onBackHome={onBack}
    >
      <section
        className="rounded-2xl border p-4 shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
            الدرس {lessonIndex + 1} من {LESSONS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={lessonIndex === 0}
              className="min-h-[40px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <ChevronRight className="w-4 h-4" />
              <span>الدرس السابق</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={lessonIndex === LESSONS.length - 1}
              className="min-h-[40px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <span>الدرس التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
          role="progressbar"
          aria-valuenow={lessonIndex + 1}
          aria-valuemin={1}
          aria-valuemax={LESSONS.length}
          aria-label="تقدم الدروس"
        >
          <div
            className="h-full"
            style={{ width: `${((lessonIndex + 1) / LESSONS.length) * 100}%`, backgroundColor: 'var(--primary)' }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LESSONS.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLessonIndex(i)}
              aria-pressed={i === lessonIndex}
              className="px-2.5 min-h-[32px] rounded-md border text-[11px] font-bold cursor-pointer"
              style={{
                borderColor: i === lessonIndex ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: i === lessonIndex ? 'var(--primary)' : 'var(--bg-subtle)',
                color: i === lessonIndex ? '#fff' : 'var(--text-muted)',
              }}
            >
              {l.title}
            </button>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border p-4 shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          {lesson.kind === 'devices' ? (
            <Gauge className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          ) : lesson.kind === 'units' ? (
            <Ruler className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          ) : (
            <BookOpen className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          )}
          <span>{lesson.title}</span>
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {lesson.description}
        </p>
        {lesson.kind === 'category' && (
          <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            عدد الرموز في هذا الدرس: {entries.length}
          </p>
        )}
      </section>

      {lesson.kind === 'category' &&
        (entries.length === 0 ? (
          <EmptyState title="لا توجد رموز في هذا الدرس" hint="اختر درساً آخر." />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border p-3 flex gap-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <SymbolSvg svg={entry.svg} label={entry.name} className="w-24 h-16 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-sm" dir="auto">
                    <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                      #{entry.id}{' '}
                    </span>
                    {entry.name}
                  </p>
                  <p className="text-xs leading-relaxed" dir="auto" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>الوظيفة: </strong>
                    {entry.functionText ?? 'لم تُدخل وظيفة لهذا الرمز.'}
                  </p>
                  <p className="text-xs leading-relaxed" dir="auto" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-main)' }}>الاستخدام: </strong>
                    {entry.usage}
                  </p>
                  <p className="text-xs leading-relaxed" dir="auto">
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      للحفظ:{' '}
                    </span>
                    {entry.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {lesson.kind === 'units' && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUANTITIES.map((q) => (
            <li
              key={q.name}
              className="rounded-2xl border p-3 space-y-1"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <p className="font-bold text-sm" dir="auto">
                {q.name} <span className="font-mono" dir="ltr">({q.symbol})</span>
              </p>
              <p className="text-xs font-semibold" dir="auto">
                الوحدة: {q.unit} — <span dir="ltr">{q.unitSymbol}</span>
              </p>
              {q.multiples.length > 0 && (
                <p className="text-xs font-semibold" dir="auto">
                  المضاعفات والأجزاء: {q.multiples.join(' ، ')}
                </p>
              )}
              <p className="text-xs leading-relaxed" dir="auto" style={{ color: 'var(--text-muted)' }}>
                {q.definition}
              </p>
              {q.device && (
                <p className="text-xs" style={{ color: 'var(--ok-text)' }}>
                  جهاز القياس: {q.device}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {lesson.kind === 'devices' && (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEASURING_DEVICES.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border p-3 flex gap-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <SymbolSvg svg={d.svg} label={d.name} className="w-24 h-16 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-sm" dir="auto">{d.name}</p>
                  <p className="text-xs" dir="auto" style={{ color: 'var(--text-muted)' }}>
                    يقيس: {d.quantity} — {d.unit} ({d.unitSymbol})
                  </p>
                  <p className="text-xs leading-relaxed" dir="auto" style={{ color: 'var(--text-muted)' }}>
                    التوصيل: {d.connection}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs flex items-start gap-2" style={{ color: 'var(--text-muted)' }}>
            <Info className="w-4 h-4 shrink-0" />
            للتفاصيل الكاملة (خطوات الاستخدام والملاحظات) انتقل إلى قسم «أجهزة القياس».
          </p>
        </>
      )}
    </PageFrame>
  );
};
