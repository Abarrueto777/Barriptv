'use client';

import { useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';
import type Mpegts from 'mpegts.js';
import type { StreamKind, Profile } from '@/types/catalog';
import { getProgress, saveProgress, clearProgress, type ResumeMeta } from '@/lib/resume';

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  kind?: StreamKind;
  /** When set (VOD only), playback position is remembered and resumed (scoped to this profile). */
  resume?: ResumeMeta;
  profile?: Profile;
  /** Show a brief on-screen channel-name banner when the source changes (live TV zapping). */
  channelOsd?: boolean;
}

interface IosVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

const MAX_RECOVER = 4;

function formatTime(seconds: number): string {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function VideoPlayer({ streamUrl, title, kind = 'file', resume, profile = 'adults', channelOsd = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [resumedFrom, setResumedFrom] = useState<number | null>(null);
  const [osdVisible, setOsdVisible] = useState(false);

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
        return;
      }
      const container = containerRef.current;
      if (container?.requestFullscreen) {
        // Fullscreen the CONTAINER (not the bare <video>) so our overlays (channel
        // name, resume banner) are visible while fullscreen.
        void container.requestFullscreen().catch(() => {});
      } else {
        (videoRef.current as IosVideo | null)?.webkitEnterFullscreen?.();
      }
    } catch {
      /* ignore */
    }
  }

  // "f" toggles fullscreen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Briefly show the channel name when the source changes (and on open) for live TV.
  useEffect(() => {
    if (!channelOsd) return;
    const show = setTimeout(() => setOsdVisible(true), 0);
    const hide = setTimeout(() => setOsdVisible(false), 3500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [streamUrl, channelOsd]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(false);
    let hls: Hls | null = null;
    let mpegtsPlayer: Mpegts.Player | null = null;
    let cancelled = false;
    let hasPlayed = false;
    let recoverAttempts = 0;

    const onPlaying = () => {
      hasPlayed = true;
      recoverAttempts = 0;
      setError(false);
    };
    const onVideoError = () => {
      if (!hasPlayed) setError(true);
    };
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onVideoError);

    // --- Resume / continue-watching (VOD only) ---
    let lastSaved = 0;
    const onLoadedMeta = () => {
      if (!resume) return;
      const p = getProgress(profile, resume.id);
      if (p && p.time > 0 && (!video.duration || p.time < video.duration - 30)) {
        video.currentTime = p.time;
        setResumedFrom(p.time);
      }
    };
    const onTimeUpdate = () => {
      if (!resume) return;
      const now = video.currentTime;
      if (Math.abs(now - lastSaved) >= 5) {
        lastSaved = now;
        saveProgress(profile, resume, now, video.duration);
      }
    };
    const onEnded = () => {
      if (resume) clearProgress(profile, resume.id);
    };
    if (resume) {
      video.addEventListener('loadedmetadata', onLoadedMeta);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', onEnded);
    }

    if (kind === 'mpegts') {
      import('mpegts.js').then(({ default: mpegts }) => {
        if (cancelled || !videoRef.current || !mpegts.isSupported()) return;
        mpegtsPlayer = mpegts.createPlayer(
          { type: 'mpegts', isLive: true, url: streamUrl, cors: true },
          { enableStashBuffer: true, stashInitialSize: 1024 * 384, liveBufferLatencyChasing: false }
        );
        const onMpegtsError = () => {
          // Ignore errors if this player was cancelled (unmounted).
          if (cancelled) return;
          if (hasPlayed && recoverAttempts < MAX_RECOVER) {
            recoverAttempts++;
            try {
              mpegtsPlayer?.unload();
              mpegtsPlayer?.load();
              Promise.resolve(mpegtsPlayer?.play()).catch(() => {});
            } catch {
              setError(true);
            }
          } else {
            setError(true);
          }
        };
        mpegtsPlayer.on(mpegts.Events.ERROR, onMpegtsError);
        mpegtsPlayer.attachMediaElement(videoRef.current);
        mpegtsPlayer.load();
        Promise.resolve(mpegtsPlayer.play()).catch(() => {});
      });
    } else if (kind === 'hls') {
      (async () => {
        let src = streamUrl;
        try {
          const res = await fetch(streamUrl, { redirect: 'follow' });
          if (res.ok && res.url) src = res.url;
          res.body?.cancel().catch(() => {});
        } catch {
          /* fall back to original URL */
        }
        if (cancelled || !videoRef.current) return;
        const v = videoRef.current;

        if (v.canPlayType('application/vnd.apple.mpegurl') !== '') {
          v.src = src;
          return;
        }

        const { default: HlsLib } = await import('hls.js');
        if (cancelled || !videoRef.current || !HlsLib.isSupported()) return;
        hls = new HlsLib({
          lowLatencyMode: false,
          // Larger buffers ride out short network dips on slow connections.
          maxBufferLength: 60,
          maxMaxBufferLength: 180,
          backBufferLength: 30,
        });
        hls.on(HlsLib.Events.ERROR, (_event, data) => {
          if (!data.fatal || !hls) return;
          if (recoverAttempts >= MAX_RECOVER) {
            setError(true);
            return;
          }
          if (data.type === HlsLib.ErrorTypes.NETWORK_ERROR) {
            recoverAttempts++;
            hls.startLoad();
          } else if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR) {
            recoverAttempts++;
            hls.recoverMediaError();
          } else {
            setError(true);
          }
        });
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
      })();
    } else {
      video.src = streamUrl;
    }

    return () => {
      cancelled = true;
      if (resume && video.duration) {
        saveProgress(profile, resume, video.currentTime, video.duration);
      }
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onVideoError);
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      if (hls) hls.destroy();
      if (mpegtsPlayer) mpegtsPlayer.destroy();
    };
  }, [streamUrl, kind, resume, profile]);

  // Auto-hide the resume banner after 10s.
  useEffect(() => {
    if (resumedFrom === null) return;
    const t = setTimeout(() => setResumedFrom(null), 10000);
    return () => clearTimeout(t);
  }, [resumedFrom]);

  function restartFromStart() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (resume) clearProgress(profile, resume.id);
    setResumedFrom(null);
    Promise.resolve(video.play()).catch(() => {});
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        controls
        autoPlay
        // Without this, iOS Safari forces every video into native fullscreen on play
        // and pauses it on exit — which broke inline playback and channel zapping on
        // iPhone. playsInline keeps it embedded so the zap controls stay reachable.
        playsInline
        controlsList="nofullscreen"
        onDoubleClick={toggleFullscreen}
        title={title}
        className="h-full w-full"
      />

      {/* Channel-name banner (live TV zapping) — visible over the container in fullscreen. */}
      {channelOsd && osdVisible && (
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/75 px-4 py-2 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="text-base font-semibold text-white">{title}</span>
        </div>
      )}

      {/* Single fullscreen button (container-based, so overlays show). Native one is hidden.
          Top-right so it doesn't invade the playback control bar. */}
      <button
        onClick={toggleFullscreen}
        title="Pantalla completa (f)"
        aria-label="Pantalla completa"
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition hover:bg-black/80 focus:opacity-100 group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>

      {resumedFrom !== null && (
        <div className="absolute bottom-16 left-4 flex items-center gap-3 rounded-lg bg-black/80 px-4 py-2 text-sm backdrop-blur">
          <span className="text-zinc-200">Reanudando desde {formatTime(resumedFrom)}</span>
          <button
            onClick={restartFromStart}
            className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-white transition hover:bg-white/20"
          >
            Empezar de nuevo
          </button>
          <button onClick={() => setResumedFrom(null)} className="text-zinc-400 hover:text-white" aria-label="Cerrar">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center">
          <p className="font-semibold text-white">No se pudo reproducir</p>
          <p className="max-w-md text-sm text-zinc-400">
            El canal o título puede estar fuera de línea, o usar un formato (MPEG-2, HEVC) que el
            navegador no puede decodificar. Probá con otro.
          </p>
        </div>
      )}
    </div>
  );
}
