"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
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
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
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
      <SessionProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SessionProvider>
    </EmotionRegistry>
  );
}
