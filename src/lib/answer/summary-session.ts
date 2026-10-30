import type { ReactNode } from "react";
import { track } from "@/lib/analytics/client";
import { EVENTS } from "@/lib/analytics/events";
import { createSseParser } from "@/lib/answer/sse";
import { routes } from "@/lib/config/routes";
import { loadSummaryExtras, renderSummaryEvidence } from "@/lib/data-access/summary-parts";
import type { CitationInfo, Evidence, Summary, SummaryOutcome, SummaryPart, SummaryRequest, SummaryStage } from "@/types/answer";

/** With no event (or heartbeat) for this long, the stream counts as dropped. */
const IDLE_MS = 60_000;
/** The JSON fallback writes the whole summary in one go (the server allows it 120 s). */
const FALLBACK_TIMEOUT_MS = 130_000;
/** A part waits this long for its verses and hadiths to render before it shows without them. */
const EVIDENCE_WAIT_MS = 8_000;
/** The finished summary waits this long for its cross-referenced fatwas before it shows. */
const EXTRAS_WAIT_MS = 10_000;
/** A session nobody watches is stopped after this delay (long enough to survive strict mode's remount). */
const RELEASE_DELAY_MS = 250;

export type SummarySessionState = {
  phase: "working" | "ready" | "paused" | "failed";
  stage: SummaryStage;
  /** Parts shown so far, in display order (while working). */
  parts: SummaryPart[];
  /** The authoritative summary, once ready. */
  summary: Summary | null;
  /** Server-rendered evidence, by `evidenceKey`. */
  evidence: Record<string, ReactNode>;
  /** Citation details of the cross-referenced fatwas the summary appended. */
  citations: CitationInfo;
  /** Their entries for the end of the fatwa list. */
  extras: ReactNode;
};

export const INITIAL_SUMMARY_STATE: SummarySessionState = {
  phase: "working",
  stage: "reading",
  parts: [],
  summary: null,
  evidence: {},
  citations: {},
  extras: null,
};

export function evidenceKey(evidence: Evidence[]): string {
  return JSON.stringify(evidence);
}

type SummarySections = Pick<Summary, "agreed" | "views" | "preferences" | "caution">;

function sectionParts(sections: SummarySections, where: { part?: number; partLabel?: string } = {}): SummaryPart[] {
  const parts: SummaryPart[] = [];
  if (sections.agreed) parts.push({ ...where, section: "agreed", index: 0, item: sections.agreed });
  sections.views.forEach((item, index) => parts.push({ ...where, section: "view", index, item }));
  sections.preferences.forEach((item, index) => parts.push({ ...where, section: "preference", index, item }));
  if (sections.caution) parts.push({ ...where, section: "caution", index: 0, item: sections.caution });
  return parts;
}

/**
 * A finished summary as parts, in display order (the same keys the stream used, so shown parts stay put). A question
 * in parts gives each item its part and that part's label.
 */
export function summaryParts(summary: Summary): SummaryPart[] {
  if (!summary.parts?.length) return sectionParts(summary);
  return summary.parts.flatMap((questionPart, part) => sectionParts(questionPart, { part, partLabel: questionPart.label }));
}

/** Two streamed items are the same one: the same part (if any), section and index. */
function samePlace(a: SummaryPart, b: SummaryPart): boolean {
  return a.part === b.part && a.section === b.section && a.index === b.index;
}

function partEvidence(part: SummaryPart): Evidence[] {
  return "evidence" in part.item ? part.item.evidence : [];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function within(work: Promise<unknown>, ms: number): Promise<unknown> {
  return Promise.race([work, wait(ms)]);
}

/**
 * One answer's summary, requested once. Its stream is read here, outside React, so re-renders and strict mode's
 * double effects never ask the API again (it allows an answer only 3 summaries). Parts are revealed in order,
 * each once its evidence is rendered, so nothing shifts after it appears. A broken stream falls back once to the
 * JSON endpoint; anything else ends in the "failed" note.
 */
class SummarySession {
  state: SummarySessionState = INITIAL_SUMMARY_STATE;
  private readonly listeners = new Set<() => void>();
  private readonly controller = new AbortController();
  private readonly evidenceJobs = new Map<string, Promise<void>>();
  /** Reveals run one after another, in the order the stream sent them. */
  private chain: Promise<void> = Promise.resolve();
  private started = false;
  private released = false;
  /** A `done` or `status` arrived (or the fallback took over): the stream's end is no longer a failure. */
  private settled = false;
  private releaseTimer: ReturnType<typeof setTimeout> | undefined;
  private startedAt = 0;
  private reported = false;

  constructor(
    private readonly key: string,
    private readonly request: SummaryRequest,
  ) {}

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    clearTimeout(this.releaseTimer);
    if (!this.started) {
      this.started = true;
      this.startedAt = Date.now();
      void this.run();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.releaseTimer = setTimeout(() => this.release(), RELEASE_DELAY_MS);
    };
  }

  /** Nobody is watching any more (the visitor left): stop the request unless it already finished. */
  private release() {
    if (this.listeners.size > 0 || this.isFinal()) return;
    this.released = true;
    this.controller.abort();
    if (sessions.get(this.key) === this) sessions.delete(this.key);
  }

  /** One analytics event per summary, when it settles (counts and timing only, never its text). */
  private report(phase: "ready" | "paused" | "failed") {
    if (this.reported) return;
    this.reported = true;
    const { locale, listedIds } = this.request;
    const common = { locale, duration_ms: Date.now() - this.startedAt, fatwa_count: listedIds.length };
    if (phase === "ready") track(EVENTS.summaryCompleted, { ...common, part_count: this.state.summary ? summaryParts(this.state.summary).length : this.state.parts.length });
    else track(phase === "paused" ? EVENTS.summaryPaused : EVENTS.summaryFailed, common);
  }

  private isFinal() {
    return this.state.phase !== "working";
  }

  private set(patch: Partial<SummarySessionState>) {
    this.state = { ...this.state, ...patch };
    if (patch.phase && patch.phase !== "working") this.report(patch.phase);
    for (const listener of this.listeners) listener();
  }

  private enqueue(step: () => Promise<void> | void) {
    this.chain = this.chain.then(step).catch(() => this.set({ phase: "failed" }));
  }

  private async run() {
    const { answerId, locale } = this.request;
    const idle = new AbortController();
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const touch = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => idle.abort(), IDLE_MS);
    };

    try {
      touch();
      const response = await fetch(routes.api.summaryStream(answerId, locale), {
        headers: { Accept: "text/event-stream" },
        cache: "no-store",
        signal: AbortSignal.any([this.controller.signal, idle.signal]),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
        const code = body?.error?.code;
        if (code === "budget_exhausted") return this.finish("paused");
        // Over the answer's summary limit: asking again would only be refused.
        if (code === "rate_limited") return this.finish("failed");
        return this.fallback();
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      const parse = createSseParser();
      while (!this.settled) {
        touch();
        const { done, value } = await reader.read();
        if (done) break;
        for (const event of parse(value)) this.handle(event.event, event.data);
      }
      if (this.settled) void reader.cancel().catch(() => {});
      else await this.fallback();
    } catch {
      if (!this.released) await this.fallback();
    } finally {
      clearTimeout(idleTimer);
    }
  }

  private handle(event: string, raw: string) {
    if (this.settled) return;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (event === "stage") {
      const stage = (data as { stage?: SummaryStage }).stage;
      if (stage && ["reading", "writing", "checking", "translating"].includes(stage)) this.set({ stage });
    } else if (event === "item") {
      this.reveal(data as SummaryPart);
    } else if (event === "done") {
      this.settled = true;
      this.complete(data as Summary);
    } else if (event === "status") {
      this.settled = true;
      this.finish((data as { status?: string }).status === "paused" ? "paused" : "failed");
    }
  }

  private reveal(part: SummaryPart) {
    if (!part?.item || !["agreed", "view", "preference", "caution"].includes(part.section)) return;
    this.enqueue(async () => {
      await within(this.renderEvidence(partEvidence(part)), EVIDENCE_WAIT_MS);
      if (this.isFinal()) return;
      const others = this.state.parts.filter((p) => !samePlace(p, part));
      this.set({ parts: [...others, part] });
    });
  }

  /** Swaps in the authoritative summary once its evidence and appended fatwas are ready (or have had their time). */
  private complete(raw: Summary) {
    const summary: Summary = {
      ...raw,
      views: raw.views ?? [],
      preferences: raw.preferences ?? [],
      // Stored answers of the old shape have no parts: they show as one part, as they always did.
      parts: Array.isArray(raw.parts) && raw.parts.length > 0
        ? raw.parts.map((part) => ({ ...part, views: part.views ?? [], preferences: part.preferences ?? [] }))
        : undefined,
      extraFatwaIds: raw.extraFatwaIds ?? [],
    };
    // Never a headline over an empty body: a summary with nothing answered is the failed note.
    const answered = summary.parts ? summary.parts.some((part) => part.kind !== "unanswered") : true;
    if (summaryParts(summary).length === 0 || !answered) return this.finish("failed");
    this.enqueue(async () => {
      const evidence = summaryParts(summary).map((part) => this.renderEvidence(partEvidence(part)));
      const extras = this.loadExtras(summary.extraFatwaIds);
      await within(Promise.all([...evidence, extras]), EXTRAS_WAIT_MS);
      if (!this.isFinal()) this.set({ phase: "ready", summary });
    });
  }

  private finish(phase: "paused" | "failed") {
    this.settled = true;
    this.enqueue(() => {
      if (!this.isFinal()) this.set({ phase });
    });
  }

  /** The stream broke: ask for the whole summary as JSON, once. */
  private async fallback() {
    if (this.settled) return;
    this.settled = true;
    const { answerId, locale } = this.request;
    try {
      const response = await fetch(routes.api.summary(answerId, locale), {
        cache: "no-store",
        signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(FALLBACK_TIMEOUT_MS)]),
      });
      const outcome = (await response.json()) as SummaryOutcome;
      if (outcome.status === "ready") this.complete(outcome.summary);
      else this.finish(outcome.status === "paused" ? "paused" : "failed");
    } catch {
      if (!this.released) this.finish("failed");
    }
  }

  private renderEvidence(evidence: Evidence[]): Promise<void> {
    if (evidence.length === 0) return Promise.resolve();
    const key = evidenceKey(evidence);
    let job = this.evidenceJobs.get(key);
    if (!job) {
      job = renderSummaryEvidence(this.request.locale, evidence)
        .then((node) => {
          if (node) this.set({ evidence: { ...this.state.evidence, [key]: node } });
        })
        .catch(() => {});
      this.evidenceJobs.set(key, job);
    }
    return job;
  }

  private async loadExtras(extraFatwaIds: string[]): Promise<void> {
    const { locale, question, listedIds, offset } = this.request;
    const ids = extraFatwaIds.filter((id) => !listedIds.includes(id));
    if (ids.length === 0) return;
    try {
      const extras = await loadSummaryExtras(locale, question, ids, offset);
      this.set({ citations: extras.citations, extras: extras.list });
    } catch {
      // The citations show as plain labels; the list stays as it is.
    }
  }
}

const sessions = new Map<string, SummarySession>();

function sessionKey(request: SummaryRequest): string {
  return `${request.answerId}|${request.locale}`;
}

/** The current state of an answer's summary (the initial state until someone subscribes). */
export function summarySnapshot(request: SummaryRequest): SummarySessionState {
  return sessions.get(sessionKey(request))?.state ?? INITIAL_SUMMARY_STATE;
}

/** Watches an answer's summary; the first watcher starts its one request. Browser only. */
export function subscribeSummary(request: SummaryRequest, listener: () => void): () => void {
  const key = sessionKey(request);
  let session = sessions.get(key);
  if (!session) {
    session = new SummarySession(key, request);
    sessions.set(key, session);
  }
  return session.subscribe(listener);
}
