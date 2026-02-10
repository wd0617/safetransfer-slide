import { Announcement } from '../lib/supabase';
import { Megaphone } from 'lucide-react';

interface AnnouncementTickerProps {
  announcements: Announcement[];
}

export default function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) {
    return null;
  }

  const fullText = announcements
    .map(a => `${a.title ? a.title + ' - ' : ''}${a.message}`)
    .join('  •  ');

  const repeatedText = `${fullText}  •  ${fullText}  •  ${fullText}`;

  return (
    <div
      className="rounded-xl py-5 px-4 shadow-xl border overflow-hidden"
      style={{
        background: `linear-gradient(to right, var(--color-primary-dark), var(--color-primary))`,
        borderColor: 'var(--color-border)'
      }}
    >
      <div className="flex items-center gap-3">
        <Megaphone className="w-6 h-6 flex-shrink-0 animate-pulse" style={{ color: 'var(--color-secondary)' }} />
        <div className="flex-1 overflow-hidden">
          <div className="animate-scroll whitespace-nowrap">
            <span className="text-lg font-semibold inline-block" style={{ color: 'var(--color-text)' }}>
              {repeatedText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
