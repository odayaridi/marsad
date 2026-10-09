import { useEffect, useMemo, useState } from 'react';

/** Simulates network latency so loading skeletons are part of the experience. */
export function useSimulatedLoad(ms = 450, deps = []) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}

export function usePaged(rows, pageSize = 10, resetKey) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safe = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((safe - 1) * pageSize, safe * pageSize), [rows, safe, pageSize]);
  return { page: safe, setPage, pages, slice, total: rows.length, pageSize };
}

export function useLocalPref(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem('marsad.pref.' + key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('marsad.pref.' + key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [key, v]);
  return [v, setV];
}
