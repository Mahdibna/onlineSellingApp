import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput, Image } from 'react-native';
import { normalizeX, normalizeY } from 'utils/normalize';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuth from 'auth/useAuth';
import { trackMultiplePurchases } from '../utils/RecommendationUtils';
import { Feather } from '@expo/vector-icons';

// Components
import AppButton from 'components/AppButton';
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';

// Config
import colors from 'config/colors';
import { height, radius, spacingX, spacingY } from 'config/spacing';


function PaymentScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { 
    cartItems, 
    totalAmount, 
    addressToUse, 
    userId,
    shippingFee,
    cartTotal,
    paymentMethod
  } = route.params;
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState(null);
  const [errors, setErrors] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  
  // For debugging - log params when component mounts
  useEffect(() => {
    console.log('PaymentScreen loaded with params:', route.params);
    
    const loadToken = async () => {
      try {
        let storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
          storedToken = await AsyncStorage.getItem('authToken');
        }
        
        if (storedToken) {
          console.log('Token retrieved from storage successfully');
          setAuthToken(storedToken);
        } else {
          console.warn('No token found in storage');
        }
      } catch (error) {
        console.error('Error retrieving token from storage:', error);
      }
    };
    loadToken();
  }, [route.params]);
  
  // Detect card type based on card number
  const detectCardType = (number) => {
    const cleaned = number.replace(/\s+/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'MasterCard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    return null;
  };

  // Format card input with spaces
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s+/g, '');
    const groups = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    const formatted = groups.join(' ');
    setCardNumber(formatted);
    
    const type = detectCardType(cleaned);
    setCardType(type);
    
    if (cleaned.length !== 16 || !/^\d+$/.test(cleaned)) {
      setErrors(prev => ({ ...prev, cardNumber: 'Enter a valid 16-digit card number' }));
    } else {
      setErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  // Format expiry date with slash and validate
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    } else if (cleaned.length === 2) {
      formatted = `${cleaned}/`;
    }
    
    setExpiryDate(formatted);
    
    if (cleaned.length === 4) {
      const month = parseInt(cleaned.substring(0, 2), 10);
      const year = parseInt(cleaned.substring(2, 4), 10);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (month < 1 || month > 12) {
        setErrors(prev => ({ ...prev, expiryDate: 'Invalid month' }));
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        setErrors(prev => ({ ...prev, expiryDate: 'Card has expired' }));
      } else {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    } else if (cleaned.length > 0) {
      setErrors(prev => ({ ...prev, expiryDate: 'Enter a valid date (MM/YY)' }));
    } else {
      setErrors(prev => ({ ...prev, expiryDate: '' }));
    }
  };

  // Validate cardholder name
  const validateCardholderName = (text) => {
    setCardholderName(text);
    if (!text.trim()) {
      setErrors(prev => ({ ...prev, cardholderName: 'Cardholder name is required' }));
    } else if (!/^[a-zA-Z\s]+$/.test(text)) {
      setErrors(prev => ({ ...prev, cardholderName: 'Enter a valid name' }));
    } else {
      setErrors(prev => ({ ...prev, cardholderName: '' }));
    }
  };

  // Validate CVV
  const validateCvv = (text) => {
    setCvv(text);
    if (!text.match(/^\d{3,4}$/)) {
      setErrors(prev => ({ ...prev, cvv: 'Enter a valid CVV (3-4 digits)' }));
    } else {
      setErrors(prev => ({ ...prev, cvv: '' }));
    }
  };
  
  // Handle authentication error
  const handleAuthError = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('authToken');
      setAuthToken(null);
      
      Alert.alert(
        "Session Expired", 
        "Your session has expired. Please go back and sign in again.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error handling auth error:', error);
      navigation.goBack();
    }
  };

  // Create axios instance
  const createAuthAxiosInstance = () => {
    const currentToken = authToken || token;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    console.log('Creating axios instance with headers:', JSON.stringify(headers));
    
    return axios.create({
      baseURL: API_URL,
      headers,
      timeout: 15000
    });
  };
  
  const handlePayment = async () => {
    const cleanedCardNumber = cardNumber.replace(/\s+/g, '');
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    if (!cardNumber.trim() || 
        !cardholderName.trim() || 
        !expiryDate.trim() || 
        !cvv.trim()) {
      Alert.alert("Error", "Please fill all card details");
      return;
    }
    
    if (cleanedCardNumber.length !== 16 || !/^\d+$/.test(cleanedCardNumber)) {
      setErrors(prev => ({ ...prev, cardNumber: 'Enter a valid 16-digit card number' }));
      return;
    }
    
    if (!cardholderName.match(/^[a-zA-Z\s]+$/)) {
      setErrors(prev => ({ ...prev, cardholderName: 'Enter a valid name' }));
      return;
    }
    
    if (!expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      setErrors(prev => ({ ...prev, expiryDate: 'Enter a valid date (MM/YY)' }));
      return;
    }
    
    const month = parseInt(expiryDate.substring(0, 2), 10);
    const year = parseInt(expiryDate.substring(3, 5), 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setErrors(prev => ({ ...prev, expiryDate: 'Card has expired' }));
      return;
    }
    
    if (!cvv.match(/^\d{3,4}$/)) {
      setErrors(prev => ({ ...prev, cvv: 'Enter a valid CVV (3-4 digits)' }));
      return;
    }
    
    if (hasErrors) {
      Alert.alert("Error", "Please fix the errors in the form");
      return;
    }
    
    if (!authToken && !token) {
      Alert.alert(
        "Not Logged In", 
        "Please log in to complete your purchase.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const axiosInstance = createAuthAxiosInstance();
      
      console.log('Creating payment intent for amount:', totalAmount);
      const tempPaymentIntent = await axiosInstance.post(
        '/api/payments/create-intent',
        { amount: totalAmount }
      );
      
      if (!tempPaymentIntent.data || !tempPaymentIntent.data.id) {
        throw new Error('Failed to create payment intent - invalid response');
      }
      
      const paymentIntentId = tempPaymentIntent.data.id;
      console.log('Payment intent created with ID:', paymentIntentId);
      
      console.log('Processing payment for intent ID:', paymentIntentId);
      const paymentRequest = {
        cardNumber: cardNumber,
        cardholderName: cardholderName,
        expiryDate: expiryDate,
        cvv: cvv,
        paymentMethod: cardType || 'VISA',
        paymentIntentId: paymentIntentId
      };
      
      const paymentResponse = await axiosInstance.post(
        '/api/payments/process-intent',
        paymentRequest
      );
      
      console.log('Payment processed with response:', paymentResponse.data);
      
      if (paymentResponse.data && paymentResponse.data.successful) {
        console.log('Payment was successful, creating order with payment linkage');
        
        const orderPayload = {
          address: addressToUse,
          products: cartItems,
          paymentType: 'EnLigne',
          paymentIntentId: paymentIntentId
        };
        
        console.log('Creating order with payment intent ID:', paymentIntentId);
        
        try {
          const orderAxiosInstance = createAuthAxiosInstance();
          const orderResponse = await orderAxiosInstance.post(
            `/api/commandes/${userId}`,
            orderPayload
          );
          await trackMultiplePurchases(
            route.params.userId, 
            route.params.cartItems.map(item => ({ 
              id: item.id_product, 
              quantity: item.quantité 
            }))
          );
          console.log('Order created with response:', orderResponse.data);
          const responseData = orderResponse.data;
          navigation.navigate('PaymentSuccess', {
            order: {
              idCommande: responseData.orderId,
              total: responseData.total,
              orderDate: responseData.orderDate,
              status: responseData.status,
              paymentType: responseData.paymentType
            },
            payment: responseData.payment
          });
        } catch (orderError) {
          console.error('Error creating order:', orderError);
          
          if (orderError.response && orderError.response.status === 401) {
            console.error('Authentication error when creating order');
            navigation.navigate('PaymentSuccess', {
              payment: paymentResponse.data,
              order: null,
              authError: true,
              message: "Payment was successful but we couldn't create your order. Please check 'My Orders' later or contact support."
            });
          } else {
            Alert.alert(
              "Order Creation Failed", 
              "Your payment was processed successfully, but we couldn't create your order. Please contact support.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          }
        }
      } else {
        Alert.alert(
          "Payment Failed", 
          paymentResponse.data?.errorMessage || "Your payment could not be processed. Please try again with a different card."
        );
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      if (error.response && error.response.status === 401) {
        console.error('Authentication error - status 401');
        handleAuthError();
      } else {
        let errorMessage = "There was a problem processing your payment. Please try again later.";
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        Alert.alert("Payment Error", errorMessage);
      }
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Calculate total items in cart
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantité, 0);

  return (
    <ScreenComponent style={styles.container}>
      <Header label={'Payment'} onBack={() => navigation.goBack()} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, padding: spacingX._20 }}
        contentContainerStyle={{ paddingBottom: spacingY._60 }}
      >
        <Typo size={20} style={{ fontWeight: '600', marginBottom: spacingY._20, color: colors.darkGray }}>
          Card Details
        </Typo>
        
        <View style={styles.cardContainer}>
          {/* Card Number */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Typo size={14} style={styles.label}>Card Number</Typo>
              <Typo style={{ color: colors.red }}>*</Typo>
            </View>
            <View style={[
              styles.inputView,
              errors.cardNumber ? styles.inputError : null
            ]}>
              <View style={styles.iconContainer}>
                <Feather name="credit-card" size={20} color={colors.gray} />
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.gray}
                value={cardNumber}
                onChangeText={formatCardNumber}
                maxLength={19}
                keyboardType="numeric"
              />
              {cardType && (
                <Image
                  source={
                    cardType === 'Visa' ? require('../assets/visa.png') :
                    cardType === 'MasterCard' ? require('../assets/mastercard.png') :
                    cardType === 'Amex' ? require('../assets/amex.png') :
                    require('../assets/visa.png')
                  }
                  style={styles.cardIcon}
                />
              )}
            </View>
            {errors.cardNumber ? (
              <Typo size={12} color={colors.red} style={styles.errorText}>{errors.cardNumber}</Typo>
            ) : null}
          </View>
          
          {/* Cardholder Name */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Typo size={14} style={styles.label}>Cardholder Name</Typo>
              <Typo style={{ color: colors.red }}>*</Typo>
            </View>
            <View style={[
              styles.inputView,
              errors.cardholderName ? styles.inputError : null
            ]}>
              <View style={styles.iconContainer}>
                <Feather name="user" size={20} color={colors.gray} />
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.gray}
                value={cardholderName}
                onChangeText={validateCardholderName}
              />
            </View>
            {errors.cardholderName ? (
              <Typo size={12} color={colors.red} style={styles.errorText}>{errors.cardholderName}</Typo>
            ) : null}
          </View>
          
          {/* Expiry Date */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Typo size={14} style={styles.label}>Expiry Date</Typo>
              <Typo style={{ color: colors.red }}>*</Typo>
            </View>
            <View style={[
              styles.inputView,
              errors.expiryDate ? styles.inputError : null
            ]}>
              <View style={styles.iconContainer}>
                <Feather name="calendar" size={20} color={colors.gray} />
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={colors.gray}
                value={expiryDate}
                onChangeText={formatExpiryDate}
                maxLength={5}
                keyboardType="numeric"
              />
            </View>
            {errors.expiryDate ? (
              <Typo size={12} color={colors.red} style={styles.errorText}>{errors.expiryDate}</Typo>
            ) : null}
          </View>
          
          {/* CVV */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Typo size={14} style={styles.label}>CVV</Typo>
              <Typo style={{ color: colors.red }}>*</Typo>
            </View>
            <View style={[
              styles.inputView,
              errors.cvv ? styles.inputError : null
            ]}>
              <View style={styles.iconContainer}>
                <Feather name="lock" size={20} color={colors.gray} />
              </View>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={colors.gray}
                value={cvv}
                onChangeText={validateCvv}
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
              />
              <View style={styles.infoIconContainer}>
                <Feather name="help-circle" size={18} color={colors.gray} />
              </View>
            </View>
            {errors.cvv ? (
              <Typo size={12} color={colors.red} style={styles.errorText}>{errors.cvv}</Typo>
            ) : null}
          </View>
          
          {/* Secure Payment Note */}
          <View style={styles.secureNote}>
            <Feather name="shield" size={16} color={colors.primary} />
            <Typo size={12} style={{ color: colors.gray, marginLeft: 5 }}>
              Your payment is secure with SSL encryption
            </Typo>
          </View>
        </View>
        
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryHeader}>
            <Feather name="shopping-cart" size={18} color={colors.primary} />
            <Typo size={16} style={{ fontWeight: '600', marginLeft: spacingX._5, color: colors.darkGray }}>
              Order Summary ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </Typo>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Typo size={14} style={styles.summaryLabel}>Subtotal:</Typo>
              <Typo size={14} style={styles.summaryValue}>{cartTotal.toFixed(2)} TND</Typo>
            </View>
            <View style={styles.summaryRow}>
              <Typo size={14} style={styles.summaryLabel}>Shipping:</Typo>
              <Typo size={14} style={styles.summaryValue}>{shippingFee.toFixed(2)} TND</Typo>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Typo size={14} style={[styles.summaryLabel, { fontWeight: '600' }]}>Total:</Typo>
              <Typo size={14} style={[styles.summaryValue, { fontWeight: '700', color: colors.primary }]}>
                {totalAmount.toFixed(2)} TND
              </Typo>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <AppButton 
          label={processingPayment ? 'Processing...' : `Pay Now with ${paymentMethod || 'Card'}`} 
          onPress={handlePayment}
          disabled={processingPayment}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius._12,
            shadowColor: '#C70E0F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
          }}
        />
      </View>
    </ScreenComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5', // Light gray background
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: radius._15,
    padding: spacingY._20,
    marginBottom: spacingY._20,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray border
  },
  inputContainer: {
    marginBottom: spacingY._15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  label: {
    color: '#333333', // Dark gray for labels
    fontWeight: '500',
    marginRight: 4,
  },
  inputView: {
    backgroundColor: '#FDFCFB', // Off-white input background
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray border
    marginTop: spacingY._5,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
  },
  inputError: {
    borderColor: '#EB1011', // Red border for errors
  },
  iconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
  },
  infoIconContainer: {
    paddingHorizontal: spacingX._15,
    justifyContent: 'center',
  },
  divider: {
    height: '80%',
    width: 1,
    backgroundColor: '#f0f0f0', // Light gray divider
    marginVertical: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacingX._15,
    fontSize: normalizeY(16),
    color: '#333333', // Dark gray text
    height: '100%',
  },
  cardIcon: {
    width: normalizeY(30),
    height: normalizeY(20),
    marginRight: spacingX._15,
    resizeMode: 'contain',
  },
  errorText: {
    color: '#EB1011', // Red for error text
    fontSize: normalizeY(12),
    marginTop: spacingY._5,
    marginLeft: spacingX._5,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._10,
    paddingHorizontal: 5,
  },
  orderSummary: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray border
    marginBottom: spacingY._10,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingY._15,
    paddingHorizontal: spacingX._15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Light gray border
  },
  summaryContent: {
    padding: spacingY._15,
    paddingHorizontal: spacingX._15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacingY._5,
  },
  summaryLabel: {
    color: '#777777', // Gray for labels
  },
  summaryValue: {
    color: '#000000', // Black for values
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0', // Light gray divider
    marginVertical: spacingY._10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacingY._20,
    backgroundColor: '#FFFFFF', // White background
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    shadowColor: '#000000',
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default PaymentScreen;