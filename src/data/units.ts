/**
 * الكميات الكهربائية والوحدات ومضاعفاتها.
 * تُستخدم في: جدول الكميات والوحدات، أسئلة الوحدات، وأسئلة التحويل بين المضاعفات.
 * ملاحظة: حقل `device` يشير إلى الجهاز المرتبط بالكمية في المشروع (انظر src/data/devices.ts).
 */

export type QuantityFamily = 'أساسية' | 'مشتقة' | 'طاقة وقدرة' | 'تردد وزمن';

export interface ElectricalQuantity {
  /** اسم الكمية بالعربية كما في جدول الكتاب */
  name: string;
  /** رمز الكمية في المعادلات (V, I, R …) */
  symbol: string;
  /** اسم وحدة القياس */
  unit: string;
  /** رمز الوحدة (V, A, Ω …) */
  unitSymbol: string;
  /** مضاعفات الوحدة وأجزاؤها كما في جدول الكتاب (مثال: «كيلو فولت = KV») */
  multiples: string[];
  /** تعريف الكمية */
  definition: string;
  /** جهاز القياس المرتبط بها إذا كان معروفاً في المشروع */
  device?: string;
  /** تصنيف الكمية لتصفية الجدول */
  family: QuantityFamily;
}

/**
 * جدول الكميات والوحدات كما ورد في الكتاب (8 كميات فقط، بنفس الأسماء والرموز والوحدات).
 * لا تُضاف إليه كميات غير موجودة في الجدول الأصلي.
 */
export const QUANTITIES: ElectricalQuantity[] = [
  {
    name: 'الجهد',
    symbol: 'V',
    unit: 'فولت',
    unitSymbol: 'V',
    multiples: ['كيلو فولت = KV', 'ميلي فولت = mV'],
    definition: 'فرق الجهد الكهربائي بين نقطتين في الدائرة، وهو الذي يدفع الشحنة لتمر في الموصل.',
    device: 'الفولت ميتر',
    family: 'أساسية',
  },
  {
    name: 'التيار',
    symbol: 'I',
    unit: 'امبير',
    unitSymbol: 'A',
    multiples: ['ميلي امبير = mA', 'ميكرو امبير = Aμ'],
    definition: 'معدل مرور الشحنة الكهربائية في مقطع الموصل خلال وحدة الزمن.',
    device: 'الاميتر',
    family: 'أساسية',
  },
  {
    name: 'المقاومة',
    symbol: 'R',
    unit: 'أوم',
    unitSymbol: 'Ω',
    multiples: ['كيلو أوم = KΩ'],
    definition: 'معارضة المادة لمرور التيار الكهربائي فيها.',
    device: 'الاوميتر',
    family: 'أساسية',
  },
  {
    name: 'الشغل/الطاقة',
    symbol: 'W',
    unit: 'واط.ثانية',
    unitSymbol: 'KWH',
    multiples: ['واط.ساعة = WH', 'كيلوواط.ساعة = KWH'],
    definition: 'مقدار ما تستهلكه أو تنتجه الدائرة من قدرة خلال زمن. في فواتير الكهرباء تُقاس بالكيلو واط ساعة kWh.',
    device: 'العداد الكهربائي',
    family: 'طاقة وقدرة',
  },
  {
    name: 'القدرة الكهربائية',
    symbol: 'P',
    unit: 'واط/حصان',
    unitSymbol: 'W/Hp',
    multiples: ['واط = W', 'حصان = Hp'],
    definition: 'معدل استهلاك الطاقة أو إنتاجها في وحدة الزمن (P = V × I).',
    device: 'الواط ميتر',
    family: 'طاقة وقدرة',
  },
  {
    name: 'التردد',
    symbol: 'F',
    unit: 'هيرتز',
    unitSymbol: 'Hz',
    multiples: ['كيلوهيرتز = KHz', 'ميجاهيرتز = MHz'],
    definition: 'عدد الدورات الكاملة للموجة في الثانية الواحدة. تردد شبكة الكهرباء المنزلية 50 هرتز.',
    device: 'ساعة التردد',
    family: 'تردد وزمن',
  },
  {
    name: 'الزمن الدوري',
    symbol: 'T',
    unit: 'ثانية',
    unitSymbol: 'Sec',
    multiples: ['ميلي ثانية = msec'],
    definition: 'زمن دورة كاملة واحدة، وهو مقلوب التردد (T = 1 ÷ f).',
    device: 'راسم الاشارة',
    family: 'تردد وزمن',
  },
  {
    name: 'الملف',
    symbol: 'L',
    unit: 'هنري',
    unitSymbol: 'H',
    multiples: ['ميلي هنري = mH', 'ميكروهنري = μH'],
    definition: 'قدرة الملف على توليد قوة دافعة كهربائية معاكسة عند تغيّر التيار المار فيه.',
    device: 'جهاز (LCR)',
    family: 'مشتقة',
  },
];

/** بادئة (مضاعف) للوحدة: الرمز والأس العشري والقيمة. */
export interface Prefix {
  symbol: string;
  name: string;
  value: number;
  exponent: number;
}

export const PREFIXES: Prefix[] = [
  { symbol: '', name: 'بدون مضاعف', value: 1, exponent: 0 },
  { symbol: 'k', name: 'كيلو', value: 1e3, exponent: 3 },
  { symbol: 'M', name: 'ميغا', value: 1e6, exponent: 6 },
  { symbol: 'G', name: 'غيغا', value: 1e9, exponent: 9 },
  { symbol: 'm', name: 'ملي', value: 1e-3, exponent: -3 },
  { symbol: 'μ', name: 'ميكرو', value: 1e-6, exponent: -6 },
  { symbol: 'n', name: 'نانو', value: 1e-9, exponent: -9 },
  { symbol: 'p', name: 'بيكو', value: 1e-12, exponent: -12 },
];

/** وحدة أساسية قابلة للتحويل بين مضاعفاتها. */
export interface BaseUnit {
  symbol: string;
  name: string;
  /** رموز البادئات المسموحة لهذه الوحدة ('' تعني الوحدة نفسها) */
  allowedPrefixes: string[];
  /** الكمية المرتبطة (للعرض في واجهة التحويل) */
  quantity: string;
}

export const BASE_UNITS: BaseUnit[] = [
  { symbol: 'V', name: 'الفولت', allowedPrefixes: ['', 'm', 'k', 'M'], quantity: 'الجهد الكهربائي' },
  { symbol: 'A', name: 'الأمبير', allowedPrefixes: ['', 'm', 'μ', 'k'], quantity: 'شدة التيار' },
  { symbol: 'Ω', name: 'الأوم', allowedPrefixes: ['', 'm', 'k', 'M'], quantity: 'المقاومة' },
  { symbol: 'W', name: 'الواط', allowedPrefixes: ['', 'm', 'k', 'M'], quantity: 'القدرة' },
  { symbol: 'F', name: 'الفاراد', allowedPrefixes: ['', 'm', 'μ', 'n', 'p'], quantity: 'السعة' },
  { symbol: 'H', name: 'الهنري', allowedPrefixes: ['', 'm', 'μ'], quantity: 'الحث' },
  { symbol: 'Hz', name: 'الهيرتز', allowedPrefixes: ['', 'k', 'M', 'G'], quantity: 'التردد' },
  { symbol: 's', name: 'الثانية', allowedPrefixes: ['', 'm', 'μ', 'n'], quantity: 'الزمن' },
];

/** وصف نصي لمضاعف: 5 kΩ = 5000 Ω */
export function describePrefix(prefixSymbol: string): string {
  const prefix = PREFIXES.find((p) => p.symbol === prefixSymbol);
  if (!prefix) return '—';
  return prefix.symbol ? `${prefix.name} (${prefix.symbol})` : prefix.name;
}
