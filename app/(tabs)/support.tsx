import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Star, Compass, Award, Zap, Crown, Users, MessageCircle, ThumbsUp, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowedProjects, getUserSupportStats, getUserSupportActions, getKarmaLevel, getNextKarmaLevel, KARMA_LEVELS, SupportAction } from '@/lib/database';
import ProjectCard from '@/components/ProjectCard';
import Colors from '@/constants/colors';
import { formatRelativeTime } from '@/utils/timeFormat';

const KARMA_ICONS = {
  'New Supporter': Star,
  'Supporter': Heart,
  'Super Supporter': Award,
  'Champion': Zap,
  'Legend': Crown,
};

export default function MySupportScreen() {
  const router = useRouter();
  const { karma, user } = useAuth();

  const karmaPoints = karma?.total_points ?? 0;
  const karmaLevelInfo = getKarmaLevel(karmaPoints);
  const nextLevel = getNextKarmaLevel(karmaPoints);
  const KarmaIcon = KARMA_ICONS[karmaLevelInfo.label as keyof typeof KARMA_ICONS] || Star;

  const progressToNext = nextLevel 
    ? Math.min(100, ((karmaPoints - karmaLevelInfo.min) / (nextLevel.min - karmaLevelInfo.min)) * 100)
    : 100;
  const pointsToNext = nextLevel ? nextLevel.min - karmaPoints : 0;

  const { 
    data: followedProjects = [], 
    isLoading: loadingProjects, 
    refetch: refetchProjects, 
    isRefetching: refetchingProjects 
  } = useQuery({
    queryKey: ['followedProjects', user?.id],
    queryFn: () => user?.id ? getFollowedProjects(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['userSupportStats', user?.id],
    queryFn: () => user?.id ? getUserSupportStats(user.id) : Promise.resolve({ projectsSupported: 0, messagesSent: 0, postsLiked: 0 }),
    enabled: !!user?.id,
  });

  const {
    data: recentActions = [],
    isLoading: loadingActions,
    refetch: refetchActions,
  } = useQuery({
    queryKey: ['userSupportActions', user?.id],
    queryFn: () => user?.id ? getUserSupportActions(user.id, 10) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const isLoading = loadingProjects || loadingStats || loadingActions;
  const isRefetching = refetchingProjects;

  const handleRefresh = useCallback(() => {
    refetchProjects();
    refetchStats();
    refetchActions();
  }, [refetchProjects, refetchStats, refetchActions]);

  const getActionDescription = (action: SupportAction) => {
    switch (action.action_type) {
      case 'follow':
        return 'followed';
      case 'message':
        return 'sent support to';
      case 'like':
        return 'liked a post in';
      default:
        return 'supported';
    }
  };

  const getActionIcon = (action: SupportAction) => {
    switch (action.action_type) {
      case 'follow':
        return Users;
      case 'message':
        return MessageCircle;
      case 'like':
        return ThumbsUp;
      default:
        return Heart;
    }
  };

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
      <View style={styles.karmaCard}>
        <View style={styles.karmaIconContainer}>
          <KarmaIcon size={32} color={Colors.textInverse} fill={Colors.textInverse + '40'} />
        </View>
        <View style={styles.karmaContent}>
          <Text style={styles.karmaLabel}>Your Karma</Text>
          <View style={styles.karmaPointsRow}>
            <Text style={styles.karmaPoints}>{karmaPoints}</Text>
            <Text style={styles.karmaEmoji}>{karmaLevelInfo.emoji}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{karmaLevelInfo.label}</Text>
          </View>
        </View>
        <View style={styles.karmaDecor}>
          <View style={[styles.decorDot, styles.decorDot1]} />
          <View style={[styles.decorDot, styles.decorDot2]} />
          <View style={[styles.decorDot, styles.decorDot3]} />
        </View>
      </View>

      {nextLevel && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to {nextLevel.label}</Text>
            <Text style={styles.progressPoints}>{pointsToNext} points to go</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressToNext}%` }]} />
          </View>
        </View>
      )}

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.projectsSupported}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statCard}>
            <MessageCircle size={20} color={Colors.karma} />
            <Text style={styles.statNumber}>{stats.messagesSent}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statCard}>
            <ThumbsUp size={20} color={Colors.error} />
            <Text style={styles.statNumber}>{stats.postsLiked}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projects you support</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : followedProjects.length > 0 ? (
          <View style={styles.projectsList}>
            {followedProjects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <ProjectCard project={project} variant="horizontal" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Heart size={36} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyText}>
              Find projects you believe in and show your support
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Compass size={18} color={Colors.textInverse} />
              <Text style={styles.discoverButtonText}>Discover Projects</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {recentActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActions.map((action) => {
              const ActionIcon = getActionIcon(action);
              return (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.activityItem}
                  onPress={() => action.project?.public_slug && router.push(`/project/${action.project.public_slug}`)}
                >
                  <View style={styles.activityIconContainer}>
                    <ActionIcon size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      You {getActionDescription(action)}{' '}
                      <Text style={styles.activityProject}>{action.project?.title || 'a project'}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{formatRelativeTime(action.created_at)}</Text>
                  </View>
                  <View style={styles.activityKarma}>
                    <Text style={styles.activityKarmaText}>+{action.points_earned} 🌟</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>💡 Keep supporting creators to earn more karma and level up!</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  karmaCard: {
    margin: 20,
    marginBottom: 12,
    backgroundColor: Colors.karma,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  karmaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  karmaContent: {
    flex: 1,
  },
  karmaLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  karmaPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  karmaPoints: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  karmaEmoji: {
    fontSize: 24,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  karmaDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorDot1: {
    width: 100,
    height: 100,
    right: 0,
    top: 0,
  },
  decorDot2: {
    width: 60,
    height: 60,
    right: 60,
    top: 80,
  },
  decorDot3: {
    width: 40,
    height: 40,
    right: 100,
    top: 20,
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  progressPoints: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.karma,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  projectsList: {
    gap: 12,
  },
  projectItem: {},
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  discoverButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  activityList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  activityProject: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  activityKarma: {
    backgroundColor: Colors.karma + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityKarmaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.karma,
  },
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 14,
  },
  tipText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
