export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'mythic';

export interface Medal {
  id: string;
  title: string;
  tagline: string;
  description: string;
  quote: string;
  requiredSeconds: number; // in seconds
  tier: MedalTier;
  tierName: string;
  iconName: 'spark' | 'book' | 'compass' | 'shield' | 'scroll' | 'sun';
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
    requiredSeconds: 300, // 5 minutes
    tier: 'bronze',
    tierName: 'برونزي',
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
    requiredSeconds: 1800, // 30 minutes
    tier: 'silver',
    tierName: 'فضي',
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
    requiredSeconds: 5400, // 1.5 hours
    tier: 'gold',
    tierName: 'ذهبي',
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
    requiredSeconds: 14400, // 4 hours
    tier: 'platinum',
    tierName: 'بلاتيني',
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
    requiredSeconds: 28800, // 8 hours
    tier: 'ruby',
    tierName: 'ياقوتي',
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
    requiredSeconds: 54000, // 15 hours
    tier: 'mythic',
    tierName: 'أسطوري',
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
];

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
