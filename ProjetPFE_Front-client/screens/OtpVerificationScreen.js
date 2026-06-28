import React, { useState, useRef } from 'react';
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
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import Typo from 'components/Typo';
import AppButton from 'components/AppButton';
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';
import { normalizeY } from 'utils/normalize';
import axios from 'axios';
import { API_BASE_URL } from 'config/api';

const { width, height } = Dimensions.get('screen');
const paddingTop = Platform.OS === 'ios' ? height * 0.07 : spacingY._10;

function OtpVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Updated to 6 fields
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ]; // Updated to 6 refs

  const email = route.params?.email || '';

  const handleOtpChange = (value, index) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 5) { // Updated to 5 (0-5 for 6 fields)
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { // Updated to 6
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      console.log('Verifying OTP for email:', email, 'with OTP:', otpValue);
      console.log('Request URL:', `${API_BASE_URL}/clients/verify-otp`);

      const response = await axios.post(`${API_BASE_URL}/clients/verify-otp`, null, {
        params: { 
          email,
          otp: otpValue 
        },
        timeout: 15000,
      });

      console.log('Verify OTP Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      if (response.status === 200) {
        // Assuming the backend returns the clientId in the response
        // If not, you'll need to fetch it or pass it from ForgotPasswordScreen
        const clientId = 1; // Replace with actual clientId from response or context
        console.log('OTP verified. Navigating to ResetPassword with email:', email, 'and clientId:', clientId);
        navigation.navigate('ResetPassword', { email });
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your network and try again.');
      } else if (error.response) {
        console.log('Server responded with error:', error.response.data);
        setError(error.response.data?.message || 'Invalid verification code');
      } else if (error.request) {
        console.log('Network error details:', error.request);
        setError('Network error. Please check your internet connection and ensure the backend server is reachable.');
      } else {
        console.log('Unexpected error:', error.message);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendDisabled(true);
      setError('');
      console.log('Resending OTP for email:', email);
      console.log('Request URL:', `${API_BASE_URL}/clients/forgot-password`);

      const response = await axios.post(`${API_BASE_URL}/clients/forgot-password`, null, {
        params: { email },
        timeout: 15000,
      });

      console.log('Resend OTP Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'New OTP sent to your email');
        // Start countdown
        let timer = 60;
        setCountdown(timer);
        const interval = setInterval(() => {
          timer--;
          setCountdown(timer);
          if (timer <= 0) {
            clearInterval(interval);
            setResendDisabled(false);
            setCountdown(60);
          }
        }, 1000);
      } else {
        Alert.alert('Error', 'Failed to resend OTP');
        setResendDisabled(false);
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Error', 'Request timed out. Please check your network and try again.');
      } else if (error.response) {
        console.log('Server responded with error:', error.response.data);
        Alert.alert('Error', error.response.data?.message || 'Failed to resend OTP');
      } else if (error.request) {
        console.log('Network error details:', error.request);
        Alert.alert('Error', 'Network error. Please check your internet connection and ensure the backend server is reachable.');
      } else {
        console.log('Unexpected error:', error.message);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
      setResendDisabled(false);
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
          ENTER CODE
        </Typo>

        <View style={{ marginVertical: '5%' }}>
          <Typo size={18} style={styles.body}>
            An Authentication Code Has Been Sent To
          </Typo>
          <Typo size={18} style={[styles.body, styles.emailText]}>
            {email}
          </Typo>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInputBox}>
              <TextInput
                ref={inputRefs[index]}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
          ))}
        </View>

        {error ? <Typo style={styles.errorText}>{error}</Typo> : null}

        <View style={styles.resendContainer}>
          <Typo>If you don't receive a code! </Typo>
          <TouchableOpacity 
            onPress={handleResend} 
            disabled={resendDisabled}
          >
            <Typo style={[
              styles.resendText,
              resendDisabled && { color: colors.gray }
            ]}>
              {resendDisabled ? `Resend (${countdown}s)` : 'Resend'}
            </Typo>
          </TouchableOpacity>
        </View>

        <AppButton
          onPress={handleVerify}
          label={isLoading ? 'Verifying...' : 'Verify and Proceed'}
          disabled={isLoading}
          style={{
            backgroundColor: '#FF7033',
            borderRadius: radius._40,
            marginTop: spacingY._40,
          }}
        />

        <TouchableOpacity
          style={[styles.signInRow, { gap: spacingX._5, marginTop: '15%' }]}
          onPress={() => navigation.navigate('Signin')}
        >
          <Typo>Back To</Typo>
          <Typo style={{ color: '#FF7033' }}>Sign In</Typo>
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
  emailText: {
    color: '#FF7033',
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._30,
    width: '90%', // Adjusted for 6 fields
    alignSelf: 'center',
  },
  otpInputBox: {
    width: normalizeY(50), // Adjusted for 6 fields
    height: normalizeY(50),
    backgroundColor: colors.white,
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lightBlue,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.5,
  },
  otpInput: {
    fontSize: normalizeY(24),
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: colors.red,
    marginTop: spacingY._10,
    fontSize: normalizeY(14),
    alignSelf: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._20,
  },
  resendText: {
    color: '#FF7033',
    fontWeight: '500',
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
    opacity: '0.6',
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

export default OtpVerificationScreen;