import React from 'react';
import { Volume2, VolumeX, Play, BookOpen, Zap, Layers } from 'lucide-react';
import type { QuizMode } from '../utils/quizLogic';

interface StartScreenProps {
  totalSymbols: number;
  selectedMode: QuizMode;
  onSelectMode: (mode: QuizMode) => void;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  totalSymbols,
  selectedMode,
  onSelectMode,
  muted,
  onToggleMute,
  onStart,
}) => {
  const quickCount = Math.min(20, totalSymbols);

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
      subtitle: 'يتيح التلميح بأول حرفين وإظهار الإجابة الصحيحة أثناء الحل.',
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
    },
  ];

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
          تعرّف على الرمز الهندسي الظاهر على شبكة الرسم واكتب اسمه الكهربائي بالعربية. يراعي المصحح الذكي الهمزات والتاء المربوطة و«ال» التعريف والمرادفات الشائعة.
        </p>

        <fieldset className="mb-7">
          <legend className="text-sm font-bold mb-3" style={{ color: 'var(--text-main)' }}>
            اختر وضع التشغيل
          </legend>
          <div className="grid grid-cols-1 gap-3">
            {modes.map((m) => {
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
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

        <button
          type="button"
          onClick={onStart}
          className="w-full min-h-[52px] rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Play className="w-5 h-5" />
          <span>ابدأ</span>
        </button>

        <div
          className="mt-5 pt-4 border-t text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <span>اضغط Enter للتحقق ثم Enter للانتقال للسؤال التالي</span>
          <span className="tabular-nums">إجمالي قاعدة البيانات: {totalSymbols}</span>
        </div>
      </section>
    </main>
  );
};
