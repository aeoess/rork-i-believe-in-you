import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProject, updateProject, deleteProject, checkSlugExists } from '@/lib/database';
import Colors from '@/constants/colors';

const MAX_TAGLINE_LENGTH = 100;

export default function EditProjectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug: projectSlug } = useLocalSearchParams<{ slug: string }>();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectSlug],
    queryFn: () => getProject(projectSlug || ''),
    enabled: !!projectSlug,
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setTagline(project.tagline || '');
      setDescription(project.description || '');
      setCoverImageUrl(project.cover_image_url || '');
      setSlug(project.public_slug);
      setOriginalSlug(project.public_slug);
    }
  }, [project]);

  const validateSlug = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck === originalSlug) {
      setSlugError('');
      return;
    }
    setIsCheckingSlug(true);
    const exists = await checkSlugExists(slugToCheck);
    setIsCheckingSlug(false);
    if (exists) {
      setSlugError('This URL is already taken');
    } else {
      setSlugError('');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug && slug !== originalSlug) {
        validateSlug(slug);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, originalSlug]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error('No project');
      
      const updated = await updateProject(project.id, {
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        public_slug: slug,
      });

      if (!updated) throw new Error('Failed to update project');
      return updated;
    },
    onSuccess: (updated) => {
      console.log('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['project', projectSlug] });
      queryClient.invalidateQueries({ queryKey: ['project', updated.public_slug] });
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.replace(`/project/${updated.public_slug}`);
    },
    onError: (error) => {
      console.log('Update project error:', error);
      Alert.alert('Error', 'Failed to update project. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error('No project');
      const success = await deleteProject(project.id);
      if (!success) throw new Error('Failed to delete project');
      return success;
    },
    onSuccess: () => {
      console.log('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.replace('/(tabs)/profile');
    },
    onError: (error) => {
      console.log('Delete project error:', error);
      Alert.alert('Error', 'Failed to delete project. Please try again.');
    },
  });

  const handleSave = () => {
    if (title.trim().length < 3) {
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return;
    }
    if (tagline.trim().length < 10) {
      Alert.alert('Validation Error', 'Tagline must be at least 10 characters');
      return;
    }
    if (!slug) {
      Alert.alert('Validation Error', 'URL slug is required');
      return;
    }
    if (slugError) {
      Alert.alert('Validation Error', slugError);
      return;
    }

    updateMutation.mutate();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project?',
      'This action cannot be undone. All posts, milestones, and support messages will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteMutation.mutate() 
        },
      ]
    );
  };

  const isValid = title.trim().length >= 3 && tagline.trim().length >= 10 && slug && !slugError;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Edit Project' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Edit Project' }} />
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Edit Project' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What are you building?"
            placeholderTextColor={Colors.textTertiary}
            maxLength={60}
          />
          <Text style={styles.hint}>{title.length}/60 characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tagline *</Text>
          <TextInput
            style={styles.input}
            value={tagline}
            onChangeText={setTagline}
            placeholder="A short, catchy description"
            placeholderTextColor={Colors.textTertiary}
            maxLength={MAX_TAGLINE_LENGTH}
          />
          <Text style={styles.hint}>{tagline.length}/{MAX_TAGLINE_LENGTH} characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell supporters about your project..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cover Image URL</Text>
          <View style={styles.imageInputContainer}>
            <ImageIcon size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.imageInput}
              value={coverImageUrl}
              onChangeText={setCoverImageUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Project URL</Text>
          <View style={styles.slugContainer}>
            <Text style={styles.slugPrefix}>ibelieveinyou.app/project/</Text>
            <TextInput
              style={styles.slugInput}
              value={slug}
              onChangeText={(text) => {
                const cleanSlug = text.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setSlug(cleanSlug);
              }}
              placeholder="your-project"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
            />
            {isCheckingSlug && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>
          {slugError ? (
            <Text style={styles.errorHint}>{slugError}</Text>
          ) : slug && slug !== originalSlug ? (
            <Text style={styles.successHint}>This URL is available!</Text>
          ) : null}
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Trash2 size={20} color={Colors.error} />
                <Text style={styles.deleteButtonText}>Delete Project</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!isValid || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  errorHint: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 6,
  },
  successHint: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 6,
  },
  imageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  imageInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  slugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slugPrefix: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  slugInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  dangerZone: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
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
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
