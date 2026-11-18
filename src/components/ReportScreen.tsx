import React from 'react';
import {
  Download,
  FileText,
  Printer,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
} from 'lucide-react';
import { formatDuration, getVerbalGrade, type AnswerRecord } from '../utils/quizLogic';
import { buildHtmlReport, buildTxtReport, downloadTextFile } from '../utils/reportGenerator';

interface ReportScreenProps {
  records: readonly AnswerRecord[];
  totalTimeSec: number;
  totalBankCount: number;
  onRetryMistakes: () => void;
  onNewQuiz: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  records,
  totalTimeSec,
  totalBankCount,
  onRetryMistakes,
  onNewQuiz,
}) => {
  const total = records.length;
  const correctCount = records.filter((r) => r.status === 'correct').length;
  const skippedCount = records.filter((r) => r.status === 'skipped').length;
  const wrongCount = total - correctCount - skippedCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const grade = getVerbalGrade(percentage);
  const mistakesCount = total - correctCount;

  // حساب محيط الرسم الدائري SVG
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleDownloadHtml = () => {
    const html = buildHtmlReport(records, totalTimeSec);
    downloadTextFile('تقرير-اختبار-الرموز-الكهربائية.html', html, 'text/html;charset=utf-8');
  };

  const handleDownloadTxt = () => {
    const txt = buildTxtReport(records, totalTimeSec);
    downloadTextFile('تقرير-اختبار-الرموز-الكهربائية.txt', txt, 'text/plain;charset=utf-8');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-5 fade-slide-enter">
        {/* ملخص النتيجة مع الرسم الدائري */}
        <section
          className="rounded-2xl border p-6 sm:p-8 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right space-y-2">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                النتيجة النهائية · قاعدة بيانات {totalBankCount} رمزاً
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold">
                التقدير: {grade}
              </h1>
              <p className="text-base tabular-nums" style={{ color: 'var(--text-muted)' }}>
                حصلت على <strong>{correctCount}</strong> من أصل <strong>{total}</strong> في مدة{' '}
                <strong>{formatDuration(totalTimeSec)}</strong>
              </p>
            </div>

            {/* رسم دائري SVG للنسبة المئوية */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="12"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke={percentage >= 60 ? '#10b981' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{percentage}%</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  النسبة
                </span>
              </div>
            </div>
          </div>

          {/* بطاقات الأرقام */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div
              className="rounded-xl border p-3.5 text-center"
              style={{ backgroundColor: 'var(--ok-bg)', borderColor: 'var(--ok-border)', color: 'var(--ok-text)' }}
            >
              <div className="text-2xl font-bold tabular-nums">{correctCount}</div>
              <div className="text-xs sm:text-sm font-semibold">صحيح</div>
            </div>
            <div
              className="rounded-xl border p-3.5 text-center"
              style={{ backgroundColor: 'var(--err-bg)', borderColor: 'var(--err-border)', color: 'var(--err-text)' }}
            >
              <div className="text-2xl font-bold tabular-nums">{wrongCount}</div>
              <div className="text-xs sm:text-sm font-semibold">خطأ</div>
            </div>
            <div
              className="rounded-xl border p-3.5 text-center"
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <div className="text-2xl font-bold tabular-nums">{skippedCount}</div>
              <div className="text-xs sm:text-sm font-semibold">متخطى</div>
            </div>
          </div>

          {/* أزرار الإجراءات والتصدير */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="min-h-[48px] px-4 py-2 rounded-xl font-bold text-sm text-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Download className="w-4 h-4" />
                <span>تحميل تقرير الاختبار (HTML)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="min-h-[48px] px-3.5 py-2 rounded-xl border font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <FileText className="w-4 h-4" />
                <span>تحميل التقرير (TXT)</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[48px] px-3.5 py-2 rounded-xl border font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {mistakesCount > 0 && (
                <button
                  type="button"
                  onClick={onRetryMistakes}
                  className="min-h-[48px] px-3.5 py-2 rounded-xl border font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  style={{
                    borderColor: 'var(--warn-border)',
                    backgroundColor: 'var(--warn-bg)',
                    color: 'var(--warn-text)',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة الأخطاء فقط ({mistakesCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNewQuiz}
                className="min-h-[48px] px-3.5 py-2 rounded-xl border font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>اختبار جديد</span>
              </button>
            </div>
          </div>
        </section>

        {/* جدول المراجعة التفصيلي */}
        <section
          className="rounded-2xl border p-4 sm:p-6 shadow-sm overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <h2 className="text-lg font-bold mb-4">جدول مراجعة الإجابات</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                className="border-b text-right"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-2">الرمز</th>
                <th className="py-3 px-2">إجابتك</th>
                <th className="py-3 px-2">الإجابة الصحيحة</th>
                <th className="py-3 px-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr key={`${rec.symbol.id}-${idx}`} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="py-3 px-2 tabular-nums font-medium">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <div
                      className="engineering-grid w-24 h-14 rounded-lg border flex items-center justify-center p-1"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <svg
                        viewBox="0 0 200 120"
                        className="symbol-svg"
                        aria-label={rec.symbol.name}
                        dangerouslySetInnerHTML={{ __html: rec.symbol.svg }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2">{rec.userAnswer.trim() || '—'}</td>
                  <td className="py-3 px-2 font-bold">{rec.symbol.name}</td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {rec.status === 'correct' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--ok-text)' }}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>صحيح</span>
                      </span>
                    )}
                    {rec.status === 'close' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--warn-text)' }}>
                        <AlertTriangle className="w-4 h-4" />
                        <span>قريب من الصحيح</span>
                      </span>
                    )}
                    {rec.status === 'skipped' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-muted)' }}>
                        <SkipForward className="w-4 h-4" />
                        <span>تم التخطي</span>
                      </span>
                    )}
                    {rec.status === 'wrong' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--err-text)' }}>
                        <XCircle className="w-4 h-4" />
                        <span>خطأ</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
};
