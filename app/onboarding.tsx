import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Rocket, Heart, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();

  const handleChoice = async (isCreator: boolean) => {
    await completeOnboarding(isCreator);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconRow}>
            <View style={[styles.iconCircle, styles.iconCirclePrimary]}>
              <Heart size={32} color={Colors.textInverse} fill={Colors.textInverse} />
            </View>
            <View style={[styles.iconCircle, styles.iconCircleSecondary]}>
              <Rocket size={32} color={Colors.textInverse} />
            </View>
          </View>
          <Text style={styles.title}>Welcome to{'\n'}I Believe In You</Text>
          <Text style={styles.subtitle}>
            A community where creators share their journey and supporters cheer them on.
          </Text>
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.question}>Are you here to...</Text>
          
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => handleChoice(true)}
            testID="creator-button"
          >
            <View style={styles.choiceIconContainer}>
              <Rocket size={28} color={Colors.primary} />
            </View>
            <View style={styles.choiceContent}>
              <Text style={styles.choiceTitle}>Share my project</Text>
              <Text style={styles.choiceDescription}>
                I'm building something and want to share my journey with supporters
              </Text>
            </View>
            <ArrowRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceCard}
            onPress={() => handleChoice(false)}
            testID="supporter-button"
          >
            <View style={[styles.choiceIconContainer, styles.choiceIconSecondary]}>
              <Heart size={28} color={Colors.karma} fill={Colors.karmaLight} />
            </View>
            <View style={styles.choiceContent}>
              <Text style={styles.choiceTitle}>Support creators</Text>
              <Text style={styles.choiceDescription}>
                I want to discover and encourage amazing creators on their journey
              </Text>
            </View>
            <ArrowRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          You can always change this later in your profile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePrimary: {
    backgroundColor: Colors.primary,
    transform: [{ rotate: '-6deg' }],
  },
  iconCircleSecondary: {
    backgroundColor: Colors.secondary,
    transform: [{ rotate: '6deg' }],
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  questionSection: {
    gap: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  choiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  choiceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconSecondary: {
    backgroundColor: Colors.karmaLight + '30',
  },
  choiceContent: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 32,
  },
});
