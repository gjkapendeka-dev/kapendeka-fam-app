'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useRouter, usePathname } from 'next/navigation';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  selectProfile: (id: string) => void;
  switchProfile: () => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load selected profile ID from localStorage
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Sync on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSelectedProfileId(localStorage.getItem('kapendeka_profile_id'));
    }
  }, []);

  const switchProfile = useCallback(() => {
    localStorage.removeItem('kapendeka_profile_id');
    setSelectedProfileId(null);
    setProfile(null);
    router.push('/select-profile');
  }, [router]);

  const selectProfile = useCallback((id: string) => {
    localStorage.setItem('kapendeka_profile_id', id);
    setSelectedProfileId(id);
  }, []);

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
    // If not hydrated yet (SSR), wait
    if (typeof window === 'undefined') return;

    if (!user) {
      if (!loading && pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    if (!selectedProfileId) {
      if (pathname !== '/login' && pathname !== '/select-profile') {
        router.push('/select-profile');
      }
      if (pathname === '/select-profile' || pathname === '/login') {
        setLoading(false);
      }
      return;
    }

    // Fetch the specific selected profile
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', selectedProfileId).single();
      if (data) {
        const d = data as any;
        // Normalize properties for backwards compatibility
        if (d.family_id && !d.familyId) d.familyId = d.family_id;
        if (d.familyId && !d.family_id) d.family_id = d.familyId;
        if (d.display_name && !d.displayName) d.displayName = d.display_name;
        if (d.displayName && !d.display_name) d.display_name = d.displayName;
        
        setProfile(d);
      } else {
        // Invalid profile ID, clear it
        switchProfile();
      }
      setLoading(false);
    }
    fetchProfile();

    const channel = supabase.channel(`public:profiles:id=eq.${selectedProfileId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${selectedProfileId}` },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            if (data.family_id && !data.familyId) data.familyId = data.family_id;
            if (data.familyId && !data.family_id) data.family_id = data.familyId;
            if (data.display_name && !data.displayName) data.displayName = data.display_name;
            if (data.displayName && !data.display_name) data.display_name = data.displayName;
            setProfile(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedProfileId, pathname, router, switchProfile, loading]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, profile, loading, selectProfile, switchProfile }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
}

export function useUserContext() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useUserContext must be used within a SupabaseProvider');
  }
  return { 
    user: context.user, 
    profile: context.profile, 
    loading: context.loading, 
    selectProfile: context.selectProfile,
    switchProfile: context.switchProfile
  };
}
