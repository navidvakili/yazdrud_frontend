// ============================================================
// VideoPlayer — پخش ویدیو با video.js
// ============================================================
// الگوی امن برای React + video.js:
// ۱) عنصر <video> را به‌صورت دستوری می‌سازیم (نه تحت مدیریت React)،
//    بنابراین dispose() عنصرِ React را از DOM حذف نمی‌کند.
// ۲) کانتینر React نباید ویژگی `data-vjs-player` داشته باشد؛ این ویژگی
//    باعث می‌شود video.js خودِ کانتینر را به‌عنوان عنصر پخش‌کننده بگیرد
//    و هنگام dispose() آن را از DOM حذف کند (در StrictMode کانتینر
//    جدا می‌شود و در اجرای دومِ اثر، بازیکن روی عنصر جدا ساخته می‌شود).

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoPlayer.css';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  src: string;
  /** نوع MIME (مثلاً video/mp4) — برای آدرس‌های stream بدون پسوند لازم است */
  type?: string;
  /** کلاس روی ظرف (سایزدهی) — پیش‌فرض پر کردن والد */
  className?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  type,
  className,
  autoPlay = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // عنصر ویدیو را خودمان می‌سازیم تا video.js آن را مدیریت کند
    const videoEl = document.createElement('video');
    videoEl.className = 'video-js vjs-big-play-centered';
    videoEl.setAttribute('playsinline', '');
    container.appendChild(videoEl);

    const player = videojs(videoEl, {
      controls: true,
      autoplay: autoPlay,
      preload: 'metadata',
      fluid: false,
      rtl: true,
      sources: [{ src, ...(type ? { type } : {}) }],
    });
    playerRef.current = player;

    // اطمینان از پر شدن کامل ظرف (علاوه بر قانون CSS با !important)
    player.ready(() => {
      const el = player.el() as HTMLElement;
      el.style.width = '100%';
      el.style.height = '100%';
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      // در صورت باقی‌ماندن عنصر (مثلاً خطای init)، آن را پاک می‌کنیم
      if (videoEl.parentNode === container) {
        container.removeChild(videoEl);
      }
    };
  }, [src, type, autoPlay]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
