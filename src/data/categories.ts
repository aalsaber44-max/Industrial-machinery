/**
 * تصنيف رموز قاعدة البيانات الأصلية (90 رمزاً) إلى فئات دراسية.
 * الأسماء والرسوم تبقى كما هي في src/data/symbols.ts — هذا الملف يضيف التصنيف فقط،
 * وكل رمز ينتمي إلى فئة واحدة بالضبط (يتحقق منه اختبار المشروع).
 */

export type CategoryIcon =
  | 'zap'
  | 'cable'
  | 'lamp'
  | 'motor'
  | 'shield'
  | 'switch'
  | 'component'
  | 'gauge'
  | 'home'
  | 'alarm';

export interface SymbolCategory {
  id: string;
  title: string;
  description: string;
  icon: CategoryIcon;
  ids: number[];
}

export const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    id: 'sources',
    title: 'المصادر وخطوط التغذية',
    description: 'مصادر الطاقة، وموصلات التغذية (فاز، نتر، أرضي)، ولوحات التوزيع.',
    icon: 'zap',
    ids: [1, 2, 3, 6, 7, 8, 9, 30, 32, 60, 85, 88],
  },
  {
    id: 'wiring',
    title: 'الموصلات والتوصيلات',
    description: 'أنواع الوصلات والتمديدات: ثابتة، قابلة للفك، مخفية أو ظاهرة.',
    icon: 'cable',
    ids: [21, 22, 23, 24, 28, 87, 89],
  },
  {
    id: 'lighting',
    title: 'الإنارة',
    description: 'المصابيح والنيون والكشافات ونقاط الإنارة وملحقاتها.',
    icon: 'lamp',
    ids: [5, 10, 39, 40, 42, 44, 45, 48, 55, 57, 74],
  },
  {
    id: 'machines',
    title: 'المحركات والمولدات والمحولات',
    description: 'آلات تحويل الطاقة: محركات أحادية وثلاثية الطور، مولدات، ومحولات.',
    icon: 'motor',
    ids: [11, 12, 13, 14, 15],
  },
  {
    id: 'protection',
    title: 'القواطع والحماية',
    description: 'الفيوز والقواطع الحرارية والمغناطيسية والتفاضلية وحماية التسرب الأرضي.',
    icon: 'shield',
    ids: [38, 43, 49, 51, 53, 54, 56, 58],
  },
  {
    id: 'switches',
    title: 'المفاتيح والأزرار والمآخذ',
    description: 'مفاتيح الإنارة بأنواعها، الضواغط، ومآخذ (إيريز) التيار.',
    icon: 'switch',
    ids: [25, 59, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 80, 81, 82],
  },
  {
    id: 'components',
    title: 'عناصر الدوائر',
    description: 'المقاومة والمكثف والملف والعاكس ومبين الأرقام.',
    icon: 'component',
    ids: [19, 20, 41, 46, 47],
  },
  {
    id: 'meters',
    title: 'أجهزة القياس',
    description: 'رموز أجهزة القياس: الفولتميتر، الأميتر، الأوميتر، وعداد الطاقة.',
    icon: 'gauge',
    ids: [16, 17, 18, 52],
  },
  {
    id: 'appliances',
    title: 'الأجهزة والأحمال المنزلية',
    description: 'الثلاجة، المدفأة، الفرن، المروحة، السخان، الجرس، والاتصال الداخلي.',
    icon: 'home',
    ids: [4, 26, 27, 29, 36, 83, 86, 90],
  },
  {
    id: 'alarm',
    title: 'الإنذار والتحكم',
    description: 'كواشف الحرارة والدخان، لوحات إنذار الحريق، والمؤقتات الزمنية.',
    icon: 'alarm',
    ids: [31, 33, 34, 35, 37, 50, 84],
  },
];

const CATEGORY_BY_SYMBOL_ID = new Map<number, SymbolCategory>();
for (const category of SYMBOL_CATEGORIES) {
  for (const id of category.ids) {
    if (!CATEGORY_BY_SYMBOL_ID.has(id)) CATEGORY_BY_SYMBOL_ID.set(id, category);
  }
}

/** فئة الرمز، أو undefined إذا لم يُصنَّف. */
export function getCategoryOfSymbol(symbolId: number): SymbolCategory | undefined {
  return CATEGORY_BY_SYMBOL_ID.get(symbolId);
}

/** فئة بحسب معرّفها النصي. */
export function getCategoryById(categoryId: string): SymbolCategory | undefined {
  return SYMBOL_CATEGORIES.find((c) => c.id === categoryId);
}

/** عدد الرموز داخل فئة. */
export function getCategorySymbolCount(categoryId: string): number {
  return getCategoryById(categoryId)?.ids.length ?? 0;
}
