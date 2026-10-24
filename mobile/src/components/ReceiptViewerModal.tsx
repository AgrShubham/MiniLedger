import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { X, AlertCircle } from 'lucide-react-native';

interface ReceiptViewerModalProps {
  imageUrl: string | null;
  friendName?: string;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  imageUrl,
  friendName,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl) return null;

  const handleClose = () => {
    setIsLoading(true);
    setHasError(false);
    onClose();
  };

  return (
    <Modal visible={!!imageUrl} transparent animationType="fade" onRequestClose={handleClose}>
      <SafeAreaView style={styles.backdrop}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.title} numberOfLines={1}>
            Receipt {friendName ? `• ${friendName}` : ''}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={22} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          {isLoading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primaryLight} />
              <Text style={styles.loadingText}>Loading receipt...</Text>
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={40} color={theme.colors.danger} />
              <Text style={styles.errorText}>Failed to load receipt image</Text>
              <Text style={styles.errorSubtext}>{imageUrl}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(e) => {
                console.warn('Failed to load image:', e.nativeEvent.error);
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0A0F1D',
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.full,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSubtext: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

