"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Direction } from "radix-ui";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppProvidersProps = {
  dir: "rtl" | "ltr";
  children: React.ReactNode;
};

export function AppProviders({ dir, children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <Direction.Provider dir={dir}>
        <NuqsAdapter>
          <TooltipProvider delayDuration={150}>
            {children}
            <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} dir={dir} />
          </TooltipProvider>
        </NuqsAdapter>
      </Direction.Provider>
    </ThemeProvider>
  );
}
