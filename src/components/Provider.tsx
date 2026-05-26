"use client";

import { useRef } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Provider({ children }: { children: React.ReactNode }) {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30 * 1000, retry: 1 },
      },
    })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient.current}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
