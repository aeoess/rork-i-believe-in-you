import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import Colors from '@/constants/colors';

type ToastType = 'success' | 'error' | 'karma';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showKarmaToast: (points: number, action?: string) => void;
}

const { width } = Dimensions.get('window');

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const hideTimeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onRemove(toast.id);
      });
    }, toast.duration || 2500);

    return () => clearTimeout(hideTimeout);
  }, [toast.id, toast.duration, onRemove, opacity, translateY]);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'karma':
        return styles.karmaToast;
      case 'error':
        return styles.errorToast;
      default:
        return styles.successToast;
    }
  };

  const getTextStyle = () => {
    switch (toast.type) {
      case 'karma':
        return styles.karmaText;
      case 'error':
        return styles.errorText;
      default:
        return styles.successText;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        getToastStyle(),
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={[styles.toastText, getTextStyle()]}>{toast.message}</Text>
    </Animated.View>
  );
}

export const [ToastProvider, useToast] = createContextHook<ToastState>(() => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 2500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showKarmaToast = useCallback((points: number, action?: string) => {
    const message = action 
      ? `+${points} 🌟 ${action}` 
      : `+${points} 🌟`;
    showToast(message, 'karma', 2000);
  }, [showToast]);

  return {
    showToast,
    showKarmaToast,
    _internal: { toasts, removeToast },
  } as ToastState & { _internal: { toasts: ToastMessage[]; removeToast: (id: string) => void } };
});

export function ToastContainer() {
  const context = useToast() as ToastState & { _internal?: { toasts: ToastMessage[]; removeToast: (id: string) => void } };
  const toasts = context._internal?.toasts || [];
  const removeToast = context._internal?.removeToast || (() => {});

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  successToast: {
    backgroundColor: Colors.success,
  },
  errorToast: {
    backgroundColor: Colors.error,
  },
  karmaToast: {
    backgroundColor: Colors.karma,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  successText: {
    color: Colors.textInverse,
  },
  errorText: {
    color: Colors.textInverse,
  },
  karmaText: {
    color: Colors.textInverse,
  },
});
