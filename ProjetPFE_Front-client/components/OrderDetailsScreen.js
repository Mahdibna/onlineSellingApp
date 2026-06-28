import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
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


function OrderDetailsScreen({ navigation, route }) {
  const { orderId } = route.params;
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

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

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await axios.get(`${API_URL}/api/commandes/${orderId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Order details:', response.data);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use the reusable service for downloading invoices
  const handleDownloadInvoice = () => {
    InvoiceUtilityService.downloadInvoice(orderId, setDownloadingInvoice);
  };

  // Get a user-friendly representation of the order status
  const getOrderStatusText = (status) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'PayeEtEnCoursDeTraitement': return 'Paid & Processing';
      case 'EnCoursDeTraitement': return 'Processing';
      case 'EnTransit': return 'In Transit';
      case 'EnCoursDeLivraison': return 'Out for Delivery';
      case 'Livree': return 'Delivered';
      case 'LivreeEtPaye': return 'Delivered & Paid';
      case 'Annulee': return 'Cancelled';
      case 'EnRetour': return 'Returned';
      default: return status;
    }
  };

  // Get a user-friendly representation of the payment type
  const getPaymentTypeText = (paymentType) => {
    if (!paymentType) return 'Unknown';
    
    switch (paymentType) {
      case 'EnLigne': return 'Online Payment';
      case 'Livraison': return 'Cash on Delivery';
      default: return paymentType;
    }
  };

  if (loading) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="Order Details" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo style={{ marginTop: spacingY._15 }}>Loading order details...</Typo>
        </View>
      </ScreenComponent>
    );
  }

  if (error) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="Order Details" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color={colors.danger} />
          <Typo size={16} style={{ marginTop: spacingY._15, textAlign: 'center' }}>{error}</Typo>
          <AppButton 
            label="Try Again" 
            onPress={fetchOrderDetails} 
            style={{ marginTop: spacingY._20 }}
          />
        </View>
      </ScreenComponent>
    );
  }

  if (!orderDetails) {
    return (
      <ScreenComponent style={styles.container}>
        <Header label="Order Details" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color={colors.danger} />
          <Typo size={16} style={{ marginTop: spacingY._15, textAlign: 'center' }}>Order not found.</Typo>
        </View>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.container}>
      <Header label="Order Details" onBack={() => navigation.goBack()} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacingX._20 }}
      >
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Typo size={18} style={{ fontWeight: '600' }}>Order Information</Typo>
          </View>
          
          <InfoRow label="Order ID" value={`#${orderDetails.orderId}`} />
          <InfoRow label="Date" value={new Date(orderDetails.orderDate).toLocaleString()} />
          <InfoRow label="Order Type" value={orderDetails.orderType} />
          <InfoRow label="Status" value={getOrderStatusText(orderDetails.status)} />
          <InfoRow label="Payment Method" value={getPaymentTypeText(orderDetails.paymentType)} />
          <InfoRow label="Total" value={`$${orderDetails.total.toFixed(2)}`} isLast />

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
        
        {/* Customer Info Card */}
        {orderDetails.client && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Typo size={18} style={{ fontWeight: '600' }}>Customer Information</Typo>
            </View>
            
            <InfoRow label="Name" value={orderDetails.client.name || 'N/A'} />
            <InfoRow label="Email" value={orderDetails.client.email || 'N/A'} />
            <InfoRow label="Phone" value={orderDetails.client.tel || 'N/A'} isLast />
          </View>
        )}
        
        {/* Delivery Address Card */}
        {orderDetails.deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Typo size={18} style={{ fontWeight: '600' }}>Delivery Address</Typo>
            </View>
            
            <Typo style={styles.addressText}>
              {orderDetails.deliveryAddress.street}, 
              {orderDetails.deliveryAddress.number && ` ${orderDetails.deliveryAddress.number},`} 
              {orderDetails.deliveryAddress.city && ` ${orderDetails.deliveryAddress.city},`} 
              {orderDetails.deliveryAddress.country && ` ${orderDetails.deliveryAddress.country}`}
            </Typo>
          </View>
        )}
        
        {/* Order Items Card */}
        {orderDetails.items && orderDetails.items.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Typo size={18} style={{ fontWeight: '600' }}>Order Items</Typo>
            </View>
            
            {orderDetails.items.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.itemRow, 
                  index === orderDetails.items.length - 1 && styles.lastItemRow
                ]}
              >
                <View style={styles.itemDetails}>
                  <Typo size={16} style={{ fontWeight: '500' }}>{item.name}</Typo>
                  <Typo size={14} style={{ color: colors.gray, marginTop: 4 }}>
                    {item.itemType === 'pack' ? 'Pack' : 'Product'} • Qty: {item.quantity}
                  </Typo>
                  
                  {/* Show pack contents if available */}
                  {item.itemType === 'pack' && item.packContents && item.packContents.length > 0 && (
                    <View style={styles.packContents}>
                      <Typo size={13} style={{ color: colors.darkGray, marginTop: 4, fontWeight: '500' }}>
                        Contents:
                      </Typo>
                      {item.packContents.map((content, i) => (
                        <Typo key={i} size={12} style={{ color: colors.darkGray, marginTop: 2 }}>
                          • {content}
                        </Typo>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenComponent>
  );
}

const InfoRow = ({ label, value, isLast = false }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
    <Typo size={14} style={{ color: colors.gray }}>{label}</Typo>
    <Typo size={14} style={{ fontWeight: '500' }}>{value}</Typo>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
    paddingBottom: spacingY._10,
    marginBottom: spacingY._10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacingY._8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  addressText: {
    paddingVertical: spacingY._8,
    color: colors.darkGray,
    lineHeight: 20,
  },
  itemRow: {
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighterGray,
  },
  lastItemRow: {
    borderBottomWidth: 0,
  },
  itemDetails: {
    flex: 1,
  },
  packContents: {
    marginTop: spacingY._8,
    paddingLeft: spacingX._5,
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

export default OrderDetailsScreen;