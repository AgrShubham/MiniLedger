import React from 'react';
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
import { X } from 'lucide-react-native';

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
  if (!imageUrl) return null;

  return (
    <Modal visible={!!imageUrl} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.title}>
            Receipt {friendName ? `• ${friendName}` : ''}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={22} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
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
    borderBottomColor: '#222',
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#333',
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
});
