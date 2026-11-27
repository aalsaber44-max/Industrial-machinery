import React from 'react';

interface SymbolSvgProps {
  /** محتوى <g> للرمز من قاعدة البيانات (SVG) */
  svg: string;
  label: string;
  className?: string;
  withGrid?: boolean;
}

/** عرض رمز كهربائي داخل شبكة هندسية مع وصف لقارئ الشاشة. */
export const SymbolSvg: React.FC<SymbolSvgProps> = ({ svg, label, className = '', withGrid = true }) => (
  <div
    className={`${withGrid ? 'engineering-grid' : ''} rounded-xl border flex items-center justify-center p-2 ${className}`}
    style={{ borderColor: 'var(--border-color)' }}
  >
    <svg
      viewBox="0 0 200 120"
      className="symbol-svg w-full"
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  </div>
);
