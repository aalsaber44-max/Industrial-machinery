import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gauge, Info, ListOrdered, AlertTriangle } from 'lucide-react';
import { PageFrame, EmptyState, type AppSection } from './PageFrame';
import { SymbolSvg } from './SymbolSvg';
import { MEASURING_DEVICES } from '../data/devices';
import { SYMBOLS } from '../data/symbols';

interface DevicesScreenProps {
  onBack: () => void;
  onNavigate: (section: AppSection) => void;
}

/** أجهزة القياس الكهربائية: الكمية، الوحدة، طريقة الاستخدام، وملاحظات مهمة. */
export const DevicesScreen: React.FC<DevicesScreenProps> = ({ onBack, onNavigate }) => {
  const [openIds, setOpenIds] = useState<string[]>(() => MEASURING_DEVICES.slice(0, 1).map((d) => d.id));

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <PageFrame
      title="أجهزة القياس الكهربائية"
      subtitle="لكل جهاز: الكمية التي يقيسها، وحدتها، طريقة التوصيل، وخطوات الاستخدام التعليمية."
      active="devices"
      onNavigate={onNavigate}
      onBackHome={onBack}
    >
      <p
        className="rounded-xl border p-3 text-[12px] leading-relaxed flex items-start gap-2"
        style={{ borderColor: 'var(--warn-border)', backgroundColor: 'var(--warn-bg)', color: 'var(--warn-text)' }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          هذا قسم تكميلي مبني على أسئلة أجهزة القياس الموجودة أصلاً في المشروع وعلى أساسيات قياسات الكهرباء؛
          وليس جزءاً من قاعدة رموز الكتاب. رموز الأجهزة (V، A، Ω، عداد الطاقة) تأتي من قاعدة البيانات الأصلية.
        </span>
      </p>

      {MEASURING_DEVICES.length === 0 ? (
        <EmptyState title="لا توجد أجهزة" hint="لم تُضف أجهزة قياس بعد." icon={<Gauge className="w-8 h-8" />} />
      ) : (
        <ul className="space-y-3">
          {MEASURING_DEVICES.map((device) => {
            const open = openIds.includes(device.id);
            const symbol = device.symbolId ? SYMBOLS.find((s) => s.id === device.symbolId) : undefined;
            return (
              <li
                key={device.id}
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-48 shrink-0 space-y-2">
                    <SymbolSvg svg={device.svg} label={device.name} className="w-full h-28" />
                    {symbol && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <SymbolSvg svg={symbol.svg} label={`رمز ${device.name}`} className="w-14 h-10 shrink-0" />
                        <span>رمز الجهاز في قاعدة الرموز: #{symbol.id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold" dir="auto">
                      {device.name}
                    </h2>
                    <p className="text-xs font-semibold mt-0.5" dir="ltr" style={{ color: 'var(--text-muted)' }}>
                      {device.englishName}
                    </p>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <Chip label="الكمية" value={device.quantity} />
                      <Chip label="الوحدة" value={`${device.unit} (${device.unitSymbol})`} />
                      <div className="col-span-2">
                        <Chip label="طريقة التوصيل" value={device.connection} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggle(device.id)}
                      aria-expanded={open}
                      className="mt-3 min-h-[40px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
                    >
                      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>{open ? 'إخفاء طريقة الاستخدام والملاحظات' : 'عرض طريقة الاستخدام والملاحظات'}</span>
                    </button>
                  </div>
                </div>

                {open && (
                  <div
                    className="border-t p-4 grid grid-cols-1 md:grid-cols-2 gap-3 fade-slide-enter"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <div>
                      <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                        <ListOrdered className="w-4 h-4" />
                        طريقة الاستخدام
                      </h3>
                      <ol className="space-y-1.5 text-sm list-decimal pe-5">
                        {device.usage.map((step) => (
                          <li key={step} dir="auto">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--warn-text)' }}>
                        <AlertTriangle className="w-4 h-4" />
                        ملاحظات مهمة
                      </h3>
                      <ul className="space-y-1.5 text-sm list-disc pe-5">
                        {device.notes.map((note) => (
                          <li key={note} dir="auto">
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PageFrame>
  );
};

const Chip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="rounded-lg border px-2.5 py-1.5"
    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
  >
    <span className="block text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
      {label}
    </span>
    <span className="block font-semibold" dir="auto">
      {value}
    </span>
  </div>
);
