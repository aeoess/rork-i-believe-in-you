import { supabase } from './supabase';

export interface Builder {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
}

export interface Karma {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.log('Error getting current user:', error.message);
    return null;
  }
  return user;
}

export async function getBuilderProfile(userId: string): Promise<Builder | null> {
  console.log('Fetching builder profile for user:', userId);
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('Error fetching builder profile:', error.message);
    return null;
  }

  console.log('Builder profile fetched:', data);
  return data;
}

export async function updateBuilderProfile(
  userId: string,
  updates: Partial<Pick<Builder, 'name' | 'bio' | 'avatar_url' | 'is_creator'>>
): Promise<Builder | null> {
  console.log('Updating builder profile:', userId, updates);
  const { data, error } = await supabase
    .from('builders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.log('Error updating builder profile:', error.message);
    return null;
  }

  console.log('Builder profile updated:', data);
  return data;
}

export async function getKarma(userId: string): Promise<Karma | null> {
  console.log('Fetching karma for user:', userId);
  const { data, error } = await supabase
    .from('karma')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('Error fetching karma:', error.message);
    return null;
  }

  console.log('Karma fetched:', data);
  return data;
}
