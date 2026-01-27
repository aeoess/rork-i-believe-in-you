import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Post } from '@/lib/database';
import { formatRelativeTime } from '@/utils/timeFormat';
import Colors from '@/constants/colors';

interface PostCardProps {
  post: Post;
  showProjectInfo?: boolean;
}

export default function PostCard({ post, showProjectInfo = true }: PostCardProps) {
  const router = useRouter();

  const handleProjectPress = () => {
    if (post.project?.public_slug) {
      router.push(`/project/${post.project.public_slug}`);
    }
  };

  const handleCreatorPress = () => {
    if (post.project?.builder?.id) {
      router.push(`/creator/${post.project.builder.id}`);
    }
  };

  const handleLikePress = () => {
    console.log('Like pressed - coming soon');
  };

  return (
    <View style={styles.card} testID={`post-card-${post.id}`}>
      {showProjectInfo && post.project && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.projectInfo} onPress={handleProjectPress}>
            <View style={styles.projectAvatar}>
              {post.project.cover_image_url ? (
                <Image source={{ uri: post.project.cover_image_url }} style={styles.projectAvatarImage} />
              ) : (
                <Text style={styles.projectAvatarEmoji}>🚀</Text>
              )}
            </View>
            <View style={styles.projectMeta}>
              <Text style={styles.projectTitle} numberOfLines={1}>{post.project.title}</Text>
              {post.project.builder && (
                <TouchableOpacity onPress={handleCreatorPress}>
                  <Text style={styles.creatorName}>by {post.project.builder.name}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{formatRelativeTime(post.created_at)}</Text>
        </View>
      )}

      {!showProjectInfo && (
        <View style={styles.simpleHeader}>
          <Text style={styles.timestamp}>{formatRelativeTime(post.created_at)}</Text>
        </View>
      )}

      <Text style={styles.content}>{post.content}</Text>

      {post.images && post.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {post.images.length === 1 ? (
            <Image source={{ uri: post.images[0] }} style={styles.singleImage} />
          ) : (
            <View style={styles.imageGrid}>
              {post.images.slice(0, 4).map((image, index) => (
                <Image 
                  key={index} 
                  source={{ uri: image }} 
                  style={[
                    styles.gridImage, 
                    post.images!.length === 2 && styles.halfImage,
                    post.images!.length === 3 && index === 0 && styles.fullWidthImage,
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeButton} onPress={handleLikePress}>
          <Heart size={20} color={Colors.textTertiary} />
          <Text style={styles.likeCount}>{post.like_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  simpleHeader: {
    marginBottom: 8,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  projectAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  projectAvatarImage: {
    width: 44,
    height: 44,
  },
  projectAvatarEmoji: {
    fontSize: 20,
  },
  projectMeta: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  creatorName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  content: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  imagesContainer: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridImage: {
    width: '48.5%',
    height: 120,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
  },
  halfImage: {
    width: '48.5%',
    height: 160,
  },
  fullWidthImage: {
    width: '100%',
    height: 160,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
