/** One step of a breadcrumb trail; a crumb without `href` has no page of its own (e.g. «القرآن»). */
export type Crumb = { label: string; href?: string };
