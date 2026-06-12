import { useEffect, type RefObject } from "react";

export function useScrollToBottom(
  scrollContainerRef: RefObject<HTMLElement | null>,
  trigger: unknown,
  behavior: ScrollBehavior = "auto",
) {
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }, [scrollContainerRef, trigger, behavior]);
}
