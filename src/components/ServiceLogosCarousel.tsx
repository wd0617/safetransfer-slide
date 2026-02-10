import { useEffect, useRef } from 'react';
import { ServiceLogo } from '../lib/supabase';

interface ServiceLogosCarouselProps {
  logos: ServiceLogo[];
}

export default function ServiceLogosCarousel({ logos }: ServiceLogosCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logos.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }

      container.scrollLeft = scrollPosition;
    };

    const animationId = setInterval(scroll, 20);

    return () => clearInterval(animationId);
  }, [logos.length]);

  if (logos.length === 0) return null;

  const duplicatedLogos = [...logos, ...logos];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-hidden"
        style={{ scrollBehavior: 'auto' }}
      >
        {duplicatedLogos.map((logo, idx) => (
          <div
            key={`${logo.id}-${idx}`}
            className="bg-white rounded-xl p-5 flex flex-col items-center justify-center min-w-[160px] h-32 flex-shrink-0 shadow-lg"
          >
            <img
              src={logo.url}
              alt={logo.name}
              className="max-h-16 max-w-full object-contain mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="text-sm font-bold text-slate-700 truncate w-full text-center">{logo.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
