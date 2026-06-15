"use client";

import { Suspense } from "react";
import { useInteractionTracker } from "@/hooks/use-interaction-tracker";

function TrackerInner() {
  useInteractionTracker();
  return null;
}

export function InteractionTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
