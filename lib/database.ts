import { supabase } from './supabase';

export interface Builder {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
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

export interface Project {
  id: string;
  builder_id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  public_slug: string;
  mood: 'green' | 'yellow' | 'red' | null;
  follower_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  builder?: Builder;
}

export interface Post {
  id: string;
  project_id: string;
  content: string;
  images: string[] | null;
  like_count: number;
  created_at: string;
  updated_at: string;
  project?: Project & { builder?: Builder };
}

export interface Follow {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
  sender?: Builder;
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

// PROJECTS
export async function getProjects(): Promise<Project[]> {
  console.log('Fetching all projects');
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      builder:builders(*)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error fetching projects:', error.message);
    return [];
  }

  return data || [];
}

export async function getTrendingProjects(limit: number = 10): Promise<Project[]> {
  console.log('Fetching trending projects, limit:', limit);
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      builder:builders(*)
    `)
    .eq('is_published', true)
    .order('follower_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('Error fetching trending projects:', error.message);
    return [];
  }

  return data || [];
}

export async function getNewProjects(limit: number = 20): Promise<Project[]> {
  console.log('Fetching new projects, limit:', limit);
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      builder:builders(*)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('Error fetching new projects:', error.message);
    return [];
  }

  return data || [];
}

export async function getProject(slug: string): Promise<Project | null> {
  console.log('Fetching project by slug:', slug);
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      builder:builders(*)
    `)
    .eq('public_slug', slug)
    .single();

  if (error) {
    console.log('Error fetching project:', error.message);
    return null;
  }

  return data;
}

export async function getProjectsByBuilder(builderId: string): Promise<Project[]> {
  console.log('Fetching projects by builder:', builderId);
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      builder:builders(*)
    `)
    .eq('builder_id', builderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error fetching builder projects:', error.message);
    return [];
  }

  return data || [];
}

// POSTS
export async function getFeedPosts(userId: string): Promise<Post[]> {
  console.log('Fetching feed posts for user:', userId);
  
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('project_id')
    .eq('user_id', userId);

  if (followsError) {
    console.log('Error fetching follows:', followsError.message);
    return [];
  }

  if (!follows || follows.length === 0) {
    console.log('User follows no projects');
    return [];
  }

  const projectIds = follows.map(f => f.project_id);
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      project:projects(
        id,
        title,
        public_slug,
        cover_image_url,
        builder:builders(id, name, avatar_url)
      )
    `)
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.log('Error fetching feed posts:', error.message);
    return [];
  }

  return data || [];
}

export async function getProjectPosts(projectId: string): Promise<Post[]> {
  console.log('Fetching posts for project:', projectId);
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error fetching project posts:', error.message);
    return [];
  }

  return data || [];
}

export async function getPost(postId: string): Promise<Post | null> {
  console.log('Fetching post:', postId);
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      project:projects(
        id,
        title,
        public_slug,
        builder:builders(id, name, avatar_url)
      )
    `)
    .eq('id', postId)
    .single();

  if (error) {
    console.log('Error fetching post:', error.message);
    return null;
  }

  return data;
}

// BUILDERS
export async function getBuilder(builderId: string): Promise<Builder | null> {
  console.log('Fetching builder:', builderId);
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .eq('id', builderId)
    .single();

  if (error) {
    console.log('Error fetching builder:', error.message);
    return null;
  }

  return data;
}

export async function getBuilderByUserId(userId: string): Promise<Builder | null> {
  return getBuilderProfile(userId);
}

// FOLLOWS
export async function getFollowedProjects(userId: string): Promise<Project[]> {
  console.log('Fetching followed projects for user:', userId);
  const { data, error } = await supabase
    .from('follows')
    .select(`
      project:projects(
        *,
        builder:builders(*)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.log('Error fetching followed projects:', error.message);
    return [];
  }

  return (data?.map(d => d.project).filter(Boolean) as Project[]) || [];
}

export async function isFollowingProject(userId: string, projectId: string): Promise<boolean> {
  console.log('Checking if user follows project:', userId, projectId);
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

export async function getFollowerCount(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    console.log('Error getting follower count:', error.message);
    return 0;
  }

  return count || 0;
}

// MILESTONES
export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  console.log('Fetching milestones for project:', projectId);
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Error fetching milestones:', error.message);
    return [];
  }

  return data || [];
}

// SUPPORT MESSAGES
export async function getProjectSupportMessages(
  projectId: string,
  limit: number = 10
): Promise<SupportMessage[]> {
  console.log('Fetching support messages for project:', projectId);
  const { data, error } = await supabase
    .from('support_messages')
    .select(`
      *,
      sender:builders(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('Error fetching support messages:', error.message);
    return [];
  }

  return data || [];
}
