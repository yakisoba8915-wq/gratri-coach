"use client";

import { useCallback, useEffect, useState } from "react";

export function useSupabaseData<T>(loader: () => Promise<T>): [T | undefined, () => Promise<void>] {
  const [data, setData] = useState<T>();
  const refresh = useCallback(async () => {
    const nextData = await loader();
    setData(nextData);
  }, [loader]);

  useEffect(() => {
    void refresh();
    const handleStorage = () => void refresh();
    window.addEventListener("gratri-storage", handleStorage);
    return () => window.removeEventListener("gratri-storage", handleStorage);
  }, [refresh]);

  return [data, refresh];
}
