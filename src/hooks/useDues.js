import { useState, useEffect, useCallback } from 'react';
import { getDuesByUser, subscribeToDuesByUser } from '../services/firestoreService';

export const useDues = () => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDues = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getDuesByUser();
      setDues(data);
    } catch (err) {
      console.error('Error fetching dues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDuesByUser(
      (data) => {
        setDues(data);
        setError(null);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        setError(err.message || 'Failed to sync dues');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, []);

  const refresh = useCallback(() => fetchDues(), [fetchDues]);

  const removeLocalDue = useCallback((dueId) => {
    setDues((currentDues) => currentDues.filter((due) => due.id !== dueId));
  }, []);

  return {
    dues,
    loading,
    refreshing,
    error,
    refresh,
    removeLocalDue,
  };
};