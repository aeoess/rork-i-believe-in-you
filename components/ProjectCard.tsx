import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Users, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Project } from '@/lib/database';
import Colors from '@/constants/colors';

interface ProjectCardProps {
  project: Project;
  variant?: 'full' | 'compact' | 'horizontal';
}

export default function ProjectCard({ project, variant = 'full' }: ProjectCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/project/${project.public_slug}`);
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity 
        style={styles.horizontalCard} 
        onPress={handlePress}
        testID={`project-card-${project.id}`}
      >
        <View style={styles.horizontalImageContainer}>
          {project.cover_image_url ? (
            <Image source={{ uri: project.cover_image_url }} style={styles.horizontalImage} />
          ) : (
            <View style={styles.horizontalPlaceholder}>
              <Text style={styles.placeholderEmoji}>🚀</Text>
            </View>
          )}
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={1}>{project.title}</Text>
          {project.tagline && (
            <Text style={styles.horizontalTagline} numberOfLines={1}>{project.tagline}</Text>
          )}
          <View style={styles.horizontalFooter}>
            <Users size={14} color={Colors.textTertiary} />
            <Text style={styles.followerCount}>{project.follower_count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        style={styles.compactCard} 
        onPress={handlePress}
        testID={`project-card-${project.id}`}
      >
        <View style={styles.compactImageContainer}>
          {project.cover_image_url ? (
            <Image source={{ uri: project.cover_image_url }} style={styles.compactImage} />
          ) : (
            <View style={styles.compactPlaceholder}>
              <Text style={styles.placeholderEmoji}>🚀</Text>
            </View>
          )}
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>{project.title}</Text>
          <View style={styles.compactFooter}>
            <Users size={12} color={Colors.textTertiary} />
            <Text style={styles.compactFollowerCount}>{project.follower_count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
      testID={`project-card-${project.id}`}
    >
      <View style={styles.imageContainer}>
        {project.cover_image_url ? (
          <Image source={{ uri: project.cover_image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🚀</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        {project.tagline && (
          <Text style={styles.tagline} numberOfLines={2}>{project.tagline}</Text>
        )}
        <View style={styles.footer}>
          {project.builder && (
            <View style={styles.builderRow}>
              <View style={styles.builderAvatar}>
                {project.builder.avatar_url ? (
                  <Image source={{ uri: project.builder.avatar_url }} style={styles.builderAvatarImage} />
                ) : (
                  <User size={12} color={Colors.textTertiary} />
                )}
              </View>
              <Text style={styles.builderName} numberOfLines={1}>{project.builder.name}</Text>
            </View>
          )}
          <View style={styles.supporterRow}>
            <Users size={14} color={Colors.textTertiary} />
            <Text style={styles.supporterCount}>{project.follower_count} supporters</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight + '20',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    gap: 10,
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  builderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  builderName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  supporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supporterCount: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  compactCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactImageContainer: {
    height: 100,
    backgroundColor: Colors.surfaceSecondary,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight + '20',
  },
  compactContent: {
    padding: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  compactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactFollowerCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horizontalImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surfaceSecondary,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight + '20',
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  horizontalTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  followerCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
