import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    SafeAreaView, 
    Dimensions, 
    Platform, 
    TextInput, 
    TouchableOpacity,
    Alert
} from 'react-native';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import Typo from 'components/Typo';
import AppButton from 'components/AppButton';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { normalizeY } from 'utils/normalize';
import { Feather } from '@expo/vector-icons'; // Added Feather for the mail icon

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

import { API_BASE_URL } from 'config/api';

function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendMail = async () => {
    setEmailError('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const url = `${API_BASE_URL}/clients/forgot-password`;
      const response = await axios.post(url, null, {
        params: { email },
        timeout: 15000,
      });

      if (response.status === 200) {
        navigation.navigate('EmailVerification', { email, type: 'otp' });
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to send OTP');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Error', 'Request timed out. Please check your network and try again.');
      } else if (error.response) {
        Alert.alert('Error', error.response.data?.message || 'Failed to send OTP. Please try again.');
      } else if (error.request) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please ensure your device is on the same network as the backend.'
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={[styles.c1, { opacity: 0.6 }]} />
        <View style={[styles.blueCircle, { opacity: 0.6 }]} />
        <View style={[styles.c2, { opacity: 0.7 }]} />
      </View>

      <BlurView intensity={100} tint="light" style={styles.blurContainer}>
        <Typo size={26} style={styles.text}>
          FORGOT PASSWORD
        </Typo>

        <View style={{ marginVertical: '5%' }}>
          <Typo size={18} style={styles.body}>
            Enter the email associated with your
          </Typo>
          <Typo size={18} style={styles.body}>
            account and we'll send an email to reset
          </Typo>
          <Typo size={18} style={styles.body}>
            your password
          </Typo>
        </View>

        <View style={{ marginTop: spacingY._20 }}>
          <Typo style={styles.labelText}>
            Email Address<Typo style={{ color: colors.red }}>*</Typo>
          </Typo>
          <View style={[styles.inputView, emailError ? styles.inputError : null]}>
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
            />
          </View>
          {emailError ? (
            <Typo style={styles.errorText}>{emailError}</Typo>
          ) : null}
        </View>

        <AppButton
          onPress={handleSendMail}
          label={isLoading ? 'Sending...' : 'Send Mail'}
          disabled={isLoading}
          style={{
            backgroundColor: colors.primary,
            marginTop: spacingY._40,
          }}
        />

        <TouchableOpacity
          style={[styles.signInRow, { gap: spacingX._5, marginTop: '15%' }]}
          onPress={() => navigation.navigate('Signin')}
        >
          <Typo>Back To</Typo>
          <Typo style={{ color: colors.primary }}>Sign In</Typo>
        </TouchableOpacity>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFill,
    paddingTop: paddingTop,
    padding: spacingY._20,
    paddingBottom: '10%',
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: radius._20,
  },
  background: {
    flex: 1,
    paddingBottom: '10%',
    justifyContent: 'flex-end',
    ...StyleSheet.absoluteFill,
  },
  inputView: {
    backgroundColor: '#FDFCFB', // Consistent with SigninScreen and RegisterScreen
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
    height: 58, // Matching height from SigninScreen and RegisterScreen
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
  labelText: {
    alignSelf: 'flex-start',
    marginBottom: spacingY._5,
    fontSize: normalizeY(16),
  },
  errorText: {
    color: colors.red,
    marginTop: spacingY._5,
    fontSize: normalizeY(14),
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: '15%',
  },
  body: {
    textAlign: 'center',
    alignSelf: 'center',
    margin: 2,
  },
  c1: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: '#fed7aa',
    alignSelf: 'flex-end',
    position: 'absolute',
    bottom: '15%',
    right: '-15%',
  },
  c2: {
    height: normalizeY(150),
    backgroundColor: colors.lightBlue,
    width: '90%',
    alignSelf: 'center',
    bottom: '20%',
    opacity: 0.6,
    borderRadius: radius._20,
  },
  blueCircle: {
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: width / 2,
    backgroundColor: colors.lightBlue,
    position: 'absolute',
    top: '5%',
    left: '-15%',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacingY._10,
    marginTop: '10%',
  },
});

export default ForgotPasswordScreen;