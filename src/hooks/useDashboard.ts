import { useState, useEffect, useCallback } from "react";
import { GET as getDashboard } from "@api/dashboard";
import type { DashboardData } from "@api/dashboard";

export interface UseDashboardOptions {
  pollInterval?: number;
}

export function useDashboard(options?: UseDashboardOptions) {
  const { pollInterval } = options ?? {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDashboard();
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch dashboard");
      }
      setData(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    const id = setInterval(refetch, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
