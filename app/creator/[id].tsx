import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { User, Globe, Twitter } from 'lucide-react-native';
import { getBuilder, getProjectsByBuilder } from '@/lib/database';
import ProjectCard from '@/components/ProjectCard';
import Colors from '@/constants/colors';

export default function CreatorProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: builder, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['builder', id],
    queryFn: () => getBuilder(id || ''),
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['builderProjects', builder?.id],
    queryFn: () => getProjectsByBuilder(builder?.id || ''),
    enabled: !!builder?.id,
  });

  const handleWebsitePress = () => {
    if (builder?.website_url) {
      Linking.openURL(builder.website_url);
    }
  };

  const handleTwitterPress = () => {
    if (builder?.twitter_handle) {
      Linking.openURL(`https://twitter.com/${builder.twitter_handle}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!builder) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={styles.errorText}>Creator not found</Text>
      </View>
    );
  }

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
      <Stack.Screen options={{ title: builder.name }} />

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {builder.avatar_url ? (
            <Image source={{ uri: builder.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={48} color={Colors.textTertiary} />
            </View>
          )}
          {builder.is_creator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{builder.name}</Text>
        
        {builder.bio && (
          <Text style={styles.bio}>{builder.bio}</Text>
        )}

        {(builder.website_url || builder.twitter_handle) && (
          <View style={styles.linksRow}>
            {builder.website_url && (
              <TouchableOpacity style={styles.linkButton} onPress={handleWebsitePress}>
                <Globe size={18} color={Colors.primary} />
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
            {builder.twitter_handle && (
              <TouchableOpacity style={styles.linkButton} onPress={handleTwitterPress}>
                <Twitter size={18} color={Colors.primary} />
                <Text style={styles.linkText}>@{builder.twitter_handle}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.projectsSection}>
        <Text style={styles.sectionTitle}>
          {projects.length > 0 ? `Projects (${projects.length})` : 'Projects'}
        </Text>
        
        {projects.length > 0 ? (
          <View style={styles.projectsList}>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <ProjectCard project={project} variant="full" />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects yet</Text>
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
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  creatorBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  name: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight + '15',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  projectsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  projectsList: {
    gap: 16,
  },
  projectItem: {},
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  bottomPadding: {
    height: 40,
  },
});
