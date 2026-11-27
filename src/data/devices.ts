/**
 * أجهزة القياس الكهربائية — قسم دراسي مستقل.
 *
 * المصدر: المعلومات الواردة هنا مبنية على أسئلة أجهزة القياس الموجودة أصلاً في المشروع
 * (src/utils/questionEngine.ts: DEVICE_TF و AUTHORED_DEVICES) وعلى أساسيات دوائر القياس
 * في منهج الكهرباء. لا تُعدّ هذه البيانات جزءاً من قاعدة رموز الكتاب (symbols.ts)،
 * وقد وُضعت لها ملاحظة توضيحية في الواجهة.
 *
 * الرسوم التوضيحية (svg) مرسومة برمجياً للتوضيح فقط، وليست صوراً من الكتاب.
 */

export interface MeasuringDevice {
  id: string;
  name: string;
  englishName: string;
  /** الكمية التي يقيسها */
  quantity: string;
  quantitySymbol: string;
  unit: string;
  unitSymbol: string;
  /** طريقة التوصيل في الدائرة */
  connection: string;
  /** خطوات الاستخدام التعليمية */
  usage: string[];
  /** ملاحظات مهمة */
  notes: string[];
  /** رمز الجهاز في قاعدة الرموز الأصلية إن وُجد */
  symbolId?: number;
  /** رسم توضيحي */
  svg: string;
}

function svgText(x: number, y: number, text: string, size = 16): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" direction="ltr" unicode-bidi="isolate" fill="var(--sym-stroke)" stroke="none" font-family="Tahoma, 'Segoe UI', system-ui, sans-serif" font-size="${size}" font-weight="700">${text}</text>`;
}

/** رسم جهاز قياس عام: إطار + تدريج قوسي + مؤشر + طرفا توصيل. */
function meterSvg(label: string, sub: string): string {
  return [
    `<rect x="42" y="14" width="116" height="74" rx="10"/>`,
    `<path d="M 68 70 A 32 32 0 0 1 132 70" stroke-width="3"/>`,
    `<path d="M 100 70 L 114 44" stroke-width="3.2"/>`,
    `<circle cx="100" cy="70" r="4" fill="var(--sym-stroke)" stroke="none"/>`,
    `<path d="M 62 88 L 52 104 M 138 88 L 148 104"/>`,
    `<circle cx="52" cy="106" r="4" fill="var(--sym-stroke)" stroke="none"/>`,
    `<circle cx="148" cy="106" r="4" fill="var(--sym-stroke)" stroke="none"/>`,
    svgText(100, 34, label, 18),
    svgText(100, 108, sub, 12),
  ].join('');
}

export const MEASURING_DEVICES: MeasuringDevice[] = [
  {
    id: 'voltmeter',
    name: 'الفولتميتر (مقياس الجهد)',
    englishName: 'Voltmeter',
    quantity: 'الجهد الكهربائي',
    quantitySymbol: 'V',
    unit: 'الفولت',
    unitSymbol: 'V',
    connection: 'على التوازي مع العنصر المراد قياس الجهد بين طرفيه',
    usage: [
      'اضبط المفتاح على وضع قياس الجهد (V) ونوعه: متردد AC أو مستمر DC.',
      'اختر المدى الأعلى من الجهد المتوقع ثم اخفضه تدريجياً للحصول على دقة أفضل.',
      'صِل طرفي الجهاز بين النقطتين المراد قياس فرق الجهد بينهما (توازٍ مع الحمل).',
      'اقرأ القيمة على الشاشة أو التدريج، وتذكّر أن القراءة تخص فرق الجهد بين نقطتي التوصيل فقط.',
    ],
    notes: [
      'المقاومة الداخلية للفولتميتر عالية جداً حتى لا يسحب تياراً يؤثر في الدائرة المقاسة.',
      'توصيله على التوالي خطأ شائع قد يقطع التيار أو يعطي قراءة غير صحيحة.',
    ],
    symbolId: 16,
    svg: meterSvg('V', 'Voltmeter'),
  },
  {
    id: 'ammeter',
    name: 'الأميتر (مقياس التيار)',
    englishName: 'Ammeter',
    quantity: 'شدة التيار الكهربائي',
    quantitySymbol: 'I',
    unit: 'الأمبير',
    unitSymbol: 'A',
    connection: 'على التوالي مع الحمل',
    usage: [
      'افصل التغذية قبل توصيل الأميتر احتياطاً للسلامة.',
      'اضبط المفتاح على وضع قياس التيار ونوعه AC أو DC.',
      'افتح الدائرة عند النقطة المراد قياس التيار فيها وأدخل الأميتر على التوالي.',
      'أعد التغذية واقرأ قيمة التيار، ثم أعد الدائرة إلى حالتها الأصلية.',
    ],
    notes: [
      'المقاومة الداخلية للأميتر صغيرة جداً حتى لا تؤثر في قيمة التيار.',
      'توصيله على التوازي مع المصدر يشبه قصر الدائرة وقد يتلفه.',
    ],
    symbolId: 17,
    svg: meterSvg('A', 'Ammeter'),
  },
  {
    id: 'ohmmeter',
    name: 'الأوميتر (مقياس المقاومة)',
    englishName: 'Ohmmeter',
    quantity: 'المقاومة الكهربائية',
    quantitySymbol: 'R',
    unit: 'الأوم',
    unitSymbol: 'Ω',
    connection: 'على طرفي العنصر بعد فصل التغذية',
    usage: [
      'افصل العنصر عن الدائرة أو اقطع التغذية تماماً.',
      'اضبط الجهاز على وضع قياس المقاومة (Ω).',
      'صِل طرفي الأوميتر بطرفي العنصر دون أن تلمس المعدنين بيديك.',
      'اقرأ القيمة وتأكد من وحدة العرض (Ω أو kΩ أو MΩ).',
    ],
    notes: [
      'يوفّر الأوميتر تياره الخاص، لذلك لا يُستعمل أبداً على دائرة تحت الجهد تدريجياً.',
      'قياس المقاومة على دائرة موصولة بالتغذية يعطي قراءة خاطئة وقد يتلف الجهاز.',
    ],
    symbolId: 18,
    svg: meterSvg('Ω', 'Ohmmeter'),
  },
  {
    id: 'multimeter',
    name: 'الجهاز المتعدد (Multimeter)',
    englishName: 'Multimeter / AVO meter',
    quantity: 'الجهد والتيار والمقاومة',
    quantitySymbol: 'V / I / R',
    unit: 'حسب الوضع المختار',
    unitSymbol: 'V · A · Ω',
    connection: 'حسب وضع القياس: توازٍ للجهد، توالٍ للتيار، على طرفي العنصر للمقاومة',
    usage: [
      'حدّد الكمية المراد قياسها ثم اختر الوضع المناسب على القرص.',
      'أدخل المجسّين في المنفذين الصحيحين (COM والمجسّ المخصص).',
      'اختر المدى (أو الوضع التلقائي Auto Range) وصِل المجسّين حسب طريقة التوصيل.',
      'اقرأ القيمة، ثم أعد القرص إلى وضع الجهد بعد الانتهاء.',
    ],
    notes: [
      'الجهاز المتعدد يجمع قياس الجهد والتيار والمقاومة، وغالباً فحص الاستمرارية والدايود.',
      'خطأ شائع: نسيان القرص على وضع التيار ثم قياس الجهد — وقد يؤدي ذلك إلى تلف الفيوز الداخلي.',
    ],
    svg: meterSvg('AVO', 'Multimeter'),
  },
  {
    id: 'clamp-meter',
    name: 'ملقط التيار (Clamp Meter)',
    englishName: 'Clamp meter',
    quantity: 'شدة التيار الكهربائي',
    quantitySymbol: 'I',
    unit: 'الأمبير',
    unitSymbol: 'A',
    connection: 'إحاطة موصل واحد فقط بالفكّ، دون قطع الدائرة',
    usage: [
      'اضبط الجهاز على وضع قياس التيار المتردد AC.',
      'افتح الفكّ وأحط به موصلاً واحداً فقط (الفاز مثلاً).',
      'أغلق الفكّ جيداً واقرأ التيار على الشاشة.',
      'لتحديد اتجاه أو توازن الأحمال، قِس كل موصل على حدة.',
    ],
    notes: [
      'لا يحتاج إلى قطع الدائرة، لذلك يُستخدم في لوحات التوزيع والقواطع.',
      'إحاطة الفاز والنتر معاً تعطي قراءة قريبة من الصفر لأن تياريها متساويان متعاكسان.',
    ],
    svg: meterSvg('A~', 'Clamp'),
  },
  {
    id: 'lcr-meter',
    name: 'مقياس LCR',
    englishName: 'LCR meter',
    quantity: 'الحث والسعة والمقاومة',
    quantitySymbol: 'L / C / R',
    unit: 'هنري · فاراد · أوم',
    unitSymbol: 'H · F · Ω',
    connection: 'على طرفي العنصر بعد نزعه من الدائرة (أو فصل التغذية)',
    usage: [
      'اختر الوضع: L للحث، أو C للسعة، أو R للمقاومة.',
      'انزع العنصر من الدائرة أو افصل التغذية وتأكد من تفريغ المكثف.',
      'صِل طرفي العنصر بالمشابك واقرأ القيمة.',
      'قارن القيمة بالمدوّن على العنصر للتحقق من سلامته.',
    ],
    notes: [
      'الحروف L و C و R ترمز إلى الحث والسعة والمقاومة.',
      'يجب تفريغ المكثفات الكبيرة قبل القياس لتجنب قراءة خاطئة أو تلف الجهاز.',
    ],
    svg: meterSvg('LCR', 'LCR meter'),
  },
  {
    id: 'energy-meter',
    name: 'عداد الطاقة (Kilowatt-hour meter)',
    englishName: 'Energy meter',
    quantity: 'الطاقة / الشغل',
    quantitySymbol: 'E',
    unit: 'الكيلو واط ساعة',
    unitSymbol: 'kWh',
    connection: 'يُركّب على مدخل التغذية، ويمر تيار الحمل كله من خلاله',
    usage: [
      'يُركّب العداد عند مدخل التغذية الرئيسي للوحدة السكنية أو المنشأة.',
      'يمر التيار في ملفاته ويُسجّل الاستهلاك التراكمي.',
      'تُقرأ الأرقام دورياً، والفرق بين قراءتين هو الاستهلاك في تلك الفترة.',
      'يُضرب الفرق في سعر الكيلو واط ساعة لحساب قيمة الفاتورة.',
    ],
    notes: [
      'kWh وحدة طاقة وليست وحدة قدرة؛ الواط والكيلو واط وحدتا قدرة.',
      'لا يُستخدم العداد لقياس تيار لحظي؛ لذلك يُستعمل ملقط التيار عند الحاجة.',
    ],
    symbolId: 52,
    svg: meterSvg('kWh', 'Energy meter'),
  },
  {
    id: 'frequency-meter',
    name: 'مقياس التردد',
    englishName: 'Frequency meter',
    quantity: 'التردد',
    quantitySymbol: 'f',
    unit: 'الهيرتز',
    unitSymbol: 'Hz',
    connection: 'على التوازي بين الفاز والنتر (قياس جهد التغذية)',
    usage: [
      'اضبط الجهاز على وضع قياس التردد (Hz).',
      'صِل المجسّين بين الفاز والنتر.',
      'اقرأ التردد وتأكد أنه 50 هرتز في الشبكة الأردنية.',
      'استخدمه للتحقق من عمل المولدات وضبط سرعتها.',
    ],
    notes: [
      'تردد الشبكة المنزلية في الأردن 50 هرتز.',
      'الزمن الدوري هو مقلوب التردد: عند 50 هرتز يكون الزمن الدوري 0.02 ثانية.',
    ],
    svg: meterSvg('Hz', 'Frequency'),
  },
];

export function getDeviceById(id: string): MeasuringDevice | undefined {
  return MEASURING_DEVICES.find((d) => d.id === id);
}

export function getDeviceForQuantity(quantityName: string): MeasuringDevice | undefined {
  return MEASURING_DEVICES.find((d) => d.quantity === quantityName);
}
