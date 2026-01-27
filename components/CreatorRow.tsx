import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Builder } from '@/lib/database';
import Colors from '@/constants/colors';

interface CreatorRowProps {
  builder: Builder;
  showViewProfile?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function CreatorRow({ 
  builder, 
  showViewProfile = false, 
  size = 'medium',
  onPress 
}: CreatorRowProps) {
  const router = useRouter();
  
  const avatarSize = size === 'small' ? 32 : size === 'medium' ? 40 : 56;
  const nameSize = size === 'small' ? 14 : size === 'medium' ? 15 : 18;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/creator/${builder.id}`);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      testID="creator-row"
    >
      <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 3 }]}>
        {builder.avatar_url ? (
          <Image 
            source={{ uri: builder.avatar_url }} 
            style={[styles.avatarImage, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 3 }]} 
          />
        ) : (
          <User size={avatarSize * 0.5} color={Colors.textTertiary} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { fontSize: nameSize }]}>{builder.name}</Text>
        {showViewProfile && (
          <Text style={styles.viewProfile}>View Profile</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    backgroundColor: Colors.surfaceSecondary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600' as const,
    color: Colors.text,
  },
  viewProfile: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
});
