import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Sparkles } from 'lucide-react-native';
import { getTrendingProjects, getNewProjects, Project } from '@/lib/database';
import ProjectCard from '@/components/ProjectCard';
import Colors from '@/constants/colors';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: trendingProjects = [], 
    isLoading: loadingTrending,
    refetch: refetchTrending,
    isRefetching: refetchingTrending,
  } = useQuery({
    queryKey: ['trendingProjects'],
    queryFn: () => getTrendingProjects(10),
  });

  const { 
    data: newProjects = [], 
    isLoading: loadingNew,
    refetch: refetchNew,
    isRefetching: refetchingNew,
  } = useQuery({
    queryKey: ['newProjects'],
    queryFn: () => getNewProjects(20),
  });

  const isLoading = loadingTrending || loadingNew;
  const isRefetching = refetchingTrending || refetchingNew;

  const handleRefresh = () => {
    refetchTrending();
    refetchNew();
  };

  const filteredTrending = useMemo(() => {
    if (!searchQuery.trim()) return trendingProjects;
    const query = searchQuery.toLowerCase();
    return trendingProjects.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.tagline?.toLowerCase().includes(query)
    );
  }, [trendingProjects, searchQuery]);

  const filteredNew = useMemo(() => {
    if (!searchQuery.trim()) return newProjects;
    const query = searchQuery.toLowerCase();
    return newProjects.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.tagline?.toLowerCase().includes(query)
    );
  }, [newProjects, searchQuery]);

  const renderTrendingItem = ({ item }: { item: Project }) => (
    <View style={styles.trendingItem}>
      <ProjectCard project={item} variant="compact" />
    </View>
  );

  const renderNewItem = ({ item }: { item: Project }) => (
    <View style={styles.newItem}>
      <ProjectCard project={item} variant="full" />
    </View>
  );

  const hasNoResults = searchQuery.trim() && filteredTrending.length === 0 && filteredNew.length === 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>
      </View>

      {hasNoResults ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No projects found for "{searchQuery}"</Text>
        </View>
      ) : (
        <>
          {filteredTrending.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={20} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>Trending Projects</Text>
              </View>
              <FlatList
                data={filteredTrending}
                renderItem={renderTrendingItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingList}
              />
            </View>
          )}

          {filteredNew.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>New Projects</Text>
              </View>
              <View style={styles.newProjectsList}>
                {filteredNew.map((project) => (
                  <View key={project.id} style={styles.newItem}>
                    <ProjectCard project={project} variant="full" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {trendingProjects.length === 0 && newProjects.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkles size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share your project with the community!
              </Text>
            </View>
          )}
        </>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  trendingList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  trendingItem: {
    marginRight: 12,
  },
  newProjectsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  newItem: {},
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});
