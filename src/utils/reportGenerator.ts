import { formatDuration, getVerbalGrade, type AnswerRecord } from './quizLogic';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStatusLabel(status: AnswerRecord['status']): string {
  switch (status) {
    case 'correct':
      return 'صحيح';
    case 'close':
      return 'قريب من الصحيح';
    case 'skipped':
      return 'تم التخطي';
    default:
      return 'خطأ';
  }
}

/**
 * إنشاء ملف HTML مستقل للتقرير جاهز للطباعة والتحميل.
 */
export function buildHtmlReport(records: readonly AnswerRecord[], totalTimeSec: number): string {
  const total = records.length;
  const correctCount = records.filter((r) => r.status === 'correct').length;
  const skippedCount = records.filter((r) => r.status === 'skipped').length;
  const wrongCount = total - correctCount - skippedCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const grade = getVerbalGrade(percentage);
  const nowStr = new Date().toLocaleString('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const rowsHtml = records
    .map((rec, idx) => {
      const statusText = getStatusLabel(rec.status);
      const userAns = rec.userAnswer.trim() ? escapeHtml(rec.userAnswer) : '—';
      const badgeClass =
        rec.status === 'correct'
          ? 'st-ok'
          : rec.status === 'close'
            ? 'st-warn'
            : rec.status === 'skipped'
              ? 'st-skip'
              : 'st-err';

      return `
        <tr>
          <td>${idx + 1}</td>
          <td class="sym-cell">
            <svg viewBox="0 0 200 120" width="96" height="58" class="sym-mini">${rec.symbol.svg}</svg>
          </td>
          <td>${userAns}</td>
          <td><strong>${escapeHtml(rec.symbol.name)}</strong></td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
        </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تقرير اختبار الرموز الكهربائية</title>
<style>
  :root { --sym-stroke: #0f172a; --sym-muted: #94a3b8; --bg-card: #ffffff; }
  body { font-family: Tahoma, "Segoe UI", system-ui, sans-serif; margin: 24px; color: #0f172a; background: #f8fafc; line-height: 1.6; }
  .wrap { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 24px; }
  h1 { margin: 0 0 6px; font-size: 24px; color: #1e3a8a; }
  .meta { color: #475569; font-size: 14px; margin-bottom: 18px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 22px; }
  .box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
  .box b { display: block; font-size: 20px; color: #0f172a; }
  .box span { font-size: 13px; color: #475569; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; vertical-align: middle; }
  th { background: #1e3a8a; color: #fff; }
  .sym-cell { text-align: center; background: #fff; width: 112px; }
  .sym-mini { stroke: var(--sym-stroke); fill: none; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; display: inline-block; }
  .sym-mini text { direction: ltr; unicode-bidi: isolate; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; }
  .st-ok { background: #ecfdf5; color: #065f46; border: 1px solid #10b981; }
  .st-warn { background: #fff7ed; color: #9a3412; border: 1px solid #f97316; }
  .st-skip { background: #f1f5f9; color: #334155; border: 1px solid #94a3b8; }
  .st-err { background: #fef2f2; color: #991b1b; border: 1px solid #ef4444; }
  @media print { body { margin: 0; background: #fff; } .wrap { border: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <h1>تقرير نتائج اختبار الرموز الكهربائية</h1>
    <div class="meta">التاريخ والوقت: ${escapeHtml(nowStr)} — المدة الإجمالية: ${formatDuration(totalTimeSec)}</div>
    <div class="summary">
      <div class="box"><b>${percentage}%</b><span>النسبة المئوية (${grade})</span></div>
      <div class="box"><b>${correctCount} من ${total}</b><span>إجابات صحيحة</span></div>
      <div class="box"><b>${wrongCount}</b><span>إجابات خاطئة</span></div>
      <div class="box"><b>${skippedCount}</b><span>تم التخطي</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>الرمز</th>
          <th>إجابتك</th>
          <th>الإجابة الصحيحة</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

/**
 * إنشاء تقرير نصي (TXT) قابل للتحميل.
 */
export function buildTxtReport(records: readonly AnswerRecord[], totalTimeSec: number): string {
  const total = records.length;
  const correctCount = records.filter((r) => r.status === 'correct').length;
  const skippedCount = records.filter((r) => r.status === 'skipped').length;
  const wrongCount = total - correctCount - skippedCount;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const grade = getVerbalGrade(percentage);
  const nowStr = new Date().toLocaleString('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const lines: string[] = [
    '=== تقرير اختبار الرموز الكهربائية ===',
    `التاريخ والوقت: ${nowStr}`,
    `النتيجة: ${correctCount} من ${total} (${percentage}%) - التقدير: ${grade}`,
    `صحيح: ${correctCount} | خطأ: ${wrongCount} | متخطى: ${skippedCount}`,
    `المدة الإجمالية: ${formatDuration(totalTimeSec)}`,
    '----------------------------------------',
  ];

  records.forEach((rec, idx) => {
    const userAns = rec.userAnswer.trim() || 'بدون إجابة';
    lines.push(
      `${idx + 1}. الصحيح: ${rec.symbol.name} | إجابتك: ${userAns} | الحالة: ${getStatusLabel(rec.status)}`
    );
  });

  return lines.join('\n');
}

/**
 * تنزيل ملف عبر Blob ورابط تحميل مؤقت.
 */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
