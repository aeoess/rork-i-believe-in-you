import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Users, Heart, Globe, ExternalLink } from 'lucide-react-native';
import { getProject, getProjectPosts, getProjectMilestones, getProjectSupportMessages, isFollowingProject } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import CreatorRow from '@/components/CreatorRow';
import PostCard from '@/components/PostCard';
import MilestoneItem from '@/components/MilestoneItem';
import SupportMessageBubble from '@/components/SupportMessageBubble';
import Colors from '@/constants/colors';

type TabType = 'about' | 'updates' | 'milestones';

const MOOD_CONFIG = {
  green: { color: '#10B981', label: 'Going great!' },
  yellow: { color: '#F59E0B', label: 'Working on it' },
  red: { color: '#EF4444', label: 'Need support' },
};

export default function ProjectPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('about');

  const { data: project, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProject(slug || ''),
    enabled: !!slug,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['projectPosts', project?.id],
    queryFn: () => getProjectPosts(project?.id || ''),
    enabled: !!project?.id,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['projectMilestones', project?.id],
    queryFn: () => getProjectMilestones(project?.id || ''),
    enabled: !!project?.id,
  });

  const { data: supportMessages = [] } = useQuery({
    queryKey: ['projectSupportMessages', project?.id],
    queryFn: () => getProjectSupportMessages(project?.id || '', 5),
    enabled: !!project?.id,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ['isFollowing', user?.id, project?.id],
    queryFn: () => isFollowingProject(user?.id || '', project?.id || ''),
    enabled: !!user?.id && !!project?.id,
  });

  const handleFollowPress = () => {
    Alert.alert('Coming Soon', 'Follow functionality will be available soon!');
  };

  const handleSupportPress = () => {
    Alert.alert('Coming Soon', 'Send support functionality will be available soon!');
  };

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
          onRefresh={refetch}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <Stack.Screen options={{ title: project.title }} />
      
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
          <View style={styles.moodRow}>
            <View style={[styles.moodDot, { backgroundColor: moodConfig.color }]} />
            <Text style={styles.moodLabel}>{moodConfig.label}</Text>
          </View>
        )}

        {project.builder && (
          <View style={styles.creatorSection}>
            <CreatorRow builder={project.builder} showViewProfile size="medium" />
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={18} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{project.follower_count}</Text>
            <Text style={styles.statLabel}>supporters</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]} 
            onPress={handleFollowPress}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress}>
            <Heart size={18} color={Colors.textInverse} fill={Colors.textInverse} />
            <Text style={styles.supportButtonText}>Send Support 💜</Text>
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
              <Text style={styles.noContent}>No description yet</Text>
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
            {posts.length > 0 ? (
              posts.map((post) => (
                <View key={post.id} style={styles.postItem}>
                  <PostCard post={post} showProjectInfo={false} />
                </View>
              ))
            ) : (
              <Text style={styles.noContent}>No updates yet</Text>
            )}
          </View>
        )}

        {activeTab === 'milestones' && (
          <View style={styles.milestonesContainer}>
            {milestones.length > 0 ? (
              milestones.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))
            ) : (
              <Text style={styles.noContent}>No milestones yet</Text>
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
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: Colors.primary,
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
  noContent: {
    fontSize: 15,
    color: Colors.textTertiary,
    fontStyle: 'italic',
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
  postItem: {},
  milestonesContainer: {},
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
});
