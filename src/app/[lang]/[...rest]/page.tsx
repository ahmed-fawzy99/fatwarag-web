import { notFound } from "next/navigation";

/** Never a real page, so there's no App Shell to validate for instant navigation. */
export const instant = false;

/** Unknown paths render the localized not-found page instead of Next's default one. */
export default function CatchAllPage() {
  notFound();
}
