import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Compass, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedPosts, Post } from '@/lib/database';
import PostCard from '@/components/PostCard';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { 
    data: posts = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['feedPosts', user?.id],
    queryFn: () => user?.id ? getFeedPosts(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <PostCard post={item} showProjectInfo={true} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.iconContainer}>
            <Sparkles size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your feed is empty</Text>
          <Text style={styles.emptySubtitle}>
            Follow projects you believe in and their updates will appear here
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/(tabs)/discover')}
            testID="discover-button"
          >
            <Compass size={20} color={Colors.textInverse} />
            <Text style={styles.discoverButtonText}>Find your first project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  postContainer: {
    marginBottom: 0,
  },
  separator: {
    height: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  discoverButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
