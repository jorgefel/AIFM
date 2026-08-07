import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function useHeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ properties: [], reservations: [], expenses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await api.get(`/search/?q=${encodeURIComponent(query)}`);
          setResults(data);
          setShowResults(true);
        } catch {
          // search error
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults({ properties: [], reservations: [], expenses: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults = results.properties.length > 0 || results.reservations.length > 0 || results.expenses.length > 0;

  return {
    query,
    setQuery,
    results,
    isSearching,
    showResults,
    setShowResults,
    hasResults
  };
}
