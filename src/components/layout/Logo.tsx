import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBranding } from '@/hooks/useBranding';

export const Logo = () => {
  const { t } = useLanguage();
  const { name, logoUrl } = useBranding();

  return (
    <Link to="/" className="flex shrink-0 items-center gap-3 group">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-primary/30">
        <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="hidden sm:flex flex-col shrink-0">
        <span className="text-xl font-bold text-gradient leading-tight whitespace-nowrap">{name}</span>
        <span className="text-[10px] text-muted-foreground/70 tracking-wider whitespace-nowrap">{t('librarySubtitle')}</span>
      </div>
    </Link>
  );
};
