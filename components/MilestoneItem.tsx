import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Calendar } from 'lucide-react-native';
import { Milestone } from '@/lib/database';
import { formatDate } from '@/utils/timeFormat';
import Colors from '@/constants/colors';

interface MilestoneItemProps {
  milestone: Milestone;
}

export default function MilestoneItem({ milestone }: MilestoneItemProps) {
  return (
    <View style={styles.container} testID={`milestone-${milestone.id}`}>
      <View style={styles.iconContainer}>
        {milestone.is_completed ? (
          <CheckCircle2 size={24} color={Colors.success} fill={Colors.success + '20'} />
        ) : (
          <Circle size={24} color={Colors.textTertiary} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, milestone.is_completed && styles.titleCompleted]}>
          {milestone.title}
        </Text>
        {milestone.description && (
          <Text style={styles.description}>{milestone.description}</Text>
        )}
        {(milestone.target_date || milestone.completed_at) && (
          <View style={styles.dateRow}>
            <Calendar size={12} color={Colors.textTertiary} />
            <Text style={styles.date}>
              {milestone.completed_at 
                ? `Completed ${formatDate(milestone.completed_at)}`
                : milestone.target_date 
                  ? `Target: ${formatDate(milestone.target_date)}`
                  : ''
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconContainer: {
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  titleCompleted: {
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
