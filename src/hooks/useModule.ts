import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/api';

export function useModule(moduleId: string) {
  const [data, setData] = useState<any[]>(() => {
    return ApiService.getCachedRecords(moduleId) || [];
  });
  const [totalServerCount, setTotalServerCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = ApiService.getCachedRecords(moduleId);
    return !(cached && cached.length > 0);
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async (forceRefresh = false) => {
    // SWR Pattern: check immediate cache
    const cached = ApiService.getCachedRecords(moduleId, searchQuery);
    if (cached && cached.length > 0 && !forceRefresh) {
      setData(cached);
      setLoading(false);
    } else if (forceRefresh) {
      setLoading(true);
    }

    setError(null);
    try {
      // Parallelize: getRecords and getRecordCount in Promise.all for 2x faster network trip
      const [records, count] = await Promise.all([
        ApiService.getRecords(moduleId, searchQuery, forceRefresh),
        ApiService.getRecordCount(moduleId).catch(() => null)
      ]);

      setData(records);
      const effectiveCount = count !== null ? count : records.length;
      setTotalServerCount(effectiveCount);
      setHasMore(effectiveCount > records.length);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari basis data.');
    } finally {
      setLoading(false);
    }
  }, [moduleId, searchQuery]);

  // Trigger search / refresh on mount & query change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load Next Page (Cursor Pagination)
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await ApiService.getNextPageRecords(moduleId, 100);
      if (result.items.length > 0) {
        setData((prev) => {
          const existingIds = new Set(prev.map(i => i.id));
          const filtered = result.items.filter(i => !existingIds.has(i.id));
          return [...prev, ...filtered];
        });
      }
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.warn('Failed to load more records:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const getItemById = async (id: string) => {
    try {
      return await ApiService.getRecordById(moduleId, id);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil detail data.');
      throw err;
    }
  };

  const createItem = async (payload: any) => {
    setError(null);
    try {
      const newItem = await ApiService.createRecord(moduleId, payload);
      setData((prev) => [newItem, ...prev]);
      if (totalServerCount !== null) setTotalServerCount(totalServerCount + 1);
      return newItem;
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data.');
      throw err;
    }
  };

  const bulkImportItems = async (items: any[]) => {
    setError(null);
    try {
      const result = await ApiService.bulkCreateRecords(moduleId, items);
      await refresh(true);
      return result;
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor data massal.');
      throw err;
    }
  };

  const updateItem = async (id: string, payload: any) => {
    setError(null);
    try {
      const updatedItem = await ApiService.updateRecord(moduleId, id, payload);
      setData((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
      return updatedItem;
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui data.');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    setError(null);
    try {
      await ApiService.deleteRecord(moduleId, id);
      setData((prev) => prev.filter((item) => item.id !== id));
      if (totalServerCount !== null && totalServerCount > 0) setTotalServerCount(totalServerCount - 1);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data.');
      throw err;
    }
  };

  return {
    data,
    totalServerCount,
    loading,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    getItemById,
    createItem,
    bulkImportItems,
    updateItem,
    deleteItem
  };
}
