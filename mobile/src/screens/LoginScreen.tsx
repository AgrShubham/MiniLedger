import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp } from '../api/auth';
import { theme } from '../utils/theme';
import { ShieldCheck, Phone, KeyRound, ArrowRight, RefreshCw } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [phone, setPhone] = useState('+919999999999');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone.startsWith('+')) {
      setErrorMessage('Phone number must start with country code (e.g. +919999999999)');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(trimmedPhone);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(phone.trim(), trimmedCode);
      await login(result.token, result.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <ShieldCheck size={36} color={theme.colors.primary} />
              </View>
              <Text style={styles.brandTitle}>MiniLedger</Text>
              <Text style={styles.brandSubtitle}>
                Track loans lent to friends with zero friction
              </Text>
            </View>

            {/* Assessment Helper Notice */}
            <View style={styles.assessmentNotice}>
              <Text style={styles.noticeTitle}>📋 Assessment Mode</Text>
              <Text style={styles.noticeBody}>
                Mock OTP will be printed directly in your backend terminal output upon
                request.
              </Text>
            </View>

            {/* Error Message Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Card Form */}
            <View style={styles.card}>
              {step === 'PHONE' ? (
                <>
                  <Text style={styles.label}>Mobile Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+919999999999"
                      placeholderTextColor={theme.colors.placeholder}
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Include international country code prefix (e.g. +91 or +1)
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Send Mock OTP</Text>
                        <ArrowRight size={18} color={theme.colors.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.otpHeaderRow}>
                    <View>
                      <Text style={styles.label}>Enter 6-digit Code</Text>
                      <Text style={styles.otpSentToText}>Sent to {phone}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setStep('PHONE');
                        setCode('');
                        setErrorMessage(null);
                      }}
                      style={styles.changePhoneButton}
                    >
                      <Text style={styles.changePhoneText}>Edit phone</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <KeyRound size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor={theme.colors.placeholder}
                      value={code}
                      onChangeText={(val) => {
                        setCode(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    <RefreshCw size={14} color={theme.colors.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={styles.resendButtonText}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  assessmentNotice: {
    backgroundColor: '#1E1B4B', // Dark indigo tint
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#3730A3',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryLight,
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  otpSentToText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  changePhoneButton: {
    paddingVertical: 2,
  },
  changePhoneText: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
    marginTop: 6,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    height: '100%',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
  },
  helperText: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 6,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: 4,
  },
  resendButtonText: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
