/** أنواع بيانات الأسئلة المشتركة (أنواع فقط، بدون منطق). */

export type QuestionType =
  | 'symbol-choice'
  | 'name-to-symbol'
  | 'symbol-text'
  | 'symbol-function'
  | 'true-false'
  | 'fill-blank'
  | 'units'
  | 'conversion'
  | 'devices';

export type Level = 'easy' | 'medium' | 'hard';
export type Difficulty = Level | 'mixed';

export interface ChoiceOption {
  id: string;
  /** نص الخيار (ويُستخدم أيضاً في المراجعة عندما يكون الخيار رسماً) */
  text: string;
  /** رسم SVG للخيار (لأسئلة «اختر الرمز») */
  svg?: string;
}

export type TextChecker =
  | { mode: 'symbol-name'; symbolId: number }
  | { mode: 'words'; accepted: string[] }
  | { mode: 'number'; expected: number };

export interface QuestionBase {
  id: string;
  type: QuestionType;
  level: Level;
  /** نص السؤال */
  prompt: string;
  /** نص إضافي كبير (مثل الاسم الناقص في «أكمل الفراغ») */
  stem?: string;
  /** رمز يُعرض مع السؤال */
  symbolId?: number;
  /** رمز يُعرض في المراجعة والتقارير */
  reviewSymbolId?: number;
  /** موضوع السؤال (فئة الرمز، الوحدات، أجهزة القياس…) */
  topic: string;
  /** الإجابة الصحيحة بصيغة مقروءة */
  correctText: string;
  /** شرح الإجابة */
  explanation: string;
  /** تلميح اختياري لوضع التدريب */
  hint?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: ChoiceOption[];
  correctId: string;
}

export interface TextQuestion extends QuestionBase {
  kind: 'text';
  checker: TextChecker;
  placeholder: string;
  /** اتجاه حقل الإدخال */
  inputDir: 'rtl' | 'ltr';
}

export type Question = ChoiceQuestion | TextQuestion;

export interface QuizConfig {
  types: QuestionType[];
  difficulty: Difficulty;
  count: number;
  practice: boolean;
}
