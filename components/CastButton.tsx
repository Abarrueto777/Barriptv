'use client';

import { useEffect, useState } from 'react';

import type { StreamKind } from '@/types/catalog';

interface CastButtonProps {
  streamUrl: string;
  title: string;
  imageUrl?: string | null;
  /** Stream kind hint — used when the URL has no extension (e.g. our proxy URL). */
  kind?: StreamKind;
}

const CAST_SDK_BASE = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js';

function guessMimeType(url: string, kind?: StreamKind): string {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.m3u8')) return 'application/x-mpegurl';
  if (path.endsWith('.mkv')) return 'video/x-matroska';
  if (path.endsWith('.avi')) return 'video/x-msvideo';
  if (path.endsWith('.flv')) return 'video/x-flv';
  if (path.endsWith('.mp4')) return 'video/mp4';
  // No usable extension (proxy URL): fall back to the kind hint.
  if (kind === 'hls') return 'application/x-mpegurl';
  if (kind === 'file') return 'video/mp4';
  return 'video/mp2t';
}

export default function CastButton({ streamUrl, title, imageUrl, kind }: CastButtonProps) {
  const [secureContext] = useState(
    () => typeof window !== 'undefined' && window.isSecureContext
  );
  const [available, setAvailable] = useState(
    () => secureContext && Boolean(window.cast?.framework)
  );

  useEffect(() => {
    if (!secureContext || available) return;

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (!isAvailable) return;
      cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
      setAvailable(true);
    };

    if (!document.querySelector(`script[src^="${CAST_SDK_BASE}"]`)) {
      const script = document.createElement('script');
      script.src = `${CAST_SDK_BASE}?loadCastFramework=1`;
      document.head.appendChild(script);
    }
  }, [secureContext, available]);

  function sendMedia() {
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (!session) return;

    const mediaInfo = new chrome.cast.media.MediaInfo(streamUrl, guessMimeType(streamUrl, kind));
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = title;
    if (imageUrl) {
      mediaInfo.metadata.images = [new chrome.cast.Image(imageUrl)];
    }

    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    session.loadMedia(request);
  }

  function handleCast() {
    const context = cast.framework.CastContext.getInstance();
    const session = context.getCurrentSession();

    if (!session) {
      context.requestSession().then(sendMedia).catch(() => {});
      return;
    }
    sendMedia();
  }

  if (!secureContext) {
    return <p className="text-xs text-zinc-500">Cast solo disponible bajo HTTPS (o localhost).</p>;
  }
  if (!available) return null;

  return (
    <button
      onClick={handleCast}
      className="rounded bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
    >
      Enviar a Chromecast
    </button>
  );
}
