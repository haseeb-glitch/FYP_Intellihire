import { useState, useEffect, useRef } from 'react';

export function useImagePreloader(totalFrames, getUrl) {
  const [state, setState] = useState({
    images: [],
    loaded: false,
    progress: 0,
  });

  const cacheRef = useRef([]);

  useEffect(() => {
    let loadedCount = 0;
    const images = new Array(totalFrames);
    let cancelled = false;

    const BATCH_SIZE = 20;

    const loadBatch = (startIndex) => {
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

    loadBatch(0);
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
