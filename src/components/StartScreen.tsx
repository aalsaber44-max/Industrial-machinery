import React, { useMemo } from 'react';
import { Volume2, VolumeX, Play, BookOpen, Zap, Layers, Library, Ruler, Gauge, SlidersHorizontal } from 'lucide-react';
import type { QuizMode } from '../utils/quizLogic';
import type { Difficulty, QuestionType, QuizConfig } from '../utils/questionTypes';
import { ALL_QUESTION_TYPES, DIFFICULTY_INFO, QUESTION_TYPE_INFO, countAvailable } from '../utils/questionEngine';

interface StartScreenProps {
  totalSymbols: number;
  preset: QuizMode;
  onSelectPreset: (mode: QuizMode) => void;
  config: QuizConfig;
  onChangeConfig: (config: QuizConfig) => void;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
  onOpenLibrary: () => void;
  onOpenUnits: () => void;
  onOpenDevices: () => void;
}

const COUNT_OPTIONS = [10, 20, 30, 50, 90];

export const StartScreen: React.FC<StartScreenProps> = ({
  totalSymbols,
  preset,
  onSelectPreset,
  config,
  onChangeConfig,
  muted,
  onToggleMute,
  onStart,
  onOpenLibrary,
  onOpenUnits,
  onOpenDevices,
}) => {
  const quickCount = Math.min(20, totalSymbols);
  const available = useMemo(() => countAvailable(config), [config.types, config.difficulty]);
  const effectiveCount = Math.min(config.count, available);

  const modes: { id: QuizMode; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'full',
      title: `اختبار كامل (${totalSymbols} رمزاً)`,
      subtitle: 'عرض جميع الرموز الكهربائية بترتيب عشوائي دون تكرار.',
      icon: <Layers className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'quick20',
      title: `اختبار سريع (${quickCount} سؤالاً)`,
      subtitle: 'جولة مركّزة من عشرين رمزاً عشوائياً للمراجعة السريعة.',
      icon: <Zap className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'practice',
      title: 'وضع التدريب',
      subtitle: 'يتيح التلميح وإظهار الإجابة الصحيحة أثناء الحل (الإجابة المكشوفة لا تُحتسب).',
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'custom',
      title: 'امتحان مخصص',
      subtitle: 'اختر أنواع الأسئلة والمستوى والعدد: رموز، وحدات، تحويلات، أجهزة قياس.',
      icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
    },
  ];

  const toggleType = (type: QuestionType) => {
    const has = config.types.includes(type);
    const types = has ? config.types.filter((t) => t !== type) : [...config.types, type];
    onChangeConfig({ ...config, types });
  };

  const segmentStyle = (active: boolean): React.CSSProperties => ({
    borderColor: active ? 'var(--primary)' : 'var(--border-color)',
    backgroundColor: active ? 'var(--primary)' : 'var(--bg-subtle)',
    color: active ? '#ffffff' : 'var(--text-main)',
  });

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <section
        className="w-full max-w-2xl rounded-2xl border p-6 sm:p-8 shadow-sm fade-slide-enter"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              المنهج الكهربائي · {totalSymbols} رمزاً هندسياً
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ textWrap: 'balance' }}>
              منصة اختبار الرموز الكهربائية
            </h1>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
            title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className="min-h-[48px] min-w-[48px] px-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
            }}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="hidden sm:inline whitespace-nowrap">{muted ? 'صامت' : 'الصوت'}</span>
          </button>
        </div>

        <p className="text-base mb-6" style={{ color: 'var(--text-muted)' }}>
          تعرّف على الرموز الكهربائية والوحدات وأجهزة القياس بأنواع أسئلة متعددة. يراعي المصحح الذكي الهمزات والتاء المربوطة و«ال» التعريف والمرادفات الشائعة.
        </p>

        <fieldset className="mb-6">
          <legend className="text-sm font-bold mb-3" style={{ color: 'var(--text-main)' }}>
            اختر وضع التشغيل
          </legend>
          <div className="grid grid-cols-1 gap-3">
            {modes.map((m) => {
              const active = preset === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectPreset(m.id)}
                  aria-pressed={active}
                  className="w-full min-h-[60px] text-right rounded-xl border p-4 flex items-center gap-3.5 transition-colors cursor-pointer"
                  style={{
                    borderColor: active ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: active ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: active ? 'var(--primary)' : 'var(--bg-card)',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    {m.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-base">{m.title}</span>
                    <span className="block text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {m.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* تخصيص الامتحان */}
        <section
          className="mb-6 rounded-xl border p-4 space-y-5"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
          aria-label="تخصيص الامتحان"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold">أنواع الأسئلة</h2>
              <div className="flex gap-2 text-xs font-semibold">
                <button type="button" className="underline cursor-pointer" onClick={() => onChangeConfig({ ...config, types: [...ALL_QUESTION_TYPES] })}>
                  تحديد الكل
                </button>
                <button type="button" className="underline cursor-pointer" onClick={() => onChangeConfig({ ...config, types: ['symbol-text'] })}>
                  كتابة الاسم فقط
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUESTION_TYPE_INFO.map((t) => {
                const checked = config.types.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="min-h-[52px] rounded-lg border p-2.5 flex items-start gap-2.5 cursor-pointer"
                    style={{
                      borderColor: checked ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: checked ? 'var(--primary-soft)' : 'var(--bg-card)',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleType(t.id)} className="mt-1 w-4 h-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-bold">{t.title}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-2">مستوى الصعوبة</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="مستوى الصعوبة">
              {DIFFICULTY_INFO.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={config.difficulty === d.id}
                  onClick={() => onChangeConfig({ ...config, difficulty: d.id as Difficulty })}
                  className="min-h-[44px] px-4 rounded-lg border text-sm font-semibold cursor-pointer"
                  style={segmentStyle(config.difficulty === d.id)}
                >
                  {d.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-2">عدد الأسئلة</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="عدد الأسئلة">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={config.count === n}
                  onClick={() => onChangeConfig({ ...config, count: n })}
                  className="min-h-[44px] min-w-[52px] px-4 rounded-lg border text-sm font-semibold tabular-nums cursor-pointer"
                  style={segmentStyle(config.count === n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2 tabular-nums" style={{ color: 'var(--text-muted)' }} aria-live="polite">
              {available === 0
                ? 'لا توجد أسئلة متاحة بهذا الإعداد، اختر نوعاً أو مستوى آخر.'
                : effectiveCount < config.count
                  ? `المتاح بهذا الإعداد ${available} سؤالاً فقط، وسيتضمن الامتحان ${effectiveCount} سؤالاً.`
                  : `سيتضمن الامتحان ${effectiveCount} سؤالاً.`}
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.practice}
              onChange={(e) => onChangeConfig({ ...config, practice: e.target.checked })}
              className="mt-1 w-4 h-4 shrink-0"
            />
            <span>
              <span className="block text-sm font-bold">وضع التدريب</span>
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                تلميح وإظهار الإجابة أثناء الحل. الإجابة المكشوفة لا تُحتسب نقطة.
              </span>
            </span>
          </label>
        </section>

        <button
          type="button"
          onClick={onStart}
          disabled={config.types.length === 0 || available === 0}
          className="w-full min-h-[52px] rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Play className="w-5 h-5" />
          <span>ابدأ</span>
        </button>
        {config.types.length === 0 && (
          <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--err-text)' }} role="alert">
            اختر نوع أسئلة واحداً على الأقل.
          </p>
        )}

        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold mb-3">أقسام تعليمية للمراجعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'مكتبة الرموز', icon: <Library className="w-5 h-5" />, onClick: onOpenLibrary },
              { title: 'الكميات والوحدات', icon: <Ruler className="w-5 h-5" />, onClick: onOpenUnits },
              { title: 'أجهزة القياس', icon: <Gauge className="w-5 h-5" />, onClick: onOpenDevices },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[56px] rounded-xl border px-4 flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)' }}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className="mt-5 pt-4 border-t text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <span>اضغط Enter للتحقق ثم Enter للانتقال للسؤال التالي</span>
          <span className="tabular-nums">إجمالي قاعدة الرموز: {totalSymbols}</span>
        </div>
      </section>
    </main>
  );
};
