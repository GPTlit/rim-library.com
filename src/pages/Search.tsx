import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Loader2, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { BookCard } from '@/components/books/BookCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchBooks } from '@/hooks/useBooks';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const { data: searchData, isLoading } = useSearchBooks(query);
  const results = searchData?.books || [];
  const suggestion = searchData?.suggestion;
  const hasFuzzyMatches = searchData?.hasFuzzyMatches;

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleApplySuggestion = (suggestedText: string) => {
    setSearchQuery(suggestedText);
    navigate(`/search?q=${encodeURIComponent(suggestedText)}`);
  };

  return (
    <Layout>
      <div className="section-padding font-tajawal">
        <div className="container-library">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pr-5 pl-32 text-lg shadow-sm rounded-2xl border-border/80 focus-visible:ring-primary"
              />
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl h-10 px-5 gap-2"
              >
                <SearchIcon className="h-4 w-4" />
                {t('search')}
              </Button>
            </div>
          </form>

          {/* "Did you mean?" Suggestion banner */}
          {query && suggestion && (
            <div className="max-w-2xl mx-auto mb-8 p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">
                  {language === 'ar' ? 'هل تقصد:' : language === 'fr' ? 'Vouliez-vous dire :' : 'Did you mean:'}
                </span>
                <span className="font-bold text-foreground">«{suggestion}»</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleApplySuggestion(suggestion)}
              >
                {language === 'ar' ? 'البحث عن هذا' : 'Search for this'}
              </Button>
            </div>
          )}

          {/* Results Header */}
          {query && (
            <div className="mb-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {t('searchResults')} "{query}"
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? t('searching') : `${t('resultsFound')} ${results.length} ${t('result')}`}
                </p>
              </div>

              {hasFuzzyMatches && results.length > 0 && (
                <p className="text-xs text-primary flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {language === 'ar'
                      ? 'تم تطبيق البحث التقريبي الذكي وتصحيح الأخطاء الإملائية تلقائياً'
                      : 'Smart typo-tolerant fuzzy matching active'}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && results && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-16 max-w-md mx-auto">
              <SearchIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground/40" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('noResultsFound')}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                {t('tryDifferentWords')}
              </p>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  {t('backToHome')}
                </Button>
              </Link>
            </div>
          )}

          {/* Initial State - No Query */}
          {!query && (
            <div className="text-center py-16 max-w-md mx-auto">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground/40" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('searchOurLibrary')}
              </h2>
              <p className="text-muted-foreground text-sm">
                ابحث عن أي كتاب، رواية، أو كاتب. يتعرف محرك البحث التلقائي على الكلمات القريبة والأخطاء الإملائية.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;
