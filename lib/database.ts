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

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface SupportAction {
  id: string;
  user_id: string;
  project_id: string;
  action_type: 'follow' | 'message' | 'like';
  points_earned: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  project?: Project;
}

export const KARMA_LEVELS = [
  { min: 0, max: 50, label: 'New Supporter', emoji: '🌱' },
  { min: 51, max: 200, label: 'Supporter', emoji: '💚' },
  { min: 201, max: 500, label: 'Super Supporter', emoji: '💜' },
  { min: 501, max: 1000, label: 'Champion', emoji: '⭐' },
  { min: 1001, max: Infinity, label: 'Legend', emoji: '👑' },
];

export function getKarmaLevel(points: number) {
  for (let i = KARMA_LEVELS.length - 1; i >= 0; i--) {
    if (points >= KARMA_LEVELS[i].min) {
      return KARMA_LEVELS[i];
    }
  }
  return KARMA_LEVELS[0];
}

export function getNextKarmaLevel(points: number) {
  for (const level of KARMA_LEVELS) {
    if (points < level.min) {
      return level;
    }
  }
  return null;
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

  return (data?.map(d => d.project).filter(Boolean) as unknown as Project[]) || [];
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

// ==================== PROJECTS - CREATE & UPDATE ====================

export function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}

export async function checkSlugExists(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('public_slug', slug)
    .single();
  
  return !!data;
}

export async function createProject(params: {
  builder_id: string;
  title: string;
  tagline: string;
  description?: string;
  cover_image_url?: string;
  public_slug: string;
}): Promise<Project | null> {
  console.log('Creating project:', params.title);
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      builder_id: params.builder_id,
      title: params.title,
      tagline: params.tagline,
      description: params.description || null,
      cover_image_url: params.cover_image_url || null,
      public_slug: params.public_slug,
      mood: 'green',
      follower_count: 0,
      is_published: true,
    })
    .select(`
      *,
      builder:builders(*)
    `)
    .single();

  if (error) {
    console.log('Error creating project:', error.message);
    return null;
  }

  console.log('Project created:', data);
  return data;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'title' | 'tagline' | 'description' | 'cover_image_url' | 'public_slug' | 'mood' | 'is_published'>>
): Promise<Project | null> {
  console.log('Updating project:', projectId, updates);
  
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select(`
      *,
      builder:builders(*)
    `)
    .single();

  if (error) {
    console.log('Error updating project:', error.message);
    return null;
  }

  console.log('Project updated:', data);
  return data;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  console.log('Deleting project:', projectId);
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.log('Error deleting project:', error.message);
    return false;
  }

  console.log('Project deleted successfully');
  return true;
}

// ==================== POSTS - CREATE & UPDATE ====================

export async function createPost(params: {
  project_id: string;
  content: string;
  images?: string[];
}): Promise<Post | null> {
  console.log('Creating post for project:', params.project_id);
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      project_id: params.project_id,
      content: params.content,
      images: params.images || null,
      like_count: 0,
    })
    .select('*')
    .single();

  if (error) {
    console.log('Error creating post:', error.message);
    return null;
  }

  console.log('Post created:', data);
  return data;
}

export async function updatePost(
  postId: string,
  updates: Partial<Pick<Post, 'content' | 'images'>>
): Promise<Post | null> {
  console.log('Updating post:', postId, updates);
  
  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select('*')
    .single();

  if (error) {
    console.log('Error updating post:', error.message);
    return null;
  }

  console.log('Post updated:', data);
  return data;
}

export async function deletePost(postId: string): Promise<boolean> {
  console.log('Deleting post:', postId);
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.log('Error deleting post:', error.message);
    return false;
  }

  console.log('Post deleted successfully');
  return true;
}

// ==================== MILESTONES - CREATE & UPDATE ====================

export async function createMilestone(params: {
  project_id: string;
  title: string;
  description?: string;
  target_date?: string;
}): Promise<Milestone | null> {
  console.log('Creating milestone for project:', params.project_id);
  
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      project_id: params.project_id,
      title: params.title,
      description: params.description || null,
      target_date: params.target_date || null,
      is_completed: false,
    })
    .select('*')
    .single();

  if (error) {
    console.log('Error creating milestone:', error.message);
    return null;
  }

  console.log('Milestone created:', data);
  return data;
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<Pick<Milestone, 'title' | 'description' | 'target_date' | 'is_completed' | 'completed_at'>>
): Promise<Milestone | null> {
  console.log('Updating milestone:', milestoneId, updates);
  
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', milestoneId)
    .select('*')
    .single();

  if (error) {
    console.log('Error updating milestone:', error.message);
    return null;
  }

  console.log('Milestone updated:', data);
  return data;
}

export async function toggleMilestoneComplete(milestoneId: string, isCompleted: boolean): Promise<Milestone | null> {
  console.log('Toggling milestone complete:', milestoneId, isCompleted);
  
  const updates = isCompleted
    ? { is_completed: true, completed_at: new Date().toISOString() }
    : { is_completed: false, completed_at: null };
  
  return updateMilestone(milestoneId, updates);
}

export async function deleteMilestone(milestoneId: string): Promise<boolean> {
  console.log('Deleting milestone:', milestoneId);
  
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);

  if (error) {
    console.log('Error deleting milestone:', error.message);
    return false;
  }

  console.log('Milestone deleted successfully');
  return true;
}

// ==================== BUILDER PROFILE - UPDATE ====================

export async function updateBuilderProfileFull(
  userId: string,
  updates: Partial<Pick<Builder, 'name' | 'bio' | 'avatar_url' | 'website_url' | 'twitter_handle' | 'is_creator'>>
): Promise<Builder | null> {
  console.log('Updating builder profile (full):', userId, updates);
  const { data, error } = await supabase
    .from('builders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.log('Error updating builder profile:', error.message);
    return null;
  }

  console.log('Builder profile updated:', data);
  return data;
}

// ==================== FOLLOWS ====================

export async function followProject(userId: string, projectId: string): Promise<boolean> {
  console.log('Following project:', projectId);
  
  const { error: followError } = await supabase
    .from('follows')
    .insert({ user_id: userId, project_id: projectId });

  if (followError) {
    console.log('Error following project:', followError.message);
    return false;
  }

  const { error: rpcError } = await supabase.rpc('increment_follower_count', { p_project_id: projectId });
  if (rpcError) {
    console.log('RPC increment not available:', rpcError.message);
  }

  await logSupportAction(userId, projectId, 'follow', 5);
  await addKarma(userId, 5);

  console.log('Successfully followed project');
  return true;
}

export async function unfollowProject(userId: string, projectId: string): Promise<boolean> {
  console.log('Unfollowing project:', projectId);
  
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);

  if (error) {
    console.log('Error unfollowing project:', error.message);
    return false;
  }

  const { error: rpcError } = await supabase.rpc('decrement_follower_count', { p_project_id: projectId });
  if (rpcError) {
    console.log('RPC decrement not available:', rpcError.message);
  }

  console.log('Successfully unfollowed project');
  return true;
}

export async function isFollowing(userId: string, projectId: string): Promise<boolean> {
  return isFollowingProject(userId, projectId);
}

// ==================== SUPPORT MESSAGES ====================

export async function sendSupportMessage(params: {
  userId: string;
  projectId: string;
  message: string;
  isAnonymous: boolean;
}): Promise<SupportMessage | null> {
  console.log('Sending support message to project:', params.projectId);
  
  const { data: builder } = await supabase
    .from('builders')
    .select('id')
    .eq('user_id', params.userId)
    .single();

  if (!builder) {
    console.log('Builder not found for user');
    return null;
  }

  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      project_id: params.projectId,
      sender_id: builder.id,
      message: params.message,
      is_anonymous: params.isAnonymous,
    })
    .select(`
      *,
      sender:builders(*)
    `)
    .single();

  if (error) {
    console.log('Error sending support message:', error.message);
    return null;
  }

  await logSupportAction(params.userId, params.projectId, 'message', 10);
  await addKarma(params.userId, 10);

  console.log('Support message sent:', data);
  return data;
}

// ==================== LIKES ====================

export async function likePost(userId: string, postId: string, projectId: string): Promise<boolean> {
  console.log('Liking post:', postId);
  
  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: postId });

  if (error) {
    if (error.code === '23505') {
      console.log('Already liked this post');
      return true;
    }
    console.log('Error liking post:', error.message);
    return false;
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ like_count: supabase.rpc('increment', { x: 1 }) })
    .eq('id', postId);
  if (updateError) {
    console.log('Could not increment like count:', updateError.message);
  }

  await logSupportAction(userId, projectId, 'like', 1);
  await addKarma(userId, 1);

  console.log('Successfully liked post');
  return true;
}

export async function unlikePost(userId: string, postId: string): Promise<boolean> {
  console.log('Unliking post:', postId);
  
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) {
    console.log('Error unliking post:', error.message);
    return false;
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ like_count: supabase.rpc('decrement', { x: 1 }) })
    .eq('id', postId);
  if (updateError) {
    console.log('Could not decrement like count:', updateError.message);
  }

  console.log('Successfully unliked post');
  return true;
}

export async function isPostLiked(userId: string, postId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();

  return !!data;
}

export async function getUserLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (postIds.length === 0) return [];
  
  console.log('Getting liked post IDs for user:', userId);
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  if (error) {
    console.log('Error getting liked posts:', error.message);
    return [];
  }

  return data?.map(d => d.post_id) || [];
}

// ==================== KARMA ====================

export async function addKarma(userId: string, points: number): Promise<Karma | null> {
  console.log('Adding karma:', points, 'to user:', userId);
  
  const { data: currentKarma } = await supabase
    .from('karma')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!currentKarma) {
    console.log('Karma record not found');
    return null;
  }

  const newTotal = currentKarma.total_points + points;
  const newLevel = getKarmaLevel(newTotal);
  const levelNumber = KARMA_LEVELS.findIndex(l => l.label === newLevel.label) + 1;

  const { data, error } = await supabase
    .from('karma')
    .update({
      total_points: newTotal,
      level: levelNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.log('Error updating karma:', error.message);
    return null;
  }

  console.log('Karma updated:', data);
  return data;
}

export async function getUserKarma(userId: string): Promise<Karma | null> {
  return getKarma(userId);
}

// ==================== SUPPORT ACTIONS ====================

export async function logSupportAction(
  userId: string,
  projectId: string,
  actionType: 'follow' | 'message' | 'like',
  pointsEarned: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  console.log('Logging support action:', actionType);
  
  const { error: insertError } = await supabase
    .from('support_actions')
    .insert({
      user_id: userId,
      project_id: projectId,
      action_type: actionType,
      points_earned: pointsEarned,
      metadata: metadata || null,
    });
  if (insertError) {
    console.log('Error logging support action:', insertError.message);
  }
}

export async function getUserSupportActions(userId: string, limit: number = 20): Promise<SupportAction[]> {
  console.log('Getting support actions for user:', userId);
  
  const { data, error } = await supabase
    .from('support_actions')
    .select(`
      *,
      project:projects(id, title, public_slug, cover_image_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('Error getting support actions:', error.message);
    return [];
  }

  return (data as unknown as SupportAction[]) || [];
}

export async function getUserSupportStats(userId: string): Promise<{
  projectsSupported: number;
  messagesSent: number;
  postsLiked: number;
}> {
  console.log('Getting support stats for user:', userId);
  
  const { count: followCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: builder } = await supabase
    .from('builders')
    .select('id')
    .eq('user_id', userId)
    .single();

  let messageCount = 0;
  if (builder) {
    const { count } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', builder.id);
    messageCount = count || 0;
  }

  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    projectsSupported: followCount || 0,
    messagesSent: messageCount,
    postsLiked: likeCount || 0,
  };
}

export async function getProjectSupporters(projectId: string): Promise<Builder[]> {
  console.log('Getting supporters for project:', projectId);
  
  const { data, error } = await supabase
    .from('follows')
    .select(`
      user:builders!follows_user_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .limit(50);

  if (error) {
    console.log('Error getting project supporters:', error.message);
    return [];
  }

  return (data?.map(d => d.user).filter(Boolean) as unknown as Builder[]) || [];
}
