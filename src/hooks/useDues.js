import { useState, useEffect, useCallback } from 'react';
import { getDuesByUser } from '../services/firestoreService';

export const useDues = () => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDuesByUser();
      setDues(data);
    } catch (err) {
      console.error('Error fetching dues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const refresh = () => {
    return fetchDues();
  };

  return {
    dues,
    loading,
    error,
    refresh,
  };
};