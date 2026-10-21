import { useState } from 'react';
import { Archive, Clock, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  useActiveQuoteStories,
  useArchiveQuoteStory,
  useDeleteQuoteStory,
  quoteStoryHoursLeft,
  type QuoteStory,
} from '@/hooks/useQuoteStories';
import { backgroundPresets, fontOptions } from '@/components/quotes/quotePresets';

interface QuoteStoryCirclesProps {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/** 24-hour quote story circles shown on a user's profile, with a fullscreen viewer. */
export const QuoteStoryCircles = ({ userId, displayName, avatarUrl }: QuoteStoryCirclesProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: stories = [] } = useActiveQuoteStories(userId);
  const archiveStory = useArchiveQuoteStory();
  const deleteStory = useDeleteQuoteStory();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!stories.length) return null;

  const isOwn = user?.id === userId;
  const current = stories.find((s) => s.id === openId) ?? null;

  const renderCard = (s: QuoteStory) => {
    if (s.image_url) {
      return <img src={s.image_url} alt="" className="w-full h-full object-contain bg-black" />;
    }
    const bg = backgroundPresets.find((b) => b.id === s.style?.background) ?? backgroundPresets[0];
    const font = fontOptions.find((f) => f.id === s.style?.fontFamily) ?? fontOptions[0];
    return (
      <div className="w-full h-full flex items-center justify-center p-8" style={{ background: bg.css }}>
        <p
          className="whitespace-pre-wrap break-words text-center"
          style={{ fontFamily: font.family, color: bg.textColor, fontSize: 22, lineHeight: 1.7 }}
        >
          “{s.text}”
        </p>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1">
        {stories.map((s) => {
          const hours = quoteStoryHoursLeft(s);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpenId(s.id)}
              className="flex flex-col items-center gap-1 shrink-0 group"
            >
              <div className="rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-primary to-amber-700 group-hover:scale-105 transition-transform">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-background bg-secondary flex items-center justify-center">
                  {s.image_url ? (
                    <img src={s.image_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xs text-muted-foreground px-1 line-clamp-2">{s.text.slice(0, 24)}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                {s.archived ? (
                  <Archive className="h-2.5 w-2.5" />
                ) : (
                  <>
                    <Clock className="h-2.5 w-2.5" />
                    {hours}{t('hoursShort')}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden bg-black border-border">
          {current && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary shrink-0">
                    {avatarUrl && <img src={avatarUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{displayName || ''}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {current.archived
                        ? t('storyKept')
                        : `${t('storyExpiresIn')} ${quoteStoryHoursLeft(current)}${t('hoursShort')}`}
                    </p>
                  </div>
                </div>
                {isOwn && (
                  <div className="flex items-center gap-1">
                    {!current.archived && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                        disabled={archiveStory.isPending}
                        onClick={async () => {
                          try {
                            await archiveStory.mutateAsync(current.id);
                            toast({ title: t('storyKept') });
                          } catch {
                            toast({ title: t('ocrFailed'), variant: 'destructive' as any });
                          }
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {t('keepForever')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-destructive hover:text-destructive"
                      disabled={deleteStory.isPending}
                      onClick={async () => {
                        try {
                          await deleteStory.mutateAsync(current.id);
                          setOpenId(null);
                          toast({ title: t('storyDeleted') });
                        } catch {
                          toast({ title: t('ocrFailed'), variant: 'destructive' as any });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="aspect-square w-full">{renderCard(current)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
