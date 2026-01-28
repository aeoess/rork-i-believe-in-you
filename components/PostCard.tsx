import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Post, likePost, unlikePost } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatRelativeTime } from '@/utils/timeFormat';
import Colors from '@/constants/colors';

interface PostCardProps {
  post: Post;
  showProjectInfo?: boolean;
  isLiked?: boolean;
  onLikeChange?: (postId: string, liked: boolean) => void;
}

export default function PostCard({ post, showProjectInfo = true, isLiked = false, onLikeChange }: PostCardProps) {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { showKarmaToast, showToast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLikeCount(post.like_count);
  }, [post.like_count]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const projectId = post.project_id || post.project?.id || '';
      return likePost(user.id, post.id, projectId);
    },
    onSuccess: () => {
      showKarmaToast(1);
      refreshProfile();
    },
    onError: () => {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
      showToast('Failed to like post', 'error');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return unlikePost(user.id, post.id);
    },
    onError: () => {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      showToast('Failed to unlike post', 'error');
    },
  });

  const handleProjectPress = useCallback(() => {
    if (post.project?.public_slug) {
      router.push(`/project/${post.project.public_slug}`);
    }
  }, [post.project?.public_slug, router]);

  const handleCreatorPress = useCallback(() => {
    if (post.project?.builder?.id) {
      router.push(`/creator/${post.project.builder.id}`);
    }
  }, [post.project?.builder?.id, router]);

  const handleLikePress = useCallback(() => {
    if (!user) {
      showToast('Please sign in to like posts', 'error');
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
      onLikeChange?.(post.id, false);
      unlikeMutation.mutate();
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      onLikeChange?.(post.id, true);
      likeMutation.mutate();
    }
  }, [user, liked, post.id, likeMutation, unlikeMutation, onLikeChange, scaleAnim, showToast]);

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
        <TouchableOpacity 
          style={styles.likeButton} 
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart 
              size={20} 
              color={liked ? Colors.error : Colors.textTertiary} 
              fill={liked ? Colors.error : 'transparent'}
            />
          </Animated.View>
          <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
            {likeCount}
          </Text>
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  likeCount: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  likeCountActive: {
    color: Colors.error,
    fontWeight: '500' as const,
  },
});
