"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Global } from "@emotion/react";
import { EmotionRegistry } from "./emotion-registry";
import { globalStyles } from "@/styles/global-styles";

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <EmotionRegistry>
      <Global styles={globalStyles} />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EmotionRegistry>
  );
}
