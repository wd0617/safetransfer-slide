import { useEffect, useState } from 'react';
import { MediaItem, VideoPause, supabase } from '../lib/supabase';
import VideoPlayer from './VideoPlayer';

interface MediaCarouselProps {
  items: MediaItem[];
}

function getYouTubeEmbedUrl(url: string): string {
  const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (videoIdMatch) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${videoIdMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1`;
  }
  return url;
}

export default function MediaCarousel({ items }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoPauses, setVideoPauses] = useState<Record<string, VideoPause[]>>({});

  useEffect(() => {
    loadVideoPauses();
  }, [items]);

  async function loadVideoPauses() {
    const videoItems = items.filter(item => item.type === 'video');
    const pausesMap: Record<string, VideoPause[]> = {};

    for (const item of videoItems) {
      const { data } = await supabase
        .from('video_pauses')
        .select('*')
        .eq('media_item_id', item.id)
        .eq('is_active', true)
        .order('pause_at_seconds');

      if (data) {
        pausesMap[item.id] = data;
      }
    }

    setVideoPauses(pausesMap);
  }

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];

    if (currentItem.type === 'video' && videoPauses[currentItem.id]?.length > 0) {
      return;
    }

    const duration = (currentItem.duration_seconds || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, items, videoPauses]);

  function handleVideoEnd() {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 bg-black/30 rounded-xl overflow-hidden">
        {currentItem.type === 'image' ? (
          <img
            src={currentItem.url}
            alt="Promoción"
            className="w-full h-full object-contain"
          />
        ) : currentItem.type === 'youtube' ? (
          <iframe
            src={getYouTubeEmbedUrl(currentItem.url)}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <VideoPlayer
            url={currentItem.url}
            pauses={videoPauses[currentItem.id] || []}
            onVideoEnd={handleVideoEnd}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-yellow-400'
                  : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
