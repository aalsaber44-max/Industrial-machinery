import { SYMBOLS, type ElectricalSymbol } from '../data/symbols';
import { SYMBOL_CATEGORIES, getCategoryOfSymbol, type SymbolCategory } from '../data/categories';
import { SYMBOL_FUNCTIONS } from '../data/functions';
import { SYMBOL_LIBRARY } from '../data/library';
import { normalize } from './quizLogic';

/** نموذج عرض موحّد للرمز يجمع قاعدة البيانات الأصلية مع الإضافات التعليمية. */
export interface LibraryEntry {
  id: number;
  name: string;
  aliases: string[];
  svg: string;
  englishName?: string;
  categoryId: string;
  categoryTitle: string;
  /** وظيفة الرمز من src/data/functions.ts إن وُجدت */
  functionText?: string;
  /** استخدام عملي (إضافة تعليمية) */
  usage: string;
  /** ملاحظة للحفظ (إضافة تعليمية) */
  note: string;
  /** هل توجد إضافات تعليمية لهذا الرمز؟ */
  hasExtras: boolean;
}

const FALLBACK_CATEGORY = {
  id: 'other',
  title: 'رموز أخرى',
} as const;

function buildEntry(symbol: ElectricalSymbol): LibraryEntry {
  const category = getCategoryOfSymbol(symbol.id);
  const extras = SYMBOL_LIBRARY[symbol.id];
  const fn = SYMBOL_FUNCTIONS[symbol.id];
  return {
    id: symbol.id,
    name: symbol.name,
    aliases: symbol.aliases,
    svg: symbol.svg,
    englishName: extras?.englishName,
    categoryId: category?.id ?? FALLBACK_CATEGORY.id,
    categoryTitle: category?.title ?? FALLBACK_CATEGORY.title,
    functionText: fn?.text,
    usage: extras?.usage ?? 'لم تُضف ملاحظة استخدام لهذا الرمز بعد.',
    note: extras?.note ?? 'لم تُضف ملاحظة حفظ لهذا الرمز بعد.',
    hasExtras: Boolean(extras),
  };
}

/** كل الرموز الأصلية (90) بترتيب قاعدة البيانات، دون حذف أو تعديل أي رمز. */
export const LIBRARY_ENTRIES: LibraryEntry[] = SYMBOLS.map(buildEntry);

const ENTRY_BY_ID = new Map<number, LibraryEntry>(LIBRARY_ENTRIES.map((e) => [e.id, e]));

export function getLibraryEntry(id: number): LibraryEntry | undefined {
  return ENTRY_BY_ID.get(id);
}

export interface LibraryCategorySummary {
  id: string;
  title: string;
  description: string;
  icon: SymbolCategory['icon'];
  count: number;
}

export const LIBRARY_CATEGORY_SUMMARIES: LibraryCategorySummary[] = SYMBOL_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  icon: c.icon,
  count: c.ids.length,
}));

/** بحث في الاسم والاسم الإنجليزي والأسماء البديلة والوظيفة. */
export function matchesLibraryQuery(entry: LibraryEntry, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [entry.name, entry.englishName ?? '', ...entry.aliases, entry.functionText ?? '', entry.usage]
    .map((v) => normalize(v))
    .join(' | ');
  return haystack.includes(q);
}

export interface LibraryFilter {
  query?: string;
  categoryId?: string;
}

export function filterLibrary(entries: readonly LibraryEntry[], filter: LibraryFilter): LibraryEntry[] {
  const categoryId = filter.categoryId && filter.categoryId !== 'all' ? filter.categoryId : undefined;
  const query = filter.query?.trim() ?? '';
  return entries.filter((e) => (!categoryId || e.categoryId === categoryId) && matchesLibraryQuery(e, query));
}

/** أسماء إنجليزية ظاهرة داخل الاسم الأصلي (AC، DC، TV/Te …) عند عدم وجود إضافة. */
export function latinTokensInName(name: string): string[] {
  return name.match(/[A-Za-z][A-Za-z/.]*/g) ?? [];
}

/** الرمز التالي/السابق داخل قائمة معيّنة (للتنقل بين الرموز). */
export function neighbourEntry(
  entries: readonly LibraryEntry[],
  currentId: number,
  direction: 1 | -1
): LibraryEntry | undefined {
  if (entries.length === 0) return undefined;
  const index = entries.findIndex((e) => e.id === currentId);
  if (index === -1) return entries[0];
  const nextIndex = (index + direction + entries.length) % entries.length;
  return entries[nextIndex];
}
