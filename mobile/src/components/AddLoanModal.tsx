import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createLoan } from '../api/loans';
import { useTheme } from '../context/ThemeContext';
import { X, Calendar, Camera, Trash2, IndianRupee, User, FileText } from 'lucide-react-native';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Default due date: 7 days from now in YYYY-MM-DD
  const getDefaultDueDate = (daysOffset: number = 7): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate(7));
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFriendName('');
    setAmount('');
    setDueDate(getDefaultDueDate(7));
    setNotes('');
    setReceiptUri(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to upload receipts.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const trimmedName = friendName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter the friend’s name');
      return;
    }

    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid loan amount greater than 0');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setErrorMessage('Due date must be in YYYY-MM-DD format');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLoan({
        friendName: trimmedName,
        amount: parsedAmount,
        dueDate: dueDate.trim(),
        notes: notes.trim() || undefined,
        receiptUri: receiptUri || undefined,
      });

      resetForm();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record loan. Please check input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <SafeAreaView style={styles.backdrop}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Add New Loan</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Error Message */}
            {errorMessage && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: theme.colors.dangerBg,
                    borderColor: theme.colors.dangerBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.dangerText }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Friend Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Friend's Name *</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surfaceInput,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <User size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="e.g. Aman Sharma"
                  placeholderTextColor={theme.colors.placeholder}
                  value={friendName}
                  onChangeText={setFriendName}
                />
              </View>
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Amount Lent (₹) *</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surfaceInput,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <IndianRupee size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Due Date & Presets */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Due Date (YYYY-MM-DD) *
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surfaceInput,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Calendar size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.placeholder}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setDueDate(getDefaultDueDate(3))}
                >
                  <Text style={[styles.presetChipText, { color: theme.colors.textMuted }]}>
                    +3 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setDueDate(getDefaultDueDate(7))}
                >
                  <Text style={[styles.presetChipText, { color: theme.colors.textMuted }]}>
                    +1 Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setDueDate(getDefaultDueDate(30))}
                >
                  <Text style={[styles.presetChipText, { color: theme.colors.textMuted }]}>
                    +1 Month
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: theme.colors.dangerBg,
                      borderColor: theme.colors.dangerBorder,
                    },
                  ]}
                  onPress={() => setDueDate(getDefaultDueDate(-2))}
                >
                  <Text style={[styles.presetChipText, { color: theme.colors.dangerText }]}>
                    Overdue Demo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Notes */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Notes / Reason (Optional)
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.textAreaContainer,
                  {
                    backgroundColor: theme.colors.surfaceInput,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <FileText
                  size={18}
                  color={theme.colors.textMuted}
                  style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 10 }]}
                />
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: theme.colors.text }]}
                  placeholder="e.g. Split lunch bill, taxi fare"
                  placeholderTextColor={theme.colors.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Optional Receipt Image Upload */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Receipt Photo (Bonus Feature)
              </Text>
              {receiptUri ? (
                <View
                  style={[
                    styles.previewContainer,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
                  <TouchableOpacity
                    style={[styles.removeImageBtn, { backgroundColor: theme.colors.danger }]}
                    onPress={() => setReceiptUri(null)}
                  >
                    <Trash2 size={16} color={theme.colors.white} />
                    <Text style={styles.removeImageText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.pickImageBtn,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.primaryLight,
                    },
                  ]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Camera size={20} color={theme.colors.primaryLight} style={{ marginRight: 8 }} />
                  <Text style={[styles.pickImageText, { color: theme.colors.primaryLight }]}>
                    Select Receipt Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Save Loan Entry</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  textAreaContainer: {
    height: 72,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
  },
  textArea: {
    height: '100%',
    paddingTop: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
    marginTop: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 48,
  },
  pickImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
  },
  receiptPreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
