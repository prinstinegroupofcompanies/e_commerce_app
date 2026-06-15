"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerRegister />
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
