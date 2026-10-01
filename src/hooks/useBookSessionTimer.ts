import { useState, useEffect, useRef, useCallback } from 'react';
import { updateBookReadingTime, getBookReadingTime, getTotalStoredReadingSeconds } from '@/lib/storage';
import { calculateMedalsProgress, formatDigitalTimer, formatReadingDurationArabic, Medal } from '@/lib/medals';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface UseBookSessionTimerOptions {
  bookId: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  active?: boolean;
}

export const useBookSessionTimer = ({
  bookId,
  title,
  author,
  coverUrl,
  active = true,
}: UseBookSessionTimerOptions) => {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalBookSeconds, setTotalBookSeconds] = useState(() => (bookId ? getBookReadingTime(bookId) : 0));
  const { data: userProfile } = useUserProfile();
  
  // Track previously unlocked medal IDs to detect newly unlocked medals during session
  const previousUnlockedRef = useRef<Set<string>>(new Set());
  const initialCheckDoneRef = useRef(false);

  // Initialize total reading seconds
  const overallSeconds = Math.max(
    userProfile?.reading_seconds || 0,
    getTotalStoredReadingSeconds() + sessionSeconds
  );

  // Initialize previous unlocked medals
  useEffect(() => {
    if (!initialCheckDoneRef.current) {
      const initialProgress = calculateMedalsProgress(overallSeconds);
      previousUnlockedRef.current = new Set(initialProgress.unlockedMedals.map((m) => m.id));
      initialCheckDoneRef.current = true;
    }
  }, [overallSeconds]);

  // Check for newly unlocked medals
  const checkForNewMedal = useCallback((currentTotalSeconds: number) => {
    const currentProgress = calculateMedalsProgress(currentTotalSeconds);
    for (const medal of currentProgress.unlockedMedals) {
      if (!previousUnlockedRef.current.has(medal.id)) {
        previousUnlockedRef.current.add(medal.id);
        toast.success(`🎉 وسام جديد! حصلت على «${medal.title}» (${medal.tierName})`, {
          description: medal.description,
          duration: 6000,
        });
      }
    }
  }, []);

  // Update totalBookSeconds when bookId changes
  useEffect(() => {
    if (bookId) {
      setTotalBookSeconds(getBookReadingTime(bookId));
    }
  }, [bookId]);

  // Main session ticker
  useEffect(() => {
    if (!bookId || !active) return;

    let uncommittedSeconds = 0;

    const interval = setInterval(() => {
      // Only count when the document is visible to the user
      if (document.visibilityState === 'visible') {
        setSessionSeconds((prev) => prev + 1);
        setTotalBookSeconds((prev) => prev + 1);
        uncommittedSeconds += 1;

        // Persist to storage every 10 seconds
        if (uncommittedSeconds >= 10) {
          updateBookReadingTime(bookId, uncommittedSeconds);
          const totalNow = getTotalStoredReadingSeconds();
          checkForNewMedal(Math.max(userProfile?.reading_seconds || 0, totalNow));
          uncommittedSeconds = 0;
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (uncommittedSeconds > 0) {
        updateBookReadingTime(bookId, uncommittedSeconds);
        const totalNow = getTotalStoredReadingSeconds();
        checkForNewMedal(Math.max(userProfile?.reading_seconds || 0, totalNow));
      }
    };
  }, [bookId, active, userProfile?.reading_seconds, checkForNewMedal]);

  const medalsProgress = calculateMedalsProgress(overallSeconds);

  return {
    sessionSeconds,
    totalBookSeconds,
    formattedSession: formatDigitalTimer(sessionSeconds),
    formattedTotalBook: formatReadingDurationArabic(totalBookSeconds),
    medalsProgress,
    overallSeconds,
  };
};
