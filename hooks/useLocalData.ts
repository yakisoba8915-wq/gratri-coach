"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalData<T>(loader: () => T): [T | undefined, () => void] {
  const [data, setData] = useState<T>();
  const refresh = useCallback(() => setData(loader()), [loader]);
  useEffect(() => { refresh(); window.addEventListener("gratri-storage", refresh); return () => window.removeEventListener("gratri-storage", refresh); }, [refresh]);
  return [data, refresh];
}
