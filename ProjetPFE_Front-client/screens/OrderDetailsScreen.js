import React, { useState, useEffect } from 'react';
import { API_URL, getUploadUrl, getAssetUrl } from 'config/api';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import useAuth from 'auth/useAuth';
import InvoiceUtilityService from '../utils/InvoiceUtilityService';
import colors from 'config/colors';


const OrderDetailsScreen = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { orderId } = route.params;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/commandes/${orderId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrderDetails(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load order details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to handle invoice download
  const handleDownloadInvoice = () => {
    if (!orderId) {
      Alert.alert('Error', 'Cannot download invoice: Order ID not found');
      return;
    }
    
    // Use our reusable invoice utility service
    InvoiceUtilityService.downloadInvoice(orderId, setDownloadingInvoice);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Livree':
      case 'LivreeEtPaye':
        return '#00B37A'; // Green for delivered
      case 'Annulee':
        return '#FF3B30'; // Red for cancelled
      case 'EnCoursDeTraitement':
      case 'PayeEtEnCoursDeTraitement':
        return '#FF9500'; // Orange for processing
      case 'EnTransit':
        return '#007AFF'; // Blue for transit
      case 'EnCoursDeLivraison':
        return '#5856D6'; // Purple for out for delivery
      case 'EnRetour':
        return colors.primary; // Primary color for return
      default:
        return '#8E8E93'; // Gray for other statuses
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'Livree':
        return 'Delivered';
      case 'LivreeEtPaye':
        return 'Delivered & Paid';
      case 'Annulee':
        return 'Cancelled';
      case 'EnCoursDeTraitement':
        return 'Processing';
      case 'PayeEtEnCoursDeTraitement':
        return 'Paid & Processing';
      case 'EnTransit':
        return 'In Transit';
      case 'EnCoursDeLivraison':
        return 'Out for Delivery';
      case 'EnRetour':
        return 'Return in Progress';
      default:
        return status;
    }
  };

  const translatePaymentType = (paymentType) => {
    switch (paymentType) {
      case 'EnLigne':
        return 'Online Payment';
      case 'Livraison':
        return 'Cash on Delivery';
      default:
        return paymentType;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>ORDER DETAILS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrderDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>ORDER DETAILS</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="info-outline" size={60} color="#FF9500" />
          <Text style={styles.errorText}>No order details found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>ORDER DETAILS</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.orderSummary}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderId}>Order #{orderDetails.orderId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderDetails.status) }]}>
                <Text style={styles.statusText}>{translateStatus(orderDetails.status)}</Text>
              </View>
            </View>
            
            <Text style={styles.orderDate}>Placed on {formatDate(orderDetails.orderDate)}</Text>
            <Text style={styles.orderType}>{orderDetails.orderType} Order</Text>
            
            <View style={styles.paymentTypeContainer}>
              <Ionicons 
                name={orderDetails.paymentType === 'EnLigne' ? "card" : "cash"} 
                size={18} 
                color="#666666" 
              />
              <Text style={styles.paymentTypeText}>
                {translatePaymentType(orderDetails.paymentType)}
              </Text>
            </View>
            
            {/* Invoice Download Button */}
            <TouchableOpacity 
              style={styles.downloadInvoiceButton}
              onPress={handleDownloadInvoice}
              disabled={downloadingInvoice}
            >
              <View style={styles.downloadButtonContent}>
                <Feather name="download" size={16} color={colors.primary} />
                <Text style={styles.downloadButtonText}>
                  {downloadingInvoice ? "Downloading Invoice..." : "Download Invoice"}
                </Text>
                {downloadingInvoice && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {orderDetails.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                
                <View style={styles.itemTypeContainer}>
                  <MaterialIcons 
                    name={item.itemType === 'product' ? "shopping-bag" : "inventory"} 
                    size={16} 
                    color="#666666" 
                  />
                  <Text style={styles.itemType}>
                    {item.itemType === 'product' ? 'Product' : 'Pack'}
                  </Text>
                </View>
                
                {item.itemType === 'pack' && item.packContents && item.packContents.length > 0 && (
                  <View style={styles.packContents}>
                    <Text style={styles.packContentsTitle}>Pack Contents:</Text>
                    {item.packContents.map((content, idx) => (
                      <Text key={idx} style={styles.packContentItem}>• {content}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressIconContainer}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressStreet}>
                  {orderDetails.deliveryAddress.number} {orderDetails.deliveryAddress.street}
                </Text>
                <Text style={styles.addressCity}>
                  {orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.country}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.customerCard}>
              <View style={styles.customerInfo}>
                <Ionicons name="person" size={18} color="#666666" />
                <Text style={styles.customerText}>{orderDetails.client.name}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Ionicons name="mail" size={18} color="#666666" />
                <Text style={styles.customerText}>{orderDetails.client.email}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Ionicons name="call" size={18} color="#666666" />
                <Text style={styles.customerText}>{orderDetails.client.tel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>{orderDetails.total.toFixed(2)} TND</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => navigation.navigate('CreateComplaint', { orderId: orderDetails.orderId })}
            >
              <MaterialIcons name="feedback" size={20} color="white" />
              <Text style={styles.helpButtonText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  backBtn: {
    padding: 5,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderSummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    color: '#666666',
    marginBottom: 5,
  },
  orderType: {
    fontWeight: '500',
    marginBottom: 5,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  paymentTypeText: {
    marginLeft: 8,
    color: '#666666',
    fontSize: 14,
  },
  // Invoice download button styles
  downloadInvoiceButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  downloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  itemQuantity: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  itemType: {
    color: '#666666',
    marginLeft: 6,
    fontSize: 14,
  },
  packContents: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  packContentsTitle: {
    fontWeight: '500',
    marginBottom: 5,
  },
  packContentItem: {
    color: '#666666',
    marginLeft: 5,
    marginBottom: 3,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconContainer: {
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressStreet: {
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 5,
  },
  addressCity: {
    color: '#666666',
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerText: {
    marginLeft: 10,
    color: '#333333',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.orange,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 10,
  },
  totalLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  totalValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionButtonsContainer: {
    padding: 15,
    marginBottom: 30,
  },
  helpButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  }, 
  helpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default OrderDetailsScreen;