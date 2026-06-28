import { MaterialIcons, Feather } from '@expo/vector-icons';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing, ActivityIndicator, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { normalizeX, normalizeY } from 'utils/normalize';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InvoiceUtilityService from '../utils/InvoiceUtilityService';

// Components
import AppButton from 'components/AppButton';
import Header from 'components/Header';
import ScreenComponent from 'components/ScreenComponent';
import Typo from 'components/Typo';

// Config
import colors from 'config/colors';
import { radius, spacingX, spacingY } from 'config/spacing';


function PaymentSuccessScreen({ navigation, route }) {
  const { payment, order, authError, message } = route.params || { 
    payment: null, 
    order: null,
    authError: false,
    message: null
  };
  
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(payment || null);
  const [orderDetails, setOrderDetails] = useState(order || null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Animation value for success checkmark
  const checkmarkSize = new Animated.Value(0);
  
  // Function to get auth token
  const getAuthToken = async () => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };
  
  // Create axios instance with auth
  const createAuthAxiosInstance = async () => {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return axios.create({
      baseURL: API_URL,
      headers,
      timeout: 15000 // 15 seconds timeout
    });
  };
  
  // Fetch payment details
  const fetchPaymentDetails = async (orderId) => {
    try {
      const axiosInstance = await createAuthAxiosInstance();
      const response = await axiosInstance.get(`/api/payments/order/${orderId}`);
      
      console.log('Fetched payment details:', response.data);
      
      if (response.data) {
        setPaymentDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };
  
  useEffect(() => {
    // Log the received payment and order data for debugging
    console.log('Payment Success Screen received payment:', payment);
    console.log('Payment Success Screen received order:', order);
    
    // Start the animation when component mounts
    Animated.timing(checkmarkSize, {
      toValue: 1,
      duration: 800,
      easing: Easing.elastic(1),
      useNativeDriver: true,
    }).start();
    
    // If we have an order ID but payment details are incomplete, fetch from API
    // Check all possible places where the order ID might be stored
    const orderId = getOrderId();
    
    console.log('Identified order ID for fetching details:', orderId);
    
    if (orderId && (!payment || !payment.transactionReference)) {
      fetchPaymentDetails(orderId);
    }
  }, []);
  
  // Helper function to consistently extract order ID from all possible sources
  const getOrderId = () => {
    return order?.idCommande || 
           order?.id || 
           paymentDetails?.orderId || 
           payment?.orderId || 
           (typeof order === 'object' && order !== null ? order.id : null);
  };
  
  // Calculate transform values for animation
  const checkmarkScale = checkmarkSize.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });
  
  const handleContinueShopping = () => {
    // Navigate to Home screen and reset navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };
  
  const handleViewOrder = () => {
    setLoading(true);
    // Get the order ID consistently
    const orderId = getOrderId();
    
    console.log('Navigating to order details with ID:', orderId);
    
    setTimeout(() => {
      setLoading(false);
      if (orderId) {
        navigation.navigate('OrderDetails', { orderId: orderId });
      } else {
        navigation.navigate('MyOrders');
      }
    }, 500);
  };

  const handleViewReceipt = () => {
    const receiptUrl = paymentDetails?.receiptUrl || payment?.receiptUrl;
    if (receiptUrl) {
      Linking.openURL(receiptUrl)
        .catch(err => console.error('Error opening receipt URL:', err));
    }
  };

  // Use the reusable service for downloading invoices
  const handleDownloadInvoice = () => {
    const orderId = getOrderId();
    InvoiceUtilityService.downloadInvoice(orderId, setDownloadingInvoice);
  };

  // Get the order ID for display, checking all possible sources
  const displayOrderId = getOrderId() || 'N/A';

  // If we have an auth error but payment was successful, show modified content
  if (authError && (paymentDetails || payment)) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label={'Payment Successful'} onBack={() => navigation.navigate('MyOrders')} />
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacingX._20, alignItems: 'center' }}>
          
          <View style={styles.successCircle}>
            <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
              <MaterialIcons name="check" size={64} color={colors.white} />
            </Animated.View>
          </View>
          
          <Typo size={24} style={{ fontWeight: '600', marginTop: spacingY._20, textAlign: 'center' }}>
            Payment Successful!
          </Typo>
          
          <Typo size={16} style={{ color: colors.gray, marginTop: spacingY._10, textAlign: 'center', marginBottom: spacingY._30 }}>
            {message || "Your payment was processed successfully, but there was an issue creating your order. Please contact customer support."}
          </Typo>
          
          <View style={styles.infoCard}>
            <Typo size={16} style={{ fontWeight: '600', marginBottom: spacingY._15 }}>
              Payment Details
            </Typo>
            
            <InfoRow label="Amount Paid" value={`${(paymentDetails?.amount || payment?.amount || 0).toFixed(2)} TND`} />
            <InfoRow label="Payment ID" value={`#${paymentDetails?.paymentId || payment?.paymentId || 'N/A'}`} />
            <InfoRow label="Transaction ID" value={paymentDetails?.transactionReference || payment?.transactionReference || 'N/A'} />
            <InfoRow label="Payment Intent" value={paymentDetails?.paymentIntentId || payment?.paymentIntentId || 'N/A'} />
            <InfoRow label="Date" value={paymentDetails?.timestamp ? new Date(paymentDetails.timestamp).toLocaleString() : (payment?.timestamp ? new Date(payment.timestamp).toLocaleString() : 'N/A')} />
            
            {orderDetails && orderDetails.status && (
              <InfoRow label="Status" value={orderDetails.status} />
            )}
            
            {(paymentDetails?.receiptUrl || payment?.receiptUrl) && (
              <TouchableOpacity onPress={handleViewReceipt} style={styles.receiptLink}>
                <Typo size={14} style={{ color: colors.primary, textAlign: 'center' }}>
                  View Receipt
                </Typo>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <AppButton 
              label="Continue Shopping" 
              onPress={handleContinueShopping}
              style={{ marginBottom: spacingY._15 }}
            />
          </View>
        </ScrollView>
      </ScreenComponent>
    );
  }

  // Regular success screen with order details
  return (
    <ScreenComponent style={styles.container}>
      <Header label={'Payment Successful'} onBack={() => navigation.navigate('MyOrders')} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacingX._20, alignItems: 'center' }}>
        
        <View style={styles.successCircle}>
          <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
            <MaterialIcons name="check" size={64} color={colors.white} />
          </Animated.View>
        </View>
        
        <Typo size={24} style={{ fontWeight: '600', marginTop: spacingY._20, textAlign: 'center' }}>
          Payment Successful!
        </Typo>
        
        <Typo size={16} style={{ color: colors.gray, marginTop: spacingY._10, textAlign: 'center', marginBottom: spacingY._30 }}>
          Your order has been placed successfully
        </Typo>
        
        <View style={styles.infoCard}>
          <Typo size={16} style={{ fontWeight: '600', marginBottom: spacingY._15 }}>
            Payment Details
          </Typo>
          
          <InfoRow 
            label="Amount Paid" 
            value={`${(paymentDetails?.amount || payment?.amount || 0).toFixed(2)} TND`} 
          />
          <InfoRow 
            label="Order Number" 
            value={`#${displayOrderId}`} 
          />
          <InfoRow 
            label="Payment ID" 
            value={`#${paymentDetails?.paymentId || payment?.paymentId || 'N/A'}`} 
          />
          <InfoRow 
            label="Transaction ID" 
            value={paymentDetails?.transactionReference || payment?.transactionReference || 'N/A'} 
          />
          <InfoRow 
            label="Payment Intent" 
            value={paymentDetails?.paymentIntentId || payment?.paymentIntentId || 'N/A'} 
          />
          <InfoRow 
            label="Date" 
            value={paymentDetails?.timestamp ? new Date(paymentDetails.timestamp).toLocaleString() : (payment?.timestamp ? new Date(payment.timestamp).toLocaleString() : 'N/A')} 
          />
          
          {orderDetails && orderDetails.status && (
            <InfoRow 
              label="Status" 
              value={orderDetails.status === "PayeEtEnCoursDeTraitement" ? "Paid & Processing" : orderDetails.status} 
            />
          )}
          
          {/* Invoice download button - works for all order types */}
          <TouchableOpacity 
            onPress={handleDownloadInvoice} 
            style={styles.invoiceButton}
            disabled={downloadingInvoice}
          >
            <View style={styles.invoiceButtonContent}>
              <Feather name="download" size={16} color={colors.primary} />
              <Typo size={14} style={{ color: colors.primary, marginLeft: 8 }}>
                {downloadingInvoice ? "Downloading..." : "Download Invoice"}
              </Typo>
              {downloadingInvoice && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <AppButton 
            label="Continue Shopping" 
            onPress={handleContinueShopping}
            style={{ marginBottom: spacingY._15 }}
          />
          <AppButton 
            label={loading ? "Loading..." : "View Order"} 
            onPress={handleViewOrder}
            variant="outline"
            disabled={loading || displayOrderId === 'N/A'}
          />
        </View>
      </ScrollView>
    </ScreenComponent>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Typo size={14} style={{ color: colors.gray, flex: 1 }}>
      {label}
    </Typo>
    <Typo size={14} style={{ fontWeight: '500', flex: 1, textAlign: 'right' }}>
      {value}
    </Typo>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  successCircle: {
    width: normalizeX(120),
    height: normalizeX(120),
    borderRadius: normalizeX(60),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacingY._30,
  },
  infoCard: {
    backgroundColor: colors.lighterGray,
    borderRadius: radius._15,
    padding: spacingY._15,
    width: '100%',
    marginBottom: spacingY._30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacingY._8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  buttonContainer: {
    width: '100%',
  },
  receiptLink: {
    marginTop: spacingY._10,
    paddingVertical: spacingY._8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  invoiceButton: {
    marginTop: spacingY._10,
    paddingVertical: spacingY._12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  invoiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default PaymentSuccessScreen;