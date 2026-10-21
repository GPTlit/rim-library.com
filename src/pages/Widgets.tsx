import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Sun, Moon, Smartphone } from 'lucide-react';
import mascotIdle from '@/assets/mascot-idle.png';
import mascotReading from '@/assets/mascot-reading.png';
import mascotSleeping from '@/assets/mascot-sleeping.png';
import mascotAngry from '@/assets/mascot-angry.png';
import mascotCelebrating from '@/assets/mascot-celebrating.png';
import mascotDrinking from '@/assets/mascot-drinking.png';

type MascotState = 'idle' | 'reading' | 'sleeping' | 'angry' | 'celebrating' | 'drinking';

const MASCOTS: Record<MascotState, string> = {
  idle: mascotIdle,
  reading: mascotReading,
  sleeping: mascotSleeping,
  angry: mascotAngry,
  celebrating: mascotCelebrating,
  drinking: mascotDrinking,
};

const MOOD_LABELS: Record<MascotState, { ar: string; en: string; fr: string }> = {
  idle: { ar: 'عادي', en: 'Idle', fr: 'Normal' },
  reading: { ar: 'يقرأ', en: 'Reading', fr: 'Lecture' },
  sleeping: { ar: 'نائم', en: 'Sleeping', fr: 'Dort' },
  angry: { ar: 'غاضب', en: 'Angry', fr: 'Fâché' },
  celebrating: { ar: 'يحتفل', en: 'Celebrating', fr: 'Célèbre' },
  drinking: { ar: 'يشرب القهوة', en: 'Drinking coffee', fr: 'Boit un café' },
};

interface WidgetDef {
  key: string;
  title: { ar: string; en: string; fr: string };
  subtitle: { ar: string; en: string; fr: string };
  size: 'small' | 'medium' | 'large';
  progress?: number;
}

const WIDGETS: WidgetDef[] = [
  { key: 'resume', title: { ar: 'متابعة القراءة', en: 'Continue Reading', fr: 'Reprendre la lecture' }, subtitle: { ar: 'كتابك ينتظرك', en: 'Your book is waiting', fr: 'Votre livre vous attend' }, size: 'large', progress: 42 },
  { key: 'daily', title: { ar: 'كتاب اليوم', en: 'Daily Book', fr: 'Livre du jour' }, subtitle: { ar: 'اكتشاف جديد كل يوم', en: 'A new pick every day', fr: 'Une nouveauté chaque jour' }, size: 'medium' },
  { key: 'discover', title: { ar: 'اكتشف', en: 'Discover', fr: 'Découvrir' }, subtitle: { ar: 'كتب قد تعجبك', en: 'Books you may like', fr: 'Livres à découvrir' }, size: 'medium' },
  { key: 'collection', title: { ar: 'مكتبتي', en: 'My Collection', fr: 'Ma collection' }, subtitle: { ar: '12 كتاباً', en: '12 books', fr: '12 livres' }, size: 'medium' },
  { key: 'quote', title: { ar: 'اقتباس اليوم', en: 'Quote of the Day', fr: 'Citation du jour' }, subtitle: { ar: 'القهوة والكتب رفيقان لا يفترقان', en: 'Coffee and books are inseparable companions', fr: 'Café et livres sont inséparables' }, size: 'medium' },
  { key: 'streak', title: { ar: 'وقت القراءة', en: 'Reading Time', fr: 'Temps de lecture' }, subtitle: { ar: '5 ساعات للقراءة اليوم', en: '5h left to read today', fr: '5h pour lire aujourd’hui' }, size: 'small' },
  { key: 'minimal', title: { ar: 'قهوة', en: 'QAHWA', fr: 'QAHWA' }, subtitle: { ar: '', en: '', fr: '' }, size: 'small' },
];

const SIZE_CLASS: Record<WidgetDef['size'], string> = {
  small: 'h-28',
  medium: 'h-40',
  large: 'h-48',
};

const WidgetCard = ({
  def,
  mood,
  night,
  language,
}: {
  def: WidgetDef;
  mood: MascotState;
  night: boolean;
  language: 'ar' | 'en' | 'fr';
}) => {
  const [frame, setFrame] = useState(0);

  // Duolingo-style pseudo animation: gentle bob + frame pulse every 2.4s
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 2400);
    return () => clearInterval(id);
  }, []);

  const bg = night
    ? 'linear-gradient(135deg, #1a0f0a 0%, #2B1B14 55%, #3a2418 100%)'
    : 'linear-gradient(135deg, #6F4E37 0%, #8f6a4b 55%, #C8A27C 100%)';
  const cream = '#F5EBDD';
  const latte = night ? '#C8A27C' : '#F5EBDD';

  return (
    <div
      className={cn('relative w-full rounded-2xl overflow-hidden shadow-xl border border-border/40 p-4 flex flex-col justify-between transition-all duration-500', SIZE_CLASS[def.size])}
      style={{ background: bg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate" style={{ color: cream, fontSize: def.size === 'small' ? 13 : 15 }}>
            {def.title[language]}
          </p>
          {def.subtitle[language] && (
            <p className="mt-1 line-clamp-2" style={{ color: latte, fontSize: def.size === 'small' ? 11 : 12.5, opacity: 0.9 }}>
              {def.subtitle[language]}
            </p>
          )}
        </div>
        <img
          src={MASCOTS[mood]}
          alt={MOOD_LABELS[mood][language]}
          className="shrink-0 drop-shadow-lg transition-transform duration-700"
          style={{
            width: def.size === 'small' ? 40 : 64,
            height: def.size === 'small' ? 40 : 64,
            objectFit: 'contain',
            transform: `translateY(${frame % 2 === 0 ? 0 : -4}px) rotate(${frame === 1 ? -3 : frame === 3 ? 3 : 0}deg)`,
          }}
        />
      </div>
      {typeof def.progress === 'number' && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full" style={{ background: '#2B1B14' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${def.progress}%`, background: latte }} />
          </div>
          <p className="mt-1 text-[11px]" style={{ color: cream }}>{def.progress}% · 126 / 300</p>
        </div>
      )}
      {def.key === 'streak' && (
        <p className="text-[12px] font-semibold" style={{ color: cream }}>37 min</p>
      )}
    </div>
  );
};

const Widgets = () => {
  const { t, language } = useLanguage();
  const [mood, setMood] = useState<MascotState>('idle');
  const [night, setNight] = useState(false);

  const moods = useMemo(() => Object.keys(MASCOTS) as MascotState[], []);

  return (
    <Layout>
      <div className="container-library py-10 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-3">
            <Smartphone className="h-3.5 w-3.5" />
            {t('widgetsBadge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{t('widgetsTitle')}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{t('widgetsSubtitle')}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setNight(false)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors', !night ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            >
              <Sun className="h-3.5 w-3.5" /> {t('widgetDay')}
            </button>
            <button
              type="button"
              onClick={() => setNight(true)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors', night ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            >
              <Moon className="h-3.5 w-3.5" /> {t('widgetNight')}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {moods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-colors',
                  mood === m ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                <img src={MASCOTS[m]} alt="" className="h-5 w-5 object-contain" />
                {MOOD_LABELS[m][language]}
              </button>
            ))}
          </div>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WIDGETS.map((w) => (
            <WidgetCard key={w.key} def={w} mood={mood} night={night} language={language} />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">{t('widgetsHint')}</p>
      </div>
    </Layout>
  );
};

export default Widgets;
