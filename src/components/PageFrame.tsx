import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Gauge,
  GraduationCap,
  Library,
  Ruler,
  BarChart3,
  Layers,
} from 'lucide-react';

export type AppSection = 'library' | 'units' | 'devices' | 'flashcards' | 'study' | 'stats';

interface PageFrameProps {
  title: string;
  subtitle?: string;
  active: AppSection;
  onNavigate: (section: AppSection) => void;
  onBackHome: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const NAV_ITEMS: { id: AppSection; label: string; icon: React.ReactNode }[] = [
  { id: 'library', label: 'مكتبة الرموز', icon: <Library className="w-4 h-4" /> },
  { id: 'units', label: 'الكميات والوحدات', icon: <Ruler className="w-4 h-4" /> },
  { id: 'devices', label: 'أجهزة القياس', icon: <Gauge className="w-4 h-4" /> },
  { id: 'study', label: 'وضع الدراسة', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'flashcards', label: 'بطاقات الحفظ', icon: <Layers className="w-4 h-4" /> },
  { id: 'stats', label: 'الإحصائيات', icon: <BarChart3 className="w-4 h-4" /> },
];

/** إطار موحّد للأقسام التعليمية: عنوان + تنقل بين الأقسام + الرجوع للرئيسية. */
export const PageFrame: React.FC<PageFrameProps> = ({
  title,
  subtitle,
  active,
  onNavigate,
  onBackHome,
  children,
  actions,
}) => {
  return (
    <main className="min-h-screen py-5 px-3 sm:px-6">
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <header
          className="rounded-2xl border p-4 sm:p-5 shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBackHome}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer rounded-lg px-2 py-1"
                style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>الصفحة الرئيسية</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 shrink-0" style={{ color: 'var(--primary)' }} />
                <span>{title}</span>
              </h1>
              {subtitle && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          <nav aria-label="أقسام المنصة" className="mt-4 flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-h-[40px] px-3 rounded-lg border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isActive ? '#ffffff' : 'var(--text-main)',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
};

/** حالة فراغ موحّدة. */
export const EmptyState: React.FC<{ title: string; hint?: string; icon?: React.ReactNode }> = ({
  title,
  hint,
  icon,
}) => (
  <div
    className="rounded-2xl border p-8 text-center space-y-2"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
  >
    <div className="flex justify-center" style={{ color: 'var(--text-muted)' }}>
      {icon ?? <Library className="w-8 h-8" />}
    </div>
    <p className="font-bold">{title}</p>
    {hint && (
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {hint}
      </p>
    )}
  </div>
);

/** شريحة عدّاد صغيرة. */
export const StatPill: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div
    className="rounded-xl border px-3 py-2 text-center"
    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
  >
    <div className="text-lg font-bold tabular-nums">{value}</div>
    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
      {label}
    </div>
  </div>
);
