import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Star, Compass } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function MySupportScreen() {
  const router = useRouter();
  const { karma } = useAuth();

  const karmaPoints = karma?.total_points ?? 0;
  const karmaLevel = karma?.level ?? 1;

  return (
    <View style={styles.container}>
      <View style={styles.karmaCard}>
        <View style={styles.karmaIconContainer}>
          <Star size={32} color={Colors.karma} fill={Colors.karmaLight} />
        </View>
        <View style={styles.karmaContent}>
          <Text style={styles.karmaLabel}>Your Karma</Text>
          <Text style={styles.karmaPoints}>{karmaPoints}</Text>
          <Text style={styles.karmaLevel}>Level {karmaLevel}</Text>
        </View>
        <View style={styles.karmaDecor}>
          <View style={[styles.decorDot, styles.decorDot1]} />
          <View style={[styles.decorDot, styles.decorDot2]} />
          <View style={[styles.decorDot, styles.decorDot3]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projects you support</Text>
        
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Heart size={36} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptyText}>
            Find projects you believe in and show your support
          </Text>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Compass size={18} color={Colors.textInverse} />
            <Text style={styles.discoverButtonText}>Discover Projects</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  karmaCard: {
    margin: 20,
    backgroundColor: Colors.karma,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  karmaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  karmaContent: {
    flex: 1,
  },
  karmaLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  karmaPoints: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  karmaLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  karmaDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorDot1: {
    width: 100,
    height: 100,
    right: 0,
    top: 0,
  },
  decorDot2: {
    width: 60,
    height: 60,
    right: 60,
    top: 80,
  },
  decorDot3: {
    width: 40,
    height: 40,
    right: 100,
    top: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  discoverButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
