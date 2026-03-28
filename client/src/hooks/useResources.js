import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

export function useResources({ department, year, semester, type, sort, subject, page, limit }) {
  const [data, setData] = useState({ resources: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (department) params.set('department', department);
    if (year) params.set('year', String(year));
    if (semester) params.set('semester', String(semester));
    if (type) params.set('type', type);
    if (sort) params.set('sort', sort);
    if (subject) params.set('subject', subject);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return params.toString();
  }, [department, year, semester, type, sort, subject, page, limit]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/resources?${query}`);
      setData({
        resources: res.resources || [],
        total: res.total ?? (res.resources ? res.resources.length : 0),
        totalPages: res.totalPages ?? 1,
        page: res.page ?? 1,
        limit: res.limit ?? limit ?? 50,
      });
    } catch (e) {
      setError(e);
      setData({ resources: [], total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

  useEffect(() => {
    if (!department || !year || !semester || !type) return;
    refresh();
  }, [department, year, semester, type, refresh]);

  return { ...data, loading, error, refresh };
}

export async function getResourceCount({ department, year, semester, type }) {
  const params = new URLSearchParams();
  if (department) params.set('department', department);
  if (year) params.set('year', String(year));
  if (semester) params.set('semester', String(semester));
  if (type) params.set('type', type);
  params.set('countOnly', 'true');
  const res = await api.get(`/resources?${params.toString()}`);
  return res.count ?? 0;
}
