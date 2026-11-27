import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Info,
  Sparkles,
  Tag,
  Wrench,
  Lightbulb,
  ListChecks,
} from 'lucide-react';
import { PageFrame, EmptyState, type AppSection } from './PageFrame';
import { SymbolSvg } from './SymbolSvg';
import {
  LIBRARY_CATEGORY_SUMMARIES,
  LIBRARY_ENTRIES,
  filterLibrary,
  neighbourEntry,
  type LibraryEntry,
} from '../utils/symbolLibrary';

interface LibraryScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
  onStartStudy?: () => void;
}

const ALL = 'all';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onBack, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => filterLibrary(LIBRARY_ENTRIES, { query, categoryId }), [query, categoryId]);
  const selected = useMemo(
    () => (selectedId === null ? null : filtered.find((e) => e.id === selectedId) ?? LIBRARY_ENTRIES.find((e) => e.id === selectedId) ?? null),
    [filtered, selectedId]
  );

  const openEntry = (entry: LibraryEntry) => setSelectedId(entry.id);

  const goNeighbour = (direction: 1 | -1) => {
    if (!selected) return;
    const next = neighbourEntry(filtered.length > 0 ? filtered : LIBRARY_ENTRIES, selected.id, direction);
    if (next) setSelectedId(next.id);
  };

  return (
    <PageFrame
      title="مكتبة الرموز الكهربائية"
      subtitle={`${LIBRARY_ENTRIES.length} رمزاً من قاعدة بيانات المشروع الأصلية، مع البحث والتصفية وعرض التفاصيل.`}
      active="library"
      onNavigate={onNavigate}
      onBackHome={onBack}
    >
      {selected ? (
        <LibraryDetails
          entry={selected}
          position={
            filtered.length > 0
              ? filtered.findIndex((e) => e.id === selected.id) + 1
              : 0
          }
          total={filtered.length > 0 ? filtered.length : LIBRARY_ENTRIES.length}
          onClose={() => setSelectedId(null)}
          onPrev={() => goNeighbour(-1)}
          onNext={() => goNeighbour(1)}
        />
      ) : (
        <>
          <section
            className="rounded-2xl border p-4 shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1">
                <span className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                  البحث بالاسم أو الاسم البديل أو الوظيفة
                </span>
                <span className="relative block">
                  <Search
                    className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="مثال: قاطع، مفتاح، إيريز، فيوز…"
                    dir="auto"
                    className="w-full min-h-[48px] rounded-xl border pr-10 pl-3 py-2 text-base outline-none"
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '16px',
                    }}
                  />
                </span>
              </label>

              <label className="sm:w-64">
                <span className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                  التصنيف
                </span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full min-h-[48px] rounded-xl border px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value={ALL}>كل التصنيفات ({LIBRARY_ENTRIES.length})</option>
                  {LIBRARY_CATEGORY_SUMMARIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.count})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                النتائج: {filtered.length} رمزاً
              </p>
              {(query || categoryId !== ALL) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCategoryId(ALL);
                  }}
                  className="text-xs font-bold underline flex items-center gap-1 cursor-pointer"
                  style={{ color: 'var(--primary)' }}
                >
                  <X className="w-3.5 h-3.5" />
                  مسح البحث والتصفية
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {LIBRARY_CATEGORY_SUMMARIES.map((c) => {
                const isActive = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(isActive ? ALL : c.id)}
                    aria-pressed={isActive}
                    className="px-3 min-h-[36px] rounded-lg border text-xs font-bold cursor-pointer"
                    style={{
                      borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: isActive ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    {c.title} <span className="tabular-nums">({c.count})</span>
                  </button>
                );
              })}
            </div>
          </section>

          {filtered.length === 0 ? (
            <EmptyState
              title="لا توجد رموز مطابقة"
              hint="جرّب كلمة أقصر أو اختر تصنيفاً آخر، أو امسح البحث لعرض جميع الرموز."
              icon={<Search className="w-8 h-8" />}
            />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => openEntry(entry)}
                    className="w-full h-full text-right rounded-2xl border p-3 flex gap-3 items-center transition-colors cursor-pointer hover:shadow-sm"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <SymbolSvg svg={entry.svg} label={entry.name} className="w-24 h-16 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        #{entry.id}
                      </span>
                      <span className="block font-bold text-sm leading-snug" dir="auto">
                        {entry.name}
                      </span>
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                      >
                        {entry.categoryTitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageFrame>
  );
};

interface LibraryDetailsProps {
  entry: LibraryEntry;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const LibraryDetails: React.FC<LibraryDetailsProps> = ({ entry, position, total, onClose, onPrev, onNext }) => (
  <section
    className="rounded-2xl border p-4 sm:p-6 shadow-sm space-y-4 fade-slide-enter"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={onClose}
        className="min-h-[40px] px-3 rounded-lg border text-sm font-bold flex items-center gap-1.5 cursor-pointer"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <ChevronRight className="w-4 h-4" />
        <span>رجوع إلى القائمة</span>
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {total > 0 ? `${position} من ${total}` : ''}
        </span>
        <button
          type="button"
          onClick={onPrev}
          aria-label="الرمز السابق"
          className="min-h-[40px] min-w-[40px] rounded-lg border flex items-center justify-center cursor-pointer"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="الرمز التالي"
          className="min-h-[40px] min-w-[40px] rounded-lg border flex items-center justify-center cursor-pointer"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div>
        <SymbolSvg svg={entry.svg} label={entry.name} className="w-full min-h-[190px]" />
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          الرسم من قاعدة بيانات الرموز الأصلية للكتاب (الرمز رقم {entry.id}).
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            الاسم العربي
          </span>
          <h2 className="text-xl font-bold leading-snug" dir="auto">
            {entry.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <InfoRow icon={<Tag className="w-4 h-4" />} label="الاسم الإنجليزي">
            {entry.englishName ?? (entry.aliases.some((a) => /[A-Za-z]/.test(a))
              ? entry.aliases.filter((a) => /[A-Za-z]/.test(a)).join(' · ')
              : 'غير متوفر في البيانات الأصلية للمشروع')}
          </InfoRow>
          <InfoRow icon={<ListChecks className="w-4 h-4" />} label="التصنيف">
            {entry.categoryTitle}
          </InfoRow>
          <InfoRow icon={<Info className="w-4 h-4" />} label="أسماء بديلة مقبولة">
            {entry.aliases.length > 0 ? entry.aliases.join(' · ') : '—'}
          </InfoRow>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <DetailBox title="الوظيفة" tone="primary" icon={<Wrench className="w-4 h-4" />}>
        {entry.functionText ?? 'لم تُدخل وظيفة لهذا الرمز في ملف الوظائف (src/data/functions.ts).'}
      </DetailBox>
      <DetailBox title="الاستخدام" tone="neutral" icon={<Sparkles className="w-4 h-4" />}>
        {entry.usage}
      </DetailBox>
      <DetailBox title="ملاحظة للحفظ" tone="ok" icon={<Lightbulb className="w-4 h-4" />}>
        {entry.note}
      </DetailBox>
      <DetailBox title="كيف تفرّقه عن غيره؟" tone="neutral" icon={<Info className="w-4 h-4" />}>
        اقرأ اسم الرمز ببطء وحدّد العنصر المميز في الرسم، ثم استخدم البطاقات لمراجعته لاحقاً.
      </DetailBox>
    </div>

    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
      الاسم العربي والرسم والأسماء البديلة مأخوذة كما هي من قاعدة بيانات المشروع الأصلية. أما الاسم الإنجليزي
      «عند توفره» والاستخدام وملاحظة الحفظ فهي إضافات تعليمية توضيحية أُضيفت للمراجعة، وليست جزءاً من بيانات الكتاب.
    </p>
  </section>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <div
    className="rounded-lg border px-3 py-2 flex items-start gap-2"
    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
  >
    <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>
      {icon}
    </span>
    <span>
      <span className="block text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="block text-sm font-semibold" dir="auto">
        {children}
      </span>
    </span>
  </div>
);

const DetailBox: React.FC<{
  title: string;
  tone: 'primary' | 'neutral' | 'ok';
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, tone, icon, children }) => {
  const style =
    tone === 'ok'
      ? { backgroundColor: 'var(--ok-bg)', borderColor: 'var(--ok-border)', color: 'var(--ok-text)' }
      : tone === 'primary'
        ? { backgroundColor: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary)' }
        : { backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' };
  return (
    <div className="rounded-xl border p-3" style={style}>
      <div className="flex items-center gap-1.5 font-bold text-sm mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-sm leading-relaxed" dir="auto">
        {children}
      </p>
    </div>
  );
};
