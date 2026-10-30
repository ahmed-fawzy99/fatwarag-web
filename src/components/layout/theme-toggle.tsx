"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  darkLabel: string;
  lightLabel: string;
};

export function ThemeToggle({ darkLabel, lightLabel }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button variant="outline" size="icon" className="size-9 rounded-full text-ink-soft" onClick={toggle}>
      <MoonIcon className="size-4 dark:hidden" />
      <SunIcon className="hidden size-4 dark:block" />
      <span className="sr-only dark:hidden">{darkLabel}</span>
      <span className="sr-only hidden dark:inline">{lightLabel}</span>
    </Button>
  );
}
