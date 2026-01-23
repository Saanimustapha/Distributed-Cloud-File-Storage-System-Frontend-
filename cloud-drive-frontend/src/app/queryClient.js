import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
