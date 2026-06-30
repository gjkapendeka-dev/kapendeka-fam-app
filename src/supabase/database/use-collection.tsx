'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { PostgrestFilterBuilder, PostgrestTransformBuilder } from '@supabase/postgrest-js';

export function useCollection<T = any>(queryBuilder: any | null) {
  const [data, setData] = useState<T[] | null>(null);
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
        const { data, error } = await queryBuilder;
        if (error) throw error;
        setData(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // In a real app we'd parse the queryBuilder to create a channel subscription.
    // For this migration, we'll just subscribe to the table if possible, or rely on manual refetches.
    // Since we don't have the table name easily extracted from the builder without hacks, 
    // we'll fetch once for now. A more robust implementation would extract the table name.
    
    // Attempt to extract table name from URL of the queryBuilder if possible
    let tableName = "";
    try {
      if (queryBuilder.url) {
        const urlParts = queryBuilder.url.pathname.split('/');
        tableName = urlParts[urlParts.length - 1];
      }
    } catch (e) {}

    let channel: any = null;
    if (tableName) {
       channel = supabase.channel(`public:${tableName}-${Math.random()}`)
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
