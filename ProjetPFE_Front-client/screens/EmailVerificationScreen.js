import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from '../components/Typo';
import { normalizeY } from '../utils/normalize';
import { Feather } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthAPI from '../auth/AuthAPI';

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

const EmailVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, type } = route.params;

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRefs = useRef(verificationCode.map(() => React.createRef()));
  const focusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendDisabled]);

  const animateFocus = (toValue) => {
    Animated.spring(focusAnim, {
      toValue,
      speed: 20,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 2,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCodeChange = (text, index) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    if (text && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1].current.focus();
    }
    if (!text && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1].current.focus();
    }
  };

  const handleFocus = (index) => {
    setActiveIndex(index);
    animateFocus(1);
  };

  const handleBlur = () => {
    animateFocus(0);
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code');
      shakeInputs();
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthAPI.verifyEmail(email, code);
      if (response.verified) {
        if (type === 'otp') {
          // Navigate to ResetPasswordScreen for forgot password flow
          Alert.alert(
            'Success',
            'Your email has been verified successfully! Please set a new password.',
            [{ text: 'OK', onPress: () => navigation.navigate('ResetPassword', { email }) }]
          );
        } else {
          // Navigate to SigninScreen for registration or sign-in verification
          Alert.alert(
            'Success',
            'Your email has been verified successfully! You can now login.',
            [{ text: 'OK', onPress: () => navigation.navigate('Signin') }]
          );
        }
      }
    } catch (error) {
      setError(error.message || 'Invalid verification code. Please try again.');
      shakeInputs();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.resendVerificationEmail(email);
      setResendDisabled(true);
      setCountdown(60);
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } catch (error) {
      setError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (index) => {
    const isActive = activeIndex === index;
    const hasValue = verificationCode[index] !== '';

    return [
      styles.codeInput,
      isActive && styles.codeInputActive,
      hasValue && styles.codeInputFilled,
      error && styles.codeInputError,
      {
        transform: [
          {
            scale: activeIndex === index
              ? focusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                })
              : 1,
          },
          {
            translateX: error ? shakeAnim.interpolate({
              inputRange: [0, 1, 2, 3, 4],
              outputRange: [0, 10, -10, 10, 0]
            }) : 0
          }
        ],
      },
    ];
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          <View style={[styles.c1, { opacity: 0.5 }]} />
          <View style={[styles.orangeCircle, { bottom: '25%', left: '5%', opacity: 0.5 }]} />
          <View style={[styles.orangeCircle, { opacity: 0.4 }]} />
          <View style={styles.c2} />
        </View>

        <BlurView intensity={100} tint="light" style={styles.blurContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Typo size={26} style={styles.title}>
                {type === 'otp' ? 'OTP Verification' : 'Email Verification'}
              </Typo>
              <Feather name="shield" size={32} color={colors.primary} style={styles.shieldIcon} />
            </View>

            <View style={styles.instructionsContainer}>
              <Typo style={styles.instructions}>
                We've sent a verification code to:
              </Typo>
              <Typo style={[styles.emailText, styles.emailHighlight]}>
                {email}
              </Typo>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.inputLabel}>
                Enter 6-digit code<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>

              <View style={styles.codeContainer}>
                {verificationCode.map((digit, index) => (
                  <Animated.View
                    key={index}
                    style={getInputStyle(index)}
                  >
                    <TextInput
                      ref={inputRefs.current[index]}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onFocus={() => handleFocus(index)}
                      onBlur={handleBlur}
                      style={styles.codeInputText}
                      keyboardType="number-pad"
                      maxLength={1}
                      autoFocus={index === 0}
                      textAlign="center"
                      selectionColor={colors.primary}
                      caretHidden={true}
                    />
                    {!digit && (
                      <Typo style={styles.placeholderDot}>·</Typo>
                    )}
                    {digit && (
                      <View style={styles.underline} />
                    )}
                  </Animated.View>
                ))}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={14} color={colors.red} />
                  <Typo style={styles.errorText}>{error}</Typo>
                </View>
              ) : null}
            </View>

            <AppButton
              onPress={handleVerify}
              label={isLoading ? 'Verifying...' : 'Verify Account'}
              isLoading={isLoading}
              style={styles.verifyButton}
              labelStyle={styles.verifyButtonText}
            />

            <View style={styles.resendContainer}>
              <Typo style={styles.resendPrompt}>
                Didn't receive the code?
              </Typo>
              <TouchableOpacity
                onPress={handleResend}
                disabled={isLoading || resendDisabled}
              >
                <Typo
                  style={[
                    styles.resendText,
                    (isLoading || resendDisabled) && styles.resendTextDisabled,
                  ]}
                >
                  {resendDisabled ? `Resend code in ${countdown}s` : 'Resend now'}
                </Typo>
              </TouchableOpacity>
            </View>

            <View style={styles.securitySection}>
              <View style={styles.securityTips}>
                <View style={styles.securityTip}>
                  <Feather name="check" size={14} color="#4CAF50" />
                  <Typo style={styles.securityTipText}>
                    The code expires in 5 minutes
                  </Typo>
                </View>
                <View style={styles.securityTip}>
                  <Feather name="check" size={14} color="#4CAF50" />
                  <Typo style={styles.securityTipText}>
                    Check your spam folder if you don't see it
                  </Typo>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Signin')}
            >
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Typo style={styles.backButtonText}>
                Back to login
              </Typo>
            </TouchableOpacity>
          </ScrollView>
        </BlurView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  blurContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: paddingTop + 20,
    paddingHorizontal: spacingX._25,
    paddingBottom: Platform.OS === 'android' ? spacingY._50 : spacingY._20,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._30,
  },
  title: {
    fontWeight: '700',
    color: colors.dark,
    marginRight: spacingX._10,
  },
  shieldIcon: {
    marginBottom: spacingY._5,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: spacingY._40,
  },
  instructions: {
    color: colors.greyDark,
    fontSize: normalizeY(15),
  },
  emailText: {
    fontWeight: '500',
    marginTop: spacingY._10,
  },
  emailHighlight: {
    color: colors.primary,
    fontSize: normalizeY(16),
  },
  inputContainer: {
    marginBottom: spacingY._30,
    width: '100%',
  },
  inputLabel: {
    fontSize: normalizeY(14),
    color: colors.dark,
    marginBottom: spacingY._15,
    fontWeight: '500',
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacingX._5,
  },
  codeInput: {
    width: 48,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.greyLight,
    position: 'relative',
  },
  codeInputActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  codeInputFilled: {
    backgroundColor: '#F0F5FF',
    borderColor: colors.primaryLight,
  },
  codeInputError: {
    borderColor: colors.errorLight,
    backgroundColor: '#FFF5F5',
  },
  codeInputText: {
    fontSize: normalizeY(22),
    fontWeight: '400',
    color: colors.dark,
    width: '100%',
    textAlign: 'center',
    paddingBottom: 8,
  },
  placeholderDot: {
    position: 'absolute',
    fontSize: normalizeY(24),
    color: colors.grey,
    textAlign: 'center',
    bottom: 16,
  },
  underline: {
    position: 'absolute',
    bottom: 12,
    width: 24,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._15,
  },
  errorText: {
    color: colors.red,
    fontSize: normalizeY(12),
    marginLeft: spacingX._5,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._12,
    height: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
    width: '100%',
  },
  verifyButtonText: {
    fontSize: normalizeY(16),
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._40,
  },
  resendPrompt: {
    color: colors.grey,
    fontSize: normalizeY(14),
  },
  resendText: {
    color: colors.primary,
    fontSize: normalizeY(14),
    fontWeight: '600',
    marginTop: spacingY._5,
  },
  resendTextDisabled: {
    color: colors.greyLight,
  },
  securitySection: {
    marginTop: spacingY._30,
    padding: spacingY._20,
    borderRadius: radius._12,
    backgroundColor: 'rgba(230, 238, 255, 0.6)',
    width: '100%',
  },
  securityTips: {
    marginTop: spacingY._10,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacingY._10,
  },
  securityTipText: {
    color: colors.greyDark,
    fontSize: normalizeY(13),
    marginLeft: spacingX._8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._40,
    marginBottom: spacingY._20,
    padding: spacingY._10,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: normalizeY(14),
    fontWeight: '500',
    marginLeft: spacingX._5,
  },
  c1: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: colors.lightBlue,
    alignSelf: 'flex-end',
  },
  c2: {
    width: width / 1.2,
    height: width / 1.2,
    borderRadius: width / 2,
    backgroundColor: '#fee2e2',
    opacity: 0.8,
    marginBottom: 50,
    alignSelf: 'flex-end',
  },
  orangeCircle: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: '#fed7aa',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});

export default EmailVerificationScreen;