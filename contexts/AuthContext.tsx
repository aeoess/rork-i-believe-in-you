import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Builder, Karma, getBuilderProfile, getKarma } from '@/lib/database';

const ONBOARDING_KEY = 'ibelieveinyou_onboarding_completed';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  builderProfile: Builder | null;
  karma: Karma | null;
  hasCompletedOnboarding: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: (isCreator: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [builderProfile, setBuilderProfile] = useState<Builder | null>(null);
  const [karma, setKarma] = useState<Karma | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    console.log('Fetching user data for:', userId);
    const [profile, userKarma] = await Promise.all([
      getBuilderProfile(userId),
      getKarma(userId),
    ]);
    setBuilderProfile(profile);
    setKarma(userKarma);
    
    const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY + '_' + userId);
    setHasCompletedOnboarding(onboardingCompleted === 'true');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setBuilderProfile(null);
          setKarma(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    console.log('Signing up user:', email);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      console.log('Sign up error:', error.message);
      setLoading(false);
      return { error: error.message };
    }

    if (data.user) {
      setHasCompletedOnboarding(false);
    }

    setLoading(false);
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Signing in user:', email);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Sign in error:', error.message);
      setLoading(false);
      return { error: error.message };
    }

    setLoading(false);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBuilderProfile(null);
    setKarma(null);
  }, []);

  const completeOnboarding = useCallback(async (isCreator: boolean) => {
    if (!user) return;
    
    console.log('Completing onboarding, isCreator:', isCreator);
    await AsyncStorage.setItem(ONBOARDING_KEY + '_' + user.id, 'true');
    setHasCompletedOnboarding(true);
    
    const { updateBuilderProfile } = await import('@/lib/database');
    await updateBuilderProfile(user.id, { is_creator: isCreator });
    await refreshProfile();
  }, [user, refreshProfile]);

  return {
    user,
    session,
    loading,
    builderProfile,
    karma,
    hasCompletedOnboarding,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
    refreshProfile,
  };
});
