/**
 * Scrolls so the element's TOP sits just below everything pinned at the top (its `scroll-margin-top`, which
 * `scroll-mt-pinned` derives from `--pinned-h`).
 *
 * Content can change height while a smooth scroll runs (the summary streaming in or settling, an accordion
 * opening or closing, a translation arriving), and the browser keeps aiming at the offset it computed at the
 * start. So once the scroll ends, the position is checked and corrected in one instant step, unless the reader
 * has started scrolling themselves.
 */
export function scrollToElement(element: HTMLElement, { instant = false }: { instant?: boolean } = {}): void {
  // "auto" follows the page's CSS scroll-behavior: smooth, or instant under prefers-reduced-motion.
  element.scrollIntoView({ block: "start", behavior: instant ? "instant" : "auto" });

  let done = false;
  const userEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const cancel = () => finish(false);
  const settle = () => finish(true);
  // Settled = the scroll has ended (scrollend, or no scroll event for a moment where scrollend is missing).
  let quiet = window.setTimeout(settle, instant ? 50 : 200);
  const onScroll = () => {
    window.clearTimeout(quiet);
    quiet = window.setTimeout(settle, 150);
  };
  const cap = window.setTimeout(settle, 2000);

  function finish(correct: boolean) {
    if (done) return;
    done = true;
    window.clearTimeout(quiet);
    window.clearTimeout(cap);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scrollend", settle);
    userEvents.forEach((type) => window.removeEventListener(type, cancel));
    if (!correct) return;
    const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    const offset = element.getBoundingClientRect().top - margin;
    if (Math.abs(offset) > 2) window.scrollBy({ top: offset, behavior: "instant" });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scrollend", settle);
  // Wait a frame so the click that started this isn't taken for the reader's own input.
  requestAnimationFrame(() => {
    if (!done) userEvents.forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
  });
}
