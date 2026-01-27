import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Star, Compass, Award, Zap } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getFollowedProjects } from '@/lib/database';
import ProjectCard from '@/components/ProjectCard';
import Colors from '@/constants/colors';

const KARMA_LEVELS = [
  { min: 0, label: 'Newcomer', icon: Star },
  { min: 50, label: 'Supporter', icon: Heart },
  { min: 200, label: 'Champion', icon: Award },
  { min: 500, label: 'Super Fan', icon: Zap },
];

function getKarmaLevel(points: number) {
  for (let i = KARMA_LEVELS.length - 1; i >= 0; i--) {
    if (points >= KARMA_LEVELS[i].min) {
      return KARMA_LEVELS[i];
    }
  }
  return KARMA_LEVELS[0];
}

export default function MySupportScreen() {
  const router = useRouter();
  const { karma, user } = useAuth();

  const karmaPoints = karma?.total_points ?? 0;
  const karmaLevelInfo = getKarmaLevel(karmaPoints);
  const KarmaIcon = karmaLevelInfo.icon;

  const { 
    data: followedProjects = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['followedProjects', user?.id],
    queryFn: () => user?.id ? getFollowedProjects(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

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
      <View style={styles.karmaCard}>
        <View style={styles.karmaIconContainer}>
          <KarmaIcon size={32} color={Colors.textInverse} fill={Colors.textInverse + '40'} />
        </View>
        <View style={styles.karmaContent}>
          <Text style={styles.karmaLabel}>Your Karma</Text>
          <Text style={styles.karmaPoints}>{karmaPoints}</Text>
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

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>💡 Keep supporting creators to earn more karma and level up!</Text>
      </View>

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
  karmaPoints: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    letterSpacing: -1,
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
  section: {
    paddingHorizontal: 20,
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
  bottomPadding: {
    height: 40,
  },
});
