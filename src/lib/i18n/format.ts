/** Replace {name} placeholders in a dictionary string. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * Picks the plural form for `count` (Arabic has one/two/few/many/other) and fills {count} with localized digits.
 * e.g. ar: 10 → «١٠ فتاوى», 11 → «١١ فتوى».
 */
export function formatPlural(forms: PluralForms, count: number, locale: string, countLabel: string): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return format(forms[rule] ?? forms.other, { count: countLabel });
}
