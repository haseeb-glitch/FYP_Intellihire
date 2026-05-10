'use client';

import { useState, useEffect, useRef } from 'react';

interface PreloaderState {
  images: HTMLImageElement[];
  loaded: boolean;
  progress: number;
}

export function useImagePreloader(
  totalFrames: number,
  getUrl: (index: number) => string
): PreloaderState {
  const [state, setState] = useState<PreloaderState>({
    images: [],
    loaded: false,
    progress: 0,
  });

  const cacheRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(totalFrames);
    let cancelled = false;

    const BATCH_SIZE = 20;

    const loadBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + BATCH_SIZE, totalFrames);

      for (let i = startIndex; i < endIndex; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.src = getUrl(i);

        img.onload = () => {
          if (cancelled) return;
          images[i] = img;
          loadedCount++;
          const progress = loadedCount / totalFrames;

          setState((prev) => ({
            ...prev,
            progress,
            loaded: loadedCount >= totalFrames,
            images: loadedCount >= totalFrames ? images : prev.images,
          }));

          // Load next batch when halfway through current
          if (i === startIndex + Math.floor(BATCH_SIZE / 2) && endIndex < totalFrames) {
            loadBatch(endIndex);
          }
        };

        img.onerror = () => {
          if (cancelled) return;
          loadedCount++;
          images[i] = new Image();
        };
      }
    };

    // Start first batch immediately
    loadBatch(0);
    // Also kick off a second batch right away
    if (totalFrames > BATCH_SIZE) {
      setTimeout(() => loadBatch(BATCH_SIZE), 100);
    }

    cacheRef.current = images;

    return () => {
      cancelled = true;
    };
  }, [totalFrames, getUrl]);

  return state;
}
