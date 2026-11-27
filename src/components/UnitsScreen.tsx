import React, { useMemo, useState } from 'react';
import { Search, Ruler, ArrowUpDown, Gauge, X } from 'lucide-react';
import { PageFrame, EmptyState, type AppSection } from './PageFrame';
import { QUANTITIES, PREFIXES, type ElectricalQuantity, type QuantityFamily } from '../data/units';
import { normalize } from '../utils/quizLogic';

interface UnitsScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
}

type SortKey = 'name' | 'symbol' | 'unit';

const FAMILIES: (QuantityFamily | 'الكل')[] = ['الكل', 'أساسية', 'مشتقة', 'طاقة وقدرة', 'تردد وزمن'];

const SORT_LABELS: Record<SortKey, string> = {
  name: 'اسم الكمية',
  symbol: 'رمز الكمية',
  unit: 'اسم الوحدة',
};

function matches(quantity: ElectricalQuantity, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return [quantity.name, quantity.symbol, quantity.unit, quantity.unitSymbol, quantity.device ?? '', quantity.family]
    .map((v) => normalize(v))
    .some((v) => v.includes(q));
}

/** جدول الكميات والوحدات: بحث + تصفية + ترتيب. */
export const UnitsScreen: React.FC<UnitsScreenProps> = ({ onBack, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<QuantityFamily | 'الكل'>('الكل');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [ascending, setAscending] = useState(true);

  const rows = useMemo(() => {
    const filtered = QUANTITIES.filter((q) => (family === 'الكل' || q.family === family) && matches(q, query));
    const sorted = [...filtered].sort((a, b) => {
      const av = String(a[sortKey]);
      const bv = String(b[sortKey]);
      return av.localeCompare(bv, 'ar');
    });
    return ascending ? sorted : sorted.reverse();
  }, [query, family, sortKey, ascending]);

  return (
    <PageFrame
      title="الكميات والوحدات الكهربائية"
      subtitle="جدول الكتاب: اسم الكمية، رمزها، وحدة قياسها، رمز الوحدة، مضاعفات الوحدة وأجزاؤها، جهاز القياس، ثم التعريف."
      active="units"
      onNavigate={onNavigate}
      onBackHome={onBack}
    >
      <section
        className="rounded-2xl border p-4 shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="sm:col-span-1">
            <span className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              بحث
            </span>
            <span className="relative block">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3" style={{ color: 'var(--text-muted)' }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="الكمية أو الوحدة أو الرمز…"
                dir="auto"
                className="w-full min-h-[48px] rounded-xl border pr-10 pl-3 py-2 outline-none"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '16px',
                }}
              />
            </span>
          </label>

          <label>
            <span className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              التصفية
            </span>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value as QuantityFamily | 'الكل')}
              className="w-full min-h-[48px] rounded-xl border px-3 text-sm font-semibold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f === 'الكل' ? 'كل الكميات' : f}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="block text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              الترتيب حسب
            </span>
            <span className="flex gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="flex-1 min-h-[48px] rounded-xl border px-3 text-sm font-semibold outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAscending((v) => !v)}
                aria-label={ascending ? 'ترتيب تنازلي' : 'ترتيب تصاعدي'}
                title={ascending ? 'تنازلي' : 'تصاعدي'}
                className="min-h-[48px] min-w-[48px] rounded-xl border flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }} aria-live="polite">
            عدد الكميات المعروضة: {rows.length} من {QUANTITIES.length}
          </p>
          {(query || family !== 'الكل') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFamily('الكل');
              }}
              className="text-xs font-bold underline flex items-center gap-1 cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              <X className="w-3.5 h-3.5" />
              مسح البحث والتصفية
            </button>
          )}
        </div>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="لا توجد كميات مطابقة"
          hint="جرّب كلمة أخرى أو أعد التصفية إلى «كل الكميات»."
          icon={<Ruler className="w-8 h-8" />}
        />
      ) : (
        <section
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[1000px]">
              <caption className="sr-only">جدول الكميات الكهربائية ووحداتها</caption>
              <thead>
                <tr
                  className="text-right border-b"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
                >
                  <th scope="col" className="py-3 px-3 font-bold">اسم الكمية</th>
                  <th scope="col" className="py-3 px-2 font-bold">رمز الكمية</th>
                  <th scope="col" className="py-3 px-2 font-bold">وحدة القياس</th>
                  <th scope="col" className="py-3 px-2 font-bold">رمز الوحدة</th>
                  <th scope="col" className="py-3 px-3 font-bold">مضاعفات الوحدة وأجزاؤها</th>
                  <th scope="col" className="py-3 px-3 font-bold">التعريف</th>
                  <th scope="col" className="py-3 px-3 font-bold">جهاز القياس</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.name} className="border-b align-top" style={{ borderColor: 'var(--border-color)' }}>
                    <th scope="row" className="py-3 px-3 text-right font-bold" dir="auto">
                      {q.name}
                      <span
                        className="inline-block ms-2 px-1.5 py-0.5 rounded text-[10px] font-semibold align-middle"
                        style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                      >
                        {q.family}
                      </span>
                    </th>
                    <td className="py-3 px-2 text-center">
                      <span
                        className="inline-block min-w-[42px] px-2 py-1 rounded-lg font-bold tabular-nums"
                        style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
                        dir="ltr"
                      >
                        {q.symbol}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-semibold" dir="auto">{q.unit}</td>
                    <td className="py-3 px-2 text-center font-bold" dir="ltr">{q.unitSymbol}</td>
                    <td className="py-3 px-3">
                      {q.multiples.length > 0 ? (
                        <ul className="space-y-1">
                          {q.multiples.map((m) => (
                            <li key={m} dir="auto" className="text-xs font-semibold">
                              {m}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 leading-relaxed" dir="auto" style={{ color: 'var(--text-muted)' }}>
                      {q.definition}
                    </td>
                    <td className="py-3 px-3">
                      {q.device ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--ok-text)' }}>
                          <Gauge className="w-3.5 h-3.5" />
                          {q.device}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section
        className="rounded-2xl border p-4 shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <h2 className="text-sm font-bold mb-2">مضاعفات الوحدات (البادئات)</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          تُستخدم في أسئلة التحويل: 1 kΩ = 1000 Ω ، 1 mA = 0.001 A.
        </p>
        <div className="flex flex-wrap gap-2">
          {PREFIXES.map((p) => (
            <span
              key={p.symbol || 'none'}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
              dir="ltr"
            >
              {p.symbol ? `${p.symbol} — ${p.name} (10^${p.exponent})` : `بدون مضاعف (10^0)`}
            </span>
          ))}
        </div>
      </section>
    </PageFrame>
  );
};
