import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Switch, Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Heart, User } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, sendSupportMessage } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Colors from '@/constants/colors';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
  project: Project;
}

export default function SupportModal({ visible, onClose, project }: SupportModalProps) {
  const { user, refreshProfile } = useAuth();
  const { showKarmaToast, showToast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return sendSupportMessage({
        userId: user.id,
        projectId: project.id,
        message: message.trim(),
        isAnonymous,
      });
    },
    onSuccess: () => {
      showKarmaToast(10, 'Support sent!');
      queryClient.invalidateQueries({ queryKey: ['projectSupportMessages', project.id] });
      queryClient.invalidateQueries({ queryKey: ['userSupportActions'] });
      refreshProfile();
      setMessage('');
      setIsAnonymous(false);
      onClose();
    },
    onError: (error) => {
      console.log('Error sending support message:', error);
      showToast('Failed to send support message', 'error');
    },
  });

  const handleSend = () => {
    if (message.trim().length < 10) {
      showToast('Message must be at least 10 characters', 'error');
      return;
    }
    sendMessageMutation.mutate();
  };

  const handleClose = () => {
    setMessage('');
    setIsAnonymous(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Heart size={20} color={Colors.karma} fill={Colors.karma} />
              <Text style={styles.headerTitle}>Send Support</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.projectInfo}>
              <View style={styles.projectAvatar}>
                {project.cover_image_url ? (
                  <Image source={{ uri: project.cover_image_url }} style={styles.projectImage} />
                ) : (
                  <Text style={styles.projectEmoji}>🚀</Text>
                )}
              </View>
              <View style={styles.projectMeta}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {project.builder && (
                  <View style={styles.creatorRow}>
                    <User size={12} color={Colors.textTertiary} />
                    <Text style={styles.creatorName}>{project.builder.name}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your message of support</Text>
              <TextInput
                style={styles.textInput}
                placeholder="I believe in you because..."
                placeholderTextColor={Colors.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{message.length}/500</Text>
            </View>

            <View style={styles.anonymousRow}>
              <View style={styles.anonymousInfo}>
                <Text style={styles.anonymousLabel}>Send anonymously</Text>
                <Text style={styles.anonymousHint}>Your name won't be shown</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={isAnonymous ? Colors.primary : Colors.surface}
              />
            </View>

            <View style={styles.karmaPreview}>
              <Text style={styles.karmaText}>🌟 You'll earn 10 karma points</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, message.trim().length < 10 && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sendMessageMutation.isPending || message.trim().length < 10}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <>
                  <Heart size={18} color={Colors.textInverse} fill={Colors.textInverse} />
                  <Text style={styles.sendText}>Send Support</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
    backgroundColor: Colors.surfaceSecondary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  projectAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  projectImage: {
    width: 56,
    height: 56,
  },
  projectEmoji: {
    fontSize: 28,
  },
  projectMeta: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inputSection: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
  },
  anonymousInfo: {
    flex: 1,
  },
  anonymousLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  anonymousHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  karmaPreview: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.karma + '15',
    borderRadius: 12,
    alignItems: 'center',
  },
  karmaText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.karma,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.karma,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
