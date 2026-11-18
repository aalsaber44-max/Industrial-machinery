/**
 * قاعدة بيانات الرموز الكهربائية (90 رمزاً) مطابقة لصور صفحات الكتاب (94–97).
 * جميع الإحداثيات مصممة لـ viewBox="0 0 200 120" بسماكة خط 4.
 */

export interface ElectricalSymbol {
  id: number;
  name: string;
  aliases: string[];
  svg: string;
}

/** رسم نقطة طرفية ممتلئة صغيرة */
function dot(cx: number, cy: number, r = 4): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--sym-stroke)" stroke="none"/>`;
}

/** رسم خطي أطراف أفقيين يميناً ويساراً مع نقاط طرفية اختيارية */
function leadDots(leftOuter: number, leftInner: number, rightInner: number, rightOuter: number, y = 60, withDots = true): string {
  const lines = `<path d="M ${leftOuter} ${y} L ${leftInner} ${y} M ${rightInner} ${y} L ${rightOuter} ${y}"/>`;
  if (!withDots) return lines;
  return lines + dot(leftOuter, y) + dot(rightOuter, y);
}

/** رسم نص SVG متمركز داخل الرمز */
function svgText(x: number, y: number, text: string, size = 16, weight = 700): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" direction="ltr" unicode-bidi="isolate" fill="var(--sym-stroke)" stroke="none" font-family="Tahoma, 'Segoe UI', system-ui, sans-serif" font-size="${size}" font-weight="${weight}">${text}</text>`;
}

/** رسم دائرة مع نص بداخلها وأطراف اختيارية */
function circleWithText(label: string, r = 26, withLeads = true, subWave?: string): string {
  const circle = `<circle cx="100" cy="60" r="${r}"/>`;
  const leads = withLeads ? leadDots(40, 100 - r, 100 + r, 160, 60, true) : '';
  if (!subWave) {
    return `${leads}${circle}${svgText(100, 66, label, 18)}`;
  }
  const topY = r > 28 ? 50 : 52;
  const wavePath = `<path d="M 96 70 Q 101 62 106 70 T 116 70" stroke-width="3"/>`;
  return `${leads}${circle}${svgText(100, topY, label, r > 28 ? 17 : 15)}${svgText(86, 73, subWave, 14)}${wavePath}`;
}

/** رسم شرطات مائلة متوازية */
function hatch(xStart: number, yCenter: number, count: number, step: number, dx = 10, dy = -12): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = xStart + i * step;
    parts.push(`M ${x - dx} ${yCenter - dy} L ${x + dx} ${yCenter + dy}`);
  }
  return `<path d="${parts.join(' ')}"/>`;
}

/** رسم قوس نصف دائري مفتوح للأسفل (∩) */
function arch(cx: number, cy: number, r = 16): string {
  return `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"/>`;
}

/** رسم قاعدة القاطع الكهربائي العمودي مع إضافات حرارية أو مغناطيسية أو تفاضلية */
function breakerBase(options: { thermal?: boolean; magnetic?: boolean; differential?: boolean; fullBox?: boolean } = {}): string {
  const { thermal = false, magnetic = false, differential = false, fullBox = false } = options;
  let y = 10;
  let d = `M 100 ${y} L 100 32`;
  y = 32;
  // ذراع التلامس المائل نحو الأعلى يساراً
  const bladeBottom = 52;
  d += ` M 100 ${bladeBottom} L 90 30`;
  y = bladeBottom;

  if (thermal) {
    d += ` M 100 ${y} L 100 ${y + 8} L 113 ${y + 8} L 113 ${y + 22} L 100 ${y + 22}`;
    y += 22;
  }
  if (magnetic) {
    d += ` M 100 ${y} L 100 ${y + 6} A 10 10 0 0 1 100 ${y + 26}`;
    y += 26;
  }

  const endY = differential ? 112 : 108;
  d += ` M 100 ${y} L 100 ${endY}`;

  let extra = '';
  if (differential) {
    const ovalY = magnetic ? y + 10 : 84;
    extra += `<ellipse cx="100" cy="${ovalY}" rx="14" ry="7" stroke-width="3"/>`;
    if (fullBox) {
      extra += `<path d="M 86 ${ovalY} L 72 ${ovalY}" stroke-dasharray="3 3" stroke-width="2.5"/>`;
      extra += `<rect x="54" y="${ovalY - 28}" width="18" height="28" stroke-dasharray="3 3" stroke-width="2.5"/>`;
    } else {
      extra += `<path d="M 86 ${ovalY} L 64 ${ovalY}" stroke-dasharray="3 3" stroke-width="2.5"/>`;
    }
  }

  return `<path d="${d}"/>${extra}`;
}

export const SYMBOLS: ElectricalSymbol[] = [
  // — الصفحة 94 —
  {
    id: 1,
    name: 'تيار متغير',
    aliases: ['تيار متردد', 'متغير', 'AC'],
    svg: `<g><path d="M 76 62 Q 88 42 100 60 T 124 58"/></g>`
  },
  {
    id: 2,
    name: 'تيار ثابت',
    aliases: ['تيار مستمر', 'ثابت', 'DC'],
    svg: `<g><path d="M 60 60 L 140 60"/></g>`
  },
  {
    id: 3,
    name: 'بطارية',
    aliases: ['نضيدة', 'خلية كهربائية'],
    svg: `<g><path d="M 46 60 L 90 60 M 90 34 L 90 86 M 110 46 L 110 74 M 110 60 L 154 60"/><path d="M 73 48 L 83 48 M 78 43 L 78 53" stroke-width="2.8"/><path d="M 118 48 L 130 48" stroke-width="2.8"/></g>`
  },
  {
    id: 4,
    name: 'جرس كهربائي',
    aliases: ['جرس'],
    svg: `<g><path d="M 66 60 L 94 60 M 94 34 L 94 86 A 26 26 0 0 1 94 34 Z"/></g>`
  },
  {
    id: 5,
    name: 'مصباح كهربائي',
    aliases: ['لمبة', 'مصباح', 'مصباح إنارة'],
    svg: `<g>${leadDots(52, 82, 118, 148, 60, false)}<circle cx="100" cy="60" r="18"/><path d="M 87 47 L 113 73 M 113 47 L 87 73"/></g>`
  },
  {
    id: 6,
    name: 'خط النتر',
    aliases: ['خط التيار', 'خط النيوترال', 'النتر', 'النيوترال'],
    svg: `<g><path d="M 100 22 L 100 98 M 86 68 L 114 50"/><rect x="100" y="30" width="14" height="8" fill="var(--sym-stroke)" stroke="none"/></g>`
  },
  {
    id: 7,
    name: 'خط الأرضي',
    aliases: ['الأرضي', 'خط التأريض', 'تأريض'],
    svg: `<g><path d="M 100 20 L 100 100 M 82 74 L 118 48 M 96 42 L 112 30"/></g>`
  },
  {
    id: 8,
    name: 'خط الفاز (عدد الخطوط)',
    aliases: ['خط الفاز', 'خط الطور', 'خط الطور عدد الخطوط', 'الفاز'],
    svg: `<g><path d="M 100 20 L 100 100 M 84 52 L 116 34 M 84 68 L 116 50 M 84 84 L 116 66"/></g>`
  },
  {
    id: 9,
    name: 'خط ثلاثي مع النتر والأرضي',
    aliases: ['خط ثلاثي مع النتر ، الأرضي', 'خط ثلاثي مع الفاز والأرضي', 'خط ثلاثي مع النيوترال والأرضي'],
    svg: `<g><path d="M 32 64 L 168 64 M 44 78 L 58 48 M 62 78 L 76 48 M 80 78 L 94 48 M 106 78 L 122 46 M 132 78 L 148 44 L 164 44"/>${dot(123, 45, 4.5)}</g>`
  },
  {
    id: 10,
    name: 'لمبة مخرج الطوارئ',
    aliases: ['مصباح مخرج الطوارئ', 'مخرج الطوارئ', 'لمبة طوارئ'],
    svg: `<g><rect x="64" y="30" width="72" height="60"/><path d="M 80 44 L 120 76 M 120 44 L 80 76"/></g>`
  },
  {
    id: 11,
    name: 'محرك واحد فاز',
    aliases: ['محرك 1 فاز', 'محرك طور واحد', 'ماتور واحد فاز', 'موتور واحد فاز'],
    svg: `<g>${circleWithText('M', 26, true, '1')}</g>`
  },
  {
    id: 12,
    name: 'محرك ثلاثة فاز',
    aliases: ['محرك 3 فاز', 'محرك ثلاثة أطوار', 'ماتور ثلاثة فاز', 'موتور ثلاثة فاز'],
    svg: `<g>${circleWithText('M', 32, true, '3')}</g>`
  },
  {
    id: 13,
    name: 'مولد واحد فاز',
    aliases: ['مولد 1 فاز', 'مولد طور واحد', 'جنريتر واحد فاز'],
    svg: `<g>${circleWithText('G', 26, true, '1')}</g>`
  },
  {
    id: 14,
    name: 'مولد ثلاثة فاز',
    aliases: ['مولد 3 فاز', 'مولد ثلاثة أطوار', 'جنريتر ثلاثة فاز'],
    svg: `<g>${circleWithText('G', 28, true, '3')}</g>`
  },
  {
    id: 15,
    name: 'محول',
    aliases: ['ترانسفورمر', 'محول كهربائي'],
    svg: `<g>${leadDots(42, 70, 130, 158, 54, true)}<circle cx="88" cy="54" r="18"/><circle cx="112" cy="54" r="18"/>${svgText(100, 92, 'T', 16)}</g>`
  },
  {
    id: 16,
    name: 'فولت ميتر',
    aliases: ['فولتميتر', 'فولتمتر', 'فولت متر', 'مقياس الجهد'],
    svg: `<g>${circleWithText('V', 26, true)}</g>`
  },
  {
    id: 17,
    name: 'أمبير ميتر',
    aliases: ['أمبيرميتر', 'أميتر', 'أمبير متر', 'مقياس التيار'],
    svg: `<g>${circleWithText('A', 26, true)}</g>`
  },
  {
    id: 18,
    name: 'أوم ميتر',
    aliases: ['أومميتر', 'أوممتر', 'أوم متر', 'مقياس المقاومة'],
    svg: `<g>${leadDots(40, 72, 128, 160, 60, true)}<circle cx="100" cy="60" r="28"/><path d="M 82 69 L 92 69 L 92 53 L 108 53 L 108 69 L 118 69" stroke-width="3.2"/></g>`
  },
  {
    id: 19,
    name: 'مكثف',
    aliases: ['مواسع', 'كباستور', 'متسعة'],
    svg: `<g><path d="M 46 62 L 90 62 M 90 36 L 90 88 M 110 36 L 110 88 M 110 62 L 154 62"/>${dot(46, 62)}${dot(154, 62)}${svgText(100, 27, 'C', 16)}</g>`
  },
  {
    id: 20,
    name: 'مقاومة كهربائية',
    aliases: ['مقاومة'],
    svg: `<g><path d="M 42 60 Q 50 44 58 60 T 74 60 T 90 60 T 106 60 T 122 60 T 138 60 T 154 60"/>${dot(42, 60)}${dot(154, 60)}</g>`
  },

  // — الصفحة التي بعد 94 —
  {
    id: 21,
    name: 'وصلة ثابتة',
    aliases: ['توصيلة ثابتة'],
    svg: `<g><path d="M 46 60 L 154 60"/>${dot(100, 60, 5)}</g>`
  },
  {
    id: 22,
    name: 'وصلة قابلة للفك',
    aliases: ['توصيلة قابلة للفك'],
    svg: `<g><path d="M 46 60 L 92 60 M 106 55 L 152 55 M 106 65 L 152 65"/><circle cx="99" cy="60" r="7"/></g>`
  },
  {
    id: 23,
    name: 'صلة',
    aliases: ['وصلة'],
    svg: `<g><path d="M 100 18 L 100 44"/><rect x="85" y="44" width="30" height="44"/><ellipse cx="100" cy="66" rx="6" ry="13" transform="rotate(30 100 66)" stroke-width="3"/></g>`
  },
  {
    id: 24,
    name: 'موصل مخفي تحت القصارة',
    aliases: ['موصل تحت القصارة', 'كابل مخفي تحت القصارة'],
    svg: `<g><path d="M 44 74 L 156 74 M 84 48 L 122 48 M 84 48 L 74 62 M 102 48 L 92 62 M 122 48 L 112 62"/></g>`
  },
  {
    id: 25,
    name: 'ضاغط باللمس',
    aliases: ['زر ضغط باللمس', 'ضغاط باللمس'],
    svg: `<g><path d="M 76 18 L 76 102 M 108 34 L 142 60 L 108 86 L 76 60 Z M 98 50 L 118 70 M 118 50 L 98 70"/></g>`
  },
  {
    id: 26,
    name: 'برّاد (ثلاجة)',
    aliases: ['براد', 'ثلاجة'],
    svg: `<g><path d="M 100 20 L 100 46"/><rect x="84" y="46" width="32" height="46"/><path d="M 100 61 L 100 77 M 93 65 L 107 73 M 107 65 L 93 73" stroke-width="3"/></g>`
  },
  {
    id: 27,
    name: 'جهاز تدفئة',
    aliases: ['جهاز تحكم', 'مدفأة', 'دفاية'],
    svg: `<g><rect x="44" y="50" width="112" height="20"/><path d="M 72 50 L 72 70 M 100 50 L 100 70 M 128 50 L 128 70"/></g>`
  },
  {
    id: 28,
    name: 'ربط اعتماد',
    aliases: ['ارتباط اعتماد'],
    svg: `<g><path d="M 52 72 Q 46 78 52 84 M 50 76 L 72 52"/><path d="M 60 80 L 124 80" stroke-dasharray="6 6" stroke-width="3"/><path d="M 134 62 L 152 94 M 152 62 L 134 94"/></g>`
  },
  {
    id: 29,
    name: 'مروحة سقف',
    aliases: ['مروحة'],
    svg: `<g><path d="M 100 60 C 86 42 64 34 56 44 C 52 52 72 62 100 60 Z"/><path d="M 100 60 C 114 42 136 34 144 44 C 148 52 128 62 100 60 Z"/><path d="M 100 60 C 88 82 90 100 100 100 C 110 100 112 82 100 60 Z"/>${dot(100, 60, 3)}</g>`
  },
  {
    id: 30,
    name: 'خط تغذية واحد فاز مع خط نتر وخط أرضي',
    aliases: ['خط تغذية واحد فاز مع خط نيوترال وخط أرضي', 'خط تغذية 1 فاز مع خط نتر وخط أرضي', 'خط تغذية 1 فاز مع خط نيوترال وخط أرضي', 'خط تغذية طور واحد مع خط نتر وخط أرضي'],
    svg: `<g>${svgText(100, 46, '1/N/PE 50HZ', 20)}${svgText(132, 86, '220V', 20)}</g>`
  },
  {
    id: 31,
    name: 'كاشف حراري',
    aliases: ['حساس حراري', 'كاشف حرارة'],
    svg: `<g>${circleWithText('H', 28, false)}</g>`
  },
  {
    id: 32,
    name: 'خط تغذية 3 فاز مع خط نتر وخط أرضي',
    aliases: ['خط تغذية ثلاثة فاز مع خط نتر وخط أرضي', 'خط تغذية 3 فاز مع خط نيوترال وخط أرضي', 'خط تغذية ثلاثة فاز مع خط نيوترال وخط أرضي', 'خط تغذية 3 أطوار مع خط نتر وخط أرضي'],
    svg: `<g>${svgText(100, 46, '3/N/PE 50HZ', 20)}${svgText(116, 86, '380V/220V', 20)}</g>`
  },
  {
    id: 33,
    name: 'نقطة إنذار حريق',
    aliases: ['علبة إنذار حريق', 'كاسر زجاج إنذار حريق'],
    svg: `<g><rect x="64" y="36" width="72" height="48"/>${svgText(100, 66, 'BG', 18)}</g>`
  },
  {
    id: 34,
    name: 'لوحة إنذار حريق',
    aliases: ['لوحة تحكم إنذار حريق'],
    svg: `<g><path d="M 100 18 L 100 42"/><rect x="62" y="42" width="76" height="48"/>${svgText(100, 72, 'FAS', 18)}</g>`
  },
  {
    id: 35,
    name: 'كاشف دخان',
    aliases: ['حساس دخان'],
    svg: `<g>${circleWithText('S', 28, false)}</g>`
  },
  {
    id: 36,
    name: 'فرن طبخ كهربائي',
    aliases: ['قرن طبخ كهربائي', 'فرن كهربائي', 'طباخ كهربائي'],
    svg: `<g><path d="M 38 60 L 58 60"/><rect x="58" y="30" width="96" height="60"/><circle cx="106" cy="48" r="8" fill="var(--sym-muted)" stroke-width="3"/><circle cx="82" cy="70" r="8" fill="var(--sym-muted)" stroke-width="3"/><circle cx="130" cy="70" r="8" fill="var(--sym-muted)" stroke-width="3"/></g>`
  },
  {
    id: 37,
    name: 'تايمر (بإنذار بانتهاء الوقت)',
    aliases: ['ثيمر بإنذار بانتهاء الوقت', 'مؤقت بإنذار بانتهاء الوقت', 'تايمر بإنذار انتهاء الوقت'],
    svg: `<g><rect x="64" y="42" width="72" height="36"/><path d="M 76 50 L 76 70 M 76 60 L 84 60" stroke-width="3"/>${svgText(110, 67, '٢٠', 18)}</g>`
  },
  {
    id: 38,
    name: 'قاطع (مفتاح) عن بعد',
    aliases: ['قاطع عن بعد', 'مفتاح عن بعد', 'بريكر عن بعد'],
    svg: `<g><rect x="62" y="42" width="76" height="36"/><path d="M 88 70 L 88 52 L 116 52" stroke-width="3.5"/></g>`
  },

  // — الصفحة 95 —
  {
    id: 39,
    name: 'نيون مفرد',
    aliases: ['فلورسنت مفرد', 'مصباح نيون مفرد', 'مصباح فلورسنت مفرد', 'لمبة نيون مفرد'],
    svg: `<g><path d="M 52 60 L 148 60 M 52 46 L 52 74 M 148 46 L 148 74"/></g>`
  },
  {
    id: 40,
    name: 'بادئ تشغيل (ستارتر)',
    aliases: ['بادئ تشغيل', 'ستارتر', 'مبدئ تشغيل'],
    svg: `<g>${leadDots(40, 72, 128, 160, 60, true)}<circle cx="100" cy="60" r="28"/><circle cx="100" cy="60" r="17" stroke-width="3"/><path d="M 72 60 L 92 60 L 92 48 L 104 48 L 104 72 L 112 72 L 112 60 L 128 60" stroke-width="3"/></g>`
  },
  {
    id: 41,
    name: 'ملف كهربائي',
    aliases: ['ملف', 'وشيعة'],
    svg: `<g><path d="M 54 44 L 122 44 M 62 44 L 62 72 M 74 44 L 74 72 M 86 44 L 86 72 M 98 44 L 98 72 M 110 44 L 110 72 M 110 56 L 146 56"/>${dot(146, 56)}</g>`
  },
  {
    id: 42,
    name: 'نيون مزدوج',
    aliases: ['فلورسنت مزدوج', 'مصباح نيون مزدوج', 'مصباح فلورسنت مزدوج', 'لمبة نيون مزدوج'],
    svg: `<g><path d="M 54 48 L 146 48 M 54 72 L 146 72 M 54 38 L 54 82 M 146 38 L 146 82"/></g>`
  },
  {
    id: 43,
    name: 'فيوز',
    aliases: ['صهر', 'مصهر', 'فاصم'],
    svg: `<g><path d="M 100 18 L 100 102"/><rect x="88" y="42" width="24" height="36"/>${dot(100, 18)}${dot(100, 102)}</g>`
  },
  {
    id: 44,
    name: 'كشاف إنارة',
    aliases: ['كشاف', 'مصباح كشاف'],
    svg: `<g><path d="M 88 26 A 34 34 0 0 0 88 94"/><circle cx="110" cy="60" r="18"/><path d="M 97 47 L 123 73 M 123 47 L 97 73"/></g>`
  },
  {
    id: 45,
    name: 'ملف خانق',
    aliases: ['خانق', 'ترانس نيون', 'بلاست'],
    svg: `<g><rect x="74" y="34" width="52" height="10" fill="var(--sym-stroke)" stroke="none"/><rect x="76" y="54" width="48" height="24" fill="var(--sym-stroke)" stroke="none"/><path d="M 50 66 L 150 66"/></g>`
  },
  {
    id: 46,
    name: 'عاكس',
    aliases: ['عاكس ضوء'],
    svg: `<g><circle cx="100" cy="60" r="24"/></g>`
  },
  {
    id: 47,
    name: 'مبين أرقام',
    aliases: ['شاشة أرقام', 'عداد أرقام'],
    svg: `<g><path d="M 100 22 L 100 46"/><rect x="64" y="46" width="72" height="38"/><path d="M 64 84 L 136 46" stroke-width="3"/>${svgText(120, 77, 'N', 14)}</g>`
  },
  {
    id: 48,
    name: 'كشاف إنارة متحرك',
    aliases: ['كشاف متحرك'],
    svg: `<g><path d="M 86 26 A 34 34 0 0 0 86 94"/><circle cx="106" cy="60" r="17"/><path d="M 94 72 L 136 30 M 94 48 L 136 90"/><path d="M 124 30 L 136 30 L 136 42 M 136 78 L 136 90 L 124 90" stroke-width="3.5"/></g>`
  },
  {
    id: 49,
    name: 'قاطع كهربائي',
    aliases: ['بريكر كهربائي', 'قاطع', 'بريكر'],
    svg: `<g>${breakerBase()}</g>`
  },
  {
    id: 50,
    name: 'تايمر (مؤقت زمني)',
    aliases: ['ثيمر (مؤقت زمني)', 'تيمر (مؤقت زمني)', 'مؤقت زمني', 'تايمر', 'ثيمر', 'مؤقت'],
    svg: `<g><path d="M 100 18 L 100 44"/><rect x="82" y="44" width="36" height="44"/>${svgText(100, 72, 'T', 18)}</g>`
  },
  {
    id: 51,
    name: 'قاطع حراري',
    aliases: ['بريكر حراري'],
    svg: `<g>${breakerBase({ thermal: true })}</g>`
  },
  {
    id: 52,
    name: 'عداد طاقة واحد فاز',
    aliases: ['عداد طاقة 1 فاز', 'عداد كهرباء واحد فاز', 'عداد كيلوواط ساعة واحد فاز'],
    svg: `<g><rect x="64" y="24" width="72" height="72"/>${svgText(100, 42, 'K.W.H', 13)}</g>`
  },
  {
    id: 53,
    name: 'القاطع التفاضلي DIR (قاطع التسرب الأرضي)',
    aliases: ['قاطع تفاضلي DIR', 'قاطع التسرب الأرضي', 'قاطع تفاضلي', 'قاطع تسرب أرضي DIR', 'بريكر تفاضلي'],
    svg: `<g>${breakerBase({ differential: true, fullBox: true })}</g>`
  },
  {
    id: 54,
    name: 'قاطع مغناطيسي',
    aliases: ['بريكر مغناطيسي'],
    svg: `<g>${breakerBase({ magnetic: true })}</g>`
  },

  // — الصفحة 96 —
  {
    id: 55,
    name: 'وحدة إنارة',
    aliases: ['مصباح مزدوج', 'وحدة إضاءة'],
    svg: `<g><circle cx="100" cy="60" r="32"/><path d="M 80 54 L 92 66 M 92 54 L 80 66 M 108 54 L 120 66 M 120 54 L 108 66" stroke-width="3.2"/></g>`
  },
  {
    id: 56,
    name: 'قاطع مغناطيسي حراري',
    aliases: ['قاطع حراري مغناطيسي', 'بريكر مغناطيسي حراري', 'بريكر حراري مغناطيسي'],
    svg: `<g>${breakerBase({ thermal: true, magnetic: true })}</g>`
  },
  {
    id: 57,
    name: 'نقطة إنارة',
    aliases: ['نقطة إضاءة'],
    svg: `<g><path d="M 84 44 L 116 76 M 116 44 L 84 76"/></g>`
  },
  {
    id: 58,
    name: 'قاطع التسرب الأرضي المغناطيسي الحراري DIR',
    aliases: ['قاطع التسرب الأرضي المغناطيسي الحراري', 'قاطع تسرب أرضي مغناطيسي حراري DIR', 'بريكر التسرب الأرضي المغناطيسي الحراري'],
    svg: `<g>${breakerBase({ thermal: true, magnetic: true, differential: true, fullBox: false })}</g>`
  },
  {
    id: 59,
    name: 'مفتاح مع لمبة إشارة',
    aliases: ['مفتاح بلمبة إشارة', 'مفتاح مع لمبة بيان'],
    svg: `<g><circle cx="92" cy="70" r="18" fill="var(--sym-stroke)"/><path d="M 92 70 L 79 57 A 18 18 0 0 1 105 57 Z M 92 70 L 79 83 A 18 18 0 0 0 105 83 Z" fill="var(--bg-card)" stroke="none"/><circle cx="92" cy="70" r="18"/><path d="M 105 57 L 130 32 L 138 40"/></g>`
  },
  {
    id: 60,
    name: 'خط أرضي',
    aliases: ['خط الأرضي', 'أرضي', 'تأريض', 'خط التأريض'],
    svg: `<g><path d="M 100 18 L 100 56 M 56 56 L 144 56 M 72 70 L 128 70 M 88 84 L 112 84"/>${dot(100, 96, 3)}</g>`
  },
  {
    id: 61,
    name: 'مفتاح دركتين',
    aliases: ['مفتاح طرف سلم', 'مفتاح سلم', 'مفتاح تبادلي', 'مفتاح درج'],
    svg: `<g><path d="M 64 78 L 74 88 L 124 38 L 134 48"/><circle cx="100" cy="62" r="7" fill="var(--bg-card)"/></g>`
  },
  {
    id: 62,
    name: 'مفتاح مفرد',
    aliases: ['مفتاح عادي', 'مفتاح أحادي'],
    svg: `<g><path d="M 78 88 L 116 32 L 126 42"/><circle cx="76" cy="90" r="5" fill="var(--bg-card)"/></g>`
  },
  {
    id: 63,
    name: 'مفتاح مصلّب',
    aliases: ['مفتاح مصلب', 'مفتاح وسط سلم', 'مفتاح تقاطع'],
    svg: `<g><path d="M 66 34 L 80 34 L 120 88 L 134 88 M 134 34 L 120 34 L 80 88 L 66 88"/><circle cx="100" cy="61" r="6" fill="var(--bg-card)"/></g>`
  },
  {
    id: 64,
    name: 'مفتاح مزدوج',
    aliases: ['مفتاح ثنائي', 'مفتاح خطين'],
    svg: `<g><path d="M 74 88 L 120 34 L 132 44 M 110 46 L 122 56"/><circle cx="72" cy="90" r="6" fill="var(--bg-card)"/></g>`
  },
  {
    id: 65,
    name: 'مفتاح ديمر (شدة الإضاءة)',
    aliases: ['مفتاح ديمر', 'ديمر', 'مخفت إضاءة', 'مفتاح مخفت', 'مفتاح شدة الإضاءة'],
    svg: `<g><path d="M 66 66 L 124 66 L 124 36 Z"/><path d="M 80 82 L 126 30"/><circle cx="77" cy="86" r="5" fill="var(--bg-card)"/></g>`
  },
  {
    id: 66,
    name: 'مفتاح ثلاثي',
    aliases: ['مفتاح ثلاثة خطوط'],
    svg: `<g><path d="M 72 90 L 122 32 L 134 42 M 112 44 L 124 54 M 102 56 L 114 66"/><circle cx="70" cy="92" r="6" fill="var(--bg-card)"/></g>`
  },
  {
    id: 67,
    name: 'ضاغط',
    aliases: ['زر ضغط', 'ضغاط', 'جرس ضاغط'],
    svg: `<g><circle cx="100" cy="60" r="24"/><circle cx="100" cy="60" r="9"/></g>`
  },
  {
    id: 68,
    name: 'مفتاح ثنائي القطب',
    aliases: ['مفتاح ذو قطبين'],
    svg: `<g><path d="M 48 64 L 68 42 L 96 72 M 104 72 L 132 42 L 152 64"/><circle cx="100" cy="76" r="6" fill="var(--bg-card)"/></g>`
  },
  {
    id: 69,
    name: 'ضاغط محمي',
    aliases: ['زر ضغط محمي', 'ضغاط محمي'],
    svg: `<g><circle cx="96" cy="60" r="22"/><circle cx="96" cy="60" r="8"/><path d="M 96 22 L 96 30 L 134 30 L 134 90 L 96 90 L 96 98" stroke-width="3.2"/></g>`
  },
  {
    id: 70,
    name: 'مفتاح على الخيط',
    aliases: ['مفتاح خيط', 'مفتاح حبل'],
    svg: `<g><path d="M 76 86 L 122 36" stroke-dasharray="5 4"/><path d="M 122 36 L 132 46 M 122 36 L 122 66 M 116 58 L 122 68 L 128 58"/><circle cx="72" cy="90" r="6" fill="var(--bg-card)"/></g>`
  },
  {
    id: 71,
    name: 'إيريز عادي',
    aliases: ['أبريز عادي', 'ابريز عادي', 'مأخذ عادي', 'بريزة عادية', 'بريز عادي'],
    svg: `<g><path d="M 66 36 L 122 36 L 122 68"/>${arch(122, 84, 16)}</g>`
  },
  {
    id: 72,
    name: 'ضاغط مع لمبة إنارة',
    aliases: ['ضاغط مع لمبة إشارة', 'زر ضغط مع لمبة إنارة', 'ضغاط مع لمبة إنارة'],
    svg: `<g><circle cx="100" cy="60" r="28"/><rect x="93" y="53" width="14" height="14" rx="2" fill="var(--sym-stroke)" stroke="none"/></g>`
  },

  // — الصفحة 97 —
  {
    id: 73,
    name: 'ثلاثة أباريز',
    aliases: ['ثلاث أباريز', 'ثلاثة مآخذ', 'ثلاث برايز', 'ثلاثة بريزات'],
    svg: `<g><path d="M 74 22 L 100 22 L 100 94"/>${arch(100, 56, 15)}${arch(100, 72, 15)}${arch(100, 88, 15)}</g>`
  },
  {
    id: 74,
    name: 'نقطة إنارة جدارية',
    aliases: ['نقطة إضاءة جدارية', 'مصباح جداري'],
    svg: `<g><path d="M 48 60 L 122 60 M 110 46 L 134 74 M 134 46 L 110 74 M 150 26 L 150 94"/></g>`
  },
  {
    id: 75,
    name: 'إيريز مزدوج بعد',
    aliases: ['أبريز مزدوج بعد', 'مأخذ مزدوج بعد', 'بريزة مزدوجة بعد', 'بريز مزدوج بعد'],
    svg: `<g><path d="M 72 24 L 100 24 L 100 66 M 62 66 L 138 66"/>${arch(78, 84, 14)}${arch(122, 84, 14)}</g>`
  },
  {
    id: 76,
    name: 'ثلاثة أباريز',
    aliases: ['ثلاثة أباريز الرمز الثاني', 'ثلاث أباريز', 'ثلاثة مآخذ', 'ثلاث برايز', 'ثلاثة بريزات'],
    svg: `<g><path d="M 60 44 L 124 44 L 124 68"/>${arch(124, 84, 16)}<path d="M 90 36 L 68 62" stroke-dasharray="4 4" stroke-width="3"/></g>`
  },
  {
    id: 77,
    name: 'إيريز مفتاح',
    aliases: ['أبريز مفتاح', 'مأخذ مفتاح', 'بريزة مفتاح', 'بريز مفتاح', 'إيريز مع مفتاح'],
    svg: `<g><path d="M 104 26 L 104 68 M 104 38 L 76 68 M 68 68 L 136 68"/>${arch(104, 86, 16)}</g>`
  },
  {
    id: 78,
    name: 'إيريز بعد',
    aliases: ['أبريز بعد', 'مأخذ بعد', 'بريزة بعد', 'بريز بعد'],
    svg: `<g><path d="M 100 28 L 100 68 M 70 68 L 130 68"/>${arch(100, 86, 16)}</g>`
  },
  {
    id: 79,
    name: 'إيريز تلفزيون / فيديو / هاتف TV/Te (رمز عام)',
    aliases: ['إيريز تلفزيون فيديو هاتف', 'إيريز تلفزيون', 'إيريز هاتف', 'مأخذ تلفزيون', 'TV/Te', 'أبريز تلفزيون فيديو هاتف'],
    svg: `<g><path d="M 100 26 L 100 66 M 68 66 L 132 66 M 68 66 L 68 84 M 132 66 L 132 84"/></g>`
  },
  {
    id: 80,
    name: 'إيريز مؤمن مع أمان',
    aliases: ['أبريز مؤمن مع أمان', 'مأخذ مؤمن مع أمان', 'بريزة مؤمنة مع أمان', 'بريز مؤمن مع أمان', 'إيريز مؤمن'],
    svg: `<g><path d="M 100 26 L 100 66 M 70 84 L 84 84 M 116 84 L 130 84"/>${arch(100, 84, 16)}</g>`
  },
  {
    id: 81,
    name: 'مفتاح (سويتش)',
    aliases: ['سويتش', 'مفتاح سويتش', 'مفتاح'],
    svg: `<g><rect x="66" y="28" width="68" height="64"/><path d="M 88 54 A 12 12 0 1 1 112 54 L 120 78 L 80 78 Z"/></g>`
  },
  {
    id: 82,
    name: 'إيريز مع محول',
    aliases: ['أبريز مع محول', 'مأخذ مع محول', 'بريزة مع محول', 'بريز مع محول'],
    svg: `<g><path d="M 54 60 L 72 60"/><circle cx="90" cy="60" r="18"/><path d="M 134 40 A 20 20 0 1 0 134 80"/></g>`
  },
  {
    id: 83,
    name: 'مسخن ماء',
    aliases: ['سخان ماء', 'سخان كهربائي', 'جيزر'],
    svg: `<g><path d="M 44 60 L 76 60"/><circle cx="108" cy="60" r="32"/><path d="M 94 34 L 94 86 M 108 29 L 108 91 M 122 34 L 122 86" stroke-width="3.2"/></g>`
  },
  {
    id: 84,
    name: 'تايمر 24 ساعة',
    aliases: ['ثيمر 24 ساعة', 'تأيمر 24 ساعة', 'مؤقت 24 ساعة'],
    svg: `<g><rect x="42" y="34" width="116" height="52"/><circle cx="72" cy="60" r="15" stroke-width="3.2"/><path d="M 62 50 L 72 60 L 82 60" stroke-width="3"/>${dot(72, 60, 2.5)}<path d="M 98 62 L 112 62 M 114 66 L 130 56 L 146 56" stroke-width="3.5"/></g>`
  },
  {
    id: 85,
    name: 'لوحة توزيع فرعية',
    aliases: ['تابلو فرعي', 'لوحة فرعية'],
    svg: `<g><rect x="52" y="38" width="96" height="44"/><path d="M 52 38 L 148 38 L 100 60 Z M 52 82 L 148 82 L 100 60 Z" fill="var(--sym-stroke)" stroke="none"/></g>`
  },
  {
    id: 86,
    name: 'قفل كهربائي',
    aliases: ['قفل', 'زرفيل كهربائي'],
    svg: `<g><rect x="54" y="38" width="60" height="44"/><path d="M 68 70 L 68 54 A 8 8 0 0 1 84 54 L 84 70 M 84 54 A 8 8 0 0 1 100 54 L 100 70" stroke-width="3.2"/><path d="M 114 38 L 114 82 L 148 82 Z"/></g>`
  },
  {
    id: 87,
    name: 'موصلات معزولة عن الأنابيب',
    aliases: ['موصلات معزولة عن الانابيب', 'أسلاك معزولة عن الأنابيب'],
    svg: `<g><path d="M 48 60 L 152 60 M 76 42 L 124 42 M 76 78 L 124 78"/><ellipse cx="100" cy="60" rx="18" ry="12"/></g>`
  },
  {
    id: 88,
    name: 'لوحة توزيع رئيسية',
    aliases: ['تابلو رئيسي', 'لوحة رئيسية'],
    svg: `<g><rect x="52" y="38" width="96" height="44"/><path d="M 148 38 L 148 82 L 52 82 Z" fill="var(--sym-stroke)" stroke="none"/></g>`
  },
  {
    id: 89,
    name: 'موصل فوق القصارة',
    aliases: ['سلك فوق القصارة', 'كابل فوق القصارة'],
    svg: `<g><path d="M 44 42 L 156 42 M 84 58 L 122 58 M 84 58 L 74 72 M 102 58 L 92 72 M 122 58 L 112 72"/></g>`
  },
  {
    id: 90,
    name: 'جهاز اتصال داخلي',
    aliases: ['انتركوم', 'اتصال داخلي', 'جهاز انتركوم'],
    svg: `<g><rect x="50" y="30" width="68" height="60"/><rect x="64" y="46" width="24" height="28" stroke-width="3"/><path d="M 88 46 L 118 30 M 88 74 L 118 90" stroke-width="3"/><path d="M 102 60 L 156 60 M 110 54 L 100 60 L 110 66 M 148 54 L 158 60 L 148 66" stroke-width="3.5"/></g>`
  }
];
