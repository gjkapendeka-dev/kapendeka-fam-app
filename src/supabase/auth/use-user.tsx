'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../client';
import { useRouter, usePathname } from 'next/navigation';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load selected profile ID from localStorage (only in browser)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('kapendeka_profile_id') : null
  );

  const switchProfile = useCallback(() => {
    localStorage.removeItem('kapendeka_profile_id');
    setSelectedProfileId(null);
    setProfile(null);
    router.push('/select-profile');
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!selectedProfileId) {
      if (pathname !== '/login' && pathname !== '/select-profile') {
        router.push('/select-profile');
      }
      setLoading(false);
      return;
    }

    // Fetch the specific selected profile
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', selectedProfileId).single();
      if (data) {
        setProfile(data);
      } else {
        // Invalid profile ID, clear it
        switchProfile();
      }
      setLoading(false);
    }
    fetchProfile();

    const channel = supabase.channel(`public:profiles:id=eq.${selectedProfileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${selectedProfileId}` },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedProfileId, pathname, router, switchProfile]);

  // Provide a method to manually set the profile after PIN success
  const selectProfile = (id: string) => {
    localStorage.setItem('kapendeka_profile_id', id);
    setSelectedProfileId(id);
  };

  return { user, profile, loading, switchProfile, selectProfile };
}
