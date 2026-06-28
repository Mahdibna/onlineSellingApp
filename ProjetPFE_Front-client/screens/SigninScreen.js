import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Dimensions,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import Typo from '../components/Typo';
import { normalizeY } from '../utils/normalize';
import { Octicons, Feather } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/useAuth';
import AuthAPI from '../auth/AuthAPI';
import SecurityTips from '../components/SecurityTips';

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

const SigninScreen = () => {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Validate inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError('Invalid email format');
      return;
    }

    if (!trimmedPassword) {
      setPasswordError('Password is required');
      return;
    }

    try {
      setIsLoading(true);
      console.log('SigninScreen: Starting login process for', trimmedEmail);
      
      await login(trimmedEmail, trimmedPassword);
      console.log('SigninScreen: Login successful');
      
    } catch (error) {
      console.error('SigninScreen: Login failed', error);
      
      let errorMessage = error.message || 'Login failed. Please try again.';
      let title = 'Login Failed';
      
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 403) {
        if (error.data && error.data.reason === 'EMAIL_NOT_VERIFIED') {
          title = 'Account Inactive';
          errorMessage = 'Your account is inactive. Please verify your email address by checking your mailbox.';
          
          Alert.alert(
            title,
            errorMessage,
            [
              {
                text: 'Resend Verification',
                onPress: async () => {
                  try {
                    setIsLoading(true);
                    console.log('SigninScreen: Sending verification email to', trimmedEmail);
                    await AuthAPI.resendVerificationEmail(trimmedEmail);
                    console.log('SigninScreen: Verification email sent successfully');
                    
                    Alert.alert(
                      'Verification Email',
                      'A new verification email has been sent to your address.',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            setIsLoading(false);
                            setTimeout(() => {
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'EmailVerification', params: { email: trimmedEmail } }],
                              });
                            }, 100);
                          },
                        },
                      ],
                      { cancelable: false }
                    );
                  } catch (err) {
                    console.error('SigninScreen: Failed to resend verification email', err);
                    Alert.alert(
                      'Error',
                      err.message || 'Failed to resend verification email. Please try again.'
                    );
                    setIsLoading(false);
                  }
                },
              },
              { 
                text: 'OK', 
                style: 'cancel',
                onPress: () => setIsLoading(false)
              }
            ],
            { cancelable: false }
          );
          return;
        } else if (error.data && error.data.reason === 'ACCOUNT_BLOCKED') {
          title = 'Account Blocked';
          errorMessage = 'Your account has been blocked by the administrator.';
        }
      } else if (error.status === 0) {
        errorMessage = 'Network error, please check your connection';
      }

      Alert.alert(title, errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <Typo size={26} style={styles.text}>
              Hello Again!
            </Typo>
            <View style={{ marginVertical: '5%' }}>
              <Typo size={20} style={styles.body}>
                Welcome back you've
              </Typo>
              <Typo size={20} style={styles.body}>
                been missed!
              </Typo>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.inputLabel}>
                Email Address<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[
                styles.inputView,
                emailError ? styles.inputError : null
              ]}>
                <View style={styles.iconContainer}>
                  <Feather name="mail" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="yes"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
              {emailError ? (
                <Typo style={styles.errorText}>{emailError}</Typo>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.inputLabel}>
                Password<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[
                styles.inputView,
                passwordError ? styles.inputError : null
              ]}>
                <View style={styles.iconContainer}>
                  <Feather name="lock" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  style={styles.input}
                  secureTextEntry={isSecure}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  importantForAutofill="yes"
                  autoComplete="password"
                />
                <TouchableOpacity 
                  onPress={() => setIsSecure(!isSecure)}
                  style={styles.eyeIcon}
                >
                  <Octicons 
                    name={isSecure ? "eye-closed" : "eye"} 
                    size={20} 
                    color={colors.grey} 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Typo style={styles.errorText}>{passwordError}</Typo>
              ) : null}
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPasswordButton}
            >
              <Typo style={styles.recoverTxt}>Forgot Password?</Typo>
            </TouchableOpacity>
            
            <AppButton
              onPress={handleLogin}
              label={'Sign in'}
              isLoading={isLoading}
              style={{ 
                backgroundColor: colors.primary, 
                borderRadius: radius._12,
                marginTop: spacingY._20
              }}
            />
            
            <View style={{ height: spacingY._20 }} /> {/* Added extra space */}
            
            <SecurityTips />
            
            <View style={styles.registerSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Typo style={styles.dividerText}>OR</Typo>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Typo style={styles.registerText}>Create New Account</Typo>
              </TouchableOpacity>
            </View>
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
    paddingTop: paddingTop,
    paddingHorizontal: spacingX._25,
    paddingBottom: Platform.OS === 'android' ? 50 : 20
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFillObject,
  },
  inputContainer: {
    marginTop: spacingY._20,
    borderRadius: 12, // Increased border radius for more rounded corners
  },
  inputLabel: {
    fontSize: normalizeY(16),
    fontWeight: '500',
    color: '#333',
    marginBottom: spacingY._8,
  },
  inputView: {
    backgroundColor: '#FDFCFB', // Changed from colors.white to your custom color
    borderRadius: radius._15, // More rounded corners
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: spacingY._10,
    elevation: 1,
    shadowColor: colors.lightBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
  },
  inputError: {
    borderColor: colors.red,
    borderRadius: radius._15, // Maintain rounded corners in error state
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
  },
  divider: {
    height: '80%', // Slightly less than full height for a subtle effect
    width: 1,
    backgroundColor: '#ccc', // Light grey for a smooth look
    marginVertical: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacingX._15,
    fontSize: normalizeY(16),
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 10,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
  },
  body: {
    textAlign: 'center',
    alignSelf: 'center',
    margin: 2,
  },
  errorText: {
    color: colors.red,
    fontSize: normalizeY(12),
    marginTop: spacingY._5,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: spacingY._15,
    marginBottom: spacingY._9,
    padding: spacingY._5,
  },
  recoverTxt: {
    color: colors.primary,
    fontSize: normalizeY(14),
    fontWeight: '500',
  },
  registerSection: {
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacingY._20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: spacingX._10,
    color: '#777',
    fontSize: normalizeY(14),
    fontWeight: '500',
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius._12,
    paddingVertical: spacingY._15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._25,
  },
  registerText: {
    color: colors.primary,
    fontSize: normalizeY(16),
    fontWeight: '600',
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

export default SigninScreen;