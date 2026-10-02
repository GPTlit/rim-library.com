import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBranding } from '@/contexts/BrandingContext';

export const Logo = () => {
  const { language } = useLanguage();
  const { branding, getLibraryName, getLibrarySubtitle } = useBranding();
  
  const libraryName = getLibraryName(language);
  const librarySubtitle = getLibrarySubtitle(language);

  return (
    <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none">
      <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center shrink-0">
        {/* Main logo container */}
        <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 border-2 border-primary/40 bg-card">
          <img
            src={branding.logoUrl || '/qahwa-library-logo.jpg'}
            alt={libraryName}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Floating sparkle decoration */}
        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent/80 animate-pulse" />
      </div>
      
      {/* Brand Name & Subtitle - full size and visible on all screens */}
      <div className="flex flex-col shrink-0 justify-center">
        <span className="text-base sm:text-xl font-extrabold text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors whitespace-nowrap">
          {libraryName}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium tracking-normal whitespace-nowrap">
          {librarySubtitle}
        </span>
      </div>
    </Link>
  );
};
