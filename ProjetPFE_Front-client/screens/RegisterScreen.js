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
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import Typo from 'components/Typo';
import { normalizeY } from 'utils/normalize';
import { Octicons, Feather } from '@expo/vector-icons';
import AppButton from 'components/AppButton';
import { useNavigation } from '@react-navigation/native';
import useAuth from 'auth/useAuth';
import AuthAPI from 'auth/AuthAPI';
import SecurityTips from 'components/SecurityTips';

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

const RegisterScreen = () => {
  const navigation = useNavigation();
  const Auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  const formatMobileNumber = (text) => {
    let cleaned = text.replace(/\D/g, '').replace(/^216/, '').substring(0, 8);
    let formatted = '(+216) ';
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, 2);
      if (cleaned.length > 2) formatted += ' ' + cleaned.substring(2, 5);
      if (cleaned.length > 5) formatted += ' ' + cleaned.substring(5, 8);
    }
    setMobile(formatted);
    if (errors.mobile) setErrors({ ...errors, mobile: '' });
  };

  const validatePassword = (text) => {
    setPassword(text);
    if (errors.password) setErrors({ ...errors, password: '' });

    setPasswordCriteria({
      minLength: text.length >= 8,
      uppercase: /[A-Z]/.test(text),
      lowercase: /[a-z]/.test(text),
      number: /[0-9]/.test(text),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(text)
    });
  };

  const validateForm = () => {
    const cleanedMobile = mobile.replace(/\D/g, '');
    const newErrors = {
      name: !name ? 'Nom requis' : '',
      email: !email ? 'Email requis' : !/^\S+@\S+\.\S+$/.test(email) ? 'Format email invalide' : '',
      mobile: !mobile ? 'Numéro requis' : cleanedMobile.length !== 11 ? 'Numéro invalide (8 chiffres)' : '',
      password: !password
        ? 'Mot de passe requis'
        : !passwordCriteria.minLength ||
          !passwordCriteria.uppercase ||
          !passwordCriteria.lowercase ||
          !passwordCriteria.number ||
          !passwordCriteria.specialChar
        ? 'Mot de passe ne répond pas aux critères'
        : ''
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        const cleanMobile = mobile.replace(/\D/g, '');
        const response = await AuthAPI.register({
          name,
          email,
          mobile: cleanMobile,
          password,
          profil: "default"
        });
        navigation.navigate('EmailVerification', { email, type: 'email' });
        Alert.alert(
          "Registration Successful",
          "Please check your email for a verification code to activate your account.",
          [{ text: "OK" }]
        );
      } catch (error) {
        let errorMessage = "Registration failed. Please try again.";
        if (error.data) {
          if (error.status === 409 && error.data.error === "Duplicate address components detected") {
            errorMessage = "A duplicate address was detected. The system is processing this automatically. Please try again in a moment.";
          } else if (error.data.error) {
            errorMessage = error.data.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert("Registration Error", errorMessage);
        console.error('Registration error details:', error);
      } finally {
        setIsLoading(false);
      }
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
              Hello There!
            </Typo>
            <View style={{ marginVertical: '5%' }}>
              <Typo size={20} style={styles.body}>
                Join Us to Unlock a World
              </Typo>
              <Typo size={20} style={styles.body}>
                of Shopping Delights!
              </Typo>
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                Full Name<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[styles.inputView, errors.name ? styles.inputError : null]}>
                <View style={styles.iconContainer}>
                  <Feather name="user" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  style={styles.input}
                />
              </View>
              {errors.name ? <Typo style={styles.errorText}>{errors.name}</Typo> : null}
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                Email Address<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[styles.inputView, errors.email ? styles.inputError : null]}>
                <View style={styles.iconContainer}>
                  <Feather name="mail" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Typo style={styles.errorText}>{errors.email}</Typo> : null}
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                Mobile Number<Typo style={{ color: colors.red }}>*</Typo>
              </Typo>
              <View style={[styles.inputView, errors.mobile ? styles.inputError : null]}>
                <View style={styles.iconContainer}>
                  <Feather name="phone" size={20} color="#777" />
                </View>
                <View style={styles.divider} />
                <TextInput
                  value={mobile}
                  onChangeText={formatMobileNumber}
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={17}
                />
              </View>
              {errors.mobile ? <Typo style={styles.errorText}>{errors.mobile}</Typo> : null}
            </View>

            <View style={styles.inputContainer}>
              <Typo style={styles.labelText}>
                Password<Typo style={{ color: colors.red }}>*</Typo>
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
                />
                <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon}>
                  <Octicons
                    name={isSecure ? "eye-closed" : "eye"}
                    size={20}
                    color={colors.grey}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Typo style={styles.errorText}>{errors.password}</Typo> : null}
              <View style={styles.passwordCriteria}>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.minLength ? "check-circle" : "x-circle"}
                    size={14}
                    color={passwordCriteria.minLength ? "#4CAF50" : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 8 characters
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.uppercase ? "check-circle" : "x-circle"}
                    size={14}
                    color={passwordCriteria.uppercase ? "#4CAF50" : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 uppercase letter
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.lowercase ? "check-circle" : "x-circle"}
                    size={14}
                    color={passwordCriteria.lowercase ? "#4CAF50" : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 lowercase letter
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.number ? "check-circle" : "x-circle"}
                    size={14}
                    color={passwordCriteria.number ? "#4CAF50" : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 number
                  </Typo>
                </View>
                <View style={styles.criteriaRow}>
                  <Feather
                    name={passwordCriteria.specialChar ? "check-circle" : "x-circle"}
                    size={14}
                    color={passwordCriteria.specialChar ? "#4CAF50" : colors.red}
                    style={styles.criteriaIcon}
                  />
                  <Typo style={styles.criteriaText}>
                    At least 1 special character
                  </Typo>
                </View>
              </View>
            </View>

            <AppButton
              onPress={handleRegister}
              label={'Register'}
              isLoading={isLoading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius._12,
                marginTop: spacingY._20,
                marginBottom: spacingY._20,

              }}
            />

            <View style={{ height: spacingY._30 }} />

            <SecurityTips />

            <View style={styles.registerSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Typo style={styles.dividerText}>OR</Typo>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Signin')}
              >
                <Typo style={styles.registerText}>Already a member? Sign in</Typo>
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
  },
  inputLabel: {
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
  labelText: {
    fontSize: normalizeY(16),
    fontWeight: '500',
    color: '#333',
    marginBottom: spacingY._8,
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
    height: height / 1.2,
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
export default RegisterScreen;