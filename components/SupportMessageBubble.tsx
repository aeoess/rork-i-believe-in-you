import { View, Text, StyleSheet, Image } from 'react-native';
import { User, Heart } from 'lucide-react-native';
import { SupportMessage } from '@/lib/database';
import { formatRelativeTime } from '@/utils/timeFormat';
import Colors from '@/constants/colors';

interface SupportMessageBubbleProps {
  message: SupportMessage;
}

export default function SupportMessageBubble({ message }: SupportMessageBubbleProps) {
  const senderName = message.is_anonymous 
    ? 'Anonymous Supporter' 
    : message.sender?.name || 'Supporter';
  const avatarUrl = message.is_anonymous ? null : message.sender?.avatar_url;

  return (
    <View style={styles.container} testID={`support-message-${message.id}`}>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : message.is_anonymous ? (
          <Heart size={16} color={Colors.karma} fill={Colors.karmaLight} />
        ) : (
          <User size={16} color={Colors.textTertiary} />
        )}
      </View>
      <View style={styles.bubble}>
        <View style={styles.header}>
          <Text style={styles.name}>{senderName}</Text>
          <Text style={styles.time}>{formatRelativeTime(message.created_at)}</Text>
        </View>
        <Text style={styles.message}>{message.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.primaryLight + '15',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  message: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
