import React, { useMemo, useState } from 'react';
import { BarChart3, Trash2, TrendingUp, Award, Clock, RefreshCw, Target, AlertTriangle } from 'lucide-react';
import { PageFrame, EmptyState, StatPill, type AppSection } from './PageFrame';
import { aggregateAttempts, clearAttempts, loadAttempts } from '../utils/history';
import { formatDuration } from '../utils/quizLogic';

interface StatsScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** الإحصائيات وسجل المحاولات المحفوظ محلياً. */
export const StatsScreen: React.FC<StatsScreenProps> = ({ onBack, onNavigate }) => {
  const [attempts, setAttempts] = useState(() => loadAttempts());
  const stats = useMemo(() => aggregateAttempts(attempts), [attempts]);

  const handleClear = () => {
    if (!window.confirm('هل تريد حذف سجل المحاولات بالكامل؟ لا يمكن التراجع عن ذلك.')) return;
    clearAttempts();
    setAttempts(loadAttempts());
  };

  return (
    <PageFrame
      title="الإحصائيات وسجل المحاولات"
      subtitle="ملخص تقدمك: عدد الاختبارات، المتوسط، أعلى نتيجة، نقاط القوة والضعف، والأسئلة المتكررة في الأخطاء."
      active="stats"
      onNavigate={onNavigate}
      onBackHome={onBack}
      actions={
        <button
          type="button"
          onClick={handleClear}
          disabled={attempts.length === 0}
          className="min-h-[40px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--err-border)', backgroundColor: 'var(--err-bg)', color: 'var(--err-text)' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>حذف السجل</span>
        </button>
      }
    >
      {attempts.length === 0 ? (
        <EmptyState
          title="لا توجد محاولات محفوظة بعد"
          hint="أكمل اختباراً واحداً على الأقل، وستُحفظ نتيجته تلقائياً في هذا المتصفح وتظهر هنا."
          icon={<BarChart3 className="w-8 h-8" />}
        />
      ) : (
        <>
          <section
            className="rounded-2xl border p-4 shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <StatPill label="اختبارات مكتملة" value={stats.completed} />
              <StatPill label="متوسط الدرجات" value={`${stats.averagePercentage}%`} />
              <StatPill label="أعلى نتيجة" value={`${stats.bestPercentage}%`} />
              <StatPill label="آخر نتيجة" value={`${stats.lastPercentage ?? 0}%`} />
              <StatPill label="إجابات صحيحة" value={stats.totalCorrect} />
              <StatPill label="إجابات خاطئة" value={stats.totalWrong} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                إجمالي زمن الاختبارات: <span className="tabular-nums">{formatDuration(stats.totalTimeSec)}</span>
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                إجمالي الأسئلة: <span className="tabular-nums">{stats.totalQuestions}</span>
              </span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TopicCard
              title="نقاط القوة"
              icon={<Award className="w-4 h-4" />}
              tone="ok"
              rows={stats.strengths}
              emptyText="لا توجد بيانات كافية بعد."
            />
            <TopicCard
              title="نقاط تحتاج مراجعة"
              icon={<Target className="w-4 h-4" />}
              tone="warn"
              rows={stats.weaknesses}
              emptyText="لا توجد بيانات كافية بعد."
            />
          </div>

          <section
            className="rounded-2xl border p-4 shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warn-text)' }} />
              أسئلة تتكرر فيها الأخطاء
            </h2>
            {stats.frequentMistakes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                لا توجد أخطاء مسجّلة — أحسنت!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {stats.frequentMistakes.map((m) => (
                  <li
                    key={m.prompt}
                    className="rounded-lg border px-3 py-2 text-sm flex items-start justify-between gap-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <span dir="auto" className="min-w-0">
                      {m.prompt}
                      <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {m.topic}
                      </span>
                    </span>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
                      style={{ backgroundColor: 'var(--err-bg)', color: 'var(--err-text)' }}
                    >
                      {m.count}×
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-sm font-bold p-4 pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              سجل المحاولات
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[720px]">
                <thead>
                  <tr className="text-right border-y" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                    <th scope="col" className="py-2.5 px-3 font-bold">#</th>
                    <th scope="col" className="py-2.5 px-3 font-bold">التاريخ</th>
                    <th scope="col" className="py-2.5 px-3 font-bold">الوضع</th>
                    <th scope="col" className="py-2.5 px-2 font-bold">صحيح</th>
                    <th scope="col" className="py-2.5 px-2 font-bold">خاطئ</th>
                    <th scope="col" className="py-2.5 px-2 font-bold">النسبة</th>
                    <th scope="col" className="py-2.5 px-3 font-bold">المدة</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map((attempt, index) => (
                    <tr key={attempt.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-2.5 px-3 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {stats.history.length - index}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums whitespace-nowrap">{formatDate(attempt.dateISO)}</td>
                      <td className="py-2.5 px-3">{attempt.modeLabel}</td>
                      <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--ok-text)' }}>
                        {attempt.correct}
                      </td>
                      <td className="py-2.5 px-2 tabular-nums" style={{ color: 'var(--err-text)' }}>
                        {attempt.wrong + attempt.close + attempt.unanswered}
                      </td>
                      <td className="py-2.5 px-2 font-bold tabular-nums">{attempt.percentage}%</td>
                      <td className="py-2.5 px-3 tabular-nums">{formatDuration(attempt.durationSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PageFrame>
  );
};

const TopicCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  tone: 'ok' | 'warn';
  rows: { topic: string; correct: number; total: number }[];
  emptyText: string;
}> = ({ title, icon, tone, rows, emptyText }) => {
  const palette =
    tone === 'ok'
      ? { color: 'var(--ok-text)', bg: 'var(--ok-bg)', border: 'var(--ok-border)' }
      : { color: 'var(--warn-text)', bg: 'var(--warn-bg)', border: 'var(--warn-border)' };

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: palette.color }}>
        {icon}
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const pct = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
            return (
              <li key={row.topic}>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span dir="auto" className="min-w-0 truncate">
                    {row.topic}
                  </span>
                  <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {row.correct}/{row.total} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div className="h-full" style={{ width: `${pct}%`, backgroundColor: palette.border }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
