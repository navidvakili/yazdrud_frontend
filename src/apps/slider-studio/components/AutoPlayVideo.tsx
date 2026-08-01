import { useEffect, useRef } from 'react';
import { resolveStorageUrl } from '@/src/shared-utils';

/**
 * AutoPlayVideo — video element that reliably plays only while `playing` is true.
 *
 * React does not always reflect the `muted` attribute to the DOM, and a
 * browser blocks autoplay for any "unmuted" video, leaving it frozen on
 * the first frame. This component force-sets `muted` as a DOM property and
 * calls `play()` whenever the source changes or `playing` becomes true, so
 * videos only play in the studio canvas while the timeline is running and
 * in the live preview while it is playing.
 */
export default function AutoPlayVideo({
  src,
  className,
  playing = true,
  startFromZero = true,
}: {
  src: string;
  className?: string;
  playing?: boolean;
  startFromZero?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Normalize relative/storage URLs (e.g. "media/2026/08/...mp4") so the
  // browser always gets an absolute URL pointing at the backend.
  const resolvedSrc = resolveStorageUrl(src);

  const playingRef = useRef(playing);
  playingRef.current = playing;

  // Start playback when the source becomes ready (only if still `playing`).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resolvedSrc) return;

    let cancelled = false;

    const tryPlay = () => {
      if (cancelled || !el || !playingRef.current) return;
      // `muted` must be a DOM property for the autoplay policy to accept it.
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      const p = el.play();
      if (p) p.catch(() => { /* retried by event listeners / timeouts */ });
    };

    tryPlay();
    el.addEventListener('loadedmetadata', tryPlay);
    el.addEventListener('canplay', tryPlay);

    // Fallback retries in case the events don't fire (e.g. cached source).
    const retry1 = setTimeout(tryPlay, 150);
    const retry2 = setTimeout(tryPlay, 800);

    return () => {
      cancelled = true;
      clearTimeout(retry1);
      clearTimeout(retry2);
      el.removeEventListener('loadedmetadata', tryPlay);
      el.removeEventListener('canplay', tryPlay);
    };
  }, [resolvedSrc]);

  // React to `playing` toggles: pause when stopped, restart from 0 only on a
  // fresh start (startFromZero), otherwise resume from the current position so
  // pausing and re-playing continues where the video was frozen.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resolvedSrc) return;

    if (playing) {
      if (startFromZero) {
        el.currentTime = 0;
      }
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      const p = el.play();
      if (p) p.catch(() => { /* retried by the effect above */ });
    } else {
      el.pause();
    }
  }, [playing, resolvedSrc, startFromZero]);

  if (!resolvedSrc) return null;

  return (
    <video
      ref={videoRef}
      src={resolvedSrc}
      autoPlay={playing}
      loop
      muted
      playsInline
      preload="auto"
      className={className}
    />
  );
}
