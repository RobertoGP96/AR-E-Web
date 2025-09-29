import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: (failureCount: number, error: Error) => {
        if (error instanceof Error && error.message.includes("404")) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: "online",
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: "online",
      onError: (error: Error) => {
        console.error("Mutation error:", error)
      },
    },
  },
})

export const queryKeys = {
  all: ["admin"] as const,
} as const
