'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../client';

export function useDoc<T = any>(queryBuilder: any | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!queryBuilder) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        const { data, error } = await queryBuilder.single();
        if (error) throw error;
        setData(data);
      } catch (err: any) {
        // Postgrest returns error if no rows found for single(), handle it gracefully
        if (err.code === 'PGRST116') {
          setData(null);
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    let tableName = "";
    try {
      if (queryBuilder.url) {
        const urlParts = queryBuilder.url.pathname.split('/');
        tableName = urlParts[urlParts.length - 1];
      }
    } catch (e) {}

    let channel: any = null;
    if (tableName) {
       channel = supabase.channel(`public:${tableName}_doc-${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
          fetchData(); // refetch on change
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryBuilder]);

  return { data, loading, error };
}
