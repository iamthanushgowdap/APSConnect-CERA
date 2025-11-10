"use client";

import { SimpleRotatingSpinner } from "@/components/ui/loading-spinners";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="text-center space-y-4">
        <SimpleRotatingSpinner className="h-12 w-12 text-primary mx-auto" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
