import type { Book } from '@/hooks/useBooks';

export interface SearchResultItem {
  book: Book;
  score: number;
  isFuzzyMatch: boolean;
  matchField: 'title' | 'author' | 'category' | 'description';
}

export interface FuzzySearchResult {
  books: Book[];
  suggestion: string | null;
  hasFuzzyMatches: boolean;
}

/**
 * Normalizes text for typo-tolerant searching across Arabic and Latin scripts.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove latin diacritics
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove Arabic tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا') // normalize Arabic alifs
    .replace(/ة/g, 'ه') // normalize taa marbuta
    .replace(/ى/g, 'ي') // normalize alif maqsura
    .replace(/ؤ/g, 'و') // normalize hamza on waw
    .replace(/ئ/g, 'ي') // normalize hamza on yaa
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // replace punctuation/symbols with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips Arabic definite article (ال) if present.
 */
export function stripArabicDefiniteArticle(word: string): string {
  if (word.startsWith('ال') && word.length > 3) {
    return word.slice(2);
  }
  return word;
}

/**
 * Damerau-Levenshtein distance calculation (supports transposition of adjacent characters).
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const bChar = b.charAt(i - 1);
      const aChar = a.charAt(j - 1);

      if (bChar === aChar) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        let cost = matrix[i - 1][j - 1] + 1; // substitution
        cost = Math.min(cost, matrix[i][j - 1] + 1); // insertion
        cost = Math.min(cost, matrix[i - 1][j] + 1); // deletion

        // Transposition
        if (
          i > 1 &&
          j > 1 &&
          b.charAt(i - 1) === a.charAt(j - 2) &&
          b.charAt(i - 2) === a.charAt(j - 1)
        ) {
          cost = Math.min(cost, matrix[i - 2][j - 2] + 1);
        }

        matrix[i][j] = cost;
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Evaluates similarity between a single query token and a target word token.
 */
function evaluateTokenSimilarity(rawQueryToken: string, rawTargetToken: string) {
  const qt = rawQueryToken;
  const tt = rawTargetToken;
  const qtNoAl = stripArabicDefiniteArticle(qt);
  const ttNoAl = stripArabicDefiniteArticle(tt);

  // 1. Exact match
  if (qt === tt || qtNoAl === ttNoAl) {
    return { match: true, score: 320, isFuzzy: false };
  }

  // 2. Prefix match (e.g. "Around U" -> "Around Us", where "u" is a prefix of "us")
  if (tt.startsWith(qt) || ttNoAl.startsWith(qtNoAl)) {
    const ratio = Math.min(qt.length, tt.length) / Math.max(qt.length, tt.length);
    return { match: true, score: Math.round(220 + 80 * ratio), isFuzzy: ratio < 0.9 };
  }

  // 3. Target word prefix of query token (e.g. target is "alchem" and query is "alchemist")
  if (tt.length >= 3 && qt.startsWith(tt)) {
    return { match: true, score: 200, isFuzzy: true };
  }

  // 4. Typo tolerance (Levenshtein distance)
  const len = Math.max(qtNoAl.length, ttNoAl.length);
  if (len >= 3) {
    const maxAllowed = len <= 4 ? 1 : len <= 7 ? 2 : 3;
    const dist = Math.min(editDistance(qt, tt), editDistance(qtNoAl, ttNoAl));
    if (dist <= maxAllowed) {
      const score = Math.max(80, Math.round(260 - dist * 60));
      return { match: true, score, isFuzzy: true, dist };
    }
  }

  return { match: false, score: 0, isFuzzy: false };
}

/**
 * Searches a list of books using full typo-tolerant fuzzy matching.
 */
export function searchBooksFuzzy(books: Book[], rawQuery: string): FuzzySearchResult {
  const query = rawQuery.trim();
  if (!query) {
    return { books: [], suggestion: null, hasFuzzyMatches: false };
  }

  const normQuery = normalizeSearchText(query);
  const queryTokens = normQuery.split(' ').filter(Boolean);

  if (!queryTokens.length) {
    return { books: [], suggestion: null, hasFuzzyMatches: false };
  }

  const scoredResults: SearchResultItem[] = [];
  let topSuggestion: string | null = null;
  let highestScore = 0;
  let hasFuzzyMatches = false;

  for (const book of books) {
    const normTitle = normalizeSearchText(book.title);
    const normAuthor = normalizeSearchText(book.author);
    const normDesc = normalizeSearchText(book.description);
    const normCat = normalizeSearchText(book.category);

    const titleTokens = normTitle.split(' ').filter(Boolean);
    const authorTokens = normAuthor.split(' ').filter(Boolean);

    let score = 0;
    let matchField: SearchResultItem['matchField'] = 'title';
    let isFuzzy = false;

    // 1. Direct whole-phrase matches
    if (normTitle === normQuery) {
      score += 1600;
      matchField = 'title';
    } else if (normTitle.startsWith(normQuery)) {
      score += 1100;
      matchField = 'title';
    } else if (normTitle.includes(normQuery)) {
      score += 850;
      matchField = 'title';
    }

    if (normAuthor === normQuery) {
      score += 1300;
      matchField = 'author';
    } else if (normAuthor.startsWith(normQuery)) {
      score += 950;
      matchField = 'author';
    } else if (normAuthor.includes(normQuery)) {
      score += 750;
      matchField = 'author';
    }

    // 2. Token-by-token evaluation across title, author, and category
    let titleTokenMatches = 0;
    let authorTokenMatches = 0;
    let categoryTokenMatches = 0;

    for (const qt of queryTokens) {
      let bestTitleTokenScore = 0;
      let titleFuzzy = false;

      for (const tt of titleTokens) {
        const res = evaluateTokenSimilarity(qt, tt);
        if (res.match && res.score > bestTitleTokenScore) {
          bestTitleTokenScore = res.score;
          titleFuzzy = res.isFuzzy;
        }
      }

      let bestAuthorTokenScore = 0;
      let authorFuzzy = false;

      for (const at of authorTokens) {
        const res = evaluateTokenSimilarity(qt, at);
        if (res.match && res.score > bestAuthorTokenScore) {
          bestAuthorTokenScore = res.score;
          authorFuzzy = res.isFuzzy;
        }
      }

      if (bestTitleTokenScore > 0) {
        score += bestTitleTokenScore * 1.5;
        titleTokenMatches++;
        if (titleFuzzy) isFuzzy = true;
      } else if (bestAuthorTokenScore > 0) {
        score += bestAuthorTokenScore * 1.2;
        authorTokenMatches++;
        if (authorFuzzy) isFuzzy = true;
      } else if (normCat.includes(qt) || normDesc.includes(qt)) {
        score += 120;
        categoryTokenMatches++;
      }
    }

    const totalTokenMatches = titleTokenMatches + authorTokenMatches + categoryTokenMatches;

    // Bonus for matching all query tokens
    if (totalTokenMatches >= queryTokens.length) {
      score += 400;
    } else if (totalTokenMatches > 0 && queryTokens.length > 1) {
      // Partial token match penalty
      score *= (totalTokenMatches / queryTokens.length) * 0.45;
    }

    // Threshold score to qualify as a relevant result
    if (score >= 170) {
      if (isFuzzy) hasFuzzyMatches = true;

      scoredResults.push({
        book,
        score,
        isFuzzyMatch: isFuzzy,
        matchField,
      });

      if (score > highestScore) {
        highestScore = score;
        // If query was slightly different or typoed, set suggestion to actual title or author
        if (normTitle !== normQuery && normTitle.length > 0) {
          topSuggestion = book.title;
        } else if (normAuthor !== normQuery && normAuthor.length > 0) {
          topSuggestion = book.author;
        }
      }
    }
  }

  // Sort results by score in descending order
  scoredResults.sort((a, b) => b.score - a.score);

  // If top suggestion is essentially the same as query, don't show suggestion
  if (topSuggestion && normalizeSearchText(topSuggestion) === normQuery) {
    topSuggestion = null;
  }

  return {
    books: scoredResults.map((r) => r.book),
    suggestion: topSuggestion,
    hasFuzzyMatches,
  };
}
