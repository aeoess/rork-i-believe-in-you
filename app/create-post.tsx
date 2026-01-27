import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, X, ChevronDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectsByBuilder, createPost, Project } from '@/lib/database';
import Colors from '@/constants/colors';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { builderProfile } = useAuth();
  const { projectId: preselectedProjectId } = useLocalSearchParams<{ projectId?: string }>();

  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(preselectedProjectId || null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const { data: myProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['myProjects', builderProfile?.id],
    queryFn: () => getProjectsByBuilder(builderProfile?.id || ''),
    enabled: !!builderProfile?.id,
  });

  const selectedProject = myProjects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    if (myProjects.length === 1 && !selectedProjectId) {
      setSelectedProjectId(myProjects[0].id);
    }
  }, [myProjects, selectedProjectId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('No project selected');
      
      const images = imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const post = await createPost({
        project_id: selectedProjectId,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      });

      if (!post) throw new Error('Failed to create post');
      return post;
    },
    onSuccess: () => {
      console.log('Post created successfully');
      queryClient.invalidateQueries({ queryKey: ['projectPosts', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      
      if (selectedProject) {
        router.replace(`/project/${selectedProject.public_slug}`);
      } else {
        router.back();
      }
    },
    onError: (error) => {
      console.log('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    },
  });

  const handleCreate = () => {
    if (!selectedProjectId) {
      Alert.alert('Select Project', 'Please select a project for this update');
      return;
    }
    if (content.trim().length < 1) {
      Alert.alert('Content Required', 'Please write something for your update');
      return;
    }

    createMutation.mutate();
  };

  const handleCancel = () => {
    if (content) {
      Alert.alert(
        'Discard Update?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const isValid = selectedProjectId && content.trim().length > 0;

  if (loadingProjects) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'New Update' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (myProjects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen 
          options={{ 
            title: 'New Update',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Text style={styles.emptyTitle}>No Projects Yet</Text>
        <Text style={styles.emptyText}>Create a project first to post updates</Text>
        <TouchableOpacity 
          style={styles.createProjectButton}
          onPress={() => router.replace('/create-project')}
        >
          <Text style={styles.createProjectButtonText}>Create Project</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen 
        options={{ 
          title: 'New Update',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {myProjects.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.label}>Project</Text>
            <TouchableOpacity 
              style={styles.projectSelector}
              onPress={() => setShowProjectPicker(!showProjectPicker)}
            >
              <Text style={selectedProject ? styles.projectName : styles.projectPlaceholder}>
                {selectedProject?.title || 'Select a project'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showProjectPicker && (
              <View style={styles.projectPicker}>
                {myProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectOption}
                    onPress={() => {
                      setSelectedProjectId(project.id);
                      setShowProjectPicker(false);
                    }}
                  >
                    <Text style={styles.projectOptionText}>{project.title}</Text>
                    {project.id === selectedProjectId && (
                      <Check size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {myProjects.length === 1 && (
          <View style={styles.autoSelectInfo}>
            <Text style={styles.autoSelectText}>
              Posting to: <Text style={styles.autoSelectProject}>{myProjects[0].title}</Text>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>What's new?</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Share an update with your supporters... What did you accomplish? What's next? Any challenges?"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
            testID="post-content-input"
          />
          <Text style={styles.hint}>Keep it authentic - your supporters want to hear the real story!</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Add Images (optional)</Text>
          <View style={styles.imageInputContainer}>
            <ImageIcon size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.imageInput}
              value={imageUrls}
              onChangeText={setImageUrls}
              placeholder="Paste image URLs (one per line)"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="none"
              testID="post-images-input"
            />
          </View>
          <Text style={styles.hint}>Add screenshot URLs, progress photos, etc.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.postButton, !isValid && styles.postButtonDisabled]} 
          onPress={handleCreate}
          disabled={!isValid || createMutation.isPending}
          testID="create-post-button"
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.postButtonText}>Post Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 20,
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
    marginBottom: 24,
  },
  createProjectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createProjectButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectName: {
    fontSize: 16,
    color: Colors.text,
  },
  projectPlaceholder: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  projectPicker: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  projectOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  autoSelectInfo: {
    backgroundColor: Colors.primaryLight + '20',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  autoSelectText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  autoSelectProject: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  contentInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 150,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  imageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  imageInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    minHeight: 60,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  postButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  postButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
