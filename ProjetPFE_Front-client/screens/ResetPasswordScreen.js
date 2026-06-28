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
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Octicons } from '@expo/vector-icons';
import Typo from '../components/Typo';
import AppButton from '../components/AppButton';
import axios from 'axios';
import colors from '../config/colors';
import { radius, spacingX, spacingY } from '../config/spacing';
import { normalizeY } from '../utils/normalize';
import { API_BASE_URL } from '../config/api';

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [isConfirmSecure, setIsConfirmSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const validatePassword = (text) => {
    setPassword(text);
    if (errors.password) setErrors({ ...errors, password: '' });

    setPasswordCriteria({
      minLength: text.length >= 8,
      uppercase: /[A-Z]/.test(text),
      lowercase: /[a-z]/.test(text),
      number: /[0-9]/.test(text),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(text),
    });
  };

  const validateForm = () => {
    const newErrors = {
      password: !password
        ? 'Password is required'
        : !passwordCriteria.minLength ||
          !passwordCriteria.uppercase ||
          !passwordCriteria.lowercase ||
          !passwordCriteria.number ||
          !passwordCriteria.specialChar
        ? 'Password does not meet criteria'
        : '',
      confirmPassword: !confirmPassword
        ? 'Confirm password is required'
        : password !== confirmPassword
        ? 'Passwords do not match'
        : '',
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/clients/reset-password`,
        null,
        {
          params: {
            newPassword: password,
            confirmPassword,
            email,
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Password reset successful!', [
          { text: 'OK', onPress: () => navigation.navigate('Signin') },
        ]);
      } else {
        setErrors({
          ...errors,
          password: response.data?.message || 'Failed to reset password',
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        password: error.response?.data?.message || 'Network error',
      });
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
              Reset Password
            </Typo>
            <View style={{ marginVertical: '5%' }}>
              <Typo size={20} style={styles.body}>
                Enter a new password for your
              </Typo>
              <Typo size={20} style={styles.body}>
                account
              </Typo>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                New Password<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[styles.inputView, errors.password ? styles.inputError : null]}>
                <View style={styles.iconContainer}>
                  <Feather name="lock" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={password}
                  onChangeText={validatePassword}
                  style={styles.input}
                  secureTextEntry={isSecure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setIsSecure(!isSecure)}
                  style={styles.eyeIcon}
                >
                  <Octicons
                    name={isSecure ? 'eye-closed' : 'eye'}
                    size={20}
                    color={colors.grey}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Typo style={styles.errorText}>{errors.password}</Typo>
              ) : null}
              <View style={styles.passwordCriteria}>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.minLength ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordCriteria.minLength ? '#4CAF50' : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>At least 8 characters</Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.uppercase ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordCriteria.uppercase ? '#4CAF50' : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 uppercase letter
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.lowercase ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordCriteria.lowercase ? '#4CAF50' : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 lowercase letter
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.number ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordCriteria.number ? '#4CAF50' : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>At least 1 number</Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.specialChar ? 'check-circle' : 'x-circle'}
                    size={14}
                    color={passwordCriteria.specialChar ? '#4CAF50' : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 special character
                  </Typo>
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                Confirm Password<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View
                style={[styles.inputView, errors.confirmPassword ? styles.inputError : null]}
              >
                <View style={styles.iconContainer}>
                  <Feather name="lock" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: '' });
                  }}
                  style={styles.input}
                  secureTextEntry={isConfirmSecure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmSecure(!isConfirmSecure)}
                  style={styles.eyeIcon}
                >
                  <Octicons
                    name={isConfirmSecure ? 'eye-closed' : 'eye'}
                    size={20}
                    color={colors.grey}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Typo style={styles.errorText}>{errors.confirmPassword}</Typo>
              ) : null}
            </View>

            <AppButton
              onPress={handleContinue}
              label={isLoading ? 'Processing...' : 'Reset Password'}
              isLoading={isLoading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius._12,
                marginTop: spacingY._20,
              }}
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Signin')}
            >
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Typo style={styles.backButtonText}>Back to Sign In</Typo>
            </TouchableOpacity>
          </ScrollView>
        </BlurView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

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
    paddingBottom: Platform.OS === 'android' ? 50 : 20,
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFillObject,
  },
  inputContainer: {
    marginTop: spacingY._20,
  },
  labelText: {
    fontSize: normalizeY(16),
    fontWeight: '500',
    color: '#333',
    marginBottom: spacingY._8,
  },
  inputView: {
    backgroundColor: '#FDFCFB',
    borderRadius: radius._15,
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
    borderRadius: radius._15,
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
  },
  divider: {
    height: '80%',
    width: 1,
    backgroundColor: '#ccc',
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
  passwordCriteria: {
    marginTop: spacingY._5,
    paddingLeft: spacingX._15,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacingY._5,
  },
  criteriaIcon: {
    marginRight: spacingX._8,
  },
  criteriaText: {
    color: '#555',
    fontSize: normalizeY(14),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._20,
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

export default ResetPasswordScreen;