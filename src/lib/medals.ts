export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'mythic' | 'diamond' | 'astral' | 'immortal';

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
}

export interface Medal {
  id: string;
  title: string;
  tagline: string;
  description: string;
  quote: string;
  requiredSeconds: number; // in seconds
  tier: MedalTier;
  tierName: string;
  iconName: 'spark' | 'book' | 'compass' | 'shield' | 'scroll' | 'sun' | 'crown' | 'gem' | 'star';
  localizedTitle?: LocalizedText;
  localizedTagline?: LocalizedText;
  localizedDescription?: LocalizedText;
  localizedQuote?: LocalizedText;
  localizedTierName?: LocalizedText;
  colors: {
    gradient: string;
    border: string;
    glow: string;
    badgeBg: string;
    accentColor: string;
    ringColor: string;
  };
}

export const MEDALS: Medal[] = [
  {
    id: 'first-spark',
    title: 'قبس المعرفة الأول',
    tagline: 'أول 5 دقائق من القراءة المباركة',
    description: 'يُمنح للقارئ الشغوف فور إتمام أول 5 دقائق من القراءة والتركيز في رحاب العلم.',
    quote: 'العلم قبس يُضيء دروب الظلام، وبداية كل غيث قطرة.',
    localizedTitle: { ar: 'قبس المعرفة الأول', en: 'First Spark of Knowledge', fr: 'Première Étincelle' },
    localizedTagline: { ar: 'أول 5 دقائق من القراءة المباركة', en: 'First 5 minutes of focused reading', fr: 'Premières 5 minutes de lecture concentrée' },
    localizedDescription: { ar: 'يُمنح للقارئ الشغوف فور إتمام أول 5 دقائق من القراءة والتركيز في رحاب العلم.', en: 'Awarded immediately upon completing your first 5 minutes of reading.', fr: 'Décerné dès vos 5 premières minutes de lecture.' },
    localizedQuote: { ar: 'العلم قبس يُضيء دروب الظلام، وبداية كل غيث قطرة.', en: 'Knowledge is a light that banishes darkness; every torrent begins with a drop.', fr: 'Le savoir est une lumière qui dissipe l\'obscurité.' },
    requiredSeconds: 300, // 5 minutes
    tier: 'bronze',
    tierName: 'برونزي',
    localizedTierName: { ar: 'برونزي', en: 'Bronze', fr: 'Bronze' },
    iconName: 'spark',
    colors: {
      gradient: 'from-amber-700 via-amber-600 to-amber-900',
      border: 'border-amber-500/70',
      glow: 'shadow-[0_0_25px_rgba(217,119,6,0.35)]',
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      accentColor: '#D97706',
      ringColor: 'ring-amber-500/40',
    },
  },
  {
    id: 'page-companion',
    title: 'أنيس الصفحات',
    tagline: 'نصف ساعة من الأنس بالكتب',
    description: 'يُمنح للذي ألف مجالسة الكلمات وقضى نصف ساعة كاملة في مدارسة الصفحات.',
    quote: 'وخير جليس في الزمان كتاب، به تسلو وتكتسب العلوما.',
    localizedTitle: { ar: 'أنيس الصفحات', en: 'Page Companion', fr: 'Compagnon des Pages' },
    localizedTagline: { ar: 'نصف ساعة من الأنس بالكتب', en: '30 minutes in the company of books', fr: '30 minutes en compagnie des livres' },
    localizedDescription: { ar: 'يُمنح للذي ألف مجالسة الكلمات وقضى نصف ساعة كاملة في مدارسة الصفحات.', en: 'Earned by dedicating 30 full minutes to turning pages and absorbing wisdom.', fr: 'Obtenu après 30 minutes passées à lire avec attention.' },
    localizedQuote: { ar: 'وخير جليس في الزمان كتاب، به تسلو وتكتسب العلوما.', en: 'The best companion through time is a book, bestowing joy and knowledge.', fr: 'Le meilleur compagnon au fil du temps est un livre.' },
    requiredSeconds: 1800, // 30 minutes
    tier: 'silver',
    tierName: 'فضي',
    localizedTierName: { ar: 'فضي', en: 'Silver', fr: 'Argent' },
    iconName: 'book',
    colors: {
      gradient: 'from-slate-400 via-sky-600 to-indigo-800',
      border: 'border-sky-400/70',
      glow: 'shadow-[0_0_25px_rgba(56,189,248,0.4)]',
      badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
      accentColor: '#38BDF8',
      ringColor: 'ring-sky-400/40',
    },
  },
  {
    id: 'knowledge-diver',
    title: 'غواص المعارف',
    tagline: 'ساعة ونصف من الغوص في الحكمة',
    description: 'يُمنح لمن تعمق في بطون المراجع والكتب واستخرج فرائد الفوائد ولآلئ الفكر.',
    quote: 'من طلب العلا سهر الليالي، وخاض لجج الفكر باحثاً عن الدرر.',
    localizedTitle: { ar: 'غواص المعارف', en: 'Knowledge Diver', fr: 'Plongeur du Savoir' },
    localizedTagline: { ar: 'ساعة ونصف من الغوص في الحكمة', en: '1.5 hours plunging into deep wisdom', fr: '1h30 de plongée dans la sagesse' },
    localizedDescription: { ar: 'يُمنح لمن تعمق في بطون المراجع والكتب واستخرج فرائد الفوائد ولآلئ الفكر.', en: 'Awarded to those who immerse themselves in literature and retrieve pearls of thought.', fr: 'Décerné à ceux qui explorent les ouvrages pour y puiser de précieuses idées.' },
    localizedQuote: { ar: 'من طلب العلا سهر الليالي، وخاض لجج الفكر باحثاً عن الدرر.', en: 'Whoever seeks greatness ventures through deep oceans of thought to find pearls.', fr: 'Qui cherche la grandeur s\'aventure dans les profondeurs de l\'esprit.' },
    requiredSeconds: 5400, // 1.5 hours
    tier: 'gold',
    tierName: 'ذهبي',
    localizedTierName: { ar: 'ذهبي', en: 'Gold', fr: 'Or' },
    iconName: 'compass',
    colors: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-700',
      border: 'border-yellow-400',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
      badgeBg: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
      accentColor: '#F59E0B',
      ringColor: 'ring-yellow-400/50',
    },
  },
  {
    id: 'chinguetti-guardian',
    title: 'حارس الشنقيط',
    tagline: '4 ساعات في حراسة الإرث العريق',
    description: 'يُمنح لمن كرّس 4 ساعات من وقته لحفظ تراث أرض المنارة والرباط وعمارة مجالس العلم.',
    quote: 'شنقيط منارة أضاءت دروب الصحراء بنور العلم الخالد.',
    localizedTitle: { ar: 'حارس الشنقيط', en: 'Guardian of Chinguetti', fr: 'Gardien de Chinguetti' },
    localizedTagline: { ar: '4 ساعات في حراسة الإرث العريق', en: '4 hours safeguarding heritage & letters', fr: '4 heures à préserver le patrimoine' },
    localizedDescription: { ar: 'يُمنح لمن كرّس 4 ساعات من وقته لحفظ تراث أرض المنارة والرباط وعمارة مجالس العلم.', en: 'Bestowed on dedicated scholars dedicating 4 hours honoring desert libraries.', fr: 'Accordé aux lecteurs dévoués qui honorent les bibliothèques du désert.' },
    localizedQuote: { ar: 'شنقيط منارة أضاءت دروب الصحراء بنور العلم الخالد.', en: 'Chinguetti is a beacon illuminating desert paths with timeless wisdom.', fr: 'Chinguetti est un phare illuminant le désert par le savoir éternel.' },
    requiredSeconds: 14400, // 4 hours
    tier: 'platinum',
    tierName: 'بلاتيني',
    localizedTierName: { ar: 'بلاتيني', en: 'Platinum', fr: 'Platine' },
    iconName: 'shield',
    colors: {
      gradient: 'from-emerald-400 via-teal-600 to-cyan-900',
      border: 'border-emerald-300',
      glow: 'shadow-[0_0_35px_rgba(16,185,129,0.5)]',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accentColor: '#10B981',
      ringColor: 'ring-emerald-400/50',
    },
  },
  {
    id: 'mahdhara-sage',
    title: 'حكيم المحظرة',
    tagline: '8 ساعات من حفظ المتون وملازمة الشيوخ',
    description: 'وسام شرفي عالي القيمة يُمنح لرواد المحاظر الشناقطة الذين رسخوا في العلم رسوخ الجبال.',
    quote: 'إذا أردت شرف الدارين فاعكف على الدفاتر واستنر بالحكمة.',
    localizedTitle: { ar: 'حكيم المحظرة', en: 'Mahdhara Sage', fr: 'Sage de la Mahdhara' },
    localizedTagline: { ar: '8 ساعات من حفظ المتون وملازمة الشيوخ', en: '8 hours of scholarly mastery', fr: '8 heures de maîtrise studieuse' },
    localizedDescription: { ar: 'وسام شرفي عالي القيمة يُمنح لرواد المحاظر الشناقطة الذين رسخوا في العلم رسوخ الجبال.', en: 'A prestigious honor for readers rooted in discipline like mountains.', fr: 'Une distinction prestigieuse pour les esprits rigoureux et passionnés.' },
    localizedQuote: { ar: 'إذا أردت شرف الدارين فاعكف على الدفاتر واستنر بالحكمة.', en: 'To attain supreme honor, keep company with books and enlighten your soul.', fr: 'Pour atteindre la noblesse suprême, méditez les livres et éclairez votre esprit.' },
    requiredSeconds: 28800, // 8 hours
    tier: 'ruby',
    tierName: 'ياقوتي',
    localizedTierName: { ar: 'ياقوتي', en: 'Ruby', fr: 'Rubis' },
    iconName: 'scroll',
    colors: {
      gradient: 'from-rose-500 via-purple-700 to-red-950',
      border: 'border-rose-400',
      glow: 'shadow-[0_0_40px_rgba(244,63,94,0.55)]',
      badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      accentColor: '#F43F5E',
      ringColor: 'ring-rose-400/50',
    },
  },
  {
    id: 'desert-sun',
    title: 'شمس الصحراء الخالدة',
    tagline: '15 ساعة من النبوغ والمعرفة المطلقة',
    description: 'أعلى وسام فخري يمنحه التطبيق للرواد الاستثنائيين الذين اتخذوا القراءة سبيلاً للحياة.',
    quote: 'تغيب شموس الأفلاك وتبقى شمس الحكمة مشرقة في الأرواح والصدور.',
    localizedTitle: { ar: 'شمس الصحراء الخالدة', en: 'Eternal Desert Sun', fr: 'Soleil Éternel du Désert' },
    localizedTagline: { ar: '15 ساعة من النبوغ والمعرفة المطلقة', en: '15 hours of brilliant enlightenment', fr: '15 heures d\'éclat et de savoir absolu' },
    localizedDescription: { ar: 'أعلى وسام فخري يمنحه التطبيق للرواد الاستثنائيين الذين اتخذوا القراءة سبيلاً للحياة.', en: 'Awarded to exceptional readers who embrace reading as a way of life.', fr: 'Décerné aux lecteurs exceptionnels qui font de la lecture un mode de vie.' },
    localizedQuote: { ar: 'تغيب شموس الأفلاك وتبقى شمس الحكمة مشرقة في الأرواح والصدور.', en: 'Suns set, but the sun of wisdom shines forever in illuminated souls.', fr: 'Les soleils se couchent, mais la sagesse illumine toujours les âmes.' },
    requiredSeconds: 54000, // 15 hours
    tier: 'mythic',
    tierName: 'أسطوري',
    localizedTierName: { ar: 'أسطوري', en: 'Mythic', fr: 'Mythique' },
    iconName: 'sun',
    colors: {
      gradient: 'from-fuchsia-500 via-amber-400 to-indigo-700',
      border: 'border-amber-200',
      glow: 'shadow-[0_0_45px_rgba(217,70,239,0.6)]',
      badgeBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
      accentColor: '#D946EF',
      ringColor: 'ring-fuchsia-400/60',
    },
  },
  {
    id: 'scholar-ascendant',
    title: 'العلاّمة الموسوعي',
    tagline: '25 ساعة من التبحر وسعة الاطلاع',
    description: 'يُمنح للعلماء المتبحرين الذين أحاطوا بمختلف الفنون وأفردوا أيامهم للمطالعة الجادة.',
    quote: 'العلم بحر زاخر لا ينال درّه إلا الغواص الصبور المثابر.',
    localizedTitle: { ar: 'العلاّمة الموسوعي', en: 'Grand Polymath', fr: 'Grand Érudit' },
    localizedTagline: { ar: '25 ساعة من التبحر وسعة الاطلاع', en: '25 hours of deep erudition', fr: '25 heures d\'érudition profonde' },
    localizedDescription: { ar: 'يُمنح للعلماء المتبحرين الذين أحاطوا بمختلف الفنون وأفردوا أيامهم للمطالعة الجادة.', en: 'Awarded to readers who have traversed entire encyclopedias of diverse sciences.', fr: 'Décerné aux esprits encyclopédiques explorant de vastes horizons.' },
    localizedQuote: { ar: 'العلم بحر زاخر لا ينال درّه إلا الغواص الصبور المثابر.', en: 'True scholarship requires unwavering resolve across oceans of text.', fr: 'Le véritable savoir exige une constance sans faille.' },
    requiredSeconds: 90000, // 25 hours
    tier: 'diamond',
    tierName: 'ألماسي',
    localizedTierName: { ar: 'ألماسي', en: 'Diamond', fr: 'Diamant' },
    iconName: 'crown',
    colors: {
      gradient: 'from-cyan-400 via-blue-500 to-indigo-900',
      border: 'border-cyan-300',
      glow: 'shadow-[0_0_45px_rgba(6,182,212,0.6)]',
      badgeBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
      accentColor: '#06B6D4',
      ringColor: 'ring-cyan-400/60',
    },
  },
  {
    id: 'master-of-codices',
    title: 'سيّد المخطوطات والأسفار',
    tagline: '50 ساعة من استيعاب أمهات الكتب',
    description: 'يُمنح للنخبة من القراء الذين ألفوا المراجع الكبرى وأحاطوا بأسرار العلوم الدقيقة.',
    quote: 'الكتب حياة تتجاوز حدود الزمان والمكان، ونور في ظلمات الدهر.',
    localizedTitle: { ar: 'سيّد المخطوطات والأسفار', en: 'Master of Tomes', fr: 'Maître des Tomes' },
    localizedTagline: { ar: '50 ساعة من استيعاب أمهات الكتب', en: '50 hours of profound literary mastery', fr: '50 heures de maîtrise littéraire' },
    localizedDescription: { ar: 'يُمنح للنخبة من القراء الذين ألفوا المراجع الكبرى وأحاطوا بأسرار العلوم الدقيقة.', en: 'Bestowed upon the elite who have deciphered centuries of foundational manuscripts.', fr: 'Réservé à l\'élite ayant exploré les manuscrits les plus exigeants.' },
    localizedQuote: { ar: 'الكتب حياة تتجاوز حدود الزمان والمكان، ونور في ظلمات الدهر.', en: 'A book transcends time and mortality, a lamp across ages.', fr: 'Un grand livre transcende le temps et illumine les époques.' },
    requiredSeconds: 180000, // 50 hours
    tier: 'astral',
    tierName: 'سماوي',
    localizedTierName: { ar: 'سماوي', en: 'Celestial', fr: 'Céleste' },
    iconName: 'gem',
    colors: {
      gradient: 'from-purple-500 via-pink-500 to-amber-500',
      border: 'border-purple-300',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.65)]',
      badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
      accentColor: '#A855F7',
      ringColor: 'ring-purple-400/60',
    },
  },
  {
    id: 'eternal-library-legend',
    title: 'أسطورة المكتبة الحية',
    tagline: '100 ساعة من الخلود في محراب القراءة',
    description: 'القمة السامية والمقام الأرفع في تاريخ المكتبة للذين شيدوا في عقولهم مكتبات خالدة.',
    quote: 'من قرأ ألف كتاب عاش ألف حياة واكتسب ألف حكمة ورأي سديد.',
    localizedTitle: { ar: 'أسطورة المكتبة الحية', en: 'Living Library Legend', fr: 'Légende Vivante de la Bibliothèque' },
    localizedTagline: { ar: '100 ساعة من الخلود في محراب القراءة', en: '100 hours of immortal literary devotion', fr: '100 heures d\'immortalité littéraire' },
    localizedDescription: { ar: 'القمة السامية والمقام الأرفع في تاريخ المكتبة للذين شيدوا في عقولهم مكتبات خالدة.', en: 'The supreme zenith of reading. A living monument of boundless intellect and wisdom.', fr: 'Le pinacle absolu de la lecture. Un monument vivant de sagesse.' },
    localizedQuote: { ar: 'من قرأ ألف كتاب عاش ألف حياة واكتسب ألف حكمة ورأي سديد.', en: 'Whoever reads a thousand books lives a thousand lifetimes and speaks timeless truth.', fr: 'Celui qui lit mille livres vit mille vies et porte une vérité intemporelle.' },
    requiredSeconds: 360000, // 100 hours
    tier: 'immortal',
    tierName: 'خالد',
    localizedTierName: { ar: 'خالد', en: 'Immortal', fr: 'Immortel' },
    iconName: 'star',
    colors: {
      gradient: 'from-amber-300 via-rose-500 to-violet-700',
      border: 'border-yellow-200',
      glow: 'shadow-[0_0_60px_rgba(251,191,36,0.75)]',
      badgeBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40',
      accentColor: '#F59E0B',
      ringColor: 'ring-amber-400/70',
    },
  },
];

export const getLocalizedMedal = (medal: Medal, lang: 'ar' | 'en' | 'fr' = 'ar'): Medal => {
  return {
    ...medal,
    title: medal.localizedTitle?.[lang] || medal.title,
    tagline: medal.localizedTagline?.[lang] || medal.tagline,
    description: medal.localizedDescription?.[lang] || medal.description,
    quote: medal.localizedQuote?.[lang] || medal.quote,
    tierName: medal.localizedTierName?.[lang] || medal.tierName,
  };
};

/**
 * Format total seconds into human-readable text in chosen language
 */
export const formatReadingDuration = (seconds: number, lang: 'ar' | 'en' | 'fr' = 'ar'): string => {
  if (!seconds || seconds <= 0) {
    if (lang === 'en') return 'Less than a minute';
    if (lang === 'fr') return 'Moins d\'une minute';
    return 'أقل من دقيقة';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (lang === 'en') {
    if (hours === 0) return `${minutes} min${minutes === 1 ? '' : 's'}`;
    if (minutes === 0) return `${hours} hr${hours === 1 ? '' : 's'}`;
    return `${hours} hr${hours === 1 ? '' : 's'} ${minutes} min`;
  }

  if (lang === 'fr') {
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  }

  // Arabic
  return formatReadingDurationArabic(seconds);
};

/**
 * Format total seconds into human-readable Arabic text
 */
export const formatReadingDurationArabic = (seconds: number): string => {
  if (!seconds || seconds <= 0) return 'أقل من دقيقة';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    if (minutes === 1) return 'دقيقة واحدة';
    if (minutes === 2) return 'دقيقتان';
    if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
    return `${minutes} دقيقة`;
  }

  const hourText = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : hours <= 10 ? `${hours} ساعات` : `${hours} ساعة`;

  if (minutes === 0) return hourText;
  
  const minText = minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتان' : minutes <= 10 ? `${minutes} دقائق` : `${minutes} دقيقة`;
  return `${hourText} و ${minText}`;
};

/**
 * Format timer in digital format (MM:SS or HH:MM:SS)
 */
export const formatDigitalTimer = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export interface MedalsProgressResult {
  totalSeconds: number;
  unlockedMedals: Medal[];
  lockedMedals: Medal[];
  nextMedal: Medal | null;
  progressToNext: number; // 0 to 100
  secondsRemainingToNext: number;
  unlockedCount: number;
  totalCount: number;
}

/**
 * Calculates unlocked medals, next medal, and progress towards it
 */
export const calculateMedalsProgress = (totalSeconds: number): MedalsProgressResult => {
  const safeSeconds = Math.max(0, totalSeconds || 0);

  const unlockedMedals: Medal[] = [];
  const lockedMedals: Medal[] = [];

  for (const medal of MEDALS) {
    if (safeSeconds >= medal.requiredSeconds) {
      unlockedMedals.push(medal);
    } else {
      lockedMedals.push(medal);
    }
  }

  const nextMedal = lockedMedals.length > 0 ? lockedMedals[0] : null;

  let progressToNext = 100;
  let secondsRemainingToNext = 0;

  if (nextMedal) {
    // Find the threshold of the previous medal
    const prevIndex = MEDALS.findIndex((m) => m.id === nextMedal.id) - 1;
    const prevThreshold = prevIndex >= 0 ? MEDALS[prevIndex].requiredSeconds : 0;
    const span = nextMedal.requiredSeconds - prevThreshold;
    const progressInSpan = Math.max(0, safeSeconds - prevThreshold);

    progressToNext = Math.min(100, Math.max(0, Math.round((progressInSpan / span) * 100)));
    secondsRemainingToNext = Math.max(0, nextMedal.requiredSeconds - safeSeconds);
  }

  return {
    totalSeconds: safeSeconds,
    unlockedMedals,
    lockedMedals,
    nextMedal,
    progressToNext,
    secondsRemainingToNext,
    unlockedCount: unlockedMedals.length,
    totalCount: MEDALS.length,
  };
};
