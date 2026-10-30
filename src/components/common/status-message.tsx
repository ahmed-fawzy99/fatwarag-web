import type { LucideIcon } from "lucide-react";

type StatusMessageProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: "neutral" | "error";
  children?: React.ReactNode;
};

/** Shared shell for empty, limit and error states. */
export function StatusMessage({ icon: Icon, title, body, tone = "neutral", children }: StatusMessageProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center">
      <span className={tone === "error" ? "rounded-full bg-destructive/10 p-3 text-destructive" : "rounded-full bg-accent p-3 text-accent-foreground"}>
        <Icon className="size-6" />
      </span>
      <h2 className="text-lg font-semibold text-balance">{title}</h2>
      <p className="max-w-md text-ink-soft">{body}</p>
      {children}
    </section>
  );
}
