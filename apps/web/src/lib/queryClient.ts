import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false, // Prevent conflicts with useAutoLogout
      retry: 1,
    },
  },
});

// We only create the persister on the client side
export const persister = typeof window !== 'undefined' 
  ? createSyncStoragePersister({
      storage: window.localStorage,
    })
  : undefined;
