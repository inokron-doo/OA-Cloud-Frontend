import { useCallback, useRef, useState } from "react";

const SYNTHETIC_MOUSE_WINDOW_MS = 700;

export function useTouchDismissTooltip() {
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const lastTouchRef = useRef(0);

  const onTouchStart = useCallback(() => {
    lastTouchRef.current = Date.now();
    setActive(undefined);
  }, []);

  const onTouchMove = useCallback(() => {
    lastTouchRef.current = Date.now();
  }, []);

  const onTouchEnd = useCallback(() => {
    lastTouchRef.current = Date.now();
    setActive(false);
  }, []);

  const onMouseMove = useCallback(() => {
    if (Date.now() - lastTouchRef.current < SYNTHETIC_MOUSE_WINDOW_MS) return;
    setActive((prev) => (prev === false ? undefined : prev));
  }, []);

  const onMouseLeave = useCallback(() => {
    if (Date.now() - lastTouchRef.current < SYNTHETIC_MOUSE_WINDOW_MS) return;
    setActive(false);
  }, []);

  return {
    active,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseMove, onMouseLeave },
  };
}
