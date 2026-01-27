import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { User, Edit3, LogOut, Folder, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { builderProfile, signOut, user } = useAuth();

  const displayName = builderProfile?.name || user?.email?.split('@')[0] || 'User';
  const bio = builderProfile?.bio || 'No bio yet';
  const avatarUrl = builderProfile?.avatar_url;
  const isCreator = builderProfile?.is_creator ?? false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={40} color={Colors.textTertiary} />
            </View>
          )}
          {isCreator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.bio}>{bio}</Text>
        
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={16} color={Colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Projects</Text>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Folder size={24} color={Colors.textTertiary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {isCreator ? 'No projects yet' : 'Become a creator'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isCreator
                ? 'Start sharing your journey'
                : 'Share your project with supporters'}
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.textTertiary} />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut} testID="signout-button">
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  creatorBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  creatorBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
});
