import { NextResponse } from "next/server";
import { getTafsir } from "@/lib/data-access/foundations";

/** A verse's tafsir passages, fetched when its Explain panel first opens. Not found → 404; API trouble → 502. */
export async function GET(_request: Request, { params }: RouteContext<"/api/tafsir/[surah]/[ayah]">) {
  const { surah, ayah } = await params;
  const surahNumber = Number(surah);
  const ayahNumber = Number(ayah);
  if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) {
    return NextResponse.json({ error: { code: "validation", message: "Invalid verse." } }, { status: 422 });
  }

  try {
    const entry = await getTafsir(surahNumber, ayahNumber);
    if (!entry) return NextResponse.json({ error: { code: "not_found", message: "No tafsir for this verse." } }, { status: 404 });
    return NextResponse.json(entry.texts, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: { code: "unavailable", message: "The tafsir couldn't be loaded." } }, { status: 502 });
  }
}
