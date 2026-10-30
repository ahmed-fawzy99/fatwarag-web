"use client";

import { RotateCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RetryButton({ label }: { label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(() => router.refresh());
  }

  return (
    <Button variant="outline" onClick={retry} disabled={isPending}>
      <RotateCwIcon className={isPending ? "animate-spin" : undefined} />
      {label}
    </Button>
  );
}
