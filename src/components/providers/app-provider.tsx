"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Global } from "@emotion/react";
import NextTopLoader from "nextjs-toploader";
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
      <NextTopLoader
        color="#3182f6"
        height={3}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow={false}
      />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EmotionRegistry>
  );
}
