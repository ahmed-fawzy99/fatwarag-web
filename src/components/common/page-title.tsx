type PageTitleProps = {
  title: string;
  subtitle?: string | null;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
};

/** Shared page heading: optional eyebrow (breadcrumb), title, subtitle and actions. */
export function PageTitle({ title, subtitle, eyebrow, children }: PageTitleProps) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow && <div className="text-sm text-muted-foreground">{eyebrow}</div>}
      <h1 className="text-2xl leading-snug font-bold text-balance">{title}</h1>
      {subtitle && <p className="max-w-2xl text-ink-soft">{subtitle}</p>}
      {children}
    </header>
  );
}
