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
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import {
  ShieldCheck,
  Phone,
  KeyRound,
  ArrowRight,
  RefreshCw,
} from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { theme, animatedColors } = useTheme();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('+919999999999'); // Pre-fill seeded test phone
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Send OTP
  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your phone number');
      return;
    }
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      setErrorMessage('Phone must be in E.164 format (e.g. +919999999999)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendOtp(trimmed);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await verifyOtp(phone.trim(), trimmedOtp);
      await login(response.token, response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: animatedColors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Top Bar with Animated Theme Toggle */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              <ThemeToggleButton />
            </View>

            {/* App Branding */}
            <View style={styles.brandContainer}>
              <Animated.View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: animatedColors.card,
                    borderColor: animatedColors.border,
                  },
                ]}
              >
                <ShieldCheck size={36} color={theme.colors.primary} />
              </Animated.View>
              <Text style={[styles.brandTitle, { color: theme.colors.text }]}>MiniLedger</Text>
              <Text style={[styles.brandSubtitle, { color: theme.colors.textMuted }]}>
                Effortless personal debt & loan tracking
              </Text>
            </View>

            {/* Assessment Mock Notice */}
            <Animated.View
              style={[
                styles.assessmentNotice,
                {
                  backgroundColor: animatedColors.noticeBg,
                  borderColor: animatedColors.noticeBorder,
                },
              ]}
            >
              <Text style={[styles.noticeTitle, { color: theme.colors.noticeTitle }]}>
                Mock Authentication Active
              </Text>
              <Text style={[styles.noticeBody, { color: theme.colors.noticeText }]}>
                Enter any phone number. The 6-digit OTP code will print directly in your backend terminal log upon
                request.
              </Text>
            </Animated.View>

            {/* Error Message Banner */}
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
                <Text style={[styles.errorText, { color: theme.colors.dangerText }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Card Form */}
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: animatedColors.card,
                  borderColor: animatedColors.border,
                },
              ]}
            >
              {step === 'PHONE' ? (
                <>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Mobile Phone Number</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: theme.colors.surfaceInput,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Phone size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }]}
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
                  <Text style={[styles.helperText, { color: theme.colors.textDim }]}>
                    Include international country code prefix (e.g. +91 or +1)
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.colors.primary },
                      isLoading && styles.buttonDisabled,
                    ]}
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
                      <Text style={[styles.label, { color: theme.colors.text }]}>Enter 6-digit Code</Text>
                      <Text style={[styles.otpSentToText, { color: theme.colors.textMuted }]}>
                        Sent to {phone}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setStep('PHONE');
                        setOtp('');
                        setErrorMessage(null);
                      }}
                      style={styles.changePhoneButton}
                    >
                      <Text style={[styles.changePhoneText, { color: theme.colors.primaryLight }]}>
                        Change
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: theme.colors.surfaceInput,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <KeyRound size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.otpInput, { color: theme.colors.text }]}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.placeholder}
                      value={otp}
                      onChangeText={(val) => {
                        setOtp(val.replace(/\D/g, '').slice(0, 6));
                        if (errorMessage) setErrorMessage(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                  <Text style={[styles.helperText, { color: theme.colors.textDim }]}>
                    Check the backend server console window for the printed OTP
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { backgroundColor: theme.colors.primary },
                      isLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                        <ArrowRight size={18} color={theme.colors.white} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={14} color={theme.colors.primaryLight} style={{ marginRight: 6 }} />
                    <Text style={[styles.resendButtonText, { color: theme.colors.primaryLight }]}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  assessmentNotice: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  otpSentToText: {
    fontSize: 12,
  },
  changePhoneButton: {
    paddingVertical: 2,
  },
  changePhoneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 6,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
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
    marginTop: 6,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  resendButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
