import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { createProject, generateSlug, checkSlugExists, updateBuilderProfile } from '@/lib/database';
import Colors from '@/constants/colors';

const MAX_TAGLINE_LENGTH = 100;

export default function CreateProjectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { builderProfile, user, refreshProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  useEffect(() => {
    if (title.length >= 3) {
      const newSlug = generateSlug(title);
      setSlug(newSlug);
      setSlugError('');
    }
  }, [title]);

  const validateSlug = async (slugToCheck: string) => {
    if (!slugToCheck) return;
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
      if (slug) {
        validateSlug(slug);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!builderProfile) throw new Error('No builder profile');
      
      if (!builderProfile.is_creator && user) {
        await updateBuilderProfile(user.id, { is_creator: true });
      }

      const project = await createProject({
        builder_id: builderProfile.id,
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
        public_slug: slug,
      });

      if (!project) throw new Error('Failed to create project');
      return project;
    },
    onSuccess: (project) => {
      console.log('Project created successfully:', project.public_slug);
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      refreshProfile();
      router.replace(`/project/${project.public_slug}`);
    },
    onError: (error) => {
      console.log('Create project error:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    },
  });

  const handleCreate = () => {
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

    createMutation.mutate();
  };

  const handleCancel = () => {
    if (title || tagline || description) {
      Alert.alert(
        'Discard Changes?',
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

  const isValid = title.trim().length >= 3 && tagline.trim().length >= 10 && slug && !slugError;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen 
        options={{ 
          title: 'Create Project',
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
        <View style={styles.section}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What are you building?"
            placeholderTextColor={Colors.textTertiary}
            maxLength={60}
            testID="project-title-input"
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
            testID="project-tagline-input"
          />
          <Text style={styles.hint}>{tagline.length}/{MAX_TAGLINE_LENGTH} characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell supporters about your project, your vision, and what you're working on..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            testID="project-description-input"
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
              testID="project-cover-input"
            />
          </View>
          <Text style={styles.hint}>Optional: Add a cover image for your project</Text>
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
              testID="project-slug-input"
            />
            {isCheckingSlug && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>
          {slugError ? (
            <Text style={styles.errorHint}>{slugError}</Text>
          ) : slug ? (
            <Text style={styles.successHint}>This URL is available!</Text>
          ) : null}
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
          style={[styles.createButton, !isValid && styles.createButtonDisabled]} 
          onPress={handleCreate}
          disabled={!isValid || createMutation.isPending}
          testID="create-project-button"
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.createButtonText}>Create Project</Text>
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
  createButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
