import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type ShrinkOnScroll = {
  scrolled: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function useShrinkOnScroll(threshold = 40): ShrinkOnScroll {
  const [scrolled, setScrolled] = useState(false);
  const frame = useRef<number | null>(null);
  const last = useRef<boolean>(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (frame.current != null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const next = y > threshold;
        if (next !== last.current) {
          last.current = next;
          setScrolled(next);
        }
      });
    },
    [threshold],
  );

  return { scrolled, onScroll };
}
