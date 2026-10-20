import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mascot from '@/assets/mascot-idle.png';

export function QahwaNotificationBar() {
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const receive = (event: Event) => {
      setNotice((event as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(null), 7000);
    };
    window.addEventListener('qahwa-notification', receive);
    return () => { clearTimeout(timer); window.removeEventListener('qahwa-notification', receive); };
  }, []);
  if (!notice) return null;
  return <aside role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 w-[calc(100%-2rem)] max-w-md bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-3">
    <img src={mascot} alt="" width={48} height={48} className="shrink-0" />
    <div className="min-w-0 flex-1"><p className="font-semibold text-sm flex gap-2 items-center"><Bell className="h-3.5 w-3.5 shrink-0 text-primary" />{notice.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{notice.body}</p></div>
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Close notification" onClick={() => setNotice(null)}><X className="h-4 w-4" /></Button>
  </aside>;
}