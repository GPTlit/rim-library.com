import { useMemo, useState, useEffect } from 'react';
import { useBooks, Book } from '@/hooks/useBooks';
import { useBookStats } from '@/hooks/useBookStats';
import { useRecentlyViewedIds } from '@/hooks/useRecentlyViewed';
import { getReadingHistory } from '@/lib/storage';
import { allCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ScoredRecommendation {
  book: Book;
  score: number;
  matchingCategories: string[];
  matchedAuthor: boolean;
  reason?: string;
}

export interface UseRecommendedBooksResult {
  recommendations: ScoredRecommendation[];
  books: Book[];
  topCategoryNames: string[];
  hasPersonalizedHistory: boolean;
  isLoading: boolean;
}

export const useRecommendedBooks = (limit = 10): UseRecommendedBooksResult => {
  const { t, language } = useLanguage();
  const { data: books = [], isLoading } = useBooks();
  const { data: statsMap } = useBookStats();
  const recentlyViewedIds = useRecentlyViewedIds();

  // Re-read history on local storage changes / window focus
  const [historyTick, setHistoryTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setHistoryTick((v) => v + 1);
    window.addEventListener('recently-viewed-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('recently-viewed-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const result = useMemo(() => {
    // Reference historyTick to ensure recalculation when storage/history updates
    void historyTick;

    if (!books.length) {
      return {
        recommendations: [],
        books: [],
        topCategoryNames: [],
        hasPersonalizedHistory: false,
        isLoading,
      };
    }

    const booksMap = new Map<string, Book>(books.map((b) => [b.id, b]));
    const history = getReadingHistory();

    // Collect all interaction IDs
    const historyBookIds = history.map((h) => h.bookId).filter(Boolean);
    const interactedIds = new Set<string>([...recentlyViewedIds, ...historyBookIds]);
    const hasPersonalizedHistory = interactedIds.size > 0;

    // Build category and author affinity scores
    const categoryScores = new Map<string, number>();
    const authorScores = new Map<string, number>();

    // 1. Weight by reading history (considers both order and duration)
    history.forEach((item, index) => {
      const book = booksMap.get(item.bookId);
      if (!book) return;

      // Recency weight: newest read gets higher weight
      const recencyMultiplier = Math.max(1, 5 - index * 0.2);
      // Duration bonus: up to +4 points for books read > 15 minutes
      const durationBonus = Math.min(4, ((item.totalSecondsRead || 0) / 300));
      const totalWeight = recencyMultiplier + durationBonus;

      if (book.category) {
        categoryScores.set(book.category, (categoryScores.get(book.category) || 0) + totalWeight);
      }
      if (Array.isArray(book.categories)) {
        book.categories.forEach((cat) => {
          categoryScores.set(cat, (categoryScores.get(cat) || 0) + totalWeight * 0.7);
        });
      }
      if (book.author) {
        authorScores.set(book.author, (authorScores.get(book.author) || 0) + totalWeight);
      }
    });

    // 2. Weight by recently viewed books
    recentlyViewedIds.forEach((id, index) => {
      const book = booksMap.get(id);
      if (!book) return;

      const viewWeight = Math.max(1, 3 - index * 0.15);
      if (book.category) {
        categoryScores.set(book.category, (categoryScores.get(book.category) || 0) + viewWeight);
      }
      if (Array.isArray(book.categories)) {
        book.categories.forEach((cat) => {
          categoryScores.set(cat, (categoryScores.get(cat) || 0) + viewWeight * 0.6);
        });
      }
      if (book.author) {
        authorScores.set(book.author, (authorScores.get(book.author) || 0) + viewWeight * 0.8);
      }
    });

    // Extract top categories for display
    const sortedCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    const topCategoryNames = sortedCategories.slice(0, 3).map((slug) => {
      const match = allCategories.find((c) => c.name === slug);
      if (!match) return slug;
      const transKey = `category_${match.name}`;
      const translated = t(transKey);
      return translated !== transKey ? translated : match.nameAr;
    });

    // 3. Score candidate books (prioritizing books not yet read/opened)
    const candidatePool = books.filter((b) => !interactedIds.has(b.id));
    const scoredList: ScoredRecommendation[] = [];

    // Helper to score a book
    const scoreBook = (candidate: Book): ScoredRecommendation => {
      let score = 0;
      const matchingCategories: string[] = [];
      let matchedAuthor = false;

      // Primary category match (weight 3x)
      if (candidate.category && categoryScores.has(candidate.category)) {
        const catAffinity = categoryScores.get(candidate.category)!;
        score += catAffinity * 3;
        matchingCategories.push(candidate.category);
      }

      // Secondary tags / categories match (weight 1.8x)
      if (Array.isArray(candidate.categories)) {
        candidate.categories.forEach((c) => {
          if (categoryScores.has(c)) {
            score += categoryScores.get(c)! * 1.8;
            if (!matchingCategories.includes(c)) matchingCategories.push(c);
          }
        });
      }

      // Author affinity match (weight 2.5x)
      if (candidate.author && authorScores.has(candidate.author)) {
        score += authorScores.get(candidate.author)! * 2.5;
        matchedAuthor = true;
      }

      // Community quality bonus (average rating)
      if (statsMap && statsMap.has(candidate.id)) {
        const stats = statsMap.get(candidate.id)!;
        if (stats.avgRating > 0) {
          score += stats.avgRating * 0.6;
        }
      }

      // Reason generation
      let reason: string | undefined;
      if (matchedAuthor && matchingCategories.length > 0) {
        const catObj = allCategories.find((c) => c.name === matchingCategories[0]);
        const catName = catObj?.nameAr || matchingCategories[0];
        reason = language === 'ar'
          ? `مؤلف مفضل وقسم ${catName}`
          : `Favorite author & ${catObj?.name || matchingCategories[0]}`;
      } else if (matchingCategories.length > 0) {
        const catObj = allCategories.find((c) => c.name === matchingCategories[0]);
        const catName = catObj?.nameAr || matchingCategories[0];
        reason = language === 'ar' ? `بناءً على اهتمامك بـ ${catName}` : `Based on interest in ${catObj?.name || matchingCategories[0]}`;
      } else if (matchedAuthor) {
        reason = language === 'ar' ? `لنفس مؤلف كتاب قرأته` : `From an author you read`;
      }

      return {
        book: candidate,
        score,
        matchingCategories,
        matchedAuthor,
        reason,
      };
    };

    if (hasPersonalizedHistory) {
      // Score all unread/unviewed candidates
      candidatePool.forEach((b) => {
        const scored = scoreBook(b);
        if (scored.score > 0) {
          scoredList.push(scored);
        }
      });

      // Sort by score descending
      scoredList.sort((a, b) => b.score - a.score);
    }

    // 4. Fallback / Enrichment: If recommendations are fewer than requested limit,
    // fill in with diverse top-rated books so the section is always rich and complete
    if (scoredList.length < limit) {
      const existingIds = new Set(scoredList.map((s) => s.book.id));
      const fallbackCandidates = books
        .filter((b) => !existingIds.has(b.id))
        .sort((a, b) => {
          const ratingA = statsMap?.get(a.id)?.avgRating || 0;
          const ratingB = statsMap?.get(b.id)?.avgRating || 0;
          return ratingB - ratingA;
        });

      for (const fb of fallbackCandidates) {
        if (scoredList.length >= limit) break;
        scoredList.push({
          book: fb,
          score: 1,
          matchingCategories: fb.categories || [fb.category],
          matchedAuthor: false,
          reason: language === 'ar' ? 'من الأكثر شعبية في المكتبة' : 'Popular in Library',
        });
      }
    }

    const finalRecommendations = scoredList.slice(0, limit);
    return {
      recommendations: finalRecommendations,
      books: finalRecommendations.map((r) => r.book),
      topCategoryNames,
      hasPersonalizedHistory,
      isLoading,
    };
  }, [books, recentlyViewedIds, historyTick, statsMap, language, t, limit, isLoading]);

  return result;
};
