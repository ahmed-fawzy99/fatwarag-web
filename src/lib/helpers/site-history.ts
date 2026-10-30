/**
 * Whether the previous history entry is a page of this site, so a back control can use the browser's history.
 * Pages opened in a new tab (source links) have no such entry.
 */

/** In-site URLs visited in this tab, oldest first; the fallback where the Navigation API is missing. */
const visited: string[] = [];

/** Records a client-side page view (called on every route change). */
export function recordVisit(url: string): void {
  if (visited.at(-2) === url) visited.pop();
  else if (visited.at(-1) !== url) visited.push(url);
}

type NavigationLike = { currentEntry: { index: number } | null };

export function canGoBackInSite(): boolean {
  // The Navigation API lists only this origin's entries, so any entry before the current one is on this site.
  const navigation = (window as Window & { navigation?: NavigationLike }).navigation;
  if (navigation?.currentEntry && navigation.currentEntry.index >= 0) return navigation.currentEntry.index > 0;
  if (visited.length > 1) return true;
  // A full page load from another page of this site (same tab).
  try {
    return window.history.length > 1 && document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}
