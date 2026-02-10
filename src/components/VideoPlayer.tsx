import { useEffect, useRef, useState } from 'react';
import { VideoPause } from '../lib/supabase';

interface VideoPlayerProps {
  url: string;
  pauses: VideoPause[];
  onVideoEnd?: () => void;
  className?: string;
}

export default function VideoPlayer({ url, pauses, onVideoEnd, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentOverlay, setCurrentOverlay] = useState<string | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [processedPauses, setProcessedPauses] = useState<Set<string>>(new Set());
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activePauses = pauses
    .filter(p => p.is_active && p.overlay_image_url)
    .sort((a, b) => a.pause_at_seconds - b.pause_at_seconds);

  useEffect(() => {
    setProcessedPauses(new Set());
    setShowOverlay(false);
    setCurrentOverlay(null);
    setPausedAt(null);

    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activePauses.length === 0) return;

    const checkPauses = () => {
      if (!video || video.paused || showOverlay) return;

      const currentTime = video.currentTime;

      for (const pause of activePauses) {
        const pauseId = `${pause.id}-${pause.pause_at_seconds}`;

        if (processedPauses.has(pauseId)) continue;

        if (currentTime >= pause.pause_at_seconds && currentTime < pause.pause_at_seconds + 0.5) {
          video.pause();
          setPausedAt(currentTime);
          setCurrentOverlay(pause.overlay_image_url);
          setShowOverlay(true);
          setProcessedPauses(prev => new Set([...prev, pauseId]));

          overlayTimerRef.current = setTimeout(() => {
            setShowOverlay(false);
            setCurrentOverlay(null);

            setTimeout(() => {
              if (video && pausedAt !== null) {
                video.currentTime = pausedAt;
                video.play().catch(err => console.error('Error resuming video:', err));
                setPausedAt(null);
              }
            }, 100);
          }, pause.display_duration_seconds * 1000);

          break;
        }
      }
    };

    checkIntervalRef.current = setInterval(checkPauses, 100);

    const handleEnded = () => {
      if (onVideoEnd) onVideoEnd();
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('ended', handleEnded);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [activePauses, showOverlay, pausedAt, processedPauses, onVideoEnd]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (showOverlay) {
        video.pause();
      }
    };

    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('play', handlePlay);
    };
  }, [showOverlay]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={url}
        autoPlay
        muted
        className={className}
        playsInline
      />

      {showOverlay && currentOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <img
            src={currentOverlay}
            alt="Overlay"
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            Mostrando contenido...
          </div>
        </div>
      )}
    </div>
  );
}
