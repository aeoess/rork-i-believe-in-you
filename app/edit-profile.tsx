import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { User, Globe, AtSign } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { updateBuilderProfileFull } from '@/lib/database';
import Colors from '@/constants/colors';

const MAX_BIO_LENGTH = 300;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { builderProfile, user, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');

  useEffect(() => {
    if (builderProfile) {
      setName(builderProfile.name || '');
      setBio(builderProfile.bio || '');
      setAvatarUrl(builderProfile.avatar_url || '');
      setWebsiteUrl(builderProfile.website_url || '');
      setTwitterHandle(builderProfile.twitter_handle || '');
    }
  }, [builderProfile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      
      const updated = await updateBuilderProfileFull(user.id, {
        name: name.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        twitter_handle: twitterHandle.trim().replace('@', '') || null,
      });

      if (!updated) throw new Error('Failed to update profile');
      return updated;
    },
    onSuccess: async () => {
      console.log('Profile updated successfully');
      await refreshProfile();
      router.back();
    },
    onError: (error) => {
      console.log('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    },
  });

  const handleSave = () => {
    if (name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return;
    }

    updateMutation.mutate();
  };

  const isValid = name.trim().length >= 2;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color={Colors.textTertiary} />
              </View>
            )}
          </View>
          <Text style={styles.avatarHint}>Add an avatar URL below</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://example.com/avatar.jpg"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.textTertiary}
            maxLength={50}
            testID="profile-name-input"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a bit about yourself..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={MAX_BIO_LENGTH}
            testID="profile-bio-input"
          />
          <Text style={styles.hint}>{bio.length}/{MAX_BIO_LENGTH} characters</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Website</Text>
          <View style={styles.inputWithIcon}>
            <Globe size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.iconInput}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Twitter/X</Text>
          <View style={styles.inputWithIcon}>
            <AtSign size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.iconInput}
              value={twitterHandle}
              onChangeText={setTwitterHandle}
              placeholder="username"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.hint}>Just your username, no @ needed</Text>
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
          testID="save-profile-button"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.textTertiary,
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
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  iconInput: {
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
