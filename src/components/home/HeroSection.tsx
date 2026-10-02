import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, BookOpen, Sparkles, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBooks } from '@/hooks/useBooks';
import { allCategories } from '@/hooks/useCategories';
import { searchBooksFuzzy } from '@/lib/fuzzySearch';
import GradientWaves from '@/components/GradientWaves';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { data: books } = useBooks();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close live dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const liveResults = useMemo(() => {
    if (!books || !searchQuery.trim() || searchQuery.trim().length < 2) return null;
    return searchBooksFuzzy(books, searchQuery.trim());
  }, [books, searchQuery]);

  const bookCount = books?.length || 0;

  return (
    <section className="relative z-40 bg-background font-tajawal">
      {/* Background waves - overflow hidden contained strictly inside the background layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <GradientWaves
          horizonColor="#1c0b5e"
          waveColor="#353335"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
          className="motion-reduce:hidden"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />
      </div>

      <div className="container-library relative z-40">
        <div className="flex flex-col items-center text-center py-12 sm:py-16 md:py-24 lg:py-32 px-4">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground drop-shadow-sm">{t('libraryTitle')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-12 animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            {t('discoverBooks')}
          </p>

          {/* Search Form with Elevated Translucent Fuzzy Dropdown */}
          <div ref={containerRef} className="w-full max-w-xl animate-fade-in-up px-4 relative z-50" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsFocused(true);
                  }}
                  className="h-12 sm:h-14 pr-4 sm:pr-5 pl-24 sm:pl-32 text-base sm:text-lg bg-card/90 dark:bg-card/80 backdrop-blur-md shadow-lg border-border/70 rounded-2xl focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="default"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-3 sm:px-4 rounded-xl font-bold shadow-sm"
                >
                  <Search className="h-4 sm:h-5 w-4 sm:w-5 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">{t('search')}</span>
                </Button>
              </div>
            </form>

            {/* Live Autocomplete / Typo-tolerant suggestions - Translucent glass floating above ad screen */}
            {isFocused && liveResults && liveResults.books.length > 0 && (
              <div className="absolute left-4 right-4 mt-2 bg-card/75 dark:bg-card/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 text-right z-[100] animate-in fade-in-50 zoom-in-95 ring-1 ring-black/5 dark:ring-white/10">
                {/* Did you mean suggestion */}
                {liveResults.suggestion && (
                  <div className="px-3 py-2 mb-2 bg-primary/15 hover:bg-primary/20 backdrop-blur-md border border-primary/25 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors">
                    <div className="flex items-center gap-1.5 text-foreground min-w-0">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground shrink-0">{language === 'ar' ? 'هل تقصد:' : 'Did you mean:'}</span>
                      <span className="font-bold text-primary truncate">«{liveResults.suggestion}»</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(liveResults.suggestion!);
                      }}
                      className="text-[11px] font-bold text-primary underline hover:text-primary/80 shrink-0 cursor-pointer"
                    >
                      {language === 'ar' ? 'استخدم' : 'Use'}
                    </button>
                  </div>
                )}

                {/* Top matched real books */}
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {liveResults.books.slice(0, 5).map((book) => (
                    <Link
                      key={book.id}
                      to={`/book/${book.id}`}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-card/30 hover:bg-primary/15 dark:hover:bg-white/10 backdrop-blur-xs border border-transparent hover:border-primary/20 transition-all text-right group"
                    >
                      <img
                        src={book.cover_url || '/placeholder.svg'}
                        alt={book.title}
                        className="h-12 w-9 rounded-md object-cover border border-border/60 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>

                {/* View all results button */}
                <div className="pt-2 mt-1.5 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-bold text-primary hover:bg-primary/15 backdrop-blur-xs justify-center gap-1 h-8 rounded-xl"
                    onClick={(e) => handleSearch(e)}
                  >
                    <span>{language === 'ar' ? `عرض كل النتائج (${liveResults.books.length})` : `View all results (${liveResults.books.length})`}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 animate-fade-in-up px-4" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-secondary/80 backdrop-blur-xs">
                <BookOpen className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-foreground">+{bookCount > 0 ? bookCount : 170}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('books')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-secondary/80 backdrop-blur-xs">
                <Sparkles className="h-5 sm:h-6 w-5 sm:w-6 text-amber-500" />
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-foreground">+{allCategories.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('categories')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
