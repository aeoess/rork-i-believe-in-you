import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Heart, Globe, ExternalLink, Edit3, Plus, Trash2, Check } from 'lucide-react-native';
import { getProject, getProjectPosts, getProjectMilestones, getProjectSupportMessages, isFollowingProject, updateProject, deletePost, createMilestone, updateMilestone, deleteMilestone, toggleMilestoneComplete, followProject, unfollowProject, getUserLikedPostIds, Milestone, Post } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import CreatorRow from '@/components/CreatorRow';
import PostCard from '@/components/PostCard';
import MilestoneItem from '@/components/MilestoneItem';
import SupportMessageBubble from '@/components/SupportMessageBubble';
import SupportModal from '@/components/SupportModal';
import Colors from '@/constants/colors';

type TabType = 'about' | 'updates' | 'milestones';
type MoodType = 'green' | 'yellow' | 'red';

const MOOD_CONFIG = {
  green: { color: '#10B981', label: 'Going great!' },
  yellow: { color: '#F59E0B', label: 'Working on it' },
  red: { color: '#EF4444', label: 'Need support' },
};

export default function ProjectPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast, showKarmaToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  const { data: project, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProject(slug || ''),
    enabled: !!slug,
  });

  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['projectPosts', project?.id],
    queryFn: () => getProjectPosts(project?.id || ''),
    enabled: !!project?.id,
  });

  const { data: milestones = [], refetch: refetchMilestones } = useQuery({
    queryKey: ['projectMilestones', project?.id],
    queryFn: () => getProjectMilestones(project?.id || ''),
    enabled: !!project?.id,
  });

  const { data: supportMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['projectSupportMessages', project?.id],
    queryFn: () => getProjectSupportMessages(project?.id || '', 5),
    enabled: !!project?.id,
  });

  const { data: isFollowing = false, refetch: refetchFollowing } = useQuery({
    queryKey: ['isFollowing', user?.id, project?.id],
    queryFn: () => isFollowingProject(user?.id || '', project?.id || ''),
    enabled: !!user?.id && !!project?.id,
  });

  useQuery({
    queryKey: ['projectPostLikes', user?.id, posts.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!user?.id || posts.length === 0) return [];
      const ids = await getUserLikedPostIds(user.id, posts.map(p => p.id));
      setLikedPostIds(ids);
      return ids;
    },
    enabled: !!user?.id && posts.length > 0,
  });

  const isOwner = project?.builder?.user_id === user?.id;
  const [localFollowerCount, setLocalFollowerCount] = useState<number | null>(null);
  const followerCount = localFollowerCount ?? project?.follower_count ?? 0;
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(null);
  const following = localIsFollowing ?? isFollowing;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !project?.id) throw new Error('Not authenticated');
      return followProject(user.id, project.id);
    },
    onMutate: () => {
      setLocalIsFollowing(true);
      setLocalFollowerCount(followerCount + 1);
    },
    onSuccess: () => {
      showKarmaToast(5, 'Followed!');
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
      queryClient.invalidateQueries({ queryKey: ['followedProjects'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['userSupportActions'] });
      queryClient.invalidateQueries({ queryKey: ['userSupportStats'] });
      refreshProfile();
    },
    onError: () => {
      setLocalIsFollowing(false);
      setLocalFollowerCount(followerCount - 1);
      showToast('Failed to follow project', 'error');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !project?.id) throw new Error('Not authenticated');
      return unfollowProject(user.id, project.id);
    },
    onMutate: () => {
      setLocalIsFollowing(false);
      setLocalFollowerCount(Math.max(0, followerCount - 1));
    },
    onSuccess: () => {
      showToast('Unfollowed project');
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
      queryClient.invalidateQueries({ queryKey: ['followedProjects'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
    },
    onError: () => {
      setLocalIsFollowing(true);
      setLocalFollowerCount(followerCount + 1);
      showToast('Failed to unfollow project', 'error');
    },
  });

  const updateMoodMutation = useMutation({
    mutationFn: (mood: MoodType) => updateProject(project!.id, { mood }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', slug] });
      setShowMoodPicker(false);
      showToast('Mood updated!');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      showToast('Update deleted');
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: () => createMilestone({
      project_id: project!.id,
      title: milestoneTitle.trim(),
      description: milestoneDescription.trim() || undefined,
    }),
    onSuccess: () => {
      refetchMilestones();
      setShowMilestoneModal(false);
      setMilestoneTitle('');
      setMilestoneDescription('');
      showToast('Milestone added!');
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: () => updateMilestone(editingMilestone!.id, {
      title: milestoneTitle.trim(),
      description: milestoneDescription.trim() || null,
    }),
    onSuccess: () => {
      refetchMilestones();
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMilestoneTitle('');
      setMilestoneDescription('');
      showToast('Milestone updated!');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) => 
      toggleMilestoneComplete(id, isCompleted),
    onSuccess: () => refetchMilestones(),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => {
      refetchMilestones();
      showToast('Milestone deleted');
    },
  });

  const handleFollowPress = useCallback(() => {
    if (!user) {
      showToast('Please sign in to follow projects', 'error');
      return;
    }
    if (following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [user, following, followMutation, unfollowMutation, showToast]);

  const handleSupportPress = useCallback(() => {
    if (!user) {
      showToast('Please sign in to send support', 'error');
      return;
    }
    setShowSupportModal(true);
  }, [user, showToast]);

  const handleEditProject = () => {
    router.push(`/edit-project?slug=${slug}`);
  };

  const handleNewUpdate = () => {
    router.push(`/create-post?projectId=${project?.id}`);
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Update?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deletePostMutation.mutate(postId)
        },
      ]
    );
  };

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneTitle('');
    setMilestoneDescription('');
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneTitle(milestone.title);
    setMilestoneDescription(milestone.description || '');
    setShowMilestoneModal(true);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    Alert.alert(
      'Delete Milestone?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteMilestoneMutation.mutate(milestoneId)
        },
      ]
    );
  };

  const handleSaveMilestone = () => {
    if (!milestoneTitle.trim()) {
      Alert.alert('Error', 'Milestone title is required');
      return;
    }
    if (editingMilestone) {
      updateMilestoneMutation.mutate();
    } else {
      createMilestoneMutation.mutate();
    }
  };

  const handleLikeChange = useCallback((postId: string, liked: boolean) => {
    setLikedPostIds(prev => 
      liked ? [...prev, postId] : prev.filter(id => id !== postId)
    );
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchPosts();
    refetchMilestones();
    refetchMessages();
    refetchFollowing();
  }, [refetch, refetchPosts, refetchMilestones, refetchMessages, refetchFollowing]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const moodConfig = project.mood ? MOOD_CONFIG[project.mood] : null;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <Stack.Screen 
        options={{ 
          title: project.title,
          headerRight: isOwner ? () => (
            <TouchableOpacity onPress={handleEditProject} style={styles.headerButton}>
              <Edit3 size={20} color={Colors.primary} />
            </TouchableOpacity>
          ) : undefined,
        }} 
      />
      
      <View style={styles.coverContainer}>
        {project.cover_image_url ? (
          <Image source={{ uri: project.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverEmoji}>🚀</Text>
          </View>
        )}
      </View>

      <View style={styles.headerSection}>
        <Text style={styles.title}>{project.title}</Text>
        {project.tagline && (
          <Text style={styles.tagline}>{project.tagline}</Text>
        )}

        {moodConfig && (
          <TouchableOpacity 
            style={styles.moodRow} 
            onPress={() => isOwner && setShowMoodPicker(true)}
            disabled={!isOwner}
          >
            <View style={[styles.moodDot, { backgroundColor: moodConfig.color }]} />
            <Text style={styles.moodLabel}>{moodConfig.label}</Text>
            {isOwner && <Edit3 size={12} color={Colors.textTertiary} />}
          </TouchableOpacity>
        )}

        {project.builder && (
          <View style={styles.creatorSection}>
            <CreatorRow builder={project.builder} showViewProfile size="medium" />
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={18} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{followerCount}</Text>
            <Text style={styles.statLabel}>supporters</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.followButton, following && styles.followingButton]} 
            onPress={handleFollowPress}
            disabled={followMutation.isPending || unfollowMutation.isPending}
          >
            {following && <Check size={16} color={Colors.textInverse} />}
            <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
            <Heart size={18} color={Colors.textInverse} fill={Colors.textInverse} />
            <Text style={styles.supportButtonText}>Send Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'updates' && styles.activeTab]}
          onPress={() => setActiveTab('updates')}
        >
          <Text style={[styles.tabText, activeTab === 'updates' && styles.activeTabText]}>
            Updates {posts.length > 0 && `(${posts.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text style={[styles.tabText, activeTab === 'milestones' && styles.activeTabText]}>
            Milestones {milestones.length > 0 && `(${milestones.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentSection}>
        {activeTab === 'about' && (
          <>
            {project.description ? (
              <Text style={styles.description}>{project.description}</Text>
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.noContent}>No description yet</Text>
                {isOwner && (
                  <TouchableOpacity onPress={handleEditProject}>
                    <Text style={styles.addLink}>Add description</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {project.builder?.website_url && (
              <TouchableOpacity style={styles.linkRow}>
                <Globe size={16} color={Colors.primary} />
                <Text style={styles.linkText}>{project.builder.website_url}</Text>
                <ExternalLink size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </>
        )}

        {activeTab === 'updates' && (
          <View style={styles.postsContainer}>
            {isOwner && (
              <TouchableOpacity style={styles.newUpdateButton} onPress={handleNewUpdate}>
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.newUpdateText}>Post New Update</Text>
              </TouchableOpacity>
            )}
            {posts.length > 0 ? (
              posts.map((post) => (
                <View key={post.id} style={styles.postItem}>
                  <PostCard 
                    post={post} 
                    showProjectInfo={false}
                    isLiked={likedPostIds.includes(post.id)}
                    onLikeChange={handleLikeChange}
                  />
                  {isOwner && (
                    <TouchableOpacity 
                      style={styles.deletePostButton}
                      onPress={() => handleDeletePost(post.id)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.noContent}>No updates yet</Text>
                {isOwner && (
                  <Text style={styles.emptyHint}>Share your first update with your supporters!</Text>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'milestones' && (
          <View style={styles.milestonesContainer}>
            {isOwner && (
              <TouchableOpacity style={styles.addMilestoneButton} onPress={handleAddMilestone}>
                <Plus size={18} color={Colors.primary} />
                <Text style={styles.addMilestoneText}>Add Milestone</Text>
              </TouchableOpacity>
            )}
            {milestones.length > 0 ? (
              milestones.map((milestone) => (
                <MilestoneItem 
                  key={milestone.id} 
                  milestone={milestone}
                  isOwner={isOwner}
                  onToggleComplete={(isCompleted) => 
                    toggleMilestoneMutation.mutate({ id: milestone.id, isCompleted })
                  }
                  onEdit={() => handleEditMilestone(milestone)}
                  onDelete={() => handleDeleteMilestone(milestone.id)}
                />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.noContent}>No milestones yet</Text>
                {isOwner && (
                  <Text style={styles.emptyHint}>Add milestones to track your progress!</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {supportMessages.length > 0 && (
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Recent Support 💜</Text>
          <View style={styles.messagesContainer}>
            {supportMessages.map((message) => (
              <View key={message.id} style={styles.messageItem}>
                <SupportMessageBubble message={message} />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />

      <Modal
        visible={showMoodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoodPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMoodPicker(false)}
        >
          <View style={styles.moodPickerContainer}>
            <Text style={styles.moodPickerTitle}>How's it going?</Text>
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => (
              <TouchableOpacity
                key={mood}
                style={styles.moodOption}
                onPress={() => updateMoodMutation.mutate(mood)}
              >
                <View style={[styles.moodOptionDot, { backgroundColor: MOOD_CONFIG[mood].color }]} />
                <Text style={styles.moodOptionLabel}>{MOOD_CONFIG[mood].label}</Text>
                {project.mood === mood && (
                  <View style={styles.moodSelectedIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMilestoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMilestoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.milestoneModalContainer}>
            <Text style={styles.milestoneModalTitle}>
              {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
            </Text>
            <View style={styles.milestoneInputContainer}>
              <Text style={styles.milestoneInputLabel}>Title *</Text>
              <TextInput
                style={styles.milestoneTextInputField}
                value={milestoneTitle}
                onChangeText={setMilestoneTitle}
                placeholder="Milestone title"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.milestoneInputContainer}>
              <Text style={styles.milestoneInputLabel}>Description</Text>
              <TextInput
                style={styles.milestoneTextInputField}
                value={milestoneDescription}
                onChangeText={setMilestoneDescription}
                placeholder="Optional description"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.milestoneModalActions}>
              <TouchableOpacity 
                style={styles.milestoneModalCancel}
                onPress={() => {
                  setShowMilestoneModal(false);
                  setEditingMilestone(null);
                  setMilestoneTitle('');
                  setMilestoneDescription('');
                }}
              >
                <Text style={styles.milestoneModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.milestoneModalSave}
                onPress={handleSaveMilestone}
              >
                <Text style={styles.milestoneModalSaveText}>
                  {editingMilestone ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {project && (
        <SupportModal
          visible={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          project={project}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textInverse,
    fontWeight: '600' as const,
  },
  headerButton: {
    padding: 8,
  },
  coverContainer: {
    height: 200,
    backgroundColor: Colors.surfaceSecondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight + '20',
  },
  coverEmoji: {
    fontSize: 60,
  },
  headerSection: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  moodLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  creatorSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  followingButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  followingButtonText: {
    color: Colors.textInverse,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.karma,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  contentSection: {
    padding: 20,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  emptySection: {
    alignItems: 'center',
    padding: 20,
  },
  noContent: {
    fontSize: 15,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  addLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
  },
  postsContainer: {
    gap: 16,
  },
  newUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  newUpdateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  postItem: {
    position: 'relative',
  },
  deletePostButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestonesContainer: {},
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addMilestoneText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  supportSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  messagesContainer: {
    gap: 12,
  },
  messageItem: {},
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  moodPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  moodPickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  moodOptionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  moodOptionLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  moodSelectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  milestoneModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  milestoneModalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  milestoneInputContainer: {
    marginBottom: 16,
  },
  milestoneInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  milestoneTextInputField: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  milestoneModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  milestoneModalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  milestoneModalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  milestoneModalSaveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
