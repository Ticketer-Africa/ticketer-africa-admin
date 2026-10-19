import { useEffect, useState } from "react";

/**
 * Whether the page's own <h1 data-page-title> is on screen. The phone top bar
 * hides its small title while the big one is visible, like a large-title
 * navigation bar. Pages without a PageHeader always show the small title.
 */
export function usePageTitleVisible(pathname: string): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector("[data-page-title]");
      if (!heading) {
        setVisible(false);
        return;
      }
      // rootMargin only takes px/%: 48px is the sticky top bar (--top-bar-height).
      observer = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { rootMargin: "-48px 0px 0px 0px" },
      );
      observer.observe(heading);
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  return visible;
}
